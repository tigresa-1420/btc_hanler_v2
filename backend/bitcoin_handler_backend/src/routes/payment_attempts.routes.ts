import { Router } from "express";
import {
  create_lightning_payment_attempt,
  update_payment_attempt_status_controller,
  get_payment_attempt_by_id_controller,
} from "../controllers/payment_attempts.controller";
import { build_payment_attempt_schema, build_payment_attempt_update_schema } from "../schema/payment_attempt_schema";
import { validate } from "../middleware/validate";
import prisma from "../prisma/client";

const router = Router();

router.post(
  "/",
  validate(build_payment_attempt_schema(prisma)),
  create_lightning_payment_attempt
);
router.put("/", validate(build_payment_attempt_update_schema(prisma)), update_payment_attempt_status_controller);
router.get("/:payment_attempt_code", get_payment_attempt_by_id_controller);
export default router;
