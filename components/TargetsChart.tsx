"use client"

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
import { aprilTargets } from "./dummyData"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function TargetsChart() {
  const labels = Object.keys(aprilTargets)
  const dataVals = Object.values(aprilTargets)

  const data = {
    labels,
    datasets: [
      {
        label: "April Target (ZAR)",
        data: dataVals,
        backgroundColor: "rgba(54, 162, 235, 0.7)", // Adjust to your brand color
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "April Targets" },
    },
  }

  return (
    <div className="bg-white shadow rounded p-4 h-full">
      <h2 className="text-xl font-bold mb-2">Targets (April)</h2>
      <Bar data={data} options={options} />
    </div>
  )
}
