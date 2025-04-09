"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { ChevronLeft, ChevronRight, Eye, Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// ---------- Types ----------
interface Company {
  id: string
  companyName: string
  location: string
  email: string
  companyNumber: string
}

// ---------- Main Component ----------
export default function CompaniesPage() {
  // State for data + loading/error
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Global filter for searching
  const [globalFilter, setGlobalFilter] = useState("")

  // States for dialogs
  const [addOpen, setAddOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Data for the new company form
  const [newCompanyData, setNewCompanyData] = useState<Partial<Company>>({})
  // Data for the currently selected company (view/edit/delete)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  // ---------- Fetch data on mount ----------
  useEffect(() => {
    async function fetchCompanies() {
      setLoading(true)
      try {
        const res = await fetch("/api/companies")
        if (!res.ok) throw new Error("Failed to fetch companies")
        const data: Company[] = await res.json()
        setCompanies(data)
      } catch (err: any) {
        setError(err.message || "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchCompanies()
  }, [])

  // ---------- Columns ----------
  const columns: ColumnDef<Company>[] = useMemo(() => {
    return [
      {
        accessorKey: "companyName",
        header: "Company",
      },
      {
        accessorKey: "location",
        header: "Location",
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "companyNumber",
        header: "Company #",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const company = row.original
          return (
            <div className="flex items-center space-x-1">
              {/* VIEW Icon */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCompany(company)
                  setViewOpen(true)
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {/* EDIT Icon */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCompany(company)
                  setEditOpen(true)
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              {/* DELETE Icon */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCompany(company)
                  setDeleteOpen(true)
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          )
        },
      },
    ]
  }, [])

  // ---------- Filtered Data ----------
  const filteredData = useMemo(() => {
    if (!globalFilter.trim()) return companies
    const search = globalFilter.toLowerCase()
    return companies.filter((c) =>
      c.companyName.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search) ||
      c.location.toLowerCase().includes(search) ||
      c.companyNumber.toLowerCase().includes(search)
    )
  }, [companies, globalFilter])

  // ---------- React Table Setup ----------
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Show 15 companies per page
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  })

  // ---------- Handlers ----------
  async function createCompany() {
    if (!newCompanyData.companyName || !newCompanyData.companyNumber) {
      alert("Company name and company number required.")
      return
    }
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCompanyData),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create company")
      }
      // Refresh data
      const created = await res.json()
      setCompanies((prev) => [...prev, created])
      setAddOpen(false)
      setNewCompanyData({})
    } catch (err: any) {
      alert(err.message || "Error creating company")
    }
  }

  async function updateCompany(updated: Partial<Company>) {
    if (!selectedCompany?.id) return
    try {
      const res = await fetch("/api/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedCompany.id,
          ...updated,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update company")
      }
      const newObj = await res.json()
      setCompanies((prev) =>
        prev.map((c) => (c.id === selectedCompany.id ? newObj : c))
      )
      setSelectedCompany(null)
      setEditOpen(false)
    } catch (err: any) {
      alert(err.message || "Error updating company")
    }
  }

  async function deleteCompany() {
    if (!selectedCompany?.id) return
    try {
      const res = await fetch(`/api/companies?id=${selectedCompany.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete company")
      }
      // remove from state
      setCompanies((prev) => prev.filter((c) => c.id !== selectedCompany.id))
      setSelectedCompany(null)
      setDeleteOpen(false)
    } catch (err: any) {
      alert(err.message || "Error deleting company")
    }
  }

  // For editing, store changes in local state
  const [editFields, setEditFields] = useState<Partial<Company>>({})
  useEffect(() => {
    if (selectedCompany && editOpen) {
      setEditFields({ ...selectedCompany })
    } else {
      setEditFields({})
    }
  }, [selectedCompany, editOpen])

  // ---------- NEW/UPDATED EFFECT FOR PAGINATION ----------
  // Tells React Table how many total pages exist; sets manualPagination to false
  useEffect(() => {
    table.setOptions((prev) => ({
      ...prev,
      pageCount: Math.ceil(filteredData.length / table.getState().pagination.pageSize),
      manualPagination: false, // client-side pagination for entire dataset
    }))
  }, [filteredData, table])

  // ---------- Render ----------
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Companies</h1>

      <div className="flex flex-col md:flex-row items-center justify-between mb-4 space-y-3 md:space-y-0">
        <Input
          placeholder="Search companies..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full md:w-1/3"
        />
        <Button
          // Just add a blue background so it's nice
          className="bg-blue-500 hover:bg-blue-600 text-white"
          onClick={() => setAddOpen(true)}
        >
          Add New Company
        </Button>
      </div>

      {error && <p className="text-red-500 mb-2">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="rounded-md border min-h-[60vh]">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ------------ Add New Dialog ------------- */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
            <DialogDescription>Fill in the details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Company Name</Label>
              <Input
                value={newCompanyData.companyName || ""}
                onChange={(e) =>
                  setNewCompanyData({
                    ...newCompanyData,
                    companyName: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Company Number</Label>
              <Input
                value={newCompanyData.companyNumber || ""}
                onChange={(e) =>
                  setNewCompanyData({
                    ...newCompanyData,
                    companyNumber: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={newCompanyData.location || ""}
                onChange={(e) =>
                  setNewCompanyData({
                    ...newCompanyData,
                    location: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={newCompanyData.email || ""}
                onChange={(e) =>
                  setNewCompanyData({
                    ...newCompanyData,
                    email: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="primary" onClick={createCompany}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------ View Dialog ------------- */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Company Details</DialogTitle>
            <DialogDescription>Full info about the company</DialogDescription>
          </DialogHeader>
          {selectedCompany ? (
            <div className="space-y-3 mt-2">
              <p>
                <strong>Company Name:</strong> {selectedCompany.companyName}
              </p>
              <p>
                <strong>Company Number:</strong> {selectedCompany.companyNumber}
              </p>
              <p>
                <strong>Location:</strong> {selectedCompany.location}
              </p>
              <p>
                <strong>Email:</strong> {selectedCompany.email}
              </p>
            </div>
          ) : (
            <p>No company selected.</p>
          )}
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------ Edit Dialog ------------- */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>Update the fields below.</DialogDescription>
          </DialogHeader>
          {selectedCompany ? (
            <div className="space-y-3 mt-2">
              <div>
                <Label>Company Name</Label>
                <Input
                  value={editFields.companyName || ""}
                  onChange={(e) =>
                    setEditFields({ ...editFields, companyName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Company Number</Label>
                <Input
                  value={editFields.companyNumber || ""}
                  onChange={(e) =>
                    setEditFields({ ...editFields, companyNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={editFields.location || ""}
                  onChange={(e) =>
                    setEditFields({ ...editFields, location: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={editFields.email || ""}
                  onChange={(e) =>
                    setEditFields({ ...editFields, email: e.target.value })
                  }
                />
              </div>
            </div>
          ) : (
            <p>No company selected.</p>
          )}
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="primary"
              onClick={() => updateCompany(editFields)}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------ Delete Confirm Dialog ------------- */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this company?
            </DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <p className="mt-2 text-sm">
              Company: <strong>{selectedCompany.companyName}</strong>
            </p>
          )}
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline" className="text-green-700">
                No
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={deleteCompany}>
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
