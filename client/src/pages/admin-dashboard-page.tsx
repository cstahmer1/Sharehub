import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { User, Listing, Review, Dispute } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users,
  Shield,
  Flag,
  DollarSign,
  TrendingUp,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Star,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Download,
  Search,
  Filter,
  MoreVertical,
  UserX,
  UserCheck,
  Clock,
  Activity,
  BarChart3,
  PieChart,
  Settings,
  Database,
  FileText,
  CreditCard,
  Gavel,
  Bell,
  RefreshCw
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalListings: number;
  totalTransactions: number;
  totalRevenue: number;
  activeDisputes: number;
  pendingVerifications: number;
  monthlyGrowth: number;
  userRetention: number;
}

interface UserManagement {
  id: number;
  name: string;
  email: string;
  status: "active" | "suspended" | "banned";
  emailVerified: boolean;
  createdAt: string;
  lastLogin: string | null;
  totalSpent: number;
  totalEarned: number;
  reviewCount: number;
  averageRating: number;
}

interface ContentModeration {
  id: number;
  type: "listing" | "review" | "profile";
  title: string;
  status: "pending" | "approved" | "rejected";
  flaggedReason: string;
  reportedBy: string;
  createdAt: string;
  content: string;
}

interface DisputeManagement {
  id: number;
  transactionId: number;
  status: "open" | "investigating" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  complainantName: string;
  respondentName: string;
  amount: number;
  createdAt: string;
  description: string;
}

const moderationActionSchema = z.object({
  action: z.enum(["approve", "reject", "suspend"]),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
});

const userActionSchema = z.object({
  action: z.enum(["suspend", "ban", "activate", "verify"]),
  reason: z.string().min(1, "Reason is required"),
  duration: z.number().optional(),
});

const disputeActionSchema = z.object({
  action: z.enum(["investigate", "resolve", "close", "escalate"]),
  resolution: z.string().optional(),
  notes: z.string().min(1, "Notes are required"),
});

type ModerationActionForm = z.infer<typeof moderationActionSchema>;
type UserActionForm = z.infer<typeof userActionSchema>;
type DisputeActionForm = z.infer<typeof disputeActionSchema>;

