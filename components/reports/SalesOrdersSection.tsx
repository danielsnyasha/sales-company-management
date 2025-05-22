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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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

/* ——————————————————————————————————— HELPER —————————————————————————————————— */
function getPeriodRange(period: Period, base = new Date()): [Date, Date] {
  const start = new Date(base);
  const end = new Date(base);

  switch (period) {
    case "week": {
      // Sunday–Saturday of current week
      const diff = base.getDay(); // 0 (Sun) … 6 (Sat)
      start.setDate(base.getDate() - diff);
      end.setDate(start.getDate() + 6);
      break;
    }
    case "month": {
      start.setDate(1);
      end.setMonth(start.getMonth() + 1, 0); // day 0 of next month = last day of this month
      break;
    }
    case "quarter": {
      const qStartMonth = Math.floor(base.getMonth() / 3) * 3; // 0,3,6,9
      start.setMonth(qStartMonth, 1);
      end.setMonth(qStartMonth + 3, 0); // last day of quarter
      break;
    }
    case "year": {
      start.setMonth(0, 1);  // 1 Jan
      end.setMonth(12, 0);   // 31 Dec
      break;
    }
  }
  // zero-out the time part for clean comparisons
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return [start, end];
}

/* —————————————————————————————————— COMPONENT ————————————————————————————————— */
interface Event {
  id: string;
  eventType: "CGI" | "QUOTE" | "ORDER";
  referenceCode: string;
  date: string;
  salesRepresentative?: string | null;
  customerName: string;
  poNumber?: string | null;
  price?: number | null;
  status: string;
  poReceived?: boolean;
  [key: string]: unknown;
}

