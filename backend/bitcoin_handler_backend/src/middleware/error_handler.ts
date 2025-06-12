import { Request, Response, NextFunction } from "express";
import { Validation_error } from "../errors/validation_error";

export function error_handler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof Validation_error) {
    res.status(err.status).json({
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  res.status(500).json({ message: "Error interno del servidor" });
}
