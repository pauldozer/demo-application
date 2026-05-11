// Replace placeholder images with actual Instagram embed once Basic Display API token is obtained
// API docs: https://developers.facebook.com/docs/instagram-basic-display-api
// Currently using downloaded photos from @makai.lb — update periodically

"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import InstagramIcon from "@/components/icons/InstagramIcon";

// Actual photos from @makai.lb Instagram — downloaded locally for reliability
const posts = [
  { src: "/ig-post-1.jpg", alt: "Makai sushi cake with salmon and avocado" },
  { src: "/ig-post-2.jpg", alt: "Makai poke bowl fresh ingredients" },
  { src: "/ig-post-3.jpg", alt: "Makai poke bowl with shrimp salmon and mango" },
  { src: "/ig-post-4.jpg", alt: "Makai fresh poke bowl creation" },
  { src: "/ig-post-5.jpg", alt: "Makai poke bowl by the Mediterranean sea" },
  { src: "/ig-post-6.jpg", alt: "Makai poke bowl with fresh toppings" },
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
          {posts.map((post, i) => (
            <motion.a
              key={post.src}
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
                src={post.src}
                alt={post.alt}
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
