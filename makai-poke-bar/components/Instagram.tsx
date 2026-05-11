// Replace placeholder images with actual Instagram embed once Basic Display API token is obtained
// API docs: https://developers.facebook.com/docs/instagram-basic-display-api

"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import InstagramIcon from "@/components/icons/InstagramIcon";

const posts = [
  { id: "1", query: "poke-bowl,salmon", seed: 1 },
  { id: "2", query: "poke-bowl,tuna", seed: 2 },
  { id: "3", query: "poke-bowl,avocado", seed: 3 },
  { id: "4", query: "poke-bowl,fresh", seed: 4 },
  { id: "5", query: "poke-bowl,healthy", seed: 5 },
  { id: "6", query: "hawaiian-food,bowl", seed: 6 },
];

const UNSPLASH_IDS = [
  "photo-1546069901-ba9599a7e63c",
  "photo-1512621776951-a57141f2eefd",
  "photo-1540420773420-3366772f4999",
  "photo-1547592166-23ac45744acd",
  "photo-1467003909585-2f8a72700288",
  "photo-1490645935967-10de6ba17061",
];

export default function InstagramSection() {
  return (
    <section id="instagram" className="bg-bg py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="font-body text-sm tracking-[0.3em] uppercase text-accent mb-3">
            @makai.lb on Instagram
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl text-text mb-3">
            Fresh from our feed
          </h2>
          <p className="font-body text-text/60">
            Follow along for daily bowls, behind-the-scenes, and good vibes
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
          {UNSPLASH_IDS.map((photoId, i) => (
            <motion.a
              key={photoId}
              href="https://www.instagram.com/makai.lb"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-light"
            >
              <Image
                src={`https://images.unsplash.com/${photoId}?w=400&h=400&fit=crop&q=75`}
                alt={`Makai poke bowl ${i + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                <InstagramIcon
                  size={32}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>
            </motion.a>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="https://www.instagram.com/makai.lb"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-accent text-white px-8 py-3.5 rounded-full font-body font-semibold hover:bg-accent-dark active:scale-95 transition-all duration-200"
          >
            <InstagramIcon size={18} />
            Follow us on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
