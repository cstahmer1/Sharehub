import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Settings,
  Bell,
  Mail,
  Lock,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  User,
  CreditCard,
  ExternalLink
} from "lucide-react";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [bookingNotifications, setBookingNotifications] = useState(true);
  const [reviewNotifications, setReviewNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  
  const [stripeConnectStatus, setStripeConnectStatus] = useState<any>(null);

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      const response = await apiRequest("POST", "/api/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to change password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveNotificationsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiRequest("PUT", "/api/user/notification-settings", settings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/user/account");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitPassword = (data: PasswordForm) => {
    changePasswordMutation.mutate(data);
  };

  const handleSaveNotifications = () => {
    saveNotificationsMutation.mutate({
      emailNotifications,
      messageNotifications,
      bookingNotifications,
      reviewNotifications,
      marketingEmails,
    });
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      if (confirm("This will permanently delete all your data including projects, bookings, and messages. Are you absolutely sure?")) {
        deleteAccountMutation.mutate();
      }
    }
  };

  // Stripe Connect mutations
  const createConnectAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/connect/create-or-link", {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.existing) {
        toast({
          title: "Account found",
          description: "Your Stripe Connect account is already set up.",
        });
      } else {
        toast({
          title: "Account created",
          description: "Stripe Connect account created successfully.",
        });
      }
      checkConnectStatusMutation.mutate();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/connect/onboarding-link", {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start onboarding",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkConnectStatusMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/connect/status");
      if (!response.ok) throw new Error("Failed to check status");
      return response.json();
    },
    onSuccess: (data) => {
      setStripeConnectStatus(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to check payout status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSetupPayouts = async () => {
    if (!user || !user.roleProvider) {
      toast({
        title: "Provider account required",
        description: "Only service providers can set up payouts.",
        variant: "destructive",
      });
      return;
    }

    // Create account if doesn't exist, then start onboarding
    await createConnectAccountMutation.mutateAsync();
    startOnboardingMutation.mutate();
  };

  // Check Stripe Connect status on mount for providers
  useEffect(() => {
    if (user && user.roleProvider) {
      checkConnectStatusMutation.mutate();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Access Required</h2>
            <p className="text-muted-foreground mb-4">Please log in to access settings.</p>
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <CardTitle>Account Information</CardTitle>
                </div>
                <CardDescription>Your basic account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                </div>
                <div>
                  <Label>Name</Label>
                  <p className="text-sm text-muted-foreground mt-1">{user.name}</p>
                </div>
                <div>
                  <Label>Account Type</Label>
                  <div className="flex gap-2 mt-1">
                    {user.roleOwner && (
                      <span className="text-sm px-2 py-1 bg-primary/10 text-primary rounded">
                        Property Owner
                      </span>
                    )}
                    {user.roleProvider && (
                      <span className="text-sm px-2 py-1 bg-accent/10 text-accent rounded">
                        Service Provider
                      </span>
                    )}
                    {user.isAdmin && (
                      <span className="text-sm px-2 py-1 bg-destructive/10 text-destructive rounded">
                        Administrator
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  <CardTitle>Change Password</CardTitle>
                </div>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showCurrentPassword ? "text" : "password"}
                                placeholder="Enter current password"
                                data-testid="input-current-password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                data-testid="button-toggle-current-password"
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showNewPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                data-testid="input-new-password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                data-testid="button-toggle-new-password"
                              >
                                {showNewPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Must be at least 8 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm new password"
                                data-testid="input-confirm-password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                data-testid="button-toggle-confirm-password"
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={changePasswordMutation.isPending}
                      data-testid="button-change-password"
                    >
                      {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  <CardTitle>Notification Preferences</CardTitle>
                </div>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about your account
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                    data-testid="switch-email-notifications"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="message-notifications">Message Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when you receive new messages
                    </p>
                  </div>
                  <Switch
                    id="message-notifications"
                    checked={messageNotifications}
                    onCheckedChange={setMessageNotifications}
                    data-testid="switch-message-notifications"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="booking-notifications">Booking Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about booking status changes
                    </p>
                  </div>
                  <Switch
                    id="booking-notifications"
                    checked={bookingNotifications}
                    onCheckedChange={setBookingNotifications}
                    data-testid="switch-booking-notifications"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="review-notifications">Review Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when you receive new reviews
                    </p>
                  </div>
                  <Switch
                    id="review-notifications"
                    checked={reviewNotifications}
                    onCheckedChange={setReviewNotifications}
                    data-testid="switch-review-notifications"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing-emails">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive promotional emails and updates
                    </p>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={marketingEmails}
                    onCheckedChange={setMarketingEmails}
                    data-testid="switch-marketing-emails"
                  />
                </div>

                <Button
                  onClick={handleSaveNotifications}
                  disabled={saveNotificationsMutation.isPending}
                  data-testid="button-save-notifications"
                >
                  {saveNotificationsMutation.isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </CardContent>
            </Card>

            {user.roleProvider && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    <CardTitle>Payout Settings</CardTitle>
                  </div>
                  <CardDescription>
                    Set up your Stripe Connect account to receive payments when projects are completed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stripeConnectStatus && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                        <div className="space-y-1">
                          <Label>Payout Status</Label>
                          <div className="flex items-center gap-2">
                            {stripeConnectStatus.payoutStatus === "READY" ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-600">Ready to receive payouts</span>
                              </>
                            ) : stripeConnectStatus.payoutStatus === "PENDING" ? (
                              <>
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                <span className="text-sm font-medium text-orange-500">Onboarding incomplete</span>
                              </>
                            ) : stripeConnectStatus.payoutStatus === "RESTRICTED" ? (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <span className="text-sm font-medium text-red-600">Account restricted</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Not set up</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => checkConnectStatusMutation.mutate()}
                          disabled={checkConnectStatusMutation.isPending}
                          data-testid="button-refresh-payout-status"
                        >
                          {checkConnectStatusMutation.isPending ? "Checking..." : "Refresh"}
                        </Button>
                      </div>

                      {stripeConnectStatus.requirements && stripeConnectStatus.requirements.length > 0 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Additional information required: {stripeConnectStatus.requirements.join(", ")}
                          </AlertDescription>
                        </Alert>
                      )}

                      {stripeConnectStatus.disabledReason && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Your payout account is restricted: {stripeConnectStatus.disabledReason}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    {stripeConnectStatus?.payoutStatus === "READY" ? (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Your payout account is fully set up! You'll receive funds when projects are completed.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          To receive payments when homeowners mark projects as complete, you need to complete Stripe Connect onboarding.
                          This verifies your identity and sets up direct deposits to your bank account.
                        </p>
                        <Button
                          onClick={handleSetupPayouts}
                          disabled={createConnectAccountMutation.isPending || startOnboardingMutation.isPending}
                          data-testid="button-setup-payouts"
                          className="w-full sm:w-auto"
                        >
                          {createConnectAccountMutation.isPending || startOnboardingMutation.isPending ? (
                            "Loading..."
                          ) : stripeConnectStatus?.payoutStatus === "PENDING" ? (
                            <>
                              Complete Onboarding
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </>
                          ) : (
                            <>
                              Set Up Payouts
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-destructive">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-destructive" />
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </div>
                <CardDescription>Irreversible actions that affect your account</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Deleting your account will permanently remove all your data including projects,
                    bookings, messages, and reviews. This action cannot be undone.
                  </AlertDescription>
                </Alert>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountMutation.isPending}
                  data-testid="button-delete-account"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
