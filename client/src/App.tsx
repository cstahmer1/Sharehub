import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ChangePasswordModal } from "@/components/modals/change-password-modal";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import SearchPage from "@/pages/search-page";
import DashboardPage from "@/pages/dashboard-page";
import ProjectDetailPage from "@/pages/project-detail-page";
import MessagesPage from "@/pages/messages-page";
import ProfilePage from "@/pages/profile-page";
import UserProfilePage from "@/pages/user-profile-page";
import AdminDashboardPage from "@/pages/admin-dashboard-page";
import BookingManagementPage from "@/pages/booking-management-page";
import AnalyticsDashboardPage from "@/pages/analytics-dashboard-page";
import PostProjectPage from "@/pages/post-project-page";
import ReviewsPage from "@/pages/reviews-page";
import SettingsPage from "@/pages/settings-page";
import SavedProjectsPage from "@/pages/saved-projects-page";
import NotFound from "@/pages/not-found";
import InfoPage from "@/pages/info-pages";

function Router() {
  const { user } = useAuth();

  return (
    <>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/project/:id" component={ProjectDetailPage} />
        <ProtectedRoute path="/saved" component={SavedProjectsPage} />
        <Route path="/how-it-works" component={InfoPage} />
        <Route path="/pricing" component={InfoPage} />
        <Route path="/safety" component={InfoPage} />
        <Route path="/resources" component={InfoPage} />
        <Route path="/success-stories" component={InfoPage} />
        <Route path="/community" component={InfoPage} />
        <Route path="/help" component={InfoPage} />
        <Route path="/contact" component={InfoPage} />
        <Route path="/terms" component={InfoPage} />
        <Route path="/privacy" component={InfoPage} />
        <ProtectedRoute path="/post-project" component={PostProjectPage} />
        <ProtectedRoute path="/dashboard" component={DashboardPage} />
        <ProtectedRoute path="/dashboard/projects" component={DashboardPage} />
        <ProtectedRoute path="/dashboard/bookings" component={BookingManagementPage} />
        <ProtectedRoute path="/messages" component={MessagesPage} />
        <ProtectedRoute path="/profile/:userId?" component={ProfilePage} />
        <ProtectedRoute path="/user/:userId" component={UserProfilePage} />
        <ProtectedRoute path="/bookings" component={BookingManagementPage} />
        <ProtectedRoute path="/dashboard/reviews" component={ReviewsPage} />
        <ProtectedRoute path="/dashboard/settings" component={SettingsPage} />
        <ProtectedRoute path="/admin" component={AdminDashboardPage} />
        <ProtectedRoute path="/analytics" component={AnalyticsDashboardPage} />
        <Route component={NotFound} />
      </Switch>
      {user?.forcePasswordChange && <ChangePasswordModal open={true} />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
