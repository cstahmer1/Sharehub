import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertListingSchema } from "@shared/schema";
import { z } from "zod";
import { DollarSign, MapPin, Calendar, FileText, Image as ImageIcon, X } from "lucide-react";

const postProjectSchema = insertListingSchema.extend({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priceCents: z.number().min(100, "Price must be at least $1"),
  categoryId: z.number().min(1, "Please select a category"),
}).omit({
  ownerUserId: true,
});

type PostProjectForm = z.infer<typeof postProjectSchema>;

export default function PostProjectPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [priceInput, setPriceInput] = useState("");
  const [localPreviews, setLocalPreviews] = useState<Array<{ url: string; name: string }>>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const objectUrlsRef = useRef<string[]>([]);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Omaha");
  const [state, setState] = useState("NE");
  const [zip, setZip] = useState("");
  
  // Parse edit ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit') ? parseInt(urlParams.get('edit')!) : null;
  const isEditMode = !!editId;

  const form = useForm<PostProjectForm>({
    resolver: zodResolver(postProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      priceCents: 0,
      status: "published", // Auto-publish new projects so they appear in search
      timeline: "",
      requirements: "",
    },
  });

  const { data: categories = [] } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ["/api/categories"],
  });

  // Fetch existing listing if in edit mode
  const { data: existingListing } = useQuery({
    queryKey: ["/api/listings", editId],
    queryFn: async () => {
      const response = await fetch(`/api/listings/${editId}`);
      if (!response.ok) throw new Error("Failed to fetch listing");
      return response.json();
    },
    enabled: isEditMode && !!editId,
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (existingListing) {
      // Check if listing has active bookings
      if (existingListing.hasActiveBooking) {
        toast({
          title: "Cannot edit project",
          description: "This project has active bookings and cannot be edited.",
          variant: "destructive",
        });
        setLocation("/dashboard");
        return;
      }

      form.reset({
        title: existingListing.title,
        description: existingListing.description,
        priceCents: existingListing.priceCents,
        categoryId: existingListing.categoryId,
        status: existingListing.status,
        timeline: existingListing.timeline || "",
        requirements: existingListing.requirements || "",
      });
      
      setPriceInput((existingListing.priceCents / 100).toFixed(2));
      
      // Parse address if available
      if (existingListing.address) {
        const parts = existingListing.address.split(", ");
        if (parts.length >= 3) {
          setStreet(parts[0] || "");
          setCity(parts[1] || "Omaha");
          setState(parts[2] || "NE");
          setZip(parts[3] || "");
        }
      }
    }
  }, [existingListing, form, toast, setLocation]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  const handleFilesSelected = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(f => f.type.startsWith("image/"));

    const previews = imageFiles.map(f => {
      const url = URL.createObjectURL(f);
      objectUrlsRef.current.push(url);
      return { url, name: f.name };
    });

    setSelectedFiles(imageFiles);
    setLocalPreviews(previews);
  };

  const removeLocalPreview = (index: number) => {
    if (localPreviews[index]) {
      URL.revokeObjectURL(localPreviews[index].url);
      objectUrlsRef.current = objectUrlsRef.current.filter(url => url !== localPreviews[index].url);
    }
    setLocalPreviews(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const createListingMutation = useMutation({
    mutationFn: async (data: PostProjectForm) => {
      const method = isEditMode ? "PATCH" : "POST";
      const url = isEditMode ? `/api/listings/${editId}` : "/api/listings";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: async (listing) => {
      if (selectedFiles.length > 0) {
        try {
          for (const file of selectedFiles) {
            const uploadResponse = await apiRequest("POST", "/api/objects/upload", {
              filename: file.name,
              fileSize: file.size,
              mimeType: file.type,
            });
            const uploadData = await uploadResponse.json();
            
            await fetch(uploadData.uploadURL, {
              method: "PUT",
              body: file,
            });
            
            const validateResponse = await apiRequest("POST", "/api/objects/validate", {
              objectPath: uploadData.uploadURL,
              filename: file.name,
            });
            const validationData = await validateResponse.json();
            
            await apiRequest("POST", `/api/listings/${listing.id}/images`, {
              imageURL: validationData.url,
              altText: file.name,
            });
          }
        } catch (error) {
          console.error("Failed to save images:", error);
          toast({
            title: "Warning",
            description: isEditMode ? "Project updated but some images failed to save." : "Project posted but some images failed to save.",
            variant: "destructive",
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({
        title: isEditMode ? "Project updated!" : "Project posted!",
        description: isEditMode ? "Your project has been updated successfully." : "Your project has been posted successfully.",
      });
      setLocation(`/project/${listing.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePriceChange = (value: string) => {
    setPriceInput(value);
    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (!isNaN(numericValue)) {
      form.setValue("priceCents", Math.round(numericValue * 100));
    }
  };

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  const onSubmit = async (data: PostProjectForm) => {
    if (!user?.roleOwner) {
      toast({
        title: "Permission denied",
        description: "You need a property owner account to post projects.",
        variant: "destructive",
      });
      return;
    }

    const fullAddress = [street, city, state, zip].filter(Boolean).join(", ");
    
    let coordinates = null;
    if (fullAddress) {
      coordinates = await geocodeAddress(fullAddress);
      
      // Block submission if geocoding failed
      if (!coordinates) {
        toast({
          title: "Invalid address",
          description: "We couldn't find that address. Please check for typos and try again.",
          variant: "destructive",
        });
        return;
      }
    }

    const listingData = {
      ...data,
      address: fullAddress || undefined,
      lat: coordinates?.lat ? String(coordinates.lat) : undefined,
      lng: coordinates?.lng ? String(coordinates.lng) : undefined,
    };

    createListingMutation.mutate(listingData as any);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to post a project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/auth")} className="w-full">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user.roleOwner) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Property Owner Account Required</CardTitle>
              <CardDescription>
                You need a property owner account to post projects. Please update your account settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/profile")} className="w-full">
                Go to Profile
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 bg-background">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-primary mb-2">
                {isEditMode ? "Edit Project" : "Post a New Project"}
              </h1>
              <p className="text-muted-foreground">
                Provide details about your project and connect with qualified service providers in Omaha.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Project Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Title *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Bathroom Renovation in Omaha" 
                              {...field} 
                              data-testid="input-title"
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a clear, descriptive title for your project
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide detailed information about your project, including scope, materials, and any specific requirements..."
                              className="min-h-[150px]"
                              {...field}
                              data-testid="textarea-description"
                            />
                          </FormControl>
                          <FormDescription>
                            Be specific to get accurate bids
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Preferences or Materials</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="e.g., Must use specific paint brand, prefer eco-friendly materials, need ADA-compliant fixtures..."
                              {...field}
                              value={field.value || ""}
                              data-testid="textarea-requirements"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Budget & Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="priceCents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                type="text"
                                placeholder="0.00"
                                value={priceInput}
                                onChange={(e) => handlePriceChange(e.target.value)}
                                className="pl-7"
                                data-testid="input-price"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Enter your expected budget for this project
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timeline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timeline</FormLabel>
                          <Select 
                            value={field.value || ""} 
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-timeline">
                                <SelectValue placeholder="Select timeline" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="asap">ASAP (within 1 week)</SelectItem>
                              <SelectItem value="month">Within 1 month</SelectItem>
                              <SelectItem value="flexible">Flexible timing</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            When do you need this project completed?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        placeholder="e.g., 123 Main St"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        data-testid="input-street"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="Omaha"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          data-testid="input-city"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          placeholder="NE"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          maxLength={2}
                          data-testid="input-state"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        placeholder="68102"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        maxLength={5}
                        data-testid="input-zip"
                      />
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Providers will see this to assess travel time
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      Project Photos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Upload Photos</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add photos to help providers understand the scope of work
                      </p>
                      <input
                        ref={(input) => {
                          if (input) {
                            (window as any).fileInputRef = input;
                          }
                        }}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            handleFilesSelected(e.target.files);
                          }
                        }}
                        className="hidden"
                        data-testid="input-project-photos"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          (window as any).fileInputRef?.click();
                        }}
                        className="w-full"
                        data-testid="button-choose-photos"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Choose Photos
                      </Button>
                    </div>
                    
                    {localPreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        {localPreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                              <img 
                                src={preview.url} 
                                alt={preview.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeLocalPreview(index)}
                              data-testid={`button-remove-image-${index}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {preview.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex items-center gap-4">
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={createListingMutation.isPending}
                    data-testid="button-submit-project"
                  >
                    {createListingMutation.isPending 
                      ? (isEditMode ? "Saving..." : "Posting...") 
                      : (isEditMode ? "Save Changes" : "Post Project")}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="lg"
                    onClick={() => setLocation("/dashboard")}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
