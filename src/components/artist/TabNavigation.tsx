"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface TabNavigationProps {
  artistId: string;
  hasVideos?: boolean;
  publishAvailability?: boolean;
}

type TabType = "events" | "links";

interface Tab {
  id: TabType;
  label: string;
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

  // Define tabs - Events and Links only
  const tabs: Tab[] = [
    { id: "events", label: "Events", visible: true },
    { id: "links", label: "Links", visible: true },
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
    <div className="border-b border-border">
      <div className="container mx-auto px-4">
        <nav
          role="tablist"
          className="flex gap-6"
          aria-label="Artist profile sections"
        >
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              onClick={() => handleTabClick(tab.id)}
              className={`
                py-3 px-1 font-medium text-sm transition-colors
                border-b-3 -mb-px
                ${
                  activeTab === tab.id
                    ? "border-orange-500 text-foreground font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
