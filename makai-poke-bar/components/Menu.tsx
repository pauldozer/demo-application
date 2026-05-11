"use client";

// Menu data sourced directly from official Makai Poke Bar menu (April 2026)

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Tag = "GF" | "V" | "Spicy" | "Vegan" | "LowCal" | "HighProtein";

interface MenuItem {
  name: string;
  desc: string;
  price?: string;
  tags?: Tag[];
  emoji: string;
  note?: string;
}

const tagColors: Record<Tag, string> = {
  GF: "bg-emerald-50 text-emerald-700",
  V: "bg-green-50 text-green-700",
  Vegan: "bg-lime-50 text-lime-700",
  Spicy: "bg-red-50 text-red-600",
  LowCal: "bg-sky-50 text-sky-600",
  HighProtein: "bg-violet-50 text-violet-600",
};

const menuData: Record<string, MenuItem[]> = {
  "Signature Bowls": [
    { name: "Aloha Tuna", emoji: "🐟", price: "$20.50", tags: ["GF"], desc: "Sushi rice, tuna, crazy crab salad, cucumber, carrots, pickled ginger, cilantro, mango, beetroot, seaweed salad, crispy onions, pumpkin seeds, nori strips and garlic sesame sauce." },
    { name: "Sake", emoji: "🍶", price: "$20.50", tags: ["GF"], desc: "Sushi rice, salmon, carrots, pickled ginger, radish, avocado edamame, philly cheese, almond, sesame seeds, tempura flakes and ponzu mayo sauce." },
    { name: "Volcano", emoji: "🌋", price: "$21.00", tags: ["GF", "Spicy"], desc: "Sushi rice, spicy salmon, spicy tuna, crazy spicy crab, carrots, cucumber, cilantro, cabbage mix, edamame, tobiko, avocado, mango, sesame seeds, sunflower seeds and chilli ponzu sauce." },
    { name: "Tropical Shrimp", emoji: "🦐", price: "$21.00", tags: ["Spicy"], desc: "Half sushi rice and mixed greens, seasoned shrimps, crazy crab salad, carrots, spring onion, mango, avocado, strawberry, tobiko, peanuts and mango chili sauce." },
    { name: "Asian", emoji: "🥢", price: "$20.50", tags: ["GF"], desc: "Glass noodles, seasoned shrimps, marinated salmon, cucumber, carrots, mix cabbage, bell pepper, mango, seaweed salad, edamame, sesame seeds, cashew nuts and sakura soy sauce." },
    { name: "Avocado Bliss Chicken", emoji: "🥑", price: "$20.50", tags: ["GF"], desc: "Mixed quinoa, grilled marinated chicken, carrots, mixed cabbage, radish, red onions, sweet corn, edamame, avocado, peanut and thai peanut sauce." },
    { name: "Makai", emoji: "🌊", price: "$21.00", tags: ["GF", "Spicy"], desc: "Sushi rice, salmon, seasoned shrimp, marinated octopus, marinated tuna, carrots, cucumber, edamame, mango, avocado, tobiko, tempura flakes, and spicy mayo." },
    { name: "Green Goddess", emoji: "🌿", price: "$20.50", tags: ["GF", "Vegan"], desc: "Half quinoa, mixed greens, tofu, carrots, cucumber, bell pepper, radish, mix cabbage, mango, edamame, beetroot, peanut and garlic sesame sauce." },
    { name: "High Protein", emoji: "💪", price: "$19.50", tags: ["GF", "HighProtein"], desc: "White sushi rice, ahi tuna, fresh salmon, shrimps, cucumber, carrots, pickled ginger, avocado, edamame, tobiko, peanuts and sakura soy sauce.", note: "50g Protein · 650 kcal" },
    { name: "Low Cal", emoji: "🌱", price: "$19.50", tags: ["GF", "LowCal"], desc: "Half quinoa and mixed greens, ahi tuna, shrimps, cucumber, carrots, red cabbage, edamame, seaweed salad, strawberry, nori strips and light soya sauce.", note: "42g Protein · 411 kcal" },
  ],
  "Burritos": [
    { name: "Tuna Tango", emoji: "🌯", price: "$15.00", tags: ["GF"], desc: "Tuna, crazy crab, cucumber stick, avocado, spring onion, sesame seeds, tempura flakes, and ponzu mayo wrapped in nori." },
    { name: "Salmon Supreme", emoji: "🌯", price: "$15.00", tags: ["GF", "Spicy"], desc: "Salmon, crazy crab, philly cheese, avocado, crispy onions, mixed greens, and spicy mayo wrapped in nori." },
    { name: "Shrimp Fiesta", emoji: "🌯", price: "$14.00", tags: ["GF", "Spicy"], desc: "Shrimp, crazy crab, pickled ginger, carrots, mango, tempura flakes, mixed green, and mango chili sauce wrapped in nori." },
    { name: "Sunrise Roll", emoji: "🌯", price: "$13.00", tags: ["GF"], desc: "Crazy crab, avocado, cucumber, pink cabbage, tobiko, sesame seeds, and ponzu mayo wrapped in nori." },
    { name: "Ahi Fusion Burrito", emoji: "🌯", price: "$15.00", tags: ["GF"], desc: "Tuna, salmon, crazy crab, tempura flakes, mixed greens, avocado, and creamy avocado wrapped in nori." },
    { name: "Chicken Burrito", emoji: "🌯", price: "$12.00", tags: [], desc: "Chicken, lollo rosso, corn, red cabbage, avocado, tempura flakes, and teriyaki mayo wrapped in nori." },
  ],
  "Appetizers": [
    { name: "Dynamite Crispy Salmon Salad", emoji: "🔥", price: "$14.00", tags: ["Spicy"], desc: "100g of salmon in our special chilli dynamite sauce, mixed with a crunch of tempura flakes." },
    { name: "Glazed Chicken Bao", emoji: "🥟", price: "$7.50", tags: [], desc: "Chicken glazed in teriyaki sauce, lollo rosso, avocado, in fresh bao bun." },
    { name: "Exotic Salmon Bao", emoji: "🥟", price: "$9.00", tags: ["Spicy"], desc: "Salmon, mango, carrots, red cabbage, dressed with spicy mayo, topped with spring onion and sesame in fresh bao bun." },
    { name: "Tuna Tataki", emoji: "🍣", price: "$12.50", tags: ["GF"], desc: "100g seared tuna slices, marinated in ponzu spring onion, coated with sesame seeds." },
    { name: "Mak(a)i Roll", emoji: "🍱", price: "$9.00", tags: ["GF"], desc: "A mix of mango salmon and crazy crab strawberry makis.", note: "Add soy sheet +$1.50" },
  ],
  "Desserts": [
    { name: "Mochi", emoji: "🍡", price: "$3.50", tags: [], desc: "Traditional Japanese mochi ice cream." },
    { name: "Pistachio Bao", emoji: "🥐", price: "$5.50", tags: ["V"], desc: "Pistachio, osmaliyeh, Nutella, raspberry, topped with crushed pistachios." },
    { name: "Nutella Bao", emoji: "🥐", price: "$5.50", tags: ["V"], desc: "Nutella spread, strawberry, banana, topped with crushed hazelnuts." },
    { name: "Lotus Bao", emoji: "🥐", price: "$5.50", tags: ["V"], desc: "Lotus spread, banana, topped with crushed Lotus." },
    { name: "Chocolate Fondant", emoji: "🍫", price: "$9.50", tags: ["V"], desc: "Warm chocolate fondant served with a scoop of vanilla ice cream." },
  ],
  "Drinks": [
    { name: "Mineral Water", emoji: "💧", price: "$1.00", tags: ["GF", "Vegan"], desc: "Still mineral water." },
    { name: "Sparkling Water", emoji: "🫧", price: "$2.00", tags: ["GF", "Vegan"], desc: "Chilled sparkling water." },
    { name: "Soft Drinks", emoji: "🥤", price: "$2.00", tags: ["V"], desc: "Selection of soft drinks." },
    { name: "Fresh Juice", emoji: "🍊", price: "$3.00", tags: ["GF", "Vegan"], desc: "Freshly pressed seasonal fruit juice." },
  ],
};

