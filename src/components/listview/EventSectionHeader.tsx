// src\components\listview\EventSectionHeader.tsx
import { ChevronDown, ChevronRight } from "lucide-react";

export function EventSectionHeader({ 
    title, 
    isExpanded, 
    onClick 
  }: { 
    title: string;
    isExpanded: boolean;
    onClick: () => void;
  }) {
    return (
      <div 
        className="flex justify-between items-center p-3 bg-[var(--background)] border-b border-gray-300 dark:border-gray-700 cursor-pointer"
        onClick={onClick}
      >
        <h3 className="font-medium text-[var(--primary)]">{title}</h3>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-[var(--foreground)]" />
        ) : (
          <ChevronRight className="w-5 h-5 text-[var(--foreground)]" />
        )}
      </div>
    );
  }