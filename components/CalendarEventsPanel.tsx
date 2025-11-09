import React from 'react';
import type { CalendarEvent } from '../types';

interface CalendarEventsPanelProps {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const formatDateTime = (value: string) => {
  try {
    return new Date(value).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (error) {
    console.warn('Failed to format calendar date', value, error);
    return value;
  }
};

const CalendarEventsPanel: React.FC<CalendarEventsPanelProps> = ({ events, isLoading, error, onRefresh }) => {
  return (
    <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-indigo-300">Upcoming Calendar Events</h3>
          <p className="text-sm text-slate-400">These are blocked when generating your study plan.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 py-1.5 text-sm font-semibold rounded-md bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 transition-colors"
        >
          {isLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!error && isLoading && (
        <p className="text-sm text-slate-400">Loading events from Google Calendar…</p>
      )}

      {!error && !isLoading && events.length === 0 && (
        <p className="text-sm text-slate-500 italic">No upcoming events found for this week.</p>
      )}

      {!error && events.length > 0 && (
        <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {events.map((event, index) => (
            <li key={`${event.title}-${event.startTime}-${index}`} className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/70">
              <p className="text-slate-200 font-medium">{event.title}</p>
              <p className="text-xs text-slate-400 mt-1">
                {formatDateTime(event.startTime)}
                {event.endTime && ` – ${formatDateTime(event.endTime)}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CalendarEventsPanel;

