"use client"

import { Button } from "@/components/ui/button"
import { Menu, X, Phone, Clock, User as UserIcon, LogOut, MessageCircle, Calendar } from "lucide-react"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getCurrentUser, logout, getRoleName, User } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isClient, setIsClient] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Handle client-side mounting and auth state
  useEffect(() => {
    setIsClient(true)
    setCurrentUser(getCurrentUser())

    const handleStorageChange = () => {
      setCurrentUser(getCurrentUser())
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleLogout = () => {
    // Clear all data
    setCurrentUser(null)
    logout()
    // logout() already redirects to home, no need for router.push
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const getNavItems = () => {
    const items = [
      { href: "/", label: "Trang chủ" },
      { href: "/chuyen-khoa", label: "Chuyên khoa" },
      { href: "/dich-vu", label: "Dịch vụ" },
      { href: "/bac-si", label: "Đội ngũ bác sĩ" },
      { href: "/danh-gia", label: "Đánh giá" },
      { href: "/lien-he", label: "Liên hệ" },
    ]

    // Add chat link for patient role only
    if (currentUser && currentUser.role === 'patient') {
      items.push({ href: "/chat", label: "Chat hỗ trợ" })
    }
    if (currentUser && currentUser.role === 'reception') {
      items.push({ href: "/reception", label: "Lễ tân" })
    }

    return items
  }

  const LoginButton = ({ className = "", isMobile = false }: { className?: string, isMobile?: boolean }) => (
    <Button
      onClick={() => {
        router.push('/login')
        if (isMobile) setMobileMenuOpen(false)
      }}
      className={className}
    >
      Đăng nhập
    </Button>
  )

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${isScrolled
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
            {!isClient ? null : currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Xin chào, <span className="font-medium">{currentUser.name}</span>
                </span>
                <span className="text-xs opacity-80">
                  ({getRoleName(currentUser.role)})
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="container mx-auto px-4">
        <div
          className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? "h-14" : "h-16"}`}
        >
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 transition-transform hover:scale-105"
          >
            <div className="flex items-center justify-center rounded-lg transition-all hover:bg-primary/90">
              <img src="/images/logo.png" alt="Logo" className="h-15 w-15 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold leading-none text-foreground">Diamond Health</span>
              <span className="text-xs text-muted-foreground">Phòng khám đa khoa</span>
            </div>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            {getNavItems().map((item) => {
              const isChatItem = item.href === '/chat'
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`relative text-sm font-medium transition-all duration-200 hover:text-primary ${isActive(item.href) ? "text-primary" : ""
                    } ${isChatItem ? "flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20" : ""
                    }`}
                >
                  {isChatItem && <MessageCircle className="h-3 w-3" />}
                  {item.label}
                  {isActive(item.href) && !isChatItem && <span className="absolute -bottom-[21px] left-0 h-0.5 w-full bg-primary" />}
                </button>
              )
            })}
          </nav>

          <div className="flex items-center gap-4">
            {!isClient ? (
              <LoginButton className="hidden bg-secondary text-secondary-foreground transition-all hover:bg-secondary/90 hover:scale-105 md:inline-flex" />
            ) : currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {getRoleName(currentUser.role)}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Hồ sơ</span>
                  </DropdownMenuItem>
                  {currentUser.role === 'patient' && (
                    <>
                      <DropdownMenuItem onClick={() => router.push('/patient/appointments')}>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Lịch hẹn</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/chat')}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        <span>Chat hỗ trợ</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  {currentUser.role === 'reception' && (
                    <DropdownMenuItem onClick={() => router.push('/reception')}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      <span>Lễ tân</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <LoginButton className="hidden bg-secondary text-secondary-foreground transition-all hover:bg-secondary/90 hover:scale-105 md:inline-flex" />
            )}

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
              {getNavItems().map((item) => {
                const isChatItem = item.href === '/chat'
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href)
                      setMobileMenuOpen(false)
                    }}
                    className={`text-sm font-medium transition-all duration-200 hover:text-primary hover:translate-x-1 ${isActive(item.href) ? "text-primary font-semibold" : ""
                      } ${isChatItem ? "flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg hover:bg-primary/20" : ""
                      }`}
                  >
                    {isChatItem && <MessageCircle className="h-4 w-4" />}
                    {item.label}
                  </button>
                )
              })}
              {!isClient ? (
                <LoginButton
                  isMobile={true}
                  className="bg-secondary text-secondary-foreground transition-all hover:bg-secondary/90 hover:scale-105 w-full"
                />
              ) : currentUser ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{currentUser.name}</p>
                      <p className="text-xs text-muted-foreground">{getRoleName(currentUser.role)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        router.push('/profile')
                        setMobileMenuOpen(false)
                      }}
                      className="w-full justify-start"
                    >
                      <UserIcon className="mr-2 h-4 w-4" />
                      Hồ sơ
                    </Button>

                    {currentUser.role === 'patient' && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          router.push('/chat')
                          setMobileMenuOpen(false)
                        }}
                        className="w-full justify-start bg-primary/10 hover:bg-primary/20"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Chat hỗ trợ
                      </Button>
                    )}
                    {currentUser.role === 'reception' && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          router.push('/reception')
                          setMobileMenuOpen(false)
                        }}
                        className="w-full justify-start bg-primary/10 hover:bg-primary/20"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Lễ tân
                      </Button>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </Button>
                </div>
              ) : (
                <LoginButton
                  isMobile={true}
                  className="bg-secondary text-secondary-foreground transition-all hover:bg-secondary/90 hover:scale-105 w-full"
                />
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
