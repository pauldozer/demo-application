"use client";

// TODO: Fetch live products from Shopify Storefront API — replace static data with API call
// once NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN is configured in .env.local

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Tag = "GF" | "V" | "Spicy" | "Vegan";

interface MenuItem {
  name: string;
  desc: string;
  price?: string;
  tags?: Tag[];
  emoji: string;
}

const menuData: Record<string, MenuItem[]> = {
  "Signature Bowls": [
    {
      name: "The Makai Classic",
      desc: "Salmon, white rice, avocado, cucumber, edamame, sesame ginger, masago",
      price: "$14",
      tags: ["GF"],
      emoji: "🏆",
    },
    {
      name: "Spicy Tuna Fire",
      desc: "Tuna, white rice, jalapeño, crispy onion, spicy mayo, masago",
      price: "$15",
      tags: ["GF", "Spicy"],
      emoji: "🔥",
    },
    {
      name: "The Beirut",
      desc: "Shrimp, brown rice, mango, avocado, cucumber, sweet soy glaze",
      price: "$13",
      tags: ["GF"],
      emoji: "🇱🇧",
    },
    {
      name: "Green Goddess",
      desc: "Tofu, mixed greens, avocado, edamame, corn, sesame seeds, ponzu",
      price: "$12",
      tags: ["GF", "V", "Vegan"],
      emoji: "🌿",
    },
    {
      name: "Ocean Deep",
      desc: "Salmon + tuna mix, cauliflower rice, seaweed salad, radish, truffle ponzu",
      price: "$16",
      tags: ["GF"],
      emoji: "🌊",
    },
  ],
  Bases: [
    { name: "White Rice", desc: "Steamed Japanese short-grain rice", tags: ["GF", "V"], emoji: "🍚" },
    { name: "Brown Rice", desc: "Nutty, wholesome brown rice", tags: ["GF", "V"], emoji: "🌾" },
    { name: "Mixed Greens", desc: "Fresh spring mix, light and crisp", tags: ["GF", "V", "Vegan"], emoji: "🥗" },
    { name: "Cauliflower Rice", desc: "Low-carb, grain-free alternative", tags: ["GF", "V", "Vegan"], emoji: "🥦" },
    { name: "Quinoa", desc: "High-protein ancient grain", tags: ["GF", "V", "Vegan"], emoji: "🌱" },
    { name: "Noodles", desc: "Glass noodles, light and silky", tags: ["V"], emoji: "🍜" },
  ],
  Proteins: [
    { name: "Salmon", desc: "Sushi-grade Atlantic salmon, rich and buttery", price: "$4", tags: ["GF"], emoji: "🐟" },
    { name: "Ahi Tuna", desc: "Premium yellowfin tuna, clean and bold", price: "$4.50", tags: ["GF"], emoji: "🐠" },
    { name: "Shrimp", desc: "Plump grilled shrimp with a satisfying bite", price: "$3.50", tags: ["GF"], emoji: "🦐" },
    { name: "Octopus", desc: "Tender braised octopus, adventurous and delicious", price: "$4", tags: ["GF"], emoji: "🐙" },
    { name: "Tofu", desc: "Marinated silken tofu, plant-based and flavourful", price: "$3", tags: ["GF", "V", "Vegan"], emoji: "🫘" },
    { name: "Chicken", desc: "Tender teriyaki-glazed grilled chicken", price: "$3", tags: ["GF"], emoji: "🍗" },
    { name: "Edamame", desc: "Lightly salted steamed edamame beans", price: "$2.50", tags: ["GF", "V", "Vegan"], emoji: "🟢" },
    { name: "Crab Mix", desc: "Sweet, seasoned crab mix — a crowd favourite", price: "$3.50", tags: ["GF"], emoji: "🦀" },
  ],
  Toppings: [
    { name: "Avocado", desc: "Creamy, ripe avocado slices", tags: ["GF", "V", "Vegan"], emoji: "🥑" },
    { name: "Mango", desc: "Sweet tropical mango chunks", tags: ["GF", "V", "Vegan"], emoji: "🥭" },
    { name: "Cucumber", desc: "Cool, crisp cucumber ribbons", tags: ["GF", "V", "Vegan"], emoji: "🥒" },
    { name: "Edamame", desc: "Steamed soybeans, lightly salted", tags: ["GF", "V", "Vegan"], emoji: "🟢" },
    { name: "Corn", desc: "Sweet roasted corn kernels", tags: ["GF", "V", "Vegan"], emoji: "🌽" },
    { name: "Pickled Ginger", desc: "Bright, tangy pickled ginger", tags: ["GF", "V"], emoji: "🫚" },
    { name: "Seaweed Salad", desc: "Umami-rich Japanese seaweed salad", tags: ["GF", "V", "Vegan"], emoji: "🌿" },
    { name: "Crispy Onions", desc: "Golden fried shallots for crunch", tags: ["V"], emoji: "🧅" },
    { name: "Masago", desc: "Smelt roe — tiny, briny, and delicious", tags: ["GF"], emoji: "🟠" },
    { name: "Nori", desc: "Toasted seaweed strips", tags: ["GF", "V", "Vegan"], emoji: "⬛" },
    { name: "Radish", desc: "Thinly sliced daikon radish", tags: ["GF", "V", "Vegan"], emoji: "🌸" },
    { name: "Jalapeño", desc: "Fresh sliced jalapeño for heat", tags: ["GF", "V", "Vegan", "Spicy"], emoji: "🌶️" },
    { name: "Pineapple", desc: "Juicy tropical pineapple chunks", tags: ["GF", "V", "Vegan"], emoji: "🍍" },
    { name: "Sesame Seeds", desc: "Toasted black and white sesame seeds", tags: ["GF", "V", "Vegan"], emoji: "⚪" },
    { name: "Wonton Strips", desc: "Crispy fried wonton for texture", tags: ["V"], emoji: "🥟" },
  ],
  Sauces: [
    { name: "Ponzu", desc: "Light citrus soy sauce, clean and bright", tags: ["GF", "V"], emoji: "🍋" },
    { name: "Spicy Mayo", desc: "Creamy sriracha mayo with a kick", tags: ["V", "Spicy"], emoji: "🌶️" },
    { name: "Shoyu", desc: "Classic Japanese soy sauce", tags: ["V"], emoji: "🫙" },
    { name: "Sesame Ginger", desc: "Nutty toasted sesame with fresh ginger", tags: ["GF", "V"], emoji: "🌰" },
    { name: "Wasabi", desc: "Bold wasabi heat for the brave", tags: ["GF", "V", "Spicy"], emoji: "💚" },
    { name: "Sweet Soy Glaze", desc: "Caramelised sweet soy reduction", tags: ["V"], emoji: "🍯" },
    { name: "Sriracha Aioli", desc: "Garlic aioli meets sriracha fire", tags: ["V", "Spicy"], emoji: "🔥" },
    { name: "Truffle Ponzu", desc: "Citrus ponzu elevated with black truffle", tags: ["GF", "V"], emoji: "🍄" },
  ],
  Drinks: [
    { name: "Fresh Juice", desc: "Seasonal pressed fruit juice — ask for today's", tags: ["GF", "V", "Vegan"], emoji: "🍊" },
    { name: "Sparkling Water", desc: "Chilled sparkling water", tags: ["GF", "V", "Vegan"], emoji: "💧" },
    { name: "Coconut Water", desc: "Natural coconut water, pure and hydrating", tags: ["GF", "V", "Vegan"], emoji: "🥥" },
    { name: "Lemonade", desc: "Freshly squeezed house lemonade", tags: ["GF", "V", "Vegan"], emoji: "🍋" },
    { name: "Japanese Soda", desc: "Rotating Ramune and Calpico flavours", tags: ["V"], emoji: "🫧" },
  ],
};

