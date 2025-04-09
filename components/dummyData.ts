export interface DailyRecord {
  orderNumber: string;
  notes: string;
  totalOrders: number;
  quotesSent: number;
}

export const dummyDailyRecords: Record<string, DailyRecord[]> = {
  "2025-04-01": [
    {
      orderNumber: "ORD-001",
      notes: "Order received for Client A. Priority shipment required.",
      totalOrders: 15,
      quotesSent: 5,
    },
    {
      orderNumber: "ORD-002",
      notes: "Confirmed order for Client B. Inventory check needed.",
      totalOrders: 8,
      quotesSent: 3,
    },
    {
      orderNumber: "ORD-003",
      notes: "Urgent order for Client C. Express delivery requested.",
      totalOrders: 20,
      quotesSent: 7,
    },
    {
      orderNumber: "ORD-004",
      notes: "Regular order for Client D. Standard processing.",
      totalOrders: 10,
      quotesSent: 4,
    },
    {
      orderNumber: "ORD-005",
      notes: "Follow-up order for Client E. Customization options reviewed.",
      totalOrders: 12,
      quotesSent: 5,
    },
    {
      orderNumber: "ORD-006",
      notes: "Bulk order for Client F. Discount applied per negotiation.",
      totalOrders: 25,
      quotesSent: 8,
    },
    {
      orderNumber: "ORD-007",
      notes: "New client order for Client G. Setup introductory meeting.",
      totalOrders: 18,
      quotesSent: 6,
    },
    {
      orderNumber: "ORD-008",
      notes: "Reorder for Client H. Verify previous shipment details.",
      totalOrders: 14,
      quotesSent: 5,
    },
    {
      orderNumber: "ORD-009",
      notes: "Special request order for Client I. Confirm design specifications.",
      totalOrders: 9,
      quotesSent: 3,
    },
    {
      orderNumber: "ORD-010",
      notes: "Order for Client J. Awaiting final confirmation.",
      totalOrders: 11,
      quotesSent: 4,
    },
    {
      orderNumber: "ORD-011",
      notes: "Follow-up on delayed order for Client K. Expedite processing.",
      totalOrders: 13,
      quotesSent: 5,
    },
    {
      orderNumber: "ORD-012",
      notes: "Final order of the day for Client L. Check inventory before shipping.",
      totalOrders: 10,
      quotesSent: 4,
    },
  ],
  "2025-04-02": [
    {
      orderNumber: "ORD-101",
      notes: "Morning order for Client M. Priority handling initiated.",
      totalOrders: 20,
      quotesSent: 6,
    },
    {
      orderNumber: "ORD-102",
      notes: "Order confirmed for Client N. Standard process underway.",
      totalOrders: 9,
      quotesSent: 3,
    },
    {
      orderNumber: "ORD-103",
      notes: "Urgent order for Client O. Expedited processing required.",
      totalOrders: 22,
      quotesSent: 7,
    },
    {
      orderNumber: "ORD-104",
      notes: "Bulk order for Client P. Negotiated discount applied.",
      totalOrders: 30,
      quotesSent: 9,
    },
    {
      orderNumber: "ORD-105",
      notes: "Reorder for Client Q. Previous shipment verified.",
      totalOrders: 15,
      quotesSent: 5,
    },
    {
      orderNumber: "ORD-106",
      notes: "Order for Client R. Materials pending arrival.",
      totalOrders: 12,
      quotesSent: 4,
    },
    {
      orderNumber: "ORD-107",
      notes: "Regular order for Client S. Payment details confirmed.",
      totalOrders: 18,
      quotesSent: 6,
    },
    {
      orderNumber: "ORD-108",
      notes: "Custom order for Client T. Design specifications verified.",
      totalOrders: 11,
      quotesSent: 4,
    },
    {
      orderNumber: "ORD-109",
      notes: "Follow-up order for Client U. Expedite delivery process.",
      totalOrders: 16,
      quotesSent: 5,
    },
    {
      orderNumber: "ORD-110",
      notes: "Standard order for Client V. Processing as usual.",
      totalOrders: 14,
      quotesSent: 4,
    },
    {
      orderNumber: "ORD-111",
      notes: "Urgent order for Client W. Immediate attention required.",
      totalOrders: 25,
      quotesSent: 8,
    },
    {
      orderNumber: "ORD-112",
      notes: "Final order for Client X. Shipment details confirmed.",
      totalOrders: 13,
      quotesSent: 5,
    },
  ],
  "2025-04-03": [
    {
      orderNumber: "ORD-201",
      notes: "Order for Client Y. Priority shipment in process.",
      totalOrders: 17,
      quotesSent: 5,
    },
    {
      orderNumber: "ORD-202",
      notes: "Follow-up order for Client Z. Details under review.",
      totalOrders: 10,
      quotesSent: 4,
    },
    {
      orderNumber: "ORD-203",
      notes: "Bulk order for Client AA. Discount terms negotiated.",
      totalOrders: 28,
      quotesSent: 9,
    },
    {
      orderNumber: "ORD-204",
      notes: "Urgent order for Client BB. Express delivery arranged.",
      totalOrders: 21,
      quotesSent: 7,
    },
    {
      orderNumber: "ORD-205",
      notes: "Regular order for Client CC. Standard processing.",
      totalOrders: 12,
      quotesSent: 4,
    },
    {
      orderNumber: "ORD-206",
      notes: "Reorder for Client DD. Inventory verified.",
      totalOrders: 16,
      quotesSent: 5,
    },
    {
      orderNumber: "ORD-207",
      notes: "Special order for Client EE. Design confirmation needed.",
      totalOrders: 9,
      quotesSent: 3,
    },
    {
      orderNumber: "ORD-208",
      notes: "Order for Client FF. Awaiting client confirmation.",
      totalOrders: 11,
      quotesSent: 4,
    },
    {
      orderNumber: "ORD-209",
      notes: "Follow-up order for Client GG. Expedited review in progress.",
      totalOrders: 13,
      quotesSent: 5,
    },
    {
      orderNumber: "ORD-210",
      notes: "Standard order for Client HH. Routine processing.",
      totalOrders: 15,
      quotesSent: 6,
    },
    {
      orderNumber: "ORD-211",
      notes: "Last order of the day for Client II. Final checks complete.",
      totalOrders: 14,
      quotesSent: 5,
    },
    {
      orderNumber: "ORD-212",
      notes: "Extra order for Client JJ. Specifications verified.",
      totalOrders: 10,
      quotesSent: 4,
    },
  ],
  // Additional dates can be added here in the same format...
};

