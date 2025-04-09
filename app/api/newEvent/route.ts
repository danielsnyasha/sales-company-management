// app/api/newEvent/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Auto-generate a reference code: one uppercase letter and 4 digits (e.g., "A1234")
function generateReferenceCode() {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const number = Math.floor(1000 + Math.random() * 9000);
  return letter + number;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("[✅ Incoming Request Data]:", data);

    // Require required fields.
    if (!data.customerName || !data.salesRepresentative || !data.date) {
      throw new Error("Missing required fields: customerName, salesRepresentative, or date");
    }
    const status = data.status && data.status.trim() !== "" ? data.status : "Pending";

    // Convert string dates to Date objects
    const dateObj = new Date(data.date);
    if (isNaN(dateObj.getTime())) {
      throw new Error("Invalid date format");
    }
    const deliveryDate = data.deliveryDate ? new Date(data.deliveryDate) : null;
    const quoteReceivedAt = data.quoteReceivedAt ? new Date(data.quoteReceivedAt) : null;
    const csiConvertedAt = data.csiConvertedAt ? new Date(data.csiConvertedAt) : null;
    const jobCompletedAt = data.jobCompletedAt ? new Date(data.jobCompletedAt) : null;

    const newEvent = await prisma.event.create({
      data: {
        eventType: data.eventType || "ORDER",
        date: dateObj,
        contactPerson: data.contactPerson,
        phone: data.phone,
        status: status,
        notes: data.notes,
        customerName: data.customerName,
        companyName: data.companyName,
        salesRepresentative: data.salesRepresentative,
        paymentStatus: data.paymentStatus,
        priority: data.priority,
        // Ensure boolean conversion.
        quoteSent: !!data.quoteSent,
        customerQuoteNumber: data.customerQuoteNumber,
        poReceived: !!data.poReceived,
        poNumber: data.poNumber,
        quoteNumber: data.quoteNumber,
        leadTime: data.leadTime ? Number(data.leadTime) : undefined,
        deliveryDate: deliveryDate,
        quoteReceivedAt: quoteReceivedAt,
        csiConvertedAt: csiConvertedAt,
        jobCompletedAt: jobCompletedAt,
        natureOfWork: Array.isArray(data.natureOfWork) ? data.natureOfWork : [],
        actualWorkDescription: data.actualWorkDescription,
        processCost: data.processCost ? Number(data.processCost) : undefined,
        productName: data.productName,
        quantity: data.quantity ? Number(data.quantity) : undefined,
        price: data.price ? Number(data.price) : undefined,
        region: data.region,
        shippingMethod: data.shippingMethod,
        internalNotes: data.internalNotes,
        isPriorityCustomer: data.isPriorityCustomer,
        referenceCode: generateReferenceCode(),
      },
    });

    console.log("[✅ Successfully Created Event]:", newEvent);
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error: any) {
    console.error("[❌ Error creating new event]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
