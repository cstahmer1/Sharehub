import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Profile, Listing, Review } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Star,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  User,
  Briefcase,
  Heart,
  MessageCircle,
  DollarSign,
  Clock,
  CheckCircle,
  Shield
} from "lucide-react";

export default function ProfilePage() {
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    headline: "",
    bio: "",
    location: {},
  });

  const profileUserId = params.userId ? parseInt(params.userId) : user?.id;
  const isOwnProfile = user?.id === profileUserId;

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["/api/profile", profileUserId],
    queryFn: async () => {
      const response = await fetch(`/api/profile/${profileUserId}`);
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
    enabled: !!profileUserId,
  });

  // Fetch user's listings (if owner)
  const { data: userListings = [] } = useQuery<Listing[]>({
    queryKey: ["/api/listings", { ownerId: profileUserId }],
    queryFn: async () => {
      const response = await fetch(`/api/listings?ownerId=${profileUserId}`);
      if (!response.ok) throw new Error("Failed to fetch listings");
      return response.json();
    },
    enabled: !!profileUserId,
  });

  // Fetch user's reviews
  const { data: userReviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/reviews", { userId: profileUserId }],
    queryFn: async () => {
      const response = await fetch(`/api/reviews?userId=${profileUserId}`);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    },
    enabled: !!profileUserId,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<Profile>) => {
      const response = await apiRequest("PATCH", "/api/profile", profileData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile", profileUserId] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditClick = () => {
    if (profile) {
      setEditForm({
        headline: profile.headline || "",
        bio: profile.bio || "",
        location: profile.location || {},
      });
    }
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editForm);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({ headline: "", bio: "", location: {} });
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-2">Profile not found</h1>
            <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const completedProjects = profile.completedProjects || 0;
  const averageRating = parseFloat(profile.ratingAvg || "0");
  const totalReviews = profile.ratingCount || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="text-2xl">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-primary" data-testid="text-profile-name">
                        {user?.name || 'User'}
                      </h1>
                      {isEditing ? (
                        <Input
                          placeholder="Professional headline"
                          value={editForm.headline}
                          onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                          className="mt-2 max-w-md"
                          data-testid="input-headline"
                        />
                      ) : (
                        profile.headline && (
                          <p className="text-lg text-muted-foreground mt-1" data-testid="text-headline">
                            {profile.headline}
                          </p>
                        )
                      )}

                      <div className="flex items-center space-x-4 mt-3">
                        <div className="flex items-center">
                          <Star className="w-5 h-5 text-yellow-500 mr-1" />
                          <span className="font-medium">{averageRating.toFixed(1)}</span>
                          <span className="text-muted-foreground ml-1">({totalReviews} reviews)</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <CheckCircle className="w-5 h-5 mr-1" />
                          <span>{completedProjects} completed projects</span>
                        </div>
                        {profile.location?.city && (
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="w-5 h-5 mr-1" />
                            <span>{profile.location.city}, {profile.location.state || 'NE'}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mt-3">
                        {user?.isAdmin && (
                          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/40">
                            <Shield className="w-3 h-3 mr-1" />
                            Administrator
                          </Badge>
                        )}
                        {user?.roleOwner && (
                          <Badge variant="secondary">Property Owner</Badge>
                        )}
                        {user?.roleProvider && (
                          <Badge variant="outline">Service Provider</Badge>
                        )}
                      </div>
                    </div>

                    {isOwnProfile && (
                      <div className="flex space-x-2">
                        {isEditing ? (
                          <>
                            <Button 
                              size="sm" 
                              onClick={handleSaveProfile}
                              disabled={updateProfileMutation.isPending}
                              data-testid="button-save-profile"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button variant="outline" size="sm" onClick={handleEditClick} data-testid="button-edit-profile">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-4">
                      <Label>Bio</Label>
                      <Textarea
                        placeholder="Tell others about yourself, your experience, and what you're looking for..."
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        rows={4}
                        className="mt-1"
                        data-testid="textarea-bio"
                      />
                    </div>
                  ) : (
                    profile.bio && (
                      <p className="text-foreground mt-4 whitespace-pre-wrap" data-testid="text-bio">
                        {profile.bio}
                      </p>
                    )
                  )}
                </div>

                {!isOwnProfile && (
                  <div className="flex flex-col space-y-2">
                    <Button data-testid="button-send-message">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <Button variant="outline" data-testid="button-add-favorite">
                      <Heart className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {user?.roleOwner && (
                <TabsTrigger value="projects">Projects ({userListings.length})</TabsTrigger>
              )}
              <TabsTrigger value="reviews">Reviews ({totalReviews})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <Card>
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="w-8 h-8 text-accent mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">{completedProjects}</div>
                    <div className="text-sm text-muted-foreground">Projects Completed</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">{averageRating.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Average Rating</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <MessageCircle className="w-8 h-8 text-secondary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">{totalReviews}</div>
                    <div className="text-sm text-muted-foreground">Total Reviews</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity - Hidden until real data is available */}
            </TabsContent>

            {user?.roleOwner && (
              <TabsContent value="projects" className="space-y-6">
                {userListings.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No projects yet</h3>
                      <p className="text-muted-foreground mb-4">Start by posting your first project</p>
                      <Button>Post a Project</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userListings.map((listing) => (
                      <Card key={listing.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-3">
                            <Badge variant={listing.status === "published" ? "default" : "secondary"}>
                              {listing.status}
                            </Badge>
                            <div className="text-lg font-bold text-secondary">
                              ${(listing.priceCents / 100).toLocaleString()}
                            </div>
                          </div>
                          <h3 className="font-semibold text-foreground mb-2">{listing.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {listing.description}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground space-x-3">
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {listing.address || 'Omaha, NE'}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(listing.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent value="reviews" className="space-y-6">
              {userReviews.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground">Complete projects to start receiving reviews</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {userReviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <Avatar>
                            <AvatarFallback>
                              R{review.reviewerUserId}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {review.body && (
                              <p className="text-foreground">{review.body}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
}
