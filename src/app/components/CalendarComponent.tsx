import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // Month view
import timeGridPlugin from '@fullcalendar/timegrid'; // Week and Day views
import interactionPlugin from '@fullcalendar/interaction'; // Allows interaction (e.g., event clicking)
import { useEffect, useState, useRef } from 'react';
import EventForm from './EventForm';
import LoginPage from '../auth/login/page';
import {createClient} from '@/utils/supabase/client';
import { Session } from '@supabase/supabase-js';
import './CalendarComponent.css';

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

  const [search, setSearch] = useState(''); // Search input state
  const [showPopup, setShowPopup] = useState(false); // Toggle popup state

  const searchContainerRef = useRef<HTMLDivElement>(null); // Reference for search container

  useEffect(() => {
    const fetchSession = async () => {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (sessionData?.session) {
        setSession(sessionData.session);
      }
      setLoading(false);
    };

    fetchSession();

    // Close popup when clicking outside of the search container
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };

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


  // Function to handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  // Function to toggle the popup
  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  return (
  <div id='screen-background'>

    
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
              id='login-button'
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              onClick={() => setShowLoginModal(true)}
            >
              Login
            </button>
          )}
        </div>

        
      </div>

      <div className="flex items-center">
      
        <button id='add-event-button'
          className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-300 ease-in-out"
          onClick={() => setShowEventForm(true)}
        >
          + Add 
        </button>

        <h1 id = "logo-bold-ui" className="mt-2 text-2xl font-bold">Almanac</h1>


        <div className="search-container" ref={searchContainerRef}>
        <span className="search-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 19a8 8 0 100-16 8 8 0 000 16zm-2-8h.01M21 21l-4.35-4.35"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search for a task..."
            value={search}
            onChange={handleSearchChange}
            onClick={togglePopup}
            className="search-bar"
          />
          {showPopup && (
            <div className="popup-container">
              <p>Task 1</p>
              <p>Task 2</p>
              <p>Task 3</p>
            </div>
          )}
        </div>
        
        


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


  <div className="calendar-container">
      <div id="calendar-class-ui">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          height="100%" // Makes FullCalendar take full height of the container
          expandRows={true} // Ensures rows expand to fill available height
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
          eventClick={(eventInfo) => setSelectedEvent(eventInfo.event)}
        />
      </div>
    </div>
    </div>

    </div>
  );
};

export default CalendarComponent;