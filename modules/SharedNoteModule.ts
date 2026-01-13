import { NativeModules, Platform } from "react-native";
import { SharedNote } from "@/types/sharedNote";

const { SharedNoteModule } = NativeModules;

export async function getSharedNote(): Promise<SharedNote | null> {
  if (Platform.OS !== "ios") return null;

  try {
    const note = await SharedNoteModule.getSharedNote();
    return note || null;
  } catch {
    return null;
  }
}

export async function clearSharedNote(): Promise<void> {
  if (Platform.OS !== "ios") return;

  try {
    await SharedNoteModule.clearSharedNote();
  } catch {
    // Silently fail
  }
}

export async function hasSharedNote(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;

  try {
    return await SharedNoteModule.hasSharedNote();
  } catch {
    return false;
  }
}

export type { SharedNote };
