import { Router } from "express";
import {
  create_order,
  update_order_and_payment_status,
} from "../controllers/order.controller";

const router = Router();

router.post("/", create_order);
router.put("/", update_order_and_payment_status);


export default router;
