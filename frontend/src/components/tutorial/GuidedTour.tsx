import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import type { RefObject } from "react";

import type { RoomListTourAction } from "../rooms/RoomList";
import type { ChatRoomTourAction } from "../chat/ChatRoom";

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  roomListActionRef: RefObject<
    ((action: RoomListTourAction) => boolean) | null
  >;
  chatRoomActionRef: RefObject<((action: ChatRoomTourAction) => void) | null>;
  hasSelectedRoom: boolean;
}

interface TourStep {
  target: string | null;
  title: string;
  description: string;
  action?:
    | "open-join"
    | "open-create"
    | "open-share"
    | "open-settings"
    | "open-delete";
  requiresRoom?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: null,
    title: "¡Bienvenido a Babel Dúo!",
    description:
      "Te acompañaremos para conocer las herramientas de la aplicación y aprender a comunicarte con personas que hablan otros idiomas.",
  },
  {
    target: "sidebar-tour",
    title: "Tutorial guiado",
    description:
      "Desde este botón puedes volver a iniciar este recorrido cuando lo necesites.",
  },
  {
    target: "sidebar-profile",
    title: "Tu perfil",
    description:
      "Aquí puedes actualizar tu idioma y tus intereses para personalizar tu experiencia.",
  },
  {
    target: "settings-button",
    title: "Configuración de tu perfil",
    description:
      "Desde este botón puedes abrir los ajustes de tu perfil y seleccionar el idioma en el que prefieres recibir los mensajes.",
  },
  {
    target: "settings-language",
    title: "Seleccionar tu idioma",
    description:
      "Selecciona el idioma que deseas utilizar. Babel Dúo traducirá automáticamente los mensajes de las conversaciones según esta preferencia.",
    action: "open-settings",
  },
  {
    target: "settings-save",
    title: "Guardar tu configuración",
    description:
      "Cuando hayas seleccionado tu idioma, pulsa Guardar para aplicar la nueva configuración a tu perfil.",
  },
  {
    target: "room-search",
    title: "Buscar conversaciones",
    description: "Utiliza el buscador para localizar las salas disponibles.",
  },
  {
    target: "room-join",
    title: "Unirse a una sala",
    description:
      "Desde este botón puedes ingresar el código de invitación de una sala a la que quieras unirte.",
  },
  {
    target: "join-room-content",
    title: "Ingresar código de invitación",
    description:
      "Escribe aquí el código que te compartieron para ingresar a la sala.",
    action: "open-join",
  },
  {
    target: "room-create",
    title: "Crear una sala",
    description:
      "Utiliza este botón para crear una nueva sala y comenzar una conversación.",
  },
  {
    target: "create-room-content",
    title: "Configurar una nueva sala",
    description:
      "Ingresa el nombre y el propósito de la sala antes de crearla.",
    action: "open-create",
  },
  {
    target: "room-list",
    title: "Tus conversaciones",
    description:
      "Aquí encontrarás las salas a las que perteneces. Si ya tienes alguna, abriremos automáticamente la primera para mostrarte cómo funciona el chat. Si todavía no tienes salas, podrás crear una o unirte a otra más adelante.",
  },
  {
    target: "chat-room-name",
    title: "Tu sala",
    description:
      "En la parte superior encontrarás el nombre de la conversación en la que estás participando.",
    requiresRoom: true,
  },
  {
    target: "chat-share",
    title: "Compartir invitación",
    description:
      "Desde este botón puedes compartir el código de invitación de tu sala para que otras personas puedan unirse.",
    requiresRoom: true,
  },
  {
    target: "share-room-content",
    title: "Compartir tu sala",
    description:
      "Aquí encontrarás las opciones para compartir el código de invitación con otras personas.",
    action: "open-share",
    requiresRoom: true,
  },
  {
    target: "chat-messages",
    title: "Mensajes",
    description:
      "En esta sección podrás leer los mensajes enviados por los participantes. Babel Dúo realiza la traducción automáticamente según el idioma configurado.",
    requiresRoom: true,
  },
  {
    target: "chat-message-input",
    title: "Escribir mensajes",
    description:
      "Escribe tu mensaje en este campo para comunicarte con los demás participantes.",
    requiresRoom: true,
  },
  {
    target: "chat-audio",
    title: "Enviar audio",
    description: "Utiliza este botón para grabar y enviar mensajes de voz.",
    requiresRoom: true,
  },
  {
    target: "chat-send",
    title: "Enviar mensajes",
    description:
      "Cuando tu mensaje esté listo, utiliza este botón para enviarlo a la conversación.",
    requiresRoom: true,
  },
  {
    target: null,
    title: "¡Ya estás listo!",
    description:
      "Ahora conoces las principales herramientas de Babel Dúo. ¡Explora, conversa y conecta con personas de otros idiomas!",
  },
];

