import axios from "axios";
import prisma from "../prisma/client";

const memoryOrderPool: Record<string, { amount: any; createdAt: number; address: string }> = {};

interface Vout {
    value: number;
    scriptpubkey_address: string;
}

interface Tx {
    txid: string;
    status: {
        confirmed: boolean;
        block_time?: number;
    };
    vout: Vout[];
}

export const useDynamicMempoolPoller = (intervalMs = 10000) => {
    const cleanOldOrders = () => {
        const now = Date.now();
        const tenMinutesAgo = now - 10 * 60 * 1000;

        for (const payment_attempt_id in memoryOrderPool) {
            if (memoryOrderPool[payment_attempt_id].createdAt < tenMinutesAgo) {
                delete memoryOrderPool[payment_attempt_id];
                console.log(`Orden antigua removida del pool: ${payment_attempt_id}`);
            }
        }
    };

    setInterval(async () => {
        console.log("Polling mempool...");

        try {
            cleanOldOrders();

            await prisma.$transaction(async (tx) => {
                const tenMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

                const pendingOrders = await tx.order.findMany({
                    where: {
                        order_status_id: 1,
                        created_at: { gte: tenMinutesAgo },
                    },
                    include: {
                        Payment_request: {
                            where: { payment_status_id: 1 },
                            take: 1,
                        },
                        Payment_attempt: {
                            where: {
                                payment_method_id: 1,
                                payment_status_id: 1,
                            },
                            take: 1,
                        },
                    },
                });

                for (const order of pendingOrders) {
                    const attempt = order.Payment_attempt[0];
                    if (!attempt) continue;

                    const wallet = await tx.customer_wallet_address.findUnique({
                        where: {
                            customer_wallet_address_id: attempt.customer_wallet_address_id ?? -1,
                        },
                    });

                    if (!wallet || !wallet.address) continue;
                    console.log(order)
                    const orderIdStr = order.toString();
                    if (!memoryOrderPool[orderIdStr]) {
                        memoryOrderPool[orderIdStr] = {
                            address: wallet.address,
                            amount: attempt.amount_sats,
                            createdAt: new Date(attempt.created_at!).getTime(),
                        };
                        console.log(`Nueva orden agregada al pool: ${orderIdStr}`);
                    }
                }
            });

            const orderIds = Object.keys(memoryOrderPool);
            if (!orderIds.length) return;

            for (const orderId of orderIds) {
                const orderData = memoryOrderPool[orderId];

                try {
                    const clean_address = orderData.address.replace(/\s+/g, "");

                    const res = await axios.get<Tx[]>(
                        `https://mempool.space/testnet/api/address/${clean_address}/txs`
                    );


                    const txs = res.data;
                    for (const tx of txs) {
                        const isConfirmed = tx.status.confirmed;

                        for (const vout of tx.vout) {
                            const paidAmount = vout.value / 1e8;
                            const addr = vout.scriptpubkey_address;
                            if (addr !== orderData.address) continue;

                            const txTime = (tx.status.block_time ?? Date.now() / 1000) * 1000;

                            if (txTime >= orderData.createdAt) {
                                const newStatus = isConfirmed ? 3 : 2;

                                await prisma.order.update({
                                    where: { order_id: parseInt(orderId) },
                                    data: { order_status_id: newStatus },
                                });

                                if (isConfirmed) {
                                    delete memoryOrderPool[orderId];
                                    console.log(`Orden completada y removida del pool: ${orderId}`);
                                } else {
                                    console.log(`Orden ${orderId} actualizada a ${newStatus}`);
                                }
                            }
                        }
                    }
                } catch (err: any) {
                    console.error(`Error consultando mempool para orden ${orderId}:`, err.message);
                }
            }
        } catch (err: any) {
            console.error("Error en el mempool poller:", err.message);
        }
    }, intervalMs);
};
