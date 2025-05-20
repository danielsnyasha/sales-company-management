"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

// Shadcn UI components
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Check, ChevronsUpDown, User, Calendar, Briefcase, Phone, Award } from "lucide-react"
import { cn } from "@/lib/utils"

// ----- CONSTANTS & TYPES -----
const SALES_REPS = ["Shaun", "Candice", "Richard", "Clare", "LCVSSC"]
const STATUS_OPTIONS = [
  "Awaiting Feedback",
  "Meeting to be scheduled",
  "Looks Promising",
  "Not interested in doing business with us",
  "Company blacklisted",
  "Active",
  "Completed",
  "Cancelled",
  "On Hold",
  "Pending",
  "In Progress",
]
const PAYMENT_STATUSES = ["Paid", "Pending", "Unpaid", "N/A"]
const PRIORITIES = ["High", "Medium", "Low"]
const NATURE_OF_WORK_OPTIONS = [
  "Fabrication",
  "Motor Customer",
  "Cut + Value",
  "Production Line",
  "More than one",
]
const SHIPPING_METHODS = ["Ground", "Air", "Sea"]

interface Company {
  id: string
  companyName: string
}

interface NewEventPayload {
  eventType: "ORDER" | "QUOTE" | "CGI"
  date: string
  contactPerson: string
  phone: string
  status: string
  notes: string
  customerName: string
  companyName: string
  salesRepresentative: string
  paymentStatus: string
  priority: string
  quoteSent: boolean
  quoteNumber: string
  poReceived: boolean
  poNumber: string
  leadTime: number | undefined
  deliveryDate: string | null
  quoteReceivedAt: string | null
  csiConvertedAt: string | null
  jobCompletedAt: string | null
  natureOfWork: string[]
  actualWorkDescription: string
  processCost: number | undefined
  productName: string
  quantity: number | undefined
  price: number | undefined
  region: string
  shippingMethod: string
  internalNotes: string
  isPriorityCustomer: boolean
}

