"use client"

import { useState, useEffect } from "react"
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
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, Edit3 } from "lucide-react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

// Define type for period selection.
type Period = "day" | "week" | "month" | "quarter" | "year"

export interface EventDoc {
  id: string
  salesRepresentative: string | null
  eventType: string
  customerName: string | null
  companyName: string | null
  contactPerson: string | null
  phone: string | null
  notes: string | null
  date: string
  status: string
  updatedAt: string
  price?: number | null
  leadTime?: number | null
  quoteSent?: boolean
  poReceived?: boolean
  orderNumber?: string | null      // for PO number
  quoteNumber?: string | null      // for Customer's quote reference
  quoteReceivedAt?: string | null
  jobCompletedAt?: string | null
  quantity?: number | null
  priority?: string | null
}

interface RepRow {
  id: number
  name: string
  csi: number
  ordersReceived: number
  quotesSent: number
  missing: string
  lastUpdate: string
  events: EventDoc[]
}

// Helper function to check if eventDate falls in the same period as refDate.
function isSamePeriod(eventDate: Date, refDate: Date, period: Period): boolean {
  switch (period) {
    case "day":
      return (
        eventDate.getFullYear() === refDate.getFullYear() &&
        eventDate.getMonth() === refDate.getMonth() &&
        eventDate.getDate() === refDate.getDate()
      )
    case "week": {
      // Assuming week starts on Sunday.
      const startOfWeek = new Date(refDate)
      startOfWeek.setDate(refDate.getDate() - refDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      return eventDate >= startOfWeek && eventDate <= endOfWeek
    }
    case "month":
      return (
        eventDate.getFullYear() === refDate.getFullYear() &&
        eventDate.getMonth() === refDate.getMonth()
      )
    case "quarter": {
      const quarter = Math.floor(refDate.getMonth() / 3)
      const eventQuarter = Math.floor(eventDate.getMonth() / 3)
      return (
        eventDate.getFullYear() === refDate.getFullYear() &&
        eventQuarter === quarter
      )
    }
    case "year":
      return eventDate.getFullYear() === refDate.getFullYear()
    default:
      return false
  }
}

export default function CgiTable() {
  // Default selected date to today's date in YYYY-MM-DD format.
  const today = new Date().toISOString().split("T")[0]
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("day")
  const [repRows, setRepRows] = useState<RepRow[]>([])
  const [selectedRow, setSelectedRow] = useState<RepRow | null>(null)
  const [rowDetailOpen, setRowDetailOpen] = useState(false)
  const [visibleEvents, setVisibleEvents] = useState(15)

  // Update dialog state & multi-step form.
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [updateStep, setUpdateStep] = useState(1)
  const [currentEvent, setCurrentEvent] = useState<EventDoc | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

  // Form data for update.
  const [formData, setFormData] = useState({
    quoteSent: "No",
    quoteNumber: "-",
    poReceived: "No",
    orderNumber: "-",
    deliveryDate: today, // date and time for delivery
    quoteReceivedAt: "",
    jobCompletedAt: "",
    contactPerson: "",
    phone: "",
    status: "Awaiting Feedback", // default option
    quantity: "",
    priority: "Low", // default option
    leadTime: ""
  })

  // Define team members so every rep always appears.
  const teamMembers = ["Shaun", "Richard", "Clare", "Candice"]

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/teamRows")
        if (!res.ok) {
          throw new Error(`Failed to fetch data: ${res.status}`)
        }
        const allEvents: EventDoc[] = await res.json()
        // Use the reference date from selectedDate.
        const refDate = new Date(selectedDate)
        // Filter events by checking if event date is in the selected period.
        const filtered = allEvents.filter(evt => {
          const eventDate = new Date(evt.date)
          return isSamePeriod(eventDate, refDate, selectedPeriod)
        })
        // Group events by salesRepresentative.
        const groupedMap: Record<string, EventDoc[]> = {}
        teamMembers.forEach(member => (groupedMap[member] = []))
        filtered.forEach(evt => {
          const rep = evt.salesRepresentative || "Unknown"
          if (groupedMap[rep]) {
            groupedMap[rep].push(evt)
          }
        })
        // Build a final array ensuring each team member appears.
        const finalRows: RepRow[] = teamMembers.map((member, index) => {
          const events = groupedMap[member] || []
          const totalCSI = events.length
          const totalPOsReceived = events.filter(e => e.poReceived === true).length
          const totalQuotesSent = events.filter(e => e.quoteSent === true).length
          let lastUpdate = ""
          if (events.length > 0) {
            const maxDate = events.reduce((acc, cur) =>
              new Date(cur.updatedAt) > new Date(acc.updatedAt) ? cur : acc
            )
            lastUpdate = maxDate.updatedAt
          }
          const missing = events.length === 0 ? `${member} 😢` : ""
          return {
            id: index + 1,
            name: member,
            csi: totalCSI,
            ordersReceived: totalPOsReceived,
            quotesSent: totalQuotesSent,
            missing,
            lastUpdate,
            events,
          }
        })
        setRepRows(finalRows)
      } catch (error) {
        console.error(error)
      }
    }
    fetchData()
  }, [selectedDate, selectedPeriod])

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSeeMore = () => {
    setVisibleEvents(prev => prev + 15)
  }

  // Save update: call backend API and update local state.
  const handleSaveUpdate = async () => {
    // Basic validation: require contact person and phone.
    if (!formData.contactPerson.trim() || !formData.phone.trim()) {
      setErrorMessage("Contact person and phone are required.")
      return
    }
    // If PO Received is "No", clear quoteReceivedAt and jobCompletedAt.
    if (formData.poReceived === "No") {
      formData.jobCompletedAt = ""
      formData.quoteReceivedAt = ""
    }
    setErrorMessage("")
    try {
      const res = await fetch("/api/updateEvent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentEvent?.id, data: formData })
      })
      if (!res.ok) {
        throw new Error("Failed to update event.")
      }
      const updatedEvent = await res.json()
      toast.success("Details successfully updated")
      // Update local current event with new values.
      setCurrentEvent(prev => ({ ...prev, ...updatedEvent }))
      setUpdateDialogOpen(false)
      // Optionally re-fetch data here to refresh table.
    } catch (error) {
      console.error(error)
      setErrorMessage("Update failed. Please try again.")
    }
  }

  return (
    <div className="w-full bg-white shadow-sm border border-gray-200 rounded p-4">
      <ToastContainer />
      {/* Header with Date Picker and Period Selector */}
      <div className="flex items-center justify-between mb-4">
        <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
          <DialogTrigger asChild>
            <button className="border border-gray-300 rounded px-3 py-1 bg-white text-gray-700 hover:bg-gray-100">
              Date: {selectedDate}
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-xs">
            <DialogHeader className="border-b pb-2">
              <DialogTitle className="text-lg font-semibold text-gray-800">
                Select a Date
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Pick a date to display data.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4">
              <DatePicker
                inline
                selected={new Date(selectedDate + "T00:00:00")}
                onChange={(date: Date | null) => {
                  if (date) {
                    const adjusted = new Date(
                      date.getTime() - date.getTimezoneOffset() * 60000
                    )
                    const iso = adjusted.toISOString().split("T")[0]
                    setSelectedDate(iso)
                    setCalendarOpen(false)
                  }
                }}
              />
              <button
                className="mt-4 border border-gray-300 rounded px-3 py-1 text-gray-700 hover:bg-gray-100"
                onClick={() => setCalendarOpen(false)}
              >
                Close
              </button>
            </div>
          </DialogContent>
        </Dialog>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 hover:bg-gray-100">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">DAY</SelectItem>
            <SelectItem value="week">WEEK</SelectItem>
            <SelectItem value="month">MONTH</SelectItem>
            <SelectItem value="quarter">QUARTER</SelectItem>
            <SelectItem value="year">YEAR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Table */}
      <Table className="w-full text-sm">
        <TableHeader>
          <TableRow className="bg-gray-50 border-b text-gray-700">
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>CSI</TableHead>
            <TableHead>POs Received</TableHead>
            <TableHead>Quotes Sent</TableHead>
            <TableHead>Missing</TableHead>
            <TableHead>Last Update</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {repRows.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => {
                setSelectedRow(row)
                setRowDetailOpen(true)
                setVisibleEvents(15)
              }}
              className="cursor-pointer hover:bg-gray-100"
            >
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.csi === 0 ? "😢" : row.csi}</TableCell>
              <TableCell>{row.ordersReceived}</TableCell>
              <TableCell>{row.quotesSent}</TableCell>
              <TableCell>{row.missing}</TableCell>
              <TableCell>
                {row.lastUpdate ? new Date(row.lastUpdate).toLocaleString() : ""}
              </TableCell>
              <TableCell>
                <button
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedRow(row)
                    setRowDetailOpen(true)
                    setVisibleEvents(15)
                  }}
                >
                  <Eye size={16} />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal for Selected User's Events */}
      {selectedRow && (
        <Dialog
          open={rowDetailOpen}
          onOpenChange={() => {
            setRowDetailOpen(false)
            setVisibleEvents(15)
          }}
        >
          <DialogContent className="max-w-4xl min-w-3xl w-full p-0 overflow-hidden">
            <DialogHeader className="border-b p-4">
              <DialogTitle className="text-lg font-semibold text-gray-800">
                Details for {selectedRow.name} ({selectedRow.csi} total events)
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Below are the events for {selectedRow.name} on {selectedDate} ({selectedPeriod.toUpperCase()}).
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 max-h-[70vh] overflow-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b text-gray-700">
                    <TableHead>Actions</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Quote Sent?</TableHead>
                    <TableHead>Quote Number</TableHead>
                    <TableHead>PO Received?</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Lead Time</TableHead>
                    <TableHead>Delivery Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedRow.events.slice(0, visibleEvents).map((evt, idx) => (
                    <TableRow key={evt.id + "-" + idx}>
                      <TableCell className="flex gap-2 items-center">
                        {/* Update Icon */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              className="inline-flex items-center gap-1 px-2 py-1 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCurrentEvent(evt)
                                setFormData({
                                  quoteSent: evt.quoteSent ? "Yes" : "No",
                                  quoteNumber: evt.quoteNumber || "-",
                                  poReceived: evt.poReceived ? "Yes" : "No",
                                  orderNumber: evt.orderNumber || "-",
                                  deliveryDate: evt.date ? new Date(evt.date).toISOString() : today,
                                  quoteReceivedAt: evt.quoteReceivedAt || "",
                                  jobCompletedAt: evt.jobCompletedAt || "",
                                  contactPerson: evt.contactPerson || "",
                                  phone: evt.phone || "",
                                  status: evt.status || "Awaiting Feedback",
                                  quantity: evt.quantity ? String(evt.quantity) : "",
                                  priority: evt.priority || "Low",
                                  leadTime: evt.leadTime ? String(evt.leadTime) : ""
                                })
                                setUpdateStep(1)
                                setUpdateDialogOpen(true)
                              }}
                            >
                              <Edit3 size={16} />
                            </button>
                          </DialogTrigger>
                          {/* Update Dialog */}
                          <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
                            <DialogContent className="min-w-[600px] p-0 overflow-hidden">
                              <DialogHeader className="border-b p-4">
                                <DialogTitle className="text-lg font-semibold text-gray-800">
                                  Update Event
                                </DialogTitle>
                              </DialogHeader>
                              {/* Progress Bar */}
                              <div className="w-full bg-gray-200 h-2 my-4 rounded">
                                <div
                                  className="h-2 bg-gray-500 rounded"
                                  style={{ width: `${(updateStep / 3) * 100}%` }}
                                ></div>
                              </div>
                              <div className="p-4 space-y-4">
                                {errorMessage && (
                                  <div className="text-red-600 text-sm">{errorMessage}</div>
                                )}
                                {updateStep === 1 && (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Quote Sent
                                      </label>
                                      <Select
                                        value={formData.quoteSent}
                                        onValueChange={(val) => handleFormChange("quoteSent", val)}
                                      >
                                        <SelectTrigger className="border rounded px-2 py-1 text-gray-700 w-full mt-1">
                                          <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Yes">Yes</SelectItem>
                                          <SelectItem value="No">No</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Quote Number
                                      </label>
                                      <input
                                        type="text"
                                        value={formData.quoteNumber}
                                        onChange={(e) => handleFormChange("quoteNumber", e.target.value)}
                                        className="border rounded px-2 py-1 w-full text-gray-700 mt-1"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        PO Received
                                      </label>
                                      <Select
                                        value={formData.poReceived}
                                        onValueChange={(val) => handleFormChange("poReceived", val)}
                                      >
                                        <SelectTrigger className="border rounded px-2 py-1 text-gray-700 w-full mt-1">
                                          <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Yes">Yes</SelectItem>
                                          <SelectItem value="No">No</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        PO Number
                                      </label>
                                      <input
                                        type="text"
                                        value={formData.orderNumber}
                                        onChange={(e) => handleFormChange("orderNumber", e.target.value)}
                                        className="border rounded px-2 py-1 w-full text-gray-700 mt-1"
                                      />
                                    </div>
                                    <div className="flex justify-end">
                                      <button
                                        className="bg-blue-600 text-white px-4 py-2 rounded"
                                        onClick={() => setUpdateStep(2)}
                                      >
                                        Next
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {updateStep === 2 && (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Delivery Date & Time
                                      </label>
                                      <DatePicker
                                        selected={formData.deliveryDate ? new Date(formData.deliveryDate) : new Date()}
                                        onChange={(date: Date | null) => {
                                          if (date) {
                                            handleFormChange("deliveryDate", date.toISOString())
                                          }
                                        }}
                                        showTimeSelect
                                        dateFormat="Pp"
                                        className="border rounded px-2 py-1 w-full text-gray-700 mt-1"
                                        withPortal
                                        popperPlacement="bottom-start"
                                        popperClassName="z-[9999]"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Quote Received At
                                      </label>
                                      <DatePicker
                                        selected={formData.quoteReceivedAt ? new Date(formData.quoteReceivedAt) : null}
                                        onChange={(date: Date | null) => {
                                          if (date) {
                                            handleFormChange("quoteReceivedAt", date.toISOString())
                                          }
                                        }}
                                        showTimeSelect
                                        dateFormat="Pp"
                                        className="border rounded px-2 py-1 w-full text-gray-700 mt-1"
                                        withPortal
                                        popperPlacement="bottom-start"
                                        popperClassName="z-[9999]"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Job Completed At
                                      </label>
                                      <DatePicker
                                        selected={formData.jobCompletedAt ? new Date(formData.jobCompletedAt) : null}
                                        onChange={(date: Date | null) => {
                                          if (date) {
                                            handleFormChange("jobCompletedAt", date.toISOString())
                                          }
                                        }}
                                        showTimeSelect
                                        dateFormat="Pp"
                                        className="border rounded px-2 py-1 w-full text-gray-700 mt-1"
                                        withPortal
                                        popperPlacement="bottom-start"
                                        popperClassName="z-[9999]"
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <button
                                        className="bg-blue-600 text-white px-4 py-2 rounded"
                                        onClick={() => setUpdateStep(3)}
                                      >
                                        Next
                                      </button>
                                      <button
                                        className="bg-gray-300 px-4 py-2 rounded"
                                        onClick={() => setUpdateStep(1)}
                                      >
                                        Back
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {updateStep === 3 && (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Contact Person
                                      </label>
                                      <input
                                        type="text"
                                        value={formData.contactPerson}
                                        onChange={(e) => handleFormChange("contactPerson", e.target.value)}
                                        className="border rounded px-2 py-1 w-full text-gray-700 mt-1"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Phone
                                      </label>
                                      <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => handleFormChange("phone", e.target.value)}
                                        className="border rounded px-2 py-1 w-full text-gray-700 mt-1"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Status
                                      </label>
                                      <Select
                                        value={formData.status}
                                        onValueChange={(val) => handleFormChange("status", val)}
                                      >
                                        <SelectTrigger className="border rounded px-2 py-1 text-gray-700 w-full mt-1">
                                          <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Awaiting Feedback">Awaiting Feedback</SelectItem>
                                          <SelectItem value="Meeting to be scheduled">Meeting to be scheduled</SelectItem>
                                          <SelectItem value="Active">Active</SelectItem>
                                          <SelectItem value="Completed">Completed</SelectItem>
                                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                                          <SelectItem value="On Hold">On Hold</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Quantity
                                      </label>
                                      <input
                                        type="number"
                                        value={formData.quantity}
                                        onChange={(e) => handleFormChange("quantity", e.target.value)}
                                        className="border rounded px-2 py-1 w-full text-gray-700 mt-1"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Priority
                                      </label>
                                      <Select
                                        value={formData.priority}
                                        onValueChange={(val) => handleFormChange("priority", val)}
                                      >
                                        <SelectTrigger className="border rounded px-2 py-1 text-gray-700 w-full mt-1">
                                          <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Low">Low</SelectItem>
                                          <SelectItem value="Medium">Medium</SelectItem>
                                          <SelectItem value="High">High</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Lead Time (days)
                                      </label>
                                      <input
                                        type="number"
                                        value={formData.leadTime}
                                        onChange={(e) => handleFormChange("leadTime", e.target.value)}
                                        className="border rounded px-2 py-1 w-full text-gray-700 mt-1"
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <button
                                        className="bg-green-600 text-white px-4 py-2 rounded"
                                        onClick={handleSaveUpdate}
                                      >
                                        Save
                                      </button>
                                      <button
                                        className="bg-gray-300 px-4 py-2 rounded"
                                        onClick={() => setUpdateDialogOpen(false)}
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        className="bg-gray-300 px-4 py-2 rounded"
                                        onClick={() => setUpdateStep(2)}
                                      >
                                        Back
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </Dialog>
                      </TableCell>
                      <TableCell>{evt.companyName || evt.customerName}</TableCell>
                      <TableCell>{evt.contactPerson}</TableCell>
                      <TableCell>{evt.quoteSent ? "Yes" : "No"}</TableCell>
                      <TableCell>{evt.quoteNumber ? evt.quoteNumber : "-"}</TableCell>
                      <TableCell>{evt.poReceived ? "Yes" : "No"}</TableCell>
                      <TableCell>{evt.orderNumber ? evt.orderNumber : "-"}</TableCell>
                      <TableCell>{evt.phone ? evt.phone : "-"}</TableCell>
                      <TableCell>{evt.price ?? "-"}</TableCell>
                      <TableCell>{evt.leadTime ?? "-"}</TableCell>
                      <TableCell>{new Date(evt.date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {selectedRow.events.length > visibleEvents && (
                <div className="flex justify-center mt-4">
                  <button
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                    onClick={handleSeeMore}
                  >
                    See More
                  </button>
                </div>
              )}
            </div>
            <div className="border-t p-4 flex justify-end">
              <DialogClose asChild>
                <button className="border border-gray-300 rounded px-4 py-2 hover:bg-gray-100 text-gray-700">
                  Close
                </button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <ToastContainer />
    </div>
  )
}
