import React, { use, useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { Link, redirect, useFetcher } from "react-router";
import CopyButton from "~/components/buttons/CopyButton";
import BitcoinSummary from "~/BitcoinSummaryCard/BitcoinSummary";
import TimeoutDialog from "~/TimeoutDialog/TimeoutDialog";
import { useCountdown } from "src/hook/useCountdown";
export function LightningPaymentView() {
  const [open, setOpen] = useState(false);

  const { remaining, start, reset, isActive } = useCountdown({
    key: "lightningPaymentCountdown",
    duration: 10,
    onExpire: () => setOpen(true),
  });
  // Simulate a countdown timer

  useEffect(() => {
    if (!open && !isActive) {
      start();
    }
  }, []);
  const lightning = {
    network: "Bitcoin Lightning",
    usd: "$29.99",
    btc: "0.00032 BTC",
    fee: "Sin tarifa",
    total: "0.00034 BTC",
    note: "Expira en " + remaining,
    sats: "0.0000031 Sats",
    address:
      "Lnbc2m1pnrjd6epp5xg37tadmcc479dt8c3rqk9mu4p08y8a5uvdd4repy4r8zzs40y4qdqqcqzzsxqrrs0fppqhsrcf2xszcp9nu4xgxzjwx6m3qnvlvrtsp5nft6epu8wxaxytyadq95ygyqvewuhuqh4zw6wevwvufxjr0zc0qq9qyyssqtafnv4cz4uuccg8xfw0ec2lgmr9u23rg85ac86zdnkn4mkq93krn283prlthqky5ujpv8x4cecs4634uu4gcw4f57l3haur8vg6myggp7z6erh",
  };

  return (
    <div>
      <div className="bg-gray-100 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Transaction details */}
          <div className="flex-1 text-sm space-y-2">
            <h3 className="text-center font-medium mb-2">
              Detalles de la transacción
            </h3>
            <div className="flex justify-between">
              <span>Red</span>
              <span>{lightning.network}</span>
            </div>
            <div className="flex justify-between">
              <span>Total en USD</span>
              <span>{lightning.usd}</span>
            </div>
            <div className="flex justify-between">
              <span>Total en Bitcoin</span>
              <span>{lightning.btc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs">Total en Sats</span>
              <span className="text-xs">{lightning.sats}</span>
            </div>
            <div className="flex justify-between">
              <span>Tarifa de red</span>
              <span>{lightning.fee}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2">
              <span>Total</span>
              <span>{lightning.total}</span>
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
              src="https://pngimg.com/uploads/qr_code/qr_code_PNG10.png"
              alt="QR"
              className="w-60 h-60 mx-auto my-2"
            />
            <div className="mb-4 ">
              <p className="text-center text-sm text-gray-900 mt-2 whitespace-pre-line">
                {lightning.note}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                title={lightning.address}
                value={lightning.address}
                className="w-full max-w-xs px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
              <CopyButton textToCopy={lightning.address} />
            </div>
          </div>
        </div>
        <TimeoutDialog
          title="Tiempo de espera agotado!"
          description="Puedes generar un nuevo código QR o dirección de pago."
          children={
            <span className="text-red-500 font-semibold">
              Recuerda que el tiempo de espera es de 300 segundos.
            </span>
          }
          cancelText="Cancelar transacción"
          retryText="Generar nueva invoice"
          open={open}
          onCancel={() => setOpen(false)}
          onRetry={() => {
            setOpen(false);
            reset();
          }}
        />
        <Link to="/btc/succeed_payment">
          <Button variant="outline" size="sm" color="green" className="mt-4">
            Procesar pago
          </Button>
        </Link>
      </div>
    </div>
  );
}
