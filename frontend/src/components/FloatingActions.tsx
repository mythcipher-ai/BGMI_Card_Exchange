// Floating community action stack.
// Order (top to bottom): Instagram, then WhatsApp.
// Mobile: perfect circular icon buttons (w-12 h-12, no label).
// Desktop: pill-shaped buttons with label.

// TODO: Replace placeholder Instagram URL with the real community account before launch.
const INSTAGRAM_URL = "https://ig.me/j/AbZyUcaJOWtSnNU-/";
const WHATSAPP_SHARE_URL =
  "https://wa.me/?text=Hey!%20Check%20out%20Blue%20Lock%20Exchange%20%E2%80%93%20a%20fan%20community%20tool%20to%20find%20BGMI%20card%20owners.%20%F0%9F%94%B5%0Ahttps%3A%2F%2Fbgmi-card.netlify.app%2F";

const InstaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <circle cx="12" cy="12" r="5" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// Base classes: a square h-12 w-12 circular button by default (mobile),
// expanding to a pill (auto width, px-4) on sm+.
const FAB_BASE =
  "flex items-center justify-center gap-2 rounded-full text-white shadow-lg transition-all " +
  "h-12 w-12 sm:w-auto sm:px-4 sm:py-3 sm:h-auto " +
  "focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const FloatingActions = () => {
  return (
    <div
      className="fixed right-4 z-50 flex flex-col items-end gap-3 bottom-24 sm:bottom-6"
      role="complementary"
      aria-label="Community quick links"
    >
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join the Blue Lock Exchange Instagram community"
        className={`${FAB_BASE} bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 hover:opacity-90`}
      >
        <InstaIcon />
        <span className="text-sm font-medium hidden sm:inline">Instagram</span>
      </a>

      <a
        href={WHATSAPP_SHARE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Invite friends on WhatsApp"
        className={`${FAB_BASE} bg-[#25D366] hover:bg-[#1ebe57]`}
      >
        <WhatsAppIcon />
        <span className="text-sm font-medium hidden sm:inline">Invite Friends</span>
      </a>
    </div>
  );
};

export default FloatingActions;
