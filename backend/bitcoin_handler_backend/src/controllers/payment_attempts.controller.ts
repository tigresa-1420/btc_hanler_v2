import { Request, Response } from "express";
import {
  create_new_payment_attempt_service,
  update_payment_attempt_status,
  get_payment_attempt_by_id,
} from "../services/payment_attempt.service";
import { encrypt } from "../util/useEncryption";

export const create_lightning_payment_attempt = async (
  req: Request,
  res: Response
) => {
  try {
    const new_order = await create_new_payment_attempt_service(req.body);
    const encrypted_response = encrypt(JSON.stringify(new_order));
    res.status(201).json(encrypted_response);
  } catch (error) {
    console.error("Error al crear orden:", error);
    const encrypted_error = encrypt(JSON.stringify({
      message: "Error al crear la orden con su Payment_request"
    }));
    res.status(500).json(encrypted_error);
  }
};

export const update_payment_attempt_status_controller = async (
  req: Request,
  res: Response
) => {
  try {
    const updated_payment_attempt = await update_payment_attempt_status(
      req.body
    );
    const encrypted_response = encrypt(JSON.stringify(updated_payment_attempt));
    res.status(201).json(encrypted_response);
  } catch (error) {
    console.error("Error al crear orden:", error);
    const encrypted_error = encrypt(JSON.stringify({
      message: "Error al crear la orden con su Payment_request"
    }));
    res.status(500).json(encrypted_error);
  }
};

export const get_payment_attempt_by_id_controller = async (
  req: Request,
  res: Response
) => {
  try {
    const payment_attempt = await get_payment_attempt_by_id({
      payment_attempt_code: req.params.payment_attempt_code,
    });

    res.status(200).json(payment_attempt);
  } catch (error) {
    console.error("Error al obtener el intento de pago:", error);
    res.status(500).json({ message: "Error al obtener el intento de pago" });
  }
};
