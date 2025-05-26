// app/api/newEvent/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Generate a reference code like "A1234"
function generateReferenceCode() {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26))
  const number = Math.floor(1000 + Math.random() * 9000)
  return letter + number
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("[✅ Incoming Request Data]:", data)

    // basic required fields
    if (!data.customerName || !data.salesRepresentative || !data.date) {
      throw new Error(
        "Missing required fields: customerName, salesRepresentative, or date"
      )
    }

    const status =
      data.status && data.status.trim() !== "" ? data.status : "Pending"

    // date parsing
    const dateObj = new Date(data.date)
    if (isNaN(dateObj.getTime())) throw new Error("Invalid date format")

    const deliveryDate = data.deliveryDate ? new Date(data.deliveryDate) : null
    const quoteReceivedAt = data.quoteReceivedAt
      ? new Date(data.quoteReceivedAt)
      : null
    const csiConvertedAt = data.csiConvertedAt
      ? new Date(data.csiConvertedAt)
      : null
    const jobCompletedAt = data.jobCompletedAt
      ? new Date(data.jobCompletedAt)
      : null

    const newEvent = await prisma.event.create({
      data: {
        eventType: data.eventType || "ORDER",
        date: dateObj,
        contactPerson: data.contactPerson,
        phone: data.phone,
        status,
        notes: data.notes,
        customerName: data.customerName,
        companyName: data.companyName,
        salesRepresentative: data.salesRepresentative,
        paymentStatus: data.paymentStatus,
        priority: data.priority,

        quoteSent: !!data.quoteSent,
        customerQuoteNumber: data.customerQuoteNumber,
        poReceived: !!data.poReceived,
        poNumber: data.poNumber,
        quoteNumber: data.quoteNumber,

        leadTime: data.leadTime ? Number(data.leadTime) : undefined,
        deliveryDate,
        quoteReceivedAt,
        csiConvertedAt,
        jobCompletedAt,

        natureOfWork: Array.isArray(data.natureOfWork)
          ? data.natureOfWork
          : [],
        actualWorkDescription: data.actualWorkDescription,
        processCost: data.processCost ? Number(data.processCost) : undefined,
        productName: data.productName,
        quantity: data.quantity ? Number(data.quantity) : undefined,
        price: data.price ? Number(data.price) : undefined,
        region: data.region,
        shippingMethod: data.shippingMethod,
        internalNotes: data.internalNotes,
        isPriorityCustomer: data.isPriorityCustomer,

        // NEW: Line of Work enum (EC | SSC | SMP | OEM | Unknown)
        lineOfWork: data.lineOfWork || "Unknown",

        referenceCode: generateReferenceCode(),
      },
    })

    console.log("[✅ Successfully Created Event]:", newEvent)
    return NextResponse.json(newEvent, { status: 201 })
  } catch (error: any) {
    console.error("[❌ Error creating new event]:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
