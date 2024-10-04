import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useState } from 'react';
import EventForm from './EventForm';

const CalendarComponent = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [showEventForm, setShowEventForm] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Correctly format and save the new event with separate start and end
  const handleSaveEvent = (newEvent: any) => {
    const formattedEvent = {
      title: newEvent.title,
      start: newEvent.start,
      end: newEvent.end ? newEvent.end : newEvent.start,
      extendedProps: { description: newEvent.description },
    };
    setEvents((prevEvents) => [...prevEvents, formattedEvent]);
    setShowEventForm(false);
  };

  const handleEventClick = (eventInfo: any) => {
    setSelectedEvent(eventInfo.event);
  };

  const closeEventDescription = () => {
    setSelectedEvent(null);
  };

  return (
    <div className="relative">
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
          onClose={() => setShowEventForm(false)}
        />
      )}

      {selectedEvent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md text-white space-y-4">
            <h2 className="text-2xl font-bold mb-4">Event Details</h2>
            <div className="space-y-2">
              <p className="text-lg"><strong>Title:</strong> {selectedEvent.title}</p>
              <p className="text-lg">
                <strong>Start:</strong> {new Date(selectedEvent.start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              <p className="text-lg">
                <strong>End: </strong> 
                {selectedEvent.end 
                  ? new Date(selectedEvent.end).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) 
                  : 'No end time specified'}
              </p>
              {selectedEvent.extendedProps.description && (
                <p className="text-lg"><strong>Description:</strong> {selectedEvent.extendedProps.description}</p>
              )}
            </div>
            <button
              onClick={closeEventDescription}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={events}
        editable={true}
        selectable={!showEventForm} // Disable selecting new events while form is open
        select={(info) => {
          if (!showEventForm) {
            setShowEventForm(true);
          }
        }}
        eventClick={handleEventClick} // Open event description when an event is clicked
      />
    </div>
  );
};

export default CalendarComponent;
