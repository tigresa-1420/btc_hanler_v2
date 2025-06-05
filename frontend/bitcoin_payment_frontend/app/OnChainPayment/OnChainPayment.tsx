import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import CopyButton from "~/components/buttons/CopyButton";
import { useOrder } from "src/context/InvoiceContext";
import { useNavigate } from "react-router";

import BitcoinSummary from "~/BitcoinSummaryCard/BitcoinSummary";
import TimeoutDialog from "~/TimeoutDialog/TimeoutDialog";
import { useCountdown } from "src/hook/useCountdown";
import { Skeleton } from "../components/ui/skeleton";
import { _get, _post, _put } from "src/api/axios";

export function OnChainPaymentView() {
  const { order, attempts, updatePayment, activeMethod, setActiveMethod } =
    useOrder();
  const invoice = attempts.onchain;

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const maxAttempt = invoice?.paymentPreference.invoice_max_attempt;
  const [attempt, setAttempt] = useState(0);

  const onchainTimer = useCountdown({
    duration: invoice?.paymentPreference.invoice_life_time,
  });

  //effect to create a payment attempt
  const hasCreatedAttempt = useRef(false);

  useEffect(() => {
    setActiveMethod("onchain");
    console.log("enter use effect");
    if (
      !hasCreatedAttempt.current &&
      order?.order_code &&
      order?.payment_request_code
    ) {
      hasCreatedAttempt.current = true;

      const handle_create_onchain_payment_attempt = async () => {
        if (invoice) return; //already created
        try {
          const response = await _post("/payment-attempts", {
            order_code: order.order_code,
            payment_request_code: order.payment_request_code,
            payment_method_code: "PM-O", // PM-O para onchain, PM-L para lightning
            amount_sats: 0.5,
            network_fee: 2.5,
          });

          updatePayment(response!.data, "onchain");
        } catch (err) {
          console.error("Error creando el intento de pago:", err);
        }
      };

      handle_create_onchain_payment_attempt();
    }
  }, [order?.order_code, order?.payment_request_code]);

  //effect to start counter on invoice callback
  // Efecto para iniciar el timer una vez que `invoice` está disponible
  useEffect(() => {
    if (invoice && invoice.paymentPreference.invoice_life_time) {
      onchainTimer.start();
      console.log(
        "⏱️ Timer started con duración:",
        invoice.paymentPreference.invoice_life_time
      );
    }
  }, [invoice]);

  //efecto para aumentar el intento

  useEffect(() => {
    console.log(onchainTimer.remaining);
    if (!onchainTimer.isActive && !open) {
      setAttempt((prev) => prev + 1);
      onchainTimer.reset();
      onchainTimer.start();
    }
  }, [onchainTimer.remaining]);

  // Efecto para manejar cuando se alcanza el máximo de intentos
  useEffect(() => {
    if (attempt >= maxAttempt!) {
      onchainTimer.reset();
      setOpen(true);
    }
  }, [attempt, maxAttempt]);

  const get_total = () => {
    return (
      (invoice?.paymentAttempt.amount_sats ?? 0) +
      (invoice?.paymentAttempt.network_fee ?? 0)
    );
  };

  const onchainData = {
    network: "Bitcoin OnChain",
    currency:
      invoice?.amount_info.Currencies.symbol +
      invoice?.amount_info.amount_fiat!,
    btc: invoice?.paymentAttempt.amount_sats + " BTC",
    fee: invoice?.paymentAttempt.network_fee + " BTC",
    total: get_total() + " BTC",
    note: "Puede tardar 10 a 60 min en ser confirmado",
    address: invoice?.wallet_address,
    currency_code: invoice?.amount_info.Currencies.currency_code,
    sats: invoice?.paymentAttempt.amount_sats + " Sats",
  };

  const handle_update_status = async (
    payment_attempt_code: string,
    payment_status_code: string
  ) => {
    await _put(`/payment-attempts/`, {
      payment_attempt_code,
      payment_status_code,
    });
  };

  return (
    <div>
      {!invoice ? (
        <TransactionViewSkeleton />
      ) : (
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
              <div className="flex items-center gap-2">
                <input
                  title={onchainData.address}
                  readOnly
                  value={onchainData.address}
                  className="w-full max-w-xs px-2 py-1 border border-gray-300 rounded-md text-sm"
                />
                <CopyButton textToCopy={onchainData.address} />
              </div>
            </div>

            {/* Transaction details */}
            <div className="flex-1 text-sm space-y-2">
              <h3 className="text-center font-medium mb-2">
                Detalles de la transacción
              </h3>
              <div className="flex justify-between">
                <span>ID</span>
                <span>{invoice?.paymentAttempt.payment_attempt_code}</span>
              </div>
              <div className="flex justify-between">
                <span>Red</span>
                <span>{onchainData.network}</span>
              </div>
              <div className="flex justify-between">
                <span>Total en {onchainData.currency_code}</span>
                <span>{onchainData.currency}</span>
              </div>
              <div className="flex justify-between">
                <span>Total en Bitcoin</span>
                <span>{onchainData.btc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs">Total en Sats</span>
                <span className="text-xs">{onchainData.sats}</span>
              </div>
              <div className="flex justify-between">
                <span>Tarifa de red</span>
                <span>{onchainData.fee}</span>
              </div>
              <div className="flex justify-between font-semibold  pt-2">
                <span>Total</span>
                <span>{onchainData.total}</span>
              </div>
              <hr className="my-4 border-t border-gray-900" />

              <p className="text-center text-xs text-gray-600 mt-2 whitespace-pre-line">
                {onchainData.note}
              </p>
              <BitcoinSummary />
            </div>
          </div>
          <TimeoutDialog
            title="Quieres seguir intentando?"
            description="Puedes generar un nuevo código QR o dirección de pago."
            cancelText="Cancelar transacción"
            retryText="Seguir intentando"
            open={open}
            onCancel={() => {
              setOpen(false);
              navigate("/");
            }}
            onRetry={() => {
              setAttempt(0);
              setOpen(false);
              onchainTimer.reset();
              onchainTimer.start();
            }}
          />

          <Button
            variant="outline"
            size="sm"
            color="green"
            className="mt-4"
            onClick={async () => {
              await handle_update_status(
                invoice!.paymentAttempt.payment_attempt_code,
                "PS-PR " // Assuming 2 is the ID for "in progress" status
              );

              _get(
                `/payment-attempts/${
                  invoice!.paymentAttempt.payment_attempt_code
                }`
              ).then((res) => {
                updatePayment(res!.data, "onchain");
                navigate("/btc/waiting_payment");
              });
            }}
          >
            Empezar verificación de pago
          </Button>
        </div>
      )}
    </div>
  );
}

function TransactionViewSkeleton() {
  return (
    <div className="bg-gray-100 rounded-xl p-6">
      <div className="flex flex-col md:flex-row gap-20">
        <div className="flex-1">
          <h3 className="text-center font-medium mb-2">
            Escanea el QR o copia la dirección
          </h3>
          <Skeleton className="bg-primary/20 dark:bg-primary/30 w-60 h-60 mx-auto my-4 rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="bg-primary/20 dark:bg-primary/30 w-full max-w-xs h-8 rounded-md" />
            <Skeleton className="bg-primary/20 dark:bg-primary/30 h-8 w-8 rounded-md" />
          </div>
        </div>

        <div className="flex-1 text-sm space-y-2">
          <h3 className="text-center font-medium mb-2">
            Detalles de la transacción
          </h3>
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="flex justify-between" key={i}>
              <Skeleton className="bg-primary/20 dark:bg-primary/30 w-24 h-4" />
              <Skeleton className="bg-primary/20 dark:bg-primary/30 w-24 h-4" />
            </div>
          ))}
          <div className="flex justify-between font-semibold pt-2">
            <Skeleton className="bg-primary/20 dark:bg-primary/30 w-20 h-4" />
            <Skeleton className="bg-primary/20 dark:bg-primary/30 w-20 h-4" />
          </div>
          <hr className="my-4 border-t border-gray-900" />
          <Skeleton className="bg-primary/20 dark:bg-primary/30 h-12 w-full" />
          <Skeleton className="bg-primary/20 dark:bg-primary/30 h-10 w-50" />
        </div>
      </div>
    </div>
  );
}
