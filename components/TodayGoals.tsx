"use client"

import { dailyData } from "./dummyData"

export default function TodayGoals() {
  const today = dailyData[0]
  return (
    <section className="bg-white shadow rounded p-4 mb-6">
      <h2 className="text-xl font-bold mb-2">Today's Goals</h2>
      <ul className="list-disc ml-4">
        {today.persons.map((p) => (
          <li key={p.name}>
            <strong>{p.name}:</strong> {p.todayGoals}
          </li>
        ))}
      </ul>
    </section>
  )
}