// Build Your Own Bowl data
const bowlSizes = [
  { size: "Small", price: "$11.00", desc: "2 Proteins (70g) · 150g base" },
  { size: "Medium", price: "$13.50", desc: "3 Proteins (105g) · 200g base" },
  { size: "Large", price: "$16.00", desc: "4 Proteins (140g) · 250g base" },
];

const bowlSections = [
  {
    num: "1", label: "BASE", color: "bg-green-50 border-green-200", note: "Choose 1",
    items: ["White Sushi Rice", "Glass Noodles +$1", "Quinoa", "Mixed Greens", "Soba Noodles +$1", "Seaweed Salad +$2", "Black Rice +$1"],
  },
  {
    num: "2", label: "PROTEIN", color: "bg-orange-50 border-orange-200", note: "1 Protein = $3.50 · Extra +$4",
    items: ["Ahi Tuna", "Marinated Tuna", "Spicy Tuna 🌶", "Fresh Salmon", "Marinated Salmon", "Spicy Salmon 🌶", "Smoked Salmon", "Shrimp", "Chicken", "Tofu", "Octopus +$1", "Crab Stick", "Crazy Crab Salad"],
  },
  {
    num: "3", label: "MIX-INS", color: "bg-emerald-50 border-emerald-200", note: "Select 4 · Extra +$0.50",
    items: ["Cucumber", "Red Onion", "Cilantro", "Radish", "Carrots", "Lollo Rosso +$0.50", "Pickled Ginger", "Red Cabbage", "White Cabbage", "Bell Pepper", "Spring Onion", "Jalapeño"],
  },
  {
    num: "4", label: "TOPPINGS", color: "bg-yellow-50 border-yellow-200", note: "Add +$1.75 each",
    items: ["Mango", "Pineapple", "Avocado", "Edamame", "Seaweed Salad", "Sweet Corn", "Tobiko", "Strawberry", "Beetroot", "Dried Cranberry", "Philly Cheese"],
  },
  {
    num: "5", label: "CRUNCH", color: "bg-amber-50 border-amber-200", note: "Add +$1.00 each",
    items: ["Crispy Onions", "Crushed Macadamia Nuts", "Almond", "Pumpkin Seeds", "Sunflower Seeds", "Peanuts", "Cashew Nuts", "Tempura Flakes"],
  },
  {
    num: "6", label: "SPRINKLES", color: "bg-pink-50 border-pink-200", note: "Select 1 · Extra +$0.50",
    items: ["Toasted Sesame Seeds", "Togarashi", "Nori Strips"],
  },
  {
    num: "7", label: "DRIZZLE", color: "bg-blue-50 border-blue-200", note: "Select 1 · Extra +$1.00",
    items: ["Spicy Mayo 🌶", "Wasabi Mayo 🌶", "Thai Peanut", "Ponzu Mayo", "Creamy Avocado", "Umami Truffle", "Mango Chili 🌶", "Teriyaki Mayo", "Ponzu", "Chili Ponzu 🌶", "Ginger Miso", "Garlic Sesame", "Sakura Soy Sauce", "Sweet Chili 🌶", "Teriyaki", "Light Soy Sauce", "Sriracha 🌶", "Soy Herbs", "Spicy Yogurt 🌶"],
  },
];

