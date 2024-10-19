import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // Month view
import timeGridPlugin from '@fullcalendar/timegrid'; // Week and Day views
import interactionPlugin from '@fullcalendar/interaction'; // Allows interaction (e.g., event clicking)
import { useEffect, useState } from 'react';
import EventForm from './EventForm';
import LoginPage from '../auth/login/page';
import {createClient} from '@/utils/supabase/client';
import { Session } from '@supabase/supabase-js';

const CalendarComponent = () => {
  const supabase = createClient();
  const [events, setEvents] = useState<any[]>([]);
  const [showEventForm, setShowEventForm] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [slotInfo, setSlotInfo] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (sessionData?.session) {
        setSession(sessionData.session);
      }
      setLoading(false);
    };

    fetchSession();
  }, [supabase]);

  const handleSaveEvent = (newEvent: any) => {
    if (editEvent) {
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === editEvent.id ? { ...event, ...newEvent, extendedProps: { description: newEvent.description } } : event
        )
      );
      setEditEvent(null);
    } else {
      const formattedEvent = {
        id: `${new Date().getTime()}`,
        title: newEvent.title,
        start: newEvent.start,
        end: newEvent.end ? newEvent.end : newEvent.start,
        extendedProps: { description: newEvent.description },
      };
      setEvents((prevEvents) => [...prevEvents, formattedEvent]);
    }
    setShowEventForm(false);
  };

  const handleEventClick = (eventInfo: any) => {
    setSelectedEvent(eventInfo.event);
  };

  const closeEventDescription = () => {
    setSelectedEvent(null);
  };

  const handleEditEvent = () => {
    setEditEvent(selectedEvent);
    setShowEventForm(true);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = () => {
    setEvents((prevEvents) =>
      prevEvents.filter((event) => event.id !== selectedEvent.id)
    );
    setSelectedEvent(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setShowLoginModal(false);
  };

  return (
  <div className="relative">
    <div className="flex items-center justify-between mb-4">
        <div className="absolute top-0 right-0 flex items-center space-x-4 mt-4 mr-4">
          {session ? (
            <>
              <div className="flex items-center space-x-2">
                {session.user.user_metadata?.avatar_url && (
                  <img
                    src={session.user.user_metadata.avatar_url}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <span className="text-lg font-medium text-white">{session.user.user_metadata?.full_name || 'User'}</span>
              </div>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              onClick={() => setShowLoginModal(true)}
            >
              Login
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <button
          className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-300 ease-in-out"
          onClick={() => setShowEventForm(true)}
        >
          + Add Event
        </button>
      </div>

      {showEventForm && (
        <EventForm
          onSave={handleSaveEvent}
          onClose={() => {
            setShowEventForm(false);
            setEditEvent(null);
          }}
          initialData={editEvent ? {
            title: editEvent.title,
            description: editEvent.extendedProps.description,
            start: new Date(editEvent.start.getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
            end: editEvent.end ? new Date(editEvent.end.getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
          } : slotInfo ? {
            start: new Date(new Date(slotInfo.start).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
            end: slotInfo.end ? new Date(new Date(slotInfo.end).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
          } : undefined}
                    
        />
      )}

      {selectedEvent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
          <div className="bg-neutral-950 rounded-lg shadow-lg p-6 w-full max-w-md text-white space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Event Details</h2>
            <div className="space-y-2">
              <p className="text-lg">
                <strong>Title:</strong> {selectedEvent.title}
              </p>
              <p className="text-lg">
                <strong>Start:</strong>{' '}
                {new Date(selectedEvent.start).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
              <p className="text-lg">
                <strong>End:</strong>{' '}
                {selectedEvent.end
                  ? new Date(selectedEvent.end).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'No end time specified'}
              </p>
              {selectedEvent.extendedProps.description && (
                <p className="text-lg">
                  <strong>Description:</strong>{' '}
                  {selectedEvent.extendedProps.description}
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleDeleteEvent}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition duration-200"
              >
                Delete
              </button>

              <button
                onClick={handleEditEvent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition duration-200"
              >
                Edit
              </button>

              <button
                onClick={closeEventDescription}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="relative bg-neutral-950 rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 transition duration-200"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <LoginPage />
          </div>
        </div>
      )}


      <div className = 'pt-3'>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth" // Default view is Month
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay', // Allows switching between Month, Week, and Day views
          }}
          events={events}
          editable={true}
          selectable={!showEventForm} 
          select={(info) => {
            setSlotInfo({
              start: info.startStr,
              end: info.endStr,
            });
            setShowEventForm(true);
          }}
          eventClick={handleEventClick} 
        />
      </div>
    </div>
  );
};

export default CalendarComponent;