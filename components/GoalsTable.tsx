"use client"

import { goalsData } from "./dummyData"

export default function GoalsTable() {
  return (
    <div className="bg-white shadow rounded p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Today's Goals</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Goals */}
        <div className="p-4 border rounded shadow-sm">
          <h3 className="font-semibold text-xl mb-4">Team Goals</h3>
          <ul className="list-disc list-inside space-y-2">
            {goalsData.teamGoals.map((goal, idx) => (
              <li key={idx} className="text-gray-700 text-base">
                {goal}
              </li>
            ))}
          </ul>
        </div>

        {/* Individual Goals */}
        <div className="p-4 border rounded shadow-sm">
          <h3 className="font-semibold text-xl mb-4">Individual Goals</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-base">Name</th>
                <th className="pb-2 text-base">Goal</th>
              </tr>
            </thead>
            <tbody>
              {goalsData.individualGoals.map((item, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="py-2 text-gray-800 font-medium">{item.name}</td>
                  <td className="py-2 text-gray-700">{item.goal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
