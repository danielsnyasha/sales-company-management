// app/api/companies/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper to generate a unique company number automatically.
function generateCompanyNumber() {
  // Creates a string like "CMP-123456"
  return "CMP-" + Math.floor(100000 + Math.random() * 900000).toString();
}

export async function GET() {
  try {
    const companies = await prisma.company.findMany();
    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.companyName) {
      throw new Error("Missing required field: companyName");
    }
    // Generate companyNumber automatically if not supplied.
    if (!data.companyNumber) {
      data.companyNumber = generateCompanyNumber();
    }
    // Set default for onBoard if not provided.
    if (typeof data.onBoard === "undefined") {
      data.onBoard = false;
    }
    const existing = await prisma.company.findFirst({
      where: {
        OR: [
          { companyNumber: data.companyNumber },
          { companyName: data.companyName }
        ]
      }
    });
    if (existing) {
      throw new Error("Company already exists");
    }
    const newCompany = await prisma.company.create({ data });
    return NextResponse.json(newCompany, { status: 201 });
  } catch (error: any) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    const deleted = await prisma.company.delete({
      where: { id },
    });
    return NextResponse.json(deleted, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