export const aprilTargets = {
  "Fabrication Customers": 1500000,
  "Motor Customers": 2500000,
  "Cut + Value Add": 2000000,
  "Production line": 1000000,
};

export interface BelowRecord {
  orderNumber: string;
  client: string;
  status: string;
  amount: number;
}

export const belowData: BelowRecord[] = [
  {
    orderNumber: "ORD-1001",
    client: "Client A",
    status: "Processing",
    amount: 12000,
  },
  {
    orderNumber: "ORD-1002",
    client: "Client B",
    status: "Pending",
    amount: 8000,
  },
  {
    orderNumber: "ORD-1003",
    client: "Client C",
    status: "Shipped",
    amount: 15000,
  },
  {
    orderNumber: "ORD-1004",
    client: "Client D",
    status: "Complete",
    amount: 20000,
  },
];

export const graphData = {
  day: {
    labels: ["Clare", "Richard", "Shaun", "Candice"],
    datasets: [
      {
        label: "Orders",
        data: [10, 8, 0, 12],
        backgroundColor: "rgba(54, 162, 235, 0.7)",
      },
      {
        label: "Quotes Sent",
        data: [5, 7, 3, 6],
        backgroundColor: "rgba(255, 159, 64, 0.7)",
      },
    ],
  },
  week: {
    labels: ["Clare", "Richard", "Shaun", "Candice"],
    datasets: [
      {
        label: "Orders",
        data: [70, 65, 40, 80],
        backgroundColor: "rgba(54, 162, 235, 0.7)",
      },
      {
        label: "Quotes Sent",
        data: [35, 45, 20, 50],
        backgroundColor: "rgba(255, 159, 64, 0.7)",
      },
    ],
  },
  month: {
    labels: ["Clare", "Richard", "Shaun", "Candice"],
    datasets: [
      {
        label: "Orders",
        data: [300, 280, 210, 320],
        backgroundColor: "rgba(54, 162, 235, 0.7)",
      },
      {
        label: "Quotes Sent",
        data: [150, 140, 100, 160],
        backgroundColor: "rgba(255, 159, 64, 0.7)",
      },
    ],
  },
  quarter: {
    labels: ["Clare", "Richard", "Shaun", "Candice"],
    datasets: [
      {
        label: "Orders",
        data: [900, 850, 600, 950],
        backgroundColor: "rgba(54, 162, 235, 0.7)",
      },
      {
        label: "Quotes Sent",
        data: [450, 400, 300, 500],
        backgroundColor: "rgba(255, 159, 64, 0.7)",
      },
    ],
  },
  year: {
    labels: ["Clare", "Richard", "Shaun", "Candice"],
    datasets: [
      {
        label: "Orders",
        data: [3600, 3400, 2800, 3700],
        backgroundColor: "rgba(54, 162, 235, 0.7)",
      },
      {
        label: "Quotes Sent",
        data: [1800, 1700, 1400, 1900],
        backgroundColor: "rgba(255, 159, 64, 0.7)",
      },
    ],
  },
};

