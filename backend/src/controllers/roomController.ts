import type { Request, Response } from "express";
import mongoose from "mongoose";
import Room from "../models/Room.js";
import User from "../models/User.js";

const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Método para crear salas
export const createRoom = async (req: Request, res: Response) => {
  try {
    const { name, description, theme, languages, createdBy, isPrivate } =
      req.body;

    // 1. Validar los datos obligatorios
    if (!name || !createdBy) {
      return res.status(400).json({
        message: "El nombre de la sala y el usuario creado son obligatorios.",
      });
    }

    //2. Verificar que el ID del usuario tenga un formato válido
    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({
        message: "El ID del usuario no es válido.",
      });
    }

    //3. Buscar al usuario que esta creando a sala
    const user = await User.findById(createdBy);

    if (!user) {
      return res.status(404).json({
        message: "El usuario creador de la sala no existe",
      });
    }

    //4. Generar codigo de invitacion
    let inviteCode = generateInviteCode();

    //5. Comprobar que el código no este utilizado
    let existingRoom = await Room.findOne({ inviteCode });

    while (existingRoom) {
      inviteCode = generateInviteCode();
      existingRoom = await Room.findOne({ inviteCode });
    }

    // 6. Crear la sala
    const newRoom = await Room.create({
      name: name.trim(),
      description: description?.trim() || "",
      theme: theme || "General",
      languages: languages || ["es"],
      createdBy: user._id,
      createdAt: new Date(),
      isPrivate: Boolean(isPrivate),
      inviteCode,
      members: [user._id],
    });

    // 7. Responder al frontend
    return res.status(201).json({
      message: "Sala creada correctamente.",
      room: {
        id: newRoom._id,
        name: newRoom.name,
        description: newRoom.description,
        theme: newRoom.theme,
        languages: newRoom.languages,
        createdBy: newRoom.createdBy,
        createdAt: newRoom.createdAt,
        isPrivate: newRoom.isPrivate,
        inviteCode: newRoom.inviteCode,
        members: newRoom.members,
        expiresAt: newRoom.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error al crear la sala:", error);

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
};

// Método para obtener salas
export const getRooms = async (req: Request, res: Response) => {
  try {
    // Obtener todas las salas de MongoDB
    const rooms = await Room.find();

    // Adaptar la estructura de MongoDB a la estructura que utiliza el frontend
    const formattedRooms = rooms.map((room) => ({
      id: room._id.toString(),
      name: room.name,
      description: room.description,
      theme: room.theme,
      languages: room.languages,
      createdBy: room.createdBy.toString(),
      createdAt: room.createdAt,
      isPrivate: room.isPrivate,
      inviteCode: room.inviteCode,
      members: room.members.map((member) => member.toString()),
      expiresAt: room.expiresAt,
    }));

    // Devolver las salas
    return res.status(200).json(formattedRooms);
  } catch (error) {
    console.error("Error al obtener las salas:", error);

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
};

// Método para obtener los miembros de una sala
export const getRoomMembers = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    // Verificar que se haya enviado el ID de la sala
    if (!roomId) {
      return res.status(400).json({
        message: "El ID de la sala es obligatorio.",
      });
    }

    // Verificar que el ID tenga un formato válido
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        message: "El ID de la sala no es válido.",
      });
    }

    // Buscar la sala
    const room = await Room.findById(roomId);

    //Verificar que la sala exista
    if (!room) {
      return res.status(404).json({
        message: "La sala no existe.",
      });
    }

    //Buscar los usuarios que pertenecen a la sala
    const members = await User.find({
      _id: { $in: room.members },
    }).select("_id username email language interests isGuest");

    // Adaptar los usuarios al formato que utiliza el frontend
    const formattedMembers = members.map((member) => ({
      id: member._id.toString(),
      displayName: member.username,
      email: member.email,
      language: member.language,
      interests: member.interests,
      isGuest: member.isGuest,
    }));

    //Devolver los miembros
    return res.status(200).json({
      members: formattedMembers,
    });
  } catch (error) {
    console.error("Error al obtener los miembros de la sala:", error);

    return res.status(500).json({
      messages: "Error interno del servidor.",
    });
  }
};

