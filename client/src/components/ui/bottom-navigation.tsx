import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: Tab[];
}

export default function BottomNavigation({ activeTab, onTabChange, tabs }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-lg mb-glass-card border-t border-white/20">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => onTabChange(tab.id)}
              className={`nav-item flex flex-col items-center py-2 px-4 transition-colors duration-200 ${
                isActive 
                  ? "text-blue-400 bg-blue-500/20" 
                  : "text-white/80 hover:text-blue-300 hover:bg-white/10"
              }`}
            >
              <Icon className="text-xl mb-1" />
              <span className="text-xs">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
