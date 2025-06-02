import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { LightningPaymentView } from "../LightningPayment/LightningPaymentView";
import { OnChainPaymentView } from "../OnChainPayment/OnChainPayment";
import { CircleArrowLeft } from "lucide-react";
import { useCountdown } from "src/hook/useCountdown";
import { useOrder } from "src/context/InvoiceContext";

export default function PaymentViewSwitcher() {
  const [paymentView, setPaymentView] = useState<"onchain" | "lightning">(
    "onchain"
  );
  const { invoice } = useOrder();
  const timerDuration = invoice?.paymentPreference.invoice_life_time || 300; // Default 5 minutes

  // Contadores centralizados en el padre
  const onchainTimer = useCountdown({
    duration: timerDuration,
    key: "onchain",
    onExpire: () => console.log("OnChain timer expired"),
  });

  const lightningTimer = useCountdown({
    duration: timerDuration,
    key: "lightning",
    onExpire: () => console.log("Lightning timer expired"),
  });

  // Referencias para controlar los contadores desde los hijos
  const timerControls = {
    onchain: {
      remaining: onchainTimer.remaining,
      start: onchainTimer.start,
      reset: onchainTimer.reset,
      isActive: onchainTimer.isActive,
    },
    lightning: {
      remaining: lightningTimer.remaining,
      start: lightningTimer.start,
      reset: lightningTimer.reset,
      isActive: lightningTimer.isActive,
    },
  };

  // Iniciar ambos contadores al montar
  useEffect(() => {
    onchainTimer.start();
    lightningTimer.start();
  }, []);

  // Pausar el contador no visible cuando cambia la vista
  useEffect(() => {
    if (paymentView === "onchain") {
      lightningTimer.reset(); // Reinicia el lightning cuando no está visible
    } else {
      onchainTimer.reset(); // Reinicia el onchain cuando no está visible
    }
  }, [paymentView]);

  return (
    <div className="bg-gray-900 rounded-xl pt-6">
      <div className="flex flex-row items-center gap-4 p-6">
        <CircleArrowLeft color="white" />
        <h2 className="text-xl text-gray-100 dark:text-white font-semibold">
          Pago con Bitcoin
        </h2>
      </div>

      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-black bg-gray-100 rounded-2xl max-w-5xl w-full shadow-lg">
          {/* View switcher */}
          <div className="flex flex-col items-center p-2">
            <ToggleGroup
              type="single"
              value={paymentView}
              onValueChange={(value: "onchain" | "lightning") => {
                if (value) setPaymentView(value);
              }}
              className="inline-flex bg-white p-1 rounded-lg shadow-sm"
            >
              <ToggleGroupItem
                value="onchain"
                className="px-4 py-2 data-[state=on]:bg-gray-500 data-[state=on]:text-white"
              >
                OnChain
              </ToggleGroupItem>
              <ToggleGroupItem
                value="lightning"
                className="px-4 py-2 data-[state=on]:bg-gray-500 data-[state=on]:text-white"
              >
                Lightning
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="bg-gray-100 rounded-xl p-6">
            <div className="mt-6 relative min-h-64">
              <AnimatePresence mode="wait">
                {paymentView === "onchain" && (
                  <motion.div
                    key="onchain"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <OnChainPaymentView
                      timer={timerControls.onchain}
                      globalTimer={onchainTimer.remaining}
                    />
                  </motion.div>
                )}
                {paymentView === "lightning" && (
                  <motion.div
                    key="lightning"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <LightningPaymentView
                      timer={timerControls.lightning}
                      globalTimer={lightningTimer.remaining}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
