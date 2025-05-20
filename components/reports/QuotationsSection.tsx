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

// Register Chart.js components once
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

/**
 * PERIOD & FILTERING
 */
const PERIOD_OPTIONS = ["week", "month", "quarter", "year"] as const;
type Period = typeof PERIOD_OPTIONS[number];

const EXCLUDED_STATUSES = [
  "not interested in doing business with us",
  "company blacklisted",
  "completed",
  "cancelled",
];

// For Sunday-based weeks
function isWithinPeriod(eventDate: Date, refDate: Date, period: Period): boolean {
  switch (period) {
    case "week": {
      // Sunday-based
      const dayOfWeek = refDate.getDay(); // 0=Sun
      const startOfWeek = new Date(refDate);
      startOfWeek.setDate(refDate.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    }
    case "month":
      return (
        eventDate.getFullYear() === refDate.getFullYear() &&
        eventDate.getMonth() === refDate.getMonth()
      );
    case "quarter": {
      const evtQuarter = Math.floor(eventDate.getMonth() / 3);
      const refQuarter = Math.floor(refDate.getMonth() / 3);
      return eventDate.getFullYear() === refDate.getFullYear() && evtQuarter === refQuarter;
    }
    case "year":
      return eventDate.getFullYear() === refDate.getFullYear();
    default:
      return true;
  }
}

/**
 * Return a user-friendly label for the chosen date & period
 * If no date => "All Open Quotations"
 */
function getPeriodLabel(filterDate: Date | null, period: Period): string {
  if (!filterDate) {
    return "All Open Quotations";
  }

  switch (period) {
    case "week": {
      // Sunday-based
      const dayOfWeek = filterDate.getDay();
      const startOfWeek = new Date(filterDate);
      startOfWeek.setDate(filterDate.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startStr = startOfWeek.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const endStr = endOfWeek.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      return `Week: ${startStr} - ${endStr}`;
    }
    case "month":
      return `Month: ${filterDate.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })}`;
    case "quarter": {
      const quarter = Math.floor(filterDate.getMonth() / 3) + 1;
      return `Quarter: Q${quarter} ${filterDate.getFullYear()}`;
    }
    case "year":
      return `Year: ${filterDate.getFullYear()}`;
    default:
      return "All Open Quotations";
  }
}

/**
 * QUOTATIONS EVENT MODEL
 */
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

/**
 * DEFAULT EXPORT: QuotationsReportPage
 */
export default function QuotationsReportPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("week");
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [customerFilter, setCustomerFilter] = useState("");
  const [quoteNumberFilter, setQuoteNumberFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Partial status updates: local memory
  const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>({});

  // For PDF
  const reportRef = useRef<HTMLDivElement>(null);

  // ----- Fetch events
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Failed to fetch events");
        const data: Event[] = await res.json();
        setEvents(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ----- Active quotations
  const activeQuotations = useMemo(() => {
    return events.filter((evt) => {
      // Must have quoteSent == true
      if (!evt.quoteSent) return false;
      // Must not be in excluded statuses
      if (EXCLUDED_STATUSES.includes(evt.status.toLowerCase())) return false;

      // Text filters
      const cMatches = customerFilter.trim()
        ? evt.customerName.toLowerCase().includes(customerFilter.toLowerCase())
        : true;
      const qMatches = quoteNumberFilter.trim()
        ? (evt.quoteNumber || "").toLowerCase().includes(quoteNumberFilter.toLowerCase())
        : true;
      const sMatches = statusFilter.trim()
        ? evt.status.toLowerCase().includes(statusFilter.toLowerCase())
        : true;

      if (!filterDate) {
        // no date => skip time-based filtering
        return cMatches && qMatches && sMatches;
      }

      const evtDate = new Date(evt.date);
      const inPeriod = isWithinPeriod(evtDate, filterDate, selectedPeriod);
      return cMatches && qMatches && sMatches && inPeriod;
    });
  }, [
    events,
    customerFilter,
    quoteNumberFilter,
    statusFilter,
    filterDate,
    selectedPeriod,
  ]);

  // Summaries (Active only)
  const totalQuotationValue = useMemo(() => {
    return activeQuotations.reduce((sum, e) => sum + (e.price || 0), 0);
  }, [activeQuotations]);

  const totalsBySalesRep = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const evt of activeQuotations) {
      const rep = evt.salesRepresentative || "Unknown";
      groups[rep] = (groups[rep] || 0) + (evt.price || 0);
    }
    return groups;
  }, [activeQuotations]);

  // Charts for Active
  const barChartData = useMemo(() => {
    const labels = Object.keys(totalsBySalesRep);
    const data = labels.map((label) => totalsBySalesRep[label] || 0);
    return {
      labels,
      datasets: [
        {
          label: "Total Quotations (ZAR)",
          data,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
      ],
    };
  }, [totalsBySalesRep]);

  const pieChartData = useMemo(() => {
    const labels = Object.keys(totalsBySalesRep);
    const data = labels.map((label) => totalsBySalesRep[label] || 0);
    return {
      labels,
      datasets: [
        {
          data,
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

  // Additional: All quotations in period
  const allQuotationsInPeriod = useMemo(() => {
    // "All quotes whether closed or not" => quoteSent == true
    // ignoring EXCLUDED_STATUSES
    return events.filter((evt) => {
      if (!evt.quoteSent) return false;
      if (!filterDate) return true;
      const d = new Date(evt.date);
      return isWithinPeriod(d, filterDate, selectedPeriod);
    });
  }, [events, filterDate, selectedPeriod]);

  // Group them by status
  const allQuotesByStatusCount = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const evt of allQuotationsInPeriod) {
      const st = evt.status.toLowerCase() || "unknown";
      groups[st] = (groups[st] || 0) + 1;
    }
    return groups;
  }, [allQuotationsInPeriod]);

  const allQuotesByStatusChartData = useMemo(() => {
    const labels = Object.keys(allQuotesByStatusCount);
    const data = labels.map((label) => allQuotesByStatusCount[label]);
    return {
      labels,
      datasets: [
        {
          label: "Number of Quotes",
          data,
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
      ],
    };
  }, [allQuotesByStatusCount]);

  const formattedTotal = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(totalQuotationValue);

  // Period label for green text
  const periodLabel = useMemo(() => {
    return getPeriodLabel(filterDate, selectedPeriod);
  }, [filterDate, selectedPeriod]);

  // Only patch "status" in the backend
  async function handleStatusChange(evtId: string, newStatus: string) {
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: evtId, data: { status: newStatus } }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      const updated = await res.json();

      // Locally only override status
      setEvents((prev) =>
        prev.map((evt) => (evt.id === evtId ? { ...evt, status: updated.status } : evt))
      );

      toast.success("Status updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Error updating status");
    }
  }

  // PDF
  async function handleDownloadPDF() {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("quotations-report.pdf");
    } catch (err: any) {
      toast.error("Error generating PDF");
    }
  }

  return (
    <div className="p-6 space-y-8 bg-white rounded-md shadow max-w-screen-xl mx-auto" ref={reportRef}>
      <ToastContainer />
      <h1 className="text-3xl font-bold mb-4">Quotations Report</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Period */}
        <div className="w-40">
          <Label className="mb-1 text-gray-700">Period</Label>
          <Select
            value={selectedPeriod}
            onValueChange={(val) => setSelectedPeriod(val as Period)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Date */}
        <div className="w-40">
          <Label className="mb-1 text-gray-700">Filter Date</Label>
          <DatePicker
            selected={filterDate}
            onChange={(date: Date | null) => setFilterDate(date)}
            dateFormat="dd MMMM yyyy"
            placeholderText="(optional)"
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>

        {/* Customer Filter */}
        <div className="w-48">
          <Label className="mb-1 text-gray-700">Customer</Label>
          <Input
            placeholder="Search by Customer"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          />
        </div>

        {/* Quote Number */}
        <div className="w-48">
          <Label className="mb-1 text-gray-700">Quote #</Label>
          <Input
            placeholder="Search by Quote #"
            value={quoteNumberFilter}
            onChange={(e) => setQuoteNumberFilter(e.target.value)}
          />
        </div>

        {/* Status Filter */}
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

      {/* Period label in green */}
      <p className="text-sm font-medium text-green-700">{periodLabel}</p>

      {/* Summary Card */}
      <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-gray-700">
            Total Quotations Value (Active)
          </h2>
          <p className="text-3xl font-bold text-gray-900">{formattedTotal}</p>
        </div>
        <img
          src="/flags/circle.png"
          alt="South Africa"
          className="w-8 h-8 object-contain"
        />
      </div>

      {/* Charts (Active) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bar */}
        <div className="bg-white rounded-lg shadow p-4" style={{ height: "350px" }}>
          <h2 className="text-lg font-semibold mb-2">
            Totals by Sales Rep (Active Quotations)
          </h2>
          <Bar
            data={{
              labels: barChartData.labels,
              datasets: barChartData.datasets,
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "top" } },
            }}
          />
        </div>
        {/* Pie */}
        <div className="bg-white rounded-lg shadow p-4" style={{ height: "350px" }}>
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

      {/* Additional: all quotations (even closed) in period, grouped by status */}
      <div className="bg-white rounded-lg shadow p-4" style={{ height: "300px" }}>
        <h2 className="text-lg font-semibold mb-2">
          All Quotations by Status (Bar Chart)
        </h2>
        <Bar
          data={allQuotesByStatusChartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "top" } },
          }}
        />
      </div>

      {/* Data Table: Active Quotations */}
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
              activeQuotations.map((evt) => (
                <tr key={evt.id} className="border-t">
                  <td className="px-4 py-2">{evt.customerName}</td>
                  <td className="px-4 py-2">{evt.quoteNumber || "-"}</td>
                  <td className="px-4 py-2">{evt.salesRepresentative || "-"}</td>
                  <td className="px-4 py-2">{evt.status}</td>
                  <td className="px-4 py-2">
                    {new Date(evt.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2">
                    {evt.price ? `R${evt.price.toFixed(2)}` : "-"}
                  </td>
                  <td className="px-4 py-2">
                    <Select
                      value={statusUpdates[evt.id] || evt.status}
                      onValueChange={(val) => {
                        setStatusUpdates((prev) => ({ ...prev, [evt.id]: val }));
                        handleStatusChange(evt.id, val);
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
                        ].map((statusOption) => (
                          <SelectItem key={statusOption} value={statusOption}>
                            {statusOption}
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

      {/* Insights */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Insights</h2>
        <p className="text-sm text-gray-700">
          <strong>High Priority Customers:</strong> We identify high priority customers based on repeat
          business, large enquiry sizes, and strong purchase intentions. They rank higher if they exhibit
          consistent follow-through.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          <strong>Top Companies:</strong> Companies are ranked by the total quotation value. We track the ratio
          of quotes converting to POs to assess performance.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          These metrics help us quickly identify areas of potential growth and effectively manage our
          quotations strategy.
        </p>
      </div>
    </div>
  );
}