// Método para unirse a una sala
export const joinRoom = async (req: Request, res: Response) => {
  try {
    // Obtener los datos enviados por el frontend
    const { inviteCode, userId } = req.body;

    // Validar que se hayan enviado los datos obligatorios
    if (!inviteCode || !userId) {
      return res.status(400).json({
        message: "El código de invitación y el usuario son obligatorios.",
      });
    }

    // Verificar que el ID del usuario tenga un formato válido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "El ID del usuario no es válido.",
      });
    }

    // Buscar al usuario
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "El usuario no existe.",
      });
    }

    // Buscar la sala utilizando el código de invitación
    const room = await Room.findOne({
      inviteCode: inviteCode.trim().toUpperCase(),
    });

    // Verificar que la sala exista
    if (!room) {
      return res.status(400).json({
        message: "El código de invitacin no es válido.",
      });
    }

    // Convertir el ID del usuario a string para realizar la comparación
    const userIdString = user._id.toString();

    // Verificar si el usuario ya pertenece a la sala
    const alreadyMember = room.members.some(
      (member) => member.toString() === userIdString,
    );

    if (alreadyMember) {
      return res.status(400).json({
        message: "El usuario ya pertenece a esta sala",
      });
    }

    // Agregar el usuario como miembro de la sala
    room.members.push(user._id);

    // Guardar los cambios en MongoDB
    await room.save();

    // Devolver la sala actualizada
    return res.status(200).json({
      message: "Te has unido a la sala correctamente.",
      room: {
        id: room._id.toString(),
        name: room.name,
        description: room.description,
        theme: room.theme,
        languages: room.languages,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
        isPrivate: room.isPrivate,
        inviteCode: room.inviteCode,
        members: room.members.map((member) => member.toString()),
        expiresAt: room.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error al usnirse a la sala", error);

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
};

// Método para que un usuario registrado elimine una sala
export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    // Validar los datos obligatorios
    if (!roomId || !userId) {
      return res.status(400).json({
        message: "El ID de la sala y el usuario son obligatorios.",
      });
    }

    // Validar los objectId
    if (
      !mongoose.Types.ObjectId.isValid(roomId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        message: "El ID de la sala o del usuario no es válido.",
      });
    }

    // Buscar la sala
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        message: "La sala no existe.",
      });
    }

    // Verificar que el usuario sea el creador
    if (room.createdBy.toString() !== userId) {
      return res.status(403).json({
        message: "Solo el creador de la sala puede eliminarla.",
      });
    }

    // Eliminar Sala
    await Room.findByIdAndDelete(roomId);

    return res.status(200).json({
      message: "Sala eliminada correctamente.",
    });
  } catch (error) {
    console.log("Error al eliminar las sala:", error);

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
};

// Método para que un miembro abandone una sala
export const leaveRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    // Validar los datos obligatorios
    if (!roomId || !userId) {
      return res.status(400).json({
        message: "El ID de la sala y del usuario son obligatorios.",
      });
    }

    // Validar los ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(roomId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        message: "El ID de la sala o del usuario no es válido.",
      });
    }

    // Bucsar la sala
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        message: "La sala no existe",
      });
    }

    // Verificar que el usuario pertenezca a la sala
    const isMember = room.members.some(
      (member) => member.toString() === userId,
    );

    if (!isMember) {
      return res.status(400).json({
        message: "El usuario no pertenece a esta sala",
      });
    }

    // Verificar que no sea el creador
    if (room.createdBy.toString() === userId) {
      return res.status(403).json({
        message:
          "El creador de la sala no puede salir de ella. Debe eliminar la sala. ",
      });
    }

    // Eliminar al usuario de los miembros
    room.members = room.members.filter(
      (member) => member.toString() !== userId,
    );

    // Guardar los cambios
    await room.save();

    return res.status(200).json({
      message: "Has salido de la sala correctamente.",
      room: {
        id: room._id.toString(),
        name: room.name,
        description: room.description,
        theme: room.theme,
        languages: room.languages,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
        isPrivate: room.isPrivate,
        inviteCode: room.inviteCode,
        members: room.members,
        expiresAt: room.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error al salir de la salida:", error);

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
};
