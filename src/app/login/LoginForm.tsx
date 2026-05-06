"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/dashboard"
  
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createSupabaseBrowserClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
        },
      })

      if (error) throw error
      setIsSent(true)
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'envoi du lien.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSent) {
    return (
      <Card className="w-full shadow-md border-slate-200">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-slate-900">Lien envoyé !</CardTitle>
          <CardDescription>
            Vérifiez votre boîte de réception (et vos spams).
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-slate-600">
          Nous vous avons envoyé un lien magique sécurisé à l'adresse <span className="font-medium text-slate-900">{email}</span>. Cliquez dessus pour vous connecter instantanément.
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="outline" onClick={() => setIsSent(false)}>
            Réessayer avec une autre adresse
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-md border-slate-200">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Entrez votre email pour recevoir un lien magique de connexion. Pas de mot de passe à retenir !
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Adresse email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="nom@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>
          {error && (
            <div className="text-sm text-red-500 font-medium">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
            disabled={isSubmitting || !email}
          >
            {isSubmitting ? "Envoi en cours..." : "Recevoir mon lien"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
