import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Handshake, Shield, Users, CheckCircle } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleOwner: z.boolean().optional(),
  roleProvider: z.boolean().optional(),
}).refine((data) => data.roleOwner || data.roleProvider, {
  message: "Please select at least one role",
  path: ["roleOwner"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("signin");
  const [loginError, setLoginError] = useState<string>("");
  const [registerError, setRegisterError] = useState<string>("");

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roleOwner: false,
      roleProvider: false,
    },
  });

  // Clear errors when user types
  useEffect(() => {
    const subscription = registerForm.watch(() => {
      if (registerError) {
        setRegisterError("");
      }
    });
    return () => subscription.unsubscribe();
  }, [registerForm, registerError]);

  useEffect(() => {
    const subscription = loginForm.watch(() => {
      if (loginError) {
        setLoginError("");
      }
    });
    return () => subscription.unsubscribe();
  }, [loginForm, loginError]);

  // Capture mutation errors
  useEffect(() => {
    if (registerMutation.isError && registerMutation.error) {
      const error = registerMutation.error as any;
      // Check if this is a validation error with specific field errors
      let errorMessage = error.message;
      if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        // Extract and format validation error messages
        errorMessage = error.errors.map((err: any) => err.message).join(', ');
      }
      console.log("Register error:", errorMessage);
      setRegisterError(errorMessage);
    }
  }, [registerMutation.isError, registerMutation.error]);

  useEffect(() => {
    if (loginMutation.isError) {
      setLoginError(loginMutation.error.message);
    }
  }, [loginMutation.isError, loginMutation.error]);

  // Redirect if already authenticated
  if (user) {
    return <Redirect to="/dashboard" />;
  }

  const onLogin = (data: LoginForm) => {
    setLoginError("");
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterForm) => {
    setRegisterError("");
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                <Handshake className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-primary">Welcome to OmahaShareHub</h1>
            <p className="text-muted-foreground mt-2">Choose how you'd like to get started</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin" data-testid="tab-signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...loginForm.register("email")}
                    data-testid="input-login-email"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    {...loginForm.register("password")}
                    data-testid="input-login-password"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                {(loginError || loginMutation.isError) && (
                  <div className="rounded-md bg-destructive/10 p-3">
                    <p className="text-sm text-destructive font-medium">
                      {loginError || loginMutation.error?.message || "Login failed"}
                    </p>
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-signin"
                >
                  {loginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
                <div className="text-center">
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary">
                    Forgot your password?
                  </a>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    {...registerForm.register("name")}
                    data-testid="input-register-name"
                  />
                  {registerForm.formState.errors.name && (
                    <p className="text-sm text-destructive">{registerForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    {...registerForm.register("email")}
                    data-testid="input-register-email"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Create a password"
                    {...registerForm.register("password")}
                    data-testid="input-register-password"
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label>I want to:</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="roleOwner"
                        control={registerForm.control}
                        render={({ field }) => (
                          <Checkbox
                            id="roleOwner"
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                            data-testid="checkbox-role-owner"
                          />
                        )}
                      />
                      <Label htmlFor="roleOwner" className="text-sm font-normal cursor-pointer">
                        Post projects (Property Owner)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="roleProvider"
                        control={registerForm.control}
                        render={({ field }) => (
                          <Checkbox
                            id="roleProvider"
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                            data-testid="checkbox-role-provider"
                          />
                        )}
                      />
                      <Label htmlFor="roleProvider" className="text-sm font-normal cursor-pointer">
                        Find work opportunities (Service Provider)
                      </Label>
                    </div>
                  </div>
                  {registerForm.formState.errors.roleOwner && (
                    <p className="text-sm text-destructive">{registerForm.formState.errors.roleOwner.message}</p>
                  )}
                </div>
                {(registerError || registerMutation.isError) && (
                  <div className="rounded-md bg-destructive/10 p-3" data-testid="error-registration">
                    <p className="text-sm text-destructive font-medium">
                      {registerError || registerMutation.error?.message || "Registration failed"}
                    </p>
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  disabled={registerMutation.isPending}
                  data-testid="button-signup"
                >
                  {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    By signing up, you agree to our{" "}
                    <a href="#" className="text-primary hover:underline">Terms of Service</a>{" "}
                    and{" "}
                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </p>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="flex flex-col justify-center p-12">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold mb-6">Join Our Community</h2>
            <p className="text-lg mb-8 text-primary-foreground/90">
              Connect with trusted professionals and property owners in Omaha. 
              Build lasting relationships while getting work done.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 mt-1 text-secondary" />
                <div>
                  <h3 className="font-semibold">Secure Payments</h3>
                  <p className="text-sm text-primary-foreground/80">
                    Protected escrow system ensures safe transactions
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Users className="h-6 w-6 mt-1 text-secondary" />
                <div>
                  <h3 className="font-semibold">Verified Professionals</h3>
                  <p className="text-sm text-primary-foreground/80">
                    All service providers are background checked
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 mt-1 text-secondary" />
                <div>
                  <h3 className="font-semibold">Quality Guarantee</h3>
                  <p className="text-sm text-primary-foreground/80">
                    Satisfaction guaranteed or your money back
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
