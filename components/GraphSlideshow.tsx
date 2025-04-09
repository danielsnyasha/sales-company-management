"use client"

import { useState, useEffect } from "react"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

type Period = "day" | "week" | "month" | "quarter" | "year"

interface GraphDataItem {
  name: string
  CSI: number
  POsReceived: number
  QuotesSent: number
}

export default function GraphSlideshowLive() {
  // Use today's date as reference.
  const today = new Date()
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("day")
  const [graphData, setGraphData] = useState<GraphDataItem[]>([])
  const [currentGraphIndex, setCurrentGraphIndex] = useState(0)

  // Define team members (if a rep doesn't have data, they'll show with zero counts, replaced by 1)
  const teamMembers = ["Shaun", "Richard", "Clare", "Candice"]

  // Helper: determine if a given date falls in the same period as the reference date.
  function isSamePeriod(eventDate: Date, refDate: Date, period: Period): boolean {
    switch (period) {
      case "day":
        return (
          eventDate.getFullYear() === refDate.getFullYear() &&
          eventDate.getMonth() === refDate.getMonth() &&
          eventDate.getDate() === refDate.getDate()
        )
      case "week": {
        // Assume week starts on Sunday
        const startOfWeek = new Date(refDate)
        startOfWeek.setDate(refDate.getDate() - refDate.getDay())
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        return eventDate >= startOfWeek && eventDate <= endOfWeek
      }
      case "month":
        return (
          eventDate.getFullYear() === refDate.getFullYear() &&
          eventDate.getMonth() === refDate.getMonth()
        )
      case "quarter": {
        const quarter = Math.floor(refDate.getMonth() / 3)
        const eventQuarter = Math.floor(eventDate.getMonth() / 3)
        return (
          eventDate.getFullYear() === refDate.getFullYear() &&
          eventQuarter === quarter
        )
      }
      case "year":
        return eventDate.getFullYear() === refDate.getFullYear()
      default:
        return false
    }
  }

  // Fetch and aggregate data.
  useEffect(() => {
    async function fetchAndAggregate() {
      try {
        const res = await fetch("/api/teamRows")
        if (!res.ok) {
          throw new Error(`Failed to fetch data: ${res.status}`)
        }
        const allEvents = await res.json() // assume array of events
        // Filter events that fall within the selected period (using today's date as reference)
        const refDate = today
        const filtered = allEvents.filter((evt: any) => {
          const eventDate = new Date(evt.date)
          return isSamePeriod(eventDate, refDate, selectedPeriod)
        })

        // Group by salesRepresentative (or team member)
        const grouped: Record<string, any[]> = {}
        teamMembers.forEach(member => (grouped[member] = []))
        filtered.forEach((evt: any) => {
          const rep = evt.salesRepresentative || "Unknown"
          if (grouped[rep]) {
            grouped[rep].push(evt)
          }
        })

        // Aggregate counts per team member.
        const aggregated: GraphDataItem[] = teamMembers.map(member => {
          const events = grouped[member] || []
          const CSI = events.length
          const POsReceived = events.filter((e) => e.poReceived === true).length
          const QuotesSent = events.filter((e) => e.quoteSent === true).length
          return {
            name: member,
            CSI: CSI === 0 ? 1 : CSI,
            POsReceived: POsReceived === 0 ? 1 : POsReceived,
            QuotesSent: QuotesSent === 0 ? 1 : QuotesSent,
          }
        })
        setGraphData(aggregated)
      } catch (error) {
        console.error(error)
      }
    }
    fetchAndAggregate()
  }, [selectedPeriod, today])

  // Build base chart configuration.
  const chartData = {
    labels: graphData.map(item => item.name),
    datasets: [
      {
        label: "CSI",
        data: graphData.map(item => item.CSI),
        backgroundColor: "rgba(128, 0, 128, 0.7)", // purple
      },
      {
        label: "POs Received",
        data: graphData.map(item => item.POsReceived),
        backgroundColor: "rgba(54, 162, 235, 0.7)", // blue-ish
      },
      {
        label: "Quotes Sent",
        data: graphData.map(item => item.QuotesSent),
        backgroundColor: "rgba(75, 192, 192, 0.7)", // green-ish
      },
    ],
  }

  // Chart options with animation.
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: "easeOutQuart",
    },
    plugins: {
      legend: { position: "top" as const },
      title: {
        display: true,
        text: `Sales Data (${selectedPeriod.toUpperCase()})`,
      },
    },
  }

  // Cycle through 3 configurations to simulate motion.
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGraphIndex(prev => (prev + 1) % 3)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  // Modify chartData slightly based on currentGraphIndex (for a subtle animated effect).
  let animatedChartData = { ...chartData }
  if (currentGraphIndex === 1) {
    animatedChartData.datasets = animatedChartData.datasets.map((ds, idx) => {
      // Animate only the CSI dataset as an example.
      if (idx === 0) {
        return { ...ds, data: chartData.datasets[0].data.map((val: number) => val * 1.1) }
      }
      return ds
    })
  } else if (currentGraphIndex === 2) {
    animatedChartData.datasets = animatedChartData.datasets.map((ds, idx) => {
      if (idx === 0) {
        return { ...ds, data: chartData.datasets[0].data.map((val: number) => val * 0.9) }
      }
      return ds
    })
  }

  // Reset animation when period changes.
  useEffect(() => {
    setCurrentGraphIndex(0)
  }, [selectedPeriod])

  return (
    <div className="bg-white shadow rounded p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Sales Graphs</h2>
        <Select
          value={selectedPeriod}
          onValueChange={(val) => setSelectedPeriod(val as Period)}
        >
          <SelectTrigger className="border rounded px-2 py-1">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {["day", "week", "month", "quarter", "year"].map(p => (
              <SelectItem key={p} value={p}>
                {p.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 relative">
        <Bar data={animatedChartData} options={options} className="absolute inset-0" />
      </div>
    </div>
  )
}
