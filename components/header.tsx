"use client"

import { Button } from "@/components/ui/button"
import { Menu, X, Phone, Clock, User as UserIcon, LogOut, MessageCircle, Calendar, Home } from "lucide-react"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getCurrentUser, getDashboardPath, logout, getRoleName, User } from "@/lib/auth"
import { avatarService } from "@/lib/services/avatar.service"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationBell } from "@/components/notification-bell"
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userAvatar, setUserAvatar] = useState<string>('/placeholder-user.jpg')
  const [isClient, setIsClient] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const dashboardPath = currentUser ? getDashboardPath(currentUser.role) : null

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
    const user = getCurrentUser()
    setCurrentUser(user)

    const handleStorageChange = () => {
      const newUser = getCurrentUser()
      setCurrentUser(newUser)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Fetch user avatar when user changes
  useEffect(() => {
    if (currentUser) {
      // Always set default avatar first
      setUserAvatar('/placeholder-user.jpg')

      // Try to get avatar from localStorage first
      const storedAvatar = localStorage.getItem('user_avatar')
      if (storedAvatar) {
        const avatarUrl = avatarService.getAvatarUrl(storedAvatar)
        setUserAvatar(avatarUrl)
      } else {
        // If no stored avatar, try to fetch from API
        fetchUserAvatar()
      }
    } else {
      setUserAvatar('/placeholder-user.jpg')
    }
  }, [currentUser])

  const fetchUserAvatar = async () => {
    try {
      const { authService } = await import('@/lib/services/auth.service')
      const profile = await authService.getProfile()
      const avatarUrl = avatarService.getAvatarUrl(profile.avatar)
      setUserAvatar(avatarUrl)

      // Store in localStorage for quick access (even if null)
      if (profile.avatar) {
        localStorage.setItem('user_avatar', profile.avatar)
      } else {
        localStorage.removeItem('user_avatar')
      }
    } catch (error) {
      console.error('Failed to fetch user avatar:', error)
      // Keep default avatar on error - don't change it
      // setUserAvatar('/placeholder-user.jpg') // Already set in useEffect
    }
  }

  const handleLogout = () => {
    // Clear all data
    setCurrentUser(null)
    setUserAvatar('/placeholder-user.jpg')
    localStorage.removeItem('user_avatar')
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
      { href: "/lien-he", label: "Liên hệ" },
    ]

    // // Quick way back to the user's dashboard when they land on homepage
    // if (dashboardPath && dashboardPath !== "/") {
    //   items.unshift({ href: dashboardPath, label: "Trang của tôi" })
    // }

    // Add chat link for patient role only
    if (currentUser && currentUser.role === 'patient') {
      items.push({ href: "/chat", label: "Chat hỗ trợ" })
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
      suppressHydrationWarning
    >
      {/* Top bar */}
      <div className={`bg-primary text-primary-foreground transition-all duration-300 ${isScrolled ? "py-1" : "py-2"}`} suppressHydrationWarning>
        <div className="container mx-auto px-4" suppressHydrationWarning>
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm" suppressHydrationWarning>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="font-medium">Hotline: 0978-468-063</span>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Clock className="h-4 w-4" />
                <span>Thứ 2 - Chủ nhật: 8:00 - 22:00</span>
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
      <div className="container mx-auto px-4" suppressHydrationWarning>
        <div
          className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? "h-14" : "h-16"}`}
          suppressHydrationWarning
        >
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 transition-transform hover:scale-105"
          >
            <div className="flex items-center justify-center rounded-lg transition-all hover:bg-primary/90">
              <img src="/images/logo.png" alt="Logo" className="h-24 w-24 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold leading-none text-foreground">Diamond Health</span>
              <span className="text-xs text-muted-foreground">Phòng khám đa khoa</span>
            </div>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-6 md:flex" suppressHydrationWarning>
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


          <div className="flex items-center gap-4" suppressHydrationWarning>
            {!isClient ? (
              <LoginButton className="hidden bg-secondary text-secondary-foreground transition-all hover:bg-secondary/90 hover:scale-105 md:inline-flex" />
            ) : currentUser ? (
              <div className="flex items-center gap-3">

                <NotificationBell notificationHref="/notifications" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userAvatar} alt={currentUser.name} />
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
                    {currentUser.role === 'patient' && (
                      <DropdownMenuItem onClick={() => router.push('/profile')}>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Hồ sơ</span>
                      </DropdownMenuItem>
                    )}
                    {dashboardPath && dashboardPath !== "/" && (
                      <DropdownMenuItem onClick={() => router.push(dashboardPath)}>
                        <Home className="mr-2 h-4 w-4" />
                        <span>Trang của tôi</span>
                      </DropdownMenuItem>
                    )}
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Đăng xuất</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
          <div className="animate-in slide-in-from-top-2 border-t py-4 md:hidden" suppressHydrationWarning>
            <nav className="flex flex-col gap-4" suppressHydrationWarning>
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
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userAvatar} alt={currentUser.name} />
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
                    {dashboardPath && dashboardPath !== "/" && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          router.push(dashboardPath)
                          setMobileMenuOpen(false)
                        }}
                        className="w-full justify-start bg-primary/10 hover:bg-primary/20"
                      >
                        <Home className="mr-2 h-4 w-4" />
                        Trang của tôi
                      </Button>
                    )}
                    {currentUser.role === 'patient' && (
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
                    )}

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
