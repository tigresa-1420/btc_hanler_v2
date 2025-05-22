// src/context/OrderContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface PaymentAttemptResponse {
  paymentAttempt: {
    payment_attempt_id: number;
    payment_status_id: number;
    payment_method_id: number;
    order_id: number;
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
    Currency: {
      name: string;
      code: string;
      symbol: string;
      country: string;
    };
  };
}

interface Order {
  order_id: number;
}

interface OrderContextType {
  order: Order | null;
  invoice: PaymentAttemptResponse | null;
  setOrder: (order: Order) => void;
  setInvoice: (invoice: PaymentAttemptResponse) => void;
  reset: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [invoice, setInvoice] = useState<PaymentAttemptResponse | null>(null);

  const reset = () => {
    setOrder(null);
    setInvoice(null);
  };

  return (
    <OrderContext.Provider
      value={{ order, invoice, setOrder, setInvoice, reset }}
    >
      {children}
    </OrderContext.Provider>
  );
};

// Hook personalizado
export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder debe usarse dentro de un OrderProvider");
  }
  return context;
};
