import { MapPin, MessageCircle } from "lucide-react";
import InstagramIcon from "@/components/icons/InstagramIcon";
import Image from "next/image";

const quickLinks = [
  { label: "Home", href: "#home" },
  { label: "Menu", href: "#menu" },
  { label: "About", href: "#about" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contact", href: "#contact" },
];

const socials = [
  {
    Icon: InstagramIcon,
    label: "Instagram",
    href: "https://www.instagram.com/makai.lb",
  },
  {
    Icon: MapPin,
    label: "Google Maps",
    href: "https://www.google.com/maps/place/Makai+Poke+Bar/@34.4404617,35.8298546,17z/data=!3m1!4b1!4m6!3m5!1s0x1521f7000013e48d:0xb97a5e9e1c94fa4c!8m2!3d34.4404617!4d35.8298546!16s%2Fg%2F11x0x57828",
  },
  {
    Icon: MessageCircle,
    label: "WhatsApp",
    href: "https://wa.me/96176173251",
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
              <Image
                src="/logo.png"
                alt="Makai Poke Bar"
                width={100}
                height={40}
                className="h-10 w-auto object-contain rounded-lg brightness-0 invert"
              />
            </div>
            <p className="font-body text-white/60 text-sm leading-relaxed italic">
              &ldquo;Fresh. Bold. Hawaiian.&rdquo;
            </p>
            <p className="font-body text-white/50 text-xs mt-3">
              Bringing aloha to Tripoli, one bowl at a time.
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
                  <s.Icon size={18} />
                </a>
              ))}
            </div>
            <p className="font-body text-sm text-white/60">
              Sun–Fri 12:00 PM – 11:00 PM
            </p>
            <p className="font-body text-sm text-white/60">
              Sat 12:00 PM – 12:00 AM
            </p>
            <p className="font-body text-sm text-white/60 mt-1">
              Tarik El Mina, Tripoli, Lebanon
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
