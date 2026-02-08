import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Category } from "@shared/schema";
import { X, SlidersHorizontal } from "lucide-react";

interface ProjectFiltersProps {
  onFilterChange?: (filters: any) => void;
  categories?: Category[];
  currentFilters?: any;
  className?: string;
}

export default function ProjectFilters({ 
  onFilterChange, 
  categories = [], 
  currentFilters = {},
  className = ""
}: ProjectFiltersProps) {
  const [filters, setFilters] = useState({
    categoryId: currentFilters.categoryId || "",
    priceRange: currentFilters.priceRange || [0, 10000],
    timeline: currentFilters.timeline || [],
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const timelineOptions = [
    { id: "asap", label: "ASAP (within 1 week)", value: "asap" },
    { id: "month", label: "Within 1 month", value: "month" },
    { id: "flexible", label: "Flexible timing", value: "flexible" },
  ];

  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (filters.categoryId && filters.categoryId !== "all") count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) count++;
    if (filters.timeline.length > 0) count++;
    setActiveFiltersCount(count);
  }, [filters]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Convert filters to API format
    const apiFilters: any = {};
    
    if (newFilters.categoryId && newFilters.categoryId !== "all") {
      apiFilters.categoryId = parseInt(newFilters.categoryId);
    }
    
    if (newFilters.priceRange[0] > 0) {
      apiFilters.minPrice = newFilters.priceRange[0];
    }
    
    if (newFilters.priceRange[1] < 10000) {
      apiFilters.maxPrice = newFilters.priceRange[1];
    }
    
    if (newFilters.timeline.length > 0) {
      apiFilters.timeline = newFilters.timeline.join(',');
    }
    
    onFilterChange?.(apiFilters);
  };

  const handleTimelineChange = (timelineId: string, checked: boolean) => {
    const newTimeline = checked 
      ? [...filters.timeline, timelineId]
      : filters.timeline.filter((id: string) => id !== timelineId);
    
    handleFilterChange("timeline", newTimeline);
  };

  const clearAllFilters = () => {
    const defaultFilters = {
      categoryId: "",
      priceRange: [0, 10000],
      timeline: [],
    };
    setFilters(defaultFilters);
    onFilterChange?.({});
  };

  return (
    <Card className={`sticky top-24 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <SlidersHorizontal className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
          {activeFiltersCount > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{activeFiltersCount}</Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                data-testid="button-clear-filters"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Category
          </Label>
          <Select 
            value={filters.categoryId} 
            onValueChange={(value) => handleFilterChange("categoryId", value)}
          >
            <SelectTrigger data-testid="select-filter-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range Filter */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Price Range
          </Label>
          <div className="space-y-3">
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => handleFilterChange("priceRange", value)}
              max={10000}
              min={0}
              step={100}
              className="w-full"
              data-testid="slider-price-range"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>${filters.priceRange[0].toLocaleString()}</span>
              <span>
                {filters.priceRange[1] >= 10000 
                  ? "$10,000+" 
                  : `$${filters.priceRange[1].toLocaleString()}`
                }
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Filter */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Timeline
          </Label>
          <div className="space-y-2">
            {timelineOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={filters.timeline.includes(option.value)}
                  onCheckedChange={(checked) => 
                    handleTimelineChange(option.value, checked as boolean)
                  }
                  data-testid={`checkbox-timeline-${option.id}`}
                />
                <Label 
                  htmlFor={option.id} 
                  className="text-sm font-normal text-foreground cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Apply Filters Button */}
        <Button 
          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
          onClick={() => onFilterChange?.(filters)}
          data-testid="button-apply-filters"
        >
          Apply Filters
          {activeFiltersCount > 0 && (
            <Badge variant="outline" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
