import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 1. NAVBAR */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-slate-100">
        <div className="text-xl font-bold text-slate-900 tracking-tight">
          PhotoRestore<span className="text-blue-600">.ga</span>
        </div>
        <Link href="/login">
          <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium">
            Se connecter
          </Button>
        </Link>
      </nav>

      {/* 2. SECTION HERO */}
      <section className="relative bg-slate-900 py-20 px-6 md:px-12 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Redonnez vie à vos photos de famille
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Téléchargez votre ancienne photo. Notre IA la restaure en haute définition en moins d'une minute.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link href="/upload">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white h-16 px-10 text-xl font-bold shadow-2xl transition-transform hover:scale-105">
                Restaurer une photo →
              </Button>
            </Link>
            <p className="text-sm text-slate-400">
              Paiement uniquement si vous êtes satisfait
            </p>
          </div>
        </div>
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-800 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* 3. SECTION COMMENT ÇA MARCHE */}
      <section className="py-24 px-6 md:px-12 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900">Comment ça marche ?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Étape 1 */}
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 font-bold text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">1. Envoyez votre photo</h3>
            <p className="text-slate-600">Sélectionnez une ancienne photo abîmée, déchirée ou en noir et blanc.</p>
          </div>
          {/* Étape 2 */}
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 font-bold text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">2. L'IA restaure en 60s</h3>
            <p className="text-slate-600">Notre algorithme traite l'image pour supprimer les défauts et améliorer la qualité.</p>
          </div>
          {/* Étape 3 */}
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 font-bold text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">3. Payez et téléchargez</h3>
            <p className="text-slate-600">Si vous aimez le résultat, payez en un clic et téléchargez votre photo en HD.</p>
          </div>
        </div>
      </section>

      {/* 4. SECTION TARIFS */}
      <section className="py-24 bg-slate-50 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Des tarifs accessibles, paiement après résultat</h2>
            <p className="text-slate-600">Choisissez la formule qui convient le mieux à vos souvenirs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Standard */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Standard</h3>
              <p className="text-slate-500 text-sm mb-6">Restauration fidèle en noir & blanc haute définition</p>
              <div className="text-4xl font-extrabold text-slate-900 mb-8">2 000 FCFA</div>
              <ul className="space-y-4 mb-10 flex-1">
                {["Suppression des rayures", "Amélioration de la netteté", "Export HD", "Paiement après prévisualisation"].map((item) => (
                  <li key={item} className="flex items-center text-slate-600 text-sm">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/upload">
                <Button className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white">Choisir Standard</Button>
              </Link>
            </div>
            {/* Colorisé */}
            <div className="bg-white p-8 rounded-3xl border-2 border-blue-600 shadow-xl relative flex flex-col">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest">
                Populaire
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Colorisé</h3>
              <p className="text-slate-500 text-sm mb-6">Restauration + colorisation réaliste</p>
              <div className="text-4xl font-extrabold text-slate-900 mb-8">3 500 FCFA</div>
              <ul className="space-y-4 mb-10 flex-1">
                {["Tous les avantages Standard", "Colorisation naturelle", "Équilibrage des tons", "Finition studio"].map((item) => (
                  <li key={item} className="flex items-center text-slate-600 text-sm">
                    <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/upload">
                <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white">Choisir Colorisé</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION PREUVE SOCIALE */}
      <section className="py-24 px-6 md:px-12 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900">Ils nous font confiance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Amadou", country: "Sénégal", text: "J'ai pu restaurer une photo de mon grand-père datant des années 50. Le résultat est incroyable, les détails du visage sont réapparus comme par magie." },
            { name: "Fatoumata", country: "Côte d'Ivoire", text: "Le service est ultra rapide. J'ai envoyé la photo, j'ai vu l'aperçu et j'ai payé par Wave. Tout s'est fait en moins de 2 minutes." },
            { name: "Moussa", country: "Mali", text: "La colorisation est très naturelle, on dirait que la photo a été prise hier. Merci PhotoRestore pour ce beau service !" }
          ].map((testimony, idx) => (
            <div key={idx} className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-700 italic mb-6">"{testimony.text}"</p>
              <div className="font-bold text-slate-900">{testimony.name}</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest">{testimony.country}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. SECTION FAQ */}
      <section className="py-24 bg-slate-900 px-6 md:px-12 text-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-12 text-center">Foire aux questions</h2>
          <div className="space-y-8">
            {[
              { q: "Comment fonctionne le paiement ?", r: "Vous payez uniquement après avoir vu l'aperçu de la restauration. Paiement par Orange Money, Wave ou carte." },
              { q: "Combien de temps prend la restauration ?", r: "Moins d'une minute en général." },
              { q: "Puis-je choisir entre plusieurs résultats ?", r: "Oui, nous vous proposons toujours 2 versions différentes." },
              { q: "Mes photos sont-elles confidentielles ?", r: "Vos photos sont stockées de façon sécurisée et supprimées automatiquement après 30 jours." },
              { q: "Quels formats sont acceptés ?", r: "JPG, PNG et WebP, jusqu'à 10 Mo." }
            ].map((faq, idx) => (
              <div key={idx} className="border-b border-slate-800 pb-8">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm mr-4 shrink-0">Q</span>
                  {faq.q}
                </h3>
                <p className="text-slate-400 pl-12 leading-relaxed">{faq.r}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="py-12 px-6 md:px-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-slate-500 text-sm">
          © 2025 PhotoRestore.ga — Tous droits réservés
        </div>
        <Link href="/login" className="text-slate-400 text-sm hover:text-slate-900 underline-offset-4 hover:underline">
          Espace membre
        </Link>
      </footer>
    </div>
  );
}
