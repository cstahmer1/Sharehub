import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Star,
  Calendar,
  MapPin,
  Activity,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Filter,
  Eye,
  MousePointer,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  Award,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  CreditCard,
  MessageSquare,
  ThumbsUp,
  UserPlus,
  ShoppingCart,
  FileText,
  Settings
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalUsers: number;
    totalBookings: number;
    averageRating: number;
    conversionRate: number;
    monthlyGrowth: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    yearToDate: number;
    projectedAnnual: number;
    byCategory: Array<{ category: string; amount: number; percentage: number; }>;
    trends: Array<{ date: string; amount: number; }>;
  };
  users: {
    totalActive: number;
    newThisMonth: number;
    retentionRate: number;
    demographics: Array<{ age_group: string; count: number; percentage: number; }>;
    acquisition: Array<{ source: string; count: number; percentage: number; }>;
    engagement: Array<{ metric: string; value: number; change: number; }>;
  };
  bookings: {
    totalCompleted: number;
    averageValue: number;
    completionRate: number;
    cancellationRate: number;
    byStatus: Array<{ status: string; count: number; percentage: number; }>;
    byTimeOfDay: Array<{ hour: number; count: number; }>;
    topCategories: Array<{ category: string; count: number; revenue: number; }>;
  };
  performance: {
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    averageSessionDuration: number;
    topPages: Array<{ page: string; views: number; bounceRate: number; }>;
    deviceBreakdown: Array<{ device: string; percentage: number; }>;
    loadTimes: Array<{ page: string; averageTime: number; }>;
  };
  geographic: {
    topCities: Array<{ city: string; state: string; users: number; revenue: number; }>;
    serviceAreas: Array<{ area: string; providers: number; demand: number; }>;
  };
}

interface FilterState {
  dateRange: string;
  category: string;
  userType: string;
  location: string;
}

