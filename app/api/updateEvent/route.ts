// app/api/updateEvent/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Adjust path as needed

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, data } = body; // expect: { id: string, data: { ... } }
    if (!id || !data) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Map front-end values to the correct Prisma fields.
    // Note: Fields like "quoteReceived" and others are coming as "Yes"/"No" strings,
    // so we convert them to booleans.
    const updateData = {
      eventType: data.eventType, // should be "CGI", "QUOTE", or "ORDER"
      referenceCode: data.referenceCode,
      date: data.date ? new Date(data.date) : undefined,
      quoteReceivedAt: data.quoteReceivedAt ? new Date(data.quoteReceivedAt) : null,
      csiConvertedAt: data.csiConvertedAt ? new Date(data.csiConvertedAt) : null,
      jobCompletedAt: data.jobCompletedAt ? new Date(data.jobCompletedAt) : null,
      natureOfWork: data.natureOfWork, // expects an array of strings
      actualWorkDescription: data.actualWorkDescription,
      processCost: data.processCost ? Number(data.processCost) : null,
      contactPerson: data.contactPerson,
      phone: data.phone,
      status: data.status,
      notes: data.notes,
      leadTime: data.leadTime ? Number(data.leadTime) : null,
      companyName: data.companyName,
      customerName: data.customerName,
      productName: data.productName,
      quantity: data.quantity ? Number(data.quantity) : null,
      price: data.price ? Number(data.price) : null,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      region: data.region,
      salesRepresentative: data.salesRepresentative,
      priority: data.priority,
      paymentStatus: data.paymentStatus,
      shippingMethod: data.shippingMethod,
      poNumber: data.poNumber, // PO number received from customer
      customerQuoteNumber: data.customerQuoteNumber, // customer's original quote reference
      quoteReceived: data.quoteReceived === "Yes",
      quoteSent: data.quoteSent === "Yes",
      poReceived: data.poReceived === "Yes",
      internalNotes: data.internalNotes,
      isPriorityCustomer: data.isPriorityCustomer === "Yes",
    };

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
