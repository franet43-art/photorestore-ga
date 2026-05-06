import { Metadata } from "next"
import Dropzone from "@/components/upload/dropzone"

export const metadata: Metadata = {
  title: "Envoyer une photo | PhotoRestore.ga",
  description: "Téléchargez votre ancienne photo pour la restaurer grâce à notre intelligence artificielle.",
}

export default function UploadPage() {
  return (
    <div className="flex min-h-screen flex-col items-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Restaurez votre photo
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Sélectionnez l'image que vous souhaitez raviver. Notre Intelligence Artificielle se chargera de nettoyer les rayures, d'améliorer la netteté et de restaurer les couleurs d'origine.
          </p>
        </div>
        
        <div className="mt-10">
          <Dropzone />
        </div>
        
      </div>
    </div>
  )
}
