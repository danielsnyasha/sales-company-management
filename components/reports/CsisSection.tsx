"use client";

import React, { useEffect, useRef, useState } from "react";
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

import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CountUp from "react-countup";
import { motion } from "framer-motion";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

/* ───────────────────────── helpers ───────────────────────── */
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

function fmt(num: number, curr = false) {
  return curr
    ? new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(num)
    : new Intl.NumberFormat("en-ZA").format(num);
}

/* ───────────────────────── types ───────────────────────── */
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

const LINE_OF_WORK_LABEL: Record<string, string> = {
  EC: "Electro Motors",
  SSC: "Steel Service Center",
  SMP: "Structural Mechanical & Plate",
  OEM: "OEM",
  Unknown: "Other",
};

/* ───────────────────────── component ────────────────────── */
export default function LineOfWorkReportPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  /* filters */
  const [period, setPeriod] = useState<Period>("week");
  const [range, setRange] = useState<[Date | null, Date | null]>(() => getPeriodRange("week"));
  const [start, end] = range;

  const reportRef = useRef<HTMLDivElement>(null);

  // --- 5min self-refresh logic ---
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Fetch failed");
        if (!mounted) return;
        setEvents(await res.json());
      } catch (err: any) {
        toast.error(err.message || "Error loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 5 * 60 * 1000); // every 5 minutes
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  /* helpers */
  const isInRange = (d: Date) => (!start || !end ? true : d >= start && d <= end);

  /* ────── aggregations (counts + values) ────── */
  const quoCounts: Record<string, number> = {};
  const soCounts: Record<string, number> = {};
  const quoValues: Record<string, number> = {};
  const soValues: Record<string, number> = {};

  events.forEach((e) => {
    const lw = e.lineOfWork ?? "Unknown";
    const inRange = isInRange(new Date(e.date));
    if (!inRange) return;

    if (e.quoteSent) {
      quoCounts[lw] = (quoCounts[lw] || 0) + 1;
      quoValues[lw] = (quoValues[lw] || 0) + (e.price ?? 0);
    }
    if (e.eventType === "ORDER" && e.poReceived) {
      soCounts[lw] = (soCounts[lw] || 0) + 1;
      soValues[lw] = (soValues[lw] || 0) + (e.price ?? 0);
    }
  });

  /* unified keys */
  const lws = Array.from(
    new Set([...Object.keys(quoCounts), ...Object.keys(soCounts)])
  ).sort();

  /* arrays for charts */
  const quoCountVals = lws.map((k) => quoCounts[k] ?? 0);
  const soCountVals = lws.map((k) => soCounts[k] ?? 0);
  const quoValueVals = lws.map((k) => quoValues[k] ?? 0);
  const soValueVals = lws.map((k) => soValues[k] ?? 0);

  /* totals */
  const totalQuoCount = quoCountVals.reduce((a, b) => a + b, 0);
  const totalSoCount = soCountVals.reduce((a, b) => a + b, 0);
  const totalQuoValue = quoValueVals.reduce((a, b) => a + b, 0);
  const totalSoValue = soValueVals.reduce((a, b) => a + b, 0);

  /* derived metrics rows */
  const metricsRows = lws.map((k, i) => {
    const qC = quoCountVals[i];
    const sC = soCountVals[i];
    const qV = quoValueVals[i];
    const sV = soValueVals[i];
    return {
      lw: LINE_OF_WORK_LABEL[k] || k,
      quoCount: qC,
      soCount: sC,
      quoValue: qV,
      soValue: sV,
      avgQuoValue: qC ? qV / qC : 0,
      convRateCount: qC ? (sC / qC) * 100 : 0,
      convRateValue: qV ? (sV / qV) * 100 : 0,
    };
  });

  /* find toppers */
  const topOrderValue = metricsRows.reduce(
    (best, r) => (r.soValue > best.soValue ? r : best),
    metricsRows[0] ?? { soValue: 0 }
  );

  /* charts */
  const barCounts = {
    labels: lws.map((k) => LINE_OF_WORK_LABEL[k] || k),
    datasets: [
      {
        label: "Quotations Sent",
        data: quoCountVals,
        backgroundColor: "rgba(54,162,235,0.6)",
      },
      {
        label: "Sales Orders",
        data: soCountVals,
        backgroundColor: "rgba(255,99,132,0.6)",
      },
    ],
  };

  const barValues = {
    labels: lws.map((k) => LINE_OF_WORK_LABEL[k] || k),
    datasets: [
      {
        label: "Quotation Value (ZAR)",
        data: quoValueVals,
        backgroundColor: "rgba(75,192,192,0.6)",
      },
      {
        label: "Sales Order Value (ZAR)",
        data: soValueVals,
        backgroundColor: "rgba(255,159,64,0.6)",
      },
    ],
  };

  const pieQuoCounts = {
    labels: lws.map((k) => LINE_OF_WORK_LABEL[k] || k),
    datasets: [
      {
        data: quoCountVals,
        backgroundColor: lws.map(
          (_, i) =>
            ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"][i % 6]
        ),
      },
    ],
  };

  const pieSoCounts = {
    labels: lws.map((k) => LINE_OF_WORK_LABEL[k] || k),
    datasets: [
      {
        data: soCountVals,
        backgroundColor: lws.map(
          (_, i) =>
            ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"][(i + 1) % 6]
        ),
      },
    ],
  };

  const pieConvRate = {
    labels: lws.map((k) => LINE_OF_WORK_LABEL[k] || k),
    datasets: [
      {
        data: lws.map((_, i) => (quoCountVals[i] ? (soCountVals[i] / quoCountVals[i]) * 100 : 0)),
        backgroundColor: lws.map(
          (_, i) =>
            ["#8E44AD", "#27AE60", "#2980B9", "#E67E22", "#C0392B", "#2C3E50"][i % 6]
        ),
      },
    ],
  };

  /* PDF download */
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
    pdf.save("line-of-work-report.pdf");
  };

  const rangeLabel =
    start && end
      ? `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`
      : "All Dates";

  /* ───────────────────────── UI ──────────────────────── */
  return (
    <motion.div
      ref={reportRef}
      className="space-y-10 bg-white rounded-md p-6 shadow"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
    >
      <ToastContainer />
      <h1 className="text-3xl font-bold mb-4">Quotations & Orders by Line-of-Work</h1>

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
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.13,
            },
          },
        }}
      >
        <motion.div
          className="bg-gray-100 rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h3 className="text-sm font-medium text-gray-700">Total Quotations</h3>
          <p className="text-2xl font-bold text-gray-900">
            <CountUp end={totalQuoCount} duration={5} separator="," />
          </p>
        </motion.div>
        <motion.div
          className="bg-gray-100 rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-sm font-medium text-gray-700">Total Orders</h3>
          <p className="text-2xl font-bold text-gray-900">
            <CountUp end={totalSoCount} duration={5} separator="," />
          </p>
        </motion.div>
        <motion.div
          className="bg-gray-100 rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-sm font-medium text-gray-700">Quotation Value</h3>
          <p className="text-2xl font-bold text-gray-900">
            <CountUp
              end={totalQuoValue}
              duration={5}
              separator=","
              decimals={2}
              prefix="R "
              formattingFn={(val) =>
                new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 2 }).format(Number(val))
              }
            />
          </p>
        </motion.div>
        <motion.div
          className="bg-gray-100 rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-sm font-medium text-gray-700">Order Value</h3>
          <p className="text-2xl font-bold text-gray-900">
            <CountUp
              end={totalSoValue}
              duration={5}
              separator=","
              decimals={2}
              prefix="R "
              formattingFn={(val) =>
                new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 2 }).format(Number(val))
              }
            />
          </p>
        </motion.div>
      </motion.div>

      {/* charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* counts bar */}
        <div className="bg-white rounded-lg shadow p-4 h-[380px]">
          <h2 className="text-lg font-semibold mb-2">Counts per Line-of-Work</h2>
          <Bar
            data={barCounts}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "top" } },
              scales: { y: { beginAtZero: true } },
            }}
          />
        </div>

        {/* values bar */}
        <div className="bg-white rounded-lg shadow p-4 h-[380px]">
          <h2 className="text-lg font-semibold mb-2">Value per Line-of-Work</h2>
          <Bar
            data={barValues}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "top" } },
              scales: { y: { beginAtZero: true } },
            }}
          />
        </div>

        {/* quotation share */}
        <div className="bg-white rounded-lg shadow p-4 h-[320px]">
          <h2 className="text-lg font-semibold mb-2">Quotation Count Share</h2>
          <Pie data={pieQuoCounts} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>

        {/* order share */}
        <div className="bg-white rounded-lg shadow p-4 h-[320px]">
          <h2 className="text-lg font-semibold mb-2">Order Count Share</h2>
          <Pie data={pieSoCounts} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>

        {/* conversion */}
        <div className="bg-white rounded-lg shadow p-4 h-[320px] lg:col-span-2">
          <h2 className="text-lg font-semibold mb-2">Conversion % by Line-of-Work</h2>
          <Pie data={pieConvRate} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

      {/* ───────────── additional metrics / insights ───────────── */}
      <div className="space-y-6">
        {/* table */}
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Line-of-Work</th>
                <th className="px-4 py-2 text-right">Quotes</th>
                <th className="px-4 py-2 text-right">Orders</th>
                <th className="px-4 py-2 text-right">Quote Value</th>
                <th className="px-4 py-2 text-right">Order Value</th>
                <th className="px-4 py-2 text-right">Avg Quote</th>
                <th className="px-4 py-2 text-right">Conv % (Count)</th>
                <th className="px-4 py-2 text-right">Conv % (Value)</th>
              </tr>
            </thead>
            <tbody>
              {metricsRows.map((r) => (
                <tr key={r.lw} className="border-t">
                  <td className="px-4 py-2">{r.lw}</td>
                  <td className="px-4 py-2 text-right">{fmt(r.quoCount)}</td>
                  <td className="px-4 py-2 text-right">{fmt(r.soCount)}</td>
                  <td className="px-4 py-2 text-right">{fmt(r.quoValue, true)}</td>
                  <td className="px-4 py-2 text-right">{fmt(r.soValue, true)}</td>
                  <td className="px-4 py-2 text-right">{fmt(r.avgQuoValue, true)}</td>
                  <td className="px-4 py-2 text-right">{r.convRateCount.toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right">{r.convRateValue.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* quick insights */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Insights</h2>
          <ul className="list-disc ml-6 space-y-1 text-sm text-gray-700">
            <li>
              <strong>{topOrderValue.lw}</strong> generated the highest sales-order value (
              {fmt(topOrderValue.soValue, true)}) during the selected period.
            </li>
            <li>
              Overall conversion rate by <em>count</em> is{" "}
              <strong>
                {totalQuoCount ? ((totalSoCount / totalQuoCount) * 100).toFixed(1) : 0}%
              </strong>{" "}
              &nbsp;— by <em>value</em> it is{" "}
              <strong>
                {totalQuoValue ? ((totalSoValue / totalQuoValue) * 100).toFixed(1) : 0}%
              </strong>
              .
            </li>
            <li>
              Average quotation value across all lines is{" "}
              <strong>
                {fmt(totalQuoCount ? totalQuoValue / totalQuoCount : 0, true)}
              </strong>
              .
            </li>
            <li>
              Use these metrics to focus production capacity and sales effort on the most
              profitable lines of work.
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
