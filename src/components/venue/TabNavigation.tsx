"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Link2 } from "lucide-react";

interface TabNavigationProps {
  venueId: string;
}

type TabType = "events" | "links";

interface Tab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  visible: boolean;
}

/**
 * TabNavigation - Tabbed interface for venue profile content
 *
 * Features:
 * - Two tabs: Events | Links
 * - Active tab: Orange border (2px)
 * - URL param sync (?tab=events)
 * - Default active: "events"
 */
export default function TabNavigation({
  venueId,
}: TabNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("events");

  // Define tabs - Events only (Links hidden for venues)
  const tabs: Tab[] = [
    { id: "events", label: "Events", icon: Calendar, visible: true },
    { id: "links", label: "Links", icon: Link2, visible: false },
  ];

  // Sync with URL params on mount and when search params change
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType;
    if (tabParam && tabs.find(t => t.id === tabParam && t.visible)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);

    // Update URL param
    const newUrl = `${window.location.pathname}?tab=${tabId}`;
    router.push(newUrl, { scroll: false });
  };

  // Filter to only show visible tabs
  const visibleTabs = tabs.filter(tab => tab.visible);

  return (
    <div className="border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <nav
          role="tablist"
          className="flex gap-8"
          aria-label="Venue profile sections"
        >
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                onClick={() => handleTabClick(tab.id)}
                className={`relative py-3 font-medium text-sm transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
