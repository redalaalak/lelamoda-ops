import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Politique de confidentialité — Tawsilak' }

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-6 h-16 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="font-bold text-gray-900">Tawsilak</span>
        </Link>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Politique de confidentialité</h1>
        <p className="text-gray-400 text-sm mb-10">Dernière mise à jour : Avril 2025</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Collecte des données</h2>
            <p>Tawsilak collecte uniquement les données nécessaires au fonctionnement de la plateforme : informations de compte (nom, email), données de votre boutique Shopify (commandes, clients, produits) et données d'utilisation anonymisées à des fins d'amélioration du service.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Utilisation des données</h2>
            <p>Vos données sont utilisées exclusivement pour fournir et améliorer les services Tawsilak. Nous ne vendons ni ne partageons vos données avec des tiers à des fins commerciales.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Stockage et sécurité</h2>
            <p>Toutes les données sont stockées sur des serveurs sécurisés (Supabase / PostgreSQL) avec chiffrement en transit (TLS) et au repos. Nous appliquons les meilleures pratiques de sécurité pour protéger vos informations.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Vos droits</h2>
            <p>Vous pouvez à tout moment demander l'accès, la modification ou la suppression de vos données en nous contactant à <a href="mailto:contact@tawsilak.com" className="text-emerald-600 hover:underline">contact@tawsilak.com</a>.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Cookies</h2>
            <p>Tawsilak utilise des cookies essentiels pour maintenir votre session d'authentification. Aucun cookie de tracking tiers n'est utilisé.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">← Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  )
}
