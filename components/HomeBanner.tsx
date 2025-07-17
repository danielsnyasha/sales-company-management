"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard } from "lucide-react";

interface HomeBannerProps {
  title: string;
  subtitle: string;
  rightIcon?: ReactNode;
}

export default function HomeBanner({
  title,
  subtitle,
  rightIcon,
}: HomeBannerProps) {
  return (
    <motion.section
      className="bg-gradient-to-r from-emerald-600 via-blue-500 to-yellow-400 rounded-2xl px-8 py-6 flex items-center justify-between w-full shadow-xl"
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
    >
      <div className="max-w-3xl">
        <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
          {title}
        </h1>
        <p className="mt-1 text-white/90">{subtitle}</p>
      </div>
      {rightIcon ?? (
        <LayoutDashboard className="hidden lg:block w-24 h-24 text-white/30" />
      )}
    </motion.section>
  );
}
