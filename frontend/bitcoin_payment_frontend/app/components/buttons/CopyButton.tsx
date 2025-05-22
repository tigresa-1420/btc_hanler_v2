import { useState } from "react";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Clipboard, Check } from "lucide-react";

export default function CopyButton(textToCopy: any) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(textToCopy.textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="flex items-center gap-2"
    >
      <AnimatePresence mode="wait">
        {!copied ? (
          <motion.div
            key="clipboard"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1"
          >
            <span>Copiar</span>
          </motion.div>
        ) : (
          <motion.div
            key="check"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1 text-green-600"
          >
            <Check className="w-4 h-4" />
            <span>¡Copiado!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
