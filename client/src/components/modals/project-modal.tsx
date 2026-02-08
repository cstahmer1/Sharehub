import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertListingSchema } from "@shared/schema";
import type { Category } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { Upload, Plus, X } from "lucide-react";

const projectFormSchema = insertListingSchema.extend({
  startDate: z.string().optional(),
  duration: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectModal({ isOpen, onClose }: ProjectModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priceCents: 0,
      currency: "USD",
      address: "",
      timeline: "",
      requirements: "",
      categoryId: undefined,
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const listingData = {
        ...data,
        priceCents: Math.round(data.priceCents * 100), // Convert dollars to cents
        ownerUserId: user?.id,
      };
      
      const response = await apiRequest("POST", "/api/listings", listingData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({
        title: "Project posted successfully!",
        description: "Your project is now live and visible to service providers.",
      });
      onClose();
      form.reset();
      setSelectedImages([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    createListingMutation.mutate(data);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validImages = files.filter(file => file.type.startsWith('image/'));
    
    if (validImages.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Please select only image files.",
        variant: "destructive",
      });
    }
    
    setSelectedImages(prev => [...prev, ...validImages].slice(0, 5)); // Max 5 images
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      form.reset();
      setSelectedImages([]);
    }
  };

  const durationOptions = [
    { value: "1-2 days", label: "1-2 days" },
    { value: "3-7 days", label: "3-7 days" },
    { value: "1-2 weeks", label: "1-2 weeks" },
    { value: "2-4 weeks", label: "2-4 weeks" },
    { value: "1-2 months", label: "1-2 months" },
    { value: "More than 2 months", label: "More than 2 months" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a New Project</DialogTitle>
          <DialogDescription>
            Tell us about the work you need done
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Project Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              placeholder="e.g., Kitchen Renovation, Bathroom Repair, Garden Design"
              {...form.register("title")}
              data-testid="input-project-title"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Category and Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                onValueChange={(value) => form.setValue("categoryId", parseInt(value))}
                value={form.watch("categoryId")?.toString()}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="0"
                min="0"
                step="50"
                {...form.register("priceCents", { valueAsNumber: true })}
                data-testid="input-project-budget"
              />
              {form.formState.errors.priceCents && (
                <p className="text-sm text-destructive">{form.formState.errors.priceCents.message}</p>
              )}
            </div>
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Describe your project in detail. Include what work needs to be done, any specific requirements, timeline, etc."
              {...form.register("description")}
              data-testid="textarea-project-description"
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Project Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Project Address</Label>
            <Input
              id="address"
              placeholder="Enter the project location"
              {...form.register("address")}
              data-testid="input-project-address"
            />
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <Label>Timeline</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Preferred Start Date</Label>
                <Input
                  type="date"
                  {...form.register("startDate")}
                  data-testid="input-start-date"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Expected Duration</Label>
                <Select onValueChange={(value) => form.setValue("timeline", value)}>
                  <SelectTrigger data-testid="select-duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <Label htmlFor="requirements">Special Preferences or Materials (Optional)</Label>
            <Textarea
              id="requirements"
              rows={3}
              placeholder="e.g., Must use specific paint brand, prefer eco-friendly materials, need ADA-compliant fixtures..."
              {...form.register("requirements")}
              data-testid="textarea-project-requirements"
            />
          </div>

          {/* Project Photos */}
          <div className="space-y-2">
            <Label>Project Photos</Label>
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag & drop photos here or click to browse
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="project-images"
                  data-testid="input-project-images"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('project-images')?.click()}
                  data-testid="button-choose-files"
                >
                  Choose Files
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Maximum 5 images, 10MB each
                </p>
              </CardContent>
            </Card>

            {/* Selected Images Preview */}
            {selectedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {selectedImages.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              data-testid="button-cancel-project"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createListingMutation.isPending}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              data-testid="button-submit-project"
            >
              {createListingMutation.isPending ? (
                <>
                  <Plus className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Post Project
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
