import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Wallet, CreditCard, ArrowRightLeft, User, Settings, Bell, LogOut } from "lucide-react";
import { clearStoredUser } from "@/lib/auth";
import { useLocation } from "wouter";

interface DesktopSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: any;
  unreadCount: number;
  onNotificationsOpen: () => void;
}

export default function DesktopSidebar({ 
  activeTab, 
  onTabChange, 
  user, 
  unreadCount, 
  onNotificationsOpen 
}: DesktopSidebarProps) {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    clearStoredUser();
    setLocation("/");
  };

  const menuItems = [
    { id: "home", label: "Accueil", icon: Home, onClick: () => onTabChange("home") },
    { id: "accounts", label: "Mes Comptes", icon: Wallet, onClick: () => onTabChange("accounts") },
    { id: "cards", label: "Mes Cartes", icon: CreditCard, onClick: () => onTabChange("cards") },
    { id: "transfers", label: "Virements", icon: ArrowRightLeft, onClick: () => setLocation("/transfers") },
    { id: "account", label: "Mon Compte", icon: User, onClick: () => onTabChange("account") },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-56 bg-gradient-to-b from-gray-900 via-blue-900 to-purple-900 border-r border-white/10 z-30">
      {/* Logo et profil */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center space-x-2 mb-3">
          <img 
            src="/mb-logo-simple.png"
            alt="MB"
            className="h-10 w-auto"
          />
        </div>
        <div className="text-white">
          <p className="text-xs opacity-80">Bonjour,</p>
          <p className="font-bold text-sm truncate">{user?.name}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={item.onClick}
            className={`w-full justify-start text-left text-white hover:bg-white/20 text-sm py-2 border-none ${
              activeTab === item.id ? 'bg-blue-500/30 text-blue-200' : 'hover:text-blue-200'
            }`}
          >
            <item.icon className="h-4 w-4 mr-2" />
            {item.label}
          </Button>
        ))}
      </nav>

      {/* Actions bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 space-y-1">
        <Button
          variant="ghost"
          onClick={onNotificationsOpen}
          className="w-full justify-start text-white hover:bg-white/20 hover:text-blue-200 relative text-sm py-2 border-none"
        >
          <Bell className="h-4 w-4 mr-2" />
          Notifications
          {unreadCount > 0 && (
            <span className="absolute right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-white hover:bg-white/20 hover:text-blue-200 text-sm py-2 border-none"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}