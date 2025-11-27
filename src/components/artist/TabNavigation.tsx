"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Link2, CalendarCheck } from "lucide-react";

interface TabNavigationProps {
  artistId: string;
  hasVideos?: boolean;
  publishAvailability?: boolean;
}

type TabType = "events" | "links" | "availability";

interface Tab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  visible: boolean;
}

/**
 * TabNavigation - Tabbed interface for artist profile content
 *
 * Features:
 * - Two tabs: Events | Links
 * - Active tab: Orange underline (3px)
 * - URL param sync (?tab=events)
 * - Default active: "events"
 */
export default function TabNavigation({
  artistId,
  hasVideos = false,
  publishAvailability = false,
}: TabNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("events");

  // Define tabs - Events, Availability (conditional), and Links
  const tabs: Tab[] = [
    { id: "events", label: "Events", icon: Calendar, visible: true },
    { id: "availability", label: "Availability", icon: CalendarCheck, visible: publishAvailability === true },
    { id: "links", label: "Links", icon: Link2, visible: true },
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
    <div style={{ backgroundColor: 'var(--background)' }} className="py-2">
      <div className="container mx-auto px-4">
        <nav
          role="tablist"
          style={{ backgroundColor: 'var(--muted)' }}
          className="flex gap-3 p-1.5 rounded-full"
          aria-label="Artist profile sections"
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
                style={{
                  backgroundColor: isActive ? 'var(--background)' : 'transparent',
                  borderColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                }}
                className="flex-1 py-2.5 px-6 font-medium text-sm transition-all rounded-full flex items-center justify-center gap-2.5 border-2"
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
