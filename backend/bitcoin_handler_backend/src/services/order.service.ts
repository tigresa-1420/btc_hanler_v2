import prisma from "../prisma/client";

interface Create_order_and_payment_input {
  customer_code: string;
  external_ref?: string;
  amount_fiat?: number;
  local_currency_code?: string;
}

export const create_order_with_payment_request = async (
  input: Create_order_and_payment_input
) => {
  const DEFAULT_ORDER_STATUS_ID = "OS-P";
  const DEFAULT_PAYMENT_STATUS_ID = "PS-P";

  if (!input.customer_code) throw new Error("Missing customer code");
  if (!input.amount_fiat || !input.local_currency_code)
    throw new Error("Missing payment amount or currency");

  return await prisma.$transaction(async (tx) => {
    console.log("Creating order and payment request with input:", input);
    const order = await tx.order.create({
      data: {
        order_status_code: DEFAULT_ORDER_STATUS_ID,
        customer_code: input.customer_code,
        external_ref: input.external_ref,
        order_code: `order-${Date.now()}`, // Generate a unique order code
      },
    });

    const paymentRequest = await tx.payment_request.create({
      data: {
        order_code: order.order_code!,
        payment_status_code: DEFAULT_PAYMENT_STATUS_ID,
        amount_fiat: input.amount_fiat,
        local_currency_code: input.local_currency_code,
        payment_request_code: `payment-${Date.now()}`, // Generate a unique payment request code
      },
    });

    return {
      created_order: order,
      created_payment_request: paymentRequest,
    };
  });
};

interface update_order_payment_flow_input {
  order_code: string;
  succeeded_payment_code: string;
}

export const update_confirmed_order_payment_flow_by_id = async (
  input: update_order_payment_flow_input
) => {
  const { order_code, succeeded_payment_code } = input;
  const DEFAULT_ORDER_COMPLETED_STATUS_ID = "OS-C";
  const DEFAULT_PAYMENT_COMPLETED_STATUS_ID = "PS-C";
  return await prisma.$transaction(async (tx) => {
    //update order_status_id

    await tx.order.update({
      where: { order_code },
      data: { order_status_code: DEFAULT_ORDER_COMPLETED_STATUS_ID },
    });

    //update payment_request
    await tx.payment_request.updateMany({
      where: { order_code },
      data: {
        payment_status_code: DEFAULT_PAYMENT_COMPLETED_STATUS_ID,
        succeeded_payment_code,
        updated_at: new Date(),
      },
    });

    await tx.payment_attempt.updateMany({
      where: { order_code },
      data: {
        blocks_confirmed: 6,
        layer_1_address: "data:address",
        updated_at: new Date(),
        confirmed_at: new Date(),
      },
    });
    return { message: "Actualización completada exitosamente" };
  });
};
