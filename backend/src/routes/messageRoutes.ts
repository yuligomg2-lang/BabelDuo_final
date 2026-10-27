import { Router } from "express";
import {
  createMessage,
  getMessagesByRoom,
  markMessagesAsRead,
} from "../controllers/messageController.js";

const router = Router();

router.get("/:roomId", getMessagesByRoom);
router.post("/", createMessage);
router.patch("/:roomId/read", markMessagesAsRead);

export default router;
