/* app/(admin)/admin-portal/dashboard/page.tsx */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Bar,
  Pie,
  Doughnut,
  PolarArea,
  Line,
} from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
} from "chart.js";
import type { ChartData } from "chart.js";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  DollarSign,
  FileText,
  CheckCircle2,
  Target,
  Users,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
);

/* ───────────────────────── CONSTANTS / TYPES ───────────────────────── */
const PERIOD_OPTIONS = ["week", "month", "quarter", "year"] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

interface Event {
  id: string;
  eventType: "CGI" | "QUOTE" | "ORDER";
  date: string;
  quoteSent: boolean;
  poReceived: boolean;
  price?: number | null;
  status: string;
  salesRepresentative?: string | null;
  lineOfWork?: string | null;
}

/* ───────────────────────── HELPERS ───────────────────────── */
function getPeriodRange(period: Period, base = new Date()): [Date, Date] {
  const s = new Date(base);
  const e = new Date(base);
  switch (period) {
    case "week": {
      const dow = base.getDay();
      s.setDate(base.getDate() - dow);
      e.setDate(s.getDate() + 6);
      break;
    }
    case "month":
      s.setDate(1);
      e.setMonth(s.getMonth() + 1, 0);
      break;
    case "quarter": {
      const qm = Math.floor(base.getMonth() / 3) * 3;
      s.setMonth(qm, 1);
      e.setMonth(qm + 3, 0);
      break;
    }
    case "year":
      s.setMonth(0, 1);
      e.setMonth(12, 0);
      break;
  }
  s.setHours(0, 0, 0, 0);
  e.setHours(23, 59, 59, 999);
  return [s, e];
}

function fmt(
  n: number,
  currency = false,
  dec = 2,
  curr = "ZAR",
  locale = "en-ZA",
) {
  return currency
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency: curr,
        maximumFractionDigits: dec,
      }).format(n)
    : new Intl.NumberFormat(locale, {
        maximumFractionDigits: dec,
      }).format(n);
}

