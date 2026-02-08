import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Booking, AvailabilitySlot, Transaction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DepositPaymentDialog } from "@/components/escrow/deposit-payment-dialog";
import { ProposeFinalDialog } from "@/components/escrow/propose-final-dialog";
import { ApproveFinalDialog } from "@/components/escrow/approve-final-dialog";
import { SettlePaymentDialog } from "@/components/escrow/settle-payment-dialog";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  DollarSign,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Star,
  Phone,
  Mail,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Filter,
  Search,
  MoreVertical,
  Download,
  Upload,
  CreditCard,
  Shield,
  FileText,
  Bell,
  Settings
} from "lucide-react";

interface BookingWithDetails extends Booking {
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  providerName: string;
  providerEmail: string;
  providerPhone?: string;
  listingTitle: string;
  listingAddress?: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  totalAmount: number;
}

interface AvailabilityWithSlots {
  date: string;
  slots: AvailabilitySlot[];
  isAvailable: boolean;
  dayOfWeek: number;
}

const bookingActionSchema = z.object({
  action: z.enum(["confirm", "cancel", "reschedule", "complete"]),
  reason: z.string().optional(),
  notes: z.string().optional(),
  newDateTime: z.string().optional(),
});

const availabilitySchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  isAvailable: z.boolean(),
  notes: z.string().optional(),
});

const bulkAvailabilitySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  weekdays: z.array(z.number()),
  startTime: z.string(),
  endTime: z.string(),
  excludeDates: z.array(z.string()).optional(),
});

type BookingActionForm = z.infer<typeof bookingActionSchema>;
type AvailabilityForm = z.infer<typeof availabilitySchema>;
type BulkAvailabilityForm = z.infer<typeof bulkAvailabilitySchema>;

