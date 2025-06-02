import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "../components/ui/button";

import CopyButton from "~/components/buttons/CopyButton";
import BitcoinSummary from "~/BitcoinSummaryCard/BitcoinSummary";
import TimeoutDialog from "~/TimeoutDialog/TimeoutDialog";
import { useCountdown } from "src/hook/useCountdown";
import { useOrder } from "src/context/InvoiceContext";
import axiosInstance from "src/api/axios";
import { Navigate } from "react-router";

interface LightningInvoiceData {
  network: string;
  usd: string;
  btc: string;
  fee: string;
  total: string;
  note: string;
  sats: string;
  address: string;
}

interface OnChainPaymentViewProps {
  timer: {
    remaining: number;
    start: () => void;
    reset: () => void;
    isActive: boolean;
  };
  globalTimer: number;
}
export function LightningPaymentView({
  timer,
  globalTimer,
}: OnChainPaymentViewProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { invoice, order, setInvoice } = useOrder();

  const { remaining, start, reset, isActive } = useCountdown({
    key: "lightningPaymentCountdown",
    duration: invoice?.paymentPreference.invoice_life_time || 300, // Default 5 minutes
    onExpire: () => setOpen(true),
  });

  console.log("ligh", timer.remaining);
  // Memoized function to create invoice
  const createLightningInvoice = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Try to expire previous invoice (optional)
      try {
        await axiosInstance.put("/payment-attempts", {
          payment_attempt_code: invoice?.paymentAttempt.payment_attempt_code,
          payment_status_code: "PS-E",
        });
      } catch (error) {
        console.warn("Could not expire previous invoice", error);
      }

      // 2. Create new invoice
      const response = await axiosInstance.post("/payment-attempts", {
        order_code: order,
        payment_request_code: invoice?.paymentAttempt.payment_attempt_code,
        payment_method_code: "PM-L",
        local_currency_code: "USD",
        amount_sats: invoice?.paymentAttempt.amount_sats,
        network_fee: invoice?.paymentAttempt.network_fee,
      });

      if (response.status === 201) {
        setInvoice(response.data);
        if (!open && !isActive) {
          start();
        }
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error creating lightning invoice:", error);
      setError("Failed to create payment invoice");
    } finally {
      setIsLoading(false);
    }
  }, [invoice, order, open, isActive, start, setInvoice]);

  // Initialize invoice on mount
  useEffect(() => {
    createLightningInvoice();
  }, []);

  const ref = useRef(null);

  // Efecto para desmontaje
  useEffect(() => {
    return () => {
      console.log("LightningPaymentView desmontado");
      // Aquí puedes limpiar recursos
    };
  }, []);

  // Efecto para visibilidad
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          console.log("El componente dejó de ser visible");
          // Pausar temporizadores, etc.
        } else {
          console.log("El componente es visible nuevamente");
          // Reanudar temporizadores, etc.
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);
  // Format remaining time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Lightning invoice data
  const lightning: LightningInvoiceData = {
    network: "Bitcoin Lightning",
    usd: `$2`,
    btc: `${invoice?.paymentAttempt.amount_sats || 0} BTC`,
    fee: invoice?.paymentAttempt.network_fee
      ? `${invoice.paymentAttempt.network_fee} BTC`
      : "Sin tarifa",
    total: `${
      (invoice?.paymentAttempt.amount_sats || 0) +
      (invoice?.paymentAttempt.network_fee || 0)
    } BTC`,
    note: `Expira en ${formatTime(remaining)}`,
    sats: `${invoice?.paymentAttempt.amount_sats || 0} Sats`,
    address: invoice?.wallet_address || "Lnbc2m1pnrjd6e...",
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-gray-100 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Transaction details */}
          <div className="flex-1 text-sm space-y-2">
            <h3 className="text-center font-medium mb-2">
              Detalles de la transacción
            </h3>
            {Object.entries(lightning).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span>
                  {key.charAt(0).toUpperCase() +
                    key.slice(1).replace(/_/g, " ")}
                </span>
                <span>{value}</span>
              </div>
            ))}
            <hr className="my-4 border-t border-gray-900" />
            <BitcoinSummary />
          </div>

          {/* QR and address */}
          <div className="flex-1">
            <h3 className="text-center font-medium mb-2">
              Escanea el QR o copia la dirección
            </h3>

            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${lightning.address}`}
              alt="QR Code"
              className="w-60 h-60 mx-auto my-2"
            />

            <div className="mb-4">
              <p className="text-center text-sm text-gray-900 mt-2">
                {lightning.note}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                readOnly
                title={lightning.address}
                value={lightning.address}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
              <CopyButton textToCopy={lightning.address} />
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
          }}
          onRetry={() => {
            setOpen(false);
            createLightningInvoice();
          }}
        >
          <span className="text-red-500 font-semibold">
            Recuerda que el tiempo de espera es de{" "}
            {invoice?.paymentPreference.invoice_life_time} segundos.
          </span>
        </TimeoutDialog>
      </div>
    </div>
  );
}
