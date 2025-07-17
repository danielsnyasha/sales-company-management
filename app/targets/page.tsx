/* app/(admin)/admin-portal/dashboard/targets/page.tsx */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Bar, Pie, Doughnut } from "react-chartjs-2";
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
} from "chart.js";
import type { ChartData } from "chart.js";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { motion } from "framer-motion";

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
);

/* ───────── CONSTANTS / TYPES ───────── */
const MONTHLY_TARGET = 7_500_000;
const PERIOD_OPTIONS = ["month", "quarter", "year", "custom"] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

interface Event {
  id: string;
  eventType: "CGI" | "QUOTE" | "ORDER";
  date: string;
  quoteSent: boolean;
  poReceived: boolean;
  price?: number | null;
  salesRepresentative?: string | null;
  lineOfWork?: string | null;
}

/* ───────── HELPERS ───────── */
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
const startOfQuarter = (d: Date) => {
  const q = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), q, 1);
};
const endOfQuarter = (d: Date) => {
  const q = Math.floor(d.getMonth() / 3) * 3 + 2;
  return new Date(d.getFullYear(), q + 1, 0, 23, 59, 59, 999);
};
const startOfYear = (d: Date) => new Date(d.getFullYear(), 0, 1);
const endOfYear = (d: Date) =>
  new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);

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
const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (key: string) => {
  const [yyyy, mm] = key.split("-");
  return new Date(+yyyy, +mm - 1, 1).toLocaleString("en-GB", {
    month: "short",
    year: "2-digit",
  });
};

