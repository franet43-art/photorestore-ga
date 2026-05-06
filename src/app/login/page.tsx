import { Metadata } from "next"
import LoginForm from "./LoginForm"

export const metadata: Metadata = {
  title: "Connexion | PhotoRestore.ga",
  description: "Connectez-vous à votre espace PhotoRestore.ga pour restaurer vos anciennes photos.",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            PhotoRestore<span className="text-blue-600">.ga</span>
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Ravivez vos anciens souvenirs en quelques clics
          </p>
        </div>
        
        <LoginForm />
        
      </div>
    </div>
  )
}
