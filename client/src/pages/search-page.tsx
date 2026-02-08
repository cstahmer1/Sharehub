import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import AuthModal from "@/components/modals/auth-modal";
import ProjectCard from "@/components/project/project-card";
import ProjectFilters from "@/components/project/project-filters";
import MapView from "@/components/map/map-view";
import { Listing } from "@shared/schema";
import { Search, List, Map, Filter, SlidersHorizontal } from "lucide-react";

export default function SearchPage() {
  const [location] = useLocation();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchParams, setSearchParams] = useState<{
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }>({});

  // Parse URL search params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const params: any = {};
    
    if (urlParams.get('q')) params.search = urlParams.get('q');
    if (urlParams.get('category')) params.categoryId = parseInt(urlParams.get('category')!);
    if (urlParams.get('minPrice')) params.minPrice = parseInt(urlParams.get('minPrice')!);
    if (urlParams.get('maxPrice')) params.maxPrice = parseInt(urlParams.get('maxPrice')!);
    
    // Don't filter by status - show all projects
    params.limit = 20;
    params.offset = 0;
    
    setSearchParams(params);
  }, [location]);

  const { data: listings = [], isLoading, error } = useQuery<Listing[]>({
    queryKey: ["/api/listings", searchParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
      
      const response = await fetch(`/api/listings?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch listings");
      return response.json();
    },
    enabled: Object.keys(searchParams).length > 0,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const handleFilterChange = (filters: any) => {
    setSearchParams({ ...searchParams, ...filters, offset: 0 });
  };

  const activeFiltersCount = Object.values(searchParams).filter(v => 
    v !== undefined && v !== "" && v !== "published"
  ).length - 2; // Exclude status and limit

  return (
    <div className="min-h-screen bg-background">
      <Header onAuthClick={() => setShowAuthModal(true)} />

      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary">Search Projects</h1>
              <p className="text-muted-foreground mt-1">
                {searchParams.search 
                  ? `Results for "${searchParams.search}"`
                  : "Browse available projects"
                }
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
                data-testid="button-toggle-filters"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  data-testid="button-list-view"
                >
                  <List className="mr-2 h-4 w-4" />
                  List
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  data-testid="button-map-view"
                >
                  <Map className="mr-2 h-4 w-4" />
                  Map
                </Button>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-muted-foreground">
            {isLoading ? (
              "Searching..."
            ) : (
              `${listings.length} project${listings.length !== 1 ? 's' : ''} found`
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-24">
              <ProjectFilters 
                onFilterChange={handleFilterChange}
                categories={categories}
                currentFilters={searchParams}
              />
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-muted-foreground">Loading projects...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive">Failed to load projects. Please try again.</p>
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-6">
                {listings.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No projects found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search criteria or browse all projects.
                    </p>
                  </div>
                ) : (
                  listings.map((listing) => (
                    <ProjectCard key={listing.id} listing={listing} />
                  ))
                )}
              </div>
            ) : (
              <MapView 
                selectedCategoryId={searchParams.categoryId} 
                searchQuery={searchParams.search}
                minPrice={searchParams.minPrice}
                maxPrice={searchParams.maxPrice}
              />
            )}

            {/* Load More */}
            {listings.length >= 20 && (
              <div className="mt-8 text-center">
                <Button 
                  variant="outline"
                  onClick={() => handleFilterChange({ 
                    offset: searchParams.offset! + 20 
                  })}
                  data-testid="button-load-more"
                >
                  Load More Projects
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}