function ApiKeyManagement() {
  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["/api/admin/api-keys"],
    queryFn: async () => {
      const response = await fetch("/api/admin/api-keys");
      if (!response.ok) throw new Error("Failed to fetch API keys");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Loading API key status...</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5" />
        API Key Management
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Manage Stripe and Mailgun API keys for payment processing and email services.
      </p>
      
      <div className="space-y-6">
        <div className="border rounded-lg p-4 bg-muted/30">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Stripe Configuration
            {apiKeys?.stripe?.hasSecretKey && apiKeys?.stripe?.hasPublicKey ? (
              <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">Configured</Badge>
            ) : (
              <Badge variant="outline" className="ml-auto bg-yellow-50 text-yellow-700 border-yellow-200">Not Configured</Badge>
            )}
          </h4>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="font-medium">Secret Key:</p>
                <p className="text-muted-foreground font-mono">
                  {apiKeys?.stripe?.secretKey || 'Not configured'}
                </p>
              </div>
              <div>
                <p className="font-medium">Public Key:</p>
                <p className="text-muted-foreground font-mono">
                  {apiKeys?.stripe?.publicKey || 'Not configured'}
                </p>
              </div>
            </div>
            <div>
              <p className="font-medium">Webhook Secret:</p>
              <p className="text-muted-foreground font-mono">
                {apiKeys?.stripe?.webhookSecret || 'Not configured'}
              </p>
            </div>
            <Alert className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                To configure Stripe keys, use the Replit Secrets tool:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>STRIPE_SECRET_KEY - Your secret key from <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe Dashboard</a></li>
                  <li>VITE_STRIPE_PUBLIC_KEY - Your publishable key</li>
                  <li>STRIPE_WEBHOOK_SECRET - Get from <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe Webhooks</a></li>
                </ul>
                <p className="mt-2">Webhook URL: <code className="bg-muted px-1 rounded">{window.location.origin}/api/webhooks/stripe</code></p>
              </AlertDescription>
            </Alert>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-muted/30">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Mailgun Configuration
            {apiKeys?.mailgun?.hasApiKey && apiKeys?.mailgun?.hasDomain ? (
              <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">Configured</Badge>
            ) : (
              <Badge variant="outline" className="ml-auto bg-yellow-50 text-yellow-700 border-yellow-200">Not Configured</Badge>
            )}
          </h4>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium">API Key:</p>
              <p className="text-muted-foreground font-mono">
                {apiKeys?.mailgun?.apiKey || 'Not configured'}
              </p>
            </div>
            <div>
              <p className="font-medium">Domain:</p>
              <p className="text-muted-foreground font-mono">
                {apiKeys?.mailgun?.domain || 'Not configured'}
              </p>
            </div>
            <Alert className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                To configure Mailgun, use the Replit Secrets tool:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>MAILGUN_API_KEY - From <a href="https://app.mailgun.com/app/account/security/api_keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mailgun Dashboard</a></li>
                  <li>MAILGUN_DOMAIN - Your verified domain</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<DisputeManagement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [disputeFilter, setDisputeFilter] = useState("all");
  const [platformFee, setPlatformFee] = useState(10);
  const [paymentFee, setPaymentFee] = useState(2.9);
  const [showSystemLogs, setShowSystemLogs] = useState(false);
  const [showTermsEditor, setShowTermsEditor] = useState(false);

  // Check admin access
  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You don't have admin privileges to access this dashboard.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Fetch admin statistics
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error("Failed to fetch admin stats");
      return response.json();
    },
  });

  // Fetch platform fee settings
  const { data: feeSettings } = useQuery<{ platformFee: number; paymentFee: number }>({
    queryKey: ["/api/admin/settings/fees"],
  });

  // Update state when fee settings are loaded
  useEffect(() => {
    if (feeSettings) {
      setPlatformFee(feeSettings.platformFee);
      setPaymentFee(feeSettings.paymentFee);
    }
  }, [feeSettings]);

  // Fetch users for management
  const { data: users = [], isLoading: usersLoading } = useQuery<UserManagement[]>({
    queryKey: ["/api/admin/users", userFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userFilter !== "all") params.append("filter", userFilter);
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  // Fetch content for moderation
  const { data: moderationQueue = [], isLoading: moderationLoading } = useQuery<ContentModeration[]>({
    queryKey: ["/api/admin/moderation"],
    queryFn: async () => {
      const response = await fetch("/api/admin/moderation");
      if (!response.ok) throw new Error("Failed to fetch moderation queue");
      return response.json();
    },
  });

  // Fetch disputes
  const { data: disputes = [], isLoading: disputesLoading } = useQuery<DisputeManagement[]>({
    queryKey: ["/api/admin/disputes", disputeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (disputeFilter !== "all") params.append("status", disputeFilter);
      const response = await fetch(`/api/admin/disputes?${params}`);
      if (!response.ok) throw new Error("Failed to fetch disputes");
      return response.json();
    },
  });

  // Forms
  const moderationForm = useForm<ModerationActionForm>({
    resolver: zodResolver(moderationActionSchema),
  });

  const userActionForm = useForm<UserActionForm>({
    resolver: zodResolver(userActionSchema),
  });

  const disputeForm = useForm<DisputeActionForm>({
    resolver: zodResolver(disputeActionSchema),
  });

  // Mutations
  const moderationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ModerationActionForm }) => {
      const response = await apiRequest("POST", `/api/admin/moderation/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation"] });
      toast({ title: "Moderation action completed" });
    },
    onError: () => {
      toast({ title: "Failed to complete moderation action", variant: "destructive" });
    },
  });

  const userActionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UserActionForm }) => {
      const response = await apiRequest("POST", `/api/admin/users/${id}/action`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userFilter] });
      toast({ title: "User action completed" });
      setSelectedUser(null);
    },
    onError: () => {
      toast({ title: "Failed to complete user action", variant: "destructive" });
    },
  });

  const disputeActionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: DisputeActionForm }) => {
      const response = await apiRequest("POST", `/api/admin/disputes/${id}/action`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/disputes", disputeFilter] });
      toast({ title: "Dispute action completed" });
      setSelectedDispute(null);
    },
    onError: () => {
      toast({ title: "Failed to complete dispute action", variant: "destructive" });
    },
  });

  const saveFeesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/settings/fees", {
        platformFee,
        paymentFee,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Fee settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save fee settings", variant: "destructive" });
    },
  });

  const backupDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/backup");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Backup created successfully" });
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    },
    onError: () => {
      toast({ title: "Failed to create backup", variant: "destructive" });
    },
  });

  const exportReportsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/export-reports");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omahasharehub-reports-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({ title: "Reports exported successfully" });
    },
    onError: () => {
      toast({ title: "Failed to export reports", variant: "destructive" });
    },
  });

  const handleSaveFees = () => {
    saveFeesMutation.mutate();
  };

  const handleBackupData = () => {
    backupDataMutation.mutate();
  };

  const handleExportReports = () => {
    exportReportsMutation.mutate();
  };

  const getStatusBadge = (status: string, type: "user" | "content" | "dispute" = "user") => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      suspended: "destructive",
      banned: "destructive",
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      open: "destructive",
      investigating: "secondary",
      resolved: "default",
      closed: "outline",
    };
    
    return (
      <Badge variant={variants[status] || "outline"} className="text-xs">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    
    return (
      <Badge className={`text-xs ${colors[priority as keyof typeof colors] || colors.low}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => 
    searchQuery === "" || 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold" data-testid="admin-dashboard-title">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, content, and platform operations</p>
          </div>
          <div className="flex gap-2 flex-wrap min-w-0">
            <Button variant="outline" size="sm" data-testid="button-export-data" className="whitespace-nowrap">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" size="sm" data-testid="button-refresh-data" className="whitespace-nowrap">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="moderation" data-testid="tab-moderation">Moderation</TabsTrigger>
            <TabsTrigger value="disputes" data-testid="tab-disputes">Disputes</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold" data-testid="metric-total-users">
                        {statsLoading ? "..." : stats?.totalUsers.toLocaleString()}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-500">+{stats?.monthlyGrowth || 0}%</span>
                    <span className="text-muted-foreground ml-1">this month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold" data-testid="metric-total-revenue">
                        {statsLoading ? "..." : `$${((stats?.totalRevenue || 0) / 100).toLocaleString()}`}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-500">+{stats?.monthlyGrowth || 0}%</span>
                    <span className="text-muted-foreground ml-1">this month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Disputes</p>
                      <p className="text-2xl font-bold" data-testid="metric-active-disputes">
                        {statsLoading ? "..." : stats?.activeDisputes}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    <span className="text-muted-foreground">Requires attention</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Reviews</p>
                      <p className="text-2xl font-bold" data-testid="metric-pending-reviews">
                        {statsLoading ? "..." : stats?.pendingVerifications}
                      </p>
                    </div>
                    <Eye className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    <span className="text-muted-foreground">Content moderation</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-500" />
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground">Total Listings</div>
                        <div className="text-xl font-semibold">{stats?.totalListings || 0}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground">Total Transactions</div>
                        <div className="text-xl font-semibold">{stats?.totalTransactions || 0}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-purple-500" />
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground">Platform Growth</div>
                        <div className="text-xl font-semibold">+{stats?.monthlyGrowth || 0}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2" 
                    onClick={() => setActiveTab("disputes")}
                    data-testid="button-review-disputes"
                  >
                    <Gavel className="w-6 h-6" />
                    <span className="text-sm">Review Disputes</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2" 
                    onClick={() => setActiveTab("moderation")}
                    data-testid="button-moderate-content"
                  >
                    <Shield className="w-6 h-6" />
                    <span className="text-sm">Moderate Content</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2" 
                    onClick={() => setActiveTab("analytics")}
                    data-testid="button-user-analytics"
                  >
                    <BarChart3 className="w-6 h-6" />
                    <span className="text-sm">User Analytics</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2" 
                    onClick={() => setActiveTab("settings")}
                    data-testid="button-system-settings"
                  >
                    <Settings className="w-6 h-6" />
                    <span className="text-sm">System Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* User Management Controls */}
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-users"
                      />
                    </div>
                  </div>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-48" data-testid="select-user-filter">
                      <SelectValue placeholder="Filter users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {usersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading users...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`user-row-${user.id}`}>
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar>
                            <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.name}</span>
                              {user.emailVerified && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                              <span>Spent: ${user.totalSpent.toLocaleString()}</span>
                              <span>Earned: ${user.totalEarned.toLocaleString()}</span>
                              <span>Reviews: {user.reviewCount} ({user.averageRating.toFixed(1)}★)</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(user.status)}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                                data-testid={`button-manage-user-${user.id}`}
                              >
                                Manage
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Manage User: {user.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label className="font-medium">Status</Label>
                                    <p>{getStatusBadge(user.status)}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Email Verified</Label>
                                    <p>{user.emailVerified ? "Yes" : "No"}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Last Login</Label>
                                    <p>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Member Since</Label>
                                    <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                
                                <Separator />
                                
                                <Form {...userActionForm}>
                                  <form onSubmit={userActionForm.handleSubmit((data) => userActionMutation.mutate({ id: user.id, data }))} className="space-y-4">
                                    <FormField
                                      control={userActionForm.control}
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
                                              <SelectItem value="activate">Activate User</SelectItem>
                                              <SelectItem value="suspend">Suspend User</SelectItem>
                                              <SelectItem value="ban">Ban User</SelectItem>
                                              <SelectItem value="verify">Verify Email</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={userActionForm.control}
                                      name="reason"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Reason</FormLabel>
                                          <FormControl>
                                            <Textarea placeholder="Explain the reason for this action..." {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <div className="flex justify-end gap-2">
                                      <Button type="button" variant="outline">Cancel</Button>
                                      <Button type="submit" disabled={userActionMutation.isPending}>
                                        {userActionMutation.isPending ? "Processing..." : "Execute Action"}
                                      </Button>
                                    </div>
                                  </form>
                                </Form>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-6">
            {/* Content Moderation Queue */}
            <Card>
              <CardHeader>
                <CardTitle>Content Moderation Queue</CardTitle>
              </CardHeader>
              <CardContent>
                {moderationLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading moderation queue...</p>
                  </div>
                ) : moderationQueue.length > 0 ? (
                  <div className="space-y-4">
                    {moderationQueue.map((item) => (
                      <Card key={item.id} className="border-l-4 border-l-yellow-500" data-testid={`moderation-item-${item.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                </Badge>
                                {getStatusBadge(item.status, "content")}
                                <span className="text-xs text-muted-foreground">
                                  Flagged {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h4 className="font-medium mb-1">{item.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                Reason: {item.flaggedReason} | Reported by: {item.reportedBy}
                              </p>
                              <div className="bg-muted p-3 rounded-md text-sm">
                                {item.content.substring(0, 200)}
                                {item.content.length > 200 && "..."}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-green-600"
                                data-testid={`button-approve-${item.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600"
                                data-testid={`button-reject-${item.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No pending moderation</h3>
                    <p className="text-muted-foreground">All content has been reviewed and approved.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disputes" className="space-y-6">
            {/* Dispute Management */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Dispute Management</CardTitle>
                <Select value={disputeFilter} onValueChange={setDisputeFilter}>
                  <SelectTrigger className="w-48" data-testid="select-dispute-filter">
                    <SelectValue placeholder="Filter disputes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Disputes</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {disputesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading disputes...</p>
                  </div>
                ) : disputes.length > 0 ? (
                  <div className="space-y-4">
                    {disputes.map((dispute) => (
                      <Card key={dispute.id} className="border-l-4 border-l-red-500" data-testid={`dispute-${dispute.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusBadge(dispute.status, "dispute")}
                                {getPriorityBadge(dispute.priority)}
                                <span className="text-xs text-muted-foreground">
                                  Transaction #{dispute.transactionId}
                                </span>
                              </div>
                              <h4 className="font-medium mb-2">
                                {dispute.complainantName} vs {dispute.respondentName}
                              </h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                Amount: ${(dispute.amount / 100).toLocaleString()} | 
                                Created: {new Date(dispute.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-sm bg-muted p-3 rounded-md">
                                {dispute.description}
                              </p>
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSelectedDispute(dispute)}
                                  data-testid={`button-manage-dispute-${dispute.id}`}
                                >
                                  Manage
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Dispute #{dispute.id} - {dispute.complainantName} vs {dispute.respondentName}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <Label className="font-medium">Status</Label>
                                      <p>{getStatusBadge(dispute.status, "dispute")}</p>
                                    </div>
                                    <div>
                                      <Label className="font-medium">Priority</Label>
                                      <p>{getPriorityBadge(dispute.priority)}</p>
                                    </div>
                                    <div>
                                      <Label className="font-medium">Amount</Label>
                                      <p>${(dispute.amount / 100).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <Label className="font-medium">Created</Label>
                                      <p>{new Date(dispute.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label className="font-medium">Description</Label>
                                    <div className="bg-muted p-3 rounded-md text-sm mt-1">
                                      {dispute.description}
                                    </div>
                                  </div>
                                  
                                  <Separator />
                                  
                                  <Form {...disputeForm}>
                                    <form onSubmit={disputeForm.handleSubmit((data) => disputeActionMutation.mutate({ id: dispute.id, data }))} className="space-y-4">
                                      <FormField
                                        control={disputeForm.control}
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
                                                <SelectItem value="investigate">Start Investigation</SelectItem>
                                                <SelectItem value="resolve">Resolve Dispute</SelectItem>
                                                <SelectItem value="close">Close Dispute</SelectItem>
                                                <SelectItem value="escalate">Escalate</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <FormField
                                        control={disputeForm.control}
                                        name="notes"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Notes</FormLabel>
                                            <FormControl>
                                              <Textarea placeholder="Add your resolution notes..." rows={4} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <div className="flex justify-end gap-2">
                                        <Button type="button" variant="outline">Cancel</Button>
                                        <Button type="submit" disabled={disputeActionMutation.isPending}>
                                          {disputeActionMutation.isPending ? "Processing..." : "Execute Action"}
                                        </Button>
                                      </div>
                                    </form>
                                  </Form>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Gavel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No active disputes</h3>
                    <p className="text-muted-foreground">The platform is running smoothly with no disputes to resolve.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">User Growth</h4>
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold mb-1">+{stats?.monthlyGrowth || 0}%</div>
                    <div className="text-xs text-muted-foreground">Monthly growth rate</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Revenue Growth</h4>
                      <DollarSign className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold mb-1">+{stats?.monthlyGrowth || 0}%</div>
                    <div className="text-xs text-muted-foreground">Monthly revenue growth</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">User Retention</h4>
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold mb-1">{stats?.userRetention || 0}%</div>
                    <div className="text-xs text-muted-foreground">30-day retention rate</div>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-4">Platform Statistics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Users</span>
                        <span className="font-medium">{stats?.totalUsers.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Listings</span>
                        <span className="font-medium">{stats?.totalListings.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Transactions</span>
                        <span className="font-medium">{stats?.totalTransactions.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Revenue</span>
                        <span className="font-medium">${((stats?.totalRevenue || 0) / 100).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-4">Platform Health</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Active Disputes</span>
                        <span className="font-medium">{stats?.activeDisputes || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Pending Verifications</span>
                        <span className="font-medium">{stats?.pendingVerifications || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Monthly Growth</span>
                        <span className="font-medium text-green-600">+{stats?.monthlyGrowth || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">User Retention</span>
                        <span className="font-medium">{stats?.userRetention || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Platform Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Alert>
                    <Settings className="w-4 h-4" />
                    <AlertDescription>
                      Manage platform configuration, fees, and operational parameters.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-6">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">Commission & Fees</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="platform-fee">Platform Fee (%)</Label>
                          <Input 
                            id="platform-fee" 
                            type="number" 
                            defaultValue="10" 
                            className="mt-1"
                            data-testid="input-platform-fee"
                            value={platformFee}
                            onChange={(e) => setPlatformFee(Number(e.target.value))}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Commission on completed projects</p>
                        </div>
                        <div>
                          <Label htmlFor="payment-fee">Payment Processing Fee (%)</Label>
                          <Input 
                            id="payment-fee" 
                            type="number" 
                            defaultValue="2.9" 
                            className="mt-1"
                            data-testid="input-payment-fee"
                            value={paymentFee}
                            onChange={(e) => setPaymentFee(Number(e.target.value))}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Stripe/payment gateway fee (covers platform costs)</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button 
                          onClick={handleSaveFees}
                          disabled={saveFeesMutation.isPending}
                          data-testid="button-save-fees"
                        >
                          {saveFeesMutation.isPending ? "Saving..." : "Save Fee Settings"}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">Email Notifications</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Admin Email</p>
                            <p className="text-sm text-muted-foreground">support@omahasharehub.com</p>
                          </div>
                          <Button variant="outline" size="sm" data-testid="button-update-email">Update</Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">New User Notifications</p>
                            <p className="text-sm text-muted-foreground">Email alerts for new registrations</p>
                          </div>
                          <Button variant="outline" size="sm" data-testid="button-toggle-user-notifications">Enabled</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Dispute Notifications</p>
                            <p className="text-sm text-muted-foreground">Email alerts for new disputes</p>
                          </div>
                          <Button variant="outline" size="sm" data-testid="button-toggle-dispute-notifications">Enabled</Button>
                        </div>
                      </div>
                    </div>
                    
                    <ApiKeyManagement />
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">Data & Maintenance</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button 
                          variant="outline" 
                          className="h-20 flex flex-col gap-2" 
                          data-testid="button-backup-data"
                          onClick={handleBackupData}
                          disabled={backupDataMutation.isPending}
                        >
                          <Database className="w-6 h-6" />
                          <span className="text-sm">
                            {backupDataMutation.isPending ? "Creating..." : "Backup Data"}
                          </span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-20 flex flex-col gap-2" 
                          data-testid="button-export-reports"
                          onClick={handleExportReports}
                          disabled={exportReportsMutation.isPending}
                        >
                          <Download className="w-6 h-6" />
                          <span className="text-sm">
                            {exportReportsMutation.isPending ? "Exporting..." : "Export Reports"}
                          </span>
                        </Button>
                        <Dialog open={showSystemLogs} onOpenChange={setShowSystemLogs}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="h-20 flex flex-col gap-2" data-testid="button-system-logs">
                              <FileText className="w-6 h-6" />
                              <span className="text-sm">System Logs</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>System Logs</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Recent system activity and logs</p>
                              <div className="bg-muted rounded-lg p-4 font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
                                <div>[{new Date().toISOString()}] INFO: System operational</div>
                                <div>[{new Date().toISOString()}] INFO: Admin dashboard accessed</div>
                                <div className="text-muted-foreground">View full logs in server console or contact system administrator for detailed logs.</div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Dialog open={showTermsEditor} onOpenChange={setShowTermsEditor}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="h-20 flex flex-col gap-2" data-testid="button-terms-policies">
                              <Gavel className="w-6 h-6" />
                              <span className="text-sm">Terms & Policies</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Terms & Policies Management</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Alert>
                                <AlertDescription>
                                  Manage platform terms of service, privacy policy, and usage guidelines.
                                </AlertDescription>
                              </Alert>
                              <div>
                                <Label>Terms of Service</Label>
                                <Textarea 
                                  className="mt-2 min-h-[200px] font-mono text-xs"
                                  defaultValue="Terms of Service content will be managed here..."
                                  placeholder="Enter terms of service..."
                                />
                              </div>
                              <div>
                                <Label>Privacy Policy</Label>
                                <Textarea 
                                  className="mt-2 min-h-[200px] font-mono text-xs"
                                  defaultValue="Privacy Policy content will be managed here..."
                                  placeholder="Enter privacy policy..."
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowTermsEditor(false)}>Cancel</Button>
                                <Button onClick={() => {
                                  toast({ title: "Terms & policies updated successfully" });
                                  setShowTermsEditor(false);
                                }}>Save Changes</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}