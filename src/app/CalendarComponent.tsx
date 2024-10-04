"use client";  // Add this line at the top

import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useState } from 'react';

const CalendarComponent = () => {
    const [events, setEvents] = useState<any[]>([]);  // Ensure events is an array

  return (
    <FullCalendar
      plugins={[timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      events={events}
      editable={true}
      selectable={true}
      select={(info) => {
        const newEvent = {
          title: 'New Event',
          start: info.startStr,
          end: info.endStr,
        };
        // Use a functional update to set events
        setEvents((prevEvents) => [...prevEvents, newEvent]);
      }}
    />
  );
};

export default CalendarComponent;
