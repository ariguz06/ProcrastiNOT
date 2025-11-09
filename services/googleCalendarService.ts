import type { CalendarEvent } from "../types";

interface GoogleCalendarDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

interface GoogleCalendarEvent {
  status?: string;
  summary?: string;
  start?: GoogleCalendarDateTime;
  end?: GoogleCalendarDateTime;
  transparency?: string;
}

const LOOKAHEAD_DAYS = 14;

const CANDIDATE_PATHS: (string | number)[][] = [
  ["googleCalendar", "events"],
  ["googleCalendar", "items"],
  ["googleCalendar"],
  ["calendar", "events"],
  ["calendarEvents"],
  ["events"],
];

function getValueFromPath(source: unknown, path: (string | number)[]): unknown {
  return path.reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      // @ts-expect-error - dynamic access based on runtime structure.
      return current[key];
    }
    return undefined;
  }, source ?? undefined);
}

function extractRawEvents(context: unknown): GoogleCalendarEvent[] {
  if (!context) {
    return [];
  }

  if (Array.isArray(context)) {
    return context as GoogleCalendarEvent[];
  }

  for (const path of CANDIDATE_PATHS) {
    const value = getValueFromPath(context, path);
    if (Array.isArray(value)) {
      return value as GoogleCalendarEvent[];
    }
    if (value && typeof value === "object") {
      const nestedEvents = extractRawEvents(value);
      if (nestedEvents.length > 0) {
        return nestedEvents;
      }
    }
  }

  return [];
}

function toISODateTime(dateTime?: GoogleCalendarDateTime): string | null {
  if (!dateTime) {
    return null;
  }

  try {
    if (dateTime.dateTime) {
      return new Date(dateTime.dateTime).toISOString();
    }

    if (dateTime.date) {
      // Treat all-day events as starting at midnight in their provided timezone (if any).
      // Falling back to UTC keeps the value parseable for downstream formatting.
      const tzSuffix = dateTime.timeZone ? "" : "Z";
      return new Date(`${dateTime.date}T00:00:00${tzSuffix}`).toISOString();
    }
  } catch (error) {
    console.warn("Unable to parse Google Calendar date", dateTime, error);
  }

  return null;
}

export function normalizeGoogleCalendarEvents(rawEvents: GoogleCalendarEvent[]): CalendarEvent[] {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const lookAheadLimit = new Date(startOfWeek);
  lookAheadLimit.setDate(lookAheadLimit.getDate() + LOOKAHEAD_DAYS);

  return rawEvents
    .filter(event => event && event.status !== "cancelled")
    .map<CalendarEvent | null>((event) => {
      const startTime = toISODateTime(event.start);
      let endTime = toISODateTime(event.end);

      if (!startTime) {
        return null;
      }

      if (!endTime) {
        endTime = startTime;
      }

      return {
        title: event.summary?.trim() || "Calendar Event",
        startTime,
        endTime,
      };
    })
    .filter((event): event is CalendarEvent => !!event)
    .filter(event => {
      const start = new Date(event.startTime).getTime();
      const end = new Date(event.endTime).getTime();

      if (Number.isNaN(start) || Number.isNaN(end)) {
        return false;
      }

      const windowStart = startOfWeek.getTime();
      const windowEnd = lookAheadLimit.getTime();

      return end >= windowStart && start <= windowEnd;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

async function getContextObjects(): Promise<unknown[]> {
  if (typeof window === "undefined") {
    return [];
  }

  const contexts: unknown[] = [];
  const aiContext = (window as unknown as { ai?: unknown }).ai;

  if (aiContext && typeof aiContext === "object") {
    const directContext = (aiContext as { context?: unknown }).context;
    if (directContext) {
      contexts.push(directContext);
    }

    const getContextFn = (aiContext as { getContext?: () => Promise<unknown> }).getContext;
    if (typeof getContextFn === "function") {
      try {
        const resolved = await getContextFn();
        if (resolved) {
          contexts.push(resolved);
        }
      } catch (error) {
        console.warn("Failed to retrieve AI context", error);
      }
    }
  }

  return contexts;
}

export async function fetchGoogleCalendarEvents(): Promise<CalendarEvent[]> {
  const contexts = await getContextObjects();

  for (const context of contexts) {
    const rawEvents = extractRawEvents(context);
    if (rawEvents.length > 0) {
      return normalizeGoogleCalendarEvents(rawEvents);
    }
  }

  return [];
}

