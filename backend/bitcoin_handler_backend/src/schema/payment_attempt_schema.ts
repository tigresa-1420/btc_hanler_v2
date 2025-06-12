// schemas/order.ts
import { z } from "zod";
import { get_id_by_code } from "../hook/get_id_by_code";
import { Prisma } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

export const build_payment_attempt_schema = (tx: TxClient) =>
  z.object({
    payment_method_code: z
      .string()
      .min(1, "Código de cliente es obligatorio")
      .refine(
        async (code) => {
          try {
            await get_id_by_code({
              tx,
              model: "payment_method",
              codeField: "payment_method_code",
              codeValue: code,
              idField: "payment_method_id",
            });
            return true;
          } catch {
            return false;
          }
        },
        {
          message: "El método de pago con ese código no existe",
        }
      ),
    order_code: z
      .string()
      .min(1, "Código de cliente es obligatorio")
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
    amount_sats: z.number().positive("La cantidad de los sats es obligatoria"),
    network_fee: z.number().positive("La network fee es obligatoria").optional(),
    payment_request_code: z.string().min(1, "El código de request_code es invalido").refine(
      async (code) => {
        try {
          await get_id_by_code({
            tx,
            model: "payment_request",
            codeField: "payment_request_code",
            codeValue: code,
            idField: "payment_request_id",
          });
          return true;
        } catch {
          return false;
        }
      },
      {
        message: "El payment_request con ese código no existe",
      }
    )
  });

export const build_payment_attempt_update_schema = (tx: TxClient) =>
  z.object({
    payment_attempt_code: z
      .string()
      .min(1, "Código de cliente es obligatorio")
      .refine(
        async (code) => {
          try {
            await get_id_by_code({
              tx,
              model: "payment_attempt",
              codeField: "payment_attempt_code",
              codeValue: code,
              idField: "payment_attempt_id",
            });
            return true;
          } catch {
            return false;
          }
        },
        {
          message: "El método de pago con ese código no existe",
        }
      ),
    payment_status_code: z
      .string()
      .min(1, "Código de cliente es obligatorio")
      .refine(
        async (code) => {
          try {
            await get_id_by_code({
              tx,
              model: "payment_status",
              codeField: "payment_status_code",
              codeValue: code,
              idField: "payment_status_id",
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
