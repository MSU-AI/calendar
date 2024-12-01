import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // Month view
import timeGridPlugin from '@fullcalendar/timegrid'; // Week and Day views
import interactionPlugin from '@fullcalendar/interaction'; // Allows interaction (e.g., event clicking)
import React, { useEffect, useState, useRef, useCallback } from 'react';
import EventForm from './EventForm';
import LoginPage from '../auth/login/page';
import './CalendarComponent.css';


import { Session } from '@supabase/supabase-js';
import supabase from '@/hooks/supabaseClient';
import useEventManager from '@/hooks/useEventManager';


const CalendarComponent = () => {
  const [showEventForm, setShowEventForm] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [slotInfo, setSlotInfo] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const {events, setEvents, saveEventsLocally, saveNewEvent, fetchEventsForUser, deleteEvent, createRecommendedEvent } = useEventManager();
  const [search, setSearch] = useState(''); 
  const [showPopup, setShowPopup] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null); 
  const memoizedFetchEventsForUser = useCallback(fetchEventsForUser, []);
  //console.log("memoizedFetchEventsForUser reference updated:", memoizedFetchEventsForUser);

  //events for filtering the calendar 
  const [showAllEvents, setShowAllEvents] = useState(true);
  const [showTodayEvents, setShowTodayEvents] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const toggleAllEvents = () => {
    setShowAllEvents(true);
    setShowTodayEvents(false);
  };

  const toggleTodayEvents = () => {
    setShowTodayEvents(true);
    setShowAllEvents(false);
  };

  //filter events
  const getFilteredEvents = () => {
    if (showTodayEvents) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return events.filter(event => {
        const eventDate = new Date(event.start);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === today.getTime();
      });
    }
    return events; // Show all events when showAllEvents is true
  };

   // Ensure the component reacts to event updates
   useEffect(() => {
    console.log('Events updated, re-rendering calendar:', events);
  }, [events]);

  useEffect(() => {
    //console.log("CalendarComponent useEffect triggered");
    //console.log("Events:", events);
    const fetchSession = async () => {
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


  const handleSaveEvent = async (newEvent: any) => {
    const createFormattedEvent = (event: any) => ({
      title: event.title,
      start: new Date(event.start),
      end: event.end ? new Date(event.end) : new Date(event.start),
      extendedProps: {
        description: event.description || '',
        category: event.category || '',
        completion: typeof event.completion === 'boolean' ? event.completion : false,
        priority: event.priority || '',
      },
      isRecommend: event.isRecommend || false,
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
      isRecommend: updatedEvent.isRecommend || existingEvent.isRecommend,
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

      if (formattedEvent.isRecommend) {
        await createRecommendedEvent(formattedEvent); // Call createRecommendedEvent for recommended events
        console.log("Recommended event created successfully.");
        
      } else {
        saveNewEvent(formattedEvent); // Save as a regular event
      }

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
    
  // const handleDeleteEvent = async () => {
  //   if (!selectedEvent) return;
  //   // this logic is very optimistic, it will update the UI by removing the event locally first THEN supabase (but its much snappier)
  //   // on the off-chance API call doesnt work (which is rare), we can rollback the UI to re-add the event
  //   setEvents((prevEvents) => prevEvents.filter((event) => event.id !== selectedEvent.id));
  //   saveEventsLocally(events.filter((event) => event.id !== selectedEvent.id)); 
  //   setSelectedEvent(null); 
  //   try {
  //     await deleteEvent(selectedEvent.id);
  //     console.log("Event successfully deleted from Supabase.");
  //   } catch (error) {
  //     console.error("Error deleting event from Supabase:", error);
  //     // can add rollback logic here
  //   }
  // };
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    //console.log("Deleting selected event with ID:", selectedEvent.id);

    // Optimistically update the UI by removing the event locally first
    setEvents((prevEvents) => {
      const updatedEvents = prevEvents.filter((event) => event.id !== selectedEvent.id);
      localStorage.setItem('events', JSON.stringify(updatedEvents)); // Sync to local storage
      //console.log("Events after local delete (before Supabase sync):", updatedEvents);
      return updatedEvents;
    });

    // Clear selectedEvent for UI cleanup
    setSelectedEvent(null);

    // Perform delete operation on Supabase
    try {
      await deleteEvent(selectedEvent.id);
    } catch (error) {
      console.error("Error deleting event:", error);
      // Optional: Add rollback logic here if delete fails
    }
  };

    


  const handleLogout = async () => {
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

   // Logic for handlung upcoming events in Sidebar
   const today = new Date();
   const upcomingEvents = events
     .filter((event) => new Date(event.start) >= today)
     .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    const toggleSettingsDropdown = () => {
    setShowSettingsDropdown((prev) => !prev);
  };


  return (
    <div id='screen-background'>


      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          
          <div className="absolute top-0 right-0 flex items-center space-x-4 mt-4 mr-4">
          <div className="flex space-x-2">
              {/*Will change for making a settings button to hold these values */}
              
              <button
                className="px-4 py-2 bg-black text-white font-normal rounded-md shadow-sm hover:bg-gray-800 "
                style={{ fontFamily: 'Inter, sans-serif' }}
                onClick={toggleSettingsDropdown}
              >
                Settings
              </button>

              {/* Dropdown Menu */}

              {showSettingsDropdown && (
                <div id='dropdown-menu-settings' className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                  
                  <button id='dropdown-export-btn'
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100 w-full text-left"
                    onClick={handleExport}
                  >
                    Export
                  </button>
                </div>
              )}

            
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

          

          <h1 id="logo-bold-ui" className="mt-2 text-2xl font-bold">potentially</h1>


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
              placeholder="Search for an event..."
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
                  <p 
                    key={index} 
                    className="popup-item" 
                    onClick={() => handleEventClick({ event })}
                  >
                    <span className="font-semibold">{event.title}</span>
                    <span className="font-weight bold text-sm text-gray-400 ml-2">
                      {new Date(event.start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
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
                    isRecommend: editEvent.recommended || false,
                  }
                : slotInfo
                ? {
                    start: slotInfo.start ? formatDateForInput(new Date(slotInfo.start)) : '',
                    end: slotInfo.end ? formatDateForInput(new Date(slotInfo.end)) : '',
                    isRecommend: false,
                  }
                : undefined
            }
            isEditMode={!!editEvent} // Pass true if editing

          />
        )}


{selectedEvent && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
    <div
      id="event-details-tag-2"
      className="bg-neutral-950 rounded-lg shadow-lg p-6 w-full max-w-md text-white space-y-4 relative"
    >
      {/* Close Button */}
      <button
        onClick={closeEventDescription}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition duration-200"
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
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Event Details */}
      <div className="space-y-2">
        <p className="text-lg">
          <strong>Title:</strong> {selectedEvent.title || "No title specified"}
        </p>
        <p className="text-lg">
          <strong>Start:</strong>{" "}
          {selectedEvent.start
            ? new Date(selectedEvent.start).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "No start time specified"}
        </p>
        <p className="text-lg">
          <strong>End:</strong>{" "}
          {selectedEvent.end
            ? new Date(selectedEvent.end).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "No end time specified"}
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
          <strong>Completion:</strong>{" "}
          {selectedEvent.extendedProps.completion ? "Yes" : "No"}
        </p>
      </div>

      {/* Buttons */}
      <div id="delete-event-details-btns" className="flex justify-between mt-6">
        <button
          onClick={handleDeleteEvent}
          className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-500 transition duration-200"
        >
          Delete
        </button>
        <button
          onClick={handleEditEvent}
          className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition duration-200"
        >
          Edit
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
              + Add Event 
            </button>

            
            {/* Pills to filter the  */}
            <div className="pill-container">
              <button
                onClick={toggleAllEvents}
                className={`px-4 py-2 rounded-full ${
                  showAllEvents ? 'bg-[#162029] text-white' : 'bg-[#1a252f] text-gray-400'
                }`}
              >
                All
              </button>
              <button className="px-4 py-2 bg-[#1a252f] text-white rounded-full hover:bg-[#162029]">
                Recommended
              </button>
              <button
                onClick={toggleTodayEvents}
                className={`px-4 py-2 rounded-full ${
                  showTodayEvents ? 'bg-[#162029] text-white' : 'bg-[#1a252f] text-gray-400'
                }`}
              >
                Today
              </button>
            </div>
            {/* Upcoming Events */}
            {/* If the events are recommended, show them with a special highlighted color like blue dot next to it */}
            
            <ul className="task-list">
              {upcomingEvents.map((event, index) => (
                <li 
                  key={index} 
                  className="task-item" 
                  onClick={() => handleEventClick({ event })} // Make agenda items clickable
                >
                  <strong>{event.title}</strong><br />
                  <span>{new Date(event.start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </li>
              ))}
            </ul>

          </div>
          <div className="calendar-container">
            <div id="calendar-class-ui">
              <FullCalendar
                key={events.length}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                height="100%" // Makes FullCalendar take full height of the container
                expandRows={true} // Ensures rows expand to fill available height
                
                events={getFilteredEvents()} // Show all events, show only today's events

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
