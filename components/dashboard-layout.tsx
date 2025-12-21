"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUser, logout, getRoleName, getDashboardPath, type User } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Heart, LogOut, UserIcon, Home, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { NotificationBell } from "@/components/notification-bell"
import { avatarService } from "@/lib/services/avatar.service"
import { authService } from "@/lib/services/auth.service"
interface DashboardLayoutProps {
  children: React.ReactNode
  navigation: Array<{
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
  }>
}

export function DashboardLayout({ children, navigation }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [avatarError, setAvatarError] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/login")
    } else {
      setUser(currentUser)
    }
  }, [router])

  // Fetch user avatar when user changes
  useEffect(() => {
    if (!user) {
      setAvatarUrl(undefined)
      return
    }

    // Try to get avatar from localStorage first
    const storedAvatar = localStorage.getItem('user_avatar')
    if (storedAvatar && avatarService.isValidAvatarUrl(storedAvatar)) {
      const url = avatarService.getAvatarUrl(storedAvatar)
      setAvatarUrl(url)
    } else {
      // If no stored avatar, try to fetch from API
      fetchUserAvatar()
    }
  }, [user?.id])

  const fetchUserAvatar = async () => {
    try {
      const profile = await authService.getProfile()
      if (profile.avatar && avatarService.isValidAvatarUrl(profile.avatar)) {
        const url = avatarService.getAvatarUrl(profile.avatar)
        setAvatarUrl(url)
        // Store in localStorage for quick access
        localStorage.setItem('user_avatar', profile.avatar)
      } else {
        setAvatarUrl(undefined)
        localStorage.removeItem('user_avatar')
      }
    } catch (error) {
      console.error('Failed to fetch user avatar:', error)
      setAvatarUrl(undefined)
    }
  }

  // Reset avatar error when user or avatar URL changes
  useEffect(() => {
    setAvatarError(false)
  }, [user?.avatar, avatarUrl])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!user) {
    return null
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const dashboardPath = getDashboardPath(user.role)

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60" suppressHydrationWarning>
        <div className="flex h-16 items-center gap-4 px-6" suppressHydrationWarning>
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold">Diamond Health Clinic</h1>
              <p className="text-xs text-muted-foreground">{getRoleName(user.role)}</p>
            </div>
          </Link>

          <div className="flex-1" />


          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Trang chủ</span>
            </Button>
          </Link>
          <NotificationBell notificationHref="/notifications" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  {avatarUrl && !avatarError && (
                    <AvatarImage
                      src={avatarUrl}
                      alt={user.name}
                      onError={() => setAvatarError(true)}
                    />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {user.department && <p className="text-xs text-muted-foreground">{user.department}</p>}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user.role === 'patient' && (
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  Thông tin cá nhân
                </DropdownMenuItem>
              )}
              {dashboardPath && dashboardPath !== "/" && (
                <DropdownMenuItem onClick={() => router.push(dashboardPath)}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Trang của tôi
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex" suppressHydrationWarning>
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-card" suppressHydrationWarning>
          <nav className="flex-1 space-y-1 p-4" suppressHydrationWarning>
            {(() => {
              // Find the active navigation item
              // Priority: exact match > longest parent path match
              let activeHref: string | null = null

              // First, check for exact match
              const exactMatch = navigation.find(item => pathname === item.href)
              if (exactMatch) {
                activeHref = exactMatch.href
              } else {
                // If no exact match, find the longest parent path that matches
                const matchingParents = navigation.filter(item =>
                  pathname.startsWith(item.href + '/')
                )
                if (matchingParents.length > 0) {
                  // Sort by href length (longest first) and take the first one
                  activeHref = matchingParents.sort((a, b) => b.href.length - a.href.length)[0].href
                }
              }

              return navigation.map((item) => {
                const Icon = item.icon
                const isActive = item.href === activeHref

                return (
                  <Button
                    key={item.href}
                    asChild
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start transition-colors",
                      isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                    )}
                  >
                    <Link href={item.href} prefetch aria-current={isActive ? "page" : undefined}>
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  </Button>
                )
              })
            })()}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto" suppressHydrationWarning>
          <div className="container mx-auto p-6" suppressHydrationWarning>{children}</div>
        </main>
      </div>
    </div>
  )
}
