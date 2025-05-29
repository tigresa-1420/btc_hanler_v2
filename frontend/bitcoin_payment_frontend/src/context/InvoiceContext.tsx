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
}
interface BitcoinPrice {
  price_usd: string;
}

interface ContextType {
  order: Order | null;
  invoice: PaymentAttemptResponse | null;
  bitcoinPrice: BitcoinPrice | null;
  setOrder: (order: Order) => void;
  setInvoice: (invoice: PaymentAttemptResponse) => void;
  setBitcoinPrice?: (bitcoinPrice: BitcoinPrice) => void;
  reset: () => void;
}

const OrderContext = createContext<ContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [order, setOrderState] = useState<Order | null>(null);
  const [invoice, setInvoiceState] = useState<PaymentAttemptResponse | null>(
    null
  );
  const [bitcoinPrice, setBitcoinPriceState] = useState<BitcoinPrice | null>(
    null
  );

  // Al montar, recupera desde localStorage
  useEffect(() => {
    const storedOrder = localStorage.getItem("order");
    const storedInvoice = localStorage.getItem("invoice");

    if (storedOrder) setOrderState(JSON.parse(storedOrder));
    if (storedInvoice) setInvoiceState(JSON.parse(storedInvoice));
  }, []);

  // Guarda en localStorage cada vez que se actualiza
  const setOrder = (order: Order) => {
    localStorage.setItem("order", JSON.stringify(order));
    setOrderState(order);
  };

  const setInvoice = (invoice: PaymentAttemptResponse) => {
    localStorage.setItem("invoice", JSON.stringify(invoice));
    setInvoiceState(invoice);
  };

  const setBitcoinPrice = (price: BitcoinPrice) => {
    setBitcoinPriceState(price);
  };

  const reset = () => {
    localStorage.removeItem("order");
    localStorage.removeItem("invoice");
    setOrderState(null);
    setInvoiceState(null);
  };

  return (
    <OrderContext.Provider
      value={{
        order,
        invoice,
        setOrder,
        setInvoice,
        reset,
        bitcoinPrice,
        setBitcoinPrice,
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
