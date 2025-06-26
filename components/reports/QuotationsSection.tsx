"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
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

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import CountUp from "react-countup";
import { motion } from "framer-motion";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

/* ————————————————————————— PERIOD HELPERS ———————————————————————— */
const PERIOD_OPTIONS = ["week", "month", "quarter", "year"] as const;
type Period = typeof PERIOD_OPTIONS[number];

function getPeriodRange(period: Period, base = new Date()): [Date, Date] {
  const start = new Date(base);
  const end = new Date(base);

  switch (period) {
    case "week": {
      const diff = base.getDay();
      start.setDate(base.getDate() - diff);
      end.setDate(start.getDate() + 6);
      break;
    }
    case "month":
      start.setDate(1);
      end.setMonth(start.getMonth() + 1, 0);
      break;
    case "quarter": {
      const qStart = Math.floor(base.getMonth() / 3) * 3;
      start.setMonth(qStart, 1);
      end.setMonth(qStart + 3, 0);
      break;
    }
    case "year":
      start.setMonth(0, 1);
      end.setMonth(12, 0);
      break;
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return [start, end];
}

function formatRangeLabel(start: Date | null, end: Date | null): string {
  if (!start || !end) return "All Open Quotations";
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" };
  return `${start.toLocaleDateString("en-GB", opts)} – ${end.toLocaleDateString("en-GB", opts)}`;
}

/* ————————————————————————— DATA MODEL —————————————————————————— */
const EXCLUDED_STATUSES = [
  "not interested in doing business with us",
  "company blacklisted",
  "completed",
  "cancelled",
];

interface Event {
  id: string;
  eventType: "CGI" | "QUOTE" | "ORDER";
  referenceCode: string;
  date: string;
  quoteReceivedAt?: string | null;
  csiConvertedAt?: string | null;
  jobCompletedAt?: string | null;
  natureOfWork?: string[] | null;
  actualWorkDescription?: string | null;
  processCost?: number | null;
  contactPerson?: string | null;
  phone?: string | null;
  status: string;
  notes?: string | null;
  leadTime?: number | null;
  companyName?: string;
  customerName: string;
  productName?: string | null;
  quantity?: number | null;
  price?: number | null;
  deliveryDate?: string | null;
  region?: string | null;
  salesRepresentative?: string | null;
  priority?: string | null;
  paymentStatus?: string | null;
  shippingMethod?: string | null;
  internalNotes?: string | null;
  isPriorityCustomer?: boolean | null;
  poNumber?: string | null;
  customerQuoteNumber?: string | null;
  quoteNumber: string;
  quoteReceived: boolean;
  quoteSent: boolean;
  poReceived: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ————————————————————————— COMPONENT —————————————————————————— */
export default function QuotationsReportPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* filters */
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("week");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(() =>
    getPeriodRange("week")
  );
  const [customerFilter, setCustomerFilter] = useState("");
  const [quoteNumberFilter, setQuoteNumberFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>({});

  const reportRef = useRef<HTMLDivElement>(null);

  /* fetch + 5-minute refresh */
  useEffect(() => {
    let mounted = true;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Failed to fetch events");
        if (!mounted) return;
        setEvents(await res.json());
      } catch (err: any) {
        if (mounted) setError(err.message ?? "Unknown error");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 5 * 60 * 1000); // auto-refresh every 5 min
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  /* handler for quick-select */
  const handlePeriodChange = (p: Period) => {
    setSelectedPeriod(p);
    setDateRange(getPeriodRange(p));
  };

  /* active quotations */
  const [startDate, endDate] = dateRange;

  const activeQuotations = useMemo(() => {
    return events.filter((evt) => {
      if (!evt.quoteSent) return false;
      if (EXCLUDED_STATUSES.includes(evt.status.toLowerCase())) return false;

      const cOk = customerFilter
        ? evt.customerName.toLowerCase().includes(customerFilter.toLowerCase())
        : true;
      const qOk = quoteNumberFilter
        ? (evt.quoteNumber ?? "").toLowerCase().includes(quoteNumberFilter.toLowerCase())
        : true;
      const sOk = statusFilter
        ? evt.status.toLowerCase().includes(statusFilter.toLowerCase())
        : true;

      const dOk =
        startDate && endDate
          ? (() => {
              const d = new Date(evt.date);
              return d >= startDate && d <= endDate;
            })()
          : true;

      return cOk && qOk && sOk && dOk;
    });
  }, [events, customerFilter, quoteNumberFilter, statusFilter, startDate, endDate]);

  /* summaries */
  const totalQuotationValue = useMemo(
    () => activeQuotations.reduce((sum, e) => sum + (e.price ?? 0), 0),
    [activeQuotations]
  );

  const totalsBySalesRep = useMemo(() => {
    const g: Record<string, number> = {};
    activeQuotations.forEach((e) => {
      const rep = e.salesRepresentative || "Unknown";
      g[rep] = (g[rep] || 0) + (e.price ?? 0);
    });
    return g;
  }, [activeQuotations]);

  /* charts */
  const barChartData = useMemo(() => {
    const labels = Object.keys(totalsBySalesRep);
    return {
      labels,
      datasets: [
        {
          label: "Total Quotations (ZAR)",
          data: labels.map((l) => totalsBySalesRep[l]),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
      ],
    };
  }, [totalsBySalesRep]);

  const pieChartData = useMemo(() => {
    const labels = Object.keys(totalsBySalesRep);
    return {
      labels,
      datasets: [
        {
          data: labels.map((l) => totalsBySalesRep[l]),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
          ],
        },
      ],
    };
  }, [totalsBySalesRep]);

  /* all quotes in period */
  const allQuotationsInPeriod = useMemo(() => {
    return events.filter((e) => {
      if (!e.quoteSent) return false;
      if (!(startDate && endDate)) return true;
      const d = new Date(e.date);
      return d >= startDate && d <= endDate;
    });
  }, [events, startDate, endDate]);

  const allQuotesByStatusCount = useMemo(() => {
    const g: Record<string, number> = {};
    allQuotationsInPeriod.forEach((e) => {
      const st = e.status.toLowerCase();
      g[st] = (g[st] || 0) + 1;
    });
    return g;
  }, [allQuotationsInPeriod]);

  const allQuotesByStatusChart = useMemo(() => {
    const labels = Object.keys(allQuotesByStatusCount);
    return {
      labels,
      datasets: [
        {
          label: "Number of Quotes",
          data: labels.map((l) => allQuotesByStatusCount[l]),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
      ],
    };
  }, [allQuotesByStatusCount]);

  /* label */
  const periodLabel = formatRangeLabel(startDate, endDate);

  /* status PATCH */
  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, data: { status: newStatus } }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      const updated = await res.json();
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: updated.status } : e)));
      toast.success("Status updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Error updating status");
    }
  }

  /* pdf */
  async function handleDownloadPDF() {
    if (!reportRef.current) return;
    try {
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
      pdf.save("quotations-report.pdf");
    } catch {
      toast.error("Error generating PDF");
    }
  }

  return (
    <motion.div
      className="p-6 space-y-8 bg-white rounded-md shadow max-w-screen-xl mx-auto"
      ref={reportRef}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
    >
      <ToastContainer />
      <h1 className="text-3xl font-bold mb-4">Quotations Report</h1>

      {/* filters */}
      <div className="flex flex-wrap items-end gap-4">
        {/* period dropdown */}
        <div className="w-40">
          <Label className="mb-1 text-gray-700">Period</Label>
          <Select value={selectedPeriod} onValueChange={(v) => handlePeriodChange(v as Period)}>
            <SelectTrigger className="w-full">
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

        {/* range picker */}
        <div className="w-[260px]">
          <Label className="mb-1 text-gray-700">Date Range</Label>
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(upd) => setDateRange(upd as [Date | null, Date | null])}
            isClearable
            dateFormat="dd MMM yyyy"
            className="w-full border border-gray-300 rounded p-2"
            placeholderText="Select range"
          />
        </div>

        {/* text filters */}
        <div className="w-48">
          <Label className="mb-1 text-gray-700">Customer</Label>
          <Input
            placeholder="Search by Customer"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Label className="mb-1 text-gray-700">Quote #</Label>
          <Input
            placeholder="Search by Quote #"
            value={quoteNumberFilter}
            onChange={(e) => setQuoteNumberFilter(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Label className="mb-1 text-gray-700">Status</Label>
          <Input
            placeholder="Search by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>

        <Button variant="outline" className="h-10" onClick={handleDownloadPDF}>
          Download PDF
        </Button>
      </div>

      <p className="text-sm font-medium text-green-700">{periodLabel}</p>

      {/* summary */}
      <motion.div
        className="bg-gray-100 rounded-lg p-4 flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h2 className="text-sm font-medium text-gray-700">
            Total Quotations Value (Active)
          </h2>
          <p className="text-3xl font-bold text-gray-900">
            <CountUp
              end={totalQuotationValue}
              duration={5}
              separator=","
              decimals={2}
              prefix="R "
              formattingFn={(val) =>
                new Intl.NumberFormat("en-ZA", {
                  style: "currency",
                  currency: "ZAR",
                  maximumFractionDigits: 2,
                }).format(Number(val))
              }
            />
          </p>
        </div>
        <img src="/flags/circle.png" alt="South Africa" className="w-8 h-8 object-contain" />
      </motion.div>

      {/* charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4 h-[350px]">
          <h2 className="text-lg font-semibold mb-2">
            Totals by Sales Rep (Active Quotations)
          </h2>
          <Bar
            data={barChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "top" } },
            }}
          />
        </div>
        <div className="bg-white rounded-lg shadow p-4 h-[350px]">
          <h2 className="text-lg font-semibold mb-2">
            Distribution by Sales Rep (Active Quotations)
          </h2>
          <Pie
            data={pieChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "bottom" } },
            }}
          />
        </div>
      </div>

      {/* all quotes status chart */}
      <div className="bg-white rounded-lg shadow p-4 h-[300px]">
        <h2 className="text-lg font-semibold mb-2">
          All Quotations by Status (Bar Chart)
        </h2>
        <Bar
          data={allQuotesByStatusChart}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "top" } },
          }}
        />
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Quote Number</th>
              <th className="px-4 py-2">Sales Rep</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Edit Status</th>
            </tr>
          </thead>
          <tbody>
            {activeQuotations.length ? (
              activeQuotations.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-4 py-2">{e.customerName}</td>
                  <td className="px-4 py-2">{e.quoteNumber || "-"}</td>
                  <td className="px-4 py-2">{e.salesRepresentative || "-"}</td>
                  <td className="px-4 py-2">{e.status}</td>
                  <td className="px-4 py-2">
                    {new Date(e.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2">
                    {e.price ? `R${e.price.toFixed(2)}` : "-"}
                  </td>
                  <td className="px-4 py-2">
                    <Select
                      value={statusUpdates[e.id] || e.status}
                      onValueChange={(v) => {
                        setStatusUpdates((prev) => ({ ...prev, [e.id]: v }));
                        handleStatusChange(e.id, v);
                      }}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Awaiting Feedback",
                          "Meeting to be scheduled",
                          "Looks Promising",
                          "Not interested in doing business with us",
                          "Company blacklisted",
                          "Active",
                          "Completed",
                          "Cancelled",
                          "On Hold",
                          "Pending",
                          "In Progress",
                        ].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  No active quotations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* insights */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Insights</h2>
        <p className="text-sm text-gray-700">
          <strong>High Priority Customers:</strong> We identify high priority customers
          based on repeat business, large enquiry sizes, and strong purchase
          intentions. They rank higher if they consistently follow through.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          <strong>Top Companies:</strong> Companies are ranked by the total
          quotation value. We track the ratio of quotes converting to POs to
          assess performance.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          These metrics help us quickly identify areas of potential growth and
          effectively manage our quotations strategy.
        </p>
      </div>
    </motion.div>
  );
}