export default function GuidedTour({
  isOpen,
  onClose,
  roomListActionRef,
  chatRoomActionRef,
  hasSelectedRoom,
}: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const roomSelectionAttempted = useRef(false);

  // const isMobile = window.innerWidth < 768;

  // Los pasos del chat solo aparecen después de seleccionar una sala.
  // Como están después de "Tus conversaciones", su aparición no altera
  // la posición de los pasos anteriores.
  const visibleSteps = useMemo(() => {
    return TOUR_STEPS.filter((step) => {
      if (step.requiresRoom && !hasSelectedRoom) return false;
      return true;
    });
  }, [hasSelectedRoom]);

  const step = visibleSteps[currentStep];

  const updateTarget = useCallback(() => {
    const current = visibleSteps[currentStep];

    if (!current?.target) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(`[data-tour="${current.target}"]`);

    if (!element) {
      setTargetRect(null);
      return;
    }

    setTargetRect(element.getBoundingClientRect());
  }, [currentStep, visibleSteps]);

  const closeModals = useCallback(() => {
    roomListActionRef.current?.("close-modals");
    chatRoomActionRef.current?.("close-share");
  }, [roomListActionRef, chatRoomActionRef]);

  const closeSettingsPanel = useCallback(() => {
    const settingsPanel = document.querySelector(
      '[data-tour="settings-panel"]',
    );

    if (!settingsPanel) return;

    const settingsButton = document.querySelector(
      '[data-tour="settings-button"]',
    ) as HTMLButtonElement | null;

    settingsButton?.click();
  }, []);

  const finishTour = useCallback(() => {
    closeModals();
    closeSettingsPanel();
    setTargetRect(null);
    setCurrentStep(0);
    roomSelectionAttempted.current = false;
    onClose();
  }, [closeModals, closeSettingsPanel, onClose]);

  const goToStep = useCallback(
    (nextIndex: number) => {
      const currentTarget = visibleSteps[currentStep]?.target;
      const nextTarget = visibleSteps[nextIndex]?.target;

      closeModals();

      // Mantener abierto el panel mientras se explican
      // el selector de idioma y el botón Guardar.
      const isLeavingSettings =
        currentTarget?.startsWith("settings-") &&
        !nextTarget?.startsWith("settings-");

      if (isLeavingSettings) {
        closeSettingsPanel();
      }

      if (nextIndex < 0 || nextIndex >= visibleSteps.length) {
        finishTour();
        return;
      }

      setCurrentStep(nextIndex);
    },
    [currentStep, visibleSteps, closeModals, closeSettingsPanel, finishTour],
  );

  // Acciones necesarias para mostrar los modales y seleccionar una sala.
  useEffect(() => {
    if (!isOpen || !step) return;

    let measureTimeout: number | undefined;

    const actionTimeout = window.setTimeout(() => {
      setTargetRect(null);

      if (step.action === "open-join") {
        roomListActionRef.current?.("open-join");
      }

      if (step.action === "open-create") {
        roomListActionRef.current?.("open-create");
      }

      if (step.action === "open-share") {
        chatRoomActionRef.current?.("open-share");
      }

      if (step.action === "open-settings") {
        const settingsButton = document.querySelector(
          '[data-tour="settings-button"]',
        ) as HTMLButtonElement | null;

        if (settingsButton?.getAttribute("aria-expanded") !== "true") {
          settingsButton?.click();
        }
      }

      if (
        step.target === "room-list" &&
        !hasSelectedRoom &&
        !roomSelectionAttempted.current
      ) {
        const selected = roomListActionRef.current?.("select-first-room");

        if (selected) {
          roomSelectionAttempted.current = true;
        }
      }

      const targetElement = step.target
        ? document.querySelector(`[data-tour="${step.target}"]`)
        : null;

      targetElement?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      measureTimeout = window.setTimeout(updateTarget, 900);
    }, 0);

    return () => {
      window.clearTimeout(actionTimeout);

      if (measureTimeout !== undefined) {
        window.clearTimeout(measureTimeout);
      }
    };
  }, [
    isOpen,
    step,
    hasSelectedRoom,
    roomListActionRef,
    chatRoomActionRef,
    updateTarget,
  ]);

  // Reiniciar el recorrido cuando se abre manualmente.
  useEffect(() => {
    if (!isOpen) {
      roomSelectionAttempted.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => updateTarget();
    const handleScroll = () => updateTarget();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, updateTarget]);

  if (!isOpen || !step) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="tour-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pointer-events-none fixed inset-0 z-[10000]"
      >
        {/* Fondo oscuro */}
        <div
          className={`pointer-events-none absolute inset-0 ${
            targetRect ? "bg-transparent" : "bg-black/65"
          }`}
        />

        {/* Resaltado del elemento */}
        {targetRect && (
          <motion.div
            key={`${step.target}-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-none fixed rounded-xl border-[3px] border-[#60A5FA] shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]"
            style={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
            }}
          />
        )}

        {/* Tarjeta del tutorial */}
        <div
          className="pointer-events-auto fixed z-[10002] p-3"
          style={(() => {
            const isModalStep = [
              "join-room-content",
              "create-room-content",
              "share-room-content",
              "chat-messages",
            ].includes(step.target || "");

            if (isModalStep && targetRect && window.innerWidth >= 1100) {
              const cardWidth = 380;
              const gap = 16;
              const rightSpace = window.innerWidth - targetRect.right - gap;
              const leftSpace = targetRect.left - gap;

              // Ubicar a la derecha del modal
              if (rightSpace >= cardWidth + 24) {
                return {
                  top: "50%",
                  left: targetRect.right + gap,
                  width: cardWidth,
                  transform: "translateY(-50%)",
                };
              }

              // Si no cabe a la derecha, ubicar a la izquierda
              if (leftSpace >= cardWidth + 24) {
                return {
                  top: "50%",
                  left: targetRect.left - cardWidth - gap,
                  width: cardWidth,
                  transform: "translateY(-50%)",
                };
              }

              // Si no cabe a los lados, ubicarla arriba del modal
              return {
                left: "50%",
                transform: "translateX(-50%)",
                bottom: Math.max(16, window.innerHeight - targetRect.top + 16),
                width: "min(420px, calc(100vw - 24px))",
              };
            }

            // Comportamiento habitual para los demás pasos
            return {
              left: "50%",
              transform: "translateX(-50%)",
              top:
                targetRect && targetRect.top > window.innerHeight / 2
                  ? "16px"
                  : undefined,
              bottom:
                !targetRect || targetRect.top <= window.innerHeight / 2
                  ? "16px"
                  : undefined,
              width: "calc(100% - 24px)",
              maxWidth: "512px",
            };
          })()}
        >
          <motion.div
            key={`card-${currentStep}`}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 25 }}
            className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <button
              type="button"
              onClick={finishTour}
              aria-label="Cerrar tutorial"
              className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8EEF4] text-[#0A3D70]">
                <BookOpen size={25} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#0A3D70]">
                  Tutorial guiado
                </p>
                <p className="text-xs text-gray-500">
                  Paso {currentStep + 1} de {visibleSteps.length}
                </p>
              </div>
            </div>

            <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <motion.div
                className="h-full rounded-full bg-[#0A3D70]"
                animate={{
                  width: `${((currentStep + 1) / visibleSteps.length) * 100}%`,
                }}
              />
            </div>

            <h2 className="mb-2 pr-8 text-xl font-extrabold text-gray-900 sm:text-2xl">
              {step.title}
            </h2>

            <p className="mb-6 text-sm leading-6 text-gray-600">
              {step.description}
            </p>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={finishTour}
                className="text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                Omitir
              </button>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={() => goToStep(currentStep - 1)}
                    className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <ChevronLeft size={17} />
                    Anterior
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === visibleSteps.length - 1) {
                      finishTour();
                    } else {
                      goToStep(currentStep + 1);
                    }
                  }}
                  className="flex items-center gap-1 rounded-xl bg-[#0A3D70] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#082A4D]"
                >
                  {currentStep === visibleSteps.length - 1 ? (
                    <>
                      Finalizar
                      <Check size={17} />
                    </>
                  ) : (
                    <>
                      Siguiente
                      <ChevronRight size={17} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
