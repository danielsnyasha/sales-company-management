// app/api/events/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Fetch all events
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(events);
  } catch (error: any) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// PATCH: Update a given event based on its unique identifier.
export async function PATCH(request: Request) {
  try {
    const { id, data } = await request.json();
    if (!id) {
      throw new Error("Event ID is required for update.");
    }

    // Convert data types if necessary. Here we assume the client sends proper types.
    // (You might add additional type conversions/validations here.)
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
        leadTime: data.leadTime !== undefined ? Number(data.leadTime) : undefined,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
        quoteReceivedAt: data.quoteReceivedAt ? new Date(data.quoteReceivedAt) : undefined,
        csiConvertedAt: data.csiConvertedAt ? new Date(data.csiConvertedAt) : undefined,
        jobCompletedAt: data.jobCompletedAt ? new Date(data.jobCompletedAt) : undefined,
        natureOfWork: Array.isArray(data.natureOfWork) ? data.natureOfWork : undefined,
        actualWorkDescription: data.actualWorkDescription,
        processCost: data.processCost !== undefined ? Number(data.processCost) : undefined,
        productName: data.productName,
        quantity: data.quantity !== undefined ? Number(data.quantity) : undefined,
        price: data.price !== undefined ? Number(data.price) : undefined,
        region: data.region,
        shippingMethod: data.shippingMethod,
        internalNotes: data.internalNotes,
        isPriorityCustomer: Boolean(data.isPriorityCustomer),
      },
    });

    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error: any) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an event by ID.
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    const deleted = await prisma.event.delete({
      where: { id },
    });
    return NextResponse.json(deleted, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
