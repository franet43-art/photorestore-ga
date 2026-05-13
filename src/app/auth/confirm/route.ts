import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      // Lier les commandes "guest" au compte utilisateur
      const cookieStore = await cookies()
      const guestId = cookieStore.get('guest_id')?.value
      if (guestId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('orders')
            .update({ user_id: user.id })
            .eq('guest_id', guestId)
            .is('user_id', null)
        }
      }

      // Redirection vers l'URL spécifiée ou vers la racine
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // En cas d'erreur de vérification, retour à la page de login avec l'erreur
  const errorUrl = request.nextUrl.clone()
  errorUrl.pathname = '/login'
  errorUrl.searchParams.set('error', 'expired')
  return NextResponse.redirect(errorUrl)
}
