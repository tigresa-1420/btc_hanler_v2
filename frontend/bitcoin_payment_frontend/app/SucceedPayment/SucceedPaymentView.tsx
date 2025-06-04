import React, { useEffect, useRef } from "react";
import { Card, CardContent } from "../components/ui/card";
import { CircleCheck, Clipboard } from "lucide-react";
import { Link, redirect, useLocation } from "react-router";
import ClipboardButton from "../components/buttons/ClipboardButton";
import { useCountdown } from "src/hook/useCountdown";
//const inputRef = useRef<HTMLInputElement>(null);

const handleCopy = () => {
  //  if (inputRef.current) {
  //  navigator.clipboard.writeText(inputRef.current.value);
  // }
};
const info = {
  id: "asdfghjkl",
  network: "network",
  address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  amountBTC: "0.0032",
  feeBTC: "fee",
  totalBTC: "0.0033",
  totalUSD: "$0.10",
  date: "2023-10-01 12:00:00",
  txid: "f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16",
  sats: "0.0000031 Sats",
};

export default function BitcoinPaymentSucceed() {
  const timer1 = useCountdown({
    duration: 100,
    key: "timer1",
    onExpire: () => console.log(" 1 timer expired"),
  });

  const timer2 = useCountdown({
    duration: 50,
    key: "timer2",
    onExpire: () => console.log(" 2 timer expired"),
  });

  useEffect(() => {
    timer1.start();
    timer2.start();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-white text-black rounded-2xl max-w-3xl w-full shadow-lg">
        <Child_1 isActive={timer1.isActive} remaining={timer1.remaining} />
        <Child_2 isActive={timer2.isActive} remaining={timer2.remaining} />
      </div>
    </div>
  );
}

interface Props {
  remaining: number;
  isActive: boolean;
}
export function Child_1({ remaining, isActive }: Props) {
  console.log("Timer 1 is ", isActive, " remaining ", remaining);
  return <div>IM A CHILD 1</div>;
}

export function Child_2({ remaining, isActive }: Props) {
  console.log("Timer 2 is ", isActive, " remaining ", remaining);
  return <div>IM A CHILD 2</div>;
}
