import type { CalendarEvent, WeeklySchedule, ScheduleItem, ToDoTask } from "../types";

const BACKEND_URL = "http://localhost:5000";

/**
 * Starts Google OAuth flow and fetches real calendar events for the upcoming week.
 * Uses your backend to handle tokens securely.
 */
export async function signInAndFetchEvents(weekStart?: Date): Promise<CalendarEvent[]> {
  console.log("Connecting to Google Calendar...");

  // 1️⃣ Redirect user to Google Sign-In
  const authUrlRes = await fetch(`${BACKEND_URL}/auth/url`);
  const { url } = await authUrlRes.json();
  window.location.href = url;

  // 👇 This function won’t continue after redirect — user will be sent back to app with ?code=
  return Promise.resolve([]);
}

/**
 * Handles Google OAuth callback when redirected back to your app.
 * Exchanges the code for tokens through your backend, and saves the access token locally.
 */
export async function handleGoogleCallback(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return;

  const tokenRes = await fetch(`${BACKEND_URL}/auth/callback?code=${code}`);
  const tokens = await tokenRes.json();

  if (tokens.access_token) {
    localStorage.setItem("google_access_token", tokens.access_token);
    console.log("✅ Google access token saved successfully.");
  } else {
    console.error("Failed to receive access token from backend.");
  }

  // Remove the code query param from URL
  window.history.replaceState({}, document.title, window.location.pathname);
}

/**
 * Fetches the next 10 Google Calendar events from the user's primary calendar.
 */
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const token = localStorage.getItem("google_access_token");
  if (!token) throw new Error("No Google access token found. Please sign in first.");

  const res = await fetch(`${BACKEND_URL}/calendar/events`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.error("Error fetching events:", await res.text());
    throw new Error("Failed to load calendar events.");
  }

  const events = await res.json();
  console.log("Fetched events:", events);

  return events.map((event: any) => ({
    title: event.summary,
    startTime: event.start?.dateTime || event.start?.date,
    endTime: event.end?.dateTime || event.end?.date,
  }));
}

/**
 * Pushes the AI-generated weekly schedule and tasks to Google Calendar
 * through your backend (requires extended Calendar API scopes).
 */
export async function addScheduleToCalendar(
  schedule: WeeklySchedule,
  tasks: ToDoTask[],
  weekStart: Date
): Promise<void> {
  const token = localStorage.getItem("google_access_token");
  if (!token) throw new Error("No access token found.");

  const payload = { schedule, tasks, weekStart };

  const res = await fetch(`${BACKEND_URL}/calendar/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error("Failed to push schedule to Google Calendar:", await res.text());
    throw new Error("Calendar sync failed.");
  }

  console.log("✅ Schedule successfully pushed to Google Calendar.");
}
