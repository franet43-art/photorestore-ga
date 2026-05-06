import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { photoSchema } from "@/lib/validators/photo"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const cookieStore = await cookies()
    
    let guestId = cookieStore.get("guest_id")?.value
    const isGuest = !user

    // Si pas de user et pas de guestId, on en génère un
    if (isGuest && !guestId) {
      guestId = crypto.randomUUID()
    }

    const rateLimitIdentifier = user?.id || guestId || request.headers.get('x-forwarded-for') || "anonymous"

    // TÂCHE 1 — Rate limiting (5 requêtes / 60s)
    const { rateLimit } = await import("@/lib/rate-limit")
    const rl = await rateLimit(rateLimitIdentifier, 5, 60_000)
    if (!rl.success) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans une minute." },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 })
    }

    // Validation Zod côté serveur
    const validationResult = photoSchema.safeParse({ file })
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || "Fichier invalide."
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const validFile = validationResult.data.file
    const ext = validFile.name.split('.').pop()
    const uniqueFilename = `${crypto.randomUUID()}.${ext}`
    
    // Chemin de stockage : dossier user ou dossier guest
    const ownerId = user?.id || `guest_${guestId}`
    const uploadPath = `${ownerId}/${uniqueFilename}`

    // Upload vers Supabase Storage bucket 'uploads'
    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(uploadPath, validFile, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error detail:", uploadError.message)
      
      let clientErrorMessage = "Erreur lors du téléchargement du fichier."
      if (uploadError.message.includes("bucket not found")) {
        clientErrorMessage = "Configuration serveur incorrecte (bucket manquant)."
      } else if (uploadError.message.includes("Payload Too Large") || uploadError.message.includes("413")) {
        clientErrorMessage = "Le fichier est trop volumineux."
      } else if (uploadError.message.includes("permission denied")) {
        clientErrorMessage = "Permissions insuffisantes pour uploader."
      }

      return NextResponse.json({ error: clientErrorMessage }, { status: 500 })
    }

    // Création de l'entrée dans la table 'orders'
    const { data: orderData, error: dbError } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id || null,
        guest_id: isGuest ? guestId : null,
        status: "uploaded",
        original_filename: validFile.name,
        upload_path: uploadPath,
      })
      .select("id")
      .single()

    if (dbError) {
      console.error("Database insert error:", dbError)
      // Nettoyage du fichier orphelin en cas d'erreur BDD
      await supabase.storage.from("uploads").remove([uploadPath])
      return NextResponse.json({ error: "Erreur lors de la création de la commande." }, { status: 500 })
    }

    const response = NextResponse.json({ orderId: orderData.id, uploadPath }, { status: 200 })

    // Si on a généré un nouveau guestId, on le fixe dans le cookie
    if (isGuest && !cookieStore.has("guest_id")) {
      response.cookies.set("guest_id", guestId!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 jours
        path: "/",
      })
    }

    return response

  } catch (error) {
    console.error("Upload handler error:", error)
    return NextResponse.json({ error: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}
