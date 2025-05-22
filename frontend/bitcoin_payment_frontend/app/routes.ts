import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("btc/waiting_payment", "./WaitingPayment/WaitingPaymentView.tsx"),
  route("btc/payment", "./PaymentViewSwitcher/PaymentViewSwitcher.tsx"),
  route("btc/succeed_payment", "./SucceedPayment/SucceedPaymentView.tsx"),
  route("btc/button_payment", "./BtcPaymentButton/BtcPaymentButtonView.tsx"),
] satisfies RouteConfig;
// @ts-ignore
