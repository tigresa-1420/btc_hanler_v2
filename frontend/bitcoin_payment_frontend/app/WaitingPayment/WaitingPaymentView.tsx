import { Card, CardContent } from "../components/ui/card";
import { CircleCheck, Clock } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { useOrder } from "src/context/InvoiceContext";
import axiosInstance from "src/api/axios";
import React from "react";
import ClipboardButton from "~/components/buttons/ClipboardButton";

export default function BitcoinPaymentWaiting() {
  const { invoice, setInvoice } = useOrder();
  React.useEffect(() => {
    if (!invoice) return;

    axiosInstance
      .get("/payment-attempts/" + invoice.paymentAttempt.payment_attempt_id)
      .then((response) => {
        if (response.status === 200) {
          setInvoice(response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching invoice:", error);
      });
  }, [invoice?.paymentAttempt.payment_attempt_id]); // depende de que esté disponible

  const info = {
    id: invoice?.paymentAttempt.payment_attempt_id,
    network: "Bitcoin OnChain",
    address: invoice?.wallet_address,
    amountBTC: invoice?.paymentAttempt.amount_sats,
    feeBTC: invoice?.paymentAttempt.network_fee,
    totalBTC:
      invoice?.paymentAttempt.amount_sats! +
      invoice?.paymentAttempt.network_fee! +
      " BTC",
    totalUSD:
      invoice?.amount_info.Currency.symbol + invoice?.amount_info.amount_fiat!,
    date: invoice?.paymentAttempt.created_at,
    sats:
      invoice?.paymentAttempt.amount_sats! +
      invoice?.paymentAttempt.network_fee! +
      "Sats",
    txid: invoice?.paymentAttempt.layer_1_address,
  };
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-white text-black rounded-2xl max-w-3xl w-full shadow-lg">
        <div className="">
          <Card className="bg-gray-100 p-6">
            <CardContent className="p-0">
              <div className="flex flex-col items-center text-center">
                {invoice?.paymentAttempt.payment_status_id == 2 ? (
                  <div className="flex items-center gap-2 text-2xl font-semibold">
                    <Clock className="w-6 h-6" />
                    Procesando transacción
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-2xl font-semibold">
                    <CircleCheck className="w-5 h-5" />
                    Transacción procesada
                  </div>
                )}
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

            <Button
              variant="outline"
              size="sm"
              color="green"
              className="mt-4"
              onClick={async () => {
                await axiosInstance.put("/payment-attempts", {
                  payment_attempt_id:
                    invoice?.paymentAttempt.payment_attempt_id,
                  payment_status_id: 3, // Cambiar a "pagado"
                });

                await axiosInstance.put("/orders", {
                  order_id: invoice?.paymentAttempt.order_id,
                  succeeded_payment_id:
                    invoice?.paymentAttempt.payment_attempt_id,
                });
              }}
            >
              Procesar pago
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
