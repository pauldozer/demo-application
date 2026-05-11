"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

// TODO: Replace YOUR_PLACE_ID with the actual Google Place ID from Google Business Profile
const GOOGLE_REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID";

const reviews = [
  {
    name: "Sarah M.",
    initials: "SM",
    color: "bg-blue-100 text-blue-700",
    rating: 5,
    text: "The Makai Classic is hands down the best poke bowl I've had outside of Hawaii. The salmon was so fresh it melted on my tongue, and the sesame ginger sauce tied everything together perfectly. The vibe is clean, modern, and welcoming. A true gem in Beirut.",
    date: "2 weeks ago",
  },
  {
    name: "Karim B.",
    initials: "KB",
    color: "bg-amber-100 text-amber-700",
    rating: 5,
    text: "Spicy Tuna Fire had exactly the kick I was craving. The ingredients taste incredibly fresh — you can tell they're not cutting corners. The crispy onions on top added the perfect crunch. Fast service, beautiful presentation, reasonable prices. Will be back weekly.",
    date: "1 month ago",
  },
  {
    name: "Lena H.",
    initials: "LH",
    color: "bg-emerald-100 text-emerald-700",
    rating: 5,
    text: "Green Goddess converted my boyfriend into a tofu believer. We both got custom bowls — mine with salmon, his with tofu — and they were both incredible. The ponzu sauce is so good I asked if they sell it by the bottle. The staff were genuinely lovely.",
    date: "3 weeks ago",
  },
  {
    name: "Omar F.",
    initials: "OF",
    color: "bg-purple-100 text-purple-700",
    rating: 5,
    text: "Ocean Deep with truffle ponzu is an absolute experience. The combination of salmon and tuna on cauliflower rice felt luxurious without being heavy. Staff are warm, welcoming, and clearly passionate about what they serve. Best healthy lunch spot in the city.",
    date: "1 week ago",
  },
  {
    name: "Maya R.",
    initials: "MR",
    color: "bg-rose-100 text-rose-700",
    rating: 5,
    text: "The Beirut bowl is a must-order. Mango + shrimp + sweet soy is such a genius combination — sweet, savoury, and fresh all at once. It feels like a love letter to Lebanon wrapped in a Hawaiian bowl. The space is beautiful and the music sets the perfect mood.",
    date: "2 months ago",
  },
  {
    name: "Jad S.",
    initials: "JS",
    color: "bg-teal-100 text-teal-700",
    rating: 5,
    text: "Best spot in Beirut for a healthy lunch. Fast, fresh, and the portions are more generous than you'd expect. I love that everything is fully customizable — I'm a creature of habit with my salmon brown rice bowl. Consistent quality every single time.",
    date: "5 days ago",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Reviews() {
  return (
    <section id="reviews" className="bg-white py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4"
        >
          <p className="font-body text-sm tracking-[0.3em] uppercase text-accent mb-3">
            Google Reviews
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl text-text mb-4">
            What people are saying
          </h2>
          <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-5 py-2">
            <Stars count={5} />
            <span className="font-body font-semibold text-sm text-text">
              4.8 / 5
            </span>
            <span className="font-body text-sm text-text/50">
              — Based on Google Reviews
            </span>
          </div>
        </motion.div>

        {/* Cards — horizontal scroll on mobile, grid on desktop */}
        <div className="mt-10 -mx-4 px-4 overflow-x-auto sm:overflow-visible">
          <div className="flex sm:grid sm:grid-cols-3 gap-4 pb-2 sm:pb-0 min-w-max sm:min-w-0">
            {reviews.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="w-72 sm:w-auto flex-shrink-0 bg-bg rounded-2xl p-6 border border-black/5 hover:shadow-md transition-shadow duration-300 flex flex-col gap-4"
              >
                {/* Top */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-body font-bold text-sm ${r.color}`}
                    >
                      {r.initials}
                    </div>
                    <div>
                      <p className="font-body font-semibold text-sm text-text">
                        {r.name}
                      </p>
                      <p className="font-body text-xs text-text/40">{r.date}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-body bg-white border border-black/10 text-text/50 px-2 py-0.5 rounded-full">
                    via Google
                  </span>
                </div>
                <Stars count={r.rating} />
                <p className="font-body text-sm text-text/70 leading-relaxed flex-1">
                  &ldquo;{r.text}&rdquo;
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="mt-16 bg-light rounded-3xl p-10 text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full mb-5">
            <MapPin size={26} className="text-primary" />
          </div>
          <h3 className="font-heading font-black text-2xl sm:text-3xl text-text mb-3">
            Enjoyed your bowl? Leave us a review ❤️
          </h3>
          <p className="font-body text-text/60 mb-6 max-w-sm mx-auto">
            Your feedback helps us grow and reach more poke lovers in Beirut.
          </p>
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full font-body font-semibold hover:bg-primary-dark active:scale-95 transition-all duration-200"
          >
            Review us on Google
          </a>
        </motion.div>
      </div>
    </section>
  );
}
