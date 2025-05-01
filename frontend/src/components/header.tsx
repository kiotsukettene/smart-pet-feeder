"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


interface HeaderProps {
  title: string
  navigateTo: (path: string) => void
}

export function Header({ title,  navigateTo }: HeaderProps) {
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false)

  

  return (
    <header className="bg-white py-4 px-6 flex items-center justify-between border-b border-gray-100 relative z-50">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      <div className="flex items-center gap-4">
       
        

        {/* Avatar Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full p-0"
            onClick={(e) => {
              e.preventDefault()
              setIsAvatarDropdownOpen(!isAvatarDropdownOpen)
            }}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://github.com/shadcn.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <span className="sr-only">Open user menu</span>
          </Button>

          {isAvatarDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
              <div className="px-4 py-3">
                <p className="text-sm font-medium">My Account</p>
              </div>
              <div className="border-t border-gray-100"></div>
              <div className="py-1">
                
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  onClick={() => {
                    navigateTo("/settings")
                    setIsAvatarDropdownOpen(false)
                  }}
                >
                  Settings
                </button>
              </div>
              <div className="border-t border-gray-100"></div>
              <div className="py-1">
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Log out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
