import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import AuthModal from "@/components/modals/auth-modal";
import ContactModal from "@/components/modals/contact-modal";
import ProjectCard from "@/components/project/project-card";
import ProjectFilters from "@/components/project/project-filters";
import MapView from "@/components/map/map-view";
import { useQuery } from "@tanstack/react-query";
import { Listing } from "@shared/schema";
import { 
  Search, 
  Plus, 
  List, 
  Map, 
  ClipboardList, 
  MessageCircle, 
  Shield, 
  Star,
  MapPin,
  Clock,
  Calendar,
  Heart,
  Send,
  HelpCircle
} from "lucide-react";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [budgetRange, setBudgetRange] = useState("any");

  // Fetch featured listings
  const { data: listings = [], isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings", { status: "published", limit: 6 }],
    queryFn: async () => {
      const response = await fetch("/api/listings?status=published&limit=6");
      if (!response.ok) throw new Error("Failed to fetch listings");
      return response.json();
    },
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (budgetRange !== "any") params.set("budget", budgetRange);
    setLocation(`/search?${params.toString()}`);
  };

  const handlePostProject = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setLocation('/post-project');
    }
  };

  const handleFindWork = () => {
    setLocation("/search");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onAuthClick={() => setShowAuthModal(true)} 
        onPostProjectClick={handlePostProject}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 py-24 sm:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-6xl">
              Connect. Collaborate. Complete.
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              OmahaShareHub brings together property owners and skilled providers for seamless project completion. Post your project or find work that matches your expertise.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={handlePostProject}
                data-testid="button-post-project"
              >
                <Plus className="mr-2 h-4 w-4" />
                Post a Project
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={handleFindWork}
                data-testid="button-find-work"
              >
                <Search className="mr-2 h-4 w-4" />
                Find Work
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="container mx-auto px-4 lg:px-8 mt-16">
          <div className="mx-auto max-w-4xl">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      What do you need help with?
                    </label>
                    <Input
                      placeholder="Search projects, skills, or services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Budget Range
                    </label>
                    <Select value={budgetRange} onValueChange={setBudgetRange}>
                      <SelectTrigger data-testid="select-budget">
                        <SelectValue placeholder="Any budget" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any budget</SelectItem>
                        <SelectItem value="0-500">$0 - $500</SelectItem>
                        <SelectItem value="500-2000">$500 - $2,000</SelectItem>
                        <SelectItem value="2000-5000">$2,000 - $5,000</SelectItem>
                        <SelectItem value="5000+">$5,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      className="w-full" 
                      onClick={handleSearch}
                      data-testid="button-search"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 sm:py-32 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              How OmahaShareHub Works
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Simple steps to connect property owners with trusted providers
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-secondary">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center mb-6">
                    <ClipboardList className="text-secondary h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-4">1. Post or Browse</h3>
                  <p className="text-muted-foreground mb-6">
                    Property owners post projects with details and budget. Providers browse and find work that matches their skills.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={handlePostProject} 
                      className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                      data-testid="button-how-post-project"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Post a Project
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleFindWork}
                      className="w-full"
                      data-testid="button-how-find-work"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Browse Projects
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-accent">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                    <MessageCircle className="text-accent h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-4">2. Connect & Plan</h3>
                  <p className="text-muted-foreground mb-6">
                    Message directly to discuss details, timeline, and expectations. Schedule meetings and plan the work together.
                  </p>
                  <div className="space-y-3 text-sm text-left">
                    <div className="flex items-start gap-2">
                      <Send className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <span>Direct messaging with providers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <span>Schedule meetings and site visits</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <span>Review provider ratings & history</span>
                    </div>
                  </div>
                  {user && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-6"
                      onClick={() => setLocation("/messages")}
                      data-testid="button-how-messages"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      View Messages
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Shield className="text-primary h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-4">3. Secure Payment</h3>
                  <p className="text-muted-foreground mb-6">
                    Book with confidence using our secure escrow system. Funds are protected until work is completed to everyone's satisfaction.
                  </p>
                  <div className="space-y-3 text-sm text-left">
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Secure escrow holds funds safely</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Payment released after completion</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Heart className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Mutual reviews build trust</span>
                    </div>
                  </div>
                  {user && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-6"
                      onClick={() => setLocation("/bookings")}
                      data-testid="button-how-bookings"
                    >
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Manage Bookings
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">Ready to get started?</p>
              <Button 
                size="lg" 
                onClick={() => user ? handlePostProject() : setShowAuthModal(true)}
                data-testid="button-how-get-started"
              >
                {user ? "Post Your First Project" : "Join OmahaShareHub Today"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-24 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Featured Projects
              </h2>
              <p className="mt-2 text-muted-foreground">Discover opportunities in your area</p>
            </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <ProjectFilters />
            </div>

            {/* Projects List/Map */}
            <div className="lg:col-span-2">
              {viewMode === "list" ? (
                <div className="space-y-6">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="mt-2 text-muted-foreground">Loading projects...</p>
                    </div>
                  ) : listings.length === 0 ? (
                    <div className="text-center py-12">
                      <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-foreground">No projects found</p>
                      <p className="text-muted-foreground">Be the first to post a project!</p>
                    </div>
                  ) : (
                    listings.map((listing) => (
                      <ProjectCard key={listing.id} listing={listing} />
                    ))
                  )}

                  {listings.length > 0 && (
                    <div className="mt-8 text-center">
                      <Link href="/search">
                        <Button variant="outline" data-testid="button-load-more">
                          Load More Projects
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <MapView />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Help/FAQ Section */}
      <section id="help" className="py-24 sm:py-32 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <HelpCircle className="text-primary h-8 w-8" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to know about using OmahaShareHub
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left" data-testid="faq-getting-started">
                  How do I get started on OmahaShareHub?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Simply create an account by clicking "Sign Up" and selecting whether you're a property owner looking to post projects or a service provider looking for work. You can choose both roles if needed. Once registered, property owners can immediately start posting projects, while providers can browse and bid on available work.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left" data-testid="faq-payments">
                  How does the payment system work?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  OmahaShareHub uses a secure escrow system powered by Stripe. When a project is booked, the payment is held safely in escrow. Funds are only released to the provider after the work is completed and approved by the property owner. This protects both parties and ensures quality work.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left" data-testid="faq-fees">
                  What are the fees for using the platform?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Creating an account and posting projects is completely free for property owners. Service providers can browse projects for free as well. A small service fee is applied to completed transactions to cover payment processing and platform maintenance. Detailed fee information is provided before any booking is confirmed.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left" data-testid="faq-safety">
                  How do I know providers are trustworthy?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  OmahaShareHub includes a comprehensive review and rating system. You can view a provider's complete work history, ratings from previous clients, and detailed reviews before booking. We encourage all users to communicate through our secure messaging system to discuss project details, timelines, and expectations before committing.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left" data-testid="faq-disputes">
                  What happens if there's a problem with a project?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Our escrow system protects both parties. If issues arise, you can contact our support team who will help mediate the situation. Funds remain in escrow until the dispute is resolved fairly. We also encourage open communication between property owners and providers to resolve minor issues directly.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger className="text-left" data-testid="faq-area">
                  Is OmahaShareHub only for Omaha area?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Currently, OmahaShareHub primarily serves the Omaha metropolitan area and surrounding communities. This local focus helps us build a stronger, more connected community of property owners and service providers. We're considering expansion to other regions based on user demand.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger className="text-left" data-testid="faq-categories">
                  What types of projects can I post or find?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  OmahaShareHub supports a wide range of project categories including home repairs, renovations, cleaning services, landscaping, painting, plumbing, electrical work, HVAC, roofing, and more. Whether it's a small repair or a major renovation, you can find skilled providers ready to help.
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">Still have questions?</p>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setShowContactModal(true)}
                data-testid="button-contact-support"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
      {/* Modals */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      <ContactModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)} 
      />
    </div>
  );
}
