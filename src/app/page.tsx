// src/app/page.tsx
"use client";

import type { NextPage } from 'next';
import CalendarComponent from './components/CalendarComponent';
import { useState } from 'react';
import EventForm from './components/EventForm';

const Home: NextPage = () => {
  const [events, setEvents] = useState<any[]>([]);  
  const [showEventForm, setShowEventForm] = useState<boolean>(false);
  const handleSaveEvent = (newEvent: any) => {
    setEvents((prevEvents) => [...prevEvents, newEvent]);
    setShowEventForm(false);
  }  
  return (
    <div>
      <h1 className="mt-2 text-2xl font-bold">My Calendar</h1>
      {showEventForm && (
        <EventForm
          onSave={handleSaveEvent}
          onClose={() => setShowEventForm(false)}
        />
      )}
      <CalendarComponent />
    </div>
  );
};

export default Home;