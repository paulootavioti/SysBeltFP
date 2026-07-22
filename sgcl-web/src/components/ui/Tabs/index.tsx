import { useState, type ReactNode } from "react";

import "./styles.css";

interface TabItem {
  label: ReactNode;
  value: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultValue?: string;
}

export function Tabs({
  tabs,
  defaultValue,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(
    defaultValue ?? tabs[0]?.value
  );

  const selectedTab = tabs.find(
    (tab) => tab.value === activeTab
  );

  return (
    <div className="tabs">
      <div className="tabs-list">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={
              tab.value === activeTab
                ? "tabs-trigger active"
                : "tabs-trigger"
            }
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tabs-content" key={activeTab}>
        {selectedTab?.content}
      </div>
    </div>
  );
}