import { Request, Response } from "express";
import {
  create_order_with_payment_request,
  update_confirmed_order_payment_flow_by_id,
  update_expire_order_service,
} from "../services/order.service";
import { decrypt, encrypt } from "../util/useEncryption";

export const create_order = async (req: Request, res: Response) => {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    console.log("IP del usuario:", ip);
    const new_order = await create_order_with_payment_request(req.body);

    //  Encriptar respuesta
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
export const update_order_and_payment_status = async (
  req: Request,
  res: Response
) => {
  try {
    const update_order = await update_confirmed_order_payment_flow_by_id(
      req.body
    );
    res.status(200).json(update_order);
  } catch (error) {
    console.error("Error al actualizar la orden:", error);
    res
      .status(500)
      .json({ message: "Error al crear la orden con su Payment_request" });
  }
};

export const update_expire_order = async (req: Request, res: Response) => {
  try {
    const update_order = await update_expire_order_service(req.body);
    //  Encriptar respuesta
    const encrypted_response = encrypt(JSON.stringify(update_order));
    res.status(200).json(encrypted_response);

  } catch (error) {
    console.error("Error al expirar la orden:", error);
    res
      .status(500)
      .json({ message: "Error al expirad la orden con su Payment_request" });
  }
};
