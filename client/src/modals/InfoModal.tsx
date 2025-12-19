import React from "react";

interface InfoModalProps {
  open: boolean;
  type: "success" | "error";
  title?: string;
  message: string;
  onClose: () => void;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({
  open,
  type,
  title,
  message,
  onClose,
  primaryActionLabel,
  onPrimaryAction,
}) => {
  if (!open) return null;

  const isSuccess = type === "success";

  const handlePrimary = () => {
    if (onPrimaryAction) onPrimaryAction();
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm mx-4">
        <div
          className={`px-5 py-3 rounded-t-xl flex items-center gap-2 ${
            isSuccess ? "bg-emerald-50" : "bg-red-50"
          }`}
        >
          <div
            className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
              isSuccess
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {isSuccess ? "✓" : "!"}
          </div>
          <h2
            className={`text-sm font-semibold ${
              isSuccess ? "text-emerald-800" : "text-red-800"
            }`}
          >
            {title || (isSuccess ? "Success" : "Error")}
          </h2>
        </div>

        <div className="px-5 py-4 text-sm text-slate-700 whitespace-pre-line">
          {message}
        </div>

        <div className="px-5 py-3 flex justify-end gap-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>

          {primaryActionLabel && (
            <button
              type="button"
              onClick={handlePrimary}
              className={`text-xs px-3 py-1.5 rounded-md ${
                isSuccess
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {primaryActionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
