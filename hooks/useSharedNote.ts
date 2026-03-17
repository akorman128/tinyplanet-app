import { useEffect, useState, useCallback } from "react";
import {
  getSharedNote,
  clearSharedNote,
  SharedNote,
} from "@/modules/SharedNoteModule";

export function useSharedNote() {
  const [sharedNote, setSharedNote] = useState<SharedNote | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkForSharedNote = useCallback(async () => {
    setIsLoading(true);
    try {
      const note = await getSharedNote();

      if (note) {
        // Validate timestamp (reject notes older than 5 minutes)
        const fiveMinutesAgo = Date.now() / 1000 - 300;
        if (note.timestamp > fiveMinutesAgo) {
          setSharedNote(note);
          return note;
        }
      }
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  const clearNote = useCallback(async () => {
    await clearSharedNote();
    setSharedNote(null);
  }, []);

  return {
    sharedNote,
    isLoading,
    checkForSharedNote,
    clearNote,
  };
}