export const goalsData = {
  teamGoals: [
    "Reach 50 total CSIs for the day",
    "Follow up on all pending quotes",
    "Plan Easter gifts for customers",
  ],
  individualGoals: [
    { name: "Clare", goal: "Focus on new fabrication leads" },
    { name: "Richard", goal: "Close 3 pending deals" },
    { name: "Shaun", goal: "Review and update quotations" },
    { name: "Candice", goal: "Schedule production line visits" },
  ],
};
export interface CompanyInfo {
  company: string;
  quotesSent: boolean;
  quotesReceived: boolean;
  notes: string;
  email: string;
  phone: string;
}

// All 32 companies with full details (no "amount" field)
export const allCompanies: CompanyInfo[] = [
  {
    company: "A&R Engineering",
    quotesSent: true,
    quotesReceived: false,
    notes: "We took too long/price",
    email: "contact@arengineering.com",
    phone: "021-111-0001",
  },
  {
    company: "Aberdare Cables",
    quotesSent: true,
    quotesReceived: true,
    notes: "Very little laser work",
    email: "info@aberdarecables.com",
    phone: "021-111-0002",
  },
  {
    company: "Aco Systems",
    quotesSent: true,
    quotesReceived: false,
    notes: "Expecting orders",
    email: "sales@acosystems.com",
    phone: "021-111-0003",
  },
  {
    company: "Advanced Poles",
    quotesSent: true,
    quotesReceived: true,
    notes: "Price issue but we revised",
    email: "support@advancedpoles.com",
    phone: "021-111-0004",
  },
  {
    company: "Alpha Automation",
    quotesSent: true,
    quotesReceived: true,
    notes: "New Company",
    email: "hello@alphaautomation.com",
    phone: "021-111-0005",
  },
  {
    company: "Bok Implemente",
    quotesSent: true,
    quotesReceived: true,
    notes: "Getting orders",
    email: "orders@bokimplemente.com",
    phone: "021-111-0006",
  },
  {
    company: "Darvan Brenco",
    quotesSent: true,
    quotesReceived: true,
    notes: "Getting orders",
    email: "contact@darvanbrenco.com",
    phone: "021-111-0007",
  },
  {
    company: "DGE",
    quotesSent: true,
    quotesReceived: false,
    notes: "Short time",
    email: "info@dge.com",
    phone: "021-111-0008",
  },
  {
    company: "Dormas",
    quotesSent: false,
    quotesReceived: false,
    notes: "Trying to get on board",
    email: "sales@dormas.com",
    phone: "021-111-0009",
  },
  {
    company: "Elegantline",
    quotesSent: true,
    quotesReceived: false,
    notes: "Pricing issues",
    email: "contact@elegantline.com",
    phone: "021-111-0010",
  },
  {
    company: "Enclodon",
    quotesSent: true,
    quotesReceived: true,
    notes: "Getting orders",
    email: "info@enclodon.com",
    phone: "021-111-0011",
  },
  {
    company: "F Bruton",
    quotesSent: true,
    quotesReceived: false,
    notes: "Pricing issues",
    email: "support@fbruton.com",
    phone: "021-111-0012",
  },
  {
    company: "Fuelco",
    quotesSent: true,
    quotesReceived: true,
    notes: "Getting orders",
    email: "sales@fuelco.com",
    phone: "021-111-0013",
  },
  {
    company: "Funsunzi Steel",
    quotesSent: true,
    quotesReceived: false,
    notes: "New Company",
    email: "info@funsunzisteel.com",
    phone: "021-111-0014",
  },
  {
    company: "Hinteregger",
    quotesSent: false,
    quotesReceived: false,
    notes: "Short time",
    email: "contact@hinteregger.com",
    phone: "021-111-0015",
  },
  {
    company: "KW Bread",
    quotesSent: true,
    quotesReceived: true,
    notes: "Stainless Client - we no quoted",
    email: "sales@kwbread.com",
    phone: "021-111-0016",
  },
  {
    company: "Liquid Movers",
    quotesSent: true,
    quotesReceived: true,
    notes: "Getting orders",
    email: "info@liquidmovers.com",
    phone: "021-111-0017",
  },
  {
    company: "M&P Bodies",
    quotesSent: true,
    quotesReceived: true,
    notes: "Pricing issues/Quoting time",
    email: "support@mpbodies.com",
    phone: "021-111-0018",
  },
  {
    company: "Marce FF Tech",
    quotesSent: true,
    quotesReceived: false,
    notes: "New Company",
    email: "info@marcefftech.com",
    phone: "021-111-0019",
  },
  {
    company: "MHP",
    quotesSent: false,
    quotesReceived: false,
    notes: "Reluctant to Move",
    email: "contact@mhp.com",
    phone: "021-111-0020",
  },
  {
    company: "Micron Labs",
    quotesSent: false,
    quotesReceived: false,
    notes: "Part of Darvan Brenco",
    email: "info@micronlabs.com",
    phone: "021-111-0021",
  },
  {
    company: "Micron Weighing",
    quotesSent: true,
    quotesReceived: false,
    notes: "Pricing Issue",
    email: "support@micronweighing.com",
    phone: "021-111-0022",
  },
  {
    company: "Multi Works",
    quotesSent: true,
    quotesReceived: true,
    notes: "Getting orders",
    email: "info@multiworks.com",
    phone: "021-111-0023",
  },
  {
    company: "NU Debt",
    quotesSent: true,
    quotesReceived: true,
    notes: "Ad Hoc",
    email: "contact@nudebt.com",
    phone: "021-111-0024",
  },
  {
    company: "Prime Trailers",
    quotesSent: true,
    quotesReceived: true,
    notes: "Only giving us small orders",
    email: "sales@primetrailers.com",
    phone: "021-111-0025",
  },
  {
    company: "Rampmatic",
    quotesSent: true,
    quotesReceived: true,
    notes: "New Company",
    email: "info@rampmatic.com",
    phone: "021-111-0026",
  },
  {
    company: "SAME Water",
    quotesSent: true,
    quotesReceived: false,
    notes: "Took too long to quote - HELP!",
    email: "support@samewater.com",
    phone: "021-111-0027",
  },
  {
    company: "Serco",
    quotesSent: true,
    quotesReceived: false,
    notes: "Long vetting process",
    email: "info@serco.com",
    phone: "021-111-0028",
  },
  {
    company: "Sowerby Engineering",
    quotesSent: true,
    quotesReceived: true,
    notes: "Getting orders",
    email: "sales@sowerbyeng.com",
    phone: "021-111-0029",
  },
  {
    company: "Steelnox",
    quotesSent: true,
    quotesReceived: true,
    notes: "Getting orders",
    email: "info@steelnox.com",
    phone: "021-111-0030",
  },
  {
    company: "Universal Automated",
    quotesSent: true,
    quotesReceived: true,
    notes: "Getting orders",
    email: "contact@universalautomated.com",
    phone: "021-111-0031",
  },
  {
    company: "Zuiderwindt",
    quotesSent: true,
    quotesReceived: true,
    notes: "Getting orders",
    email: "info@zuiderwindt.com",
    phone: "021-111-0032",
  },
]

