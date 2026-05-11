"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import InstagramIcon from "@/components/icons/InstagramIcon";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Menu", href: "#menu" },
  { label: "About", href: "#about" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Makai Poke Bar"
            width={120}
            height={48}
            className="h-11 w-auto object-contain rounded-lg"
            priority
          />
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={`font-body text-sm font-medium transition-colors duration-200 hover:text-accent ${
                  scrolled ? "text-text/80" : "text-white/90"
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="https://www.instagram.com/makai.lb"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className={`transition-colors hover:text-accent ${
              scrolled ? "text-text/70" : "text-white/80"
            }`}
          >
            <InstagramIcon size={20} />
          </a>
          <a
            href="https://wa.me/96176173251"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-white px-5 py-2 rounded-full text-sm font-body font-semibold hover:bg-accent-dark active:scale-95 transition-all duration-200"
          >
            Order Now
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className={`md:hidden transition-colors ${
            scrolled ? "text-text" : "text-white"
          }`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white/95 backdrop-blur-md border-t border-black/5 px-4 pb-6 pt-4"
          >
            <ul className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block font-body text-base font-medium text-text/80 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <a
                  href="https://wa.me/96176173251"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="inline-block bg-accent text-white px-6 py-2.5 rounded-full text-sm font-body font-semibold hover:bg-accent-dark transition-colors"
                >
                  Order Now
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
