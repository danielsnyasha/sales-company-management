"use client"

import { dummyDailyRecords, DailyRecord } from "./dummyData"

interface DailyDataTableProps {
  date: string;
}

export default function DailyDataTable({ date }: DailyDataTableProps) {
  const records: DailyRecord[] = dummyDailyRecords[date] || []

  return (
    <div className="overflow-hidden bg-white shadow rounded p-4">
      <h2 className="text-xl font-bold mb-4">Daily Summary for {date}</h2>
      {records.length === 0 ? (
        <p className="text-gray-500">No data available for this date.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Order Number</th>
              <th className="px-4 py-2 text-left">Notes</th>
              <th className="px-4 py-2 text-left">Total Orders</th>
              <th className="px-4 py-2 text-left">Quotes Sent</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2">{record.orderNumber}</td>
                <td className="px-4 py-2 text-sm">{record.notes}</td>
                <td className="px-4 py-2">{record.totalOrders}</td>
                <td className="px-4 py-2">{record.quotesSent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