/* ───────── PAGE ───────── */
export default function TargetDashboardPage() {
  /* data */
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  /* default: previous 6 full months to current */
  const today = new Date();
  const startDefault = startOfMonth(new Date(today.getFullYear(), today.getMonth() - 3, 1));
  const endDefault = endOfMonth(today);

  /* filters */
  const [period, setPeriod] = useState<Period>("custom");
  const [range, setRange] = useState<[Date | null, Date | null]>([
    startDefault,
    endDefault,
  ]);
  const [start, end] = range;

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Failed to fetch");
        const data: Event[] = await res.json();
        if (mounted) setEvents(data);
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

  /* quick-select change */
  function handleQuickChange(p: Period) {
    setPeriod(p);
    const now = new Date();
    switch (p) {
      case "month":
        setRange([startOfMonth(now), endOfMonth(now)]);
        break;
      case "quarter":
        setRange([startOfQuarter(now), endOfQuarter(now)]);
        break;
      case "year":
        setRange([startOfYear(now), endOfYear(now)]);
        break;
      case "custom":
        break;
    }
  }

  /* helpers */
  const inRange = (d: Date) => (!start || !end ? true : d >= start && d <= end);

  /* filtered */
  const quotes = useMemo(
    () => events.filter((e) => e.quoteSent && inRange(new Date(e.date))),
    [events, start, end],
  );
  const orders = useMemo(
    () =>
      events.filter(
        (e) => e.eventType === "ORDER" && e.poReceived && inRange(new Date(e.date)),
      ),
    [events, start, end],
  );

  /* aggregations per month */
  const monthMapQuotes: Record<string, number> = {};
  const monthMapOrders: Record<string, number> = {};
  quotes.forEach((q) => {
    const k = monthKey(new Date(q.date));
    monthMapQuotes[k] = (monthMapQuotes[k] || 0) + (q.price ?? 0);
  });
  orders.forEach((o) => {
    const k = monthKey(new Date(o.date));
    monthMapOrders[k] = (monthMapOrders[k] || 0) + (o.price ?? 0);
  });

  /* generate month labels between start and end */
  const months: string[] = [];
  if (start && end) {
    const cur = new Date(start);
    cur.setDate(1);
    while (cur <= end) {
      months.push(monthKey(cur));
      cur.setMonth(cur.getMonth() + 1);
    }
  }
  const monthLabels = months.map(monthLabel);
  const monthQuoteVals = months.map((m) => monthMapQuotes[m] || 0);
  const monthOrderVals = months.map((m) => monthMapOrders[m] || 0);
  const monthTarget = months.map(() => MONTHLY_TARGET);
  const monthVariance = months.map((_, i) => monthOrderVals[i] - MONTHLY_TARGET);

  /* totals */
  const totalTarget = MONTHLY_TARGET * months.length;
  const totalQuotes = monthQuoteVals.reduce((a, b) => a + b, 0);
  const totalOrders = monthOrderVals.reduce((a, b) => a + b, 0);
  const totalVariance = totalOrders - totalTarget;
  const perfPct = totalTarget ? (totalOrders / totalTarget) * 100 : 0;

  /* contributions by rep */
  const reps = useMemo(
    () =>
      Array.from(
        new Set(events.map((e) => e.salesRepresentative?.trim()).filter(Boolean) as string[]),
      ),
    [events],
  );
  const repOrderVals = reps.map((r) =>
    orders.reduce(
      (sum, o) => sum + ((o.salesRepresentative || "Unknown") === r ? o.price ?? 0 : 0),
      0,
    ),
  );

  /* contributions by line-of-work */
  const lineWorks = useMemo(
    () => Array.from(new Set(events.map((e) => e.lineOfWork || "Unknown"))),
    [events],
  );
  const lwOrderVals = lineWorks.map((lw) =>
    orders.reduce((sum, o) => sum + ((o.lineOfWork || "Unknown") === lw ? o.price ?? 0 : 0), 0),
  );

  /* ───────── datasets ───────── */
  const mixedMonthly: ChartData<"bar" | "line", number[], string> = {
    labels: monthLabels,
    datasets: [
      {
        type: "bar",
        label: "Orders",
        data: monthOrderVals,
        backgroundColor: "rgba(34,197,94,0.7)",
        borderRadius: 4,
      },
      {
        type: "bar",
        label: "Target",
        data: monthTarget,
        backgroundColor: "rgba(59,130,246,0.4)",
        borderRadius: 4,
      },
      {
        type: "line",
        label: "Variance",
        data: monthVariance,
        yAxisID: "y1",
        borderColor: "#DC2626",
        backgroundColor: "rgba(220,38,38,0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const doughnutProgress: ChartData<"doughnut", number[], string> = {
    labels: ["Achieved", "Remaining"],
    datasets: [
      {
        data: [Math.min(totalOrders, totalTarget), Math.max(totalTarget - totalOrders, 0)],
        backgroundColor: ["#10B981", "#E5E7EB"],
      },
    ],
  };

  const repBar: ChartData<"bar", number[], string> = {
    labels: reps,
    datasets: [
      {
        label: "Order value",
        data: repOrderVals,
        backgroundColor: reps.map(
          (_, i) => ["#6366F1", "#A855F7", "#F472B6", "#F59E0B", "#10B981"][i % 5],
        ),
      },
    ],
  };

  const lwPie: ChartData<"pie", number[], string> = {
    labels: lineWorks,
    datasets: [
      {
        data: lwOrderVals,
        backgroundColor: lineWorks.map(
          (_, i) =>
            ["#FBBF24", "#34D399", "#60A5FA", "#F87171", "#A78BFA", "#4ADE80"][i % 6],
        ),
      },
    ],
  };

  /* pdf */
  const pageRef = useRef<HTMLDivElement>(null);
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
    pdf.save("targets-dashboard.pdf");
  };

  /* ───────── render ───────── */
  return (
    <>
      {/* Sticky header */}
      <div className="sticky top-0 z-50">
        <DashboardHeader />
      </div>

      <motion.div
        ref={pageRef}
        className="space-y-8 p-6 max-w-screen-2xl mx-auto bg-white rounded-md shadow"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <ToastContainer />

        {/* informational banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-purple-800 text-white rounded-lg p-6">
          <h1 className="text-3xl font-extrabold mb-1">Monthly Sales Targets</h1>
          <p className="text-sm leading-relaxed max-w-3xl">
            Every month our organisation aims for <strong>{fmt(MONTHLY_TARGET, true)}</strong> in
            confirmed sales orders. Below you&rsquo;ll find a snapshot of the past four months
            compared to that target, along with variance highlights, top-performing sales
            representatives and line-of-work contributions. Use the quick filters or custom date
            picker to explore performance across any period.
          </p>
        </div>

        {/* filters */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-44">
            <Label>Quick Range</Label>
            <Select value={period} onValueChange={(v) => handleQuickChange(v as Period)}>
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
              onChange={(r) => {
                setRange(r as [Date | null, Date | null]);
                setPeriod("custom");
              }}
              isClearable
              dateFormat="dd MMM yyyy"
              className="border rounded p-2 w-[260px]"
            />
          </div>

          <Button variant="outline" className="h-10" onClick={downloadPDF}>
            Download PDF
          </Button>
        </div>

        {/* summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { lbl: "Target", val: totalTarget },
            { lbl: "Orders", val: totalOrders },
            { lbl: "Variance", val: totalVariance },
            { lbl: "Performance %", val: perfPct, pct: true },
          ].map((c) => (
            <div key={c.lbl} className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm font-medium">{c.lbl}</p>
              <p className="text-2xl font-bold">
                {c.pct ? `${c.val.toFixed(1)}%` : fmt(c.val, true)}
              </p>
            </div>
          ))}
        </div>

        {/* visuals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* mixed */}
          <div className="bg-white rounded-lg shadow p-4 h-[420px]">
            <h2 className="font-semibold mb-1">Monthly Target vs Orders</h2>
            <Bar
              data={mixedMonthly as unknown as ChartData<"bar", number[], string>}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true },
                  y1: {
                    position: "right",
                    grid: { drawOnChartArea: false },
                    ticks: { callback: (v) => fmt(+v, false, 0) },
                  },
                },
                plugins: { legend: { position: "top" } },
              }}
            />
          </div>

          {/* progress doughnut */}
          <div className="bg-white rounded-lg shadow p-4 h-[420px]">
            <h2 className="font-semibold mb-1">Progress This Period</h2>
            <Doughnut
              data={doughnutProgress}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>

          {/* rep contribution */}
          <div className="bg-white rounded-lg shadow p-4 h-[420px]">
            <h2 className="font-semibold mb-1">Representative Contributions</h2>
            <Bar
              data={repBar}
              options={{
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                scales: { x: { beginAtZero: true } },
                plugins: { legend: { display: false } },
              }}
            />
          </div>

          {/* line-of-work pie */}
          <div className="bg-white rounded-lg shadow p-4 h-[420px]">
            <h2 className="font-semibold mb-1">Line-of-Work Share</h2>
            <Pie
              data={lwPie}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>
      </motion.div>
    </>
  );
}
