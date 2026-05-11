"use client";

import { motion } from "framer-motion";
import { Leaf, Sliders, Heart } from "lucide-react";
import InstagramIcon from "@/components/icons/InstagramIcon";

const features = [
  {
    icon: Leaf,
    title: "Fresh Daily",
    desc: "Every ingredient is sourced and prepped each morning. No shortcuts, no compromises — just honest, fresh food.",
  },
  {
    icon: Sliders,
    title: "Fully Customizable",
    desc: "Start with a base, choose your protein, pile on the toppings, pick your sauce. Your bowl, your way.",
  },
  {
    icon: Heart,
    title: "Tripoli Heart",
    desc: "Hawaiian soul meets Tripoli spirit. We bring aloha to the heart of North Lebanon, one bowl at a time.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const } },
};

export default function About() {
  return (
    <section id="about" className="py-24 px-4" style={{ backgroundColor: '#edf0e8' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-16"
        >
          <p className="font-body text-sm tracking-[0.3em] uppercase text-accent mb-3">
            Who we are
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl text-text mb-6">
            Our Story
          </h2>
          <div className="max-w-2xl mx-auto space-y-4 text-text/70 font-body text-base sm:text-lg leading-relaxed">
            <p>
              <strong className="text-text">Makai</strong> means &ldquo;toward
              the sea&rdquo; in Hawaiian — and that spirit guides everything we
              do. Born from a love of fresh, vibrant Hawaiian cuisine, Makai
              Poke Bar opened its doors in Tripoli to bring the authentic poke
              bowl experience to North Lebanon.
            </p>
            <p>
              We handpick every ingredient, prep everything fresh each morning,
              and believe that great food should be both nourishing and
              exciting. From our ocean-fresh proteins to our handcrafted sauces,
              every bowl is a taste of the Pacific — built your way, right here
              in Tarik El Mina, Tripoli.
            </p>
          </div>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/80 rounded-2xl p-8 shadow-sm border border-black/5 hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-light mb-5">
                <f.icon size={26} className="text-primary" />
              </div>
              <h3 className="font-heading font-bold text-xl text-text mb-3">
                {f.title}
              </h3>
              <p className="font-body text-text/60 text-sm leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Instagram strip */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="bg-accent rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-white"
        >
          <div className="flex items-center gap-4">
            <InstagramIcon size={32} />
            <div>
              <p className="font-heading font-bold text-xl">Follow our journey</p>
              <p className="font-body text-white/80 text-sm">
                Daily bowls, behind-the-scenes, and good vibes
              </p>
            </div>
          </div>
          <a
            href="https://www.instagram.com/makai.lb"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 bg-white text-accent font-body font-semibold px-6 py-3 rounded-full hover:bg-white/90 active:scale-95 transition-all duration-200"
          >
            @makai.lb
          </a>
        </motion.div>
      </div>
    </section>
  );
}
