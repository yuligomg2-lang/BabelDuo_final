import type { Request, Response } from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import Room from "../models/Room.js";
import User from "../models/User.js";

// Método para obtener los mensajes de una sala
export const getMessagesByRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    // Verificar que se haya enviado el ID de la sala
    if (!roomId) {
      return res.status(400).json({
        message: "El ID de la sala es obligatorio",
      });
    }

    // Verificar que el ID tenga un formato válido
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        message: "El ID de la sala no es válido.",
      });
    }

    // Buscar los mensajes de la sala
    const messages = await Message.find({
      roomId,
    }).sort({ createdAt: 1 });

    // Adaptar los mensajes al formato que utiliza frontend
    const formattedMessages = messages.map((message) => ({
      id: message._id.toString(),
      roomId: message.roomId.toString(),
      senderId: message.senderId.toString(),
      senderName: message.senderName,
      senderLanguage: message.senderLanguage,
      text: message.text,
      translations: Object.fromEntries(message.translations),
      createdAt: message.createdAt,
      readBy: message.readBy,
      audioData: message.audioData,
      isAudioTranscription: message.isAudioTranscription,
    }));

    // Devolver los mensajes
    return res.status(200).json(formattedMessages);
  } catch (error) {
    console.error("Error al obtener los mensajes de la sala:", error);

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
};

// Método para crear un mensaje
export const createMessage = async (req: Request, res: Response) => {
  try {
    // Obtener los datos enviados por el frontend
    const {
      roomId,
      senderId,
      senderName,
      senderLanguage,
      text,
      translations,
      audioData,
      isAudioTranscription,
    } = req.body;

    // Válidar los datos obligatorios
    if (!roomId || !senderId || !senderName || !text) {
      return res.status(400).json({
        message:
          "El ID de la sala, el usuario, el nombre del remitente y el texto son obligatorios.",
      });
    }

    // Verificar que roomId y senderId tengan un formato válido
    if (
      !mongoose.Types.ObjectId.isValid(roomId) ||
      !mongoose.Types.ObjectId.isValid(senderId)
    ) {
      return res.status(400).json({
        message: "EL ID de la sala o del usuario no es válido.",
      });
    }

    // Buscar la sala
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        message: "la sala no exite.",
      });
    }

    // Buscar el usuario
    const user = await User.findById(senderId);

    if (!user) {
      return res.status(404).json({
        message: "El usuario no exite",
      });
    }

    // Verificar que el usuario pertenezca a la sala
    const isMember = room.members.some(
      (member) => member.toString() === senderId,
    );

    if (!isMember) {
      return res.status(403).json({
        message: "El usuario no pertenece a esta sala.",
      });
    }

    // Crear el mensaje
    const newMessage = await Message.create({
      roomId,
      senderId,
      senderName: senderName.trim(),
      senderLanguage: senderLanguage || "es",
      text: text.trim(),
      translations: translations || {},
      readBy: [senderId],
      audioData,
      isAudioTranscription: Boolean(isAudioTranscription),
    });

    // Adaptar el mensaje al formato que usa el frontend
    const formattedMessage = {
      id: newMessage._id.toString(),
      roomId: newMessage.roomId.toString(),
      senderId: newMessage.senderId.toString(),
      senderName: newMessage.senderName,
      senderLanguage: newMessage.senderLanguage,
      text: newMessage.text,
      translations: Object.fromEntries(newMessage.translations),
      createdAt: newMessage.createdAt.toISOString(),
      readBy: newMessage.readBy.map((userId) => userId.toString()),
      audioData: newMessage.audioData,
      isAudioTranscription: newMessage.isAudioTranscription,
    };

    // Devolver el mensaje creado
    return res.status(201).json({
      message: "mensaje creado correctamente.",
      data: formattedMessage,
    });
  } catch (error) {
    console.error("Error al crear el mensaje.", error);

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
};

// Método para marcar como leídos los mensajes de una sala
export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    // Validar datos obligatorios
    if (!roomId || !userId) {
      return res.status(400).json({
        message: "El ID de la sala y el usuario son obligatorios.",
      });
    }

    // Validar ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(roomId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        message: "El ID de la sala o del usuario no es válido.",
      });
    }

    // Verificar que la sala exista
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        message: "La sala no existe.",
      });
    }

    // Verificar que el usuario pertenezca a la sala
    const isMember = room.members.some(
      (member) => member.toString() === userId,
    );

    if (!isMember) {
      return res.status(403).json({
        message: "El usuario no pertenece a esta sala.",
      });
    }

    // Agregar el usuario a readBy de los mensajes
    // que todavía no haya leído.
    await Message.updateMany(
      {
        roomId,
        senderId: { $ne: userId },
        readBy: { $ne: userId },
      },
      {
        $addToSet: {
          readBy: userId,
        },
      },
    );

    return res.status(200).json({
      message: "Mensajes marcados como leídos.",
    });
  } catch (error) {
    console.error("Error al marcar mensajes como leídos:", error);

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
};
