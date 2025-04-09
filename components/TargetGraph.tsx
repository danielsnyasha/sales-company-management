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
import { monthlyTargets } from "./dummyData"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const labels = Object.keys(monthlyTargets)
const data = {
  labels,
  datasets: [
    {
      label: "Monthly Target",
      data: Object.values(monthlyTargets),
      backgroundColor: "rgba(54, 162, 235, 0.5)",
    },
  ],
}

const options = {
  responsive: true,
  plugins: {
    legend: { position: "top" as const },
    title: { display: true, text: "Monthly Targets" },
  },
}

export default function TargetGraph() {
  return (
    <div className="bg-white shadow rounded p-4 mb-6">
      <Bar data={data} options={options} />
    </div>
  )
}
