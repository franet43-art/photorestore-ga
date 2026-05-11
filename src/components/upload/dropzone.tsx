"use client"

import { useState, useRef, DragEvent, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { photoSchema } from "@/lib/validators/photo"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function Dropzone() {
  const router = useRouter()
  const [dragState, setDragState] = useState<"idle" | "drag-over" | "uploading" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragState !== "uploading") {
      setDragState("drag-over")
    }
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragState !== "uploading") {
      setDragState("idle")
    }
  }

  const validateAndUpload = (file: File) => {
    setErrorMessage(null)
    
    // Validation client-side avec Zod
    const validationResult = photoSchema.safeParse({ file })
    if (!validationResult.success) {
      setErrorMessage(validationResult.error.issues[0]?.message || "Fichier invalide.")
      setDragState("error")
      return
    }

    uploadFile(file)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (dragState === "uploading") return
    
    setDragState("idle")
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      validateAndUpload(files[0])
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0])
    }
  }

  const uploadFile = (file: File) => {
    setDragState("uploading")
    setProgress(0)

    // Utilisation de XMLHttpRequest pour suivre la progression (fetch ne supporte pas onprogress)
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/upload", true)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100)
        setProgress(percentComplete)
      }
    }

    xhr.onload = async () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          if (response.orderId) {
            // Déclenchement manuel de la restauration depuis le frontend
            const restoreRes = await fetch('/api/restore', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: response.orderId })
            })
            const restoreData = await restoreRes.json()
            console.log('RESTORE RESPONSE:', JSON.stringify(restoreData, null, 2))

            if (restoreRes.ok && restoreData.previewAUrl) {
              sessionStorage.setItem(
                `pr_restore_${restoreData.orderId}`,
                JSON.stringify({ previewAUrl: restoreData.previewAUrl })
              )
            }

            router.push(`/preview/${response.orderId}`)
          } else {
            throw new Error("ID de commande manquant.")
          }
        } catch (error) {
          setErrorMessage("Erreur lors de la lecture de la réponse du serveur.")
          setDragState("error")
        }
      } else {
        try {
          const response = JSON.parse(xhr.responseText)
          setErrorMessage(response.error || "Erreur serveur.")
        } catch {
          setErrorMessage("Une erreur est survenue lors du téléchargement.")
        }
        setDragState("error")
      }
    }

    xhr.onerror = () => {
      setErrorMessage("Erreur de connexion. Veuillez vérifier votre réseau.")
      setDragState("error")
    }

    const formData = new FormData()
    formData.append("file", file)
    xhr.send(formData)
  }

  return (
    <Card 
      className={`relative w-full overflow-hidden border-2 border-dashed p-12 transition-all flex flex-col items-center justify-center min-h-[300px] cursor-pointer ${
        dragState === "drag-over" ? "border-blue-500 bg-blue-50" : 
        dragState === "error" ? "border-red-500 bg-red-50" : 
        "border-slate-300 hover:bg-slate-50"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => dragState !== "uploading" && fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        accept="image/jpeg, image/png, image/webp" 
      />

      {dragState === "uploading" ? (
        <div className="flex w-full flex-col items-center space-y-4">
          <p className="text-lg font-medium text-slate-700">Téléchargement en cours...</p>
          <div className="w-full max-w-md overflow-hidden rounded-full bg-slate-200 h-2">
            <div 
              className="h-2 bg-blue-600 transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <p className="text-sm font-medium text-slate-500">{progress}%</p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-slate-100 p-4 shadow-sm">
            <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-slate-700">
              Cliquez pour sélectionner ou glissez-déposez
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Fichiers acceptés : JPG, PNG ou WebP. Taille maximale : 10 Mo.
            </p>
          </div>
          {dragState === "error" && errorMessage && (
            <p className="text-sm font-medium text-red-600 bg-red-100 px-3 py-1 rounded-md mt-2">
              {errorMessage}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
