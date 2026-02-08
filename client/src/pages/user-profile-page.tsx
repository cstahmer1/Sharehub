import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Profile, User, ProviderSkill, PortfolioItem, Review } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Award,
  Briefcase,
  Edit,
  Plus,
  Trash2,
  ExternalLink,
  MessageCircle,
  Shield,
  Verified,
  Image as ImageIcon,
  ThumbsUp,
  Clock,
  DollarSign
} from "lucide-react";

const profileUpdateSchema = z.object({
  headline: z.string().max(100, "Headline must be under 100 characters").optional(),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  location: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
});

const skillSchema = z.object({
  skillName: z.string().min(1, "Skill name is required"),
  categoryId: z.number().optional(),
  experienceYears: z.number().min(0).max(50).optional(),
});

const portfolioSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.number().optional(),
  imageUrls: z.array(z.string()).optional(),
  projectDate: z.string().optional(),
  featured: z.boolean().optional(),
});

type ProfileUpdateForm = z.infer<typeof profileUpdateSchema>;
type SkillForm = z.infer<typeof skillSchema>;
type PortfolioForm = z.infer<typeof portfolioSchema>;

export default function UserProfilePage() {
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);

  const userId = params.userId ? parseInt(params.userId) : user?.id;
  const isOwnProfile = user?.id === userId;

  // Fetch user data
  const { data: profileUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user", userId],
    queryFn: async () => {
      const response = await fetch(`/api/profile/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["/api/profile", userId],
    queryFn: async () => {
      const response = await fetch(`/api/profile/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch provider skills
  const { data: skills = [], isLoading: skillsLoading } = useQuery<ProviderSkill[]>({
    queryKey: ["/api/provider-skills", userId],
    queryFn: async () => {
      const response = await fetch(`/api/provider-skills/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch skills");
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch portfolio items
  const { data: portfolio = [], isLoading: portfolioLoading } = useQuery<PortfolioItem[]>({
    queryKey: ["/api/portfolio", userId],
    queryFn: async () => {
      const response = await fetch(`/api/portfolio/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch portfolio");
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch reviews
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/reviews/user", userId],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/user/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    },
    enabled: !!userId,
  });

  // Forms
  const profileForm = useForm<ProfileUpdateForm>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      headline: profile?.headline || "",
      bio: profile?.bio || "",
      location: profile?.location || {},
    },
  });

  const skillForm = useForm<SkillForm>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      skillName: "",
      experienceYears: 0,
    },
  });

  const portfolioForm = useForm<PortfolioForm>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      title: "",
      description: "",
      featured: false,
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateForm) => {
      const response = await apiRequest("PATCH", `/api/profile/${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile", userId] });
      toast({ title: "Profile updated successfully" });
      setShowEditProfile(false);
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  // Add skill mutation
  const addSkillMutation = useMutation({
    mutationFn: async (data: SkillForm) => {
      const response = await apiRequest("POST", "/api/provider-skills", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider-skills", userId] });
      toast({ title: "Skill added successfully" });
      setShowAddSkill(false);
      skillForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to add skill", variant: "destructive" });
    },
  });

  // Add portfolio mutation
  const addPortfolioMutation = useMutation({
    mutationFn: async (data: PortfolioForm) => {
      const response = await apiRequest("POST", "/api/portfolio", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio", userId] });
      toast({ title: "Portfolio item added successfully" });
      setShowAddPortfolio(false);
      portfolioForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to add portfolio item", variant: "destructive" });
    },
  });

  // Update form values when profile data loads
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        headline: profile.headline || "",
        bio: profile.bio || "",
        location: profile.location || {},
      });
    }
  }, [profile, profileForm]);

  const calculateRating = () => {
    if (!profile || !profile.ratingCount) return 0;
    return parseFloat(profile.ratingAvg || "0");
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const getCategoryName = (categoryId: number | null) => {
    const categories: Record<number, string> = {
      1: "Home Improvement",
      2: "Landscaping",
      3: "Cleaning Services",
      4: "Moving & Storage",
    };
    return categoryId ? categories[categoryId] || "General" : "General";
  };

  if (userLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profileUser || !profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
            <p className="text-muted-foreground mb-4">This user profile doesn't exist or has been removed.</p>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileUser.avatarUrl || ""} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(profileUser.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2" data-testid="profile-name">
                      {profileUser.name}
                      {profileUser.emailVerified && (
                        <Verified className="w-6 h-6 text-blue-500 inline ml-2" />
                      )}
                    </h1>
                    {profile.headline && (
                      <p className="text-lg text-muted-foreground mb-2" data-testid="profile-headline">
                        {profile.headline}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {profile.location?.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{profile.location.city}, {profile.location.state || "NE"}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{calculateRating().toFixed(1)} ({profile.ratingCount} reviews)</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        <span>{profile.completedProjects} projects completed</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {isOwnProfile ? (
                      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
                        <DialogTrigger asChild>
                          <Button variant="outline" data-testid="button-edit-profile">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                          </DialogHeader>
                          <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                              <FormField
                                control={profileForm.control}
                                name="headline"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Professional Headline</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., Experienced Home Improvement Contractor" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={profileForm.control}
                                name="bio"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Bio</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Tell others about your experience and services..."
                                        rows={4}
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={profileForm.control}
                                  name="location.city"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>City</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Omaha" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={profileForm.control}
                                  name="location.state"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>State</FormLabel>
                                      <FormControl>
                                        <Input placeholder="NE" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowEditProfile(false)}>
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={updateProfileMutation.isPending}>
                                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <>
                        <Button variant="outline" data-testid="button-message-user">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        <Button data-testid="button-contact-user">
                          Contact
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {profile.bio && (
                  <p className="text-gray-700 dark:text-gray-300" data-testid="profile-bio">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="skills" data-testid="tab-skills">Skills</TabsTrigger>
            <TabsTrigger value="portfolio" data-testid="tab-portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews</TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Roles */}
            <Card>
              <CardHeader>
                <CardTitle>Roles & Capabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  {profileUser.roleOwner && (
                    <Badge variant="secondary" className="text-sm">
                      <Briefcase className="w-4 h-4 mr-1" />
                      Property Owner
                    </Badge>
                  )}
                  {profileUser.roleProvider && (
                    <Badge variant="secondary" className="text-sm">
                      <Award className="w-4 h-4 mr-1" />
                      Service Provider
                    </Badge>
                  )}
                </div>
                
                {profileUser.roleProvider && (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{skills.length}</div>
                      <div className="text-sm text-muted-foreground">Skills Listed</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{portfolio.length}</div>
                      <div className="text-sm text-muted-foreground">Portfolio Items</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{calculateRating().toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Average Rating</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">{profileUser.email}</div>
                  </div>
                </div>
                
                {profileUser.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Phone</div>
                      <div className="text-sm text-muted-foreground">{profileUser.phone}</div>
                    </div>
                  </div>
                )}
                
                {profile.location?.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Location</div>
                      <div className="text-sm text-muted-foreground">
                        {profile.location.address}, {profile.location.city}, {profile.location.state} {profile.location.zipCode}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Professional Skills</CardTitle>
                {isOwnProfile && (
                  <Dialog open={showAddSkill} onOpenChange={setShowAddSkill}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-skill">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Skill
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Professional Skill</DialogTitle>
                      </DialogHeader>
                      <Form {...skillForm}>
                        <form onSubmit={skillForm.handleSubmit((data) => addSkillMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={skillForm.control}
                            name="skillName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Skill Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Plumbing, Electrical, Carpentry" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={skillForm.control}
                            name="categoryId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="1">Home Improvement</SelectItem>
                                    <SelectItem value="2">Landscaping</SelectItem>
                                    <SelectItem value="3">Cleaning Services</SelectItem>
                                    <SelectItem value="4">Moving & Storage</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={skillForm.control}
                            name="experienceYears"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Years of Experience</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    max="50" 
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowAddSkill(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={addSkillMutation.isPending}>
                              {addSkillMutation.isPending ? "Adding..." : "Add Skill"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {skillsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading skills...</p>
                  </div>
                ) : skills.length > 0 ? (
                  <div className="grid gap-4">
                    {skills.map((skill) => (
                      <div key={skill.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`skill-${skill.id}`}>
                        <div>
                          <h4 className="font-medium">{skill.skillName}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getCategoryName(skill.categoryId)}
                            </Badge>
                            {skill.experienceYears && (
                              <span>{skill.experienceYears} years experience</span>
                            )}
                            {skill.verified && (
                              <Badge variant="secondary" className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {isOwnProfile && (
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No skills listed</h3>
                    <p className="text-muted-foreground">
                      {isOwnProfile ? "Add your professional skills to showcase your expertise." : "This user hasn't added any skills yet."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Portfolio</CardTitle>
                {isOwnProfile && (
                  <Dialog open={showAddPortfolio} onOpenChange={setShowAddPortfolio}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-portfolio">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Portfolio Project</DialogTitle>
                      </DialogHeader>
                      <Form {...portfolioForm}>
                        <form onSubmit={portfolioForm.handleSubmit((data) => addPortfolioMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={portfolioForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Project Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Modern Kitchen Renovation" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={portfolioForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe the project, challenges overcome, and results achieved..."
                                    rows={4}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={portfolioForm.control}
                              name="categoryId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="1">Home Improvement</SelectItem>
                                      <SelectItem value="2">Landscaping</SelectItem>
                                      <SelectItem value="3">Cleaning Services</SelectItem>
                                      <SelectItem value="4">Moving & Storage</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={portfolioForm.control}
                              name="projectDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowAddPortfolio(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={addPortfolioMutation.isPending}>
                              {addPortfolioMutation.isPending ? "Adding..." : "Add Project"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {portfolioLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading portfolio...</p>
                  </div>
                ) : portfolio.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {portfolio.map((item) => (
                      <Card key={item.id} className="overflow-hidden" data-testid={`portfolio-${item.id}`}>
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          {item.imageUrls && item.imageUrls.length > 0 ? (
                            <img 
                              src={item.imageUrls[0]} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-12 h-12 text-muted-foreground" />
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">{item.title}</h4>
                            {item.featured && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{getCategoryName(item.categoryId)}</span>
                            {item.projectDate && (
                              <span>{new Date(item.projectDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No portfolio projects</h3>
                    <p className="text-muted-foreground">
                      {isOwnProfile ? "Showcase your best work by adding portfolio projects." : "This user hasn't added any portfolio projects yet."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reviews & Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading reviews...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-4 gap-4 mb-6 p-4 bg-muted rounded-lg">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">{calculateRating().toFixed(1)}</div>
                        <div className="flex justify-center my-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-4 h-4 ${star <= calculateRating() ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground">Overall Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{profile.ratingCount}</div>
                        <div className="text-xs text-muted-foreground">Total Reviews</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{profile.completedProjects}</div>
                        <div className="text-xs text-muted-foreground">Projects Done</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {profile.ratingCount > 0 ? Math.round((calculateRating() / 5) * 100) : 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">Satisfaction</div>
                      </div>
                    </div>
                    
                    {reviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4" data-testid={`review-${review.id}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {review.rating}/5
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        {review.body && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {review.body}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ThumbsUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground">
                      {isOwnProfile ? "Complete projects to start receiving reviews." : "This user hasn't received any reviews yet."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Profile created</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(profileUser.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {profile.completedProjects > 0 && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Award className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="font-medium">Completed {profile.completedProjects} projects</div>
                        <div className="text-sm text-muted-foreground">
                          Building trust in the community
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {profileUser.emailVerified && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Verified className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="font-medium">Email verified</div>
                        <div className="text-sm text-muted-foreground">
                          Identity confirmed
                        </div>
                      </div>
                    </div>
                  )}
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