export default function BookingManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("bookings");
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookingFilter, setBookingFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [showBulkAvailability, setShowBulkAvailability] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showProposeFinalDialog, setShowProposeFinalDialog] = useState(false);
  const [showApproveFinalDialog, setShowApproveFinalDialog] = useState(false);
  const [showSettleDialog, setShowSettleDialog] = useState(false);
  const [escrowBooking, setEscrowBooking] = useState<BookingWithDetails | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Access Required</h2>
            <p className="text-muted-foreground mb-4">Please log in to manage your bookings.</p>
            <Button onClick={() => window.location.href = "/login"}>Sign In</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Fetch user bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings", user.id, bookingFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (bookingFilter !== "all") params.append("status", bookingFilter);
      const response = await fetch(`/api/bookings/user/${user.id}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json();
    },
  });

  // Fetch availability for calendar
  const { data: availability = [], isLoading: availabilityLoading } = useQuery<AvailabilityWithSlots[]>({
    queryKey: ["/api/availability", user.id, selectedDate.getFullYear(), selectedDate.getMonth()],
    queryFn: async () => {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1; // JavaScript months are 0-indexed
      const response = await fetch(`/api/availability/${user.id}?year=${year}&month=${month}`);
      if (!response.ok) throw new Error("Failed to fetch availability");
      return response.json();
    },
    enabled: user.roleProvider,
  });

  // Forms
  const bookingActionForm = useForm<BookingActionForm>({
    resolver: zodResolver(bookingActionSchema),
  });

  const availabilityForm = useForm<AvailabilityForm>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      isAvailable: true,
    },
  });

  const bulkAvailabilityForm = useForm<BulkAvailabilityForm>({
    resolver: zodResolver(bulkAvailabilitySchema),
    defaultValues: {
      weekdays: [1, 2, 3, 4, 5], // Monday to Friday
      startTime: "09:00",
      endTime: "17:00",
    },
  });

  // Mutations
  const bookingActionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: BookingActionForm }) => {
      const response = await apiRequest("POST", `/api/bookings/${id}/action`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings", user.id, bookingFilter] });
      toast({ title: "Booking action completed successfully" });
      setSelectedBooking(null);
    },
    onError: () => {
      toast({ title: "Failed to complete booking action", variant: "destructive" });
    },
  });

  // Owner approval mutation (accept/decline booking requests)
  const ownerApprovalMutation = useMutation({
    mutationFn: async ({ bookingId, action }: { bookingId: number; action: "accept" | "decline" }) => {
      const response = await apiRequest("POST", `/api/bookings/${bookingId}/respond`, { action });
      return response.json();
    },
    onSuccess: (_, { action }) => {
      // Invalidate all booking queries using predicate to match any booking-related query key
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          Array.isArray(query.queryKey) && query.queryKey[0] === "/api/bookings"
      });
      toast({ 
        title: action === "accept" ? "Booking Request Accepted" : "Booking Request Declined",
        description: action === "accept" 
          ? "You now need to complete payment to confirm the booking." 
          : "The provider has been notified that their request was declined."
      });
    },
    onError: () => {
      toast({ title: "Failed to respond to booking request", variant: "destructive" });
    },
  });

  // Payment mutation for homeowners (buyers) to pay for accepted bookings
  // NOTE: Development mode auto-confirms payments. Production requires Stripe Elements.
  const paymentMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await apiRequest("POST", "/api/create-payment-intent", { bookingId });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // Invalidate all booking queries using predicate to match any booking-related query key
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          Array.isArray(query.queryKey) && query.queryKey[0] === "/api/bookings"
      });
      
      setShowPaymentDialog(false);
      setPaymentBooking(null);
      
      // Show appropriate message based on whether payment completed
      const paymentCompleted = data.booking?.status === "paid";
      toast({ 
        title: paymentCompleted ? "Payment Successful!" : "Payment Processing",
        description: paymentCompleted 
          ? "Your booking has been confirmed and payment is complete."
          : "Payment is being processed. You'll be notified when it's complete."
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Payment Failed",
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const availabilityMutation = useMutation({
    mutationFn: async (data: AvailabilityForm) => {
      const response = await apiRequest("POST", "/api/availability", data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all availability queries for this user
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({ title: "Availability added successfully" });
      setShowAvailabilityDialog(false);
      availabilityForm.reset({
        date: new Date().toISOString().split('T')[0],
        isAvailable: true,
        startTime: "",
        endTime: "",
        notes: "",
      });
    },
    onError: () => {
      toast({ title: "Failed to add availability", variant: "destructive" });
    },
  });

  const bulkAvailabilityMutation = useMutation({
    mutationFn: async (data: BulkAvailabilityForm) => {
      const response = await apiRequest("POST", "/api/availability/bulk", data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all availability queries
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({ title: "Bulk availability set successfully" });
      setShowBulkAvailability(false);
      bulkAvailabilityForm.reset({
        weekdays: [1, 2, 3, 4, 5],
        startTime: "09:00",
        endTime: "17:00",
        startDate: "",
        endDate: "",
      });
    },
    onError: () => {
      toast({ title: "Failed to set bulk availability", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      unfunded: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      funded: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
      final_proposed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      final_approved: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      partial_released: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
      settled: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      canceled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      disputed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      no_show: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    
    return (
      <Badge className={`text-xs ${colors[status] || colors.pending}`}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      refunded: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    };
    
    return (
      <Badge className={`text-xs ${colors[status] || colors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredBookings = bookings.filter(booking => 
    searchQuery === "" || 
    booking.listingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.providerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.startAt) > new Date() && 
    booking.status === "confirmed"
  ).length;

  const pendingBookings = bookings.filter(booking => booking.status === "pending").length;

  const completedBookings = bookings.filter(booking => booking.status === "completed").length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold" data-testid="booking-management-title">Booking Management</h1>
            <p className="text-muted-foreground">Manage your bookings and availability</p>
          </div>
          <div className="flex gap-2 flex-wrap min-w-0">
            {user.roleProvider && (
              <Dialog open={showBulkAvailability} onOpenChange={setShowBulkAvailability}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-bulk-availability" className="whitespace-nowrap">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Set Bulk Availability
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Set Bulk Availability</DialogTitle>
                  </DialogHeader>
                  <Form {...bulkAvailabilityForm}>
                    <form onSubmit={bulkAvailabilityForm.handleSubmit((data) => bulkAvailabilityMutation.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={bulkAvailabilityForm.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={bulkAvailabilityForm.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={bulkAvailabilityForm.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={bulkAvailabilityForm.control}
                          name="endTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={bulkAvailabilityForm.control}
                        name="weekdays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Days of Week</FormLabel>
                            <div className="flex gap-2 flex-wrap">
                              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                                <Button
                                  key={day}
                                  type="button"
                                  variant={field.value.includes(index + 1) ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => {
                                    const newValue = field.value.includes(index + 1)
                                      ? field.value.filter(d => d !== index + 1)
                                      : [...field.value, index + 1];
                                    field.onChange(newValue);
                                  }}
                                >
                                  {day}
                                </Button>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowBulkAvailability(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={bulkAvailabilityMutation.isPending}>
                          {bulkAvailabilityMutation.isPending ? "Setting..." : "Set Availability"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
            <Button variant="outline" size="sm" data-testid="button-export-bookings" className="whitespace-nowrap">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold" data-testid="metric-upcoming-bookings">
                    {upcomingBookings}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold" data-testid="metric-pending-bookings">
                    {pendingBookings}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold" data-testid="metric-completed-bookings">
                    {completedBookings}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold" data-testid="metric-booking-revenue">
                    ${bookings.reduce((sum, booking) => sum + (booking.totalAmount / 100), 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bookings" data-testid="tab-bookings">My Bookings</TabsTrigger>
            {user.roleProvider && (
              <TabsTrigger value="availability" data-testid="tab-availability">Availability</TabsTrigger>
            )}
            <TabsTrigger value="calendar" data-testid="tab-calendar">Calendar View</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            {/* Pending Booking Requests Section - For Owners */}
            {user.roleOwner && bookings.filter(b => b.buyerUserId === user.id && b.status === "pending").length > 0 && (
              <Card className="border-orange-500 border-2 bg-orange-50 dark:bg-orange-950">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400 animate-pulse" />
                    <CardTitle className="text-orange-800 dark:text-orange-200">
                      Pending Booking Requests - Action Required!
                    </CardTitle>
                  </div>
                  <CardDescription className="text-orange-700 dark:text-orange-300">
                    You have {bookings.filter(b => b.buyerUserId === user.id && b.status === "pending").length} booking request(s) waiting for your approval.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookings
                      .filter(b => b.buyerUserId === user.id && b.status === "pending")
                      .map((booking) => (
                        <Card key={booking.id} className="bg-white dark:bg-gray-900" data-testid={`pending-request-${booking.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-2">{booking.listingTitle}</h4>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <User className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium">Provider: {booking.providerName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Clock className="w-4 h-4 text-muted-foreground" />
                                      <span>
                                        {new Date(booking.startAt).toLocaleDateString()} at {new Date(booking.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium text-lg">${(booking.totalAmount / 100).toLocaleString()}</span>
                                    </div>
                                    {booking.notes && (
                                      <div className="flex items-start gap-2">
                                        <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                                        <span className="text-xs text-muted-foreground">{booking.notes}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  size="lg"
                                  className="bg-[hsl(145,60%,45%)] hover:bg-[hsl(145,60%,35%)] text-white"
                                  onClick={() => ownerApprovalMutation.mutate({ bookingId: booking.id, action: "accept" })}
                                  disabled={ownerApprovalMutation.isPending}
                                  data-testid={`button-accept-booking-${booking.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Accept Request
                                </Button>
                                <Button
                                  size="lg"
                                  variant="destructive"
                                  onClick={() => ownerApprovalMutation.mutate({ bookingId: booking.id, action: "decline" })}
                                  disabled={ownerApprovalMutation.isPending}
                                  data-testid={`button-decline-booking-${booking.id}`}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Decline
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Accepted Bookings Awaiting Payment - For Providers */}
            {bookings.filter(b => b.buyerUserId === user.id && b.status === "accepted").length > 0 && (
              <Card className="border-blue-500 border-2 bg-blue-50 dark:bg-blue-950">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <CardTitle className="text-blue-800 dark:text-blue-200">
                      Payment Required
                    </CardTitle>
                  </div>
                  <CardDescription className="text-blue-700 dark:text-blue-300">
                    Your booking request(s) have been accepted. Complete payment to confirm.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookings
                      .filter(b => b.buyerUserId === user.id && b.status === "accepted")
                      .map((booking) => (
                        <Card key={booking.id} className="bg-white dark:bg-gray-900" data-testid={`payment-required-${booking.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-2">{booking.listingTitle}</h4>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <User className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium">Owner: {booking.ownerName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Clock className="w-4 h-4 text-muted-foreground" />
                                      <span>
                                        {new Date(booking.startAt).toLocaleDateString()} at {new Date(booking.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium text-lg">${(booking.totalAmount / 100).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-4">
                                <Button
                                  size="lg"
                                  className="bg-[hsl(15,80%,55%)] hover:bg-[hsl(15,80%,45%)] text-white"
                                  onClick={() => {
                                    setEscrowBooking(booking);
                                    setShowDepositDialog(true);
                                  }}
                                  data-testid={`button-pay-deposit-${booking.id}`}
                                >
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Pay Deposit
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Bookings</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search bookings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                        data-testid="input-search-bookings"
                      />
                    </div>
                    <Select value={bookingFilter} onValueChange={setBookingFilter}>
                      <SelectTrigger className="w-48" data-testid="select-booking-filter">
                        <SelectValue placeholder="Filter bookings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Bookings</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading bookings...</p>
                  </div>
                ) : filteredBookings.length > 0 ? (
                  <div className="space-y-4">
                    {filteredBookings.map((booking) => (
                      <Card key={booking.id} className="border-l-4 border-l-blue-500" data-testid={`booking-${booking.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusBadge(booking.status)}
                                {getPaymentBadge(booking.paymentStatus)}
                                <span className="text-xs text-muted-foreground">
                                  Booking #{booking.id}
                                </span>
                              </div>
                              <h4 className="font-semibold text-lg mb-2">{booking.listingTitle}</h4>
                              <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {user.id === booking.buyerUserId ? `Provider: ${booking.providerName}` : `Owner: ${booking.ownerName}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span>
                                      {new Date(booking.startAt).toLocaleDateString()} at {new Date(booking.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  {booking.listingAddress && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-muted-foreground" />
                                      <span>{booking.listingAddress}</span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">${(booking.totalAmount / 100).toLocaleString()}</span>
                                  </div>
                                  {booking.notes && (
                                    <div className="flex items-start gap-2">
                                      <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                                      <span className="text-xs text-muted-foreground line-clamp-2">{booking.notes}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              {/* Owner Approval Buttons - Only show for pending bookings where user is the owner */}
                              {user && user.roleOwner && booking.buyerUserId === user.id && booking.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-[hsl(145,60%,45%)] hover:bg-[hsl(145,60%,35%)] text-white"
                                    onClick={() => ownerApprovalMutation.mutate({ bookingId: booking.id, action: "accept" })}
                                    disabled={ownerApprovalMutation.isPending}
                                    data-testid={`button-accept-booking-${booking.id}`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => ownerApprovalMutation.mutate({ bookingId: booking.id, action: "decline" })}
                                    disabled={ownerApprovalMutation.isPending}
                                    data-testid={`button-decline-booking-${booking.id}`}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Decline
                                  </Button>
                                </div>
                              )}

                              {/* Escrow Action Buttons */}
                              {user && booking.buyerUserId === user.id && booking.status === "accepted" && (
                                <Button
                                  size="sm"
                                  className="bg-[hsl(15,80%,55%)] hover:bg-[hsl(15,80%,45%)] text-white"
                                  onClick={() => {
                                    setEscrowBooking(booking);
                                    setShowDepositDialog(true);
                                  }}
                                  data-testid={`button-pay-deposit-${booking.id}`}
                                >
                                  <CreditCard className="w-4 h-4 mr-1" />
                                  Pay Deposit
                                </Button>
                              )}
                              
                              {/* Provider: Propose Final Amount */}
                              {user && booking.sellerUserId === user.id && (booking.status === "funded" || booking.status === "in_progress") && (
                                <Button
                                  size="sm"
                                  className="bg-[hsl(15,80%,55%)] hover:bg-[hsl(15,80%,45%)] text-white"
                                  onClick={() => {
                                    setEscrowBooking(booking);
                                    setShowProposeFinalDialog(true);
                                  }}
                                  data-testid={`button-propose-final-${booking.id}`}
                                >
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  Propose Final
                                </Button>
                              )}
                              
                              {/* Homeowner: Approve Final Amount */}
                              {user && booking.buyerUserId === user.id && booking.status === "final_proposed" && (
                                <Button
                                  size="sm"
                                  className="bg-[hsl(15,80%,55%)] hover:bg-[hsl(15,80%,45%)] text-white"
                                  onClick={() => {
                                    setEscrowBooking(booking);
                                    setShowApproveFinalDialog(true);
                                  }}
                                  data-testid={`button-approve-final-${booking.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve Final
                                </Button>
                              )}
                              
                              {/* Homeowner/Admin: Settle Payment */}
                              {user && (booking.buyerUserId === user.id || user.isAdmin) && booking.status === "final_approved" && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => {
                                    setEscrowBooking(booking);
                                    setShowSettleDialog(true);
                                  }}
                                  data-testid={`button-settle-${booking.id}`}
                                >
                                  <CreditCard className="w-4 h-4 mr-1" />
                                  Settle Payment
                                </Button>
                              )}
                              
                              <Dialog open={selectedBooking?.id === booking.id} onOpenChange={(open) => !open && setSelectedBooking(null)}>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setSelectedBooking(booking)}
                                    data-testid={`button-manage-booking-${booking.id}`}
                                  >
                                    Manage
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Manage Booking #{booking.id}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <Label className="font-medium">Status</Label>
                                        <p>{getStatusBadge(booking.status)}</p>
                                      </div>
                                      <div>
                                        <Label className="font-medium">Payment</Label>
                                        <p>{getPaymentBadge(booking.paymentStatus)}</p>
                                      </div>
                                      <div>
                                        <Label className="font-medium">Date & Time</Label>
                                        <p>{new Date(booking.startAt).toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <Label className="font-medium">Amount</Label>
                                        <p>${(booking.totalAmount / 100).toLocaleString()}</p>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <Label className="font-medium">Service</Label>
                                      <p className="text-sm">{booking.listingTitle}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="font-medium">
                                          {user.id === booking.buyerUserId ? "Provider" : "Property Owner"}
                                        </Label>
                                        <div className="text-sm">
                                          <p>{user.id === booking.buyerUserId ? booking.providerName : booking.ownerName}</p>
                                          <p className="text-muted-foreground">
                                            {user.id === booking.buyerUserId ? booking.providerEmail : booking.ownerEmail}
                                          </p>
                                          {(user.id === booking.buyerUserId ? booking.providerPhone : booking.ownerPhone) && (
                                            <p className="text-muted-foreground">
                                              {user.id === booking.buyerUserId ? booking.providerPhone : booking.ownerPhone}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {booking.notes && (
                                      <div>
                                        <Label className="font-medium">Notes</Label>
                                        <div className="bg-muted p-3 rounded-md text-sm mt-1">
                                          {booking.notes}
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="border-t pt-4">
                                      <Form {...bookingActionForm}>
                                        <form onSubmit={bookingActionForm.handleSubmit((data) => bookingActionMutation.mutate({ id: booking.id, data }))} className="space-y-4">
                                          <FormField
                                            control={bookingActionForm.control}
                                            name="action"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Action</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                  <FormControl>
                                                    <SelectTrigger>
                                                      <SelectValue placeholder="Select action" />
                                                    </SelectTrigger>
                                                  </FormControl>
                                                  <SelectContent>
                                                    {booking.status === "pending" && (
                                                      <>
                                                        <SelectItem value="cancel">Cancel Request</SelectItem>
                                                      </>
                                                    )}
                                                    {booking.status === "accepted" && (
                                                      <>
                                                        <SelectItem value="cancel">Cancel Booking</SelectItem>
                                                      </>
                                                    )}
                                                    {booking.status === "paid" && (
                                                      <>
                                                        <SelectItem value="complete">Mark Complete</SelectItem>
                                                        <SelectItem value="reschedule">Reschedule</SelectItem>
                                                        <SelectItem value="cancel">Cancel Booking</SelectItem>
                                                      </>
                                                    )}
                                                    {booking.status === "confirmed" && (
                                                      <>
                                                        <SelectItem value="complete">Mark Complete</SelectItem>
                                                        <SelectItem value="reschedule">Reschedule</SelectItem>
                                                        <SelectItem value="cancel">Cancel</SelectItem>
                                                      </>
                                                    )}
                                                  </SelectContent>
                                                </Select>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          
                                          <FormField
                                            control={bookingActionForm.control}
                                            name="notes"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Notes (Optional)</FormLabel>
                                                <FormControl>
                                                  <Textarea placeholder="Add any notes about this action..." rows={3} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          
                                          <div className="flex justify-end gap-2">
                                            <Button 
                                              type="button" 
                                              variant="outline"
                                              onClick={() => setSelectedBooking(null)}
                                              data-testid="button-cancel-manage"
                                            >
                                              Cancel
                                            </Button>
                                            <Button type="submit" disabled={bookingActionMutation.isPending}>
                                              {bookingActionMutation.isPending ? "Processing..." : "Execute Action"}
                                            </Button>
                                          </div>
                                        </form>
                                      </Form>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              <Button 
                                size="sm" 
                                variant="outline" 
                                data-testid={`button-contact-${booking.id}`}
                                onClick={() => {
                                  // Navigate to messages with the other party
                                  const otherUserId = user.id === booking.buyerUserId ? booking.sellerUserId : booking.buyerUserId;
                                  window.location.href = `/messages?user=${otherUserId}`;
                                }}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
                    <p className="text-muted-foreground">
                      {bookingFilter === "all" 
                        ? "You don't have any bookings yet."
                        : `No ${bookingFilter} bookings found.`
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {user.roleProvider && (
            <TabsContent value="availability" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Manage Availability</CardTitle>
                  <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-availability">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Availability
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Availability Slot</DialogTitle>
                      </DialogHeader>
                      <Form {...availabilityForm}>
                        <form onSubmit={availabilityForm.handleSubmit((data) => availabilityMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={availabilityForm.control}
                            name="date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={availabilityForm.control}
                              name="startTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Time</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={availabilityForm.control}
                              name="endTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Time</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={availabilityForm.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Special instructions or notes..." rows={3} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowAvailabilityDialog(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={availabilityMutation.isPending}>
                              {availabilityMutation.isPending ? "Adding..." : "Add Availability"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {availabilityLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading availability...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert>
                        <CalendarIcon className="w-4 h-4" />
                        <AlertDescription>
                          Manage your availability to let customers know when you're available for bookings. 
                          Use bulk availability to set recurring schedules.
                        </AlertDescription>
                      </Alert>
                      
                      {availability.length > 0 ? (
                        <div className="space-y-3">
                          {availability.map((avail) => (
                            <Card key={avail.date} className="border-l-4 border-l-primary">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        {new Date(avail.date).toLocaleDateString('en-US', { 
                                          weekday: 'long', 
                                          year: 'numeric', 
                                          month: 'long', 
                                          day: 'numeric' 
                                        })}
                                      </span>
                                      <Badge variant={avail.isAvailable ? "default" : "secondary"}>
                                        {avail.isAvailable ? "Available" : "Unavailable"}
                                      </Badge>
                                    </div>
                                    {avail.slots.length > 0 && (
                                      <div className="ml-6 space-y-1">
                                        {avail.slots.map((slot) => (
                                          <div key={slot.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            <span>
                                              {slot.startTime} - {slot.endTime}
                                            </span>
                                            {slot.notes && (
                                              <span className="text-xs italic">({slot.notes})</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          <Clock className="w-12 h-12 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No availability set</h3>
                          <p>Add your available time slots to let customers book with you.</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex justify-center items-start">
                    <div className="w-full max-w-sm">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        className="rounded-md border mx-auto"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col max-h-[500px]">
                    <h4 className="font-semibold mb-4 flex-shrink-0">
                      Bookings for {selectedDate.toLocaleDateString()}
                    </h4>
                    <div className="space-y-2 overflow-y-auto flex-1">
                      {bookings
                        .filter(booking => 
                          new Date(booking.startAt).toDateString() === selectedDate.toDateString()
                        )
                        .map(booking => (
                          <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{booking.listingTitle}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(booking.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                              {user.id === booking.buyerUserId ? booking.providerName : booking.ownerName}
                            </div>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                      ))}
                    {bookings.filter(booking => 
                        new Date(booking.startAt).toDateString() === selectedDate.toDateString()
                      ).length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No bookings for this date
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />

      {/* Escrow Dialogs */}
      <DepositPaymentDialog
        open={showDepositDialog}
        onOpenChange={setShowDepositDialog}
        booking={escrowBooking ? {
          id: escrowBooking.id,
          listingTitle: escrowBooking.listingTitle,
          ownerName: escrowBooking.ownerName,
          startAt: escrowBooking.startAt,
          totalCents: escrowBooking.totalCents,
        } : null}
        depositPercentage={10}
      />
      
      <ProposeFinalDialog
        open={showProposeFinalDialog}
        onOpenChange={setShowProposeFinalDialog}
        booking={escrowBooking ? {
          id: escrowBooking.id,
          listingTitle: escrowBooking.listingTitle,
          ownerName: escrowBooking.ownerName,
          amountDepositCents: escrowBooking.amountDepositCents,
          amountBudgetedCents: escrowBooking.amountBudgetedCents,
        } : null}
      />
      
      <ApproveFinalDialog
        open={showApproveFinalDialog}
        onOpenChange={setShowApproveFinalDialog}
        booking={escrowBooking ? {
          id: escrowBooking.id,
          listingTitle: escrowBooking.listingTitle,
          providerName: escrowBooking.providerName,
          amountDepositCents: escrowBooking.amountDepositCents,
          amountFinalCents: escrowBooking.amountFinalCents,
          amountDeltaCents: escrowBooking.amountDeltaCents,
          finalProposalNote: escrowBooking.finalProposalNote,
          homeownerPmSaved: escrowBooking.homeownerPmSaved,
        } : null}
      />
      
      <SettlePaymentDialog
        open={showSettleDialog}
        onOpenChange={setShowSettleDialog}
        booking={escrowBooking ? {
          id: escrowBooking.id,
          listingTitle: escrowBooking.listingTitle,
          providerName: escrowBooking.providerName,
          amountFundedCents: escrowBooking.amountFundedCents,
        } : null}
        userRole={user?.isAdmin ? "admin" : "homeowner"}
      />
    </div>
  );
}