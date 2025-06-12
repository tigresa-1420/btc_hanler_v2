import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "../components/ui/button";
import { formatTime } from "src/hook/useFormarTime";
import CopyButton from "~/components/buttons/CopyButton";
import BitcoinSummary from "~/BitcoinSummaryCard/BitcoinSummary";
import TimeoutDialog from "~/TimeoutDialog/TimeoutDialog";
import { useCountdown } from "src/hook/useCountdown";
import { useOrder } from "src/context/InvoiceContext";
import { _post, _put } from "src/api/axios";
import { Skeleton } from "~/components/ui/skeleton";
import { useNavigate } from "react-router";

export function LightningPaymentView() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewReady, setIsViewReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { order, attempts, setActiveMethod, activeMethod, updatePayment } =
    useOrder();
  const invoice = attempts.lightning;
  const navigate = useNavigate();
  //set the active method
  useEffect(() => {
    setActiveMethod("lightning");
  }, []);
  const lightningTimer = useCountdown({
    duration: invoice?.paymentPreference.invoice_life_time,
  });

  //start the counter once view is ready

  useEffect(() => {
    console.log("cheking");
    if (isViewReady) {
      console.log("starting");
      lightningTimer.start();
    }
  }, [isLoading]);

  //show counter

  useEffect(() => {
    if (lightningTimer.remaining <= 0) {
      setOpen(true);
    }
  }, [lightningTimer.remaining]);

  const isCreatingRef = useRef(false);

  const createLightningInvoice = useCallback(async () => {
    if (isCreatingRef.current) return;
    isCreatingRef.current = true;

    setIsLoading(true);
    setIsViewReady(false);
    setError(null);

    const existingLightning = attempts.lightning;

    const previous_attempt_code =
      existingLightning?.paymentAttempt.payment_attempt_code;

    try {
      // Crea nuevo intento inmediatamente
      function safeParseFloat(value: unknown, fallback: number): number {
        const num = parseFloat(String(value));
        return isNaN(num) ? fallback : num;
      }

      const amount_sats = safeParseFloat(
        existingLightning?.paymentAttempt.amount_sats,
        1000
      );
      const network_fee = safeParseFloat(
        existingLightning?.paymentAttempt.network_fee,
        10
      );

      const response = await _post("/payment-attempts", {
        order_code: order?.order_code,
        payment_request_code: order?.payment_request_code,
        payment_method_code: "PM-L",
        local_currency_code: "USD",
        amount_sats: amount_sats,
        network_fee: network_fee,
      });

      if (response!.status === 201) {
        updatePayment(response!.data, "lightning");
      } else {
        throw new Error(`Unexpected status: ${response!.status}`);
      }

      // Intenta expirar el anterior de forma asíncrona,
      if (previous_attempt_code) {
        _put("/payment-attempts", {
          payment_attempt_code: previous_attempt_code,
          payment_status_code: "PS-E",
        }).catch((error) => {
          console.warn(
            "No se pudo expirar el intento anterior de Lightning:",
            error
          );
        });
      }
    } catch (error) {
      console.error("Error al crear el invoice Lightning:", error);
      setError("No se pudo generar el invoice de Lightning");
    } finally {
      setIsLoading(false);
      setIsViewReady(true);
      isCreatingRef.current = false;
    }
  }, [attempts, order, updatePayment]);

  // Initialize invoice on mount
  useEffect(() => {
    createLightningInvoice();
  }, []);

  //show counter
  useEffect(() => {
    console.log();
  }, []);

  const get_total = () => {
    return (
      (invoice?.paymentAttempt.amount_sats ?? 0) +
      (invoice?.paymentAttempt.network_fee ?? 0)
    );
  };
  // Lightning invoice data
  const lightningData = {
    ID: invoice?.paymentAttempt.payment_attempt_code,
    network: "Bitcoin Lightning",
    currency:
      invoice?.amount_info.Currencies.symbol +
      invoice?.amount_info.amount_fiat!,
    btc: invoice?.paymentAttempt.amount_sats + " BTC",
    fee: "Sin cargo de uso",
    total: get_total() + " BTC",
    currency_code: invoice?.amount_info.Currencies.currency_code,
    sats: invoice?.paymentAttempt.amount_sats + " Sats",
    invoice_address: invoice?.paymentAttempt.invoice_address,
  };

  return (
    <>
      {!invoice || isLoading ? (
        <LightningSkeleton />
      ) : (
        <div className="container mx-auto p-4">
          <div className="bg-gray-100 rounded-xl p-6">
            <div className="flex flex-col md:flex-row gap-6">
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
                  <span>{lightningData.network}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total en {lightningData.currency_code}</span>
                  <span>{lightningData.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total en Bitcoin</span>
                  <span>{lightningData.btc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs">Total en Sats</span>
                  <span className="text-xs">{lightningData.sats}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tarifa de red</span>
                  <span>{lightningData.fee}</span>
                </div>
                <div className="flex justify-between font-semibold  pt-2">
                  <span>Total</span>
                  <span>{lightningData.total}</span>
                </div>
                <hr className="my-4 border-t border-gray-900" />

                <BitcoinSummary />
              </div>

              {/* QR and address */}
              <div className="flex-1">
                <h3 className="text-center font-medium mb-2">
                  Escanea el QR o copia la dirección
                </h3>

                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${lightningData.invoice_address}`}
                  alt="QR Code"
                  className="w-60 h-60 mx-auto my-2"
                />
                <div className="mb-4">
                  <p className="text-center text-sm text-gray-900 mt-2">
                    Expira en: {formatTime(lightningTimer.remaining)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    title={lightningData.invoice_address as string}
                    value={lightningData.invoice_address as string}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                  />
                  <CopyButton textToCopy={lightningData.invoice_address} />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => createLightningInvoice()}
                disabled={isLoading}
              >
                {isLoading ? "Generando..." : "Generar nueva factura"}
              </Button>
            </div>

            <TimeoutDialog
              title="Tiempo de espera agotado!"
              description="Puedes generar un nuevo código QR o dirección de pago."
              cancelText="Cancelar transacción"
              retryText="Generar nueva invoice"
              open={open}
              onCancel={() => {
                setOpen(false);
                navigate("/");
              }}
              onRetry={() => {
                setOpen(false);
                createLightningInvoice();
              }}
            >
              <span className="text-red-500 font-semibold">
                Recuerda que el tiempo de espera es de{" "}
                {formatTime(invoice?.paymentPreference.invoice_life_time)}.
              </span>
            </TimeoutDialog>
          </div>
        </div>
      )}
    </>
  );
}

function LightningSkeleton() {
  return (
    <div className="container mx-auto p-4">
      <div className="bg-gray-100 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Transaction details skeleton */}
          <div className="flex-1 text-sm space-y-2">
            <Skeleton className="bg-primary/20 dark:bg-primary/30 h-4 w-1/2 mx-auto mb-2" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="bg-primary/20 dark:bg-primary/30 h-4 w-1/3" />
                <Skeleton className="bg-primary/20 dark:bg-primary/30 h-4 w-1/4" />
              </div>
            ))}
            <Skeleton className="h-4 w-2/3 mx-auto my-4" />
            <Skeleton className="h-4 w-full" />
          </div>

          {/* QR and address skeleton */}
          <div className="flex-1 space-y-4">
            <Skeleton className="bg-primary/20 dark:bg-primary/30 h-4 w-1/2 mx-auto mb-2" />
            <Skeleton className="bg-primary/20 dark:bg-primary/30 w-60 h-60 mx-auto rounded-md" />
            <Skeleton className="bg-primary/20 dark:bg-primary/30 h-4 w-2/3 mx-auto" />
            <div className="flex items-center gap-2">
              <Skeleton className="bg-primary/20 dark:bg-primary/30 h-8 w-full rounded-md" />
              <Skeleton className="bg-primary/20 dark:bg-primary/30 h-8 w-8 rounded-md" />
            </div>
          </div>
        </div>

        {/* Button skeleton */}
        <div className="mt-6 flex justify-between">
          <Skeleton className="bg-primary/20 dark:bg-primary/30 h-8 w-48 rounded-md" />
        </div>
      </div>
    </div>
  );
}
