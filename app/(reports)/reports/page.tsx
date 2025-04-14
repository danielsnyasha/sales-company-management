"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Reusable components – please ensure these exist or adjust the paths:
import DashboardHeader from "@/components/DashboardHeader"; // Your shared header component

import ReportsSideNav from "@/components/reports/ReportsSideNav"; // Sidebar navigation for Reports
import ReportsSlideshowBanner from "@/components/reports/ReportsSlideshowBanner"; // Slideshow banner for report figures

// Report Sections – these are placeholders/stubs; replace with your actual components.
import SalesOrdersSection from "@/components/reports/SalesOrdersSection";
import QuotationsSection from "@/components/reports/QuotationsSection";
import CsisSection from "@/components/reports/CsisSection";
import SummarySection from "@/components/reports/SummarySection";
import OverallSection from "@/components/reports/OverallSection";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Top Navigation Header */}
      <DashboardHeader />

      {/* Gradient Banner – directly below header */}
      <ReportsSlideshowBanner />

      {/* Relative container to overlay the navigation bar on the banner */}
      <div className="relative -mt-14">
        {/* Navigation bar (banner-style) */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-500 pl-20 rounded-t-3xl pt-4 px-6 w-full h-20 mx-auto flex items-start justify-start -mt-2 cursor-pointer">
          <div className="rounded-full border border-gray-50/50 p-1 mr-10 flex -mt-1">
            <ArrowLeft size={20} className="text-white/80" />
          </div>
          <Link href="/reports/overview">
            <h1 className="text-white text-sm underline hover:text-md hover:text-red-50">
              Reports Dashboard
            </h1>
          </Link>
          <h1 className="text-white text-sm hover:text-md hover:text-red-50 ml-2">/</h1>
        </div>

        {/* Bar below the navigation – matches your example */}
        <div className="bg-gray-100 rounded-t-3xl -mt-8 rounded-b-3xl pt-8 px-6 w-full h-20 mx-auto" />

        {/* Main container: Sidebar + Main Content */}
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex min-h-[700px]">
            {/* Sidebar: Navigation for report sections */}
            <aside className="w-1/4 mr-6">
              <ReportsSideNav activeTab={activeTab} onTabChange={setActiveTab} />
            </aside>

            {/* Main content area: Displays a section based on the active tab */}
            <main className="w-3/4 space-y-8 mb-10">
              {activeTab === "overview" && (
                <>
                  {/* Slideshow banner with key figures for the reports */}
                  <OverallSection/>
                  {/* Overview / Summary section */}
                  <SummarySection />
                </>
              )}
              {activeTab === "sales-orders" && <SalesOrdersSection />}
              {activeTab === "quotations" && <QuotationsSection />}
              {activeTab === "csis" && <CsisSection />}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
