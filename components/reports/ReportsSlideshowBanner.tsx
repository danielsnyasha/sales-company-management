"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  DollarSign,
  FileText,
  CheckCircle2,
  Target,
  Users,
  Loader2,
} from "lucide-react";

// Adjust if your statuses differ
const EXCLUDED_STATUSES = [
  "Cancelled",
  "Completed",
  "Not interested in doing business with us",
  "Company blacklisted",
];

interface Event {
  id: string;
  eventType: "CGI" | "QUOTE" | "ORDER";
  poReceived: boolean;
  quoteSent: boolean;
  status: string;
  price?: number | null;
  date: string;
  salesRepresentative?: string | null;
}

// For slides that show stats
interface Stats {
  salesOrders: number;
  quotations: number;
  csis: number;
}

// 3 possible slide "types":
interface StatsSlide {
  id: "weekly" | "monthly" | "quarterly" | "yearly";
  title: string;
  subtitle: string;
  stats: Stats;
}
interface TargetSlide {
  id: "target";
  title: string;
  subtitle: string;
}
interface RepsSlide {
  id: "reps";
  title: string;
  subtitle: string;
  reps: string[];
}

// Union type
type Slide = StatsSlide | TargetSlide | RepsSlide;

export default function UltimateDashboardBanner() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  // On mount, fetch all events
  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const res = await fetch("/api/events");
        if (!res.ok) {
          throw new Error("Failed to fetch events");
        }
        const data: Event[] = await res.json();
        setEvents(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // Filter helpers
  const weekStats: Stats = useMemo(
    () => computeStats(filterByDays(events, 7)),
    [events]
  );
  const monthStats: Stats = useMemo(
    () => computeStats(filterByDays(events, 30)),
    [events]
  );
  const quarterStats: Stats = useMemo(
    () => computeStats(filterByQuarter(events)),
    [events]
  );
  const yearStats: Stats = useMemo(
    () => computeStats(filterByYear(events)),
    [events]
  );

  // Collect reps
  const reps = useMemo(() => {
    const unique = new Set(
      events
        .map((e) => e.salesRepresentative)
        .filter((rep) => rep && rep.trim() !== "")
    );
    return Array.from(unique) as string[];
  }, [events]);

  // Slides array: 4 stats slides + 1 target + 1 reps
  const slides: Slide[] = useMemo(() => {
    return [
      {
        id: "weekly",
        title: "Weekly Overview",
        subtitle: "Last 7 Days",
        stats: weekStats,
      },
      {
        id: "monthly",
        title: "Monthly Overview",
        subtitle: "Last 30 Days",
        stats: monthStats,
      },
      {
        id: "quarterly",
        title: "Quarterly Overview",
        subtitle: "Current Quarter",
        stats: quarterStats,
      },
      {
        id: "yearly",
        title: "Yearly Overview",
        subtitle: "Current Year",
        stats: yearStats,
      },
      {
        id: "target",
        title: "Sales Target",
        subtitle: "6.5M per Quarter",
      },
      {
        id: "reps",
        title: "Sales Representatives",
        subtitle: "Team Overview",
        reps,
      },
    ];
  }, [weekStats, monthStats, quarterStats, yearStats, reps]);

  const totalSlides = slides.length;

  function handlePrev() {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  }
  function handleNext() {
    setCurrentIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  }

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (totalSlides < 2) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  // Loading / error states
  if (loading) {
    return (
      <div className="relative w-full h-[35px] mb-0 flex items-center justify-center bg-gradient-to-r from-purple-700 to-indigo-500 text-white">
        <Loader2 className="h-12 w-12 animate-bounce" />
        <span className="ml-4 text-xl font-semibold">Loading Data...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="relative w-full h-[300px] mb-0 flex items-center justify-center bg-red-100 text-red-700 text-xl font-semibold">
        {error}
      </div>
    );
  }
  if (!slides.length) {
    return (
      <div className="relative w-full h-[300px] mb-0 flex items-center justify-center bg-gray-200 text-gray-700 text-xl">
        No Data Found
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <div
      className="relative w-full h-[300px] mb-0 overflow-hidden flex items-start px-6"
      style={{
        background: "linear-gradient(to right, #6c36c2, #48238d, #3b8cda)",
      }}
    >
      {/* Left arrow */}
      <button
        onClick={handlePrev}
        disabled={totalSlides < 2}
        className="z-10 p-2 mt-2 rounded-full hover:bg-white/20 transition"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="relative flex-1 h-full flex items-start justify-center">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, x: 60, scale: 0.85, rotate: 5 }}
            animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, x: -60, scale: 0.85, rotate: -5 }}
            transition={{ type: "spring", stiffness: 80, damping: 12 }}
            className="absolute w-full h-full flex flex-col items-center justify-start text-white text-center mt-2"
          >
            <h2 className="text-2xl font-extrabold mb-1">{currentSlide.title}</h2>
            <p className="text-md text-white/90 mb-4">{currentSlide.subtitle}</p>

            {/* For stats slides vs target vs reps */}
            {"stats" in currentSlide ? (
              <MetricsRow
                salesOrders={currentSlide.stats.salesOrders}
                quotations={currentSlide.stats.quotations}
                csis={currentSlide.stats.csis}
              />
            ) : currentSlide.id === "target" ? (
              <TargetSlide />
            ) : (
              <RepsSlide reps={currentSlide.reps} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right arrow */}
      <button
        onClick={handleNext}
        disabled={totalSlides < 2}
        className="z-10 p-2 mt-2 rounded-full hover:bg-white/20 transition"
      >
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}

