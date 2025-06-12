import { Router } from "express";
import {
  create_order,
  update_expire_order,
  update_order_and_payment_status,
} from "../controllers/order.controller";
import { build_order_schema, build_expired_order_schema } from "../schema/order_schema";
import { validate } from "../middleware/validate";
import prisma from "../prisma/client";

const router = Router();

router.post("/", validate(build_order_schema(prisma)), create_order);
router.put("/", update_order_and_payment_status);
router.patch("/", validate(build_expired_order_schema(prisma)), update_expire_order);

export default router;
