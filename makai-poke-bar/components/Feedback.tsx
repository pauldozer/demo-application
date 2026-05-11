"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { MapPin, Clock, Phone, Loader2, CheckCircle } from "lucide-react";
import InstagramIcon from "@/components/icons/InstagramIcon";

// TODO: Wire form submission to a backend API (e.g., Resend, Formspree, or custom route)
// TODO: Replace Google Maps iframe src with actual embed URL from Google Maps → Share → Embed a map

type FormData = {
  name: string;
  email: string;
  phone?: string;
  visitType: string;
  message: string;
};

const contactInfo = [
  {
    icon: MapPin,
    label: "Location",
    value: "Beirut, Lebanon",
    sub: "Find us on Google Maps",
    color: "text-primary",
    bg: "bg-light",
  },
  {
    icon: InstagramIcon,
    label: "Instagram",
    value: "@makai.lb",
    href: "https://www.instagram.com/makai.lb",
    sub: "Follow our daily feed",
    color: "text-accent",
    bg: "bg-orange-50",
  },
  {
    icon: Clock,
    label: "Hours",
    value: "Mon – Sun",
    sub: "11:00 AM – 10:00 PM",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Phone,
    label: "Phone",
    // TODO: Add actual phone number
    value: "+961 XX XXX XXX",
    sub: "Call or WhatsApp",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

export default function Feedback() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    await new Promise((r) => setTimeout(r, 1200));
    console.log("Form submission:", data);
    setSubmitted(true);
    reset();
  };

  return (
    <section id="contact" className="bg-bg py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="font-body text-sm tracking-[0.3em] uppercase text-accent mb-3">
            Say hello
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl text-text">
            Get in touch
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-black/5"
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full py-12 gap-4 text-center">
                <CheckCircle size={52} className="text-emerald-500" />
                <h3 className="font-heading font-bold text-2xl text-text">
                  Message received!
                </h3>
                <p className="font-body text-text/60">
                  Thanks for reaching out. We&apos;ll get back to you soon. 🌊
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-2 font-body text-sm text-accent underline underline-offset-2"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                {/* Name */}
                <div>
                  <label className="font-body text-sm font-medium text-text/70 mb-1.5 block">
                    Name <span className="text-accent">*</span>
                  </label>
                  <input
                    {...register("name", { required: "Name is required" })}
                    placeholder="Your name"
                    className={`w-full border rounded-xl px-4 py-3 font-body text-sm text-text outline-none transition-colors focus:border-primary bg-bg ${
                      errors.name ? "border-red-400" : "border-black/15"
                    }`}
                  />
                  {errors.name && (
                    <p className="font-body text-xs text-red-500 mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="font-body text-sm font-medium text-text/70 mb-1.5 block">
                    Email <span className="text-accent">*</span>
                  </label>
                  <input
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email address",
                      },
                    })}
                    type="email"
                    placeholder="you@example.com"
                    className={`w-full border rounded-xl px-4 py-3 font-body text-sm text-text outline-none transition-colors focus:border-primary bg-bg ${
                      errors.email ? "border-red-400" : "border-black/15"
                    }`}
                  />
                  {errors.email && (
                    <p className="font-body text-xs text-red-500 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone + Visit type row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-sm font-medium text-text/70 mb-1.5 block">
                      Phone <span className="text-text/30">(optional)</span>
                    </label>
                    <input
                      {...register("phone")}
                      type="tel"
                      placeholder="+961 ..."
                      className="w-full border border-black/15 rounded-xl px-4 py-3 font-body text-sm text-text outline-none focus:border-primary transition-colors bg-bg"
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm font-medium text-text/70 mb-1.5 block">
                      Visit type <span className="text-accent">*</span>
                    </label>
                    <select
                      {...register("visitType", { required: "Please select" })}
                      className={`w-full border rounded-xl px-4 py-3 font-body text-sm text-text outline-none focus:border-primary transition-colors bg-bg ${
                        errors.visitType ? "border-red-400" : "border-black/15"
                      }`}
                    >
                      <option value="">Select...</option>
                      <option>Dine in</option>
                      <option>Takeaway</option>
                      <option>Delivery</option>
                      <option>Catering</option>
                    </select>
                    {errors.visitType && (
                      <p className="font-body text-xs text-red-500 mt-1">
                        {errors.visitType.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="font-body text-sm font-medium text-text/70 mb-1.5 block">
                    Message <span className="text-accent">*</span>
                  </label>
                  <textarea
                    {...register("message", {
                      required: "Message is required",
                      minLength: { value: 10, message: "At least 10 characters" },
                    })}
                    rows={4}
                    placeholder="Your message, feedback, or question..."
                    className={`w-full border rounded-xl px-4 py-3 font-body text-sm text-text outline-none focus:border-primary transition-colors resize-none bg-bg ${
                      errors.message ? "border-red-400" : "border-black/15"
                    }`}
                  />
                  {errors.message && (
                    <p className="font-body text-xs text-red-500 mt-1">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 bg-accent text-white px-6 py-3.5 rounded-xl font-body font-semibold hover:bg-accent-dark active:scale-[0.98] transition-all duration-200 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </form>
            )}
          </motion.div>

          {/* Contact info + map */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-5"
          >
            {contactInfo.map((info) => (
              <div
                key={info.label}
                className="bg-white rounded-2xl p-5 border border-black/5 flex items-center gap-4 hover:shadow-sm transition-shadow"
              >
                <div className={`w-11 h-11 rounded-full ${info.bg} flex items-center justify-center flex-shrink-0`}>
                  <info.icon size={20} className={info.color} />
                </div>
                <div>
                  <p className="font-body text-xs text-text/40 mb-0.5">{info.label}</p>
                  {info.href ? (
                    <a
                      href={info.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-body font-semibold text-sm ${info.color} hover:underline`}
                    >
                      {info.value}
                    </a>
                  ) : (
                    <p className="font-body font-semibold text-sm text-text">{info.value}</p>
                  )}
                  <p className="font-body text-xs text-text/50">{info.sub}</p>
                </div>
              </div>
            ))}

            {/* Map embed placeholder */}
            {/* TODO: Replace src with actual Google Maps embed URL from: Maps → Share → Embed a map */}
            <div className="rounded-2xl overflow-hidden border border-black/5 bg-light flex items-center justify-center h-48 text-text/30 font-body text-sm">
              <div className="text-center">
                <MapPin size={32} className="mx-auto mb-2 text-text/20" />
                <p>Google Maps embed</p>
                <p className="text-xs">Replace with actual embed URL</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
