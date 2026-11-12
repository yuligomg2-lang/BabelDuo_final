import type React from "react";
import { useMemo } from "react";
import type { UserProfile, Message } from "../../types";
import chatBackground from "../../assets/img/fondo.jpg";
import MessageItem from "../chat/MessageItem";
import { getMessageDateInfo } from "../../helpers/messageDateHelpers";

interface ChatMessagesProps {
  messages: Message[];
  user: UserProfile;
  roomMembers: UserProfile[];
  themeMode: "classic" | "modern";
  scrollRef: React.RefObject<HTMLDivElement | null>;
  ttsReadyMap: Record<string, string>;
  isTTSLoading: string | null;
  getTranslation: (msg: Message) => void;
  handleSpeak: (text: string, messageId?: string) => void;
}

export default function ChatMessages({
  messages,
  user,
  roomMembers,
  themeMode,
  scrollRef,
  ttsReadyMap,
  isTTSLoading,
  getTranslation,
  handleSpeak,
}: ChatMessagesProps) {
  // Preparamos los mensajes y sus separadores de fecha
  const messagesWithSeparators = useMemo(
    () =>
      messages.map((message, index) => {
        const currentDate = getMessageDateInfo(message.createdAt);

        const previousDate =
          index > 0 ? getMessageDateInfo(messages[index - 1].createdAt) : null;
        return {
          message,
          dateLabel: currentDate?.label ?? "",
          showDateSeparator:
            currentDate !== null &&
            (index === 0 || currentDate.key !== previousDate?.key),
        };
      }),
    [messages],
  );
  return (
    <div
      ref={scrollRef}
      className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative transition-colors duration-300 ${
        themeMode === "classic" ? "bg-[#efeae2]/85" : "bg-[#f4f3f0]"
      }`}
      style={
        themeMode === "classic"
          ? {
              backgroundImage: `url(${chatBackground})`,
              backgroundRepeat: "repeat",
              backgroundSize: "180px",
            }
          : undefined
      }
    >
      {messagesWithSeparators.map(
        ({ message, dateLabel, showDateSeparator }) => (
          <div key={message.id || (message as any)._id}>
            {showDateSeparator && (
              <div className="flex justify-center my-5">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-medium shadow-sm ${
                    themeMode === "classic"
                      ? "bg-[#e1f3fb] text-gray-600"
                      : "bg-white text-gray-600"
                  }`}
                >
                  {dateLabel}
                </span>
              </div>
            )}
            <MessageItem
              key={message.id || (message as any)._id}
              message={message}
              user={user}
              roomMembers={roomMembers}
              handleSpeak={handleSpeak}
              getTranslation={getTranslation}
              isTTSLoading={isTTSLoading}
              ttsReadyMap={ttsReadyMap}
            />
          </div>
        ),
      )}
    </div>
  );
}
