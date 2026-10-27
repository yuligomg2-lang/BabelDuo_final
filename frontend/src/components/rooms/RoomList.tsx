import { API_URL } from "../../services/api";
import React, { useState, useEffect } from "react";
import type { Message, Room, UserProfile } from "../../types";
import { MessageSquare } from "lucide-react";
import { AnimatePresence } from "motion/react";
import RoomSearch from "./RoomSearch";
import RoomCard from "./RoomCard";
import RoomJoinModal from "./RoomJoinModal";
import RoomCreateModal from "./RoomCreateModal";
import { socket } from "../../services/socket";

interface RoomListProps {
  user: UserProfile;
  onSelectRoom: (room: Room) => void;
  selectedRoomId?: string;
  refreshRooms: number;
}

interface NewRoom {
  name: string;
  description: string;
  theme: string;
  languages: string[];
  isPrivate: boolean;
}

export const RoomList: React.FC<RoomListProps> = ({
  user,
  onSelectRoom,
  selectedRoomId,
  refreshRooms,
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [lastMessages, setLastMessages] = useState<
    Record<string, Message | null>
  >({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [newRoom, setNewRoom] = useState<NewRoom>({
    name: "",
    description: "",
    theme: "General",
    languages: ["es"],
    isPrivate: false,
  });

  /**
   * Obtiene el último mensaje de cada sala
   * y calcula cuántos mensajes no han sido leídos.
   */
  const fetchLastMessages = async (userRooms: Room[]) => {
    try {
      const messagesByRoom: Record<string, Message | null> = {};
      const unreadByRoom: Record<string, number> = {};

      await Promise.all(
        userRooms.map(async (room) => {
          try {
            const response = await fetch(`${API_URL}/api/messages/${room.id}`);

            if (!response.ok) {
              messagesByRoom[room.id] = null;
              unreadByRoom[room.id] = 0;
              return;
            }

            const messages: Message[] = await response.json();

            if (messages.length === 0) {
              messagesByRoom[room.id] = null;
              unreadByRoom[room.id] = 0;
              return;
            }

            // El backend ya devuelve los mensajes ordenados
            // de más antiguo a más reciente.
            const lastMessage = messages[messages.length - 1];

            messagesByRoom[room.id] = lastMessage;

            // Contar mensajes que el usuario todavía no ha leído.
            const unread = messages.filter(
              (message) =>
                message.senderId !== user.id &&
                !(message.readBy || []).includes(user.id),
            ).length;

            unreadByRoom[room.id] = unread;
          } catch (error) {
            console.error(
              `Error al obtener mensajes de la sala ${room.id}:`,
              error,
            );

            messagesByRoom[room.id] = null;
            unreadByRoom[room.id] = 0;
          }
        }),
      );

      setLastMessages(messagesByRoom);
      setUnreadCounts(unreadByRoom);
    } catch (error) {
      console.error("Error al obtener últimos mensajes:", error);
    }
  };

  /**
   * Obtiene las salas del usuario autenticado.
   */
  const fetchRooms = async () => {
    // Mostrar indicador de carga
    setLoading(true);

    try {
      // Obtener todas las salas registradas
      const response = await fetch(`${API_URL}/api/rooms/list`);

      // Verificar que la petición fue exitosa
      if (!response.ok) {
        throw new Error("Error al obtener las salas");
      }

      // Convertir la respuesta en un arreglo de salas
      const data: Room[] = await response.json();

      // Filtrar únicamente las salas donde el usuario pertenece
      const userRooms = data.filter((room) => room.members.includes(user.id));

      // Actualizar el listado de salas
      setRooms(userRooms);
      await fetchLastMessages(userRooms);
    } catch (error) {
      setError("Error al cargar salas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [user.id, refreshRooms]);

  useEffect(() => {
    if (!rooms.length) return;

    const handleConnect = () => {
      console.log("📡 RoomList conectado a Socket.IO");

      // Unirse a todas las salas del usuario.
      rooms.forEach((room) => {
        socket.emit("join-room", {
          roomId: room.id,
          userId: user.id,
        });
      });
    };

    const handleReceiveMessage = (message: Message) => {
      console.log("📩 RoomList recibió mensaje:", message);

      // Actualizar último mensaje de esa sala
      setLastMessages((prev) => ({
        ...prev,
        [message.roomId]: message,
      }));

      // Si la sala está abierta, no mostrar notificación
      if (message.roomId === selectedRoomId) {
        return;
      }

      // Si el mensaje lo envió el usuario actual,
      // NO aumentar las notificaciones
      if (String(message.senderId) === String(user.id)) {
        return;
      }

      // Solo los mensajes recibidos de otros usuarios
      // aumentan el contador
      setUnreadCounts((prev) => ({
        ...prev,
        [message.roomId]: (prev[message.roomId] || 0) + 1,
      }));
    };

    socket.on("connect", handleConnect);
    socket.on("receive-message", handleReceiveMessage);

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("receive-message", handleReceiveMessage);
    };
  }, [rooms, user.id, selectedRoomId]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar que el nombre no esté vacío
    if (!newRoom.name.trim()) return;

    try {
      setLoading(true);

      // Enviar los datos al backend
      const response = await fetch(`${API_URL}/api/rooms/create`, {
        method: "POST",
        headers: {
          "content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newRoom.name,
          description: newRoom.description,
          theme: newRoom.theme,
          languages: newRoom.languages,
          createdBy: user.id,
          isPrivate: newRoom.isPrivate,
        }),
      });

      // Verificar si el backend respondió correctamente
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No fue posible crear la sala");
      }

      console.log("Sala creada:", data.room);

      const createdRoom: Room = data.room;

      // Agregar la nueva sala al listado
      setRooms((prev) => [createdRoom, ...prev]);

      // Cerrar modal
      setIsModalOpen(false);

      // Limpiar formulario
      setNewRoom({
        name: "",
        description: "",
        theme: "General",
        languages: ["es"],
        isPrivate: false,
      });
      // Seleccionar la sala recién creada
      onSelectRoom(createdRoom);
    } catch (err: any) {
      console.error("Error al crear sala:", err);
      alert(err.message || "Error al crear la sala");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Permite a un usuario unirse a una sala utilizando
   * un código de invitación.
   */
  const handleJoinRoom = async (e: React.FormEvent) => {
    // Evitar que el formulario recargue la página
    e.preventDefault();

    // Verificar que el usuario haya escrito un código
    if (!joinCode.trim()) return;

    try {
      // Mostrar indicador de carga
      setLoading(true);

      // Solicitar al backend unirse a la sala
      const response = await fetch(`${API_URL}/api/rooms/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteCode: joinCode.trim(),
          userId: user.id,
        }),
      });

      // Convertir la respuesta del backend
      const data = await response.json();

      console.log("Datos enviados:", {
        inviteCode: joinCode.trim(),
        userId: user.id,
      });

      console.log("Respuesta del servidor:", data);

      // Verificar si la petición fue exitosa
      if (!response.ok) {
        throw new Error(data.message || "No fue posible obtener las sala.");
      }

      // Obtener la sala actualizda
      const room: Room = data.room;

      // Agregar la sala al listado local
      setRooms((prev) => {
        // Evitar agregarla dos veces
        if (prev.some((r) => r.id === room.id)) {
          return prev;
        }

        return [room, ...prev];
      });

      // Cerrar el modal de ingreso
      setIsJoinModalOpen(false);

      // Limpiar el campo del código
      setJoinCode("");

      // Seleccionar la sala para abrir la conversación
      onSelectRoom(room);
    } catch (error: any) {
      // Mostrar el mensaje de error correspondiente
      setError(error.message || "Error al unirse a la sala.");
    } finally {
      // Ocultar el indicador de carga
      setLoading(false);
    }
  };

  const handleRoomDeleted = (roomId: string) => {
    setRooms((prevRooms) => prevRooms.filter((room) => room.id !== roomId));
  };

  const handleSelectRoom = async (room: Room) => {
    // Quitar inmediatamente la notificación visual
    setUnreadCounts((prev) => ({
      ...prev,
      [room.id]: 0,
    }));

    try {
      const response = await fetch(`${API_URL}/api/messages/${room.id}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();

        console.error(
          "No se pudieron marcar los mensajes como leídos:",
          data.message,
        );
      } else {
        // Avisar a los demás usuarios que cambió el estado de lectura
        socket.emit("messages-read", {
          roomId: room.id,
          userId: user.id,
        });
      }
    } catch (error) {
      console.error("Error al marcar mensajes como leídos:", error);
    }

    // Finalmente, pedirle a MainLayout que abra la sala
    onSelectRoom(room);
  };

  useEffect(() => {
    const handleLocalMessage = (event: Event) => {
      const customEvent = event as CustomEvent<Message>;
      const message = customEvent.detail;

      if (!message?.roomId) return;

      console.log("📤 Mensaje enviado por mí:", message);

      // Actualizar inmediatamente el último mensaje
      setLastMessages((prev) => ({
        ...prev,
        [message.roomId]: message,
      }));
    };

    window.addEventListener("babelduo-message-sent", handleLocalMessage);

    return () => {
      window.removeEventListener("babelduo-message-sent", handleLocalMessage);
    };
  }, []);

  const filteredRooms = Array.isArray(rooms)
    ? rooms.filter(
        (room) =>
          room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          room.theme.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];
  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]">
      <RoomSearch
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onJoin={() => setIsJoinModalOpen(true)}
        onCreate={() => setIsModalOpen(true)}
        isGuest={user.isGuest ?? false}
      />

      <div className="flex-1 overflow-y-auto divide-y divide-[#f0f2f5] bg-white custom-scrollbar">
        {filteredRooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            selectedRoomId={selectedRoomId}
            onSelectRoom={handleSelectRoom}
            lastMessage={lastMessages[room.id]}
            unreadCount={unreadCounts[room.id] || 0}
          />
        ))}

        {filteredRooms.length === 0 && !loading && (
          <div className="text-center py-16 px-4 bg-gray-50/50">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-60" />
            <p className="text-xs text-gray-400">No se encontraron salas</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isJoinModalOpen && (
          <RoomJoinModal
            loading={loading}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            onClose={() => setIsJoinModalOpen(false)}
            onSubmit={handleJoinRoom}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <RoomCreateModal
            loading={loading}
            newRoom={newRoom}
            setNewRoom={setNewRoom}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleCreateRoom}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
