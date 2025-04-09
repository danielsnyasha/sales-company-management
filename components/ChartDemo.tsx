"use client"

import { useEffect, useRef } from "react"

// Example using Chart.js (react-chartjs-2) or directly Chart.js
// yarn add chart.js react-chartjs-2
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Bar } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const data = {
  labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
  datasets: [
    {
      label: "Orders",
      data: [10, 15, 25, 40],
      backgroundColor: "rgba(54, 162, 235, 0.5)",
    },
    {
      label: "Quotes",
      data: [20, 22, 35, 50],
      backgroundColor: "rgba(255, 99, 132, 0.5)",
    },
  ],
}

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "April Sales Activity",
    },
  },
}

export default function ChartDemo() {
  return (
    <div className="bg-white shadow rounded p-4 w-full md:w-2/3">
      <Bar data={data} options={options} />
    </div>
  )
}
