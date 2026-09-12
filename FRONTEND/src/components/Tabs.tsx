import { useState } from "react";
import type { ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  variant?: "default" | "pills";
}

export function Tabs({ tabs, defaultTab, variant = "default" }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  
  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  
  const baseTabStyles = "transition-all duration-200 font-medium";
  
  const variantStyles = {
    default: {
      tab: (isActive: boolean) => 
        `px-4 py-2 border-b-2 ${isActive ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`,
      container: "border-b border-gray-200",
    },
    pills: {
      tab: (isActive: boolean) =>
        `px-4 py-2 rounded-full ${isActive ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`,
      container: "flex gap-2",
    },
  };
  
  const styles = variantStyles[variant];
  
  return (
    <div>
      <div className={styles.container}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            disabled={tab.disabled}
            className={`${baseTabStyles} ${styles.tab(activeTab === tab.id)} ${
              tab.disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {activeTabData?.content}
      </div>
    </div>
  );
}
