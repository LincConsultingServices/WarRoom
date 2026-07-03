'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/src/components/admin-sidebar'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) {
      router.replace('/login')
      return
    }
    try {
      const parsed = JSON.parse(stored)
      if (parsed.role !== 'admin') {
        router.replace('/dashboard')
        return
      }
      setUser(parsed)
    } catch {
      router.replace('/login')
      return
    }
    setChecked(true)
  }, [router])

  if (!checked || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--color-chessboard-void)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-[color:var(--color-chessboard-gold)]/30 border-t-[color:var(--color-chessboard-gold)] rounded-full animate-spin" />
          <p
            className="text-sm text-[color:var(--color-chessboard-smoke)] tracking-[0.04em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Verifying credentials&hellip;
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shell bg-[color:var(--color-chessboard-void)] text-[color:var(--color-chessboard-ivory)] min-h-screen">
      <SidebarProvider>
        <AdminSidebar user={user} />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-[color:var(--color-chessboard-ash)]/20 bg-[color:var(--color-chessboard-rampart)]/60">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1 text-[color:var(--color-chessboard-smoke)] hover:text-[color:var(--color-chessboard-gold)]" />
              <Separator orientation="vertical" className="mr-2 h-4 bg-[color:var(--color-chessboard-ash)]/30" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink
                      href="/admin/cohorts"
                      className="text-[color:var(--color-chessboard-smoke)] hover:text-[color:var(--color-chessboard-gold)] text-xs tracking-[0.04em]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Admin
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block text-[color:var(--color-chessboard-ash)]/40" />
                  <BreadcrumbItem>
                    <BreadcrumbPage
                      className="text-[color:var(--color-chessboard-ivory)] text-xs tracking-[0.04em]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Management
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-[color:var(--color-chessboard-void)]">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
