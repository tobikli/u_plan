"use client"

import Link from 'next/link'
import { ModeToggle } from '@/components/theme-toggle'
import { Card } from '@/components/ui/card' 
import { Button } from '@/components/ui/button'
import Logo from "@/public/uplan.svg";

export default function NotFound() {

  const handleHome = () => {
    window.location.href = "/";
  }

  return (
      <div className="flex flex-1 min-h-dvh items-center justify-center p-6 md:p-10 relative z-10">
        <div className="fixed top-5 right-5 z-50">
          <ModeToggle />
        </div>

        <div className="w-full max-w-sm">
          <Card className="mb-6 rounded-lg p-6 text-center shadow-lg flex flex-col items-center gap-4">
            <Logo className="size-20 text-black dark:text-white" />
            <h1 className="text-2xl font-bold">404</h1>
            The site was not found.
            
            <Button variant="outline" onClick={handleHome}>
              Home
            </Button>
          </Card>
        </div>
      </div>
  )
}