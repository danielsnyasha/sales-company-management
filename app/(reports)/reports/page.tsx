"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/* ───────── shared layout pieces ───────── */
import DashboardHeader          from "@/components/DashboardHeader";
import ReportsSideNav           from "@/components/reports/ReportsSideNav";
import ReportsSlideshowBanner   from "@/components/reports/ReportsSlideshowBanner";

/* ───────── report sections ───────── */
import OverallSection    from "@/components/reports/OverallSection";
import SalesOrdersSection from "@/components/reports/SalesOrdersSection";
import QuotationsSection  from "@/components/reports/QuotationsSection";
import CsisSection        from "@/components/reports/CsisSection";
import SummarySection     from "@/components/reports/SummarySection";  // ← user-centred LoW report

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* header */}
      <DashboardHeader />

      {/* gradient KPI slideshow banner */}
      <ReportsSlideshowBanner />

      {/* overlay nav-bar sitting on banner */}
      <div className="relative -mt-14">
        <div className="bg-gradient-to-r from-blue-600 to-purple-500 pl-20 rounded-t-3xl pt-4 px-6 w-full h-20 mx-auto flex items-start">
          <button
            onClick={() => history.back()}
            className="rounded-full border border-gray-50/50 p-1 mr-10 -mt-1"
          >
            <ArrowLeft size={20} className="text-white/80" />
          </button>

          <Link href="/reports/overview" className="text-white text-sm underline hover:text-red-50">
            Reports Dashboard
          </Link>
          <span className="text-white mx-2">/</span>
          <span className="text-white text-sm capitalize">{activeTab.replace("-", " ")}</span>
        </div>

        {/* white spacer that rounds the bottom of banner */}
        <div className="bg-gray-100 rounded-t-3xl -mt-8 pt-8 w-full" />

        {/* main content area */}
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex min-h-[700px]">
            {/* side-navigation */}
            <aside className="w-1/4 mr-6">
              <ReportsSideNav activeTab={activeTab} onTabChange={setActiveTab} />
            </aside>

            {/* dynamic section */}
            <main className="w-3/4 space-y-8 mb-10">
              {activeTab === "overview" && (
                <>
                  <OverallSection />
                  <SummarySection /> {/* quick snapshot inside overview */}
                </>
              )}

              {activeTab === "sales-orders" && <SalesOrdersSection />}
              {activeTab === "quotations"   && <QuotationsSection />}
              {activeTab === "csis"         && <CsisSection />}

              {/* NEW ROUTE: user-centred Line-of-Work summary */}
              {activeTab === "summary"      && <SummarySection />}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
