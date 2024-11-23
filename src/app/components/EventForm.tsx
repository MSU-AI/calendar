import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { CategoryDropdown } from "@/components/ui/category-dropdown";

interface Event {
  title: string;
  description: string;
  start: string;
  end: string;
  category: string;
  completion: boolean;
}

interface EventFormProps {
  onSave: (event: Event) => void;
  onClose: () => void;
  initialData?: Partial<Event>; // initial data (optional)
}

const EventForm: React.FC<EventFormProps> = ({ onSave, onClose, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [start, setStart] = useState(initialData?.start || "");
  const [end, setEnd] = useState(initialData?.end || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [completion, setCompletion] = useState(initialData?.completion || false);

  // Only run this effect once when the component mounts or when initialData changes
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setStart(initialData.start || "");
      setEnd(initialData.end || "");
      setCategory(initialData.category || ""); // Set initial category only
      setCompletion(initialData.completion || false);
    }
  }, [initialData]);

   // Prevent scrolling when the modal is open
   useEffect(() => {
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, description, start, end, category, completion });
    onClose();
  };

  return (
    <div className="modal-container">
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-neutral-950 rounded-lg shadow-lg p-6 w-full max-w-md space-y-6 text-white"
      >
        {/**
         * <h2 className="text-2xl font-semibold mb-4">
          {initialData ? "Edit Event" : "Add New Event"}
        </h2>
         */}
        
        <div className="flex flex-col space-y-2">
          {/*<label className="text-gray-300 font-medium">Title:</label>*/}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-b border-gray-600 bg-transparent focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
            placeholder="Enter event title"
          />
        </div>

        <div className="flex flex-col space-y-2">
          {/*<label className="text-gray-300 font-medium">Description:</label>*/}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border-b border-gray-600 bg-transparent focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
            placeholder="Enter event description"
           rows={5}
          />
        </div>
        
        
        <div className="flex flex-col space-y-2">
          {/*<label className="text-gray-300 font-medium">Category:</label>*/}
          <CategoryDropdown selectedCategory={category} onCategoryChange={setCategory} />
        </div>

        {/*
        <div className="flex flex-col space-y-2">
          <label className="text-gray-300 font-medium">Start Date:</label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="block w-full border border-gray-300 bg-white rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition ease-in-out"
          />
          
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-gray-300 font-medium">End Date:</label>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="border border-gray-300 bg-transparent text-gray-700 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition ease-in-out"
          />
        </div>*/}
        {/* Start Date */}
       
        <div>
          <label htmlFor="start-date" className="block mb-1 text-sm text-gray-400">
            Start Date
          </label>
          <input
            id="start-date"
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full px-4 py-2 text-sm font-medium text-gray-300 bg-slate-800 border border-gray-700 rounded-full hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="end-date" className="block mb-1 text-sm text-gray-400">
            End Date
          </label>
          <input
            id="end-date"
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full px-4 py-2 text-sm font-medium text-gray-300 bg-slate-800 border border-gray-700 rounded-full hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        

        {/* Completion Checkbox */}
        {/*}
        <div className="flex items-top space-x-2">
          <Checkbox
            id="completion"
            checked={completion}
            onCheckedChange={(checked) => setCompletion(!!checked)}
            className="text-blue-500"
          />
        

          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="completion"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300"
            >
              Completed?
            </label>
            <p className="text-sm text-gray-400">Mark as completed if the event is finished.</p>
          </div>

        </div>
            */}

        <div className="flex justify-between mt-6">
          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-500 text-gray-300 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            Cancel
          </button>

          {/* Create Button */}
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            Create Event
          </button>
        </div>
      </form>
    </div>
    </div>
  );
};

export default EventForm;
