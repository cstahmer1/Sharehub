import { Link } from "wouter";
import { Handshake } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "For Property Owners",
      links: [
        { href: "/post-project", label: "Post a Project" },
        { href: "/how-it-works", label: "How It Works" },
        { href: "/safety", label: "Safety & Trust" },
        { href: "/pricing", label: "Pricing" },
      ],
    },
    {
      title: "For Service Providers",
      links: [
        { href: "/search", label: "Find Work" },
        { href: "/resources", label: "Provider Resources" },
        { href: "/success-stories", label: "Success Stories" },
        { href: "/community", label: "Community" },
      ],
    },
    {
      title: "Support",
      links: [
        { href: "/help", label: "Help Center" },
        { href: "/contact", label: "Contact Us" },
        { href: "/terms", label: "Terms of Service" },
        { href: "/privacy", label: "Privacy Policy" },
      ],
    },
  ];

  const socialLinks = [
    { href: "https://facebook.com", label: "Facebook", icon: "fab fa-facebook-f" },
    { href: "https://twitter.com", label: "Twitter", icon: "fab fa-twitter" },
    { href: "https://linkedin.com", label: "LinkedIn", icon: "fab fa-linkedin-in" },
    { href: "https://instagram.com", label: "Instagram", icon: "fab fa-instagram" },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                <Handshake className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold">OmahaShareHub</span>
            </div>
            <p className="text-primary-foreground/80 text-sm mb-4">
              Connecting property owners with skilled service providers for seamless project completion.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                  data-testid={`link-social-${social.label.toLowerCase()}`}
                >
                  <i className={social.icon}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2 text-primary-foreground/80 text-sm">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href}
                      className="hover:text-primary-foreground transition-colors"
                      data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/80 text-sm">
          <p>&copy; {currentYear} OmahaShareHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