/** The row of 3 metric "cards": Sales Orders, Quotations, CSIs */
function MetricsRow({
  salesOrders,
  quotations,
  csis,
}: {
  salesOrders: number;
  quotations: number;
  csis: number;
}) {
  // If you never want to see 0 for CSIs
  const safeCsis = csis === 0 ? 1 : csis;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <MetricCard
        icon={<DollarSign className="h-5 w-5" />}
        label="Sales Orders"
        value={`R ${salesOrders.toLocaleString("en-ZA")}`}
        description="All PO Received"
      />
      <MetricCard
        icon={<FileText className="h-5 w-5" />}
        label="Quotations"
        value={`R ${quotations.toLocaleString("en-ZA")}`}
        description="Not canceled/blacklisted"
      />
      <MetricCard
        icon={<CheckCircle2 className="h-5 w-5" />}
        label="CSIs"
        value={safeCsis.toString()}
        description="Customer Sales Interactions"
      />
    </div>
  );
}

/** Single "card" for a metric */
function MetricCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="w-40 h-32 bg-white/20 rounded-lg flex flex-col items-center justify-center px-2 py-2">
      <div className="flex items-center gap-1 text-base mb-1 font-semibold">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-white/80 mt-1">{description}</div>
    </div>
  );
}

/** Slide that shows the 6.5M target */
function TargetSlide() {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="flex flex-col items-center">
        <Target className="h-8 w-8 mb-2" />
        <p className="text-xl font-bold">Quarterly Target</p>
      </div>
      <p className="text-3xl font-extrabold">
        R {6500000 .toLocaleString("en-ZA")}
      </p>
      <p className="text-sm text-white/80">
        Aiming for 6.5 Million in each quarter
      </p>
    </div>
  );
}

/** Slide that lists all the Sales Reps */
function RepsSlide({ reps }: { reps: string[] }) {
  if (!reps.length) {
    return <p className="text-lg">No sales representatives found.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Users className="h-8 w-8" />
      <p className="text-lg font-semibold">Active Sales Reps</p>
      <div className="flex flex-wrap gap-4 justify-center mt-2">
        {reps.map((rep) => (
          <div
            key={rep}
            className="w-20 h-20 bg-white/20 rounded-md flex flex-col items-center justify-center"
          >
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-gray-800 mb-1">
              {rep[0]?.toUpperCase() ?? "?"}
            </div>
            <span className="text-sm font-medium">{rep}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Utility: filter events from last X days */
function filterByDays(events: Event[], days: number): Event[] {
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return events.filter((e) => new Date(e.date).getTime() >= cutoff);
}

/** Utility: filter events from start-of-quarter to now */
function filterByQuarter(events: Event[]): Event[] {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const quarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);

  return events.filter((e) => {
    const dt = new Date(e.date);
    return dt >= quarterStart && dt <= now;
  });
}

/** Utility: filter events from start-of-year to now */
function filterByYear(events: Event[]): Event[] {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  return events.filter((e) => {
    const dt = new Date(e.date);
    return dt >= yearStart && dt <= now;
  });
}

/** Compute the 3 key stats from a subset of events */
function computeStats(subset: Event[]): Stats {
  let salesOrders = 0;
  let quotations = 0;
  let csis = subset.length; // each event is a "Customer Sales Interaction"

  for (const e of subset) {
    // Sales Orders
    if (e.eventType === "ORDER" && e.poReceived) {
      salesOrders += e.price || 0;
    }
    // Quotations
    if (e.quoteSent && !EXCLUDED_STATUSES.includes(e.status)) {
      quotations += e.price || 0;
    }
  }
  return { salesOrders, quotations, csis };
}
