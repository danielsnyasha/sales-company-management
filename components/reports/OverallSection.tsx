"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

/* ─────────── helpers ─────────── */
const PERIOD_OPTIONS = ["week", "month", "quarter", "year"] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

function getPeriodRange(period: Period, base = new Date()): [Date, Date] {
  const s = new Date(base);
  const e = new Date(base);
  switch (period) {
    case "week": {
      const diff = base.getDay();
      s.setDate(base.getDate() - diff);
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

const EXCLUDED_STATUSES = [
  "not interested in doing business with us",
  "company blacklisted",
  "completed",
  "cancelled",
];

interface Event {
  id: string;
  eventType: "CGI" | "QUOTE" | "ORDER";
  date: string;
  quoteSent: boolean;
  poReceived: boolean;
  salesRepresentative?: string | null;
  status: string;
  price?: number | null;
}

/* ─────────── component ─────────── */
export default function ConversionOverviewSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  const [period, setPeriod] = useState<Period>("week");
  const [range, setRange] = useState<[Date | null, Date | null]>(() =>
    getPeriodRange("week")
  );
  const [start, end] = range;

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Fetch failed");
        setEvents(await res.json());
      } catch (err: any) {
        toast.error(err.message || "Error loading data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isInRange = (d: Date) => !start || !end || (d >= start && d <= end);

  /* ── values per rep ── */
  const quotesByRep = useMemo(() => {
    const g: Record<string, number> = {};
    events.forEach((e) => {
      if (!e.quoteSent) return;
      if (EXCLUDED_STATUSES.includes(e.status.toLowerCase())) return;
      if (!isInRange(new Date(e.date))) return;
      const rep = e.salesRepresentative ?? "Unknown";
      g[rep] = (g[rep] || 0) + (e.price ?? 0);
    });
    return g;
  }, [events, start, end]);

  const ordersByRep = useMemo(() => {
    const g: Record<string, number> = {};
    events.forEach((e) => {
      if (e.eventType !== "ORDER" || !e.poReceived) return;
      if (!isInRange(new Date(e.date))) return;
      const rep = e.salesRepresentative ?? "Unknown";
      g[rep] = (g[rep] || 0) + (e.price ?? 0);
    });
    return g;
  }, [events, start, end]);

  /* combined arrays */
  const reps = useMemo(
    () => Array.from(new Set([...Object.keys(quotesByRep), ...Object.keys(ordersByRep)])),
    [quotesByRep, ordersByRep]
  );
  const quoteVals = reps.map((r) => quotesByRep[r] ?? 0);
  const orderVals = reps.map((r) => ordersByRep[r] ?? 0);
  const convVals = reps.map((_, i) =>
    quoteVals[i] ? +(orderVals[i] / quoteVals[i]) * 100 : 0
  );

  /* totals */
  const totalQuotes = quoteVals.reduce((a, b) => a + b, 0);
  const totalOrders = orderVals.reduce((a, b) => a + b, 0);
  const overallConv = totalQuotes ? (totalOrders / totalQuotes) * 100 : 0;

  /* chart data */
  const barLine = {
    labels: reps,
    datasets: [
      {
        type: "bar" as const,
        label: "Quotations (ZAR)",
        data: quoteVals,
        backgroundColor: "rgba(54,162,235,0.6)",
      },
      {
        type: "bar" as const,
        label: "Sales Orders (ZAR)",
        data: orderVals,
        backgroundColor: "rgba(75,192,192,0.6)",
      },
      {
        type: "line" as const,
        label: "Conversion %",
        data: convVals,
        yAxisID: "y1",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  const pieQuotes = {
    labels: reps,
    datasets: [
      {
        data: quoteVals,
        backgroundColor: reps.map(
          (_, i) =>
            ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"][i % 6]
        ),
      },
    ],
  };

  const pieOrders = {
    labels: reps,
    datasets: [
      {
        data: orderVals,
        backgroundColor: reps.map(
          (_, i) =>
            ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"][(i + 1) % 6]
        ),
      },
    ],
  };

  /* pdf */
  const downloadPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      pdf.internal.pageSize.getWidth(),
      (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width
    );
    pdf.save("conversion-overview.pdf");
  };

  const rangeLabel =
    start && end
      ? `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`
      : "All Dates";

  /* ─────────── UI ─────────── */
  return (
    <div ref={reportRef} className="space-y-8 bg-white rounded-md p-6 shadow">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Sales vs Quotations Conversion</h1>

      {/* filters */}
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

        <div className="w-[260px]">
          <Label>Date Range</Label>
          <DatePicker
            selectsRange
            startDate={start}
            endDate={end}
            onChange={(r) => setRange(r as [Date | null, Date | null])}
            isClearable
            dateFormat="dd MMM yyyy"
            className="w-full border border-gray-300 rounded p-2"
            placeholderText="Select range"
          />
        </div>

        <Button variant="outline" className="h-10" onClick={downloadPDF}>
          Download PDF
        </Button>
      </div>

      <p className="text-sm font-medium text-green-700">{rangeLabel}</p>

      {/* summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700">Total Quotations Value</h3>
          <p className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(
              totalQuotes
            )}
          </p>
        </div>
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700">Total Sales Orders Value</h3>
          <p className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(
              totalOrders
            )}
          </p>
        </div>
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700">Overall Conversion</h3>
          <p className="text-2xl font-bold text-gray-900">
            {overallConv.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* bar + line */}
        <div className="bg-white rounded-lg shadow p-4 h-[380px]">
          <h2 className="text-lg font-semibold mb-2">
            Quotation vs Sales Value & Conversion %
          </h2>
          <Bar
            data={barLine}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: { title: { display: true, text: "Value (ZAR)" } },
                y1: {
                  title: { display: true, text: "Conversion %" },
                  position: "right",
                  min: 0,
                  max: 100,
                  ticks: { callback: (v) => `${v}%` },
                  grid: { drawOnChartArea: false },
                },
              },
              plugins: { legend: { position: "top" } },
            }}
          />
        </div>

        {/* conversion bar */}
        <div className="bg-white rounded-lg shadow p-4 h-[380px]">
          <h2 className="text-lg font-semibold mb-2">Conversion % (per Rep)</h2>
          <Bar
            data={{
              labels: reps,
              datasets: [
                {
                  label: "Conversion %",
                  data: convVals,
                  backgroundColor: "rgba(255,99,132,0.6)",
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: { y: { min: 0, max: 100, ticks: { callback: (v) => `${v}%` } } },
              plugins: { legend: { display: false } },
            }}
          />
        </div>

        {/* pies */}
        <div className="bg-white rounded-lg shadow p-4 h-[350px]">
          <h2 className="text-lg font-semibold mb-2">Quotation Value Share</h2>
          <Pie data={pieQuotes} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
        <div className="bg-white rounded-lg shadow p-4 h-[350px]">
          <h2 className="text-lg font-semibold mb-2">Sales-Order Value Share</h2>
          <Pie data={pieOrders} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  );
}
