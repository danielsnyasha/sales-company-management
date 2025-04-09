"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface SalesData {
  id: number
  customer: string
  quote: number
  order: number
  date: string
}

const MOCK_DATA: SalesData[] = [
  { id: 1, customer: "ABC Fabrication", quote: 25000, order: 10000, date: "2025-04-01" },
  { id: 2, customer: "XYZ Motors", quote: 44000, order: 31000, date: "2025-04-02" },
  { id: 3, customer: "Steel Co", quote: 12000, order: 5000, date: "2025-04-02" },
  // Add more as needed
]

export default function DataTableDemo() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Quote</TableHead>
          <TableHead>Order</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {MOCK_DATA.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.id}</TableCell>
            <TableCell>{row.customer}</TableCell>
            <TableCell>{row.quote}</TableCell>
            <TableCell>{row.order}</TableCell>
            <TableCell>{row.date}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