// ----- 3. Build team data from dummyData -----
export interface TeamRow {
  id: number;
  name: string;
  cgi: number;
  ordersReceived: number;
  quotesSent: number;
  quotesReceived: number;
  lastUpdate: string;
  status: string;
  companiesData: CompanyInfo[];
}

// Distribute companies among 4 team members.
// For example, Clare gets 5 companies, Richard gets 7, Shaun gets 0, and Candice gets the remaining 20.
const TEAM_MEMBERS = ["Clare", "Richard", "Shaun", "Candice"]
const clareCompanies = allCompanies.slice(0, 5)       // 5 companies
const richardCompanies = allCompanies.slice(5, 12)      // 7 companies
const shaunCompanies: CompanyInfo[] = []                // 0 companies
const candiceCompanies = allCompanies.slice(12, 32)     // 20 companies

const userCompanies: CompanyInfo[][] = [
  clareCompanies,
  richardCompanies,
  shaunCompanies,
  candiceCompanies,
]

export const ROW_DATA: TeamRow[] = TEAM_MEMBERS.map((name, idx) => {
  const companiesData = userCompanies[idx]
  const cgi = companiesData.length // CGI equals number of companies reached
  const quotesSentCount = companiesData.filter(c => c.quotesSent).length
  const quotesReceivedCount = companiesData.filter(c => c.quotesReceived).length
  return {
    id: idx + 1,
    name,
    cgi,
    ordersReceived: cgi, // For demo: each company counts as one order
    quotesSent: quotesSentCount,
    quotesReceived: quotesReceivedCount,
    lastUpdate: "2025-04-10 09:00",
    status: cgi === 0 ? "Inactive 😢" : "Active",
    companiesData,
  }
})