"use client"

import OrderStatus from "./OrderStatus"

interface PersonData {
  name: string
  orders: number
  quotesSent: number
}

const dummyTableData: PersonData[] = [
  { name: "Clare", orders: 0, quotesSent: 5 },
  { name: "Richard", orders: 3, quotesSent: 10 },
  { name: "Shaun", orders: 0, quotesSent: 4 },
  { name: "Candice", orders: 5, quotesSent: 8 },
]

export default function OrdersTable() {
  // In a real app, you might use state and tabs to toggle between monthly, quarterly, annually.
  return (
    <div className="overflow-x-auto bg-white shadow rounded p-4 mb-6">
      <table className="w-full">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Person</th>
            <th className="px-4 py-2 text-left">Orders Received</th>
            <th className="px-4 py-2 text-left">Quotes Sent</th>
          </tr>
        </thead>
        <tbody>
          {dummyTableData.map((row) => (
            <tr key={row.name} className="border-t">
              <td className="px-4 py-2">{row.name}</td>
              <td className="px-4 py-2">
                <OrderStatus orders={row.orders} />
              </td>
              <td className="px-4 py-2">{row.quotesSent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
