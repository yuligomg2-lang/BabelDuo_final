import { API_URL } from "../../services/api";
import { useRef, useState } from "react";
import type { Room, UserProfile } from "../../types";

import HeaderAuth from "./HeaderAuth";
import SidebarTools from "./SidebarTools";
import GuidedTour from "../tutorial/GuidedTour";

import { RoomList, type RoomListTourAction } from "../rooms/RoomList";
import { ChatRoom, type ChatRoomTourAction } from "../chat/ChatRoom";

interface MainLayoutProps {
  user: UserProfile;
  onUserUpdate: (user: UserProfile | null) => void;
}

const MainLayout = ({ user, onUserUpdate }: MainLayoutProps) => {
  const [, setError] = useState("");
  const [, setSuccessMessage] = useState("");

  const [showSettings, setShowSettings] = useState(false);
  const tourStorageKey = `babel_duo_tour_completed_${user.id}`;

  const [showTour, setShowTour] = useState(() => {
    return localStorage.getItem(tourStorageKey) !== "true";
  });
  const [language, setLanguage] = useState(user?.language || "es");
  const [interests, setInterests] = useState(user?.interests?.join(", ") || "");

  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [refreshRooms, setRefreshRooms] = useState(0);

  const roomListTourActionRef = useRef<
    ((action: RoomListTourAction) => boolean) | null
  >(null);

  const chatRoomTourActionRef = useRef<
    ((action: ChatRoomTourAction) => void) | null
  >(null);

  const handleSaveSettings = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const updatedUser: UserProfile = {
        ...user,
        language,
        interests: interests
          .split(",")
          .map((i) => i.trim())
          .filter((i) => i !== ""),
      };

      const response = await fetch(`${API_URL}/api/auth/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "No fue posible actualizar la información del usuario",
        );
      }

      localStorage.setItem("babel_duo_user", JSON.stringify(data.user));
      onUserUpdate(data.user);
      setShowSettings(false);
      setSuccessMessage("Configuración actualizada correctamente.");
    } catch (error: unknown) {
      const mensaje =
        error instanceof Error ? error.message : "Error al guardar cambios";

      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem("babel_duo_user");
    localStorage.removeItem("babel_duo_room_id");

    onUserUpdate(null);
    setError("");
    setSuccessMessage("");
  };

  const handleSelectRoom = (room: Room) => {
    console.log("Sala seleccionada:", room);
    setSelectedRoom(room);
  };

  const handleRoomDeleted = (roomId: string) => {
    if (selectedRoom?.id === roomId) {
      setSelectedRoom(null);
      setRefreshRooms((prev) => prev + 1);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden">
      {/* Barra lateral de herramientas */}
      <SidebarTools
        onStartTour={() => setShowTour(true)}
        onOpenProfile={() => setShowSettings(true)}
      />

      {/* Columna de salas y perfil */}
      <div
        className={`${
          selectedRoom ? "hidden md:flex" : "flex"
        } flex-1 min-w-0 md:flex-none md:w-[380px] h-full border-r border-gray-200 flex-col bg-white`}
      >
        <div className="shrink-0">
          <HeaderAuth
            user={user}
            showSettings={showSettings}
            language={language}
            interests={interests}
            loading={loading}
            setShowSettings={setShowSettings}
            setLanguage={setLanguage}
            setInterests={setInterests}
            handleSaveSettings={handleSaveSettings}
            handleSignOut={handleSignOut}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <RoomList
            user={user}
            onSelectRoom={handleSelectRoom}
            selectedRoomId={selectedRoom?.id}
            refreshRooms={refreshRooms}
            tourActionRef={roomListTourActionRef}
          />
        </div>
      </div>

      {/* Área principal de conversación */}
      <div
        className={`${
          selectedRoom ? "flex" : "hidden md:flex"
        } flex-1 min-w-0 h-full bg-[#efeae2] overflow-hidden`}
      >
        {selectedRoom ? (
          <ChatRoom
            room={selectedRoom}
            user={user}
            onUserUpdate={onUserUpdate}
            onBack={() => setSelectedRoom(null)}
            onRoomDeleted={handleRoomDeleted}
            tourActionRef={chatRoomTourActionRef}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center text-gray-500">
            <div className="max-w-md px-4">
              <p className="text-base">Selecciona una sala para comenzar.</p>
            </div>
          </div>
        )}
      </div>

      {/* Tutorial guiado */}
      <GuidedTour
        isOpen={showTour}
        onClose={() => {
          localStorage.setItem(tourStorageKey, "true");
          setShowTour(false);
        }}
        roomListActionRef={roomListTourActionRef}
        chatRoomActionRef={chatRoomTourActionRef}
        hasSelectedRoom={!!selectedRoom}
      />
    </div>
  );
};

export default MainLayout;