/* ───────────────────────── PAGE ───────────────────────── */
export default function AdminDashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [period, setPeriod] = useState<Period>("week");
  const [range, setRange] = useState<[Date | null, Date | null]>(() =>
    getPeriodRange("week"),
  );
  const [loading, setLoading] = useState(false);
  const [start, end] = range;
  const pageRef = useRef<HTMLDivElement>(null);

  /* fetch */
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Failed to fetch");
        if (mounted) setEvents(await res.json());
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    const id = setInterval(fetchData, 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const inRange = (d: Date) => (!start || !end ? true : d >= start && d <= end);

  /* filtered arrays */
  const quotes = useMemo(
    () =>
      events.filter(
        (e) =>
          e.quoteSent &&
          !["cancelled", "completed", "company blacklisted"].includes(
            e.status.toLowerCase(),
          ) &&
          inRange(new Date(e.date)),
      ),
    [events, start, end],
  );

  const orders = useMemo(
    () =>
      events.filter(
        (e) => e.eventType === "ORDER" && e.poReceived && inRange(new Date(e.date)),
      ),
    [events, start, end],
  );

  const reps = useMemo(
    () =>
      Array.from(
        new Set(
          events.map((e) => e.salesRepresentative?.trim()).filter(Boolean) as string[],
        ),
      ),
    [events],
  );

  const lineWorks = useMemo(
    () =>
      Array.from(
        new Set(events.map((e) => e.lineOfWork || "Unknown")),
      ),
    [events],
  );

  /* totals */
  const quotesValue = quotes.reduce((s, e) => s + (e.price ?? 0), 0);
  const ordersValue = orders.reduce((s, e) => s + (e.price ?? 0), 0);
  const convRate = quotesValue ? (ordersValue / quotesValue) * 100 : 0;

  /* ─────────── DATASETS ─────────── */
  /* per rep maps */
  const mapQuotesRep: Record<string, number> = {};
  const mapOrdersRep: Record<string, number> = {};
  reps.forEach((r) => {
    mapQuotesRep[r] = 0;
    mapOrdersRep[r] = 0;
  });
  quotes.forEach((q) => {
    const r = q.salesRepresentative || "Unknown";
    mapQuotesRep[r] += q.price ?? 0;
  });
  orders.forEach((o) => {
    const r = o.salesRepresentative || "Unknown";
    mapOrdersRep[r] += o.price ?? 0;
  });
  const repQuoteVals = reps.map((r) => mapQuotesRep[r]);
  const repOrderVals = reps.map((r) => mapOrdersRep[r]);
  const repConvVals = reps.map((_, i) =>
    repQuoteVals[i] ? +(repOrderVals[i] / repQuoteVals[i]) * 100 : 0,
  );

  /* per line-of-work maps */
  const lineQuoteCount: Record<string, number> = {};
  const lineOrderCount: Record<string, number> = {};
  const lineQuoteVal: Record<string, number> = {};
  const lineOrderVal: Record<string, number> = {};

  lineWorks.forEach((lw) => {
    lineQuoteCount[lw] = 0;
    lineOrderCount[lw] = 0;
    lineQuoteVal[lw] = 0;
    lineOrderVal[lw] = 0;
  });

  quotes.forEach((q) => {
    const lw = q.lineOfWork || "Unknown";
    lineQuoteCount[lw] += 1;
    lineQuoteVal[lw] += q.price ?? 0;
  });
  orders.forEach((o) => {
    const lw = o.lineOfWork || "Unknown";
    lineOrderCount[lw] += 1;
    lineOrderVal[lw] += o.price ?? 0;
  });

  const lwQuoteCounts = lineWorks.map((lw) => lineQuoteCount[lw]);
  const lwOrderCounts = lineWorks.map((lw) => lineOrderCount[lw]);
  const lwQuoteVals = lineWorks.map((lw) => lineQuoteVal[lw]);
  const lwOrderVals = lineWorks.map((lw) => lineOrderVal[lw]);
  const lwConvVals = lineWorks.map((_, i) =>
    lwQuoteVals[i] ? +(lwOrderVals[i] / lwQuoteVals[i]) * 100 : 0,
  );

  /* 1 - mixed bar/line by rep (value + conv) */
  const mixedByRep: ChartData<"bar" | "line", number[], string> = {
    labels: reps,
    datasets: [
      {
        type: "bar",
        label: "Quotation value",
        data: repQuoteVals,
        backgroundColor: "rgba(54,162,235,0.7)",
        borderRadius: 4,
      },
      {
        type: "bar",
        label: "Order value",
        data: repOrderVals,
        backgroundColor: "rgba(75,192,192,0.7)",
        borderRadius: 4,
      },
      {
        type: "line",
        label: "Conversion %",
        data: repConvVals,
        yAxisID: "y1",
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
      },
    ],
  };

  /* 2 - horizontal counts by rep */
  const countsRep: ChartData<"bar", number[], string> = {
    labels: reps,
    datasets: [
      {
        label: "Quotes (count)",
        data: reps.map((r) =>
          quotes.filter((q) => (q.salesRepresentative || "Unknown") === r).length,
        ),
        backgroundColor: "#4F46E5",
      },
      {
        label: "Orders (count)",
        data: reps.map((r) =>
          orders.filter((o) => (o.salesRepresentative || "Unknown") === r).length,
        ),
        backgroundColor: "#059669",
      },
    ],
  };

  /* 3 - polar conv % by rep */
  const polarConv: ChartData<"polarArea", number[], string> = {
    labels: reps,
    datasets: [
      {
        data: repConvVals,
        backgroundColor: reps.map(
          (_, i) =>
            ["#E11D48", "#F97316", "#84CC16", "#22D3EE", "#8B5CF6", "#EC4899"][
              i % 6
            ],
        ),
      },
    ],
  };

  /* 4 - stacked counts by line-of-work */
  const stackedCountsLW: ChartData<"bar", number[], string> = {
    labels: lineWorks,
    datasets: [
      {
        label: "Quotes (count)",
        data: lwQuoteCounts,
        backgroundColor: "#0EA5E9",
        stack: "stack1",
      },
      {
        label: "Orders (count)",
        data: lwOrderCounts,
        backgroundColor: "#10B981",
        stack: "stack1",
      },
    ],
  };

  /* 5 - stacked values by line-of-work */
  const stackedValuesLW: ChartData<"bar", number[], string> = {
    labels: lineWorks,
    datasets: [
      {
        label: "Quote value",
        data: lwQuoteVals,
        backgroundColor: "#9333EA",
        stack: "stack2",
      },
      {
        label: "Order value",
        data: lwOrderVals,
        backgroundColor: "#ECB806",
        stack: "stack2",
      },
    ],
  };

  /* 6 - pie counts share by line-of-work */
  const pieCountsLW: ChartData<"pie", number[], string> = {
    labels: lineWorks,
    datasets: [
      {
        data: lwQuoteCounts,
        backgroundColor: lineWorks.map(
          (_, i) =>
            ["#A78BFA", "#FCA5A5", "#34D399", "#F59E0B", "#818CF8", "#F472B6"][
              i % 6
            ],
        ),
      },
    ],
  };

  /* 7 - pie value share by line-of-work */
  const pieValuesLW: ChartData<"pie", number[], string> = {
    labels: lineWorks,
    datasets: [
      {
        data: lwQuoteVals,
        backgroundColor: lineWorks.map(
          (_, i) =>
            ["#67E8F9", "#C4B5FD", "#FDE047", "#FB7185", "#86EFAC", "#FACC15"][
              i % 6
            ],
        ),
      },
    ],
  };

  /* 8 - doughnut overall quotes vs orders value */
  const doughnutTotal: ChartData<"doughnut", number[], string> = {
    labels: ["Quotes", "Orders"],
    datasets: [
      {
        data: [quotesValue, ordersValue],
        backgroundColor: ["#0EA5E9", "#10B981"],
      },
    ],
  };

  /* pdf */
  const downloadPDF = async () => {
    if (!pageRef.current) return;
    const canvas = await html2canvas(pageRef.current, { scale: 2 });
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      pdf.internal.pageSize.getWidth(),
      (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width,
    );
    pdf.save("dashboard.pdf");
  };

  /* ───────────────────────── RENDER ───────────────────────── */
  return (
    <motion.div
      ref={pageRef}
      className="space-y-8 p-6 max-w-screen-2xl mx-auto bg-white rounded-md shadow"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <ToastContainer />
      <h1 className="text-3xl font-extrabold mb-2">
        LCVSSC • Sales Intelligence
      </h1>

      {/* FILTERS */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-40">
          <Label>Quick Period</Label>
          <Select
            value={period}
            onValueChange={(v) => {
              setPeriod(v as Period);
              setRange(getPeriodRange(v as Period));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Date Range</Label>
          <DatePicker
            selectsRange
            startDate={start}
            endDate={end}
            onChange={(r) => setRange(r as [Date | null, Date | null])}
            isClearable
            dateFormat="dd MMM yyyy"
            className="border rounded p-2 w-[260px]"
          />
        </div>

        <Button variant="outline" className="h-10" onClick={downloadPDF}>
          Download PDF
        </Button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Quotation value", val: quotesValue, color: "bg-blue-100" },
          { label: "Order value", val: ordersValue, color: "bg-emerald-100" },
          { label: "Conversion %", val: convRate, color: "bg-yellow-100", pct: true },
        ].map((c) => (
          <div
            key={c.label}
            className={`${c.color} p-4 rounded-lg flex flex-col`}
          >
            <span className="text-sm font-medium">{c.label}</span>
            <span className="text-2xl font-bold">
              {c.pct ? `${c.val.toFixed(1)}%` : fmt(c.val, true)}
            </span>
          </div>
        ))}
      </div>

      {/* VISUALS ─ eight charts in 4x2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1 */}
        <div className="bg-white rounded-lg shadow p-4 h-[400px]">
          <h2 className="font-semibold mb-1">Value & Conversion by Rep</h2>
          <Bar
            data={mixedByRep as unknown as ChartData<"bar", number[], string>}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: { beginAtZero: true },
                y1: {
                  position: "right",
                  min: 0,
                  max: 100,
                  grid: { drawOnChartArea: false },
                  ticks: { callback: (v) => `${v}%` },
                },
              },
              plugins: { legend: { position: "top" } },
            }}
          />
        </div>

        {/* 2 */}
        <div className="bg-white rounded-lg shadow p-4 h-[400px]">
          <h2 className="font-semibold mb-1">Quote vs Order Counts • Rep</h2>
          <Bar
            data={countsRep}
            options={{
              indexAxis: "y",
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "top" } },
              scales: { x: { beginAtZero: true } },
            }}
          />
        </div>

        {/* 3 */}
        <div className="bg-white rounded-lg shadow p-4 h-[400px]">
          <h2 className="font-semibold mb-1">Rep Conversion % • Polar</h2>
          <PolarArea
            data={polarConv}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </div>

        {/* 4 */}
        <div className="bg-white rounded-lg shadow p-4 h-[400px]">
          <h2 className="font-semibold mb-1">Counts • Line-of-Work (stack)</h2>
          <Bar
            data={stackedCountsLW}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: { x: { stacked: true }, y: { stacked: true } },
              plugins: { legend: { position: "top" } },
            }}
          />
        </div>

        {/* 5 */}
        <div className="bg-white rounded-lg shadow p-4 h-[400px]">
          <h2 className="font-semibold mb-1">Value • Line-of-Work (stack)</h2>
          <Bar
            data={stackedValuesLW}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: { x: { stacked: true }, y: { stacked: true } },
              plugins: { legend: { position: "top" } },
            }}
          />
        </div>

        {/* 6 */}
        <div className="bg-white rounded-lg shadow p-4 h-[400px]">
          <h2 className="font-semibold mb-1">Quote Count Share • LoW</h2>
          <Pie
            data={pieCountsLW}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </div>

        {/* 7 */}
        <div className="bg-white rounded-lg shadow p-4 h-[400px]">
          <h2 className="font-semibold mb-1">Quote Value Share • LoW</h2>
          <Pie
            data={pieValuesLW}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </div>

        {/* 8 */}
        <div className="bg-white rounded-lg shadow p-4 h-[400px]">
          <h2 className="font-semibold mb-1">Total Quotes vs Orders</h2>
          <Doughnut
            data={doughnutTotal}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </div>
      </div>

      {/* BOTTOM BANNER */}
      <Banner events={events} />
    </motion.div>
  );
}

