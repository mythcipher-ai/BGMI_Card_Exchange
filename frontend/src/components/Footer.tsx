import { Globe } from "lucide-react";

const InstaIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><circle cx="12" cy="12" r="5" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="border-t border-border bg-[#0a0a0f] mt-12">
      <div className="container py-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="font-heading text-base font-semibold text-primary glow-text-green tracking-wide">
              JJK EXCHANGE
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              BGMI x Jujutsu Kaisen Card Trading Platform
            </p>
          </div>
          <div className="text-center sm:text-right space-y-2">
            <p className="text-xs text-muted-foreground">
              Built by{" "}
              <span className="text-foreground font-medium">Furqan_26</span>
            </p>
            <div className="flex items-center justify-center sm:justify-end gap-3">
              <a
                href="https://instagram.com/furqan_26"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md text-muted-foreground hover:text-pink-400 hover:bg-pink-400/10 transition-colors"
                title="Instagram"
              >
                <InstaIcon />
              </a>
              <a
                href="https://linkedin.com/in/furqan26"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                title="LinkedIn"
              >
                <LinkedInIcon />
              </a>
              <a
                href="https://furqan26.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Portfolio"
              >
                <Globe size={16} />
              </a>
            </div>
            <p className="text-[10px] text-muted-foreground">Not affiliated with Krafton or BGMI. Fan-made tool.</p>
          </div>
        </div>
        <div className="h-px bg-border" />
        <p className="text-center text-[10px] text-muted-foreground">
          &copy; {new Date().getFullYear()} BGMI JJK Exchange Cards Platform. All game assets belong to their respective owners.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
