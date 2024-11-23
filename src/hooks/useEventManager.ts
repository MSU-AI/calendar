import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import supabase from '@/hooks/supabaseClient';
import { pipeline } from '@xenova/transformers'

export interface EventExtendedProps {
  description: string;
  category: string;
  completion: boolean;
  priority: string;
}

export interface CalendarEvent {
  id?: string; 
  user_id?: string; 
  title: string;
  start: Date;
  end: Date;
  extendedProps: EventExtendedProps;
}


const useEventManager = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]); 
  const [session, setSession] = useState<Session | null>(null);

  const fetchEventsForUser = useCallback(async (userId: any) => {
    try {
      const { data, error } = await supabase
        .from('task_log')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching events:', error);
      } else {
        const formattedEvents = data.map((event: any) => ({
          id: event.task_id,
          title: event.title,
          start: new Date(event.date_interval.split(',')[0].slice(1)),
          end: new Date(event.date_interval.split(',')[1].slice(0, -1)),
          extendedProps: {
            description: event.description || '',
            category: event.category || '',
            completion: event.completion,
            priority: event.priority || '',
          },
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Exception caught while fetching events:', error);
    }
  }, []);

  // Fetches current events in local storage
  // If user is logged in (session active), fetches events from Supabase 
  useEffect(() => {
    const savedEvents: CalendarEvent[] = JSON.parse(localStorage.getItem('events') || '[]');
    setEvents(savedEvents);
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session || null);
      if (data?.session) {
        fetchEventsForUser(data.session.user.id);
      }
    };
    fetchSession();
  }, [fetchEventsForUser]);

  // Locally store events and save to local storage
  const saveEventsLocally = (updatedEvents: CalendarEvent[]) => {
    setEvents(updatedEvents);
    localStorage.setItem('events', JSON.stringify(updatedEvents));
  };

  // store new event to local storage and save to Supabase (unused.)
  const saveNewEvent = async (newEvent: CalendarEvent) => {
    if (!session) {
      console.error('No active session found. Cannot save event.');
      return;
    }

    // format event for insertion into Supabase
    const formattedEvent = {
      user_id: session.user.id,
      title: newEvent.title,
      category: newEvent.extendedProps.category || '',
      description: newEvent.extendedProps.description || '',
      date_interval: `[${new Date(newEvent.start).toISOString()},${new Date(newEvent.end).toISOString()}]`,
      event_creation_time: new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      completion: newEvent.extendedProps.completion,
      priority: newEvent.extendedProps.priority || '',
    };

    // push event into supabase and save to local storage
    // then generate and store embeddings for the event
    try {
      const { data, error } = await supabase
        .from('task_log')
        .insert([formattedEvent]) 
        .select();

      if (error) {
        console.error('Error saving new event to Supabase:', error);
      } else if (data) {
        const newEventWithId = { ...newEvent, id: data[0].task_id };
        saveEventsLocally([...events, newEventWithId]);
        
        const inputText = `
          Title: ${formattedEvent.title}.
          Description: ${formattedEvent.description || 'No description'}.
          Category: ${formattedEvent.category || 'Uncategorized'}.
        `;
        generateAndStoreEmbeddings(inputText, data[0].task_id);
      }
    } catch (error) {
      console.error('Exception caught while saving event:', error);
    }
  }; 
  //figure out how to connect the supabase to the model, button, select user then the embeddings, push to model, might need to do it periodically, so make it so that 
  // 

  // Generate and Store Embeddings in the table on supabase.
  // Called after creating a new event and event was sucessfully stored on Supabase.
  const generateAndStoreEmbeddings = async (inputText: string, task_id: any) => {
    const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small');
    const embeddingOutput = await generateEmbedding(inputText, {
      pooling: 'mean',
      normalize: true,
    });
    const embeddingVector = Array.from(embeddingOutput.data);
    if (embeddingVector.length !== 384) {
      throw new Error('Generated embedding does not match the expected dimension (384).');
    }      
    const embeddingResponse = await supabase
      .from('task_log')
      .update({ embedding: embeddingVector }) 
      .eq('task_id', task_id); 
    if (embeddingResponse.error) {
      console.error('Error saving embedding to task_embeddings:', embeddingResponse.error);
    } else {
      console.log('Embedding successfully saved for task ID:', task_id);
    }
  }

  // Delete event from supabase and local storage
  const deleteEvent = async (eventId: string | number) => {
    const formattedEventId = typeof eventId === 'string' ? parseInt(eventId) : eventId;
  
    // Optimistic update to remove event from local `events` state and localStorage immediately
    const updatedEvents = events.filter((event) => parseInt(event.id as string) !== formattedEventId);
    if (updatedEvents.length === events.length) {
      console.error("Deletion failed locally - event not found in current events.");
      return;
    }
    setEvents(updatedEvents); 

    if (session) {
      try {
        const { error } = await supabase
          .from("task_log")
          .delete()
          .eq("task_id", eventId);
  
        if (error) {
          console.error("Error deleting event from Supabase:", error);
        } else {
          console.log("Event successfully deleted from Supabase.");
        }
      } catch (err) {
        console.error("Exception caught while deleting event from Supabase:", err);
      }
    }

    saveEventsLocally(updatedEvents);
  };
  
  // Store all events to local storage and save to Supabase 
  // UNUSED in current implementation
  const syncEventsWithBackend = async () => {
    if (!session) {
      console.error('No active session found. Cannot sync events.');
      return;
    }

    try {
      const localEvents: CalendarEvent[] = JSON.parse(localStorage.getItem('events') || '[]');
      
      const formattedEvents = localEvents.map(event => ({
        user_id: session.user.id,
        title: event.title,
        date_interval: `[${new Date(event.start).toISOString()},${new Date(event.end).toISOString()}]`,
        event_creation_time: new Date(event.start).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        category: event.extendedProps.category || "",
        completion: event.extendedProps.completion,
        priority: event.extendedProps.priority || "",
        description: event.extendedProps.description || "",
      }));
  
      const { data, error } = await supabase
        .from("task_log")
        .upsert(formattedEvents);

      if (error) {
        console.error('Error syncing events with backend:', error);
      } else {
        console.log('Events successfully synced with backend:', data);
      }
    } catch (error) {
      console.error('Exception caught while syncing events:', error);
    }
  };

  return { events, setEvents, saveEventsLocally, saveNewEvent, fetchEventsForUser, deleteEvent };
};

export default useEventManager;
