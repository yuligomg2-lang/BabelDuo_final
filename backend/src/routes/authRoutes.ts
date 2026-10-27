import { Router } from "express";
import {
  guestLogin,
  login,
  register,
  updateUser,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/guest", guestLogin);
router.patch("/:id", updateUser);

export default router;
