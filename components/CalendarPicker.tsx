"use client"

import { useState } from "react"

interface CalendarPickerProps {
  onDateChange: (date: string) => void;
}

export default function CalendarPicker({ onDateChange }: CalendarPickerProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to today's date in YYYY-MM-DD format
    return new Date().toISOString().split("T")[0]
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
    onDateChange(e.target.value)
  }

  return (
    <div className="p-4">
      <label className="font-bold mr-2">Select Date:</label>
      <input 
        type="date" 
        value={selectedDate} 
        onChange={handleChange} 
        className="border rounded px-2 py-1"
      />
    </div>
  )
}
