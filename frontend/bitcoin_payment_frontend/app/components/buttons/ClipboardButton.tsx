import { useState } from "react";
import { Clipboard, ClipboardCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ClipboardButton(textToCopy: any) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    await navigator.clipboard.writeText(textToCopy.textToCopy);
    console.log("Texto copiado:", textToCopy.textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleClick} className="relative ">
      <AnimatePresence mode="wait">
        {!copied ? (
          <motion.div
            key="clipboard"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Clipboard className="w-5 h-5 text-gray-600" />
          </motion.div>
        ) : (
          <motion.div
            key="check"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ClipboardCheck className="w-5 h-5 text-green-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
