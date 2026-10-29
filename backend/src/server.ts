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
  socket.on("join-room", ({ roomId, userId }) => {
    socket.join(roomId);

    console.log(`👤 Usuario ${userId} se unio a la sala ${roomId}`);
  });

  // El usuario abandona una sala
  socket.on("leave-room", ({ roomId, userId }) => {
    socket.leave(roomId);

    console.log(`👋 Usuario ${userId} salió de la sala ${roomId}`);
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