// ----- NewEventPage Component -----
export default function NewEventPage() {
  const router = useRouter()
  const todayStr = new Date().toISOString().split("T")[0]

  // Multi-step form state (4 steps)
  const [step, setStep] = useState(1)
  const [progress, setProgress] = useState(25)

  // ----- Company Combobox State -----
  const [companies, setCompanies] = useState<Company[]>([])
  const [companyQuery, setCompanyQuery] = useState("")
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false)
  // newCompanyData now only holds companyName.
  const [newCompanyData, setNewCompanyData] = useState({ companyName: "" })
  const [loadingCompanies, setLoadingCompanies] = useState(false)

  // ----- Step 1: Basic Info (Mandatory) -----
  const [salesRepresentative, setSalesRepresentative] = useState("")
  const [eventType, setEventType] = useState<"ORDER" | "QUOTE" | "CGI">("ORDER")
  const [dateValue, setDateValue] = useState<Date | null>(new Date())
  // Customer & Company name come from the selected company
  const [status, setStatus] = useState("Pending")
  const [priority, setPriority] = useState("Low")

  // ----- Step 2: Quote & PO Details -----
  const [quoteSent, setQuoteSent] = useState(false)
  // NEW: Add a state for quoteNumber (this is the field to be sent to the database)
  const [quoteNumber, setQuoteNumber] = useState("")
  const [poReceived, setPoReceived] = useState(false)
  // For backward compatibility, if needed, you can keep customerQuoteNumber,
  // but here we use quoteNumber to store the quote reference.
  const [poNumber, setPoNumber] = useState("")
  const [leadTime, setLeadTime] = useState<number | undefined>(undefined)

  // ----- Step 3: Contact & Payment -----
  const [contactPerson, setContactPerson] = useState("")
  const [phone, setPhone] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("")
  const [notes, setNotes] = useState("")

  // ----- Step 4: Additional Technical Details -----
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(null)
  const [quoteReceivedAt, setQuoteReceivedAt] = useState<Date | null>(null)
  const [csiConvertedAt, setCsiConvertedAt] = useState<Date | null>(null)
  const [jobCompletedAt, setJobCompletedAt] = useState<Date | null>(null)
  const [natureOfWork, setNatureOfWork] = useState("")
  const [actualWorkDescription, setActualWorkDescription] = useState("")
  const [processCost, setProcessCost] = useState<number | undefined>(undefined)
  const [productName, setProductName] = useState("")
  const [quantity, setQuantity] = useState<number | undefined>(undefined)
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [region, setRegion] = useState("")
  const [shippingMethod, setShippingMethod] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [isPriorityCustomer, setIsPriorityCustomer] = useState(false)

  // ----- Fetch Companies on Mount -----
  useEffect(() => {
    async function fetchCompanies() {
      setLoadingCompanies(true)
      try {
        const res = await fetch("/api/companies")
        if (!res.ok) throw new Error("Failed to fetch companies")
        const data: Company[] = await res.json()
        setCompanies(data)
      } catch (error) {
        console.error(error)
        toast.error("Error fetching companies.")
      } finally {
        setLoadingCompanies(false)
      }
    }
    fetchCompanies()
  }, [])

  // ----- Filtered Companies for Combobox -----
  const filteredCompanies = useMemo(() => {
    if (!companyQuery.trim()) return companies.slice(0, 5)
    try {
      const regex = new RegExp(companyQuery, "i")
      return companies.filter((c) => regex.test(c.companyName))
    } catch (err) {
      return companies.filter((c) =>
        c.companyName.toLowerCase().includes(companyQuery.toLowerCase())
      )
    }
  }, [companies, companyQuery])

  // ----- Step Navigation -----
  function nextStep() {
    if (step === 1) {
      if (!salesRepresentative || !dateValue || !selectedCompany) {
        toast.error("Sales Rep, Date, and Company are required.")
        return
      }
      setProgress(50)
      setStep(2)
    } else if (step === 2) {
      if (quoteSent && !quoteNumber.trim()) {
        toast.error("Enter Quote Number if Quote Sent.")
        return
      }
      if (poReceived && !quoteSent) {
        toast.error("Cannot have a PO if Quote was not sent.")
        return
      }
      setProgress(75)
      setStep(3)
    } else if (step === 3) {
      if (!contactPerson.trim() || !phone.trim() || !paymentStatus) {
        toast.error("Contact Person, Phone, and Payment Status are required.")
        return
      }
      setProgress(90)
      setStep(4)
    }
  }

  function prevStep() {
    if (step === 2) {
      setStep(1)
      setProgress(25)
    } else if (step === 3) {
      setStep(2)
      setProgress(50)
    } else if (step === 4) {
      setStep(3)
      setProgress(75)
    }
  }

  // ----- Handle Company Creation via Dialog -----
  async function handleCreateCompany() {
    const companyNameToCreate = newCompanyData.companyName.trim()
    if (!companyNameToCreate) {
      toast.error("Company name is required.")
      return
    }
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only send companyName; backend will auto-generate companyNumber.
        body: JSON.stringify({ companyName: companyNameToCreate }),
      })
      if (!res.ok) throw new Error("Failed to create company")
      const created = await res.json()
      toast.success("Company created successfully!")
      setCompanies((prev) => [...prev, created])
      setSelectedCompany(created)
      setCompanyDialogOpen(false)
      setNewCompanyData({ companyName: "" })
      setCompanyQuery("")
    } catch (error) {
      console.error(error)
      toast.error("Error creating company.")
    }
  }

  // ----- Helper: Convert Date to ISO String (with timezone adjustment) -----
  function toISO(dateVal: Date | null): string | null {
    if (!dateVal) return null
    const local = new Date(dateVal.getTime() - dateVal.getTimezoneOffset() * 60000)
    return local.toISOString()
  }

  // ----- Final Submit Handler -----
  async function handleSubmit() {
    if (poReceived && !quoteSent) {
      toast.error("Cannot have a PO if Quote is not sent.")
      return
    }
    if (quoteSent && !leadTime) {
      toast.error("Lead time is required if Quote was sent.")
      return
    }
    const payload: NewEventPayload = {
      eventType,
      date: toISO(dateValue)!,
      contactPerson,
      phone,
      status: status.trim() !== "" ? status : "Pending",
      notes,
      customerName: selectedCompany!.companyName,
      companyName: selectedCompany!.companyName,
      salesRepresentative,
      paymentStatus,
      priority,
      quoteSent,
      quoteNumber: quoteSent ? quoteNumber : "",
      poReceived,
      poNumber: poReceived ? poNumber : "",
      leadTime,
      deliveryDate: toISO(deliveryDate),
      quoteReceivedAt: toISO(quoteReceivedAt),
      csiConvertedAt: toISO(csiConvertedAt),
      jobCompletedAt: toISO(jobCompletedAt),
      natureOfWork: natureOfWork.trim() ? [natureOfWork.trim()] : [],
      actualWorkDescription,
      processCost,
      productName,
      quantity,
      price,
      region,
      shippingMethod,
      internalNotes,
      isPriorityCustomer,
    }
    try {
      const res = await fetch("/api/newEvent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to create event.")
      await res.json()
      toast.success("Event created successfully!")
      router.push("/dashboard")
    } catch (error) {
      console.error(error)
      toast.error("Error creating event.")
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow mt-6 space-y-6">
      <ToastContainer />

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 h-2 rounded">
          <div className="bg-purple-500 h-2 rounded" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-center mt-2 text-sm text-gray-600">Step {step} of 4</p>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-purple-700 flex items-center gap-2">
            <User className="h-6 w-6" /> Basic Info
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <User className="h-4 w-4" /> Sales Representative <span className="text-red-500">*</span>
            </label>
            <select
              className="mt-1 block w-full border border-gray-300 rounded p-2"
              value={salesRepresentative}
              onChange={(e) => setSalesRepresentative(e.target.value)}
            >
              <option value="">-- Select --</option>
              {SALES_REPS.map(rep => (
                <option key={rep} value={rep}>
                  {rep}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              selected={dateValue}
              onChange={(date) => setDateValue(date)}
              dateFormat="yyyy-MM-dd"
              withPortal
              popperPlacement="bottom-start"
              popperClassName="z-[9999]"
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>

          {/* Company Combobox */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <Briefcase className="h-4 w-4" /> Company (Customer) <span className="text-red-500">*</span>
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedCompany ? selectedCompany.companyName : "Type to search..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Input
                  placeholder="Search company..."
                  value={companyQuery}
                  onChange={(e) => setCompanyQuery(e.target.value)}
                  className="p-2 border-b"
                />
                <div className="max-h-60 overflow-auto">
                  {loadingCompanies ? (
                    <div className="p-2 text-center text-sm text-gray-500">
                      Loading companies...
                    </div>
                  ) : filteredCompanies.length === 0 ? (
                    <div className="p-2 text-center text-sm text-gray-500">
                      No company found.
                    </div>
                  ) : (
                    filteredCompanies.map((c) => (
                      <Button
                        key={c.id}
                        variant="ghost"
                        className="w-full text-left"
                        onClick={() => {
                          setSelectedCompany(c)
                          setCompanyQuery("")
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedCompany?.id === c.id ? "opacity-100" : "opacity-0")} />
                        {c.companyName}
                      </Button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {companyQuery.trim().length >= 3 && filteredCompanies.length === 0 && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewCompanyData({ companyName: companyQuery.trim() })
                    setCompanyDialogOpen(true)
                  }}
                >
                  Create "{companyQuery}"
                </Button>
              </div>
            )}
            <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
              <DialogContent className="p-4 max-w-sm">
                <DialogHeader>
                  <DialogTitle>Create New Company</DialogTitle>
                  <DialogDescription>Enter the new company name.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label>Company Name</Label>
                    <Input
                      className="mt-2"
                      placeholder="e.g. ACME Corp"
                      value={newCompanyData.companyName}
                      onChange={(e) =>
                        setNewCompanyData((prev) => ({
                          ...prev,
                          companyName: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button className="bg-green-600 text-white" onClick={handleCreateCompany}>
                    Save
                  </Button>
                  <DialogClose asChild>
                    <Button className="ml-2 border">Cancel</Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <button className="bg-purple-600 text-white px-4 py-2 rounded mt-4" onClick={nextStep}>
            Next
          </button>
        </div>
      )}

      {/* Step 2: Quote & PO Details */}
      {step === 2 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-purple-700 flex items-center gap-1">
            <Briefcase className="h-5 w-5" /> Quote &amp; PO Details
          </h2>

          <div className="mb-4 flex items-center space-x-2">
            <input
              id="quoteSent"
              type="checkbox"
              checked={quoteSent}
              onChange={(e) => setQuoteSent(e.target.checked)}
            />
            <label htmlFor="quoteSent" className="text-sm font-medium text-gray-700">
              Quote Sent?
            </label>
          </div>

          <div className="mb-4">
            <Label className="flex items-center gap-1">
              <Award className="h-4 w-4" /> Quote Number
            </Label>
            <Input
              className="mt-1"
              value={quoteNumber}
              onChange={(e) => setQuoteNumber(e.target.value)}
              disabled={!quoteSent}
            />
          </div>

          <div className="mb-4">
            <Label className="flex items-center gap-1">
              <Award className="h-4 w-4" /> PO Received?
            </Label>
            <div className="flex items-center">
              <input
                id="poReceived"
                type="checkbox"
                checked={poReceived}
                onChange={(e) => setPoReceived(e.target.checked)}
                disabled={!quoteSent}
              />
              <label htmlFor="poReceived" className="ml-2 text-sm font-medium text-gray-700">
                Yes
              </label>
            </div>
          </div>

          <div className="mb-4">
            <Label className="flex items-center gap-1">
              <Award className="h-4 w-4" /> PO Number
            </Label>
            <Input
              className="mt-1"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              disabled={!poReceived}
            />
          </div>

          <div className="mb-4">
            <Label className="flex items-center gap-1">
              <Award className="h-4 w-4" /> Lead Time (days)
            </Label>
            <Input
              type="number"
              className="mt-1"
              value={leadTime === undefined ? "" : leadTime}
              onChange={(e) => setLeadTime(e.target.value ? Number(e.target.value) : undefined)}
              disabled={!quoteSent || !quoteNumber.trim()}
            />
          </div>

          <div className="flex space-x-2 mt-4">
            <Button variant="outline" onClick={prevStep}>
              Back
            </Button>
            <Button className="bg-purple-600 text-white" onClick={nextStep}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Contact & Payment */}
      {step === 3 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-purple-700 flex items-center gap-1">
            <Phone className="h-5 w-5" /> Contact &amp; Payment
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <User className="h-4 w-4" /> Contact Person <span className="text-red-500">*</span>
            </label>
            <Input className="mt-1" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <Phone className="h-4 w-4" /> Phone <span className="text-red-500">*</span>
            </label>
            <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="mb-4 flex space-x-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                <Award className="h-4 w-4" /> Payment Status
              </label>
              <Select value={paymentStatus} onValueChange={(val) => setPaymentStatus(val)}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((ps) => (
                    <SelectItem key={ps} value={ps}>
                      {ps}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                <Award className="h-4 w-4" /> Status <span className="text-red-500">*</span>
              </label>
              <Select value={status} onValueChange={(val) => setStatus(val)}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <Award className="h-4 w-4" /> Notes
            </label>
            <textarea
              className="mt-1 block w-full border border-gray-300 rounded p-2"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex space-x-2 mt-4">
            <Button variant="outline" onClick={prevStep}>Back</Button>
            <Button className="bg-purple-600 text-white" onClick={nextStep}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 4: Additional Technical Details */}
      {step === 4 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-purple-700 flex items-center gap-1">
            <Calendar className="h-5 w-5" /> Additional Details
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Delivery Date &amp; Time
            </label>
            <DatePicker
              selected={deliveryDate}
              onChange={(date) => setDeliveryDate(date)}
              showTimeSelect
              dateFormat="Pp"
              withPortal
              popperPlacement="bottom-start"
              popperClassName="z-[9999]"
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Quote Received At
            </label>
            <DatePicker
              selected={quoteReceivedAt}
              onChange={(date) => setQuoteReceivedAt(date)}
              showTimeSelect
              dateFormat="Pp"
              withPortal
              popperPlacement="bottom-start"
              popperClassName="z-[9999]"
              className="mt-1 block w-full border border-gray-300 rounded p-2"
              disabled={!quoteSent}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <Calendar className="h-4 w-4" /> CSI Converted At
            </label>
            <DatePicker
              selected={csiConvertedAt}
              onChange={(date) => setCsiConvertedAt(date)}
              showTimeSelect
              dateFormat="Pp"
              withPortal
              popperPlacement="bottom-start"
              popperClassName="z-[9999]"
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Job Completed At
            </label>
            <DatePicker
              selected={jobCompletedAt}
              onChange={(date) => setJobCompletedAt(date)}
              showTimeSelect
              dateFormat="Pp"
              withPortal
              popperPlacement="bottom-start"
              popperClassName="z-[9999]"
              className="mt-1 block w-full border border-gray-300 rounded p-2"
              disabled={!poReceived}
            />
          </div>

          <div className="mb-4 flex space-x-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                <Briefcase className="h-4 w-4" /> Process Cost (ZAR)
              </label>
              <Input
                type="number"
                className="mt-1"
                value={processCost === undefined ? "" : processCost}
                onChange={(e) => setProcessCost(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                <Briefcase className="h-4 w-4" /> Lead Time (days)
              </label>
              <Input
                type="number"
                className="mt-1"
                value={leadTime === undefined ? "" : leadTime}
                onChange={(e) => setLeadTime(e.target.value ? Number(e.target.value) : undefined)}
                disabled={!quoteSent || !quoteNumber.trim()}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <Briefcase className="h-4 w-4" /> Product Name
            </label>
            <Input
              className="mt-1"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          <div className="mb-4 flex space-x-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                <Briefcase className="h-4 w-4" /> Quantity
              </label>
              <Input
                type="number"
                className="mt-1"
                value={quantity === undefined ? "" : quantity}
                onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                <Briefcase className="h-4 w-4" /> Price (ZAR)
              </label>
              <Input
                type="number"
                className="mt-1"
                value={price === undefined ? "" : price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <Briefcase className="h-4 w-4" /> Region
            </label>
            <Input
              className="mt-1"
              placeholder="e.g. Gauteng"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <Briefcase className="h-4 w-4" /> Shipping Method
            </label>
            <Select value={shippingMethod} onValueChange={(val) => setShippingMethod(val)}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {SHIPPING_METHODS.map((sm) => (
                  <SelectItem key={sm} value={sm}>
                    {sm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <Briefcase className="h-4 w-4" /> Internal Notes
            </label>
            <textarea
              className="mt-1 block w-full border border-gray-300 rounded p-2"
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
            />
          </div>

          <div className="mb-4 flex items-center space-x-2">
            <input
              id="isPriorityCustomer"
              type="checkbox"
              checked={isPriorityCustomer}
              onChange={(e) => setIsPriorityCustomer(e.target.checked)}
            />
            <label htmlFor="isPriorityCustomer" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Award className="h-4 w-4" /> Is Priority Customer?
            </label>
          </div>

          <button className="bg-green-500 text-white px-4 py-2 rounded mt-4" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}