export default function SalesOrdersSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ——— filters ——— */
  const [customerFilter, setCustomerFilter] = useState("");
  const [poNumberFilter, setPoNumberFilter] = useState("");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(() =>
    getPeriodRange("week")
  );
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("week");

  /* dialog + pdf */
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  /* ——— data fetch ——— */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Failed to fetch events");
        setEvents(await res.json());
      } catch (err: any) {
        setError(err.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ——— quick-select handler ——— */
  function handlePeriodChange(p: Period) {
    setSelectedPeriod(p);
    setDateRange(getPeriodRange(p)); // ← sync the picker & filtering
  }

  /* ——— filtering ——— */
  const [startDate, endDate] = dateRange;

  const activeSalesOrders = useMemo(() => {
    return events.filter((evt) => {
      if (evt.eventType !== "ORDER" || !evt.poReceived) return false;

      const customerOk = customerFilter
        ? (evt.customerName ?? "")
            .toLowerCase()
            .includes(customerFilter.toLowerCase())
        : true;

      const poOk = poNumberFilter
        ? (evt.poNumber ?? "")
            .toLowerCase()
            .includes(poNumberFilter.toLowerCase())
        : true;

      const dateOk =
        startDate && endDate
          ? (() => {
              const d = new Date(evt.date);
              return d >= startDate && d <= endDate;
            })()
          : true;

      return customerOk && poOk && dateOk;
    });
  }, [events, customerFilter, poNumberFilter, startDate, endDate]);

  // ---- aggregations -------------------------------------------------------
  const totalOrderValue = useMemo(
    () => activeSalesOrders.reduce((sum, e) => sum + (e.price ?? 0), 0),
    [activeSalesOrders]
  );

  const totalsBySalesRep = useMemo(() => {
    const groups: Record<string, number> = {};
    activeSalesOrders.forEach((e) => {
      const rep = e.salesRepresentative || "Unknown";
      groups[rep] = (groups[rep] || 0) + (e.price ?? 0);
    });
    return groups;
  }, [activeSalesOrders]);

  // ---- charts -------------------------------------------------------------
  const barChartData = useMemo(() => {
    const labels = Object.keys(totalsBySalesRep);
    const data = labels.map((l) => totalsBySalesRep[l] ?? 0);
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

  const pieChartData = useMemo(() => {
    const labels = Object.keys(totalsBySalesRep);
    const data = labels.map((l) => totalsBySalesRep[l] ?? 0);
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

  // ---- helper: period label ----------------------------------------------
  const periodLabel = useMemo(() => {
    if (startDate && endDate) {
      const opts: Intl.DateTimeFormatOptions = {
        day: "2-digit",
        month: "short",
        year: "numeric",
      };
      return `${startDate.toLocaleDateString("en-GB", opts)} – ${endDate.toLocaleDateString(
        "en-GB",
        opts
      )}`;
    }

    const today = new Date();
    switch (selectedPeriod) {
      case "week": {
        const first = new Date(today);
        first.setDate(today.getDate() - today.getDay());
        const last = new Date(first);
        last.setDate(first.getDate() + 6);
        return `Week: ${first.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })} – ${last.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}`;
      }
      case "month":
        return `Month: ${today.toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
        })}`;
      case "quarter": {
        const q = Math.floor(today.getMonth() / 3) + 1;
        return `Quarter: Q${q} ${today.getFullYear()}`;
      }
      case "year":
        return `Year: ${today.getFullYear()}`;
      default:
        return "";
    }
  }, [startDate, endDate, selectedPeriod]);

  // ---- pdf ----------------------------------------------------------------
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
      pdf.save("sales-orders-report.pdf");
    } catch {
      toast.error("Error generating PDF");
    }
  }

  // ============================== JSX =====================================
  return (
    <div
      className="p-6 space-y-6 bg-white rounded-md shadow"
      ref={reportRef}
    >
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Sales Orders Report</h1>

      {/* FILTERS ---------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-4">
        {/* quick period dropdown (optional) */}
        <div className="w-36">
          <Select
            value={selectedPeriod}
            onValueChange={(v) => setSelectedPeriod(v as Period)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* RANGE PICKER -------------------------------------------------- */}
        <div className="w-[260px]">
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(upd) => setDateRange(upd as [Date | null, Date | null])}
            isClearable
            dateFormat="dd MMM yyyy"
            className="w-full border border-gray-300 rounded p-2"
            placeholderText="Select date range"
          />
        </div>

        {/* text filters */}
        <Input
          className="w-48"
          placeholder="Search by Customer..."
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
        />
        <Input
          className="w-48"
          placeholder="Search by PO Number..."
          value={poNumberFilter}
          onChange={(e) => setPoNumberFilter(e.target.value)}
        />

        <Button variant="outline" onClick={handleDownloadPDF}>
          Download PDF
        </Button>
      </div>

      {/* helper label */}
      <p className="text-sm font-medium text-green-800">{periodLabel}</p>

      {/* SUMMARY CARD ----------------------------------------------------- */}
      <div className="flex items-center justify-between bg-gray-200 rounded-lg p-4">
        <div>
          <Label className="text-sm font-medium text-gray-700">
            Total Sales Orders Value
          </Label>
          <p className="text-3xl font-bold text-gray-900">
            {new Intl.NumberFormat("en-ZA", {
              style: "currency",
              currency: "ZAR",
            }).format(totalOrderValue)}
          </p>
        </div>
        <img
          src="/flags/circle.png"
          alt="South Africa Flag"
          className="w-8 h-8 object-contain"
        />
      </div>

      {/* CHARTS ----------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4 h-[300px]">
          <h2 className="text-lg font-semibold mb-2">
            Totals by Sales Rep (Bar)
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
        <div className="bg-white rounded-lg shadow p-4 h-[300px]">
          <h2 className="text-lg font-semibold mb-2">
            Distribution by Sales Rep (Pie)
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

      {/* TABLE ------------------------------------------------------------ */}
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
              activeSalesOrders.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-4 py-2">{e.customerName}</td>
                  <td className="px-4 py-2">{e.poNumber || "-"}</td>
                  <td className="px-4 py-2">{e.salesRepresentative || "-"}</td>
                  <td className="px-4 py-2">
                    {new Date(e.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2">
                    {e.price ? `R${e.price.toFixed(2)}` : "-"}
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(e);
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

      {/* VIEW DIALOG ------------------------------------------------------ */}
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
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p>
                <strong>Price:</strong>{" "}
                {selectedEvent.price
                  ? `R${selectedEvent.price.toFixed(2)}`
                  : "-"}
              </p>
              <p>
                <strong>Status:</strong> {selectedEvent.status}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* INSIGHTS --------------------------------------------------------- */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Insights</h2>
        <p className="text-sm text-gray-700">
          <strong>High Priority Customers:</strong> Customers recognised by their
          consistently high order values and repeat business represent strong growth
          opportunities.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          <strong>Top Companies:</strong> Companies are ranked by total sales value. Conversion
          rates from quotations to orders help gauge sales effectiveness.
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
