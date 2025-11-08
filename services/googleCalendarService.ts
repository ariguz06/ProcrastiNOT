import type { CalendarEvent, WeeklySchedule, ScheduleItem, ToDoTask } from "../types";

// This is a placeholder for the real Google API client.
// In a real app, you would initialize this after the gapi script loads.
declare const gapi: any;

/**
 * Initiates the Google Sign-In and fetches calendar events for the upcoming week.
 * 
 * NOTE: This is a MOCK implementation. To make it real, you would need to:
 * 1. Set up a project in the Google Cloud Console.
 * 2. Enable the Google Calendar API.
 * 3. Create OAuth 2.0 Client ID credentials.
 * 4. Replace the mock data logic with actual `gapi` calls as commented below.
 */
export async function signInAndFetchEvents(): Promise<CalendarEvent[]> {
    console.log("Attempting to sync with Google Calendar...");

    // --- REAL IMPLEMENTATION EXAMPLE ---
    /*
    const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';
    const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
    const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
    // NOTE: To add events, scope must be changed to 'https://www.googleapis.com/auth/calendar.events'
    const SCOPES = "https://www.googleapis.com/auth/calendar.events";

    return new Promise((resolve, reject) => {
        gapi.load('client:auth2', () => {
            gapi.client.init({
                apiKey: GOOGLE_API_KEY,
                clientId: GOOGLE_CLIENT_ID,
                discoveryDocs: DISCOVERY_DOCS,
                scope: SCOPES,
            }).then(() => {
                if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
                    gapi.auth2.getAuthInstance().signIn();
                }
                
                const timeMin = new Date().toISOString();
                const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

                gapi.client.calendar.events.list({
                    'calendarId': 'primary',
                    'timeMin': timeMin,
                    'timeMax': timeMax,
                    'showDeleted': false,
                    'singleEvents': true,
                    'maxResults': 20,
                    'orderBy': 'startTime'
                }).then(response => {
                    const events = response.result.items.map(event => ({
                        title: event.summary,
                        startTime: event.start.dateTime || event.start.date,
                        endTime: event.end.dateTime || event.end.date,
                    }));
                    resolve(events);
                }).catch(reject);
            }).catch(reject);
        });
    });
    */
    
    // --- MOCK IMPLEMENTATION ---
    // Simulating a network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log("Using mock calendar data for demonstration.");

    const today = new Date();
    const getNextDayOfWeek = (date: Date, dayOfWeek: number) => { // 0=Sunday, 1=Monday, ...
        const resultDate = new Date(date.getTime());
        const currentDay = date.getDay();
        const distance = (dayOfWeek - currentDay + 7) % 7;
        resultDate.setDate(date.getDate() + distance);
        if (distance === 0 && resultDate.getTime() < date.getTime()) {
             resultDate.setDate(date.getDate() + 7);
        }
        return resultDate;
    }

    const mockEvents: CalendarEvent[] = [
        {
            title: "Data Structures Lecture",
            startTime: new Date(getNextDayOfWeek(today, 1).setHours(10, 0, 0, 0)).toISOString(),
            endTime: new Date(getNextDayOfWeek(today, 1).setHours(11, 30, 0, 0)).toISOString(),
        },
        {
            title: "Team Project Meeting",
            startTime: new Date(getNextDayOfWeek(today, 2).setHours(15, 0, 0, 0)).toISOString(),
            endTime: new Date(getNextDayOfWeek(today, 2).setHours(16, 0, 0, 0)).toISOString(),
        },
        {
            title: "Dentist Appointment",
            startTime: new Date(getNextDayOfWeek(today, 3).setHours(14, 0, 0, 0)).toISOString(),
            endTime: new Date(getNextDayOfWeek(today, 3).setHours(14, 30, 0, 0)).toISOString(),
        },
         {
            title: "Data Structures Lecture",
            startTime: new Date(getNextDayOfWeek(today, 3).setHours(10, 0, 0, 0)).toISOString(),
            endTime: new Date(getNextDayOfWeek(today, 3).setHours(11, 30, 0, 0)).toISOString(),
        },
    ];

    return Promise.resolve(mockEvents);
}


/**
 * Pushes the generated weekly schedule and defined deadlines to the user's Google Calendar.
 * 
 * NOTE: This is a MOCK implementation. A real implementation would require
 * write access scope ('https://www.googleapis.com/auth/calendar.events')
 * and use `gapi.client.calendar.events.insert`.
 */
export async function addScheduleToCalendar(schedule: WeeklySchedule, tasks: ToDoTask[], weekStart: Date): Promise<void> {
  console.log("Simulating: Adding AI-generated schedule and deadlines to Google Calendar...");
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

  const dayNameToIndex: Record<keyof WeeklySchedule, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const createdEvents: any[] = [];
  
  // 1. Add AI-generated study blocks
  for (const dayName in schedule) {
    const dayKey = dayName as keyof WeeklySchedule;
    const items = schedule[dayKey] as ScheduleItem[];
    const dayIndex = dayNameToIndex[dayKey];

    if (!items) continue;

    for (const item of items) {
      if (item.type === 'study' || item.type === 'deadline_work') {
        try {
          const [startTimeStr, endTimeStr] = item.time.replace(/\s/g, '').split('-');
          if (!startTimeStr || !endTimeStr) continue;

          const [startHour, startMinute] = startTimeStr.split(':').map(Number);
          const [endHour, endMinute] = endTimeStr.split(':').map(Number);

          const getEventDate = (hour: number, minute: number): Date => {
            const eventDate = new Date(weekStart);
            eventDate.setDate(weekStart.getDate() + dayIndex);
            eventDate.setHours(hour, minute, 0, 0);
            return eventDate;
          };

          const startDate = getEventDate(startHour, startMinute);
          const endDate = getEventDate(endHour, endMinute);

          const event = {
            'summary': item.task,
            'description': 'Scheduled by Gemini Weekly Planner.',
            'start': {
              'dateTime': startDate.toISOString(),
              'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            'end': {
              'dateTime': endDate.toISOString(),
              'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            // Color coding: 9=Blue for study, 5=Yellow for deadline work
            'colorId': item.type === 'study' ? '9' : '5' 
          };
          
          // In a real app, you would call the Google API here:
          // await gapi.client.calendar.events.insert({ 'calendarId': 'primary', 'resource': event });
          createdEvents.push(event);

        } catch (e) {
            console.error(`Could not parse time for scheduled item: "${item.task}" at "${item.time}"`, e);
        }
      }
    }
  }

  // 2. Add user-defined deadlines as all-day events
  const deadlineTasks = tasks.filter(task => task.type === 'deadline' && task.dueDate);

  for (const task of deadlineTasks) {
    try {
        const dueDate = new Date(task.dueDate!);
        // Format for an all-day event (YYYY-MM-DD)
        const dueDateString = dueDate.toISOString().split('T')[0];

        const event = {
            'summary': `DEADLINE: ${task.name}`,
            'description': `Deadline for task '${task.name}'.`,
            'start': {
                'date': dueDateString,
            },
            'end': {
                'date': dueDateString,
            },
            'colorId': '11' // Red color for deadlines
        };
        
        // In a real app, you would call the Google API here:
        // await gapi.client.calendar.events.insert({ 'calendarId': 'primary', 'resource': event });
        createdEvents.push(event);

    } catch (e) {
        console.error(`Could not create calendar event for deadline: "${task.name}"`, e);
    }
  }

  console.log("Mock Calendar Sync: The following events would be created:", createdEvents);
  console.log("Schedule successfully synced to Google Calendar (mock).");
  return Promise.resolve();
}