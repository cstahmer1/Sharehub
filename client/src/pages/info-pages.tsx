import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home, Mail, FileText, Shield, Briefcase, Award, Users, HelpCircle, Phone, Book } from "lucide-react";
import ContactModal from "@/components/modals/contact-modal";

const infoContent: Record<string, { title: string; icon: any; content: string[] }> = {
  "how-it-works": {
    title: "How It Works",
    icon: Book,
    content: [
      "OmahaShareHub makes it easy to connect property owners with skilled service providers.",
      "1. Post Your Project: Property owners describe their needs with photos and details",
      "2. Get Proposals: Qualified providers submit competitive bids",
      "3. Choose Your Provider: Review profiles, ratings, and proposals",
      "4. Secure Payment: Funds are held securely until project completion",
      "5. Complete & Review: Leave feedback to help the community grow",
    ],
  },
  pricing: {
    title: "Pricing",
    icon: FileText,
    content: [], // Dynamic content loaded from platform settings
  },
  safety: {
    title: "Safety & Trust",
    icon: Shield,
    content: [
      "Your safety and security are our top priorities.",
      "Verified Profiles: All service providers undergo identity verification",
      "Secure Payments: Funds held in escrow until project completion",
      "Rating System: Transparent reviews from real customers",
      "Dispute Resolution: Dedicated support team to resolve conflicts",
      "Insurance: Recommend all providers carry appropriate liability coverage",
    ],
  },
  resources: {
    title: "Provider Resources",
    icon: Briefcase,
    content: [
      "Resources to help service providers succeed on OmahaShareHub.",
      "Getting Started Guide: Learn how to create a compelling profile",
      "Best Practices: Tips for winning projects and delighting clients",
      "Marketing Tools: Showcase your work and build your reputation",
      "Community Forum: Connect with other providers and share insights",
      "Support: Access our help center anytime you need assistance",
    ],
  },
  "success-stories": {
    title: "Success Stories",
    icon: Award,
    content: [
      "Real stories from our community members.",
      "Featured Success: Local contractor expanded business by 300% through OmahaShareHub",
      "Homeowner Spotlight: Complete kitchen renovation finished on time and under budget",
      "Provider Growth: From solo operator to team of five in one year",
      "Community Impact: Over 10,000 successful projects completed in the Omaha area",
      "Join our growing community and write your own success story!",
    ],
  },
  community: {
    title: "Community",
    icon: Users,
    content: [
      "Join the OmahaShareHub community.",
      "Forums: Connect with property owners and providers",
      "Events: Attend local networking and educational events",
      "Blog: Read tips, trends, and success stories",
      "Newsletter: Stay updated on platform features and opportunities",
      "Social Media: Follow us for daily inspiration and updates",
    ],
  },
  help: {
    title: "Help Center",
    icon: HelpCircle,
    content: [
      "Find answers to frequently asked questions.",
      "Account Management: Learn how to update your profile and settings",
      "Project Posting: Tips for creating effective project listings",
      "Bidding Process: Understand how to submit and manage proposals",
      "Payment Help: Troubleshoot payment and escrow questions",
      "Technical Support: Get help with platform features and tools",
    ],
  },
  contact: {
    title: "Contact Us",
    icon: Phone,
    content: [
      "Get in touch with our team.",
      "Email: support@omahasharehub.com",
      "Hours: Monday - Friday, 8am - 6pm CST",
      "We typically respond within 24 hours during business days.",
    ],
  },
  terms: {
    title: "Terms of Service",
    icon: FileText,
    content: [
      "Terms and conditions for using OmahaShareHub.",
      "By using our platform, you agree to these terms of service.",
      "User Responsibilities: Maintain accurate information and professional conduct",
      "Payment Terms: All transactions processed securely through our escrow system",
      "Dispute Resolution: Process for handling conflicts between users",
      "Liability: Platform limitations and user responsibilities",
      "Updates: We may modify these terms with notice to users",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    icon: Shield,
    content: [
      "How we protect and use your information.",
      "Data Collection: We collect only necessary information to operate the platform",
      "Data Usage: Your information is used to facilitate connections and improve services",
      "Data Security: Industry-standard encryption and security measures",
      "Third Parties: We do not sell your personal information",
      "Your Rights: Access, modify, or delete your data at any time",
      "Contact: support@omahasharehub.com for privacy-related questions",
    ],
  },
  "post-project": {
    title: "Post a Project",
    icon: FileText,
    content: [
      "Ready to post your project? Sign in or create an account to get started.",
      "Posting a project on OmahaShareHub is quick and easy.",
      "Provide Details: Describe your project with photos and specifications",
      "Set Budget: Let providers know your expected price range",
      "Review Proposals: Qualified providers will submit competitive bids",
      "Choose Provider: Select the best fit based on reviews and proposals",
    ],
  },
};

export default function InfoPage() {
  const [location] = useLocation();
  const page = location.substring(1); // Remove leading slash
  const pageInfo = infoContent[page];
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Fetch platform fee settings for pricing page (public endpoint)
  const { data: feeSettings } = useQuery<{ platformFee: number; paymentFee: number }>({
    queryKey: ["/api/settings/fees"],
    enabled: page === 'pricing',
  });

  // Generate dynamic pricing content
  const getPricingContent = () => {
    if (page !== 'pricing') return pageInfo?.content || [];
    
    const platformFee = feeSettings?.platformFee ?? 10;
    const paymentFee = feeSettings?.paymentFee ?? 2.9;
    
    return [
      "Transparent pricing for property owners and service providers.",
      `Property Owners: Free to post projects and browse providers. ${platformFee}% platform fee on completed projects.`,
      "Service Providers: Free to create profiles and browse projects.",
      `Payment Processing: Secure escrow system with ${paymentFee}% processing fee to cover payment gateway costs.`,
      "Contact us for enterprise and volume pricing.",
    ];
  };

  const displayContent = page === 'pricing' ? getPricingContent() : pageInfo?.content || [];

  if (!pageInfo) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
              <p className="text-muted-foreground mb-6">This page is under construction.</p>
              <Link href="/">
                <Button data-testid="button-home">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const Icon = pageInfo.icon;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardContent className="p-8 md:p-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-page-title">
                  {pageInfo.title}
                </h1>
              </div>
              
              <div className="space-y-4 text-muted-foreground">
                {displayContent.map((paragraph, index) => (
                  <p key={index} className="text-base md:text-lg leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t flex gap-4">
                <Link href="/">
                  <Button variant="outline" data-testid="button-home">
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                </Link>
                {page !== 'contact' ? (
                  <Link href="/contact">
                    <Button variant="outline" data-testid="button-contact">
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Us
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsContactModalOpen(true)}
                    data-testid="button-contact"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </div>
  );
}
