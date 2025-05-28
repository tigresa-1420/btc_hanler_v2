import React from "react";
import axiosInstance from "src/api/axios";
import { useOrder } from "src/context/invoiceContext";
import { useCountdown } from "src/hook/useCountdown";

//response type
interface SummaryResponse {
  id: string;
  symbol: string;
  name: string;
  price_usd: string;
  percent_change_24h: string;
}
export default function BitcoinSummary() {
  const [summary, setSummary] = React.useState<SummaryResponse | null>(null);
  const { setBitcoinPrice } = useOrder();
  const { remaining, start, reset, isActive } = useCountdown({
    key: "bitcoinSummaryCountdown",
    duration: 10,
    onExpire: () => {
      console.log("Countdown expired, fetching new Bitcoin data...");
      fetchBitcoinData();
    },
    onStart: () => {
      console.log("Countdown started");
      fetchBitcoinData();
    },
  });

  React.useEffect(() => {
    if (!isActive) {
      start();
    }
  });

  const fetchBitcoinData = async () => {
    console.log("Fetching Bitcoin data...");

    try {
      const response = await axiosInstance.get<SummaryResponse[]>(
        "https://api.coinlore.net/api/ticker/?id=90"
      );
      if (response.status === 200 && response.data.length > 0) {
        setSummary(response.data[0]);
        setBitcoinPrice?.(response.data[0]);
        reset(); // Reset the countdown timer after fetching data
      } else {
        console.error("No data found for Bitcoin");
      }
    } catch (error) {
      console.error("Error fetching Bitcoin data:", error);
    }
  };
  const check_price_change = (change: string) => {
    const changeValue = parseFloat(change);

    if (changeValue > 0) {
      return true;
    } else if (changeValue < 0) {
      return false;
    }
  };

  return (
    <div className="bg-gray-100">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              Bitcoin <span className=" text-sm">(BTC)</span>
            </h2>
            <p className="text-3xl font-bold">
              ${summary?.price_usd}
              <span
                className={
                  "text-lg ml-2 " +
                  (check_price_change(summary?.percent_change_24h || "0")
                    ? "text-green-500"
                    : "text-red-500")
                }
              >
                {summary?.percent_change_24h}%
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