const tabs = Object.keys(menuData);

const tagColors: Record<Tag, string> = {
  GF: "bg-emerald-50 text-emerald-700",
  V: "bg-green-50 text-green-700",
  Vegan: "bg-lime-50 text-lime-700",
  Spicy: "bg-red-50 text-red-600",
};

export default function Menu() {
  const [active, setActive] = useState("Signature Bowls");
  const items = menuData[active];

  return (
    <section id="menu" className="bg-white py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-body text-sm tracking-[0.3em] uppercase text-accent mb-3">
            What we serve
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl text-text">
            The Menu
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-10 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full font-body text-sm font-semibold transition-all duration-200 ${
                active === tab
                  ? "bg-accent text-white shadow-sm"
                  : "bg-light text-text/70 hover:bg-light/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {items.map((item) => (
              <div
                key={item.name}
                className="bg-bg rounded-2xl p-5 border border-black/5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.emoji}</span>
                    <h3 className="font-heading font-bold text-base text-text leading-snug">
                      {item.name}
                    </h3>
                  </div>
                  {item.price && (
                    <span className="flex-shrink-0 bg-accent text-white text-xs font-body font-bold px-2.5 py-1 rounded-full">
                      {item.price}
                    </span>
                  )}
                </div>
                <p className="font-body text-sm text-text/60 leading-relaxed">
                  {item.desc}
                </p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full ${tagColors[tag]}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
