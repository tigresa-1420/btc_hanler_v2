import prisma from "../prisma/client";
import { generate_unique_code } from "../hook/generate_unique_code";
import { get_id_by_code } from "../hook/get_id_by_code";

interface Create_order_and_payment_input {
  customer_code: string;
  external_ref: string;
  amount_fiat: number;
  local_currency_code: string;
}

export const create_order_with_payment_request = async (
  input: Create_order_and_payment_input
) => {
  if (!input.customer_code) throw new Error("Missing customer code");
  if (!input.amount_fiat || !input.local_currency_code)
    throw new Error("Missing payment amount or currency");

  return await prisma.$transaction(async (tx) => {
    const customer_id = await get_id_by_code({
      tx,
      model: "customer",
      codeField: "customer_code",
      codeValue: input.customer_code,
      idField: "customer_id",
    });

    const currency_id = await get_id_by_code({
      tx,
      model: "currencies",
      codeField: "currency_code",
      codeValue: input.local_currency_code,
      idField: "currency_id",
    });

    const new_order_code = await generate_unique_code({
      model: "order",
      field: "order_code",
    });

    const order = await tx.order.create({
      data: {
        customer_id: customer_id,
        external_ref: input.external_ref,
        order_code: new_order_code,
      },
    });

    const new_payment_request_code = await generate_unique_code({
      model: "payment_request",
      field: "payment_request_code",
    });
    const paymentRequest = await tx.payment_request.create({
      data: {
        order_id: order.order_id,
        amount_fiat: input.amount_fiat,
        local_currency_id: currency_id,
        payment_request_code: new_payment_request_code,
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
  const DEFAULT_ORDER_COMPLETED_STATUS_ID = 3;
  const DEFAULT_PAYMENT_COMPLETED_STATUS_ID = 3;
  return await prisma.$transaction(async (tx) => {
    //get payment attempt by code
    const payment_attempt_id = await get_id_by_code({
      tx,
      model: "payment_attempt",
      codeField: "payment_attempt_code",
      codeValue: input.succeeded_payment_code,
      idField: "payment_attempt_id",
    });

    const order_id = await get_id_by_code({
      tx,
      model: "order",
      codeField: "order_code",
      codeValue: order_code,
      idField: "order_id",
    });

    await tx.order.update({
      where: { order_code },
      data: { order_status_id: DEFAULT_ORDER_COMPLETED_STATUS_ID },
    });

    //update payment_request
    await tx.payment_request.updateMany({
      where: { order_id },
      data: {
        payment_request_id: DEFAULT_PAYMENT_COMPLETED_STATUS_ID,
        succeeded_payment_id: payment_attempt_id,
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

interface update_expire_order__input {
  order_code: string;
}
export const update_expire_order_service = async (
  input: update_expire_order__input
) => {
  const { order_code } = input;

  return await prisma.$transaction(async (tx) => {
    //get order_id by order_code
    const order_id = await get_id_by_code({
      tx,
      model: "order",
      codeField: "order_code",
      codeValue: order_code,
      idField: "order_id",
    });

    //expire order
    await tx.order.update({
      where: { order_id },
      data: { order_status_id: 4 },
    });
    //expire payment_request
    await tx.payment_request.updateMany({
      where: { order_id },
      data: { payment_status_id: 4 },
    });

    //expire all attempts
    await tx.payment_attempt.updateMany({
      where: {
        order_id: order_id,
      },
      data: {
        payment_status_id: 4,
      },
    });

    return { message: "order expired " };
  });
};
