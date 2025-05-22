import React from "react";
import { Card, CardContent } from "../components/ui/card";
import { Clock } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

import ClipboardButton from "~/components/buttons/ClipboardButton";
const info = {
  id: "asdfghjkl",
  network: "OnChain",
  address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  amountBTC: "0.0032",
  feeBTC: "0.0001",
  totalBTC: "0.0033",
  totalUSD: "$0.10",
  date: "2023-10-01 12:00:00",
  sats: "0.0000031 Sats",
};
export default function BitcoinPaymentWaiting() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-white text-black rounded-2xl max-w-3xl w-full shadow-lg">
        <div className="">
          <Card className="bg-gray-100 p-6">
            <CardContent className="p-0">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-2 text-2xl font-semibold">
                  <Clock className="w-6 h-6" />
                  Procesando transacción
                </div>
                <p className="text-sm text-gray-600 mt-1 mb-4">
                  Puede entre
                  <span className="font-medium">10 a 60 minutos</span>
                </p>
                <hr className="border-t border-gray-900 w-1/2 mb-4" />

                <div className="text-sm space-y-2 text-left w-full max-w-md">
                  <div className="flex justify-between">
                    <span>ID</span>
                    <span>{info.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Red</span>
                    <span>{info.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dirección de destino</span>
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[150px] text-right">
                        {info.address}
                      </span>
                      <ClipboardButton textToCopy={info.address} />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Total en Bitcoin</span>
                    <span>{info.amountBTC}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs">Total en Sats</span>
                    <span className="text-xs">{info.sats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tarifa de red</span>
                    <span>{info.feeBTC}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{info.totalBTC}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total en USD</span>
                    <span>{info.totalUSD}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha</span>
                    <span>{info.date}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <Link to="/btc/succeed_payment">
              <Button
                variant="outline"
                size="sm"
                color="green"
                className="mt-4"
              >
                Procesar pago
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
