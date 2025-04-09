// app/components/BelowDataTable.tsx (or wherever you place server components)
// No "use client" at the top—this is a server component by default

import { PrismaClient } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Create a single PrismaClient instance at the top level
// or in a separate "lib/prisma.ts" file
const prisma = new PrismaClient()

export default async function BelowDataTable() {
  // 1. Fetch data from the DB
  const orders = await prisma.order.findMany()

  // 2. Render table with real DB data
  return (
    <div className="bg-white shadow rounded p-4">
      <h2 className="text-xl font-bold mb-2">Orders / Quotes</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount (ZAR)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.orderNumber}</TableCell>
              <TableCell>{item.client}</TableCell>
              <TableCell>{item.status}</TableCell>
              <TableCell>{item.amount?.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
