import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

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

interface ContextType {
  order: Order | null;
  paymentAttempts: {
    onchain: PaymentAttemptResponse | null;
    lightning: PaymentAttemptResponse | null;
  };
  activeMethod: "onchain" | "lightning";
  bitcoinPrice: BitcoinPrice | null;
  setOrder: (order: Order) => void;
  setPaymentAttempt: (invoice: PaymentAttemptResponse) => void;
  setActiveMethod: (method: "onchain" | "lightning") => void;
  setBitcoinPrice?: (bitcoinPrice: BitcoinPrice) => void;
  reset: () => void;
}

const OrderContext = createContext<ContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [order, setOrderState] = useState<Order | null>(null);
  const [paymentAttempts, setPaymentAttempts] = useState<{
    onchain: PaymentAttemptResponse | null;
    lightning: PaymentAttemptResponse | null;
  }>({ onchain: null, lightning: null });
  const [activeMethod, setActiveMethod] = useState<"onchain" | "lightning">(
    "onchain"
  );
  const [bitcoinPrice, setBitcoinPriceState] = useState<BitcoinPrice | null>(
    null
  );

  // Al montar, recupera desde localStorage
  useEffect(() => {
    const storedOrder = localStorage.getItem("order");
    const storedAttempts = localStorage.getItem("paymentAttempts");
    const storedActiveMethod = localStorage.getItem("activeMethod");

    if (storedOrder) setOrderState(JSON.parse(storedOrder));
    if (storedAttempts) setPaymentAttempts(JSON.parse(storedAttempts));
    if (
      storedActiveMethod === "lightning" ||
      storedActiveMethod === "onchain"
    ) {
      setActiveMethod(storedActiveMethod);
    }
  }, []);

  const setOrder = (order: Order) => {
    localStorage.setItem("order", JSON.stringify(order));
    setOrderState(order);
  };

  const setPaymentAttempt = (attempt: PaymentAttemptResponse) => {
    const type =
      attempt.paymentAttempt.payment_method_code === "PM-L"
        ? "lightning"
        : "onchain";
    const updated = { ...paymentAttempts, [type]: attempt };
    localStorage.setItem("paymentAttempts", JSON.stringify(updated));
    setPaymentAttempts(updated);
    setActiveMethod(type);
    localStorage.setItem("activeMethod", type);
  };

  const setBitcoinPrice = (price: BitcoinPrice) => {
    setBitcoinPriceState(price);
  };

  const reset = () => {
    localStorage.removeItem("order");
    localStorage.removeItem("paymentAttempts");
    localStorage.removeItem("activeMethod");
    setOrderState(null);
    setPaymentAttempts({ onchain: null, lightning: null });
    setActiveMethod("onchain");
  };

  return (
    <OrderContext.Provider
      value={{
        order,
        paymentAttempts,
        activeMethod,
        bitcoinPrice,
        setOrder,
        setPaymentAttempt,
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
