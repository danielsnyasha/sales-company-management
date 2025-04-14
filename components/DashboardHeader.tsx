

import Image from "next/image"
import Link from "next/link"

export default function DashboardHeader() {
  return (
    <header className="w-full bg-white shadow px-4 py-3 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Image
          src="/images/LSCVSSC.png"
          alt="LSCVSSC Logo"
          width={120}
          height={50}
          quality={100}
          priority
        />
      </div>

      {/* Right side */}
      <nav className="flex items-center space-x-4">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/team">Team</Link>
        <Link href="/activities">Events</Link>
        <Link href="/add-customer">Post</Link>
        <Link href="/reports">Reports</Link>
        <Link href="#">Calendar</Link>
        <Link href="#">Gallery</Link>

        <Link href="/companies">Companies</Link>
      </nav>
    </header>
  )
}
