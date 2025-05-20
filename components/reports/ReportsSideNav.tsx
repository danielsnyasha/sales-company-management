"use client";

import React from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  Send,
  Banknote,
} from "lucide-react";

interface ReportsSideNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function ReportsSideNav({ activeTab, onTabChange }: ReportsSideNavProps) {

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "sales-orders", label: "Sales Orders", icon: ShoppingCart },
    { id: "quotations", label: "Quotations", icon: CreditCard },
    { id: "csis", label: "CSIs", icon: Send },
    { id: "summary", label: "Summary", icon: Banknote },
  ];

  return (
    <nav className="flex flex-col py-10 px-6 space-y-3">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`flex items-center gap-3 text-left px-4 py-2 rounded-full max-w-[290px] transition-colors ${
            activeTab === id
              ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white h-10 font-semibold"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Icon size={18} />
          <span className="text-sm">{label}</span>
        </button>
      ))}
    </nav>
  );
}
