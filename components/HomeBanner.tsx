"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
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
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import HomeBanner from "@/components/HomeBanner";
import { Loader2 } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

// --------- PERIOD LOGIC ----------
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

// --------- DUMMY MAPS (if needed) ----------
const LINE_OF_WORK_LABEL: Record<string, string> = {
  EC: "Electro Motors",
  SSC: "Steel Service Center",
  SMP: "Structural Mechanical & Plate",
  OEM: "OEM",
  Unknown: "Other",
};

// --------- MAIN COMPONENT ----------
export default function DashboardPage() {
  // ----- State -----
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("week");
  const [range, setRange] = useState<[Date | null, Date | null]>(() => getPeriodRange("week"));
  const [start, end] = range;
  const [salesRep, setSalesRep] = useState<string>("all");

  // ----- Fetch Data -----
  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Data fetch failed");
        if (!mounted) return;
        setEvents(await res.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // ----- Filter helpers -----
  const isInRange = (d: Date) => !start || !end || (d >= start && d <= end);
  const repOptions = useMemo(() => {
    const reps = new Set(events.map(e => e.salesRepresentative ?? "Unknown"));
    return Array.from(reps);
  }, [events]);

  // ----- DATA AGGREGATION -----
  const filteredEvents = useMemo(
    () => events.filter(e => isInRange(new Date(e.date))),
    [events, start, end]
  );
  const byRep = useMemo(() => salesRep === "all"
    ? filteredEvents
    : filteredEvents.filter(e => (e.salesRepresentative ?? "Unknown") === salesRep),
    [filteredEvents, salesRep]
  );

  // Quotations
  const quotations = byRep.filter(e => e.quoteSent && !["not interested in doing business with us", "company blacklisted", "completed", "cancelled"].includes((e.status ?? "").toLowerCase()));
  const quotationsValue = quotations.reduce((sum, e) => sum + (e.price ?? 0), 0);
  const quotationsCount = quotations.length;

  // Orders
  const orders = byRep.filter(e => e.eventType === "ORDER" && e.poReceived);
  const ordersValue = orders.reduce((sum, e) => sum + (e.price ?? 0), 0);
  const ordersCount = orders.length;

  // Conversion
  const convPercentCount = quotationsCount ? (ordersCount / quotationsCount) * 100 : 0;
  const convPercentValue = quotationsValue ? (ordersValue / quotationsValue) * 100 : 0;

  // --- Sales Orders Over Time ---
  const timeLabels = (() => {
    // Show by day for week, by week for month, by month for quarter/year
    if (period === "week") {
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(start as Date);
        d.setDate(d.getDate() + i);
        return d.toLocaleDateString("en-GB", { weekday: "short" });
      });
    }
    if (period === "month") {
      return Array.from({ length: 4 }).map((_, i) => `W${i + 1}`);
    }
    if (period === "quarter") {
      return Array.from({ length: 3 }).map((_, i) => `M${i + 1}`);
    }
    return Array.from({ length: 12 }).map((_, i) => new Date(0, i).toLocaleString("en-GB", { month: "short" }));
  })();
  const ordersByTime = (() => {
    if (!start || !end) return [];
    let counts = Array(timeLabels.length).fill(0);
    let values = Array(timeLabels.length).fill(0);
    orders.forEach(e => {
      const d = new Date(e.date);
      let idx = 0;
      if (period === "week") idx = Math.min(Math.floor((d.getTime() - (start as Date).getTime()) / (24*60*60*1000)), 6);
      if (period === "month") idx = Math.min(Math.floor((d.getTime() - (start as Date).getTime()) / (7*24*60*60*1000)), 3);
      if (period === "quarter") idx = Math.min(Math.floor((d.getMonth() - (start as Date).getMonth())), 2);
      if (period === "year") idx = d.getMonth();
      counts[idx] = (counts[idx] ?? 0) + 1;
      values[idx] = (values[idx] ?? 0) + (e.price ?? 0);
    });
    return { counts, values };
  })();

  // --- Top Sales Rep, Top Line-of-Work ---
  const repAgg: Record<string, { quotes: number, orders: number, quoteValue: number, orderValue: number }> = {};
  filteredEvents.forEach(e => {
    const rep = e.salesRepresentative ?? "Unknown";
    repAgg[rep] = repAgg[rep] || { quotes: 0, orders: 0, quoteValue: 0, orderValue: 0 };
    if (e.quoteSent && !["not interested in doing business with us", "company blacklisted", "completed", "cancelled"].includes((e.status ?? "").toLowerCase())) {
      repAgg[rep].quotes += 1;
      repAgg[rep].quoteValue += e.price ?? 0;
    }
    if (e.eventType === "ORDER" && e.poReceived) {
      repAgg[rep].orders += 1;
      repAgg[rep].orderValue += e.price ?? 0;
    }
  });
  const topRep = Object.entries(repAgg).sort((a, b) => b[1].orderValue - a[1].orderValue)[0]?.[0] ?? "Unknown";

  // --- Line of Work breakdown ---
  const lwAgg: Record<string, { quoteCount: number, orderCount: number, quoteValue: number, orderValue: number }> = {};
  filteredEvents.forEach(e => {
    const lw = e.lineOfWork ?? "Unknown";
    lwAgg[lw] = lwAgg[lw] || { quoteCount: 0, orderCount: 0, quoteValue: 0, orderValue: 0 };
    if (e.quoteSent) {
      lwAgg[lw].quoteCount += 1;
      lwAgg[lw].quoteValue += e.price ?? 0;
    }
    if (e.eventType === "ORDER" && e.poReceived) {
      lwAgg[lw].orderCount += 1;
      lwAgg[lw].orderValue += e.price ?? 0;
    }
  });

  // --- Prepare CHARTS DATA ---
  // Bar: Sales/Quotes by Rep
  const barByRep = {
    labels: Object.keys(repAgg),
    datasets: [
      {
        label: "Quotations (ZAR)",
        data: Object.values(repAgg).map(v => v.quoteValue),
        backgroundColor: "rgba(36, 163, 101, 0.7)",
      },
      {
        label: "Sales Orders (ZAR)",
        data: Object.values(repAgg).map(v => v.orderValue),
        backgroundColor: "rgba(37, 99, 235, 0.7)",
      },
    ],
  };
  // Pie: Distribution by Line-of-Work
  const lwLabels = Object.keys(lwAgg).map(k => LINE_OF_WORK_LABEL[k] ?? k);
  const lwQuoteVals = Object.values(lwAgg).map(v => v.quoteValue);
  const lwOrderVals = Object.values(lwAgg).map(v => v.orderValue);
  const pieQuotesByLW = {
    labels: lwLabels,
    datasets: [
      {
        data: lwQuoteVals,
        backgroundColor: [
          "#10B981", "#2563EB", "#F59E42", "#A78BFA", "#FBBF24", "#34D399", "#818CF8", "#F87171"
        ],
      },
    ],
  };
  const pieOrdersByLW = {
    labels: lwLabels,
    datasets: [
      {
        data: lwOrderVals,
        backgroundColor: [
          "#6366F1", "#F59E42", "#A78BFA", "#10B981", "#FBBF24", "#2563EB", "#34D399", "#F87171"
        ],
      },
    ],
  };

  // Trend Line: Sales Orders Value over time
  const lineOrders = {
    labels: timeLabels,
    datasets: [
      {
        label: "Sales Orders Value (ZAR)",
        data: ordersByTime.values,
        fill: true,
        borderColor: "#2563EB",
        backgroundColor: "rgba(37,99,235,0.07)",
        tension: 0.3,
      },
    ],
  };

  // --------- COLOR/STYLE VARS ---------
  const cardClass = "rounded-xl shadow-lg bg-gradient-to-br from-white via-gray-50 to-emerald-50 px-6 py-4 flex flex-col justify-between";
  const labelClass = "text-xs uppercase tracking-wider text-gray-600";
  const valClass = "text-3xl font-bold text-emerald-700";
  const sectionTitle = "font-bold text-lg text-blue-900 mb-1";
  const smallText = "text-xs text-gray-500 mt-1";

  // --------- UI ---------
  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-tr from-emerald-50 via-blue-50 to-yellow-50">
      {/* Banner */}
      <HomeBanner
        title="Business Intelligence Dashboard"
        description="Get a complete, real-time picture of your business performance. All your orders, quotes, sales reps and line-of-work breakdowns in one visually powerful display."
        className="mb-8"
      />

      {/* Filters */}
      <motion.div
        className="flex items-center flex-wrap gap-4 mb-5 px-10"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="w-32">
          <Select value={period} onValueChange={v => {
            setPeriod(v as Period);
            setRange(getPeriodRange(v as Period));
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(p => (
                <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[260px]">
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
        <div className="w-56">
          <Select value={salesRep} onValueChange={setSalesRep}>
            <SelectTrigger>
              <SelectValue placeholder="All Sales Reps" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sales Reps</SelectItem>
              {repOptions.map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin w-10 h-10 text-emerald-600" />
        </div>
      )}

      {/* MAIN VISUAL GRID */}
      {!loading && (
        <motion.div
          className="grid grid-cols-12 gap-6 px-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
        >
          {/* SUMMARY CARDS */}
          <div className="col-span-3 flex flex-col gap-4">
            <motion.div className={cardClass} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <span className={labelClass}>Quotations Value</span>
              <span className={valClass}>
                <CountUp
                  end={quotationsValue}
                  duration={3}
                  decimals={2}
                  separator=","
                  prefix="R "
                  formattingFn={v => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 2 }).format(Number(v))}
                />
              </span>
              <span className={smallText}>Total for period</span>
            </motion.div>
            <motion.div className={cardClass} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <span className={labelClass}>Sales Orders Value</span>
              <span className={valClass}>
                <CountUp
                  end={ordersValue}
                  duration={3}
                  decimals={2}
                  separator=","
                  prefix="R "
                  formattingFn={v => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 2 }).format(Number(v))}
                />
              </span>
              <span className={smallText}>Total for period</span>
            </motion.div>
            <motion.div className={cardClass + " bg-gradient-to-tr from-blue-100 to-emerald-100"} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <span className={labelClass}>Conversion % (Orders/Quotes)</span>
              <span className={valClass}>
                <CountUp end={convPercentValue} decimals={1} suffix="%" duration={2} />
              </span>
              <span className={smallText}>By value</span>
            </motion.div>
            <motion.div className={cardClass + " bg-gradient-to-tr from-emerald-100 to-yellow-100"} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <span className={labelClass}>Top Sales Rep</span>
              <span className="text-xl font-semibold text-blue-900">{topRep}</span>
              <span className={smallText}>By order value</span>
            </motion.div>
          </div>
          {/* CHARTS */}
          <div className="col-span-9 grid grid-cols-3 gap-6">
            {/* Orders Over Time (Line) */}
            <div className="rounded-2xl shadow bg-white p-4 col-span-3">
              <h2 className={sectionTitle}>Sales Orders Value Over Time</h2>
              <Line
                data={lineOrders}
                height={80}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
            {/* Bar: Rep performance */}
            <div className="rounded-2xl shadow bg-white p-4 col-span-2">
              <h2 className={sectionTitle}>Performance by Sales Rep</h2>
              <Bar
                data={barByRep}
                height={90}
                options={{
                  responsive: true,
                  plugins: { legend: { position: "top" } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
            {/* Pie: Line-of-Work Distribution */}
            <div className="rounded-2xl shadow bg-white p-4 col-span-1 flex flex-col items-center justify-center">
              <h2 className={sectionTitle}>Orders by Line of Work</h2>
              <Pie
                data={pieOrdersByLW}
                width={140}
                height={140}
                options={{ plugins: { legend: { position: "right" } } }}
              />
              <span className={smallText}>Share of each segment</span>
            </div>
            {/* Pie: Quotes by Line-of-Work */}
            <div className="rounded-2xl shadow bg-white p-4 col-span-1 flex flex-col items-center justify-center">
              <h2 className={sectionTitle}>Quotes by Line of Work</h2>
              <Pie
                data={pieQuotesByLW}
                width={140}
                height={140}
                options={{ plugins: { legend: { position: "right" } } }}
              />
              <span className={smallText}>Share of each segment</span>
            </div>
            {/* Insights */}
            <div className="rounded-2xl shadow bg-white p-4 col-span-2 flex flex-col">
              <h2 className={sectionTitle}>Key Insights</h2>
              <ul className="text-gray-700 leading-tight">
                <li>
                  <b>{topRep}</b> leads in order value this period.
                </li>
                <li>
                  Conversion by value: <b>{convPercentValue.toFixed(1)}%</b> | by count: <b>{convPercentCount.toFixed(1)}%</b>
                </li>
                <li>
                  Top line-of-work: <b>
                    {lwLabels[lwOrderVals.indexOf(Math.max(...lwOrderVals))] || "N/A"}
                  </b>
                </li>
                <li>
                  Total quotations sent: <b>{quotationsCount}</b>
                  , Orders received: <b>{ordersCount}</b>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
