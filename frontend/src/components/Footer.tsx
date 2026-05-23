import { Globe } from "lucide-react";
import { Link } from "react-router-dom";

const InstaIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><circle cx="12" cy="12" r="5" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" />
  </svg>
);

// TODO: Replace with the real community Instagram URL when ready.
const COMMUNITY_INSTAGRAM = "https://www.instagram.com/furqan_.26";
const CONTACT_EMAIL = "26furqan.ansari@gmail.com";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-[#04060d] mt-12">
      <div className="container py-8 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-6">
          <div className="text-center sm:text-left">
            <h3 className="font-heading text-base font-semibold text-primary glow-text-blue tracking-wider">
              BLUE LOCK · EXCHANGE
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              A fan-made community tool that helps BGMI players find card owners and complete their collections. Not a marketplace.
            </p>
          </div>

          <div className="text-center sm:text-right space-y-2">
            <nav aria-label="Footer links" className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-1 text-xs">
              <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
              <Link to="/guide" className="text-muted-foreground hover:text-primary transition-colors">User Guide</Link>
              <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms</Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy</Link>
            </nav>
            <div className="flex items-center justify-center sm:justify-end gap-3">
              <a
                href={COMMUNITY_INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Community Instagram"
                className="p-1.5 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                title="Instagram"
              >
                <InstaIcon />
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                aria-label="Contact email"
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Email"
              >
                <Globe size={16} aria-hidden="true" />
              </a>
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                title="LinkedIn"
              >
                <LinkedInIcon />
              </a>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Not affiliated with Krafton, BGMI, or the Blue Lock rights holders.
            </p>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground">
            &copy; {new Date().getFullYear()} Blue Lock Exchange: a fan community tool. All third-party names and assets belong to their respective owners.
          </p>
          <p className="text-[10px] text-muted-foreground">
            Made by the community, for the community.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
