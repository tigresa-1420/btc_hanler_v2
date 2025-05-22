import express from "express";

import orderRoutes from "./routes/order.routes";
import paymentAttemptRoutes from "./routes/payment_attempts.routes";
import cors from "cors";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.use("/api/orders", orderRoutes);

app.use("/api/payment-attempts", paymentAttemptRoutes);

//helloworld
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
