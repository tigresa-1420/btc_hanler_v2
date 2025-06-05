import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

import { decryptData, encryptData } from "../hook/useEncryption";

interface PaymentAttemptResponse {
  paymentAttempt: {
    payment_attempt_code: string;
    payment_status_code: string;
    payment_method_code: string;
    order_code: string;
    network_fee: number;
    layer_1_address: string | null;
    invoice_address: string | null;
    amount_sats: number;
    metadata: string | null;
    blocks_confirmed: number | null;
    customer_wallet_address_id: number;
    payment_preference_id: number;
    created_at: string;
    updated_at: string;
    confirmed_at: string;
  };
  paymentPreference: {
    invoice_life_time: number;
    invoice_max_attempt: number;
  };
  wallet_address: string;
  amount_info: {
    amount_fiat: string;
    Currencies: {
      name: string;
      currency_code: string;
      symbol: string;
      country: string;
    };
  };
}

interface Order {
  order_code: string;
  payment_request_code: string;
}

interface BitcoinPrice {
  price_usd: string;
}

type PaymentMethod = "onchain" | "lightning";

interface PaymentState {
  order: Order | null;
  attempts: Record<PaymentMethod, PaymentAttemptResponse | null>;
  activeMethod: PaymentMethod;
  bitcoinPrice: BitcoinPrice | null;
}

interface ContextType extends PaymentState {
  updatePayment: (
    attempt: PaymentAttemptResponse,
    method: PaymentMethod
  ) => void;
  setOrder: (order: Order) => void;
  setActiveMethod: (method: PaymentMethod) => void;
  setBitcoinPrice: (price: BitcoinPrice) => void;
  reset: () => void;
}

const OrderContext = createContext<ContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<PaymentState>({
    order: null,
    attempts: { onchain: null, lightning: null },
    activeMethod: "onchain",
    bitcoinPrice: null,
  });

  useEffect(() => {
    const savedState = localStorage.getItem("paymentState");
    if (savedState) {
      try {
        const decrypted = decryptData(savedState);
        console.log(decrypted);
        setState(decrypted);
      } catch (error) {
        console.warn("Error al desencriptar paymentState:", error);
        localStorage.removeItem("paymentState");
      }
    }
  }, []);

  useEffect(() => {
    try {
      const encrypted = encryptData(state);
      localStorage.setItem("paymentState", encrypted);
    } catch (error) {
      console.error("Error al encriptar paymentState:", error);
    }
  }, [state]);

  const updatePayment = (
    attempt: PaymentAttemptResponse,
    method: PaymentMethod
  ) => {
    setState((prev) => ({
      ...prev,
      attempts: { ...prev.attempts, [method]: attempt },
      activeMethod: method,
    }));
  };

  const setOrder = (order: Order) => {
    setState((prev) => ({ ...prev, order }));
  };

  const setActiveMethod = (method: PaymentMethod) => {
    setState((prev) => ({ ...prev, activeMethod: method }));
  };

  const setBitcoinPrice = (price: BitcoinPrice) => {
    setState((prev) => ({ ...prev, bitcoinPrice: price }));
  };

  const reset = () => {
    localStorage.removeItem("paymentState");
  };

  return (
    <OrderContext.Provider
      value={{
        ...state,
        updatePayment,
        setOrder,
        setActiveMethod,
        setBitcoinPrice,
        reset,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder debe usarse dentro de un OrderProvider");
  }
  return context;
};
