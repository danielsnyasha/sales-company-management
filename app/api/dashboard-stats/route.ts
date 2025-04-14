// File: app/api/dashboard-stats/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Example statuses to exclude for quotations
const EXCLUDED_STATUSES = [
  "Cancelled",
  "Completed",
  "Not interested in doing business with us",
  "Company blacklisted",
];

export async function GET() {
  try {
    // 1) Sales Orders total
    const salesEvents = await prisma.event.findMany({
      where: {
        eventType: "ORDER",
        poReceived: true, // or "poSent" if that’s your real field
      },
      select: { price: true },
    });
    const salesOrdersValue = salesEvents.reduce((sum, e) => sum + (e.price || 0), 0);

    // 2) Quotations total
    const quoteEvents = await prisma.event.findMany({
      where: {
        quoteSent: true,
        NOT: {
          status: { in: EXCLUDED_STATUSES },
        },
      },
      select: { price: true },
    });
    const quotationsValue = quoteEvents.reduce((sum, e) => sum + (e.price || 0), 0);

    // 3) CSIs count => from your description, basically counting all rows
    //   If you have a special definition, e.g. csiConvertedAt != null, adapt accordingly.
    const totalEventsCount = await prisma.event.count();
    // Minimum 1, if you truly never want to display 0:
    const csiCount = Math.max(1, totalEventsCount);

    // 4) Targets => Hard-code 6.5 million or fetch from somewhere
    const targetValue = 6500000;

    // 5) Sales Reps => distinct rep names + optional images
    const repRecords = await prisma.event.findMany({
      where: { salesRepresentative: { not: null } },
      select: { salesRepresentative: true },
      distinct: ["salesRepresentative"],
    });
    // Basic example: map known reps to images, or store images in your DB
    const imageMap: Record<string, string> = {
      "Alice": "/images/alice.jpg",
      "Bob": "/images/bob.jpg",
    };
    const reps = repRecords.map((r) => {
      const name = r.salesRepresentative!;
      return {
        name,
        image: imageMap[name] || "/images/placeholder.png",
      };
    });

    return NextResponse.json({
      salesOrdersValue,
      quotationsValue,
      csiCount,
      targetValue,
      reps,
    });
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
