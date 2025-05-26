import React, { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { Link } from "react-router";
import CopyButton from "~/components/buttons/CopyButton";
import { useOrder } from "src/context/invoiceContext";
import { useNavigate } from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import axiosInstance from "src/api/axios";
import axios from "axios";
import { json } from "stream/consumers";

export function OnChainPaymentView() {
  const [btcPrice, setBtcPrice] = useState([]);
 
  const { reset, order, invoice, setInvoice } = useOrder();
  const navigate = useNavigate();

  const [timer, setTimer] = useState(
    invoice!.paymentPreference.invoice_life_time - 291
  );
  const [open, setIsOpen] = useState(false);
  const [maxAttempt, setMaxAttempt] = useState(
    invoice?.paymentPreference.invoice_max_attempt
  );

  // Simulate a countdown timer
  React.useEffect(() => {
    console.log(invoice);
    const interval = setInterval(() => {
      setTimer((prev: any) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        if (prev === "as") {
          console.log("Time is up!");
          //expired
          handle_update_status(
            invoice!.paymentAttempt.payment_attempt_id,
            4 // Assuming 3 is the ID for "expired" status
          ).then(() => {
            setIsOpen(true);
          });
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  function satsToBtc(sats: number): string {
    return (sats / 100000).toFixed(8);
  }
  const handle_get_total = (sats: number, fee: number) => {
    const total = sats + fee;
    return total;
  };
  const onchain = {
    network: "Bitcoin OnChain",
    currency:
      invoice?.amount_info.Currency.symbol + invoice?.amount_info.amount_fiat!,
    btc: satsToBtc(invoice?.paymentAttempt.amount_sats!!) + " BTC",
    fee: satsToBtc(invoice!!.paymentAttempt.network_fee) + " BTC",
    total:
      handle_get_total(
        invoice!!.paymentAttempt.amount_sats,
        invoice!!.paymentAttempt.network_fee
      ) + " BTC",
    note: "Puede tardar 10 a 60 min en ser confirmado",
    timer: "Expira en " + timer + " segundos",
    attempt: 0 + "/" + maxAttempt,
    address: invoice!.wallet_address,
    currency_code: invoice!.amount_info.Currency.code,
    sats: invoice!.paymentAttempt.amount_sats + " Sats",
  };

  const handle_update_status = async (
    payment_attempt_id: number,
    payment_status_id: number
  ) => {
    await axiosInstance.put(`/payment-attempts/`, {
      payment_attempt_id,
      payment_status_id,
    });
  };

  return (
    <div className="">
      <div className="bg-gray-100 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-20">
          {/* QR and address */}
          <div className="flex-1">
            <h3 className="text-center font-medium mb-2">
              Escanea el QR o copia la dirección
            </h3>
            <img
              src="https://pngimg.com/uploads/qr_code/qr_code_PNG10.png"
              alt="QR"
              className="w-60 h-60 mx-auto my-4"
            />
            <div className="mb-4 ">
              <p className="text-center text-sm text-gray-900 mt-2 whitespace-pre-line">
                {onchain.timer}
              </p>
              <p className="text-center text-sm text-gray-900 mt-2 whitespace-pre-line">
                Intentos {onchain.attempt}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                title={onchain.address}
                readOnly
                value={onchain.address}
                className="w-full max-w-xs px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
              <CopyButton textToCopy={onchain.address} />
            </div>
          </div>

          {/* Transaction details */}
          <div className="flex-1 text-sm space-y-2">
            <h3 className="text-center font-medium mb-2">
              Detalles de la transacción
            </h3>
            <div className="flex justify-between">
              <span>ID</span>
              <span>{invoice?.paymentAttempt.payment_attempt_id}</span>
            </div>
            <div className="flex justify-between">
              <span>Red</span>
              <span>{onchain.network}</span>
            </div>
            <div className="flex justify-between">
              <span>Total en {onchain.currency_code}</span>
              <span>{onchain.currency}</span>
            </div>
            <div className="flex justify-between">
              <span>Total en Bitcoin</span>
              <span>{onchain.btc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs">Total en Sats</span>
              <span className="text-xs">{onchain.sats}</span>
            </div>
            <div className="flex justify-between">
              <span>Tarifa de red</span>
              <span>{onchain.fee}</span>
            </div>
            <div className="flex justify-between font-semibold  pt-2">
              <span>Total</span>
              <span>{onchain.total}</span>
            </div>
            <hr className="my-4 border-t border-gray-900" />

            <p className="text-center text-xs text-gray-600 mt-2 whitespace-pre-line">
              {onchain.note}
            </p>
            <BitcoinSummary />
          </div>
        </div>
        <AlertDialog open={open}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tiempo de espera agotado!</AlertDialogTitle>
              <AlertDialogDescription>
                Puedes generar un nuevo código QR o dirección de pago.
                <br />
                <span className="text-red-500 font-semibold">
                  Recuerda que el tiempo de espera es de 300 segundos.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Link to={"/"}>
                <AlertDialogCancel
                  onClick={() => {
                    setIsOpen(false);
                  }}
                >
                  Cancel transacción
                </AlertDialogCancel>
              </Link>
              <AlertDialogAction
                onClick={() => {
                  axiosInstance
                    .post("/payment-attempts", {
                      order_id: invoice!.paymentAttempt.order_id,
                      payment_method_id: 1,
                      amount_sats: invoice!.paymentAttempt.amount_sats,
                      network_fee: invoice!.paymentAttempt.network_fee,
                      local_currency_id: 1,
                    })
                    .then((response) => {
                      if (response.status === 201) {
                        setInvoice(response.data);
                        setTimer(
                          response.data.paymentPreference.invoice_life_time -
                            290
                        );
                      }
                    })
                    .then(() => {
                      setIsOpen(false);
                    });
                }}
              >
                Generar nueva invoice
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          variant="outline"
          size="sm"
          color="green"
          className="mt-4"
          onClick={async () => {
            await handle_update_status(
              invoice!.paymentAttempt.payment_attempt_id,
              2 // Assuming 2 is the ID for "in progress" status
            );

            axiosInstance
              .get(
                `/payment-attempts/${
                  invoice!.paymentAttempt.payment_attempt_id
                }`
              )
              .then((res) => {
                setInvoice(res.data);
                navigate("/btc/waiting_payment");
              });
          }}
        >
          Empezar verificación de pago
        </Button>
      </div>
    </div>
  );
}

function BitcoinSummary() {
  return (
    <div className="bg-gray-100  w-full max-w-2xl p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              Bitcoin <span className=" text-sm">(BTC)</span>
            </h2>
            <p className="text-3xl font-bold">
              $109,444.42{" "}
              <span className="text-green-400 text-lg ml-2">+2.04%</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
          <div className="space-y-1">
            <p className="text-gray-900">Market Cap</p>
            <p className=" text-gray-900 font-semibold">$2,174.68B</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-900">Volume (24h)</p>
            <p className="text-gray-900 font-semibold">$46.71B</p>
          </div>
          <div className="space-y-1 col-span-2">
            <p className="text-gray-900">BTC/USDT</p>
            <p className="text-gray-900 font-semibold">
              $109,363.63 <span className="text-green-400 ml-2">+1.93%</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
