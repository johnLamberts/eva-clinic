"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, LogOut, Menu, Search, Settings, User } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

export function DashboardHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 -ml-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/">
              <h1 className="font-serif text-xl tracking-tight">ClinicFlow</h1>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            <Link to="/dashboard" className="text-sm font-medium text-foreground">
              Dashboard
            </Link>
            <Link
              to="/dashboard/patients"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Patients
            </Link>
            <Link
              to="/dashboard/appointments"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Appointments
            </Link>
            <Link
              to="/dashboard/staff"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Staff
            </Link>
            <Link
              to="/dashboard/reports"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Reports
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full"></span>
              <span className="sr-only">Notifications</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Dr. Sarah Johnson</span>
                    <span className="text-xs text-muted-foreground">sarah@clinic.com</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/login">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 flex flex-col gap-4 border-t border-border pt-4">
            <Link to="/dashboard" className="text-sm font-medium text-foreground">
              Dashboard
            </Link>
            <Link
              to="/dashboard/patients"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Patients
            </Link>
            <Link
              to="/dashboard/appointments"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Appointments
            </Link>
            <Link
              to="/dashboard/staff"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Staff
            </Link>
            <Link
              to="/dashboard/reports"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Reports
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
