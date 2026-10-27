import { API_URL } from "../../services/api";
import { useState } from "react";
import type { Room, UserProfile } from "../../types";
import HeaderAuth from "./HeaderAuth";
import { RoomList } from "../rooms/RoomList";
import { ChatRoom } from "../chat/ChatRoom";

interface MainLayoutProps {
  user: UserProfile;
  onUserUpdate: (user: UserProfile | null) => void;
}

const MainLayout = ({ user, onUserUpdate }: MainLayoutProps) => {
  const [, setError] = useState("");
  const [, setSuccessMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState(user?.language || "es");
  const [interests, setInterests] = useState(user?.interests?.join(", ") || "");
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [refreshRooms, setRefreshRooms] = useState(0);
  // const scrollRef = useRef<HTMLDivElement>(null);

  //Metodos
  /**
   * Actualiza la configuración del perfil del usuario
   */
  const handleSaveSettings = async () => {
    // Verificar que exista un usuario autenticado
    if (!user) return;

    // Mostrar indicador de carga
    setLoading(true);

    try {
      // Crear el objeto con los datos actualizados
      const updatedUser: UserProfile = {
        ...user,
        language,
        interests: interests
          .split(",")
          .map((i) => i.trim())
          .filter((i) => i !== ""),
      };

      // Actualizar el usuario
      const response = await fetch(`${API_URL}/api/auth/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedUser),
      });

      // Convertir la respuesta del backend
      const data = await response.json();

      // Verificar que la actualización fue exitosa
      if (!response.ok) {
        throw new Error(
          data.message ||
            "No fue posible actualizar la información del usuario",
        );
      }

      // Actualizar la sesión almacenada en el navegador
      localStorage.setItem("babel_duo_user", JSON.stringify(data.user));

      // Actualizar el estado de la aplicación
      onUserUpdate(data.user);

      // Cerrar el panel de configuración
      setShowSettings(false);

      // Mostrar mensaje de éxito
      setSuccessMessage("Configuración actualizada correctamente.");
    } catch (error: unknown) {
      const mensaje =
        error instanceof Error ? error.message : "Error al guardar cambios";

      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cierra la sesión del usuario autenticado
   * eliminando la sesión de localStorage.
   */
  const handleSignOut = async () => {
    // Eliminar únicamente la sesión actual
    localStorage.removeItem("babel_duo_user");
    localStorage.removeItem("babel_duo_room_id");

    // Limpiar el estado de la aplicación
    onUserUpdate(null);

    // Limpiar mensajes
    setError("");
    setSuccessMessage("");
  };

  /**
   * Maneja la selección de una sala desde el listado.
   * Temporalmente solo muestra la sala seleccionada.
   */
  const handleSelectRoom = (room: Room) => {
    console.log("Sala seleccionada:", room);
    setSelectedRoom(room);
  };

  const handleRoomDeleted = (roomId: string) => {
    // Si la sala eliminada era la seleccionada,
    // limpiamos la sala actual.
    if (selectedRoom?.id === roomId) {
      setSelectedRoom(null);
      setRefreshRooms((prev) => prev + 1);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-16 bg-white border-r border-gray-200"></div>

      {/* Segunda columna */}
      <div className="w-95 h-screen border-r border-gray-200  flex flex-col bg-white">
        <div className="srink-0">
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
          />
        </div>
      </div>

      {/* Tercera columna */}
      <div className="flex-1 bg-[#efeae2] overflow-hidden">
        {selectedRoom ? (
          <ChatRoom
            room={selectedRoom}
            user={user}
            onUserUpdate={onUserUpdate}
            onBack={() => setSelectedRoom(null)}
            onRoomDeleted={handleRoomDeleted}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Selecciona una sala para comenzar.
          </div>
        )}
      </div>
    </div>
  );
};

export default MainLayout;
