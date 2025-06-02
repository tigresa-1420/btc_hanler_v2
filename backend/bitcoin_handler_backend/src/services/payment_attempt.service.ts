import prisma from "../prisma/client";
import { get_id_by_code } from "../hook/get_id_by_code";
import { generate_unique_code } from "../hook/generate_unique_code";
interface Create_new_payment_attempt_input {
  payment_method_code: string;
  order_code: string;
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

  if (!input.payment_method_code) throw new Error("Missing method code");

  return await prisma.$transaction(async (tx: any) => {
    //get order_id by order_code
    const order_id = await get_id_by_code({
      tx,
      model: "order",
      codeField: "order_code",
      codeValue: input.order_code,
      idField: "order_id",
    });
    // Busca el wallet válido

    const order = await tx.order.findUnique({
      where: { order_id: order_id },
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
      where: { order_id: order_id },
      select: {
        amount_fiat: true,
        Currencies: {
          select: {
            name: true,
            currency_code: true,
            symbol: true,
            country: true,
          },
        },
      },
    });

    //get payment_method_id by payment_method_code
    const payment_method_id = await get_id_by_code({
      tx,
      model: "payment_method",
      codeField: "payment_method_code",
      codeValue: input.payment_method_code,
      idField: "payment_method_id",
    });
    //create the payment_attempt_code
    const payment_attempt_code = await generate_unique_code({
      model: "payment_attempt",
      field: "payment_attempt_code",
    });

    // Crea el intento
    const paymentAttempt = await tx.payment_attempt.create({
      data: {
        payment_method_id: payment_method_id,
        order_id: order_id,
        network_fee: input.network_fee,
        layer_1_address: input.layer_1_address,
        invoice_address: input.invoice_address,
        amount_sats: input.amount_sats,
        metadata: input.metadata,
        customer_wallet_address_id: wallet?.customer_wallet_address_id,
        payment_attempt_code: payment_attempt_code,
      },
    });

    const paymentPreference = await tx.payment_preference.findUnique({
      where: { payment_preference_id: 1 },
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
  payment_attempt_code: string;
  payment_status_code: string;
}

enum Status {
  Pending = 1, // Pending
  Processing = 2, // Processing
  Completed = 3, // Completed
  Expired = 4, // Expired
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
        payment_status_id: true,
        payment_method_id: true,
        order_id: true,
      },
    });

    if (!currentPaymentAttempt) {
      throw new Error("Payment attempt not found");
    }

    //get payment_status_id by payment_status_code
    const payment_status_id = await get_id_by_code({
      tx,
      model: "payment_status",
      codeField: "payment_status_code",
      codeValue: payment_status_code,
      idField: "payment_status_id",
    });

    const isValid = isValidTransition(
      currentPaymentAttempt.payment_status_id as Status,
      payment_status_id as Status
    );

    if (!isValid) {
      console.log(
        currentPaymentAttempt.payment_status_id as Status,
        payment_status_id as Status
      );
      throw new Error(
        `Invalid status transition from ${payment_status_id} to ${payment_status_code}`
      );
    }

    await tx.payment_attempt.update({
      where: { payment_attempt_code },
      data: { payment_status_id, updated_at: new Date() },
    });

    await tx.order.update({
      where: { order_id: currentPaymentAttempt.order_id! },
      data: { updated_at: new Date() },
    });

    const paymentRequest = await tx.payment_request.findFirst({
      where: { order_id: currentPaymentAttempt.order_id! },
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
  payment_attempt_code: string;
}

export const get_payment_attempt_by_id = async (
  input: Get_payment_attempt_by_id_input
) => {
  const { payment_attempt_code } = input;

  return await prisma.$transaction(async (tx) => {
    //get payment_attempt_id by payment_attempt_code
    const payment_attempt_id = await get_id_by_code({
      tx,
      model: "payment_attempt",
      codeField: "payment_attempt_code",
      codeValue: payment_attempt_code,
      idField: "payment_attempt_id",
    });

    const paymentAttempt = await tx.payment_attempt.findUnique({
      where: { payment_attempt_id },
      select: {
        payment_attempt_id: true,
        payment_status_id: true,
        payment_method_code: true,
        order_id: true,
        network_fee: true,
        layer_1_address: true,
        invoice_address: true,
        amount_sats: true,
        metadata: true,
        blocks_confirmed: true,
        customer_wallet_address_id: true,
        payment_preference_id: true,
        created_at: true,
        updated_at: true,
        confirmed_at: true,
      },
    });

    if (!paymentAttempt) return null;

    const paymentPreference = await tx.payment_preference.findUnique({
      where: {
        payment_preference_id: paymentAttempt.payment_preference_id!,
      },
      select: {
        invoice_life_time: true,
        invoice_max_attempt: true,
      },
    });

    const customerWalletAddress = await tx.customer_wallet_address.findUnique({
      where: {
        customer_wallet_address_id: paymentAttempt.customer_wallet_address_id!,
      },
      select: {
        address: true,
      },
    });
    const payment_request = await tx.payment_request.findFirst({
      where: { order_id: paymentAttempt.order_id! },
      select: {
        amount_fiat: true,
        Currencies: {
          select: {
            name: true,
            currency_code: true,
            symbol: true,
            country: true,
          },
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
