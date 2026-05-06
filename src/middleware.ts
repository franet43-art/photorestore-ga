import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Création de la réponse initiale
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Utilisation de createServerClient directement pour le middleware
  // car nous devons manipuler les cookies de la requête et de la réponse
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Mise à jour des cookies sur la requête pour les appels suivants
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Mise à jour de la réponse
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Appel obligatoire à getUser() au lieu de getSession() pour garantir l'état de l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const path = url.pathname

  // Définition des routes
  const isProtectedRoute = 
    path.startsWith('/dashboard') ||
    path.startsWith('/upload') ||
    path.startsWith('/preview') ||
    path.startsWith('/success') ||
    path.startsWith('/admin')
    
  const isLoginRoute = path === '/login'

  // Si non authentifié sur une route protégée → redirect /login
  if (!user && isProtectedRoute) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si authentifié sur /login → redirect /dashboard
  if (user && isLoginRoute) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  // Exclure les fichiers internes de Next.js (_next), les images/assets statiques, le favicon et le cron
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
