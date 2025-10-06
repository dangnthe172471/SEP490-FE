"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Phone, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        isScrolled
          ? "border-border/60 bg-background shadow-md backdrop-blur-md supports-[backdrop-filter]:bg-background/80"
          : "border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      }`}
    >
      {/* Top bar */}
      <div className={`bg-primary text-primary-foreground transition-all duration-300 ${isScrolled ? "py-1" : "py-2"}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="font-medium">Hotline: 1900-xxxx</span>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Clock className="h-4 w-4" />
                <span>Thứ 2 - Chủ nhật: 7:00 - 20:00</span>
              </div>
            </div>
            <Link href="/login" className="transition-all hover:underline hover:opacity-80">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="container mx-auto px-4">
        <div
          className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? "h-14" : "h-16"}`}
        >
          <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
            <div className="flex items-center justify-center rounded-lg  transition-all hover:bg-primary/90">
              <img src="/images/logo.png" alt="Logo" className="h-15 w-15 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold leading-none text-foreground">Diamond Health</span>
              <span className="text-xs text-muted-foreground">Phòng khám đa khoa</span>
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/"
              className={`relative text-sm font-medium transition-all duration-200 hover:text-primary ${
                isActive("/") ? "text-primary" : ""
              }`}
            >
              Trang chủ
              {isActive("/") && <span className="absolute -bottom-[21px] left-0 h-0.5 w-full bg-primary" />}
            </Link>
            <Link
              href="/chuyen-khoa"
              className={`relative text-sm font-medium transition-all duration-200 hover:text-primary ${
                isActive("/chuyen-khoa") ? "text-primary" : ""
              }`}
            >
              Chuyên khoa
              {isActive("/chuyen-khoa") && <span className="absolute -bottom-[21px] left-0 h-0.5 w-full bg-primary" />}
            </Link>
            <Link
              href="/bac-si"
              className={`relative text-sm font-medium transition-all duration-200 hover:text-primary ${
                isActive("/bac-si") ? "text-primary" : ""
              }`}
            >
              Đội ngũ bác sĩ
              {isActive("/bac-si") && <span className="absolute -bottom-[21px] left-0 h-0.5 w-full bg-primary" />}
            </Link>
            <Link
              href="/danh-gia"
              className={`relative text-sm font-medium transition-all duration-200 hover:text-primary ${
                isActive("/danh-gia") ? "text-primary" : ""
              }`}
            >
              Đánh giá
              {isActive("/danh-gia") && <span className="absolute -bottom-[21px] left-0 h-0.5 w-full bg-primary" />}
            </Link>
            <Link
              href="/lien-he"
              className={`relative text-sm font-medium transition-all duration-200 hover:text-primary ${
                isActive("/lien-he") ? "text-primary" : ""
              }`}
            >
              Liên hệ
              {isActive("/lien-he") && <span className="absolute -bottom-[21px] left-0 h-0.5 w-full bg-primary" />}
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button className="hidden bg-secondary text-secondary-foreground transition-all hover:bg-secondary/90 hover:scale-105 md:inline-flex">
              Đặt lịch khám
            </Button>

            {/* Mobile menu button */}
            <button
              className="transition-all hover:scale-110 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="animate-in slide-in-from-top-2 border-t py-4 md:hidden">
            <nav className="flex flex-col gap-4">
              <Link
                href="/"
                className={`text-sm font-medium transition-all duration-200 hover:text-primary hover:translate-x-1 ${
                  isActive("/") ? "text-primary font-semibold" : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <Link
                href="/chuyen-khoa"
                className={`text-sm font-medium transition-all duration-200 hover:text-primary hover:translate-x-1 ${
                  isActive("/chuyen-khoa") ? "text-primary font-semibold" : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Chuyên khoa
              </Link>
              <Link
                href="/bac-si"
                className={`text-sm font-medium transition-all duration-200 hover:text-primary hover:translate-x-1 ${
                  isActive("/bac-si") ? "text-primary font-semibold" : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Đội ngũ bác sĩ
              </Link>
              <Link
                href="/danh-gia"
                className={`text-sm font-medium transition-all duration-200 hover:text-primary hover:translate-x-1 ${
                  isActive("/danh-gia") ? "text-primary font-semibold" : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Đánh giá
              </Link>
              <Link
                href="/lien-he"
                className={`text-sm font-medium transition-all duration-200 hover:text-primary hover:translate-x-1 ${
                  isActive("/lien-he") ? "text-primary font-semibold" : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Liên hệ
              </Link>
              <Button className="bg-secondary text-secondary-foreground transition-all hover:bg-secondary/90 hover:scale-105">
                Đặt lịch khám
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
