import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { parseISO } from "date-fns"

// ────────────────────────────────────────────────────────────────
// GET: Fetch events (optionally filtered by period and/or date)
// ────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period")
    const dateParam = searchParams.get("date")

    let baseDate: Date | null = null
    if (dateParam) baseDate = parseISO(dateParam)

    let startDate: Date | null = null
    let endDate: Date | null = null

    // derive date window (week / month / quarter / year)
    if (baseDate && period) {
      switch (period) {
        case "week": {
          const dow = baseDate.getDay() // 0=Sun
          startDate = new Date(baseDate)
          startDate.setDate(baseDate.getDate() - dow)
          startDate.setHours(0, 0, 0, 0)

          endDate = new Date(startDate)
          endDate.setDate(startDate.getDate() + 6)
          endDate.setHours(23, 59, 59, 999)
          break
        }
        case "month": {
          startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
          endDate = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          )
          break
        }
        case "quarter": {
          const q = Math.floor(baseDate.getMonth() / 3) // 0-3
          startDate = new Date(baseDate.getFullYear(), q * 3, 1)
          endDate = new Date(
            baseDate.getFullYear(),
            q * 3 + 3,
            0,
            23,
            59,
            59,
            999
          )
          break
        }
        case "year": {
          startDate = new Date(baseDate.getFullYear(), 0, 1)
          endDate = new Date(
            baseDate.getFullYear(),
            11,
            31,
            23,
            59,
            59,
            999
          )
          break
        }
        default:
          break
      }
    }

    const whereClause: any = {}
    if (startDate && endDate) {
      whereClause.date = { gte: startDate, lte: endDate }
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(events)
  } catch (error: any) {
    console.error("Error fetching events:", error)
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}

// ────────────────────────────────────────────────────────────────
// PATCH: Update a single event
// ────────────────────────────────────────────────────────────────
export async function PATCH(request: Request) {
  try {
    const { id, data } = await request.json()
    if (!id) throw new Error("Event ID is required for update.")

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        eventType: data.eventType,
        date: data.date ? new Date(data.date) : undefined,
        contactPerson: data.contactPerson,
        phone: data.phone,
        status: data.status,
        notes: data.notes,
        customerName: data.customerName,
        companyName: data.companyName,
        salesRepresentative: data.salesRepresentative,
        paymentStatus: data.paymentStatus,
        priority: data.priority,
        quoteSent: Boolean(data.quoteSent),
        customerQuoteNumber: data.customerQuoteNumber,
        poReceived: Boolean(data.poReceived),
        poNumber: data.poNumber,
        quoteNumber: data.quoteNumber,
        leadTime:
          data.leadTime !== undefined ? Number(data.leadTime) : undefined,
        deliveryDate: data.deliveryDate
          ? new Date(data.deliveryDate)
          : undefined,
        quoteReceivedAt: data.quoteReceivedAt
          ? new Date(data.quoteReceivedAt)
          : undefined,
        csiConvertedAt: data.csiConvertedAt
          ? new Date(data.csiConvertedAt)
          : undefined,
        jobCompletedAt: data.jobCompletedAt
          ? new Date(data.jobCompletedAt)
          : undefined,
        natureOfWork: Array.isArray(data.natureOfWork)
          ? data.natureOfWork
          : undefined,
        actualWorkDescription: data.actualWorkDescription,
        processCost:
          data.processCost !== undefined ? Number(data.processCost) : undefined,
        productName: data.productName,
        quantity:
          data.quantity !== undefined ? Number(data.quantity) : undefined,
        price: data.price !== undefined ? Number(data.price) : undefined,
        region: data.region,
        shippingMethod: data.shippingMethod,
        internalNotes: data.internalNotes,
        isPriorityCustomer: Boolean(data.isPriorityCustomer),

        // NEW: Line of Work (enum value: EC | SSC | SMP | OEM | Unknown)
        lineOfWork: data.lineOfWork,
      },
    })

    return NextResponse.json(updatedEvent, { status: 200 })
  } catch (error: any) {
    console.error("Error updating event:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// ────────────────────────────────────────────────────────────────
// DELETE: Remove an event by ID
// ────────────────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const deleted = await prisma.event.delete({ where: { id } })
    return NextResponse.json(deleted, { status: 200 })
  } catch (error: any) {
    console.error("Error deleting event:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
