import React, { useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;

  // Actions (facultatives)
  onDonate?: () => void;
  onSubscribe?: () => void;
  onManage?: () => void;

  // Personnalisation (facultative)
  donateLabel?: string;
  subscribeLabel?: string;
  manageLabel?: string;
  manageDisabled?: boolean;
};

const ModalAbo: React.FC<Props> = ({
  open,
  onClose,
  onDonate,
  onSubscribe,
  onManage,
  donateLabel = "Faire un don",
  subscribeLabel = "Abonne-toi",
  manageLabel = "Mon abonnement",
  manageDisabled = true,
}) => {
  // Fermer avec ESC + bloquer le scroll quand open = true
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-modal-title"
    >
      {/* Overlay : clique pour fermer */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Contenu */}
      <div
        className="relative z-10 w-[min(92vw,22rem)] rounded-2xl bg-white p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton X */}
        <button
          aria-label="Fermer"
          className="absolute right-2 top-2 inline-grid size-7 place-items-center rounded-full bg-slate-200/70 text-slate-600 hover:bg-slate-300"
          onClick={onClose}
        >
          ×
        </button>

        <h4 id="action-modal-title" className="sr-only">
          Actions
        </h4>

        <div className="flex flex-col items-stretch gap-3 pt-2 pb-1">
          <button
            className="mx-auto rounded-full px-4 py-1.5 text-sm font-medium bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-200"
            onClick={onDonate}
          >
            {donateLabel}
          </button>

          <button
            className="mx-auto rounded-full px-4 py-1.5 text-sm font-semibold bg-neutral-700 text-white hover:bg-neutral-800"
            onClick={onSubscribe}
          >
            {subscribeLabel}
          </button>

          <button
            disabled={manageDisabled}
            className={`mx-auto rounded-full px-4 py-1.5 text-sm ${
              manageDisabled
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
            onClick={onManage}
            title={manageDisabled ? "Indisponible pour le moment" : undefined}
          >
            {manageLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalAbo;
