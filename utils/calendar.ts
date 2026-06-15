import * as Calendar from "expo-calendar";
import { Alert, Platform } from "react-native";
import { HANG_DURATION_MS } from "./hangTime";
import { logger } from "./logger";

interface CalendarHang {
  title: string;
  description?: string | null;
  location_name: string;
  starts_at: string;
}

async function getWritableCalendarId(): Promise<string | null> {
  if (Platform.OS === "ios") {
    const def = await Calendar.getDefaultCalendarAsync();
    // The default may be a read-only calendar (e.g. a subscribed/holiday one).
    if (def?.id && def.allowsModifications) return def.id;
  }
  const calendars = await Calendar.getCalendarsAsync(
    Calendar.EntityTypes.EVENT
  );
  const writable = calendars.find((c) => c.allowsModifications) ?? null;
  return writable?.id ?? null;
}

/**
 * Add a Hang to the device's default calendar. The event spans the Hang's
 * active window (start → start + HANG_DURATION_MS). Handles permission denial.
 */
export async function addHangToCalendar(hang: CalendarHang): Promise<void> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Calendar access needed",
        "Enable calendar access in Settings to add this Hang."
      );
      return;
    }

    const calendarId = await getWritableCalendarId();
    if (!calendarId) {
      Alert.alert(
        "No calendar",
        "Couldn't find a calendar to add this Hang to."
      );
      return;
    }

    const start = new Date(hang.starts_at);
    const end = new Date(start.getTime() + HANG_DURATION_MS);

    await Calendar.createEventAsync(calendarId, {
      title: hang.title,
      notes: hang.description ?? undefined,
      location: hang.location_name,
      startDate: start,
      endDate: end,
    });

    Alert.alert(
      "Added to calendar",
      `"${hang.title}" was added to your calendar.`
    );
  } catch (err) {
    logger.error("Error adding hang to calendar:", err);
    Alert.alert("Error", "Couldn't add this Hang to your calendar.");
  }
}
