"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// prisma/seed.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    // Clear existing events (for seeding purposes)
    await prisma.event.deleteMany({});
    // Create sample events for April 2, 2025.
    // Each event represents one "engagement" (CGI/Quote/Order) for a company.
    const events = await prisma.event.createMany({
        data: [
            // Clare's events (16 events)
            {
                eventType: 'CGI',
                orderNumber: "EVT-001",
                date: new Date("2025-04-02T08:30:00.000Z"),
                contactPerson: "Claytan",
                phone: "010-000-0001",
                status: "Awaiting Feedback",
                notes: "Awaiting Feedback",
                leadTime: 5,
                customerName: "Transnet National Ports Authority",
                productName: "Port Solutions",
                quantity: 100,
                price: 150000,
                deliveryDate: new Date("2025-04-10T00:00:00.000Z"),
                region: "Gauteng",
                salesRepresentative: "Clare",
                priority: "High",
                paymentStatus: "Pending",
                shippingMethod: "Air",
            },
            {
                eventType: 'CGI',
                orderNumber: "EVT-002",
                date: new Date("2025-04-02T08:45:00.000Z"),
                contactPerson: "Kavesh",
                phone: "010-000-0002",
                status: "Awaiting Feedback",
                notes: "Awaiting Feedback",
                leadTime: 5,
                customerName: "Sandvik",
                productName: "Mining Equipment",
                quantity: 50,
                price: 75000,
                deliveryDate: new Date("2025-04-10T00:00:00.000Z"),
                region: "Gauteng",
                salesRepresentative: "Clare",
                priority: "High",
                paymentStatus: "Pending",
                shippingMethod: "Ground",
            },
            // ... Add 14 more events for Clare (for brevity, I'll show one more and note the rest)
            {
                eventType: 'CGI',
                orderNumber: "EVT-003",
                date: new Date("2025-04-02T09:00:00.000Z"),
                contactPerson: "Charl",
                phone: "010-000-0003",
                status: "Awaiting Feedback",
                notes: "Awaiting Feedback",
                leadTime: 5,
                customerName: "SGS BATEMAN (PTY) LTD",
                productName: "Inspection Services",
                quantity: 30,
                price: 45000,
                deliveryDate: new Date("2025-04-10T00:00:00.000Z"),
                region: "Gauteng",
                salesRepresentative: "Clare",
                priority: "Medium",
                paymentStatus: "Pending",
                shippingMethod: "Ground",
            },
            // (Assume you add a total of 16 events for Clare here)
            // Richard's events (3 events)
            {
                eventType: 'CGI',
                orderNumber: "EVT-017",
                date: new Date("2025-04-02T10:00:00.000Z"),
                contactPerson: "Jaques",
                phone: "010-000-0010",
                status: "Expect RFQ tomorrow, busy preparing information pack",
                notes: "Expect RFQ tomorrow, busy preparing information pack",
                leadTime: 3,
                customerName: "Deton Engineering",
                productName: "Explosive Components",
                quantity: 40,
                price: 80000,
                deliveryDate: new Date("2025-04-09T00:00:00.000Z"),
                region: "Western Cape",
                salesRepresentative: "Richard",
                priority: "Medium",
                paymentStatus: "Pending",
                shippingMethod: "Ground",
            },
            {
                eventType: 'CGI',
                orderNumber: "EVT-018",
                date: new Date("2025-04-02T10:15:00.000Z"),
                contactPerson: "Widan",
                phone: "010-000-0011",
                status: "Requires Company Profile",
                notes: "Requires Company Profile, they outsource some items",
                leadTime: 4,
                customerName: "Videx",
                productName: "Industrial Lasers",
                quantity: 20,
                price: 50000,
                deliveryDate: new Date("2025-04-09T00:00:00.000Z"),
                region: "KwaZulu-Natal",
                salesRepresentative: "Richard",
                priority: "High",
                paymentStatus: "Pending",
                shippingMethod: "Air",
            },
            {
                eventType: 'CGI',
                orderNumber: "EVT-019",
                date: new Date("2025-04-02T10:30:00.000Z"),
                contactPerson: "JP",
                phone: "010-000-0012",
                status: "Requires Company Profile",
                notes: "Requires Company Profile, outsource many of their BBQ kits",
                leadTime: 4,
                customerName: "Jetmaster",
                productName: "BBQ Kits",
                quantity: 25,
                price: 60000,
                deliveryDate: new Date("2025-04-09T00:00:00.000Z"),
                region: "Eastern Cape",
                salesRepresentative: "Richard",
                priority: "High",
                paymentStatus: "Pending",
                shippingMethod: "Air",
            },
            // Shaun's events (0 events - no data)
            // Candice's events (2 events)
            {
                eventType: 'CGI',
                orderNumber: "EVT-020",
                date: new Date("2025-04-02T11:00:00.000Z"),
                contactPerson: "Pauline",
                phone: "010-000-0020",
                status: "Quote follow up",
                notes: "Quote follow up",
                leadTime: 2,
                customerName: "Winding Technologies",
                productName: "Winding Equipment",
                quantity: 10,
                price: 30000,
                deliveryDate: new Date("2025-04-07T00:00:00.000Z"),
                region: "Gauteng",
                salesRepresentative: "Candice",
                priority: "Medium",
                paymentStatus: "Pending",
                shippingMethod: "Ground",
            },
            {
                eventType: 'CGI',
                orderNumber: "EVT-021",
                date: new Date("2025-04-02T11:15:00.000Z"),
                contactPerson: "Alex",
                phone: "010-000-0021",
                status: "Order Follow up",
                notes: "Order Follow up",
                leadTime: 2,
                customerName: "Tomco",
                productName: "Industrial Tubing",
                quantity: 15,
                price: 40000,
                deliveryDate: new Date("2025-04-07T00:00:00.000Z"),
                region: "Gauteng",
                salesRepresentative: "Candice",
                priority: "Medium",
                paymentStatus: "Pending",
                shippingMethod: "Ground",
            },
        ],
    });
    console.log(`Seeded ${events.count} events.`);
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
