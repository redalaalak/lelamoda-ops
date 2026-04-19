import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = { title: "Conditions d'utilisation — Tawsilak" }

export default function ConditionsPage() {
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
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Conditions d'utilisation</h1>
        <p className="text-gray-400 text-sm mb-10">Dernière mise à jour : Avril 2025</p>

        <div className="space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptation des conditions</h2>
            <p>En utilisant Tawsilak, vous acceptez les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Description du service</h2>
            <p>Tawsilak est une plateforme SaaS de gestion des opérations e-commerce COD (Cash on Delivery) destinée aux marchands utilisant Shopify au Maroc. La plateforme inclut la gestion des commandes, le CRM clients, la confirmation, l'expédition et les analytiques.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Compte utilisateur</h2>
            <p>Vous êtes responsable de la confidentialité de vos identifiants de connexion. Toute activité réalisée via votre compte est de votre responsabilité. Signalez immédiatement tout accès non autorisé.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Utilisation acceptable</h2>
            <p>Vous vous engagez à utiliser Tawsilak uniquement à des fins légales et conformément à ces conditions. Il est interdit de tenter d'accéder aux données d'autres utilisateurs ou de perturber le fonctionnement de la plateforme.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Facturation</h2>
            <p>Les abonnements sont facturés mensuellement. Vous pouvez annuler à tout moment. Aucun remboursement n'est accordé pour les périodes déjà facturées.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Limitation de responsabilité</h2>
            <p>Tawsilak ne peut être tenu responsable des pertes indirectes résultant de l'utilisation ou de l'impossibilité d'utiliser la plateforme. Notre responsabilité totale est limitée au montant payé au cours des 3 derniers mois.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Modifications</h2>
            <p>Tawsilak se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront notifiés par email en cas de changements substantiels.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">← Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  )
}
