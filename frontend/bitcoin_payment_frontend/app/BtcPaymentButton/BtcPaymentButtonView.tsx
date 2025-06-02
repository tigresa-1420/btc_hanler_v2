import React, { useEffect } from "react";
import { Link, redirect, useNavigate } from "react-router";
import { useOrder } from "src/context/invoiceContext";
import axiosInstance from "src/api/axios";

export function BitcoinPaymentButton() {
  useEffect(() => {
    // This effect runs only once when the component mounts
    console.log("BitcoinPaymentButton mounted");
  }, []);
  const [isHovered, setIsHovered] = React.useState(false);
  const navigate = useNavigate();
  const { setInvoice, setOrder } = useOrder();

  const handler_create_order = async () => {
    const response = await axiosInstance.post("/orders", {
      customer_code: "CUS001",
      external_ref: "123456789",
      amount_fiat: 20,
      local_currency_code: "USD",
    });
    setOrder(response.data.created_order.order_code);
    if (response.status === 201) {
      await handler_create_payment_attempt(
        response.data.created_order.order_code,
        response.data.created_payment_request.payment_request_code
      );
    }
  };

  const handler_create_payment_attempt = async (
    order_code: number,
    payment_request_code: number
  ) => {
    const response = await axiosInstance.post("/payment-attempts", {
      order_code: order_code,
      payment_request_code: payment_request_code,
      payment_method_code: "PM-O",
      amount_sats: 0.5,
      network_fee: 2.5,
    });
    console.log(response.status);
    if (response.status === 201) {
      setInvoice(response.data);

      console.log("should redirect to payment");
      navigate("/btc/payment");
    }
  };
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <button
        onClick={() => {
          handler_create_order();
        }}
        className={`relative overflow-hidden group flex items-center justify-center px-10 py-5 ${
          isHovered ? "bg-orange-600" : "bg-orange-500"
        } text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 transform ${
          isHovered ? "-translate-y-1 scale-105" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="gap-2 flex items-center">
          <div
            className={`transition-transform duration-300       ${
              isHovered ? "rotate-12" : ""
            }`}
          >
            <img
              src="https://pngimg.com/uploads/bitcoin/bitcoin_PNG47.png"
              alt="QR"
              className="w-10 h-10 "
            />
          </div>

          <span className="text-lg">Pagar con Bitcoin</span>
        </div>
        {isHovered && (
          <>
            <span className="absolute top-0 left-0 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></span>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-300 rounded-full animate-ping animation-delay-100"></span>
          </>
        )}
      </button>
    </div>
  );
}