const tabs = ["Signature Bowls", "Burritos", "Appetizers", "Build a Bowl", "Desserts", "Drinks"];

export default function Menu() {
  const [active, setActive] = useState("Signature Bowls");

  return (
    <section id="menu" className="py-24 px-4" style={{ backgroundColor: '#faf9f5' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-body text-sm tracking-[0.3em] uppercase text-accent mb-3">What we serve</p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl text-text">The Menu</h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-10 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full font-body text-sm font-semibold transition-all duration-200 ${
                active === tab ? "bg-accent text-white shadow-sm" : "bg-light text-text/70 hover:bg-light/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {active === "Build a Bowl" ? (
              <div className="space-y-8">
                {/* Sizes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {bowlSizes.map((s) => (
                    <div key={s.size} className="bg-bg border border-black/8 rounded-2xl p-5 text-center">
                      <p className="font-heading font-bold text-xl text-text mb-1">{s.size}</p>
                      <p className="font-body font-black text-2xl text-accent mb-2">{s.price}</p>
                      <p className="font-body text-xs text-text/60">{s.desc}</p>
                    </div>
                  ))}
                </div>
                {/* Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {bowlSections.map((section) => (
                    <div key={section.num} className={`rounded-2xl border p-5 ${section.color}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-7 h-7 rounded-full bg-accent text-white text-xs font-body font-bold flex items-center justify-center flex-shrink-0">
                          {section.num}
                        </span>
                        <span className="font-heading font-bold text-base text-text">{section.label}</span>
                        <span className="font-body text-xs text-text/50 ml-auto">{section.note}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {section.items.map((item) => (
                          <span key={item} className="bg-white/70 text-text/80 font-body text-xs px-2.5 py-1 rounded-full border border-black/8">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuData[active]?.map((item) => (
                  <div
                    key={item.name}
                    className="bg-white rounded-2xl p-5 border border-black/5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.emoji}</span>
                        <h3 className="font-heading font-bold text-base text-text leading-snug">{item.name}</h3>
                      </div>
                      {item.price && (
                        <span className="flex-shrink-0 bg-accent text-white text-xs font-body font-bold px-2.5 py-1 rounded-full">
                          {item.price}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-sm text-text/60 leading-relaxed">{item.desc}</p>
                    {item.note && (
                      <p className="font-body text-xs text-text/40 italic">{item.note}</p>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        {item.tags.map((tag) => (
                          <span key={tag} className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full ${tagColors[tag]}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Add-ons note for burritos */}
        {active === "Burritos" && (
          <p className="text-center font-body text-sm text-text/50 mt-6">
            Add Soy Sheet +$1.50 · Add Black Rice +$1.00
          </p>
        )}
      </div>
    </section>
  );
}
