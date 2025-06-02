import React, { useCallback, useEffect } from "react";
import axiosInstance from "src/api/axios";
import { useOrder } from "src/context/InvoiceContext";
import { useCountdown } from "src/hook/useCountdown";

// Definición de tipos mejorada
interface SummaryResponse {
  id: string;
  symbol: string;
  name: string;
  price_usd: string;
  percent_change_24h: string;
}

const API_URL = "https://api.coinlore.net/api/ticker/?id=90";
const BTC_ID = 90; // ID de Bitcoin en CoinLore

const BitcoinSummary: React.FC = () => {
  const [summary, setSummary] = React.useState<SummaryResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { setBitcoinPrice, invoice } = useOrder();

  const duration = invoice?.paymentPreference.invoice_life_time || 300; // Valor por defecto de 5 minutos

  // Memoizar la función de fetch para evitar recreaciones innecesarias
  const fetchBitcoinData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching BTC price...");
      const response = await axiosInstance.get<SummaryResponse[]>(API_URL);

      if (response.status === 200 && response.data.length > 0) {
        const btcData = response.data.find(
          (item) => item.id === BTC_ID.toString()
        );
        if (btcData) {
          setSummary(btcData);
          setBitcoinPrice?.(btcData);
        } else {
          setError("Bitcoin data not found in response");
        }
      } else {
        setError("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching Bitcoin data:", error);
      setError("Failed to fetch Bitcoin data");
    } finally {
      setIsLoading(false);
    }
  }, [setBitcoinPrice]);

  // Configuración del countdown
  const { remaining, start, reset, isActive } = useCountdown({
    key: "bitcoinSummaryCountdown",
    duration,
    onExpire: fetchBitcoinData,
    onStart: fetchBitcoinData,
  });

  useEffect(() => {
    if (!isActive) {
      start();
    }
  }, [isActive, start]);

  const getPriceChangeStatus = (change?: string) => {
    if (!change) return null;

    const changeValue = parseFloat(change);
    return {
      isPositive: changeValue > 0,
      value: changeValue,
    };
  };

  const priceChange = getPriceChangeStatus(summary?.percent_change_24h);

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              Bitcoin <span className="text-sm text-gray-600">(BTC)</span>
            </h2>

            {summary ? (
              <>
                <p className="text-3xl font-bold">
                  ${summary.price_usd}
                  {priceChange && (
                    <span
                      className={`text-lg ml-2 ${
                        priceChange.isPositive
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {priceChange.value}%
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Se actualizara en: {Math.floor(remaining / 60)}:
                  {(remaining % 60).toString().padStart(2, "0")}
                </p>
              </>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(BitcoinSummary);
