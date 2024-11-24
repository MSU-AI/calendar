import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { CategoryDropdown } from "@/components/ui/category-dropdown";


// logic for the event form if the event is on edit mode, then the is completed button will be shown


interface Event {
  title: string;
  description: string;
  start: string;
  end: string;
  category: string;
  completion: boolean;
  isRecommend: boolean;
}

interface EventFormProps {
  onSave: (event: Event) => void;
  onClose: () => void;
  initialData?: Partial<Event>; // initial data (optional)
  isEditMode?: boolean; // Add isEditMode prop
}

const EventForm: React.FC<EventFormProps> = ({ onSave, onClose, initialData , isEditMode = false}) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [start, setStart] = useState(initialData?.start || "");
  const [end, setEnd] = useState(initialData?.end || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [completion, setCompletion] = useState(initialData?.completion || false);
  const [isRecommend, setIsRecommend] = useState(initialData?.isRecommend || false);

  
  // Only run this effect once when the component mounts or when initialData changes
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setStart(initialData.start || "");
      setEnd(initialData.end || "");
      setCategory(initialData.category || ""); // Set initial category only
      setCompletion(initialData.completion || false);
      setIsRecommend(initialData.isRecommend || false);
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
    onSave({ title, description, start, end, category, completion, isRecommend });
    onClose();
  };

  const handleRecommendToggle = () => {
    setIsRecommend(!isRecommend);
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

        <div className="flex flex-col space-y-2">
            <label className="relative flex items-center space-x-2 text-white font-bold">
              Recommend
              <input
                type="checkbox"
                checked={isRecommend}
                onChange={handleRecommendToggle}
                className="absolute left-1/2 -translate-x-1/2 w-full h-full peer appearance-none rounded-md"
              />
              <span className={`w-12 h-6 flex items-center flex-shrink-0 ml-2 p-1 rounded-full duration-300 ease-in-out after:w-5 after:h-5 after:rounded-full after:shadow-md after:duration-300 ${
                isRecommend 
                  ? 'bg-blue-700 after:translate-x-5 after:bg-white' 
                  : 'bg-gray-600 after:bg-white'
              }`}></span>
            </label>
          </div>

        {/* Start Date */}
       { !isRecommend && (
        <>
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
        </>
       )}

        

        {/* Completion Checkbox */}
        {/* isCompleted Section (Visible Only in Edit Mode) */}
        {isEditMode && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="completion"
              checked={completion}
              onChange={(e) => setCompletion(e.target.checked)}
              className="form-checkbox"
            />
            <label htmlFor="completion" className="text-sm font-medium text-white">
              Mark as Completed
            </label>
          </div>
        )}

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
            {isEditMode ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
    </div>
  );
};

export default EventForm;
