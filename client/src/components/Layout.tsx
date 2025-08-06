import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { 
  Search, 
  Heart, 
  MessageCircle, 
  User, 
  Plus,
  ShoppingBag,
  Bell,
  LogOut
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Vinted</span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Rechercher des articles..."
                  className="pl-10 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* Notifications */}
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                      3
                    </Badge>
                  </Button>

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profil</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/orders" className="cursor-pointer">
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          <span>Mes commandes</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/favorites" className="cursor-pointer">
                          <Heart className="mr-2 h-4 w-4" />
                          <span>Favoris</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/messages" className="cursor-pointer">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          <span>Messages</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Se déconnecter</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Sell Button */}
                  <Button asChild className="bg-teal-500 hover:bg-teal-600">
                    <Link to="/sell">
                      <Plus className="mr-2 h-4 w-4" />
                      Vendre
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/login">Se connecter</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/register">S'inscrire</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Mobile Navigation */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
          <div className="flex justify-around py-2">
            <Link
              to="/"
              className={`flex flex-col items-center p-2 ${
                location.pathname === '/' ? 'text-teal-500' : 'text-gray-500'
              }`}
            >
              <Search className="h-5 w-5" />
              <span className="text-xs mt-1">Rechercher</span>
            </Link>
            <Link
              to="/favorites"
              className={`flex flex-col items-center p-2 ${
                location.pathname === '/favorites' ? 'text-teal-500' : 'text-gray-500'
              }`}
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs mt-1">Favoris</span>
            </Link>
            <Link
              to="/messages"
              className={`flex flex-col items-center p-2 ${
                location.pathname === '/messages' ? 'text-teal-500' : 'text-gray-500'
              }`}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs mt-1">Messages</span>
            </Link>
            <Link
              to="/sell"
              className={`flex flex-col items-center p-2 ${
                location.pathname === '/sell' ? 'text-teal-500' : 'text-gray-500'
              }`}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs mt-1">Vendre</span>
            </Link>
            <Link
              to="/profile"
              className={`flex flex-col items-center p-2 ${
                location.pathname === '/profile' ? 'text-teal-500' : 'text-gray-500'
              }`}
            >
              <User className="h-5 w-5" />
              <span className="text-xs mt-1">Profil</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
} 