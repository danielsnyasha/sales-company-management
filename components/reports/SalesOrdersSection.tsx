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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

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

const PERIOD_OPTIONS = ["week", "month", "quarter", "year"] as const;
type Period = typeof PERIOD_OPTIONS[number];

// We consider sales orders as events with eventType "ORDER" and poReceived === true.
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

const PAGE_SIZE = 15;

export default function SalesOrdersSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Filter states
  // Keep filterDate initially null so it does NOT affect totals until user picks a date:
  const [customerFilter, setCustomerFilter] = useState("");
  const [poNumberFilter, setPoNumberFilter] = useState("");
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("week");

  // For PDF download
  const reportRef = useRef<HTMLDivElement>(null);

  // For viewing event details
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Fetch events from backend on mount
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

  // Filter active sales orders: eventType is "ORDER" and poReceived is true.
  const activeSalesOrders = useMemo(() => {
    return events.filter((evt) => {
      if (evt.eventType !== "ORDER" || !evt.poReceived) return false;

      // Match Customer?
      const customerMatches = customerFilter.trim()
        ? (evt.customerName ?? "").toLowerCase().includes(customerFilter.toLowerCase())
        : true;

      // Match PO?
      const poMatches = poNumberFilter.trim()
        ? (evt.poNumber || "").toLowerCase().includes(poNumberFilter.toLowerCase())
        : true;

      // Only filter by date if filterDate is actually set
      const dateMatches = filterDate
        ? new Date(evt.date).toDateString() === filterDate.toDateString()
        : true;

      return customerMatches && poMatches && dateMatches;
    });
  }, [events, customerFilter, poNumberFilter, filterDate]);

  // Total order value
  const totalOrderValue = useMemo(() => {
    return activeSalesOrders.reduce((sum, evt) => sum + (evt.price || 0), 0);
  }, [activeSalesOrders]);

  // Group totals by sales representative
  const totalsBySalesRep = useMemo(() => {
    const groups: Record<string, number> = {};
    activeSalesOrders.forEach((evt) => {
      const rep = evt.salesRepresentative || "Unknown";
      groups[rep] = (groups[rep] || 0) + (evt.price || 0);
    });
    return groups;
  }, [activeSalesOrders]);

  // Prepare data for Bar Chart (fixed height)
  const barChartData = useMemo(() => {
    const labels = Object.keys(totalsBySalesRep);
    const data = labels.map((label) => totalsBySalesRep[label] || 0);
    return {
      labels,
      datasets: [
        {
          label: "Total Orders (ZAR)",
          data,
          backgroundColor: "rgba(153, 102, 255, 0.6)",
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

  // Format total as ZAR currency.
  const formattedTotal = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(totalOrderValue);

  // Show the chosen period in "01 April 2025" style, even if filterDate=null => fallback to "today"
  const periodLabel = useMemo(() => {
    const baseDate = filterDate || new Date();

    switch (selectedPeriod) {
      case "week": {
        // Start of the week (Sunday-based)
        const dayOfWeek = baseDate.getDay();
        const startOfWeek = new Date(baseDate);
        startOfWeek.setDate(baseDate.getDate() - dayOfWeek);
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
        return `Month: ${baseDate.toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
        })}`;
      case "quarter": {
        const quarter = Math.floor(baseDate.getMonth() / 3) + 1;
        return `Quarter: Q${quarter} ${baseDate.getFullYear()}`;
      }
      case "year":
        return `Year: ${baseDate.getFullYear()}`;
      default:
        return `Period: ${selectedPeriod.toUpperCase()}`;
    }
  }, [filterDate, selectedPeriod]);

  // Handler to download report as PDF.
  async function handleDownloadPDF() {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("sales-orders-report.pdf");
    } catch (err: any) {
      toast.error("Error generating PDF");
    }
  }

  return (
    <div className="p-6 space-y-6 bg-white rounded-md shadow" ref={reportRef}>
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Sales Orders Report</h1>

      {/* Filters in a single line */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Period dropdown */}
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

        {/* Date picker: format as "01 April 2025" */}
        <div className="w-40">
          <DatePicker
            selected={filterDate}
            onChange={(date: Date | null) => setFilterDate(date)}
            dateFormat="dd MMMM yyyy"
            placeholderText="Filter by Date"
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>

        {/* Customer / PO filters */}
        <Input
          placeholder="Search by Customer..."
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="w-48"
        />
        <Input
          placeholder="Search by PO Number..."
          value={poNumberFilter}
          onChange={(e) => setPoNumberFilter(e.target.value)}
          className="w-48"
        />

        {/* Download PDF */}
        <Button variant="outline" onClick={handleDownloadPDF}>
          Download PDF
        </Button>
      </div>

      {/* AFTER the row of filters, we place the label in green text */}
      <div className="mt-2">
        <p className="text-sm font-medium text-green-800">
          {periodLabel}
        </p>
      </div>

      {/* Summary Card */}
      <div className="flex items-center justify-between bg-gray-200 rounded-lg p-4">
        <div>
          <Label className="text-sm font-medium text-gray-700">
            Total Sales Orders Value
          </Label>
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

      {/* Data Table: List Active Sales Orders */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">PO Number</th>
              <th className="px-4 py-2">Sales Rep</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeSalesOrders.length ? (
              activeSalesOrders.map((evt) => (
                <tr key={evt.id} className="border-t">
                  <td className="px-4 py-2">{evt.customerName}</td>
                  <td className="px-4 py-2">{evt.poNumber || "-"}</td>
                  <td className="px-4 py-2">{evt.salesRepresentative || "-"}</td>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(evt);
                        setViewDialogOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  No active sales orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Order Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sales Order Details</DialogTitle>
            <DialogDescription>
              Details for order: {selectedEvent?.referenceCode}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 mt-4 text-sm">
              <p>
                <strong>Customer:</strong> {selectedEvent.customerName}
              </p>
              <p>
                <strong>PO Number:</strong> {selectedEvent.poNumber || "-"}
              </p>
              <p>
                <strong>Sales Representative:</strong>{" "}
                {selectedEvent.salesRepresentative || "-"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(selectedEvent.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p>
                <strong>Price:</strong>{" "}
                {selectedEvent.price ? `R${selectedEvent.price.toFixed(2)}` : "-"}
              </p>
              <p>
                <strong>Status:</strong> {selectedEvent.status}
              </p>
              {/* Additional details if needed */}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Insights Section */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Insights</h2>
        <p className="text-sm text-gray-700">
          <strong>High Priority Customers:</strong> These customers are recognized by their
          consistently high order values and repeat business. They represent a strong growth
          opportunity.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          <strong>Top Companies:</strong> Companies are ranked by the total sales order value.
          Conversion rates from quotations to orders help gauge our sales effectiveness.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          This report provides a complete view of current sales orders, enabling data-driven
          decisions and operational improvements.
        </p>
      </div>

      <ToastContainer />
    </div>
  );
}
