import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleOwner: z.boolean().optional(),
  roleProvider: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "signin" | "signup";
}

export default function AuthModal({ isOpen, onClose, defaultTab = "signin" }: AuthModalProps) {
  const { loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);

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

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        onClose();
        loginForm.reset();
      },
    });
  };

  const onRegister = (data: RegisterForm) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        onClose();
        registerForm.reset();
      },
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      loginForm.reset();
      registerForm.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to OmahaShareHub</DialogTitle>
          <DialogDescription>
            Choose how you'd like to get started
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin" data-testid="modal-tab-signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup" data-testid="modal-tab-signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 mt-6">
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal-email">Email</Label>
                <Input
                  id="modal-email"
                  type="email"
                  placeholder="Enter your email"
                  {...loginForm.register("email")}
                  data-testid="modal-input-login-email"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-password">Password</Label>
                <Input
                  id="modal-password"
                  type="password"
                  placeholder="Enter your password"
                  {...loginForm.register("password")}
                  data-testid="modal-input-login-password"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="modal-button-signin"
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

          <TabsContent value="signup" className="space-y-4 mt-6">
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal-name">Full Name</Label>
                <Input
                  id="modal-name"
                  type="text"
                  placeholder="Enter your full name"
                  {...registerForm.register("name")}
                  data-testid="modal-input-register-name"
                />
                {registerForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-register-email">Email</Label>
                <Input
                  id="modal-register-email"
                  type="email"
                  placeholder="Enter your email"
                  {...registerForm.register("email")}
                  data-testid="modal-input-register-email"
                />
                {registerForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-register-password">Password</Label>
                <Input
                  id="modal-register-password"
                  type="password"
                  placeholder="Create a password"
                  {...registerForm.register("password")}
                  data-testid="modal-input-register-password"
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
                          id="modal-roleOwner"
                          checked={field.value === true}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                          data-testid="modal-checkbox-role-owner"
                        />
                      )}
                    />
                    <Label htmlFor="modal-roleOwner" className="text-sm font-normal">
                      Post projects (Property Owner)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="roleProvider"
                      control={registerForm.control}
                      render={({ field }) => (
                        <Checkbox
                          id="modal-roleProvider"
                          checked={field.value === true}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                          data-testid="modal-checkbox-role-provider"
                        />
                      )}
                    />
                    <Label htmlFor="modal-roleProvider" className="text-sm font-normal">
                      Find work opportunities (Service Provider)
                    </Label>
                  </div>
                </div>
                {registerForm.formState.errors.roleOwner && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.roleOwner.message}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                disabled={registerMutation.isPending}
                data-testid="modal-button-signup"
              >
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  By signing up, you agree to our{" "}
                  <a href="/terms" className="text-primary hover:underline">Terms of Service</a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                </p>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
