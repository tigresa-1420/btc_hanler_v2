import { Request, Response } from "express";
import {
  create_new_payment_attempt_service,
  update_payment_attempt_status,
  get_payment_attempt_by_id,
} from "../services/payment_attempt.service";

export const create_lightning_payment_attempt = async (
  req: Request,
  res: Response
) => {
  try {
    const new_order = await create_new_payment_attempt_service(req.body);
    res.status(201).json(new_order);
  } catch (error) {
    console.error("Error al crear orden:", error);
    res
      .status(500)
      .json({ message: "Error al crear la orden con su Payment_request" });
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
    res.status(200).json(updated_payment_attempt);
  } catch (error) {
    console.error("Error al actualizar el estado del intento de pago:", error);
    res.status(500).json({ message: "Error al actualizar el estado" });
  }
};

export const get_payment_attempt_by_id_controller = async (
  req: Request,
  res: Response
) => {
  try {
    const payment_attempt_id = Number(req.params.id);

    const payment_attempt = await get_payment_attempt_by_id({
      payment_attempt_id,
    });

    res.status(200).json(payment_attempt);
  } catch (error) {
    console.error("Error al obtener el intento de pago:", error);
    res.status(500).json({ message: "Error al obtener el intento de pago" });
  }
};
