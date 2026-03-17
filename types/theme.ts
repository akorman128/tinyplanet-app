export interface EmojiBorderSettings {
  emojis: string[];
  enabled: boolean;
}

export interface ProfileThemeSettings {
  fontFamily: string | null;
  backgroundColor: string | null;
  fontColor: string | null;
  emojiBorder: EmojiBorderSettings | null;
}

export const DEFAULT_EMOJI_BORDER: EmojiBorderSettings = {
  emojis: ["🫦", "🕶️", "👠"],
  enabled: false,
};

export const DEFAULT_THEME: ProfileThemeSettings = {
  fontFamily: null,
  backgroundColor: "#faf9f5", // cream
  fontColor: "#000000", // black
  emojiBorder: null,
};

export interface PresetTheme {
  id: string;
  name: string;
  backgroundColor: string;
  fontColor: string;
  emojis: string[];
}

export const PRESET_THEMES: PresetTheme[] = [
  {
    id: "brat",
    name: "Brat",
    backgroundColor: "#8ACE00",
    fontColor: "#1A1A1A",
    emojis: ["👠", "🕶️", "💄"],
  },
  {
    id: "fat",
    name: "Fat",
    backgroundColor: "#D62828",
    fontColor: "#FFFFFF",
    emojis: ["🍔", "🍕", "🍗"],
  },
  {
    id: "cat",
    name: "Cat",
    backgroundColor: "#CC5500",
    fontColor: "#FFFFFF",
    emojis: ["😻", "🙀", "😹"],
  },
  {
    id: "scat",
    name: "Scat",
    backgroundColor: "#5C4033",
    fontColor: "#F5F0E6",
    emojis: ["🧻", "💩", "🚽"],
  },
  {
    id: "chat",
    name: "Chat",
    backgroundColor: "#1DA1F2",
    fontColor: "#FFFFFF",
    emojis: ["🗣️", "💬", "🔊"],
  },
  {
    id: "gyatt",
    name: "Gyatt",
    backgroundColor: "#FF69B4",
    fontColor: "#FFFFFF",
    emojis: ["🍑", "🍆", "💦"],
  },
];
