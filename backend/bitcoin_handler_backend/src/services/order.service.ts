import prisma from "../prisma/client";

interface Create_order_and_payment_input {
  customer_id: number;
  external_ref?: string;
  amount_fiat?: number;
  local_currency_id?: number;
  user_transaction_ref?: string;
}

export const create_order_with_payment_request = async (
  input: Create_order_and_payment_input
) => {
  const DEFAULT_ORDER_STATUS_ID = 1;
  const DEFAULT_PAYMENT_STATUS_ID = 1;

  if (!input.customer_id) throw new Error("Missing customer_id");
  if (!input.amount_fiat || !input.local_currency_id)
    throw new Error("Missing payment amount or currency");

  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        order_status_id: DEFAULT_ORDER_STATUS_ID,
        customer_id: input.customer_id,
        external_ref: input.external_ref,
      },
    });

    const paymentRequest = await tx.payment_request.create({
      data: {
        order_id: order.order_id,
        payment_status_id: DEFAULT_PAYMENT_STATUS_ID,
        amount_fiat: input.amount_fiat,
        local_currency_id: input.local_currency_id,
        user_transaction_ref: input.user_transaction_ref,
      },
    });

    return {
      created_order: order,
      created_payment_request: paymentRequest,
    };
  });
};

interface update_order_payment_flow_input {
  order_id: number;
  succeeded_payment_id: number;
}

export const update_confirmed_order_payment_flow_by_id = async (
  input: update_order_payment_flow_input
) => {
  const { order_id, succeeded_payment_id } = input;

  return await prisma.$transaction(async (tx) => {
    //update order_status_id

    await tx.order.update({
      where: { order_id },
      data: { order_status_id: 3 },
    });

    //update payment_request
    await tx.payment_request.updateMany({
      where: { order_id },
      data: {
        payment_status_id: 3,
        succeeded_payment_id,
        updated_at: new Date(),
      },
    });

    await tx.payment_attempt.updateMany({
      where: { order_id },
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
  