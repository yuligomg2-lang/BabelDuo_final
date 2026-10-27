import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface RoomDeleteModalProps {
  isOpen: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const RoomDeleteModal = ({
  isOpen,
  loading,
  onClose,
  onConfirm,
}: RoomDeleteModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl bg-white shadow-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Encabezado */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-500" />

                <h2 className="text-2xl font-semibold text-gray-900">
                  Eliminar sala
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Contenido */}
            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-gray-600">
                ¿Estás seguro de que quieres eliminar esta sala?
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Esta acción no se puede deshacer y la sala dejará de estar
                disponible para todos sus miembros.
              </p>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}

                {loading ? "Eliminando..." : "Eliminar sala"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
