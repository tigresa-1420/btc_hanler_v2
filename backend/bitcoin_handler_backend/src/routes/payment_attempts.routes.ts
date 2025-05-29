import { Router } from "express";
import {
  create_lightning_payment_attempt,
  update_payment_attempt_status_controller,
  get_payment_attempt_by_id_controller,
} from "../controllers/payment_attempts.controller";

const router = Router();

router.post("/", create_lightning_payment_attempt);
router.put("/", update_payment_attempt_status_controller);
router.get("/:payment_attempt_code", get_payment_attempt_by_id_controller);
export default router;
