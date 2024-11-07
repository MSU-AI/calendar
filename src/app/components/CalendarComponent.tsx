import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // Month view
import timeGridPlugin from '@fullcalendar/timegrid'; // Week and Day views
import interactionPlugin from '@fullcalendar/interaction'; // Allows interaction (e.g., event clicking)
import { useEffect, useState, useRef, useCallback } from 'react';
import EventForm from './EventForm';
import LoginPage from '../auth/login/page';
import useEventManager from '@/hooks/useEventManager';
import { createClient } from '@/utils/supabase/client';
import { Session } from '@supabase/supabase-js';
import './CalendarComponent.css';

const CalendarComponent = () => {
  const [showEventForm, setShowEventForm] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [slotInfo, setSlotInfo] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const { events, setEvents, saveEventsLocally, saveNewEvent, fetchEventsForUser, deleteEvent } = useEventManager();

  const [search, setSearch] = useState(''); 
  const [showPopup, setShowPopup] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null); 

  const memoizedFetchEventsForUser = useCallback(fetchEventsForUser, []);

  useEffect(() => {
    const fetchSession = async () => {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        setSession(sessionData.session);
        await memoizedFetchEventsForUser(sessionData.session.user.id);
      }
      setLoading(false);
    };

    fetchSession();
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [memoizedFetchEventsForUser]);


  const handleSaveEvent = (newEvent: any) => {
    const createFormattedEvent = (event: any) => ({
      id: `${new Date().getTime()}`,
      title: event.title,
      start: new Date(event.start),
      end: event.end ? new Date(event.end) : new Date(event.start),
      extendedProps: {
        description: event.description || '',
        category: event.category || '',
        completion: typeof event.completion === 'boolean' ? event.completion : false,
        priority: event.priority || '',
      },
    });
  
    const updateEvent = (existingEvent: any, updatedEvent: any) => ({
      ...existingEvent,
      ...updatedEvent,
      start: new Date(updatedEvent.start),
      end: updatedEvent.end ? new Date(updatedEvent.end) : new Date(updatedEvent.start),
      extendedProps: {
        ...existingEvent.extendedProps,
        description: updatedEvent.description || existingEvent.extendedProps.description,
        category: updatedEvent.category || existingEvent.extendedProps.category,
        completion: typeof updatedEvent.completion === 'boolean'
          ? updatedEvent.completion
          : existingEvent.extendedProps.completion,
        priority: updatedEvent.priority || existingEvent.extendedProps.priority, 
      },
    });
  
    let updatedEvents;
    if (editEvent) {
      updatedEvents = events.map((event) =>
        event.id === editEvent.id ? updateEvent(event, newEvent) : event
      );
      setEditEvent(null);
    } else {
      const formattedEvent = createFormattedEvent(newEvent);
      updatedEvents = [...events, formattedEvent];
      saveNewEvent(formattedEvent)
    }
  
    saveEventsLocally(updatedEvents);
    setShowEventForm(false);
  };

  const handleEventClick = (eventInfo: any) => {
    setSelectedEvent(eventInfo.event);
  };

  const closeEventDescription = () => {
    setSelectedEvent(null);
  };

  const handleEditEvent = () => {
    if (selectedEvent) {
      const eventToEdit = {
        id: selectedEvent.id,
        title: selectedEvent.title || '',
        description: selectedEvent.extendedProps?.description || '',
        category: selectedEvent.extendedProps?.category || '', 
        start: selectedEvent.start
          ? formatDateForInput(new Date(selectedEvent.start))
          : '',
        end: selectedEvent.end
          ? formatDateForInput(new Date(selectedEvent.end))
          : '',
        completion: typeof selectedEvent.extendedProps?.completion === 'boolean'
          ? selectedEvent.extendedProps.completion
          : false,
      };

      // // Debugging logs
      // console.log("Selected Event:", selectedEvent);
      // console.log("Event to Edit:", eventToEdit);

      setEditEvent(eventToEdit);
      setShowEventForm(true);
      setSelectedEvent(null);
    }
  };
        
  const formatDateForInput = (date: Date) => {
    return date.toLocaleDateString('en-CA') + 'T' + date.toTimeString().slice(0, 5);
  };
    
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    try {
      await deleteEvent(selectedEvent.id);
      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== selectedEvent.id));
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
    };
  
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setSession(null);
    setShowLoginModal(false);

    // after logout, clear events
    localStorage.removeItem('events');
    saveEventsLocally([]);
  };


  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  const handleImport = (event: any) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const importedEvents = JSON.parse(e.target?.result as string);
      saveEventsLocally(importedEvents);
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const jsonData = JSON.stringify(events);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'events.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleEventDrop = (eventDropInfo: any) => {
    const updatedEvent = {
      id: eventDropInfo.event.id,
      title: eventDropInfo.event.title,
      start: eventDropInfo.event.start,
      end: eventDropInfo.event.end || eventDropInfo.event.start,
      extendedProps: eventDropInfo.event.extendedProps,
    };
    const updatedEvents = events.map((event) =>
      event.id === updatedEvent.id ? updatedEvent : event
    );
    saveEventsLocally(updatedEvents);
  };


  return (
    <div id='screen-background'>


      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="absolute top-0 right-0 flex items-center space-x-4 mt-4 mr-4">
            <div className="flex space-x-2">
              <button
                className="px-4 py-2 bg-black text-white font-normal rounded-md shadow-sm hover:bg-gray-800"
                style={{ fontFamily: 'Inter, sans-serif' }}
                onClick={handleExport}
              >
                Export Events
              </button>
              <label
                className="px-4 py-2 bg-black text-white font-normal rounded-md shadow-sm hover:bg-gray-800 cursor-pointer"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Import Events
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>

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

          {/*<button id='add-event-button'
          className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-300 ease-in-out"
          onClick={() => setShowEventForm(true)}
        >
          + Add 
        </button>*/}

          <h1 id="logo-bold-ui" className="mt-2 text-2xl font-bold">Almanac</h1>


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
                {events
                  .filter((event) => event.title.toLowerCase().includes(search.toLowerCase()))
                  .map((event, index) => (
                    <p key={index} onClick={() => handleEventClick({ event })}>
                      {event.title}
                    </p>
                  ))}
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
            initialData={
              editEvent
                ? {
                    title: editEvent.title,
                    description: editEvent.extendedProps?.description || '',
                    start: editEvent.start ? formatDateForInput(new Date(editEvent.start)) : '',
                    end: editEvent.end ? formatDateForInput(new Date(editEvent.end)) : '',
                    category: editEvent.extendedProps?.category || '', // Include category
                    completion:
                      typeof editEvent.extendedProps?.completion === 'boolean'
                        ? editEvent.extendedProps.completion
                        : false, // Include completion
                  }
                : slotInfo
                ? {
                    start: slotInfo.start ? formatDateForInput(new Date(slotInfo.start)) : '',
                    end: slotInfo.end ? formatDateForInput(new Date(slotInfo.end)) : '',
                  }
                : undefined
            }
          />
        )}


        {selectedEvent && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
            <div className="bg-neutral-950 rounded-lg shadow-lg p-6 w-full max-w-md text-white space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Event Details</h2>
              <div className="space-y-2">
                <p className="text-lg">
                  <strong>Title:</strong> {selectedEvent.title || 'No title specified'}
                </p>
                <p className="text-lg">
                  <strong>Start:</strong>{' '}
                  {selectedEvent.start
                    ? new Date(selectedEvent.start).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'No start time specified'}
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
                    <strong>Description:</strong> {selectedEvent.extendedProps.description}
                  </p>
                )}
                {selectedEvent.extendedProps.category && (
                  <p className="text-lg">
                    <strong>Category:</strong> {selectedEvent.extendedProps.category}
                  </p>
                )}
                <p className="text-lg">
                  <strong>Completion:</strong>{' '}
                  {selectedEvent.extendedProps.completion ? 'Yes' : 'No'}
                </p>
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

        {/* Add the Left View to show an agenda for tasks and suggested tasks option with green check mark and x mark buttons - no mini calendar */}

        {/* Calendar UI */}
        {/* Flexbox layout with sidebar and calendar */}
        <div className="calendar-layout">
          {/* Sidebar for tasks */}
          <div className="sidebar">
            <button className="add-task-button" onClick={() => setShowEventForm(true)}>
              + Add
            </button>
            <h2 className="sidebar-title">Agenda</h2>
            <ul className="task-list">
              {/*tasks.map((task, index) => (
                <li key={index} className="task-item">
                  {task.title}
                </li>
              ))*/}
            </ul>

            <h2 className="sidebar-title">Recommended</h2>
            <ul className="task-list">
              {/*tasks.map((task, index) => (
                <li key={index} className="task-item">
                  {task.title}
                </li>
              ))*/}
            </ul>
          </div>
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
                eventDrop={handleEventDrop}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CalendarComponent;
