import prisma from "../prisma/client";

interface Create_new_payment_attempt_input {
  payment_method_code?: string;
  order_code?: string;
  network_fee?: number;
  layer_1_address?: string;
  invoice_address?: string;
  amount_sats?: number;
  metadata?: string;
}

export const create_new_payment_attempt_service = async (
  input: Create_new_payment_attempt_input
) => {
  if (!input.order_code) throw new Error("Missing order_id");

  const DEFAULT_PAYMENT_STATUS_ID = "PS-P"; // Pending
  const EXPIRED_PAYMENT_STATUS_ID = "PS-E"; // Expired
  const DEFAULT_PAYMENT_PREFERENCE_ID = "PP-D"; // Default payment preference
  if (!input.payment_method_code) {
    return await prisma.$transaction(async (tx: any) => {
      // Busca el wallet válido
      const order = await tx.order.findUnique({
        where: { order_id: input.order_code },
        select: {
          Customer: { select: { customer_wallet_address_id: true } },
        },
      });

      const wallet = await tx.customer_wallet_address.findFirst({
        where: {
          customer_wallet_address_id:
            order?.Customer?.customer_wallet_address_id,
          wallet_address_status_id: 1,
        },
        select: {
          customer_wallet_address_id: true,
          address: true,
        },
      });

      // Obtiene monto y moneda
      const amount_info = await tx.payment_request.findFirst({
        where: { order_id: input.order_code },
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
          payment_method_id: input.payment_method_code,
          order_id: input.order_code,
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
  }
};

interface Update_payment_attempt_status_input {
  payment_attempt_code: string;
  payment_status_code: string;
}

enum Status {
  Pending = "PS-P", // Pending
  Processing = "PS-PR", // Processing
  Completed = "PS-C", // Completed
  Expired = "PS-E", // Expired
}

// Transiciones válidas por tipo de método de pago
const allowedTransitions: Record<Status, Status[]> = {
  [Status.Pending]: [Status.Processing, Status.Expired],
  [Status.Processing]: [Status.Completed],
  [Status.Completed]: [],
  [Status.Expired]: [],
};

function isValidTransition(currentStatus: Status, nextStatus: Status): boolean {
  return allowedTransitions[currentStatus]?.includes(nextStatus) ?? false;
}

export const update_payment_attempt_status = async (
  input: Update_payment_attempt_status_input
) => {
  const { payment_attempt_code, payment_status_code } = input;

  return await prisma.$transaction(async (tx) => {
    const currentPaymentAttempt = await tx.payment_attempt.findUnique({
      where: { payment_attempt_code },
      select: {
        payment_status_code: true,
        payment_method_code: true,
        order_code: true,
      },
    });

    if (!currentPaymentAttempt) {
      throw new Error("Payment attempt not found");
    }

    const isValid = isValidTransition(
      currentPaymentAttempt.payment_status_code as Status,
      payment_status_code as Status
    );

    if (!isValid) {
      throw new Error(
        `Invalid status transition from ${currentPaymentAttempt.payment_status_code} to ${payment_status_code}`
      );
    }

    await tx.payment_attempt.update({
      where: { payment_attempt_code },
      data: { payment_status_code, updated_at: new Date() },
    });

    await tx.order.update({
      where: { order_code: currentPaymentAttempt.order_code! },
      data: { updated_at: new Date() },
    });

    const paymentRequest = await tx.payment_request.findFirst({
      where: { order_code: currentPaymentAttempt.order_code! },
      select: { payment_request_id: true },
    });

    if (paymentRequest) {
      await tx.payment_request.update({
        where: { payment_request_id: paymentRequest.payment_request_id },
        data: { payment_status_code, updated_at: new Date() },
      });
    }

    return { message: "Estado actualizado correctamente" };
  });
};

interface Get_payment_attempt_by_id_input {
  payment_attempt_id: number;
}

export const get_payment_attempt_by_id = async (
  input: Get_payment_attempt_by_id_input
) => {
  const { payment_attempt_id } = input;

  return await prisma.$transaction(async (tx) => {
    const paymentAttempt = await tx.payment_attempt.findUnique({
      where: { payment_attempt_id },
      select: {
        payment_attempt_id: true,
        payment_status_code: true,
        payment_method_code: true,
        order_code: true,
        network_fee: true,
        layer_1_address: true,
        invoice_address: true,
        amount_sats: true,
        metadata: true,
        blocks_confirmed: true,
        customer_wallet_address_code: true,
        payment_preference_code: true,
        created_at: true,
        updated_at: true,
        confirmed_at: true,
      },
    });

    if (!paymentAttempt) return null;

    const paymentPreference = await tx.payment_preference.findUnique({
      where: {
        payment_preference_code: paymentAttempt.payment_preference_code!,
      },
      select: {
        invoice_life_time: true,
        invoice_max_attempt: true,
      },
    });

    const customerWalletAddress = await tx.customer_wallet_address.findUnique({
      where: {
        customer_wallet_address_code:
          paymentAttempt.customer_wallet_address_code!,
      },
      select: {
        address: true,
      },
    });
    const payment_request = await tx.payment_request.findFirst({
      where: { order_code: paymentAttempt.order_code! },
      select: {
        amount_fiat: true,
        Currencies: {
          select: { name: true, code: true, symbol: true, country: true },
        },
      },
    });

    return {
      paymentAttempt,
      paymentPreference: paymentPreference,
      wallet_address: customerWalletAddress?.address,
      amount_info: payment_request,
    };
  });
};
