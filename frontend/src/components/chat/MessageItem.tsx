import type React from "react";
import type { Message, UserProfile } from "../../types";
import { motion } from "motion/react";
import { getFlag } from "../../helpers/roomHelpers";
import { CheckCheck, Globe, Loader2, Mic, Play, Volume2 } from "lucide-react";

interface MessageItemProps {
  message: Message; // Información del mensaje que se va a mostrar
  user: UserProfile; // Usuario autenticado, utilizado para saber si el mensaje es propio
  roomMembers: UserProfile[];
  handleSpeak: (text: string, messageId: string) => void; // Función para reproducir el mensaje mediante síntesis de voz
  getTranslation: (message: Message) => void; // Función para traducir un mensaje al idioma del usuario
  isTTSLoading: string | null; // Identificador del mensaje cuya síntesis de voz está cargando
  ttsReadyMap: Record<string, string>; // // Almacena la URL (blob) del audio generado para cada mensaje
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  user,
  roomMembers,
  handleSpeak,
  getTranslation,
  isTTSLoading,
  ttsReadyMap,
}) => {
  // Determina si el mensaje fue enviado por el usuario autenticado

  const isMe = String(message.senderId) === String(user.id);

  const readers = (message.readBy ?? []).map((reader: any) =>
    String(
      typeof reader === "object" && reader !== null
        ? (reader._id ?? reader.id)
        : reader,
    ),
  );

  const otherMembers = (roomMembers ?? []).filter(
    (member) => String(member.id) !== String(message.senderId),
  );

  const isRead =
    isMe &&
    otherMembers.length > 0 &&
    otherMembers.every((member) => readers.includes(String(member.id)));

  // Obtiene la traducción correspondiente al idioma del usuario
  const translation = message.translations?.[user.language];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
    >
      {/* Burbuja principal del mensaje */}
      <div
        className={`px-3 py-2 rounded-xl text-gray-800 max-w-[85%] sm:max-w-[70%] shadow-[0_1px_0.5px_rgba(0,0,0,0.08)] relative ${
          isMe ? "bg-[#d9fdd3] rounded-tr-none" : "bg-white rounded-tl-none"
        }`}
        style={{ minWidth: "110px" }}
      >
        {/* Encabezado del mensaje (remitente e idioma) */}
        <div className="flex items-center justify-between gap-6 mb-1 font-medium select-none">
          <span
            className={`text-[10px] font-black uppercase tracking-wider ${isMe ? "text-[#005c4b]" : "text-[#0a3d70]"}`}
          >
            {isMe ? "Tú" : message.senderName}
          </span>
          <span className="text-xs shrink-0">
            {getFlag(message.senderLanguage || "es")}
          </span>
        </div>

        {/* Contenido principal del mensaje */}
        {(!message.audioData || message.isAudioTranscription) && (
          <p className="text-[13px] font-medium leading-relaxed text-gray-800 pr-5 break-words">
            {message.text}
          </p>
        )}

        {/* Reproductor de mensajes de voz */}
        {message.audioData && (
          <div className="mt-2.5 min-w-[220px] max-w-full">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[#0a3d70]">
              <Mic className="w-4 h-4" />
              <span>Mensaje de voz</span>
            </div>

            <audio
              controls
              preload="metadata"
              src={message.audioData}
              className="w-full max-w-[280px] h-10"
              onError={() => {
                console.error("No se pudo reproducir el audio:", message.id);
              }}
            >
              Tu navegador no puede reproducir este audio.
            </audio>
          </div>
        )}

        {/* Indicador de transcripción */}
        {message.isAudioTranscription && (
          <div className="mt-1 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider text-gray-400 select-none">
            <Mic className="w-2.5 h-2.5 text-[#ff6000]" />
            Transcripción de voz
          </div>
        )}

        {/* Botón para escuchar el mensaje mediante síntesis de voz */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() =>
              handleSpeak(message.text, message.id || (message as any)._id)
            }
            className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors border select-none ${
              ttsReadyMap[message.id || (message as any)._id]
                ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600/25"
                : "bg-gray-100/90 hover:bg-gray-200/90 text-gray-600 border-gray-200/50"
            }`}
          >
            {isTTSLoading === (message.id || (message as any)._id) ? (
              <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
            ) : ttsReadyMap[message.id || (message as any)._id] ? (
              <Play className="w-3 h-3 fill-current text-white" />
            ) : (
              <Volume2 className="w-3 h-3 text-gray-500" />
            )}
            {ttsReadyMap[message.id || (message as any)._id]
              ? "Reproducir"
              : "Escuchar"}
          </button>
        </div>

        {/* Traducción del mensaje al idioma del usuario */}
        {translation && translation !== message.text && (
          <div className="mt-2.5 pt-2.5 border-t border-gray-200/60 text-left">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-1 text-[10px] uppercase font-extrabold text-[#ff6000]">
                <Globe className="w-3 h-3" /> Traducción ({user.language})
              </div>
              <button
                onClick={() =>
                  handleSpeak(
                    translation,
                    (message.id || (message as any)._id) + "-tl",
                  )
                }
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider flex items-center gap-1 transition-colors border select-none ${
                  ttsReadyMap[(message.id || (message as any)._id) + "-tl"]
                    ? "bg-amber-500 text-white border-amber-500/30"
                    : "bg-gray-155/80 hover:bg-gray-200/80 text-gray-500 border-gray-200"
                }`}
              >
                {isTTSLoading ===
                (message.id || (message as any)._id) + "-tl" ? (
                  <Loader2 className="w-2 h-2 animate-spin text-gray-450" />
                ) : ttsReadyMap[
                    (message.id || (message as any)._id) + "-tl"
                  ] ? (
                  <Play className="w-2.5 h-2.5 fill-current" />
                ) : (
                  <Volume2 className="w-2.5 h-2.5" />
                )}
                {ttsReadyMap[(message.id || (message as any)._id) + "-tl"]
                  ? "Reproducir"
                  : "Oír"}
              </button>
            </div>
            <p className="text-[13px] italic text-gray-700 leading-relaxed pr-2 break-words font-medium">
              {translation}
            </p>
          </div>
        )}

        {/* Hora de envío y confirmación de lectura */}
        <div className="text-[9px] text-gray-400 font-medium float-right mt-1 ml-4 select-none flex items-center gap-1">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}

          {isMe && (
            <div className="flex items-center">
              {readers.length > 0 ? (
                /* 
                  Si al menos una persona ya lo leyó, se muestra el doble check (✓✓).
                  Se pintará de verde si lo leyeron TODOS (isRead), de lo contrario se queda gris.
                */
                <CheckCheck
                  className={`w-3.5 h-3.5 ${
                    isRead ? "text-green-600" : "text-gray-400"
                  }`}
                />
              ) : (
                /* 
                  Un check simple: El mensaje se envió pero absolutamente nadie en la sala 
                  lo ha abierto todavía. Puedes usar un span de texto o el icono <Check /> de lucide.
                */
                <span className="text-gray-400 text-[11px] leading-none select-none font-medium px-0.5">
                  ✓
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Acción para traducir el mensaje cuando aún no existe traducción */}
      {!translation && !isMe && (
        <div className="mt-1 ml-2 text-[10px] text-gray-400 select-none">
          <button
            onClick={() => getTranslation(message)}
            className="text-[#0a3d70] hover:underline font-bold"
          >
            Traducir mensaje
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default MessageItem;
