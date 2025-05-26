"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

import { Label } from "@/components/ui/label"
import { MoreHorizontal } from "lucide-react"

// ----- CONSTANTS -----
const LINE_OF_WORK_OPTIONS = [
  { label: "Electro Motors", value: "EC" },
  { label: "Steel Service Center", value: "SSC" },
  { label: "Structural Mechanical And Plate", value: "SMP" },
  { label: "Original Equipment Manufacture", value: "OEM" },
  { label: "Other", value: "Unknown" },
]

// ----- Type Definitions -----
interface Event {
  id: string
  eventType: "CGI" | "QUOTE" | "ORDER"
  referenceCode: string
  date: string
  quoteReceivedAt?: string | null
  csiConvertedAt?: string | null
  jobCompletedAt?: string | null
  natureOfWork?: string[] | null
  actualWorkDescription?: string | null
  processCost?: number | null
  contactPerson?: string | null
  phone?: string | null
  status: string
  notes?: string | null
  leadTime?: number | null
  companyName?: string
  customerName: string
  productName?: string | null
  quantity?: number | null
  price?: number | null
  deliveryDate?: string | null
  region?: string | null
  salesRepresentative?: string | null
  priority?: string | null
  paymentStatus?: string | null
  shippingMethod?: string | null
  internalNotes?: string | null
  isPriorityCustomer?: boolean | null
  poNumber?: string | null
  customerQuoteNumber?: string | null
  quoteNumber: string
  quoteReceived: boolean
  quoteSent: boolean
  poReceived: boolean
  createdAt: string
  updatedAt: string
  lineOfWork?: string | null
}

const PAGE_SIZE = 15
function truncateStatus(s: string) {
  return s.length > 11 ? s.substring(0, 11) + "..." : s
}

