import { Router } from "express";
import {
  createMessage,
  getMessagesByRoom,
  markMessagesAsRead,
  saveMessageTranslation,
} from "../controllers/messageController.js";

const router = Router();

router.get("/:roomId", getMessagesByRoom);
router.post("/", createMessage);
router.patch("/:roomId/read", markMessagesAsRead);
router.patch("/:messageId/translation", saveMessageTranslation);

export default router;
