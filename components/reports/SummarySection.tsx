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
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

/* ─────────── helpers ─────────── */
const PERIOD_OPTIONS = ["week", "month", "quarter", "year"] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

function getPeriodRange(period: Period, base = new Date()): [Date, Date] {
  const s = new Date(base);
  const e = new Date(base);
  switch (period) {
    case "week": {
      s.setDate(base.getDate() - base.getDay());
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

const LINE_OF_WORK_LABEL: Record<string, string> = {
  EC: "Electro Motors",
  SSC: "Steel Service Ctr",
  SMP: "Struct / Plate",
  OEM: "OEM",
  Unknown: "Other",
};

/* ─────────── types ─────────── */
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

/* ─────────── component ─────────── */
export default function RepByLineOfWorkPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  const [period, setPeriod] = useState<Period>("week");
  const [range, setRange] = useState<[Date | null, Date | null]>(() => getPeriodRange("week"));
  const [start, end] = range;

  const reportRef = useRef<HTMLDivElement>(null);

  /* fetch once */
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

  const inRange = (d: Date) => (!start || !end ? true : d >= start && d <= end);

  /* ───── aggregations ───── */
  const reps = Array.from(
    new Set(events.map((e) => e.salesRepresentative ?? "Unknown"))
  ).sort();

  const lws = Array.from(
    new Set(events.map((e) => e.lineOfWork ?? "Unknown"))
  ).sort();

  /* 3-D maps rep→lw→metric */
  const initMap = () =>
    reps.reduce<Record<string, Record<string, number>>>((obj, r) => {
      obj[r] = lws.reduce((o, lw) => ({ ...o, [lw]: 0 }), {});
      return obj;
    }, {});

  const repLwQuoteCount  = initMap();
  const repLwOrderCount  = initMap();
  const repLwQuoteValue  = initMap();
  const repLwOrderValue  = initMap();

  events.forEach((e) => {
    const rep = e.salesRepresentative ?? "Unknown";
    const lw  = e.lineOfWork        ?? "Unknown";
    if (!inRange(new Date(e.date))) return;

    if (e.quoteSent) {
      repLwQuoteCount[rep][lw] += 1;
      repLwQuoteValue[rep][lw] += e.price ?? 0;
    }
    if (e.eventType === "ORDER" && e.poReceived) {
      repLwOrderCount[rep][lw] += 1;
      repLwOrderValue[rep][lw] += e.price ?? 0;
    }
  });

  /* datasets (counts) */
  const quoteCountDatasets = lws.map((lw, i) => ({
    label: LINE_OF_WORK_LABEL[lw] || lw,
    data : reps.map((r) => repLwQuoteCount[r][lw]),
    backgroundColor: ["#FF6384","#36A2EB","#FFCE56","#4BC0C0","#9966FF","#FF9F40"][i % 6],
  }));
  const orderCountDatasets = lws.map((lw, i) => ({
    label: LINE_OF_WORK_LABEL[lw] || lw,
    data : reps.map((r) => repLwOrderCount[r][lw]),
    backgroundColor: ["#8E44AD","#27AE60","#2980B9","#E67E22","#C0392B","#2C3E50"][i % 6],
  }));

  /* datasets (values) */
  const quoteValueDatasets = lws.map((lw, i) => ({
    label: LINE_OF_WORK_LABEL[lw] || lw,
    data : reps.map((r) => repLwQuoteValue[r][lw]),
    backgroundColor: ["#FF6384","#36A2EB","#FFCE56","#4BC0C0","#9966FF","#FF9F40"][i % 6],
  }));
  const orderValueDatasets = lws.map((lw, i) => ({
    label: LINE_OF_WORK_LABEL[lw] || lw,
    data : reps.map((r) => repLwOrderValue[r][lw]),
    backgroundColor: ["#8E44AD","#27AE60","#2980B9","#E67E22","#C0392B","#2C3E50"][i % 6],
  }));

  /* overall totals */
  const totalQuotes = reps.reduce(
    (sum, r) => sum + lws.reduce((s, lw) => s + repLwQuoteCount [r][lw], 0), 0);
  const totalOrders = reps.reduce(
    (sum, r) => sum + lws.reduce((s, lw) => s + repLwOrderCount [r][lw], 0), 0);
  const totalQuoteVal = reps.reduce(
    (sum, r) => sum + lws.reduce((s, lw) => s + repLwQuoteValue[r][lw], 0), 0);
  const totalOrderVal = reps.reduce(
    (sum, r) => sum + lws.reduce((s, lw) => s + repLwOrderValue[r][lw], 0), 0);

  /* PDF */
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
    pdf.save("rep-line-of-work.pdf");
  };

  const rangeLabel =
    start && end ? `${start.toLocaleDateString()} – ${end.toLocaleDateString()}` : "All Dates";

  /* ─────────── UI ─────────── */
  return (
    <div ref={reportRef} className="space-y-10 bg-white rounded-md p-6 shadow">
      <ToastContainer />
      <h1 className="text-3xl font-bold mb-4">Sales Rep Contribution by Line-of-Work</h1>

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

      {/* summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700">Total Quotes (count)</h3>
          <p className="text-2xl font-bold">{fmt(totalQuotes)}</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700">Total Orders (count)</h3>
          <p className="text-2xl font-bold">{fmt(totalOrders)}</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700">Total Quote Value</h3>
          <p className="text-2xl font-bold">{fmt(totalQuoteVal, true)}</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700">Total Order Value</h3>
          <p className="text-2xl font-bold">{fmt(totalOrderVal, true)}</p>
        </div>
      </div>

      {/* COUNT charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4 h-[400px]">
          <h2 className="text-lg font-semibold mb-2">Quotation Counts (stacked)</h2>
          <Bar
            data={{ labels: reps, datasets: quoteCountDatasets }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "top" } },
              scales: { y: { stacked: true }, x: { stacked: true } },
            }}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-4 h-[400px]">
          <h2 className="text-lg font-semibold mb-2">Order Counts (stacked)</h2>
          <Bar
            data={{ labels: reps, datasets: orderCountDatasets }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "top" } },
              scales: { y: { stacked: true }, x: { stacked: true } },
            }}
          />
        </div>
      </div>

      {/* VALUE charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4 h-[400px]">
          <h2 className="text-lg font-semibold mb-2">Quotation Value (stacked)</h2>
          <Bar
            data={{ labels: reps, datasets: quoteValueDatasets }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "top" } },
              scales: { y: { stacked: true, title: { display: true, text: "ZAR" } }, x: { stacked: true } },
            }}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-4 h-[400px]">
          <h2 className="text-lg font-semibold mb-2">Order Value (stacked)</h2>
          <Bar
            data={{ labels: reps, datasets: orderValueDatasets }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "top" } },
              scales: { y: { stacked: true, title: { display: true, text: "ZAR" } }, x: { stacked: true } },
            }}
          />
        </div>
      </div>

      {/* MIX pie for top rep (value) */}
      {reps.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 h-[320px]">
          <h2 className="text-lg font-semibold mb-2">
            Line-of-Work Value Mix&nbsp;
            <span className="font-normal">(Top Order-Value Rep)</span>
          </h2>
          {(() => {
            const repTotals = reps.map((r) =>
              lws.reduce((sum, lw) => sum + repLwOrderValue[r][lw], 0)
            );
            const topIdx = repTotals.indexOf(Math.max(...repTotals));
            const topRep = reps[topIdx];
            const data = lws.map((lw) => repLwOrderValue[topRep][lw]);
            return (
              <Pie
                data={{
                  labels: lws.map((lw) => LINE_OF_WORK_LABEL[lw] || lw),
                  datasets: [
                    {
                      data,
                      backgroundColor: lws.map(
                        (_, i) =>
                          ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"][i % 6]
                      ),
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            );
          })()}
        </div>
      )}

      {/* COUNT table */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Sales Rep</th>
              {lws.map((lw) => (
                <th key={lw} className="px-4 py-2 text-right">
                  {LINE_OF_WORK_LABEL[lw] || lw} (Q/O)
                </th>
              ))}
              <th className="px-4 py-2 text-right">Total Q</th>
              <th className="px-4 py-2 text-right">Total O</th>
              <th className="px-4 py-2 text-right">Conv %</th>
            </tr>
          </thead>
          <tbody>
            {reps.map((rep) => {
              const qTotal = lws.reduce((s, lw) => s + repLwQuoteCount[rep][lw], 0);
              const oTotal = lws.reduce((s, lw) => s + repLwOrderCount[rep][lw], 0);
              return (
                <tr key={rep} className="border-t">
                  <td className="px-4 py-2">{rep}</td>
                  {lws.map((lw) => (
                    <td key={lw} className="px-4 py-2 text-right">
                      {fmt(repLwQuoteCount[rep][lw])}/{fmt(repLwOrderCount[rep][lw])}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right">{fmt(qTotal)}</td>
                  <td className="px-4 py-2 text-right">{fmt(oTotal)}</td>
                  <td className="px-4 py-2 text-right">
                    {qTotal ? ((oTotal / qTotal) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* VALUE table */}
      <div className="overflow-x-auto rounded-md border mt-10">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Sales Rep</th>
              {lws.map((lw) => (
                <th key={lw} className="px-4 py-2 text-right">
                  {LINE_OF_WORK_LABEL[lw] || lw} (Q/O&nbsp;ZAR)
                </th>
              ))}
              <th className="px-4 py-2 text-right">Total Q&nbsp;ZAR</th>
              <th className="px-4 py-2 text-right">Total O&nbsp;ZAR</th>
              <th className="px-4 py-2 text-right">Conv&nbsp;% (Value)</th>
            </tr>
          </thead>
          <tbody>
            {reps.map((rep) => {
              const qValTotal = lws.reduce((s, lw) => s + repLwQuoteValue[rep][lw], 0);
              const oValTotal = lws.reduce((s, lw) => s + repLwOrderValue[rep][lw], 0);
              return (
                <tr key={rep} className="border-t">
                  <td className="px-4 py-2">{rep}</td>
                  {lws.map((lw) => (
                    <td key={lw} className="px-4 py-2 text-right whitespace-nowrap">
                      {fmt(repLwQuoteValue[rep][lw], true)} / {fmt(repLwOrderValue[rep][lw], true)}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right">{fmt(qValTotal, true)}</td>
                  <td className="px-4 py-2 text-right">{fmt(oValTotal, true)}</td>
                  <td className="px-4 py-2 text-right">
                    {qValTotal ? ((oValTotal / qValTotal) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
