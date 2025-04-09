"use client"

import { weeklyLeaderboard } from "./dummyData"

export default function Leaderboard() {
  // For simplicity, we use the first week’s data
  const weekData = weeklyLeaderboard[0]
  // Determine the leader (highest orders)
  const leader = weekData.persons.reduce((prev, curr) =>
    curr.totalOrders > prev.totalOrders ? curr : prev
  )

  return (
    <section className="bg-white shadow rounded p-4 mb-6">
      <h2 className="text-xl font-bold mb-2">
        Weekly Leaderboard - {weekData.week}
      </h2>
      <ul>
        {weekData.persons.map((person) => (
          <li
            key={person.name}
            className={`p-2 ${person.name === leader.name ? "bg-green-100" : ""}`}
          >
            {person.name}: {person.totalOrders} orders
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm">
        Leader of the week: <span className="font-bold">{leader.name}</span>
      </p>
    </section>
  )
}
