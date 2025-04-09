"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// prisma/seed.ts
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var events;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Clear existing events (for seeding purposes)
                return [4 /*yield*/, prisma.event.deleteMany({})
                    // Create sample events for April 2, 2025.
                    // Each event represents one "engagement" (CGI/Quote/Order) for a company.
                ];
                case 1:
                    // Clear existing events (for seeding purposes)
                    _a.sent();
                    return [4 /*yield*/, prisma.event.createMany({
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
                        })];
                case 2:
                    events = _a.sent();
                    console.log("Seeded ".concat(events.count, " events."));
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
