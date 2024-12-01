import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import supabase from '@/hooks/supabaseClient';
import { cat, pipeline } from '@xenova/transformers'

export interface EventExtendedProps {
  description: string;
  category: string;
  completion: boolean;
  priority: string;
}

export interface CalendarEvent {
  isRecommend?: boolean;
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
    console.log('Loaded events from localStorage:', savedEvents); // Debug log
    setEvents(savedEvents); // Overwrites the `events` state
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
      }
      
      if (data && data.length > 0) {
        const newEventWithId = { ...newEvent, id: data[0].task_id };

        saveEventsLocally([...events, newEventWithId]);
        

        // create embeddings for the event
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

  // function for comparing the cosine similarity of each event to the new event
  
  // send it to the modal to be able to recommend the task
  
  // const recommendEvents = async (taskId: number, userId: string) => {
  //   try {
  //     const { data, error } = await supabase.rpc("recommend_task", {
  //       task_id: taskId,
  //       user_id: userId,
  //     });
  
  //     if (error) {
  //       console.error("Error fetching recommendations:", error);
  //       return [];
  //     }
  
  //     return data; // Recommended events
  //   } catch (err) {
  //     console.error("Exception while fetching recommendations:", err);
  //     return [];
  //   }
  // };
  
  // Create a recommended event based on the most similar event

  const fetchTaskId = async (originalEvent: any) => {
    try {
      // Query Supabase for the task_id using unique event properties
      if (!session) {
        console.error('No active session found. Cannot fetch task_id.');
        return null;
      }

      const { data, error } = await supabase
        .from('task_log')
        .select('task_id')
        .eq('title', originalEvent.title) // 
        .eq('user_id', session.user.id) // Ensure it's scoped to the current user
        .limit(1); // Limit to one record

      if (error) {
        console.error('Error fetching task_id from Supabase:', error);
        return null;
      }

      if (data && data.length > 0) {
        return data[0].task_id; // Return the task_id
      } else {
        console.warn('No matching task found in Supabase for the given event.');
        return null;
      }
    } catch (err) {
      console.error('Exception while fetching task_id:', err);
      return null;
    }
  };

  const createDraftEvent = async (title: string, placeholderCategory: string, placeholderDescription: string) => {    
    try {
      const eventCreationTime = new Date();
      const formattedTime = eventCreationTime.toISOString().split('T')[1].split('.')[0]; 

      const { data, error } = await supabase
        .from('task_log')
        .insert([
          {
            user_id: session?.user.id,
            title: title || 'Temporary Event',
            category: placeholderCategory, 
            description: placeholderDescription,
            date_interval: '[,)', // Placeholder for now
            event_creation_time: formattedTime,
            completion: false,
            priority: '',
          },
        ])
        .select('task_id');
  
      if (error) {
        console.error('Error creating draft event:', error);
        return null;
      }
  
      if (data && data.length > 0) {
        console.log('Draft event created with task_id:', data[0].task_id);

        
        const inputText = `Title: ${title || 'Temporary Event'}.
        Description: ${placeholderDescription}.
        Category: ${placeholderCategory}.`;
        await generateAndStoreEmbeddings(inputText, data[0].task_id);
        return data[0].task_id;
      } else {
        console.warn('Draft event creation returned no task_id.');
        return null;
      }
    } catch (err) {
      console.error('Exception while creating draft event:', err);
      return null;
    }
  };
  
  const fetchMostSimilarEvent = async (taskId: number) => {
    try {
      const { data: recommendedEvents, error } = await supabase.rpc('recommend_task', {
        input_task_id: taskId, // Updated parameter name
        input_user_id: session?.user.id, // Updated parameter name
      });
  
      if (error) {
        console.error('Error fetching recommended tasks via RPC:', error);
        return null;
      }
  
      if (!recommendedEvents || recommendedEvents.length === 0) {
        console.warn('No similar tasks found.');
        return null;
      }
  
      console.log('Most similar task:', recommendedEvents[0]);
      return recommendedEvents[0];
    } catch (err) {
      console.error('Exception while fetching similar tasks:', err);
      return null;
    }
  };
  
  const parseDateInterval = (dateInterval: string) => {
    try {
      const [start, end] = JSON.parse(dateInterval);
      return {
        start: new Date(start),
        end: new Date(end),
      };
    } catch (error) {
      throw new Error(`Invalid date_interval format: ${dateInterval}`);
    }
  };

  
  const createRecommendedEvent = async (originalEvent: any) => {
    if (!session?.user.id) {
      console.error('User session is required to create a recommended event.');
      return;
    }
  
    // Step 1: Create a draft event
    const draftTaskId = await createDraftEvent(originalEvent.title, originalEvent.extendedProps.category, originalEvent.extendedProps.description);
    if (!draftTaskId) {
      console.error('Failed to create a draft event.');
      return;
    }
  
    console.log('Draft task_id:', draftTaskId);
  
    // Step 2: Fetch the most similar event via RPC
    const mostSimilarEvent = await fetchMostSimilarEvent(draftTaskId);
  
    if (!mostSimilarEvent) {
      console.error('No similar event found. Cannot proceed.');
      return;
    }
  
    console.log('Most similar event:', mostSimilarEvent);
  
    // Step 3: Calculate new event dates based on the most similar event
    try {
      const [start, end] = JSON.parse(mostSimilarEvent.date_interval);
      const originalStart = new Date(start);
      const originalEnd = new Date(end);
  
      console.log('originalStart:', start, 'originalEnd:', end);
  
      const inferredStart = new Date(originalStart.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days
      const inferredEnd = new Date(originalEnd.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days
  
      console.log('Inferred Start:', inferredStart, 'Inferred End:', inferredEnd);
  
      const updatedEvent = {
        title: originalEvent.title,
        category: originalEvent.extendedProps.category || '',
        description: originalEvent.extendedProps.description || '',
        date_interval: `[${inferredStart.toISOString()}, ${inferredEnd.toISOString()}]`,
        completion: false, // Default to not completed
        priority: mostSimilarEvent.priority || '',
      };
  
      // Step 4: Update the draft event instead of creating a new one
      const { data: updatedEventData, error: updateError } = await supabase
        .from('task_log')
        .update(updatedEvent)
        .eq('task_id', draftTaskId)
        .select();
  
      if (updateError) {
        console.error('Error updating the draft event with recommended data:', updateError);
      } else {
        console.log('Draft event updated successfully:', updatedEventData);
  
        // Update state and localStorage
        //const updatedEventWithId = { ...updatedEvent, id: draftTaskId };
        //saveEventsLocally([...events, updatedEventWithId]);
        //setEvents([...events, updatedEventWithId]); // Optional: Force UI refresh if needed
        
        const newEventWithId = { ...mostSimilarEvent, id: updatedEventData[0].task_id };
        // Update state and ensure it synchronizes with localStorage and UI
        const updatedEvents = [...events, newEventWithId];
        setEvents(updatedEvents);
        saveEventsLocally(updatedEvents);
        

        console.log('Updated events after adding recommended event:', updatedEvents);
        
      }
    } catch (err) {
      console.error('Error calculating or updating recommended event:', err);
    }
  };
  

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

  return { events, setEvents, saveEventsLocally, saveNewEvent, fetchEventsForUser, deleteEvent, createRecommendedEvent };
};

export default useEventManager;
