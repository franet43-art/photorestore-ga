"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

export default function Header() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const pathname = usePathname()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <header className="w-full border-b border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
      <Link href="/" className="text-lg font-extrabold text-slate-900">
        PhotoRestore<span className="text-blue-600">.ga</span>
      </Link>
      <div className="flex items-center gap-3">
        {userEmail ? (
          <>
            <span className="text-sm text-slate-500 hidden sm:block">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-600 hover:text-slate-900 underline"
            >
              Déconnexion
            </button>
          </>
        ) : (
          <Link
            href={`/login${pathname !== '/login' ? `?next=${encodeURIComponent(pathname)}` : ''}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Se connecter
          </Link>
        )}
      </div>
    </header>
  )
}
