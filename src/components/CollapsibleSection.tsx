import React, { useState, useId } from 'react';
import { ChevronDownIcon } from '@/components/Icons';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const contentId = useId();

  // Simple animation for collapsibility. For more complex animations, a library like framer-motion would be used.
  return (
    <div className="border-b border-gray-700/50 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
        <ChevronDownIcon
          className={`w-6 h-6 text-gray-400 transform transition-transform duration-200 ${
            isOpen ? '' : '-rotate-90'
          }`}
        />
      </button>
      <div
        id={contentId}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}
      >
        <div className="pb-4 space-y-4 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;