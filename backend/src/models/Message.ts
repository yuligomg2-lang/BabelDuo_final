import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true,
  },

  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  senderName: {
    type: String,
    required: true,
    trim: true,
  },

  senderLanguage: {
    type: String,
    default: "es",
  },

  text: {
    type: String,
    required: true,
  },

  translations: {
    type: Map,
    of: String,
    default: {},
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  readBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  audioData: {
    type: String,
  },

  isAudioTranscription: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("Message", messageSchema);
