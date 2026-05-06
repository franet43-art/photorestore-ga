import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { photoSchema } from "@/lib/validators/photo"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Vérification de la session
    if (!user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 })
    }

    // TÂCHE 1 — Rate limiting (5 requêtes / 60s)
    const { rateLimit } = await import("@/lib/rate-limit")
    const rl = rateLimit(user.id, 5, 60_000)
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
      const errorMessage = validationResult.error.errors[0]?.message || "Fichier invalide."
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const validFile = validationResult.data.file
    const ext = validFile.name.split('.').pop()
    const uniqueFilename = `${crypto.randomUUID()}.${ext}`
    const uploadPath = `${user.id}/${uniqueFilename}`

    // Upload vers Supabase Storage bucket 'uploads'
    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(uploadPath, validFile, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: "Erreur lors du téléchargement du fichier." }, { status: 500 })
    }

    // Création de l'entrée dans la table 'orders'
    const { data: orderData, error: dbError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
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

    return NextResponse.json({ orderId: orderData.id, uploadPath }, { status: 200 })

  } catch (error) {
    console.error("Upload handler error:", error)
    return NextResponse.json({ error: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}
