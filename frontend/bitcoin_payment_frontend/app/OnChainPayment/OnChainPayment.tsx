import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import CopyButton from "~/components/buttons/CopyButton";
import { useOrder } from "src/context/invoiceContext";
import { useNavigate } from "react-router";
import axiosInstance from "src/api/axios";
import BitcoinSummary from "~/BitcoinSummaryCard/BitcoinSummary";
import TimeoutDialog from "~/TimeoutDialog/TimeoutDialog";
import { useCountdown } from "src/hook/useCountdown";

export function OnChainPaymentView() {
  const { order, invoice, setInvoice, bitcoinPrice } = useOrder();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const maxAttempt = invoice?.paymentPreference.invoice_max_attempt;
  const [attempt, setAttempt] = useState(0);
  const { remaining, start, reset, isActive } = useCountdown({
    key: "onChainPaymentCountdown",
    onExpire: () => {
      setAttempt((prev) => prev + 1);
    },
  });
  useEffect(() => {
    if (attempt === maxAttempt) {
      console.log("Max attempts reached, opening timeout dialog");
      setOpen(true);
    } else {
      reset();
    }
  }, [attempt]);
  useEffect(() => {
    if (!isActive) {
      start();
    }
    if (!invoice) null;
  }, []);

  const get_total = () => {
    return (
      (invoice?.paymentAttempt.amount_sats ?? 0) +
      (invoice?.paymentAttempt.network_fee ?? 0)
    );
  };

  const onchain = {
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
    await axiosInstance.put(`/payment-attempts/`, {
      payment_attempt_code,
      payment_status_code,
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
              <span>{invoice?.paymentAttempt.payment_attempt_code}</span>
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
        <TimeoutDialog
          title="Quieres seguir intentando?"
          description="Puedes generar un nuevo código QR o dirección de pago."
          cancelText="Cancelar transacción"
          retryText="Seguir intentando"
          open={open}
          onCancel={() => setOpen(false)}
          onRetry={() => {
            axiosInstance
              .post("/payment-attempts", {
                order_id: invoice!.paymentAttempt.order_code,
                payment_method_id: 1,
                amount_sats: invoice!.paymentAttempt.amount_sats,
                network_fee: invoice!.paymentAttempt.network_fee,
                local_currency_id: 1,
              })
              .then((response) => {
                if (response.status === 201) {
                  setInvoice(response.data);
                }
              })
              .then(() => {
                reset();
                setAttempt(0);
                setOpen(false);
              });
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

            axiosInstance
              .get(
                `/payment-attempts/${
                  invoice!.paymentAttempt.payment_attempt_code
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
