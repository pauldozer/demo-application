import { MapPin, MessageCircle } from "lucide-react";
import InstagramIcon from "@/components/icons/InstagramIcon";

const quickLinks = [
  { label: "Home", href: "#home" },
  { label: "Menu", href: "#menu" },
  { label: "About", href: "#about" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contact", href: "#contact" },
];

const socials = [
  {
    icon: InstagramIcon,
    label: "Instagram",
    href: "https://www.instagram.com/makai.lb",
  },
  {
    icon: MapPin,
    label: "Google Maps",
    // TODO: Replace with actual Google Maps link for Makai Poke Bar
    href: "https://maps.google.com",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    // TODO: Replace with actual WhatsApp number
    href: "https://wa.me/961XXXXXXXX",
  },
];

export default function Footer() {
  return (
    <footer className="relative bg-primary text-white">
      {/* Wave SVG divider */}
      <div className="absolute top-0 left-0 right-0 -translate-y-full overflow-hidden leading-none">
        <svg
          viewBox="0 0 1440 60"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full block"
          preserveAspectRatio="none"
        >
          <path
            d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z"
            fill="#1b6ca8"
          />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <p className="font-heading font-black text-2xl tracking-tight">MAKAI</p>
              <p className="font-body text-[10px] tracking-[0.3em] uppercase text-white/60">
                Poke Bar
              </p>
            </div>
            <p className="font-body text-white/60 text-sm leading-relaxed italic">
              &ldquo;Fresh. Bold. Hawaiian.&rdquo;
            </p>
            <p className="font-body text-white/50 text-xs mt-3">
              Bringing aloha to Beirut, one bowl at a time.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-body font-semibold text-sm tracking-widest uppercase text-white/50 mb-5">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="font-body text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Socials + hours */}
          <div>
            <h4 className="font-body font-semibold text-sm tracking-widest uppercase text-white/50 mb-5">
              Follow & Find Us
            </h4>
            <div className="flex gap-3 mb-6">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white hover:-translate-y-0.5 transition-all duration-200"
                >
                  <s.icon size={18} />
                </a>
              ))}
            </div>
            <p className="font-body text-sm text-white/60">
              Mon – Sun · 11:00 AM – 10:00 PM
            </p>
            <p className="font-body text-sm text-white/60 mt-1">
              Beirut, Lebanon
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-white/40">
            © 2025 Makai Poke Bar. All rights reserved.
          </p>
          <p className="font-body text-xs text-white/30">
            Made with aloha 🌊
          </p>
        </div>
      </div>
    </footer>
  );
}
