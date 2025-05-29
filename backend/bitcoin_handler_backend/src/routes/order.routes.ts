import { Router } from "express";
import {
  create_order,
  update_expire_order,
  update_order_and_payment_status,
} from "../controllers/order.controller";

const router = Router();

router.post("/", create_order);
router.put("/", update_order_and_payment_status);
router.patch("/", update_expire_order);

export default router;
