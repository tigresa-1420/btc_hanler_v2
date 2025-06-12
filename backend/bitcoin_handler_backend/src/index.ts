import express from "express";
import { Request, Response } from 'express';

import orderRoutes from "./routes/order.routes";
import paymentAttemptRoutes from "./routes/payment_attempts.routes";
import cors from "cors";
import { error_handler } from "./middleware/error_handler";
import axios from "axios";
import WebSocket from "ws";
import http from "http";
import { useDynamicMempoolPoller } from "./hook/use_dynamic_mempool_poller";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(error_handler);

app.use("/api/orders", orderRoutes);
app.use("/api/payment-attempts", paymentAttemptRoutes);

//helloworld
app.get("/", (req, res) => {
  res.send("Hello World!");
});



app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


// Crear servidor HTTP
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
let sockets: WebSocket[] = [];

wss.on("connection", (ws) => {
  sockets.push(ws);
  ws.on("close", () => {
    sockets = sockets.filter((s) => s !== ws);
  });
});

function notifyClients(data: any) {
  sockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
}

useDynamicMempoolPoller()