import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../components/ui/alert-dialog";
import { Link } from "react-router";

interface TimeoutDialogProps {
  open: boolean;
  onCancel: () => void;
  onRetry: () => void;
  title: string;
  description?: string;
  cancelText?: string;
  retryText?: string;
  children?: React.ReactNode;
}

export default function TimeoutDialog({
  open,
  onCancel,
  onRetry,
  title = "Tiempo de espera agotado!",
  description = "Puedes generar un nuevo código QR o dirección de pago.",
  cancelText = "Cancelar transacción",
  retryText = "Generar nueva invoice",
  children,
}: TimeoutDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
            <br />
            {children}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Link to="/">
            <AlertDialogCancel onClick={onCancel}>
              {cancelText}
            </AlertDialogCancel>
          </Link>
          <AlertDialogAction onClick={onRetry}>{retryText}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
