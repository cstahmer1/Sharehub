import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import AuthModal from "@/components/modals/auth-modal";
import { Listing, Profile } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  MapPin,
  Clock,
  Calendar,
  DollarSign,
  Star,
  Heart,
  Send,
  User,
  Phone,
  Mail,
  Shield,
  ChevronLeft,
  Image as ImageIcon
} from "lucide-react";
import { SimpleMap } from "@/components/map/simple-map";

export default function ProjectDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bookingStartDate, setBookingStartDate] = useState<Date>();
  const [bookingEndDate, setBookingEndDate] = useState<Date>();
  const [bookingNotes, setBookingNotes] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);

  const projectId = params.id ? parseInt(params.id) : null;

  // Fetch project details
  const { data: listing, isLoading } = useQuery<Listing>({
    queryKey: ["/api/listings", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/listings/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch listing");
      return response.json();
    },
    enabled: !!projectId,
  });

  // Fetch user's favorites to check if this listing is favorited
  const { data: favorites = [] } = useQuery<Listing[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

  // Update isFavorited when favorites data changes
  useEffect(() => {
    if (projectId) {
      setIsFavorited(favorites.some(fav => fav.id === projectId));
    }
  }, [favorites, projectId]);

  // Fetch owner profile (includes user data from API)
  const { data: ownerProfile } = useQuery<Profile & { name?: string; email?: string; avatarUrl?: string }>({
    queryKey: ["/api/profile", listing?.ownerUserId],
    queryFn: async () => {
      const response = await fetch(`/api/profile/${listing?.ownerUserId}`);
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
    enabled: !!listing?.ownerUserId,
  });

  // Favorite mutation with optimistic updates
  const favoriteMutation = useMutation({
    mutationFn: async (action: 'add' | 'remove') => {
      const method = action === 'add' ? 'POST' : 'DELETE';
      const response = await apiRequest(method, `/api/favorites/${projectId}`);
      if (action === 'remove' && response.status === 204) {
        return { action };
      }
      return response.json();
    },
    onMutate: async (action) => {
      // Optimistically update UI immediately
      setIsFavorited(action === 'add');
    },
    onSuccess: async (_, action) => {
      // Invalidate and refetch to sync with server
      await queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: action === 'add' ? "Added to favorites" : "Removed from favorites",
        description: `Project ${action === 'add' ? 'saved' : 'removed'} successfully.`,
      });
    },
    onError: (_, action) => {
      // Revert optimistic update on error
      setIsFavorited(action !== 'add');
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Inquiry mutation
  const inquiryMutation = useMutation({
    mutationFn: async () => {
      if (!inquiryMessage.trim()) throw new Error("Message is required");
      
      // First create a thread
      const threadResponse = await apiRequest("POST", "/api/threads", {
        listingId: projectId,
        participantId: listing?.ownerUserId,
        subject: `Inquiry about: ${listing?.title}`,
      });
      const thread = await threadResponse.json();

      // Then send the message
      await apiRequest("POST", "/api/messages", {
        threadId: thread.id,
        body: inquiryMessage,
      });

      return thread;
    },
    onSuccess: () => {
      toast({
        title: "Inquiry sent!",
        description: "Your message has been sent to the project owner.",
      });
      setInquiryMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send inquiry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Booking request mutation
  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!bookingStartDate || !bookingEndDate) {
        throw new Error("Please select start and end dates");
      }

      // Validate date range
      if (bookingEndDate <= bookingStartDate) {
        throw new Error("End date must be after start date");
      }

      const response = await apiRequest("POST", "/api/bookings", {
        listingId: projectId,
        startAt: bookingStartDate.toISOString(),
        endAt: bookingEndDate.toISOString(),
        notes: bookingNotes,
      });

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking request sent!",
        description: "The project owner will review your request shortly.",
      });
      setShowBookingModal(false);
      setBookingStartDate(undefined);
      setBookingEndDate(undefined);
      setBookingNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to request booking",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch images for this listing (must be called before any early returns)
  const { data: listingImages = [] } = useQuery<Array<{ id: number; url: string; altText?: string }>>({
    queryKey: ["/api/listings", projectId, "images"],
    queryFn: async () => {
      const response = await fetch(`/api/listings/${projectId}/images`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!projectId,
  });

  const handleInquiry = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    inquiryMutation.mutate();
  };

  const handleFavorite = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    // Prevent action if mutation is in progress
    if (favoriteMutation.isPending) {
      return;
    }
    
    favoriteMutation.mutate(isFavorited ? 'remove' : 'add');
  };

  const handleRequestBooking = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowBookingModal(true);
  };

  const handleBookingSubmit = () => {
    bookingMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onAuthClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Loading project details...</p>
            </div>
          </div>
        </div>
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header onAuthClick={() => setShowAuthModal(true)} />
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-2">Project not found</h1>
            <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist or has been removed.</p>
            <Link href="/search">
              <Button>Browse Projects</Button>
            </Link>
          </div>
        </div>
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </div>
    );
  }

  const projectImages = listingImages.length > 0 ? listingImages.map(img => img.url) : [];

  return (
    <div className="min-h-screen bg-background">
      <Header onAuthClick={() => setShowAuthModal(true)} />

      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/search">
            <Button variant="ghost" className="hover:bg-muted" data-testid="button-back">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <Card className="mb-6">
              <CardContent className="p-0">
                {projectImages.length > 0 ? (
                  <>
                    <div className="relative">
                      <img
                        src={projectImages[currentImageIndex]}
                        alt={listing.title}
                        className="w-full h-96 object-cover rounded-t-lg"
                      />
                      {projectImages.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {projectImages.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-3 h-3 rounded-full ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                              data-testid={`image-indicator-${index}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {projectImages.length > 1 && (
                      <div className="p-4 border-t">
                        <div className="flex space-x-2 overflow-x-auto">
                          {projectImages.map((image, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                                index === currentImageIndex ? 'border-primary' : 'border-border'
                              }`}
                              data-testid={`thumbnail-${index}`}
                            >
                              <img src={image} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-96 bg-muted rounded-t-lg flex flex-col items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No photos available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2">
                      {listing.categoryId ? 'Home Improvement' : 'General'}
                    </Badge>
                    <CardTitle className="text-2xl text-primary" data-testid="text-project-title">
                      {listing.title}
                    </CardTitle>
                    <div className="flex items-center mt-2 text-muted-foreground space-x-4">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {listing.address || 'Omaha, NE'}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Posted {new Date(listing.createdAt).toLocaleDateString()}
                      </span>
                      {listing.timeline && (
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {listing.timeline}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-secondary" data-testid="text-project-price">
                      ${(listing.priceCents / 100).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Budget</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-2">Project Description</h3>
                    <p className="text-foreground whitespace-pre-wrap" data-testid="text-project-description">
                      {listing.description}
                    </p>
                  </div>

                  {listing.requirements && (
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-2">Requirements</h3>
                      <p className="text-foreground whitespace-pre-wrap">
                        {listing.requirements}
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-4">Project Location</h3>
                    <SimpleMap
                      lat={listing.lat ? parseFloat(listing.lat as string) : undefined}
                      lng={listing.lng ? parseFloat(listing.lng as string) : undefined}
                      address={listing.address || 'Omaha, NE'}
                      className="h-64"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Action Panel */}
            {user && user.id === listing.ownerUserId ? (
              <Card className="mb-6 sticky top-24">
                <CardHeader>
                  <CardTitle>Your Project</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">This is your project listing.</p>
                  <Link href={`/dashboard`}>
                    <Button variant="outline" className="w-full" data-testid="button-manage-project">
                      Manage in Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6 sticky top-24">
                <CardHeader>
                  <CardTitle>Contact Project Owner</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Owner Info */}
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {listing.ownerUserId ? 'OW' : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{ownerProfile?.name || "Property Owner"}</div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        {ownerProfile?.ratingAvg ? `${ownerProfile.ratingAvg} (${ownerProfile.ratingCount || 0} reviews)` : "No reviews yet"}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Request Booking Button */}
                  <Button
                    onClick={handleRequestBooking}
                    className="w-full bg-[hsl(15,80%,55%)] hover:bg-[hsl(15,80%,45%)] text-white font-semibold"
                    data-testid="button-request-booking"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Request Booking
                  </Button>

                  <Separator />

                  {/* Inquiry Form */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">
                      Or send an inquiry
                    </label>
                    <Textarea
                      placeholder="Hi! I'm interested in your project. I have experience with..."
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      rows={4}
                      data-testid="textarea-inquiry-message"
                    />
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleInquiry}
                        disabled={inquiryMutation.isPending || !inquiryMessage.trim()}
                        className="flex-1"
                        data-testid="button-send-inquiry"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {inquiryMutation.isPending ? 'Sending...' : 'Send Inquiry'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleFavorite}
                        disabled={favoriteMutation.isPending}
                        className={isFavorited ? "text-red-500" : ""}
                        data-testid="button-save-favorite"
                      >
                        <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Safety Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-accent" />
                  Safety Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Always verify contractor credentials</li>
                  <li>• Use our secure payment system</li>
                  <li>• Get quotes in writing</li>
                  <li>• Check references and reviews</li>
                  <li>• Report any suspicious activity</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Booking Request Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Booking</DialogTitle>
            <DialogDescription>
              Select your preferred dates and the project owner will review your request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Date Selection */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <CalendarComponent
                  mode="single"
                  selected={bookingStartDate}
                  onSelect={(date) => {
                    setBookingStartDate(date);
                    // Reset end date if it's now invalid
                    if (date && bookingEndDate && bookingEndDate <= date) {
                      setBookingEndDate(undefined);
                    }
                  }}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                  data-testid="calendar-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <CalendarComponent
                  mode="single"
                  selected={bookingEndDate}
                  onSelect={setBookingEndDate}
                  disabled={(date) => !bookingStartDate || date <= bookingStartDate}
                  className="rounded-md border"
                  data-testid="calendar-end-date"
                />
              </div>
            </div>

            {/* Selected Dates Display */}
            {bookingStartDate && bookingEndDate && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Selected Period:</p>
                <p className="text-sm">
                  <strong>From:</strong> {bookingStartDate.toLocaleDateString()} <br />
                  <strong>To:</strong> {bookingEndDate.toLocaleDateString()} <br />
                  <strong>Budget:</strong> ${(listing?.priceCents || 0) / 100} 
                </p>
              </div>
            )}

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label>Additional Notes (Optional)</Label>
              <Textarea
                placeholder="Add any specific requirements or questions..."
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                rows={3}
                data-testid="textarea-booking-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowBookingModal(false)}
              data-testid="button-cancel-booking"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookingSubmit}
              disabled={
                !bookingStartDate || 
                !bookingEndDate || 
                bookingEndDate <= bookingStartDate ||
                bookingMutation.isPending
              }
              className="bg-[hsl(15,80%,55%)] hover:bg-[hsl(15,80%,45%)] text-white"
              data-testid="button-submit-booking"
            >
              {bookingMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
