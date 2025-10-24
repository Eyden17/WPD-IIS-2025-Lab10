import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

export default function Modal({ open, onClose, title = "Detalle", children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => ref.current?.focus(), 0);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    (
      <div
        className="modal-overlay"
        onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal" ref={ref} tabIndex={-1}>
          <header className="modal-head">
            <strong>{title}</strong>
            <button className="btn" onClick={onClose} aria-label="Cerrar">Cerrar</button>
          </header>
          {children}
        </div>
      </div>
    ),
    document.body
  );
}
