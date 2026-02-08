import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Review, Booking } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReviewSchema } from "@shared/schema";
import { z } from "zod";
import {
  Star,
  ThumbsUp,
  MessageSquare,
  Calendar,
  Award,
  TrendingUp,
  User,
  Shield,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface ReviewWithDetails extends Review {
  reviewerName: string;
  revieweeName: string;
  bookingTitle?: string;
}

interface BookingForReview extends Booking {
  listingTitle: string;
  otherPartyName: string;
  otherPartyId: number;
}

const reviewFormSchema = z.object({
  rating: z.number().min(1).max(5),
  body: z.string().min(10, "Review must be at least 10 characters"),
});

type ReviewForm = z.infer<typeof reviewFormSchema>;

export default function ReviewsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<"received" | "given" | "pending">("received");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingForReview | null>(null);

  const { data: receivedReviews = [], isLoading: receivedLoading } = useQuery<ReviewWithDetails[]>({
    queryKey: ["/api/reviews/user", user?.id, "received"],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/user/${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      const data = await response.json();
      return data.filter((r: Review) => r.revieweeUserId === user?.id);
    },
    enabled: !!user,
  });

  const { data: givenReviews = [], isLoading: givenLoading } = useQuery<ReviewWithDetails[]>({
    queryKey: ["/api/reviews/user", user?.id, "given"],
    queryFn: async () => {
      const response = await fetch(`/api/reviews?reviewerId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    },
    enabled: !!user,
  });

  const { data: pendingBookings = [], isLoading: pendingLoading } = useQuery<BookingForReview[]>({
    queryKey: ["/api/bookings/pending-reviews", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/bookings?status=completed`);
      if (!response.ok) throw new Error("Failed to fetch bookings");
      const allBookings = await response.json();
      
      const bookingsNeedingReview = [];
      for (const booking of allBookings) {
        const reviewResponse = await fetch(`/api/reviews/booking/${booking.id}`);
        if (reviewResponse.ok) {
          const existingReviews = await reviewResponse.json();
          const hasReviewed = existingReviews.some((r: Review) => r.reviewerUserId === user?.id);
          if (!hasReviewed) {
            bookingsNeedingReview.push(booking);
          }
        }
      }
      return bookingsNeedingReview;
    },
    enabled: !!user,
  });

  const reviewForm = useForm<ReviewForm>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 5,
      body: "",
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: {
      bookingId: number;
      reviewerUserId: number;
      revieweeUserId: number;
      rating: number;
      body: string;
      published: boolean;
    }) => {
      const response = await apiRequest("POST", "/api/reviews", reviewData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/user", user?.id, "received"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/user", user?.id, "given"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/pending-reviews", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      setShowReviewDialog(false);
      reviewForm.reset();
      setSelectedBooking(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitReview = (data: ReviewForm) => {
    if (!selectedBooking || !user) return;
    
    createReviewMutation.mutate({
      ...data,
      bookingId: selectedBooking.id,
      reviewerUserId: user.id,
      revieweeUserId: selectedBooking.otherPartyId,
      published: true,
    });
  };

  const openReviewDialog = (booking: BookingForReview) => {
    setSelectedBooking(booking);
    reviewForm.reset({
      rating: 5,
      body: "",
    });
    setShowReviewDialog(true);
  };

  const calculateAverageRating = () => {
    if (receivedReviews.length === 0) return 0;
    const sum = receivedReviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / receivedReviews.length).toFixed(1);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Access Required</h2>
            <p className="text-muted-foreground mb-4">Please log in to view reviews.</p>
            <Button onClick={() => window.location.href = "/auth"}>Sign In</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Reviews & Ratings</h1>
            <p className="text-muted-foreground">Manage your reviews and feedback</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Average Rating</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-yellow-400/10">
                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{calculateAverageRating()}</div>
                    <div className="text-xs text-muted-foreground">out of 5.0</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Reviews Received</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-primary/10">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{receivedReviews.length}</div>
                    <div className="text-xs text-muted-foreground">reviews</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Pending Reviews</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-accent/10">
                    <AlertCircle className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{pendingBookings.length}</div>
                    <div className="text-xs text-muted-foreground">to write</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as typeof selectedTab)}>
              <CardHeader>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="received" data-testid="tab-received">
                    Received ({receivedReviews.length})
                  </TabsTrigger>
                  <TabsTrigger value="given" data-testid="tab-given">
                    Given ({givenReviews.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending" data-testid="tab-pending">
                    Pending ({pendingBookings.length})
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="pt-6">
                <TabsContent value="received" className="mt-0">
                  {receivedLoading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading reviews...</p>
                    </div>
                  ) : receivedReviews.length === 0 ? (
                    <div className="text-center py-12">
                      <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No reviews received yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {receivedReviews.map((review) => (
                        <Card key={review.id} data-testid={`review-received-${review.id}`}>
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <Avatar>
                                <AvatarFallback>
                                  <User className="w-5 h-5" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="font-medium">{review.reviewerName || `User ${review.reviewerUserId}`}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {renderStars(review.rating)}
                                      <span className="text-sm text-muted-foreground">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  {review.published && (
                                    <Badge variant="outline" className="gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      Published
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{review.body}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="given" className="mt-0">
                  {givenLoading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading reviews...</p>
                    </div>
                  ) : givenReviews.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">You haven't written any reviews yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {givenReviews.map((review) => (
                        <Card key={review.id} data-testid={`review-given-${review.id}`}>
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <Avatar>
                                <AvatarFallback>
                                  <User className="w-5 h-5" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="font-medium">Review for {review.revieweeName || `User ${review.revieweeUserId}`}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {renderStars(review.rating)}
                                      <span className="text-sm text-muted-foreground">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{review.body}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pending" className="mt-0">
                  {pendingLoading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading bookings...</p>
                    </div>
                  ) : pendingBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-muted-foreground">All caught up! No pending reviews.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingBookings.map((booking) => (
                        <Card key={booking.id} data-testid={`booking-pending-${booking.id}`}>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium mb-1">{booking.listingTitle}</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Completed {new Date(booking.endAt).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  With: {booking.otherPartyName || `User ${booking.otherPartyId}`}
                                </p>
                              </div>
                              <Button
                                onClick={() => openReviewDialog(booking)}
                                data-testid={`button-review-${booking.id}`}
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Write Review
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>

      <Footer />

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>

          <Form {...reviewForm}>
            <form onSubmit={reviewForm.handleSubmit(onSubmitReview)} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">For: {selectedBooking?.otherPartyName}</p>
                  <p className="text-sm text-muted-foreground">Project: {selectedBooking?.listingTitle}</p>
                </div>

                <FormField
                  control={reviewForm.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall Rating</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => field.onChange(star)}
                              className="focus:outline-none"
                              data-testid={`star-rating-${star}`}
                            >
                              <Star
                                className={`w-8 h-8 cursor-pointer transition-colors ${
                                  star <= field.value
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground hover:text-yellow-400"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-muted-foreground">
                            {field.value} star{field.value !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={reviewForm.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Review</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Share your experience working with this person..."
                          rows={5}
                          data-testid="input-review-body"
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum 10 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReviewDialog(false)}
                  data-testid="button-cancel-review"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createReviewMutation.isPending}
                  data-testid="button-submit-review"
                >
                  {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
