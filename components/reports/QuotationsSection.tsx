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

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// ----- CONSTANTS & TYPES -----

const PERIOD_OPTIONS = ["week", "month", "quarter", "year"] as const;
type Period = typeof PERIOD_OPTIONS[number];

const EXCLUDED_STATUSES = [
  "not interested in doing business with us",
  "company blacklisted",
  "completed",
  "cancelled",
];

// Helper: Determine if eventDate falls within the same period as refDate.
function isWithinPeriod(eventDate: Date, refDate: Date, period: Period): boolean {
  switch (period) {
    case "week": {
      const startOfWeek = new Date(refDate);
      startOfWeek.setDate(refDate.getDate() - refDate.getDay());
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
      const quarter = Math.floor(refDate.getMonth() / 3);
      const eventQuarter = Math.floor(eventDate.getMonth() / 3);
      return eventDate.getFullYear() === refDate.getFullYear() && eventQuarter === quarter;
    }
    case "year":
      return eventDate.getFullYear() === refDate.getFullYear();
    default:
      return false;
  }
}

// Type definition matching your Prisma Event model.
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

export default function QuotationsReportPage() {
  // State to hold all events
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Filter states
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("week");
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [customerFilter, setCustomerFilter] = useState("");
  const [quoteNumberFilter, setQuoteNumberFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // For inline update of status: a mapping from event id to new status value.
  const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>({});

  // Ref for the report container (for PDF download)
  const reportRef = useRef<HTMLDivElement>(null);

  // Fetch events from the backend when mounted
  useEffect(() => {
    async function fetchEvents() {
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
    fetchEvents();
  }, []);

  // Filter active quotations based on conditions:
  // - quoteSent is true
  // - Status (lowercase) is not in EXCLUDED_STATUSES
  // - And then additional filters by customerFilter, quoteNumberFilter, statusFilter and filterDate.
  const activeQuotations = useMemo(() => {
    return events.filter((evt) => {
      if (!evt.quoteSent) return false;
      if (EXCLUDED_STATUSES.includes(evt.status.toLowerCase())) return false;
      const customerMatches = customerFilter.trim()
        ? (evt.customerName ?? "").toLowerCase().includes(customerFilter.toLowerCase())
        : true;
      const quoteMatches = quoteNumberFilter.trim()
        ? (evt.quoteNumber || "").toLowerCase().includes(quoteNumberFilter.toLowerCase())
        : true;
      const statusMatches = statusFilter.trim()
        ? evt.status.toLowerCase().includes(statusFilter.toLowerCase())
        : true;
      const dateMatches = filterDate
        ? new Date(evt.date).toDateString() === filterDate.toDateString()
        : true;
      return customerMatches && quoteMatches && statusMatches && dateMatches;
    });
  }, [events, customerFilter, quoteNumberFilter, statusFilter, filterDate]);

  // Compute total quotation value
  const totalQuotationValue = useMemo(() => {
    return activeQuotations.reduce((sum, evt) => sum + (evt.price || 0), 0);
  }, [activeQuotations]);

  // Group totals by sales representative
  const totalsBySalesRep = useMemo(() => {
    const groups: Record<string, number> = {};
    activeQuotations.forEach((evt) => {
      const rep = evt.salesRepresentative || "Unknown";
      groups[rep] = (groups[rep] || 0) + (evt.price || 0);
    });
    return groups;
  }, [activeQuotations]);

  // Prepare data for Bar Chart (with a fixed height)
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

  // Prepare data for Pie Chart
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

  // Format total as ZAR currency
  const formattedTotal = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(totalQuotationValue);

  // Handler for inline status update (from dropdown in table)
  async function handleStatusChange(eventId: string, newStatus: string) {
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: eventId, data: { status: newStatus } }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      const updated = await res.json();
      setEvents((prev) =>
        prev.map((evt) => (evt.id === eventId ? updated : evt))
      );
      toast.success("Status updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Error updating status.");
    }
  }

  // Handler to download the report as a PDF
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
    <div className="p-6 space-y-6 bg-white rounded-md shadow" ref={reportRef}>
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Quotations Report</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="w-40">
          <Select
            value={selectedPeriod}
            onValueChange={(val) => setSelectedPeriod(val as Period)}
          >
            <SelectTrigger>
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
        <div className="w-40">
          <DatePicker
            selected={filterDate}
            onChange={(date: Date | null) => setFilterDate(date)}
            dateFormat="yyyy-MM-dd"
            placeholderText="Filter by Date"
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>
        <Input
          placeholder="Search by Customer..."
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="w-48"
        />
        <Input
          placeholder="Search by Quote Number..."
          value={quoteNumberFilter}
          onChange={(e) => setQuoteNumberFilter(e.target.value)}
          className="w-48"
        />
        <Input
          placeholder="Search by Status..."
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
        <Button variant="outline" onClick={handleDownloadPDF}>
          Download PDF
        </Button>
      </div>

      {/* Summary Card */}
      <div className="flex items-center justify-between bg-gray-200 rounded-lg p-4">
        <div>
          <h2 className="text-sm font-medium text-gray-700">
            Total Quotations Value
          </h2>
          <p className="text-3xl font-bold text-gray-900">{formattedTotal}</p>
        </div>
        <img
          src="/flags/circle.png"
          alt="South Africa Flag"
          className="w-8 h-8 object-contain"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart with fixed height */}
        <div className="bg-white rounded-lg shadow p-4" style={{ height: "300px" }}>
          <h2 className="text-lg font-semibold mb-2">
            Totals by Sales Rep (Bar Chart)
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
        {/* Pie Chart with fixed height */}
        <div className="bg-white rounded-lg shadow p-4" style={{ height: "300px" }}>
          <h2 className="text-lg font-semibold mb-2">
            Distribution by Sales Rep (Pie Chart)
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
                  <td className="px-4 py-2">
                    {evt.salesRepresentative || "-"}
                  </td>
                  <td className="px-4 py-2">{evt.status}</td>
                  <td className="px-4 py-2">
                    {new Date(evt.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    {evt.price ? `R${evt.price.toFixed(2)}` : "-"}
                  </td>
                  <td className="px-4 py-2">
                    <Select
                      value={statusUpdates[evt.id] || evt.status}
                      onValueChange={(val) => {
                        // Update local mapping for the changed status.
                        setStatusUpdates((prev) => ({ ...prev, [evt.id]: val }));
                        // Immediately update backend.
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

      {/* Explanatory Section */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Insights</h2>
        <p className="text-sm text-gray-700">
          <strong>High Priority Customers:</strong> We identify high priority customers based on our internal criteria (e.g. repeat business, large enquiry size, and history of timely payments). They are ranked higher if they show strong purchase intentions.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          <strong>Top Companies:</strong> Companies are ranked by the total quotation value they represent. The percentage of quotes converted to POs is calculated by comparing the number of quotes that resulted in a purchase order against total quotes sent, multiplied by 100.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          Our reports enable you to quickly see the promising potential in upcoming orders and assess the effectiveness of our quotations strategy.
        </p>
      </div>

      <ToastContainer />
    </div>
  );
}
