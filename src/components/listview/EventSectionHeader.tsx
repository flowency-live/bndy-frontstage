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
        className="section-header flex justify-between items-center"
        onClick={onClick}
      >
        <h3 className="font-medium text-[var(--foreground)]">{title}</h3>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-[var(--foreground)]" />
        ) : (
          <ChevronRight className="w-5 h-5 text-[var(--foreground)]" />
        )}
      </div>
    );
  }