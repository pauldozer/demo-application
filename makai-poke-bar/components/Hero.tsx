"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.4, 0, 0.2, 1] as const },
  }),
};

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background — actual Makai photo (poke bowl by the sea) */}
      <Image
        src="/ig-post-5.jpg"
        alt="Makai poke bowl by the sea"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/40 to-black/65" />

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="font-body text-sm tracking-[0.3em] uppercase text-white/70 mb-4"
        >
          Hawaiian Poke Bowls · Tarik El Mina, Tripoli
        </motion.p>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.15}
          className="font-heading font-black text-5xl sm:text-6xl lg:text-7xl leading-tight mb-6"
        >
          Fresh. Bold.{" "}
          <span className="text-accent">Hawaiian.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.3}
          className="font-body text-lg sm:text-xl text-white/85 mb-10 max-w-xl mx-auto"
        >
          Build your perfect poke bowl in the heart of Tripoli
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.45}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#menu"
            className="w-full sm:w-auto bg-primary text-white px-8 py-3.5 rounded-full font-body font-semibold text-base hover:bg-primary-dark active:scale-95 transition-all duration-200"
          >
            View Menu
          </a>
          <a
            href="https://www.google.com/maps/place/Makai+Poke+Bar/@34.4404617,35.8298546,17z/data=!3m1!4b1!4m6!3m5!1s0x1521f7000013e48d:0xb97a5e9e1c94fa4c!8m2!3d34.4404617!4d35.8298546!16s%2Fg%2F11x0x57828"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-accent text-white px-8 py-3.5 rounded-full font-body font-semibold text-base hover:bg-accent-dark active:scale-95 transition-all duration-200"
          >
            Leave a Review
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <ChevronDown size={28} className="text-white/60" />
        </motion.div>
      </motion.div>
    </section>
  );
}
