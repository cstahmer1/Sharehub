import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Handshake, 
  Bell, 
  Menu,
  Search,
  Plus,
  MessageCircle,
  User,
  Settings,
  LogOut,
  Shield,
  Heart
} from "lucide-react";

interface Booking {
  id: number;
  status: string;
  sellerUserId: number;
  buyerUserId: number;
}

interface HeaderProps {
  onAuthClick?: () => void;
  onPostProjectClick?: () => void;
}

export default function Header({ onAuthClick, onPostProjectClick }: HeaderProps) {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Fetch bookings to show notification badge
  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!user,
  });

  // Calculate pending booking requests for owners
  const pendingRequestsCount = user 
    ? bookings.filter(b => b.sellerUserId === user.id && b.status === "pending").length
    : 0;

  // Calculate accepted bookings awaiting payment for providers
  const pendingPaymentsCount = user
    ? bookings.filter(b => b.buyerUserId === user.id && b.status === "accepted").length
    : 0;

  const totalNotifications = pendingRequestsCount + pendingPaymentsCount;

  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation('/');
  };

  const handlePostProject = () => {
    if (onPostProjectClick) {
      onPostProjectClick();
    } else if (user) {
      setLocation('/post-project');
    } else {
      onAuthClick?.();
    }
  };

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navigationItems = [
    { href: "/search", label: "Browse Projects", testId: "nav-browse", type: "link" as const },
    { href: "how-it-works", label: "How it Works", testId: "nav-how-it-works", type: "scroll" as const },
    { href: "help", label: "Help", testId: "nav-help", type: "scroll" as const },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Handshake className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">OmahaShareHub</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              item.type === "scroll" ? (
                <button
                  key={item.href}
                  onClick={() => handleScrollToSection(item.href)}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  data-testid={item.testId}
                >
                  {item.label}
                </button>
              ) : (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid={item.testId}
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-foreground relative"
                  onClick={() => setLocation('/bookings')}
                  data-testid="button-notifications"
                >
                  <Bell className="h-5 w-5" />
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[hsl(15,80%,55%)] text-white text-xs font-bold flex items-center justify-center animate-pulse" data-testid="notification-badge">
                      {totalNotifications}
                    </span>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>

                {/* Post Project Button */}
                <Button
                  size="sm"
                  onClick={handlePostProject}
                  className="hidden sm:flex bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  data-testid="button-post-project"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post Project
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="button-user-menu">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          {user.isAdmin && (
                            <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-xs font-medium text-orange-800 dark:text-orange-300">
                              <Shield className="mr-1 h-3 w-3" />
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center w-full" data-testid="menu-dashboard">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/messages" className="flex items-center w-full" data-testid="menu-messages">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Messages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/saved" className="flex items-center w-full" data-testid="menu-saved">
                        <Heart className="mr-2 h-4 w-4" />
                        Saved Projects
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center w-full" data-testid="menu-profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center w-full" data-testid="menu-admin">
                            <Shield className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="flex items-center w-full" data-testid="menu-settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive"
                      data-testid="menu-logout"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={onAuthClick}
                  className="hidden md:inline-flex"
                  data-testid="button-signin"
                >
                  Sign In
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onAuthClick}
                  className="hidden md:inline-flex"
                  data-testid="button-get-started"
                >
                  Get Started
                </Button>
              </>
            )}

            {/* Mobile Menu */}
            <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="md:hidden"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4">
                  {navigationItems.map((item) => (
                    item.type === "scroll" ? (
                      <button
                        key={item.href}
                        onClick={() => {
                          handleScrollToSection(item.href);
                          setShowMobileMenu(false);
                        }}
                        className="block px-2 py-1 text-lg font-medium text-foreground hover:text-primary transition-colors text-left"
                      >
                        {item.label}
                      </button>
                    ) : (
                      <Link 
                        key={item.href} 
                        href={item.href}
                        className="block px-2 py-1 text-lg font-medium text-foreground hover:text-primary transition-colors"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        {item.label}
                      </Link>
                    )
                  ))}
                  
                  {user ? (
                    <>
                      <div className="border-t pt-4 mt-4">
                        <Link 
                          href="/dashboard"
                          className="block px-2 py-1 text-lg font-medium text-foreground hover:text-primary transition-colors"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          Dashboard
                        </Link>
                        <Link 
                          href="/messages"
                          className="block px-2 py-1 text-lg font-medium text-foreground hover:text-primary transition-colors"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          Messages
                        </Link>
                        <Link 
                          href="/saved"
                          className="block px-2 py-1 text-lg font-medium text-foreground hover:text-primary transition-colors"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          Saved Projects
                        </Link>
                        <Link 
                          href="/profile"
                          className="block px-2 py-1 text-lg font-medium text-foreground hover:text-primary transition-colors"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          Profile
                        </Link>
                        {user.isAdmin && (
                          <Link 
                            href="/admin"
                            className="block px-2 py-1 text-lg font-medium text-orange-600 dark:text-orange-400 hover:text-primary transition-colors"
                            onClick={() => setShowMobileMenu(false)}
                          >
                            <Shield className="inline-block mr-2 h-5 w-5" />
                            Admin Dashboard
                          </Link>
                        )}
                      </div>
                      <Button
                        onClick={handlePostProject}
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Post Project
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleLogout();
                          setShowMobileMenu(false);
                        }}
                      >
                        Log out
                      </Button>
                    </>
                  ) : (
                    <div className="border-t pt-4 mt-4 space-y-2">
                      <Button 
                        onClick={() => {
                          onAuthClick?.();
                          setShowMobileMenu(false);
                        }}
                        className="w-full"
                      >
                        Sign In
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          onAuthClick?.();
                          setShowMobileMenu(false);
                        }}
                        className="w-full"
                      >
                        Get Started
                      </Button>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
