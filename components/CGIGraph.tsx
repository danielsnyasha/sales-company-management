"use client"

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
import { dailyData } from "./dummyData"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// For demo purposes, we use the first day’s data.
const dayData = dailyData[0]

const labels = dayData.persons.map((p) => p.name)
const ordersDataset = dayData.persons.map((p) => p.orders)
const quotesReceivedDataset = dayData.persons.map((p) => p.quotesReceived)
const quotesSentDataset = dayData.persons.map((p) => p.quotesSent)

const data = {
  labels,
  datasets: [
    {
      label: "Orders",
      data: ordersDataset,
      backgroundColor: "rgba(75, 192, 192, 0.5)",
    },
    {
      label: "Quotes Received",
      data: quotesReceivedDataset,
      backgroundColor: "rgba(153, 102, 255, 0.5)",
    },
    {
      label: "Quotes Sent",
      data: quotesSentDataset,
      backgroundColor: "rgba(255, 159, 64, 0.5)",
    },
  ],
}

const options = {
  responsive: true,
  plugins: {
    legend: { position: "top" as const },
    title: { display: true, text: "Customer Sales Interactions (Daily)" },
  },
}

export default function CGIGraph() {
  return (
    <div className="bg-white shadow rounded p-4 mb-6">
      <Bar data={data} options={options} />
    </div>
  )
}