export default function EventsPage() {
  const router = useRouter()

  // Data / pagination
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE })

  // Filters
  const [customerFilter, setCustomerFilter] = useState("")
  const [quoteNumberFilter, setQuoteNumberFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedFilterDate, setSelectedFilterDate] = useState<Date | null>(null)

  // Dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [pinInput, setPinInput] = useState("")

  // Edit wizard
  const [editStep, setEditStep] = useState(1)
  const [editForm, setEditForm] = useState<Partial<Event>>({})

  // ---------- Fetch Events ----------
  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      try {
        const res = await fetch("/api/events")
        if (!res.ok) throw new Error("Failed to fetch events")
        const data: Event[] = await res.json()
        setEvents(data)
      } catch (err: any) {
        setError(err.message || "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  // ---------- Filtering ----------
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      const customerMatches = customerFilter.trim()
        ? (evt.customerName ?? "").toLowerCase().includes(customerFilter.toLowerCase())
        : true
      const quoteMatches = quoteNumberFilter.trim()
        ? (evt.quoteNumber || "").toLowerCase().includes(quoteNumberFilter.toLowerCase())
        : true
      const statusMatches = statusFilter.trim()
        ? evt.status.toLowerCase().includes(statusFilter.toLowerCase())
        : true
      const dateMatches = selectedFilterDate
        ? new Date(evt.date).toDateString() === selectedFilterDate.toDateString()
        : true
      return customerMatches && quoteMatches && statusMatches && dateMatches
    })
  }, [events, customerFilter, quoteNumberFilter, statusFilter, selectedFilterDate])

  // ---------- Table Columns ----------
  const columns = useMemo<ColumnDef<Event>[]>(() => [
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "quoteNumber", header: "Quote Number", cell: ({ getValue }) => getValue() || "-" },
    { accessorKey: "salesRepresentative", header: "Sales Rep", cell: ({ getValue }) => getValue() || "-" },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => truncateStatus(getValue() as string) },
    { accessorKey: "date", header: "Date", cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString() },
    { accessorKey: "poNumber", header: "PO Number", cell: ({ getValue }) => getValue() || "-" },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ getValue }) => {
        const p = getValue() as number
        return p ? `R${p.toFixed(2)}` : "-"
      },
    },
    { accessorKey: "priority", header: "Priority", cell: ({ getValue }) => getValue() || "-" },
    { accessorKey: "lineOfWork", header: "Line of Work", cell: ({ getValue }) => getValue() || "-" },
    {
      id: "quoteSentIndicator",
      header: "Quote Sent",
      cell: ({ row }) => (row.original.quoteSent ? <span className="text-green-600">✔️</span> : <span className="text-red-600">❌</span>),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const evt = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                setSelectedEvent(evt);
                setTimeout(() => setViewDialogOpen(true), 10);
              }}>
                View <DropdownMenuShortcut>⇧V</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSelectedEvent(evt);
                setEditForm({ ...evt });
                setEditStep(1);
                setTimeout(() => setEditDialogOpen(true), 10);
              }}>
                Edit <DropdownMenuShortcut>⇧E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSelectedEvent(evt);
                setTimeout(() => setDeleteDialogOpen(true), 10);
              }}>
                Delete <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [])

  // ---------- React-Table ----------
  const table = useReactTable({
    data: filteredEvents,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  })

  // ---------- Delete ----------
  async function handleDelete() {
    if (!selectedEvent) return
    if (pinInput.trim() !== "113010") {
      toast.error("Invalid PIN!")
      return
    }
    try {
      const res = await fetch(`/api/events?id=${selectedEvent.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete event")
      }
      setEvents(prev => prev.filter(evt => evt.id !== selectedEvent.id))
      toast.success("Event deleted successfully!")
    } catch (err: any) {
      toast.error(err.message || "Error deleting event.")
    } finally {
      setSelectedEvent(null)
      setPinInput("")
      setDeleteDialogOpen(false)
    }
  }

  // ---------- Update ----------
  async function handleUpdate() {
    if (!selectedEvent) return;
    const currentPage = pagination.pageIndex;
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedEvent.id, data: editForm }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update event");
      }
      const updated = await res.json();
      setEvents(prev => prev.map(evt => (evt.id === selectedEvent.id ? updated : evt)));

      setEditDialogOpen(false);
      setSelectedEvent(null);
      setEditStep(1);
      setPagination(prev => ({ ...prev, pageIndex: currentPage }));

      toast.success("Event updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Error updating event.");
    }
  }

  // ---------- Edit Steps ----------
  const renderEditStep = () => {
    if (editStep === 1) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Basic Information</h3>
          <div className="grid grid-cols-2 gap-6">
            {/* existing fields */}
            <div>
              <Label>Company Name</Label>
              <Input
                value={editForm.companyName || ""}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, companyName: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Customer Name</Label>
              <Input
                value={editForm.customerName || ""}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, customerName: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Event Type</Label>
              <Input
                value={editForm.eventType || ""}
                onChange={(e) =>
                  setEditForm(prev => ({
                    ...prev,
                    eventType: e.target.value as "CGI" | "QUOTE" | "ORDER",
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Date</Label>
              <DatePicker
                selected={editForm.date ? new Date(editForm.date) : new Date()}
                onChange={(date: Date | null) =>
                  setEditForm(prev => ({
                    ...prev,
                    date: date ? date.toISOString() : "",
                  }))
                }
                dateFormat="yyyy-MM-dd"
                className="mt-1 w-full border rounded p-2"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Input
                value={editForm.status || ""}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, status: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={editForm.priority || ""}
                onValueChange={(val) =>
                  setEditForm(prev => ({ ...prev, priority: val }))
                }
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Status</Label>
              <Input
                value={editForm.paymentStatus || ""}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, paymentStatus: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Sales Representative</Label>
              <Input
                value={editForm.salesRepresentative || ""}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, salesRepresentative: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Line of Work</Label>
              <Select
                value={editForm.lineOfWork || ""}
                onValueChange={(val) =>
                  setEditForm(prev => ({ ...prev, lineOfWork: val }))
                }
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {LINE_OF_WORK_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setEditStep(2)}>Next</Button>
          </div>
        </div>
      )
    } else if (editStep === 2) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Contact &amp; Financial</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label>Contact Person</Label>
              <Input
                value={editForm.contactPerson || ""}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, contactPerson: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={editForm.phone || ""}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, phone: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Process Cost (ZAR)</Label>
              <Input
                type="number"
                value={editForm.processCost ?? ""}
                onChange={(e) =>
                  setEditForm(prev => ({
                    ...prev,
                    processCost: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={editForm.quantity ?? ""}
                onChange={(e) =>
                  setEditForm(prev => ({
                    ...prev,
                    quantity: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Price (ZAR)</Label>
              <Input
                type="number"
                value={editForm.price ?? ""}
                onChange={(e) =>
                  setEditForm(prev => ({
                    ...prev,
                    price: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Quote Number</Label>
              <Input
                value={editForm.quoteNumber || ""}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, quoteNumber: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Input
                value={editForm.notes || ""}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, notes: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Internal Notes</Label>
              <Input
                value={editForm.internalNotes || ""}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, internalNotes: e.target.value }))
                }
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setEditStep(1)}>
              Back
            </Button>
            <Button onClick={() => setEditStep(3)}>Next</Button>
          </div>
        </div>
      )
    } else if (editStep === 3) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Additional Details</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label>Delivery Date &amp; Time</Label>
              <DatePicker
                selected={editForm.deliveryDate ? new Date(editForm.deliveryDate) : null}
                onChange={(date: Date | null) =>
                  setEditForm(prev => ({
                    ...prev,
                    deliveryDate: date ? date.toISOString() : null,
                  }))
                }
                showTimeSelect
                dateFormat="Pp"
                className="mt-1 w-full border rounded p-2"
              />
            </div>
            <div>
              <Label>Quote Received At</Label>
              <DatePicker
                selected={editForm.quoteReceivedAt ? new Date(editForm.quoteReceivedAt) : null}
                onChange={(date: Date | null) =>
                  setEditForm(prev => ({
                    ...prev,
                    quoteReceivedAt: date ? date.toISOString() : null,
                  }))
                }
                showTimeSelect
                dateFormat="Pp"
                className="mt-1 w-full border rounded p-2"
              />
            </div>
            <div>
              <Label>CSI Converted At</Label>
              <DatePicker
                selected={editForm.csiConvertedAt ? new Date(editForm.csiConvertedAt) : null}
                onChange={(date: Date | null) =>
                  setEditForm(prev => ({
                    ...prev,
                    csiConvertedAt: date ? date.toISOString() : null,
                  }))
                }
                showTimeSelect
                dateFormat="Pp"
                className="mt-1 w-full border rounded p-2"
              />
            </div>
            <div>
              <Label>Job Completed At</Label>
              <DatePicker
                selected={editForm.jobCompletedAt ? new Date(editForm.jobCompletedAt) : null}
                onChange={(date: Date | null) =>
                  setEditForm(prev => ({
                    ...prev,
                    jobCompletedAt: date ? date.toISOString() : null,
                  }))
                }
                showTimeSelect
                dateFormat="Pp"
                className="mt-1 w-full border rounded p-2"
                disabled={!editForm.poReceived}
              />
            </div>
            <div>
              <Label>Lead Time (days)</Label>
              <Input
                type="number"
                value={editForm.leadTime ?? ""}
                onChange={(e) =>
                  setEditForm(prev => ({
                    ...prev,
                    leadTime: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Sales Order Number</Label>
              <Input
                value={editForm.poNumber || ""}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, poNumber: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Customer Quote Ref</Label>
              <Input
                value={editForm.customerQuoteNumber || ""}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, customerQuoteNumber: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Nature of Work</Label>
              <Input
                value={(editForm.natureOfWork || []).join(", ")}
                onChange={(e) =>
                  setEditForm(prev => ({
                    ...prev,
                    natureOfWork: e.target.value.split(",").map(s => s.trim()),
                  }))
                }
                placeholder="e.g. Fabrication, Production Line"
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Actual Work Description</Label>
              <Input
                value={editForm.actualWorkDescription || ""}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, actualWorkDescription: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Region</Label>
              <Input
                value={editForm.region || ""}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, region: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Shipping Method</Label>
              <Input
                value={editForm.shippingMethod || ""}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, shippingMethod: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            {/* checkboxes */}
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(editForm.quoteSent)}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, quoteSent: e.target.checked }))
                }
              />
              <Label>Quote Sent</Label>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(editForm.quoteReceived)}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, quoteReceived: e.target.checked }))
                }
              />
              <Label>Quote Received</Label>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(editForm.poReceived)}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, poReceived: e.target.checked }))
                }
              />
              <Label>Sales Order Received</Label>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(editForm.isPriorityCustomer)}
                onChange={(e) =>
                  setEditForm(prev => ({ ...prev, isPriorityCustomer: e.target.checked }))
                }
              />
              <Label>Is Priority Customer?</Label>
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setEditStep(editStep - 1)}>
              Back
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="p-6 space-y-6">
      <ToastContainer autoClose={4000} newestOnTop pauseOnHover />

      <h1 className="text-3xl font-bold mb-6">Events Management</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by Customer..."
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="max-w-sm"
        />
        <Input
          placeholder="Search by Quote Number..."
          value={quoteNumberFilter}
          onChange={(e) => setQuoteNumberFilter(e.target.value)}
          className="max-w-sm"
        />
        <Input
          placeholder="Search by Status..."
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="max-w-sm">
          <DatePicker
            selected={selectedFilterDate}
            onChange={(date: Date | null) => setSelectedFilterDate(date)}
            dateFormat="yyyy-MM-dd"
            placeholderText="Filter by Date"
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>
      </div>

      {error && <p className="text-red-500">Error: {error}</p>}
      {loading ? (
        <p>Loading events...</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center h-24">
                    No events found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Event</DialogTitle>
            <DialogDescription>
              Details for event: {selectedEvent?.referenceCode}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 mt-4 text-sm">
              <p><strong>Customer:</strong> {selectedEvent.customerName}</p>
              <p><strong>Quote Number:</strong> {selectedEvent.quoteNumber || "-"}</p>
              <p><strong>Status:</strong> {selectedEvent.status}</p>
              <p><strong>Date:</strong> {new Date(selectedEvent.date).toLocaleString()}</p>
              <p><strong>Sales Representative:</strong> {selectedEvent.salesRepresentative || "-"}</p>
              <p><strong>Contact:</strong> {selectedEvent.contactPerson}</p>
              <p><strong>Phone:</strong> {selectedEvent.phone}</p>
              <p><strong>Sales Order Number:</strong> {selectedEvent.poNumber || "-"}</p>
              <p><strong>Price:</strong> {selectedEvent.price ? `R${selectedEvent.price.toFixed(2)}` : "-"}</p>
              <p><strong>Priority:</strong> {selectedEvent.priority || "-"}</p>
              <p><strong>Line of Work:</strong> {selectedEvent.lineOfWork || "-"}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={() => {
          setEditDialogOpen(false)
          setEditStep(1)
        }}
      >
        <DialogContent className="min-w-[800px] p-0">
          <DialogHeader className="bg-gray-100 p-4">
            <DialogTitle>Edit Event ({selectedEvent?.referenceCode})</DialogTitle>
            <DialogDescription>
              Use the steps below to update all event fields.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">{renderEditStep()}</div>
          <DialogFooter className="p-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Please enter PIN (113010) to delete this event.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <Input
              placeholder="Enter PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
