import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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

  // IMPORTANT : Appel obligatoire à getUser() pour garantir le rafraîchissement de la session.
  // Sans cet appel, les cookies de session ne sont jamais renouvelés et l'utilisateur
  // est "déconnecté" à chaque nouvelle navigation serveur.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const path = url.pathname

  // Définition des routes protégées
  const isProtectedRoute = 
    path.startsWith('/dashboard') ||
    path.startsWith('/success') ||
    path.startsWith('/admin')
    
  const isLoginRoute = path === '/login'

  // Si non authentifié sur une route protégée → redirect /login
  if (!user && isProtectedRoute) {
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  // Si authentifié sur /login → redirect vers le `next` param ou /dashboard
  if (user && isLoginRoute) {
    const next = request.nextUrl.searchParams.get('next')
    // Éviter la boucle : si next est /login ou absent, aller au dashboard
    const destination = next && next !== '/login' ? next : '/dashboard'
    url.pathname = destination
    url.search = ''
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