/* ───────────────────────── BANNER ───────────────────────── */
type Stats = { salesOrders: number; quotations: number; csis: number };
interface BannerEvent extends Event {}

function Banner({ events }: { events: BannerEvent[] }) {
  const slides = useMemo(() => buildSlides(events), [events]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setIdx((p) => (p + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (!slides.length)
    return (
      <div className="h-[280px] flex items-center justify-center bg-gray-100 rounded-lg">
        No Data
      </div>
    );

  const slide = slides[idx];
  return (
    <div className="relative h-[280px] rounded-lg overflow-hidden bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-500 text-white">
      <button
        className="absolute left-3 top-3 p-2 hover:bg-white/30 rounded-full"
        onClick={() => setIdx((p) => (p === 0 ? slides.length - 1 : p - 1))}
      >
        <ArrowLeft />
      </button>
      <button
        className="absolute right-3 top-3 p-2 hover:bg-white/30 rounded-full"
        onClick={() => setIdx((p) => (p + 1) % slides.length)}
      >
        <ArrowRight />
      </button>

      <AnimatePresence mode="popLayout">
        <motion.div
          key={slide.id}
          className="w-full h-full flex flex-col items-center justify-center text-center p-6"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.45 }}
        >
          <h2 className="text-2xl font-bold">{slide.title}</h2>
          <p className="text-white/90 mb-4">{slide.subtitle}</p>

          {"stats" in slide ? (
            <BannerStats stats={slide.stats} />
          ) : slide.id === "target" ? (
            <TargetSlide />
          ) : (
            <RepsSlide reps={slide.reps} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function buildSlides(evs: BannerEvent[]) {
  const now = Date.now();
  const byDays = (d: number) =>
    evs.filter((e) => now - new Date(e.date).getTime() <= d * 864e5);
  const periodStats = (arr: BannerEvent[]): Stats => {
    let so = 0,
      qu = 0;
    arr.forEach((e) => {
      if (e.eventType === "ORDER" && e.poReceived) so += e.price ?? 0;
      if (e.quoteSent) qu += e.price ?? 0;
    });
    return { salesOrders: so, quotations: qu, csis: arr.length };
  };

  const week = periodStats(byDays(7));
  const month = periodStats(byDays(30));
  const quarter = periodStats(
    evs.filter((e) => {
      const d = new Date(e.date);
      const start = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
      return d >= start;
    }),
  );
  const year = periodStats(
    evs.filter((e) => new Date(e.date).getFullYear() === new Date().getFullYear()),
  );

  const reps = Array.from(
    new Set(
      evs.map((e) => e.salesRepresentative?.trim()).filter(Boolean) as string[],
    ),
  );

  return [
    { id: "w", title: "Weekly Overview", subtitle: "Last 7 days", stats: week },
    { id: "m", title: "Monthly Overview", subtitle: "Last 30 days", stats: month },
    { id: "q", title: "Quarter-to-Date", subtitle: "Current quarter", stats: quarter },
    { id: "y", title: "Year-to-Date", subtitle: "Current year", stats: year },
    { id: "target", title: "Sales Target", subtitle: "R7.5 M / month" },
    { id: "reps", title: "Sales Team", subtitle: "Active reps", reps },
  ];
}

function BannerStats({ stats }: { stats: Stats }) {
  return (
    <div className="flex gap-4 flex-wrap justify-center">
      {[
        { icon: DollarSign, label: "Orders", val: fmt(stats.salesOrders, true) },
        { icon: FileText, label: "Quotes", val: fmt(stats.quotations, true) },
        { icon: CheckCircle2, label: "CSIs", val: fmt(stats.csis) },
      ].map((c) => (
        <div
          key={c.label}
          className="w-32 h-28 bg-white/20 backdrop-blur rounded-lg flex flex-col items-center justify-center"
        >
          <c.icon className="h-5 w-5 mb-1" />
          <span className="text-sm">{c.label}</span>
          <span className="text-lg font-bold">{c.val}</span>
        </div>
      ))}
    </div>
  );
}

function TargetSlide() {
  return (
    <div className="flex flex-col items-center">
      <Target className="h-8 w-8 mb-2" />
      <p className="text-xl font-bold">Monthly Target</p>
      <p className="text-3xl font-extrabold">{fmt(7_500_000, true)}</p>
    </div>
  );
}

function RepsSlide({ reps }: { reps: string[] }) {
  if (!reps.length) return <p>No reps.</p>;
  return (
    <div className="flex flex-wrap gap-3 justify-center max-w-md">
      {reps.map((r) => (
        <div
          key={r}
          className="w-20 bg-white/20 rounded-lg p-2 flex flex-col items-center"
        >
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-gray-700">
            {r[0]}
          </div>
          <span className="text-xs">{r}</span>
        </div>
      ))}
    </div>
  );
}
