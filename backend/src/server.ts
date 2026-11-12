import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dns from "node:dns";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Carga las variables del archivo .env dentro de process.env.
dotenv.config();

const app = express();

// Crear servidor HTTP
const httpServer = http.createServer(app);

// Crear servidor Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://babel-duo-frontend.onrender.com",
    ],
    methods: ["GET", "POST"],
  },
});

// Usuarios conectados por sala
const onlineUsers = new Map<
  string,
  Map<
    string,
    {
      userName: string;
      socketIds: Set<string>;
    }
  >
>();

// Salas y usuarios asociados a cada conexión Socket.IO
const socketPresence = new Map<string, Map<string, string>>();

// Enviar la lista actualizada de usuarios conectados a una sala
const emitOnlineUsers = (roomId: string) => {
  const users = onlineUsers.get(roomId);

  const usersList = users
    ? Array.from(users.entries()).map(([userId, data]) => ({
        userId,
        userName: data.userName,
      }))
    : [];

  io.to(roomId).emit("online-users", usersList);
};

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("🚀 Backend de Babel Duo funcionando");
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("🔌 Usuario conectado:", socket.id);

  // El usuario se une a una sala
  socket.on("join-room", ({ roomId, userId, userName }) => {
    if (!roomId || !userId || !userName) return;

    socket.join(roomId);

    // Obtener o crear el registro de usuarios de la sala
    if (!onlineUsers.has(roomId)) {
      onlineUsers.set(roomId, new Map());
    }

    const roomUsers = onlineUsers.get(roomId)!;

    // Obtener o crear el registro del usuario
    if (!roomUsers.has(userId)) {
      roomUsers.set(userId, {
        userName,
        socketIds: new Set(),
      });
    }

    const userData = roomUsers.get(userId)!;

    // Registrar esta conexión
    userData.userName = userName;
    userData.socketIds.add(socket.id);

    // Registrar las salas asociadas a esta conexión
    if (!socketPresence.has(socket.id)) {
      socketPresence.set(socket.id, new Map());
    }

    socketPresence.get(socket.id)!.set(roomId, userId);

    console.log(`👤 ${userName} está en línea en la sala ${roomId}`);

    // Actualizar la lista para todos los participantes
    emitOnlineUsers(roomId);
  });

  // Enviar la lista actual de usuarios conectados
  socket.on("get-online-users", ({ roomId }) => {
    if (!roomId) return;

    // Obtener los usuarios conectados a la sala
    const roomUsers = onlineUsers.get(roomId);

    const usersList = roomUsers
      ? Array.from(roomUsers.entries()).map(([userId, data]) => ({
          userId,
          userName: data.userName,
        }))
      : [];

    // Enviar la lista únicamente a quien la solicitó
    socket.emit("online-users", usersList);

    console.log(`📋 Lista de usuarios conectados solicitada: ${roomId}`);
  });

  // El usuario abandona una sala
  socket.on("leave-room", ({ roomId }) => {
    socket.leave(roomId);

    // Identificar al usuario asociado a esta conexión
    const userId = socketPresence.get(socket.id)?.get(roomId);

    if (!userId) return;

    const roomUsers = onlineUsers.get(roomId);
    const userData = roomUsers?.get(userId);

    if (userData) {
      // Eliminar esta conexión del usuario
      userData.socketIds.delete(socket.id);

      // Si no tiene más conexiones, marcarlo como desconectado
      if (userData.socketIds.size === 0) {
        roomUsers?.delete(userId);
      }
    }

    // Eliminar el registro de esta sala en la conexión
    const socketRooms = socketPresence.get(socket.id);

    socketRooms?.delete(roomId);

    if (socketRooms?.size === 0) {
      socketPresence.delete(socket.id);
    }

    // Eliminar el registro de la sala si quedó vacía
    if (roomUsers?.size === 0) {
      onlineUsers.delete(roomId);
    }

    console.log(`👋 Usuario ${userId} salió de la sala ${roomId}`);

    // Informar a los demás participantes
    emitOnlineUsers(roomId);
  });

  // El usuario envía un mensaje
  socket.on("send-message", (message) => {
    console.log("📨 Mensaje recibido por Socket.IO:", message);

    socket.to(message.roomId).emit("receive-message", message);
  });

  // El Usuario comenzó a escribir
  socket.on("typing", ({ roomId, userId, userName }) => {
    socket.to(roomId).emit("user-typing", {
      userId,
      userName,
    });
  });

  // Usuario dejó de escribir
  socket.on("stop-typing", ({ roomId, userId }) => {
    socket.to(roomId).emit("user-stop-typing", {
      userId,
    });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Usuario desconectado:", socket.id);

    // Obtener las salas asociadas a esta conexión
    const socketRooms = socketPresence.get(socket.id);

    if (!socketRooms) return;

    // Recorrer todas las salas donde estaba conectado
    socketRooms.forEach((userId, roomId) => {
      const roomUsers = onlineUsers.get(roomId);
      const userData = roomUsers?.get(userId);

      if (userData) {
        // Eliminar la conexión desconectada
        userData.socketIds.delete(socket.id);

        // Si no tiene más conexiones, eliminar al usuario
        if (userData.socketIds.size === 0) {
          roomUsers?.delete(userId);
        }
      }

      // Eliminar la sala si ya no tiene usuarios conectados
      if (roomUsers?.size === 0) {
        onlineUsers.delete(roomId);
      }

      // Actualizar la lista de usuarios conectados
      emitOnlineUsers(roomId);
    });

    // Eliminar el registro de esta conexión
    socketPresence.delete(socket.id);
  });

  //El usuario leyo un mensaje
  socket.on("messages-read", ({ roomId, userId }) => {
    socket.to(roomId).emit("messages-read", {
      roomId,
      userId,
    });
  });
});

//Obtiene el puerto definido en el archivo .env.
// o utiliza el puerto 3000 por defecto.
const PORT = process.env.PORT || 3000;

// Iniciar servidor
const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  });
};

startServer();
