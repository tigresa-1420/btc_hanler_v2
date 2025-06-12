import axios from "axios";
import prisma from "../prisma/client";

const memoryOrderPool: Record<string, { amount: any; createdAt: number; address: string, order_id: number, attempt_id: number }> = {};

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

export const useDynamicMempoolPoller = (intervalMs = 8000) => {
    const cleanOldOrders = () => {
        const now = Date.now();
        const tenMinutesAgo = now - 10 * 60 * 1000;
        var i = 0
        for (const payment_attempt_id in memoryOrderPool) {
            i = i + 1
            if (memoryOrderPool[payment_attempt_id].createdAt < tenMinutesAgo) {
                delete memoryOrderPool[payment_attempt_id];
                console.log(`Orden antigua removida del pool: ${payment_attempt_id}`);
            }
        }
        console.log(i)
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
                        // created_at: { gte: tenMinutesAgo },
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

                console.log(pendingOrders)

                for (const order of pendingOrders) {
                    // Verificar que existan payment attempts
                    if (!order.Payment_attempt?.length) {
                        console.log(`Order ${order.order_id} no tiene payment attempts`);
                        continue;
                    }

                    // Tomar el primer attempt (podrías iterar si hay múltiples)
                    const attempt = order.Payment_attempt[0];

                    // Validar que tenga wallet address id
                    if (!attempt?.customer_wallet_address_id) {
                        console.log(`Attempt ${attempt.payment_attempt_id} no tiene wallet address asociada`);
                        continue;
                    }

                    // Obtener wallet
                    const wallet = await tx.customer_wallet_address.findUnique({
                        where: {
                            customer_wallet_address_id: attempt.customer_wallet_address_id,
                        },
                        select: {
                            address: true,
                            customer_wallet_address_id: true
                        }
                    });

                    // Validar wallet y dirección
                    if (!wallet?.address) {
                        console.log(`Wallet ${attempt.customer_wallet_address_id} no encontrada o sin address`);
                        continue;
                    }

                    // Usar order_id como clave (mejor que toString())
                    const orderKey = `${order.order_id}`;

                    // Validar amount_sats
                    const amountSats = attempt.amount_sats;
                    if (amountSats!.lessThanOrEqualTo(0)) {
                        console.log(`Order ${order.order_id} tiene amount_sats inválido: ${amountSats}`);
                        continue;
                    }

                    // Validar fecha
                    const createdAt = attempt.created_at ? new Date(attempt.created_at).getTime() : Date.now();

                    if (!memoryOrderPool[orderKey]) {
                        memoryOrderPool[orderKey] = {
                            address: wallet.address,
                            amount: amountSats,
                            createdAt,
                            order_id: order.order_id, // Guardar referencia útil
                            attempt_id: attempt.payment_attempt_id
                        };
                        console.log(`Nueva orden agregada al pool: ${orderKey}`);
                    }
                }
            });

            const orderIds = Object.keys(memoryOrderPool);
            if (!orderIds.length) return;
            for (const orderId of orderIds) {
                const orderData = memoryOrderPool[orderId];
                try {
                    const res = await axios.get<Tx[]>(
                        `https://mempool.space/testnet/api/address/${orderData.address.replace(/\s+/g, "")}/txs`
                    );

                    const txs = res.data;

                    for (const tx of txs) {
                        const isConfirmed = tx.status.confirmed;

                        for (const vout of tx.vout) {
                            const paidAmount = vout.value / 1e8;
                            const addr = vout.scriptpubkey_address;
                            console.log(addr !== orderData.address)
                            if (addr !== orderData.address.replace(/\s+/g, "")) continue;
                            console.log("hi")
                            const txTime = (tx.status.block_time ?? Date.now() / 1000) * 1000;

                            if (txTime >= orderData.createdAt) {

                                const newStatus = isConfirmed ? 3 : 2;
                                console.log(orderId)
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
