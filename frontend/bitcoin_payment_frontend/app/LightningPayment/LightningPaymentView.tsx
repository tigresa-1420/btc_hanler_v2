import React, { useRef, useState } from "react";
import { Button } from "../components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Link, redirect } from "react-router";
import CopyButton from "~/components/buttons/CopyButton";
export function LightningPaymentView() {
  const [timer, setTimer] = useState(300);

  const [open, setIsOpen] = useState(false);

  
  // Simulate a countdown timer
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        if (prev === 1) {
          setIsOpen(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  const lightning = {
    network: "Bitcoin Lightning",
    usd: "$29.99",
    btc: "0.00032 BTC",
    fee: "Sin tarifa",
    total: "0.00034 BTC",
    note: "Expira en " + timer,
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
                  setIsOpen(false);
                  setTimer(300);
                }}
              >
                Generar nueva invoice
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Link to="/btc/succeed_payment">
          <Button variant="outline" size="sm" color="green" className="mt-4">
            Procesar pago
          </Button>
        </Link>
      </div>
    </div>
  );
}
