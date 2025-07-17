import Image from "next/image";
import Link from "next/link";
import { Menu, Home, Users, Table, Plus, BarChart, Target, Image as Gallery, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";


const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: <Home size={18} /> },
  { href: "/team", label: "Team", icon: <Users size={18} /> },
  { href: "/activities", label: "Data-Table", icon: <Table size={18} /> },
  { href: "/add-customer", label: "Post", icon: <Plus size={18} /> },
  { href: "/reports", label: "Reports", icon: <BarChart size={18} /> },
  { href: "/targets", label: "Targets", icon: <Target size={18} /> },
  { href: "#", label: "Gallery", icon: <Gallery size={18} /> },
  { href: "/companies", label: "Companies", icon: <Building2 size={18} /> },
];

export default function DashboardHeader() {
  return (
    <header className="w-full bg-gradient-to-r from-[#fff] via-[#6366f1] to-blue-700 relative shadow z-40">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/images/logolcv.png"
            alt="LSCVSSC Logo"
            width={120}
            height={50}
            quality={100}
            priority
            className="rounded-md"
          />
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1 px-3 py-2 rounded-md text-white/90 hover:bg-white/20 transition font-semibold text-sm"
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-gradient-to-b from-[#4f46e5] via-[#6366f1] to-[#a5b4fc] text-white">
              <div className="flex items-center gap-2 px-4 pt-4 pb-6 border-b border-white/10">
                <Image
                  src="/images/LSCVSSC.png"
                  alt="LSCVSSC Logo"
                  width={100}
                  height={40}
                  quality={90}
                  priority
                  className="rounded-md"
                />
              </div>
              <nav className="flex flex-col gap-1 mt-4 px-4">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-3 rounded-md text-white/90 hover:bg-white/20 transition font-semibold text-base"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Subtle texture or overlay (optional for extra style) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-15"
        style={{
          background: "url('/images/texture.svg'), linear-gradient(45deg,#fff2,#fff0)",
          backgroundBlendMode: "overlay, normal",
        }}
      />
    </header>
  );
}
