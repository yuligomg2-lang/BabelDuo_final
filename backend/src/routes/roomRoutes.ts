import { Router } from "express";
import {
  createRoom,
  deleteRoom,
  getRoomMembers,
  getRooms,
  joinRoom,
  leaveRoom,
} from "../controllers/roomController.js";

const router = Router();

router.post("/create", createRoom);
router.get("/list", getRooms);
router.get("/:roomId/members", getRoomMembers);
router.post("/join", joinRoom);
router.patch("/:roomId/leave", leaveRoom);
router.delete("/:roomId", deleteRoom);

export default router;
