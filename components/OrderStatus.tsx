"use client"

import { useState, useEffect } from "react"

interface OrderStatusProps {
  orders: number
}

export default function OrderStatus({ orders }: OrderStatusProps) {
  const [showEmoji, setShowEmoji] = useState(true)

  useEffect(() => {
    if (orders > 0) {
      const timer = setTimeout(() => setShowEmoji(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [orders])

  if (orders === 0) {
    return <span className="text-red-500 text-lg">😢</span>
  }
  return showEmoji ? (
    <span className="text-green-500 text-lg">😊</span>
  ) : (
    <span>{orders}</span>
  )
}
