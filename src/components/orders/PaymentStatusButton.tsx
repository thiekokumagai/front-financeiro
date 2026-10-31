import React from "react";
import { PaymentStatus } from "@/types/order";
import { DollarSign, Check, Loader2 } from "lucide-react";

interface PaymentStatusButtonProps {
  paymentStatus?: PaymentStatus | null;
  isUpdating?: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: "sm" | "default";
  className?: string;
}

export const PaymentStatusButton: React.FC<PaymentStatusButtonProps> = ({
  paymentStatus,
  isUpdating = false,
  onToggle,
  disabled = false,
  size = "sm",
  className = "",
}) => {
  const isPaid = paymentStatus === "PAID";
  const isDisabled = disabled || isUpdating;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!isDisabled) {
          onToggle();
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      title={isPaid ? "Pago (Clique para desmarcar como Pendente)" : "Pendente (Clique para marcar como Pago)"}
      aria-label={isPaid ? "Status Pago. Clique para alterar para Pendente." : "Status Pendente. Clique para alterar para Pago."}
      className={`inline-flex items-center gap-1 font-bold rounded-full transition-all duration-150 select-none shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 active:scale-95
        ${
          size === "sm"
            ? "text-[11px] px-2.5 py-0.5"
            : "text-xs px-3 py-1"
        }
        ${
          isPaid
            ? "bg-emerald-100/90 text-emerald-800 hover:bg-emerald-200 border border-emerald-300/70 focus-visible:ring-emerald-500"
            : "bg-amber-100/90 text-amber-800 hover:bg-amber-200 border border-amber-300/70 focus-visible:ring-amber-500"
        }
        ${isDisabled ? "opacity-70 cursor-not-allowed active:scale-100" : "cursor-pointer"}
        ${className}
      `}
    >
      {isUpdating ? (
        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
      ) : isPaid ? (
        <Check className="h-3 w-3 shrink-0 stroke-[2.5]" />
      ) : (
        <DollarSign className="h-3 w-3 shrink-0 stroke-[2.5]" />
      )}
      <span>{isPaid ? "Pago" : "Pagar"}</span>
    </button>
  );
};
