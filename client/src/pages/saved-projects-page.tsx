import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ProjectCard from "@/components/project/project-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Search } from "lucide-react";
import type { Listing } from "@shared/schema";

export default function SavedProjectsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: favorites = [], isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to view your saved projects.
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 bg-background">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-8 h-8 text-primary fill-primary" />
              <h1 className="text-3xl font-bold text-primary">Saved Projects</h1>
            </div>
            <p className="text-muted-foreground">
              Projects you've saved for later review
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-48 w-full mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Heart className="w-16 h-16 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">No Saved Projects</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't saved any projects yet. Browse available projects and save the ones you're interested in.
                  </p>
                  <Button onClick={() => setLocation("/search")} data-testid="button-browse-projects">
                    <Search className="w-4 h-4 mr-2" />
                    Browse Projects
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-6">
                {favorites.length} {favorites.length === 1 ? 'project' : 'projects'} saved
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((listing) => (
                  <ProjectCard key={listing.id} listing={listing} showOwnerInfo={true} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
