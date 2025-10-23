"use client"

import { useState, useEffect } from "react"

interface DateFormatterProps {
  dateString?: string
  fallback?: string
  className?: string
}

export function DateFormatter({ 
  dateString, 
  fallback = "N/A", 
  className = "" 
}: DateFormatterProps) {
  const [formattedDate, setFormattedDate] = useState<string>(fallback)

  useEffect(() => {
    if (!dateString) {
      setFormattedDate(fallback)
      return
    }

    try {
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        setFormattedDate(date.toLocaleDateString("vi-VN"))
      } else {
        setFormattedDate(dateString)
      }
    } catch {
      setFormattedDate(dateString)
    }
  }, [dateString, fallback])

  return <span className={className}>{formattedDate}</span>
}

