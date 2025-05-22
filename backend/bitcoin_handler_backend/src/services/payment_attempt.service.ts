import prisma from "../prisma/client";

interface Create_new_payment_attempt_input {
  payment_method_id?: number;
  order_id?: number;
  network_fee?: number;
  layer_1_address?: string;
  invoice_address?: string;
  amount_sats?: number;
  metadata?: string;
}

export const create_new_payment_attempt_service = async (
  input: Create_new_payment_attempt_input
) => {
  if (!input.order_id) throw new Error("Missing order_id");

  const DEFAULT_PAYMENT_STATUS_ID = 1;
  const EXPIRED_PAYMENT_STATUS_ID = 4;
  const DEFAULT_PAYMENT_PREFERENCE_ID = 1;

  return await prisma.$transaction(async (tx: any) => {
    // Expira el último intento
    const lastPaymentAttempt = await tx.payment_attempt.findFirst({
      where: { order_id: input.order_id },
      orderBy: { created_at: "desc" },
      select: { payment_attempt_id: true },
    });

    if (lastPaymentAttempt) {
      await tx.payment_attempt.update({
        where: { payment_attempt_id: lastPaymentAttempt.payment_attempt_id },
        data: { payment_status_id: EXPIRED_PAYMENT_STATUS_ID },
      });
    }

    // Busca el wallet válido
    const order = await tx.order.findUnique({
      where: { order_id: input.order_id },
      select: {
        Customer: { select: { customer_wallet_address_id: true } },
      },
    });

    const wallet = await tx.customer_wallet_address.findFirst({
      where: {
        customer_wallet_address_id: order?.Customer?.customer_wallet_address_id,
        wallet_address_status_id: 1,
      },
      select: {
        customer_wallet_address_id: true,
        address: true,
      },
    });

    // Obtiene monto y moneda
    const amount_info = await tx.payment_request.findFirst({
      where: { order_id: input.order_id },
      select: {
        amount_fiat: true,
        Currency: {
          select: { name: true, code: true, symbol: true, country: true },
        },
      },
    });

    // Crea el nuevo intento
    const paymentAttempt = await tx.payment_attempt.create({
      data: {
        payment_method_id: input.payment_method_id,
        order_id: input.order_id,
        network_fee: input.network_fee,
        layer_1_address: input.layer_1_address,
        invoice_address: input.invoice_address,
        amount_sats: input.amount_sats,
        metadata: input.metadata,
        customer_wallet_address_id: wallet?.customer_wallet_address_id,
        payment_preference_id: DEFAULT_PAYMENT_PREFERENCE_ID,
        payment_status_id: DEFAULT_PAYMENT_STATUS_ID,
      },
    });

    const paymentPreference = await tx.payment_preference.findUnique({
      where: { payment_preference_id: DEFAULT_PAYMENT_PREFERENCE_ID },
      select: {
        invoice_life_time: true,
        invoice_max_attempt: true,
      },
    });

    return {
      paymentAttempt,
      paymentPreference,
      wallet_address: wallet?.address,
      amount_info,
    };
  });
};

interface Update_payment_attempt_status_input {
  payment_attempt_id: number;
  payment_status_id: number;
}

enum Status {
  Pending = 1,
  Processing = 2,
  Completed = 3,
  Expired = 4,
}

// Transiciones válidas por tipo de método de pago
const allowedTransitionsByMethod: Record<number, Record<Status, Status[]>> = {
  1: {
    // Método 1: puede saltar a Completed
    [Status.Pending]: [Status.Processing, Status.Expired],
    [Status.Processing]: [Status.Completed],
    [Status.Completed]: [],
    [Status.Expired]: [],
  },
  2: {
    // Método 2: debe pasar por Processing antes de Completed
    [Status.Pending]: [Status.Completed, Status.Expired],
    [Status.Processing]: [],
    [Status.Completed]: [],
    [Status.Expired]: [],
  },
};

function isValidTransitionByMethod(
  currentStatus: Status,
  nextStatus: Status,
  paymentMethodId: number
): boolean {
  const methodRules = allowedTransitionsByMethod[paymentMethodId];
  if (!methodRules) return false; // Método no reconocido
  return methodRules[currentStatus]?.includes(nextStatus);
}

export const update_payment_attempt_status = async (
  input: Update_payment_attempt_status_input
) => {
  const { payment_attempt_id, payment_status_id } = input;

  return await prisma.$transaction(async (tx) => {
    const currentPaymentAttempt = await tx.payment_attempt.findUnique({
      where: { payment_attempt_id },
      select: {
        payment_status_id: true,
        payment_method_id: true,
        order_id: true,
      },
    });

    if (!currentPaymentAttempt) {
      throw new Error("Payment attempt not found");
    }

    const isValid = isValidTransitionByMethod(
      currentPaymentAttempt.payment_status_id!!,
      payment_status_id,
      currentPaymentAttempt.payment_method_id!!
    );

    if (!isValid) {
      throw new Error(
        `Invalid status transition from ${currentPaymentAttempt.payment_status_id} to ${payment_status_id}`
      );
    }

    await tx.payment_attempt.update({
      where: { payment_attempt_id },
      data: { payment_status_id, updated_at: new Date() },
    });

    await tx.order.update({
      where: { order_id: currentPaymentAttempt.order_id!! },
      data: { updated_at: new Date() },
    });

    const paymentRequest = await tx.payment_request.findFirst({
      where: { order_id: currentPaymentAttempt.order_id!! },
      select: { payment_request_id: true },
    });

    if (paymentRequest) {
      await tx.payment_request.update({
        where: { payment_request_id: paymentRequest.payment_request_id },
        data: { payment_status_id, updated_at: new Date() },
      });
    }

    return { message: "Estado actualizado correctamente" };
  });
};

interface Get_payment_attempt_by_id_input {
  payment_attempt_id: any;
}
export const get_payment_attempt_by_id = async (
  input: Get_payment_attempt_by_id_input
) => {
  const { payment_attempt_id } = input;

  return prisma.$transaction(async (tx) => {
    //get order by payment_attempt_id
    const paymentAttempt = await tx.payment_attempt.findUnique({
      where: { payment_attempt_id },
      select: {
        payment_attempt_id: true,
        order_id: true,
        payment_method_id: true,
        network_fee: true,
        layer_1_address: true,
        invoice_address: true,
        amount_sats: true,
        metadata: true,
        created_at: true,
        updated_at: true,
        Customer_wallet_address: {
          select: {
            customer_wallet_address_id: true,
            address: true,
          },
        },
        Payment_method: {
          select: {
            payment_method_id: true,
            name: true,
          },
        },
        Order: {
          select: {
            order_id: true,
            customer_id: true,
            order_status_id: true,
          },
        },
        Payment_request: {
          select: {
            payment_request_id: true,
            payment_status_id: true,
            amount_fiat: true,
            Currency: {
              select: {
                name: true,
                code: true,
                symbol: true,
                country: true,
              },
            },
          },
        },
      },
    });
  });
};
