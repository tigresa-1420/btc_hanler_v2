import { ZodSchema } from "zod";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { decrypt } from "../util/useEncryption";

export const validate = (
  schema: ZodSchema,
  source: "body" | "query" | "params" = "body"
): RequestHandler => {
  return async (req, res, next) => {
    var result

    if (req[source].data) {
      const decrypted_text = decrypt(req[source].data, req[source].iv);
      const decrypted_body = JSON.parse(decrypted_text);
      result = await schema.safeParseAsync(decrypted_body);
    } else {
      result = await schema.safeParseAsync(req[source]);
    }
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        type: e.path.join("."),
        message: e.message,
      }));

      res.status(400).json({
        message: "Datos inválidos",
        errors,
      });
      return;
    }

    req[source] = result.data;
    next();
  };
};
