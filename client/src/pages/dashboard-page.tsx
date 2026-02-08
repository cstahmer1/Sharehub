import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import StatsCards from "@/components/dashboard/stats-cards";
import { Listing, Booking, Message, Review } from "@shared/schema";

type ListingWithBookingStatus = Listing & { hasActiveBooking?: boolean };
import { 
  Plus, 
  Search, 
  Calendar, 
  MessageCircle, 
  Star, 
  User, 
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch user's listings
  const { data: userListings = [] } = useQuery<ListingWithBookingStatus[]>({
    queryKey: ["/api/listings", { ownerId: user?.id }],
    queryFn: async () => {
      const response = await fetch(`/api/listings?ownerId=${user?.id}&status=`);
      if (!response.ok) throw new Error("Failed to fetch listings");
      return response.json();
    },
    enabled: !!user?.roleOwner,
  });

  // Fetch user's bookings
  const { data: userBookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    queryFn: async () => {
      const response = await fetch("/api/bookings");
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json();
    },
  });

  // Fetch user's reviews to calculate real average rating
  const { data: userReviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/reviews", { revieweeId: user?.id }],
    queryFn: async () => {
      const response = await fetch(`/api/reviews?revieweeId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    },
    enabled: !!user,
  });

  // Delete listing mutation
  const deleteMutation = useMutation({
    mutationFn: async (listingId: number) => {
      await apiRequest("DELETE", `/api/listings/${listingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({
        title: "Project deleted",
        description: "Your project has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteListing = (listingId: number) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteMutation.mutate(listingId);
    }
  };

  // No hardcoded activity - would be fetched from API in real implementation
  const recentActivity: any[] = [];

  const activeProjects = userListings.filter(listing => listing.status === "published").length;
  const completedJobs = userBookings.filter(booking => booking.status === "completed").length;
  const averageRating = userReviews.length > 0 
    ? userReviews.reduce((sum, review) => sum + review.rating, 0) / userReviews.length 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
            <p className="text-muted-foreground">Manage your projects, bookings, and account</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <nav className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start bg-primary/10 text-primary">
                      <Calendar className="w-5 h-5 mr-3" />
                      Overview
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        const projectsSection = document.getElementById('my-projects-section');
                        projectsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      data-testid="button-my-projects"
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      My Projects
                    </Button>
                    <Link href="/dashboard/bookings">
                      <Button variant="ghost" className="w-full justify-start">
                        <Calendar className="w-5 h-5 mr-3" />
                        Bookings
                      </Button>
                    </Link>
                    <Link href="/messages">
                      <Button variant="ghost" className="w-full justify-start">
                        <MessageCircle className="w-5 h-5 mr-3" />
                        Messages
                      </Button>
                    </Link>
                    <Link href="/dashboard/reviews">
                      <Button variant="ghost" className="w-full justify-start">
                        <Star className="w-5 h-5 mr-3" />
                        Reviews
                      </Button>
                    </Link>
                    <Link href="/profile">
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="w-5 h-5 mr-3" />
                        Profile
                      </Button>
                    </Link>
                    <Link href="/dashboard/settings">
                      <Button variant="ghost" className="w-full justify-start">
                        <Settings className="w-5 h-5 mr-3" />
                        Settings
                      </Button>
                    </Link>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Stats Cards */}
              <StatsCards 
                activeProjects={activeProjects}
                completedJobs={completedJobs}
                averageRating={averageRating}
              />

              {/* Recent Activity - Hidden until real data is available */}
              {recentActivity.length > 0 && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                          <div className={`w-2 h-2 ${activity.color} rounded-full`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{activity.message}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex items-start"
                      onClick={() => setLocation('/post-project')}
                      data-testid="button-post-project"
                    >
                      <div className="p-2 rounded-lg bg-secondary/10 mr-3">
                        <Plus className="h-4 w-4 text-secondary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">Post New Project</p>
                        <p className="text-sm text-muted-foreground">Create a new project listing</p>
                      </div>
                    </Button>

                    <Link href="/search">
                      <Button variant="outline" className="h-auto p-4 flex items-start w-full">
                        <div className="p-2 rounded-lg bg-accent/10 mr-3">
                          <Search className="h-4 w-4 text-accent" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-foreground">Find Work</p>
                          <p className="text-sm text-muted-foreground">Browse available projects</p>
                        </div>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Projects/Bookings */}
              {user?.roleOwner && userListings.length > 0 && (
                <Card className="mt-8" id="my-projects-section">
                  <CardHeader>
                    <CardTitle>My Recent Projects</CardTitle>
                    <CardDescription>{userListings.length} total project{userListings.length !== 1 ? 's' : ''}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {userListings.map((listing) => (
                        <div key={listing.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{listing.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              ${(listing.priceCents / 100).toLocaleString()} • {listing.status}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={listing.status === "published" ? "default" : "secondary"}>
                              {listing.status}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setLocation(`/project/${listing.id}`)}
                              data-testid={`button-view-${listing.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => setLocation(`/post-project?edit=${listing.id}`)}
                                      disabled={listing.hasActiveBooking}
                                      data-testid={`button-edit-${listing.id}`}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {listing.hasActiveBooking && (
                                  <TooltipContent>
                                    <p>Cannot edit project with active bookings</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDeleteListing(listing.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-${listing.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {userBookings.length > 0 && (
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle>Recent Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {userBookings.slice(0, 3).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium text-foreground">Booking #{booking.id}</h4>
                            <p className="text-sm text-muted-foreground">
                              ${(booking.totalCents / 100).toLocaleString()} • {new Date(booking.startAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={
                            booking.status === "completed" ? "default" :
                            booking.status === "in_progress" ? "secondary" :
                            "outline"
                          }>
                            {booking.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
