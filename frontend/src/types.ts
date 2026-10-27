export interface UserProfile {
  id: string;
  displayName: string;
  email?: string;
  password?: string;
  photoURL?: string;
  language: string;
  interests: string[];
  isGuest: boolean;
  createdAt?: string;
  expiresAt?: string; // Fecha en la que expira la sesión del invitado.
}

export interface Room {
  id: string;
  name: string;
  description: string;
  theme: string;
  languages: string[];
  createdBy: string;
  createdAt: string;
  isPrivate: boolean;
  inviteCode: string;
  members: string[];
  expiresAt?: string;
  typing?: Record<string, string>;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderLanguage?: string;
  text: string;
  translations: Record<string, string>;
  createdAt: string;
  readBy?: string[]; // userId
  audioData?: string; // base64 audio
  isAudioTranscription?: boolean;
}

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Português" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
];

export interface NewRoom {
  name: string;
  description: string;
  theme: string;
  languages: string[];
  isPrivate: boolean;
}
