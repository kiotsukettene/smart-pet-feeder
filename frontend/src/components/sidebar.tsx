"use client"
import { Book, Calendar, Camera, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  currentPath: string
  navigateTo: (path: string) => void
}

export function Sidebar({ currentPath, navigateTo }: SidebarProps) {
  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/schedule", label: "Feed Schedule", icon: Calendar },
    { path: "/camera", label: "Live Camera", icon: Camera },
    { path: "/history", label: "History", icon: Book},
  ]

  return (
    <div className="w-[260px] bg-white border-r border-gray-100 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2 font-semibold cursor-pointer" onClick={() => navigateTo("/")}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#FF7A5A" />
            <path d="M10 16H14M18 16H22M16 10V14M16 18V22" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-xl font-bold text-orange-500">PetFeeds</span>
        </div>
      </div>
      <div className="flex-1 py-6">
        <nav className="space-y-2 px-4">
          {navItems.map((item) => (
            <div
              key={item.path}
              onClick={() => navigateTo(item.path)}
              className={cn(
                "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium cursor-pointer relative",
                currentPath === item.path
                  ? "bg-orange-100 text-orange-500"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </div>
      
    </div>
  )
}

