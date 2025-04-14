import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseISO } from "date-fns";

// GET: Fetch events with optional period & date filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    const dateParam = searchParams.get("date");

    let baseDate: Date | null = null;
    if (dateParam) {
      baseDate = parseISO(dateParam);
    }

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    // Calculate start & end of the requested period, if applicable:
    if (baseDate && period) {
      switch (period) {
        case "week": {
          // example: Sunday-based
          const dayOfWeek = baseDate.getDay(); // 0=Sun,1=Mon,...
          startDate = new Date(baseDate);
          startDate.setDate(baseDate.getDate() - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);

          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        }
        case "month": {
          startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
          endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        }
        case "quarter": {
          const quarter = Math.floor(baseDate.getMonth() / 3); // 0=Q1,1=Q2,2=Q3,3=Q4
          startDate = new Date(baseDate.getFullYear(), quarter * 3, 1);
          endDate = new Date(baseDate.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
          break;
        }
        case "year": {
          startDate = new Date(baseDate.getFullYear(), 0, 1);
          endDate = new Date(baseDate.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        }
        default:
          // If an unknown period is passed, do nothing special.
          break;
      }
    }

    // Build your Prisma "where" clause to filter by date if we have a range:
    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Query the database with any needed date filter
    const events = await prisma.event.findMany({
      where: whereClause,
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
