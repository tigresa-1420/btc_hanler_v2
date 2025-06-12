// schemas/order.ts
import { z } from "zod";
import { get_id_by_code } from "../hook/get_id_by_code";
import { Prisma } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

export const build_order_schema = (tx: TxClient) =>
  z.object({
    customer_code: z
      .string()
      .min(1, "Código de cliente es obligatorio")
      .refine(
        async (code) => {
          try {
            await get_id_by_code({
              tx,
              model: "customer",
              codeField: "customer_code",
              codeValue: code,
              idField: "customer_id",
            });
            return true;
          } catch {
            return false;
          }
        },
        {
          message: "El cliente con ese código no existe",
        }
      ),
    external_ref: z.string().min(1, "external_ref es obligatorio"),
    amount_fiat: z.number().positive("El valor es inválido"),
    local_currency_code: z.string().min(1, "Código de divisa inválido"),
  });


export const build_expired_order_schema = (tx: TxClient) =>
  z.object({
    order_code: z
      .string()
      .min(1, "Código del pedido es obligatorio")
      .refine(
        async (code) => {
          try {
            await get_id_by_code({
              tx,
              model: "order",
              codeField: "order_code",
              codeValue: code,
              idField: "order_id",
            });
            return true;
          } catch {
            return false;
          }
        },
        {
          message: "El pedido con ese código no existe",
        }
      ),

  });
