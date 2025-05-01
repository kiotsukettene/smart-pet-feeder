"use client"

import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"

interface LayoutProps {
  children: ReactNode
  currentPath: string
  navigateTo: (path: string) => void
  title: string
}

export function Layout({
  children,
  currentPath,
  navigateTo,
  title,
}: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPath={currentPath} navigateTo={navigateTo} />
      <div className="flex-1 flex flex-col">
        <Header title={title} navigateTo={navigateTo} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