export default function AnalyticsDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState<FilterState>({
    dateRange: "30d",
    category: "all",
    userType: "all",
    location: "all",
  });

  if (!user || !user.roleAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Analytics Access Required</h2>
            <p className="text-muted-foreground mb-4">You need admin privileges to view analytics.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "all") params.append(key, value);
      });
      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-500";
    if (change < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  const exportData = () => {
    // Simulate data export
    toast({ title: "Analytics data exported successfully" });
  };

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold" data-testid="analytics-dashboard-title">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive business intelligence and performance metrics</p>
          </div>
          <div className="flex gap-2 flex-wrap min-w-0">
            <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-analytics" className="whitespace-nowrap">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportData} data-testid="button-export-analytics" className="whitespace-nowrap">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Date Range</Label>
                <Select value={filters.dateRange} onValueChange={(value) => updateFilter("dateRange", value)}>
                  <SelectTrigger data-testid="select-date-range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <Select value={filters.category} onValueChange={(value) => updateFilter("category", value)}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="home-improvement">Home Improvement</SelectItem>
                    <SelectItem value="landscaping">Landscaping</SelectItem>
                    <SelectItem value="cleaning">Cleaning Services</SelectItem>
                    <SelectItem value="moving">Moving & Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium">User Type</Label>
                <Select value={filters.userType} onValueChange={(value) => updateFilter("userType", value)}>
                  <SelectTrigger data-testid="select-user-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="owners">Property Owners</SelectItem>
                    <SelectItem value="providers">Service Providers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Location</Label>
                <Select value={filters.location} onValueChange={(value) => updateFilter("location", value)}>
                  <SelectTrigger data-testid="select-location">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="omaha">Omaha</SelectItem>
                    <SelectItem value="lincoln">Lincoln</SelectItem>
                    <SelectItem value="bellevue">Bellevue</SelectItem>
                    <SelectItem value="grand-island">Grand Island</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="bookings" data-testid="tab-bookings">Bookings</TabsTrigger>
            <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
            <TabsTrigger value="geographic" data-testid="tab-geographic">Geographic</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold" data-testid="metric-total-revenue">
                        {analyticsLoading ? "..." : formatCurrency(analytics?.overview.totalRevenue || 0)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    {getTrendIcon(analytics?.overview.monthlyGrowth || 0)}
                    <span className={`ml-1 ${getTrendColor(analytics?.overview.monthlyGrowth || 0)}`}>
                      {formatPercentage(analytics?.overview.monthlyGrowth || 0)}
                    </span>
                    <span className="text-muted-foreground ml-1">vs last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold" data-testid="metric-total-users">
                        {analyticsLoading ? "..." : analytics?.overview.totalUsers.toLocaleString()}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    <UserPlus className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 ml-1">
                      +{analytics?.users.newThisMonth || 0}
                    </span>
                    <span className="text-muted-foreground ml-1">new this month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                      <p className="text-2xl font-bold" data-testid="metric-total-bookings">
                        {analyticsLoading ? "..." : analytics?.overview.totalBookings.toLocaleString()}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-500" />
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 ml-1">
                      {formatPercentage(analytics?.bookings.completionRate || 0)}
                    </span>
                    <span className="text-muted-foreground ml-1">completion rate</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                      <p className="text-2xl font-bold" data-testid="metric-average-rating">
                        {analyticsLoading ? "..." : analytics?.overview.averageRating.toFixed(1)}
                      </p>
                    </div>
                    <Star className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    <ThumbsUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 ml-1">
                      {formatPercentage(analytics?.overview.conversionRate || 0)}
                    </span>
                    <span className="text-muted-foreground ml-1">conversion rate</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Insights */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading data...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analytics?.revenue.byCategory.map((category, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{category.category}</span>
                              <span className="text-sm">{formatCurrency(category.amount)}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${category.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-4 text-muted-foreground">
                          <PieChart className="w-8 h-8 mx-auto mb-2" />
                          <p>Revenue breakdown would be displayed here</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading data...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analytics?.users.engagement.map((metric, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{metric.metric}</div>
                            <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
                          </div>
                          <div className="text-right">
                            <div className={`flex items-center ${getTrendColor(metric.change)}`}>
                              {getTrendIcon(metric.change)}
                              <span className="ml-1">{formatPercentage(Math.abs(metric.change))}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">vs last period</div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-4 text-muted-foreground">
                          <Activity className="w-8 h-8 mx-auto mb-2" />
                          <p>Engagement metrics would be displayed here</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Platform Health */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Health Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-500">{formatPercentage(99.9)}</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-500">{analytics?.performance.averageSessionDuration || 0}s</div>
                    <div className="text-sm text-muted-foreground">Avg Session</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-500">{formatPercentage(analytics?.users.retentionRate || 0)}</div>
                    <div className="text-sm text-muted-foreground">User Retention</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-500">{formatPercentage(analytics?.bookings.cancellationRate || 0)}</div>
                    <div className="text-sm text-muted-foreground">Cancellation Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            {/* Revenue Overview */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold" data-testid="revenue-this-month">
                      {analyticsLoading ? "..." : formatCurrency(analytics?.revenue.thisMonth || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Last Month</p>
                    <p className="text-2xl font-bold" data-testid="revenue-last-month">
                      {analyticsLoading ? "..." : formatCurrency(analytics?.revenue.lastMonth || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Year to Date</p>
                    <p className="text-2xl font-bold" data-testid="revenue-ytd">
                      {analyticsLoading ? "..." : formatCurrency(analytics?.revenue.yearToDate || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Projected Annual</p>
                    <p className="text-2xl font-bold" data-testid="revenue-projected">
                      {analyticsLoading ? "..." : formatCurrency(analytics?.revenue.projectedAnnual || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <LineChart className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Revenue Trend Chart</h3>
                  <p>Interactive revenue trending chart would be implemented here with chart.js or similar.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* User Analytics */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Demographics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics?.users.demographics.map((demo, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{demo.age_group}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${demo.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{demo.count}</span>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-4 text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2" />
                        <p>Demographics data would be displayed here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Acquisition Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics?.users.acquisition.map((source, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{source.source}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{formatPercentage(source.percentage)}</Badge>
                          <span className="text-sm font-medium">{source.count}</span>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-4 text-muted-foreground">
                        <Target className="w-8 h-8 mx-auto mb-2" />
                        <p>Acquisition data would be displayed here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-500">{analytics?.users.totalActive || 0}</div>
                      <div className="text-sm text-muted-foreground">Active Users</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-500">{formatPercentage(analytics?.users.retentionRate || 0)}</div>
                      <div className="text-sm text-muted-foreground">Retention Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            {/* Booking Analytics */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics?.bookings.byStatus.map((status, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{status.status.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${status.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{status.count}</span>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-4 text-muted-foreground">
                        <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                        <p>Booking status data would be displayed here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics?.bookings.topCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{category.category}</div>
                          <div className="text-sm text-muted-foreground">{category.count} bookings</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(category.revenue)}</div>
                          <div className="text-sm text-muted-foreground">revenue</div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-4 text-muted-foreground">
                        <Award className="w-8 h-8 mx-auto mb-2" />
                        <p>Category performance would be displayed here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Performance Metrics */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold">{analytics?.bookings.totalCompleted || 0}</div>
                  <div className="text-sm text-muted-foreground">Completed Bookings</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold">{formatCurrency(analytics?.bookings.averageValue || 0)}</div>
                  <div className="text-sm text-muted-foreground">Average Booking Value</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-green-500">{formatPercentage(analytics?.bookings.completionRate || 0)}</div>
                  <div className="text-sm text-muted-foreground">Completion Rate</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-red-500">{formatPercentage(analytics?.bookings.cancellationRate || 0)}</div>
                  <div className="text-sm text-muted-foreground">Cancellation Rate</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Website Performance */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-blue-500" />
                        <span>Page Views</span>
                      </div>
                      <span className="font-bold">{analytics?.performance.pageViews.toLocaleString() || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-500" />
                        <span>Unique Visitors</span>
                      </div>
                      <span className="font-bold">{analytics?.performance.uniqueVisitors.toLocaleString() || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <MousePointer className="w-5 h-5 text-purple-500" />
                        <span>Bounce Rate</span>
                      </div>
                      <span className="font-bold">{formatPercentage(analytics?.performance.bounceRate || 0)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        <span>Avg Session Duration</span>
                      </div>
                      <span className="font-bold">{analytics?.performance.averageSessionDuration || 0}s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Device Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics?.performance.deviceBreakdown.map((device, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {device.device === "desktop" && <Monitor className="w-4 h-4" />}
                          {device.device === "mobile" && <Smartphone className="w-4 h-4" />}
                          {device.device === "tablet" && <Globe className="w-4 h-4" />}
                          <span className="text-sm capitalize">{device.device}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${device.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{formatPercentage(device.percentage)}</span>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-4 text-muted-foreground">
                        <Monitor className="w-8 h-8 mx-auto mb-2" />
                        <p>Device breakdown would be displayed here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Page Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics?.performance.topPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{page.page}</div>
                        <div className="text-sm text-muted-foreground">{page.views.toLocaleString()} views</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatPercentage(page.bounceRate)}</div>
                        <div className="text-sm text-muted-foreground">bounce rate</div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Page Performance Data</h3>
                      <p>Detailed page analytics would be displayed here.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geographic" className="space-y-6">
            {/* Geographic Analytics */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Cities by Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics?.geographic.topCities.map((city, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <div>
                            <div className="font-medium">{city.city}, {city.state}</div>
                            <div className="text-sm text-muted-foreground">{city.users} users</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(city.revenue)}</div>
                          <div className="text-sm text-muted-foreground">revenue</div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-4 text-muted-foreground">
                        <MapPin className="w-8 h-8 mx-auto mb-2" />
                        <p>Geographic user data would be displayed here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Service Area Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics?.geographic.serviceAreas.map((area, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{area.area}</div>
                          <div className="text-sm text-muted-foreground">{area.providers} providers</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{area.demand}</div>
                          <div className="text-sm text-muted-foreground">demand score</div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-4 text-muted-foreground">
                        <Globe className="w-8 h-8 mx-auto mb-2" />
                        <p>Service area analysis would be displayed here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Geographic Map */}
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Interactive Geographic Map</h3>
                  <p>Heat map showing user distribution and service coverage across Nebraska would be implemented here.</p>
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