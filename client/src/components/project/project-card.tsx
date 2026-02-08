import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Listing } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  MapPin,
  Clock,
  Calendar,
  Star,
  Heart,
  Send,
  DollarSign,
  Image as ImageIcon
} from "lucide-react";

interface ProjectCardProps {
  listing: Listing;
  showOwnerInfo?: boolean;
}

export default function ProjectCard({ listing, showOwnerInfo = true }: ProjectCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);

  // Fetch user's favorites to check if this listing is favorited
  const { data: favorites = [] } = useQuery<Listing[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

  // Update isFavorited when favorites data changes
  useEffect(() => {
    setIsFavorited(favorites.some(fav => fav.id === listing.id));
  }, [favorites, listing.id]);

  // Fetch listing images
  const { data: listingImages = [] } = useQuery<Array<{ id: number; url: string; altText?: string }>>({
    queryKey: ["/api/listings", listing.id, "images"],
    queryFn: async () => {
      const response = await fetch(`/api/listings/${listing.id}/images`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Fetch owner profile
  const { data: ownerProfile } = useQuery<{ name?: string; ratingAvg?: string; ratingCount?: number }>({
    queryKey: ["/api/profile", listing.ownerUserId],
    queryFn: async () => {
      const response = await fetch(`/api/profile/${listing.ownerUserId}`);
      if (!response.ok) return {};
      return response.json();
    },
    enabled: showOwnerInfo,
  });

  const projectImage = listingImages.length > 0 ? listingImages[0].url : null;

  // Favorite mutation with optimistic updates
  const favoriteMutation = useMutation({
    mutationFn: async (action: 'add' | 'remove') => {
      const method = action === 'add' ? 'POST' : 'DELETE';
      const response = await apiRequest(method, `/api/favorites/${listing.id}`);
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

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to save projects.",
        variant: "destructive",
      });
      return;
    }
    
    // Prevent action if mutation is in progress
    if (favoriteMutation.isPending) {
      return;
    }
    
    favoriteMutation.mutate(isFavorited ? 'remove' : 'add');
  };

  const handleInquire = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to send inquiries.",
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to project detail page where inquiry can be sent
    window.location.href = `/project/${listing.id}`;
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffInMs = now.getTime() - posted.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const getCategoryName = (categoryId: number | null) => {
    // Mock category mapping - in real app this would come from categories data
    const categories: Record<number, string> = {
      1: "Home Improvement",
      2: "Landscaping", 
      3: "Repairs & Maintenance",
      4: "Cleaning Services",
      5: "Moving & Storage"
    };
    return categoryId ? categories[categoryId] || "General" : "General";
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <Link href={`/project/${listing.id}`} className="block">
          <div className="md:flex">
            {/* Project Image */}
            <div className="md:w-1/3">
              {projectImage ? (
                <img 
                  src={projectImage}
                  alt={listing.title}
                  className="w-full h-48 md:h-full object-cover"
                  data-testid={`image-project-${listing.id}`}
                />
              ) : (
                <div className="w-full h-48 md:h-full bg-muted flex flex-col items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No photo</p>
                </div>
              )}
            </div>
            
            {/* Project Details */}
            <div className="md:w-2/3 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Badge variant="secondary" className="mb-2">
                    {getCategoryName(listing.categoryId)}
                  </Badge>
                  <h3 
                    className="text-xl font-semibold text-primary hover:text-primary/80 cursor-pointer mb-2"
                    data-testid={`text-project-title-${listing.id}`}
                  >
                    {listing.title}
                  </h3>
                  <p 
                    className="text-muted-foreground mb-4 line-clamp-3"
                    data-testid={`text-project-description-${listing.id}`}
                  >
                    {listing.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {listing.address || 'Omaha, NE'}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Posted {formatTimeAgo(listing.createdAt.toString())}
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
                  <div 
                    className="text-2xl font-bold text-secondary"
                    data-testid={`text-project-price-${listing.id}`}
                  >
                    ${(listing.priceCents / 100).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Budget</div>
                </div>
              </div>
              
              {/* Owner Info and Actions */}
              <div className="flex items-center justify-between">
                {showOwnerInfo && (
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {ownerProfile?.name ? ownerProfile.name.charAt(0).toUpperCase() : 'OW'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-foreground">{ownerProfile?.name || "Property Owner"}</div>
                      {ownerProfile?.ratingAvg ? (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Star className="w-3 h-3 text-yellow-500 mr-1" />
                          {ownerProfile.ratingAvg} ({ownerProfile.ratingCount || 0} reviews)
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">No reviews yet</div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFavorite}
                    disabled={favoriteMutation.isPending}
                    className={isFavorited ? "text-red-500" : ""}
                    data-testid={`button-favorite-${listing.id}`}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${isFavorited ? 'fill-current' : ''}`} />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleInquire}
                    data-testid={`button-inquire-${listing.id}`}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Inquire
                  </Button>
                </div>
              </div>
            </div>
          </div>
      </Link>
    </Card>
  );
}
