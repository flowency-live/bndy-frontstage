"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface TabNavigationProps {
  venueId: string;
  eventCount?: number;
}

type TabType = "events" | "about" | "photos";

interface Tab {
  id: TabType;
  label: string;
  count?: number;
  visible: boolean;
}

/**
 * TabNavigation - Tabbed interface for venue profile content (restyled)
 *
 * Features:
 * - Anton font, uppercase
 * - Count badges in JetBrains Mono
 * - Orange bottom border on active
 * - URL param sync (?tab=events)
 *
 * Uses CSS classes from globals.css (.profile-tabs, .profile-tab)
 */
export default function TabNavigation({
  venueId,
  eventCount,
}: TabNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("events");

  // Define tabs - Events, About, Photos (About/Photos hidden for now)
  const tabs: Tab[] = [
    { id: "events", label: "Events", count: eventCount, visible: true },
    { id: "about", label: "About", visible: false },
    { id: "photos", label: "Photos", visible: false },
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
    <div className="profile-wrap">
      <nav
        role="tablist"
        className="profile-tabs"
        aria-label="Venue profile sections"
      >
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              onClick={() => handleTabClick(tab.id)}
              className={`profile-tab ${isActive ? 'active' : ''}`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="profile-tab-count">{tab.count}</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
