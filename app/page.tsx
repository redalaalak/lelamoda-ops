import Link from 'next/link'
import WaitlistForm from '@/components/WaitlistForm'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Tawsilak</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Fonctionnalités</a>
            <a href="#how" className="hover:text-gray-900 transition-colors">Comment ça marche</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Tarifs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
              Se connecter
            </Link>
            <Link href="#waitlist" className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-emerald-100">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            Plateforme COD #1 au Maroc
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Gérez vos commandes<br />
            <span className="text-emerald-500">COD comme un pro</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Tawsilak connecte votre boutique Shopify à un système complet de gestion COD — confirmation, expédition, CRM clients, et analytiques en temps réel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="#waitlist" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors shadow-lg shadow-emerald-100">
              Démarrer gratuitement →
            </Link>
            <a href="#how" className="border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-8 py-4 rounded-xl text-base transition-colors bg-white">
              Voir comment ça marche
            </a>
          </div>
          <p className="text-sm text-gray-400 mt-4">Aucune carte bancaire requise · Intégration Shopify en 2 minutes</p>
        </div>

        {/* Dashboard preview */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-xs text-gray-400 ml-2">tawsilak.com/admin/dashboard</span>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Commandes', value: '1,248', color: 'bg-emerald-50 text-emerald-700', icon: '📦' },
                  { label: 'Confirmées', value: '934', color: 'bg-blue-50 text-blue-700', icon: '✅' },
                  { label: 'Livrées', value: '782', color: 'bg-purple-50 text-purple-700', icon: '🚚' },
                  { label: 'Revenus', value: '124,500 DH', color: 'bg-orange-50 text-orange-700', icon: '💰' },
                ].map(s => (
                  <div key={s.label} className={`${s.color} rounded-xl p-4`}>
                    <div className="text-lg mb-1">{s.icon}</div>
                    <div className="text-xl font-bold">{s.value}</div>
                    <div className="text-xs opacity-70 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Dernières commandes</span>
                  <span className="text-xs text-emerald-600 font-medium">Voir tout →</span>
                </div>
                <div className="space-y-2">
                  {[
                    { id: '#1842', client: 'Fatima Z.', ville: 'Casablanca', montant: '450 DH', status: 'Confirmée', color: 'bg-blue-100 text-blue-700' },
                    { id: '#1841', client: 'Youssef M.', ville: 'Rabat', montant: '320 DH', status: 'En livraison', color: 'bg-purple-100 text-purple-700' },
                    { id: '#1840', client: 'Aicha B.', ville: 'Marrakech', montant: '890 DH', status: 'Livrée', color: 'bg-emerald-100 text-emerald-700' },
                  ].map(o => (
                    <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-400">{o.id}</span>
                        <span className="text-sm font-medium text-gray-700">{o.client}</span>
                        <span className="text-xs text-gray-400">{o.ville}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-800">{o.montant}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${o.color}`}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '+500', label: 'Marchands actifs' },
            { value: '+2M', label: 'Commandes traitées' },
            { value: '98%', label: 'Taux de livraison' },
            { value: '2min', label: "Intégration Shopify" },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-lg text-gray-500">Une plateforme complète pour gérer votre activité COD de A à Z</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '📋',
                title: 'Gestion des commandes',
                desc: 'Importez automatiquement vos commandes Shopify. Suivez chaque commande de la confirmation à la livraison avec un statut en temps réel.',
              },
              {
                icon: '📞',
                title: 'Centre de confirmation',
                desc: "File d'attente intelligente pour votre équipe de confirmation. Historique des appels, notes, et suivi des agents en un seul endroit.",
              },
              {
                icon: '🚚',
                title: 'Expédition & Ameex',
                desc: 'Créez vos bons de livraison Ameex en un clic. Suivi automatique des colis et mise à jour des statuts en temps réel.',
              },
              {
                icon: '👥',
                title: 'CRM Clients',
                desc: "Profil complet de chaque client : historique des commandes, taux de livraison, adresses, et notes d'équipe.",
              },
              {
                icon: '📊',
                title: 'Analytiques avancées',
                desc: 'Tableaux de bord en temps réel : taux de confirmation, performance par agent, revenus par région, retours et échanges.',
              },
              {
                icon: '⚡',
                title: 'Automatisations',
                desc: "Règles intelligentes : relances automatiques, alertes stock, affectation d'agents, et webhooks vers vos outils externes.",
              },
            ].map(f => (
              <div key={f.title} className="bg-gray-50 rounded-2xl p-6 hover:bg-emerald-50 hover:border-emerald-100 border border-transparent transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Prêt en 3 étapes</h2>
            <p className="text-lg text-gray-500">De l'inscription à votre premier dashboard en moins de 5 minutes</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Créez votre compte', desc: "Inscrivez-vous gratuitement. Aucune carte bancaire n'est nécessaire pour commencer." },
              { step: '02', title: 'Connectez Shopify', desc: 'Autorisez Tawsilak à accéder à votre boutique. Vos commandes sont importées automatiquement.' },
              { step: '03', title: 'Gérez tout depuis un seul endroit', desc: "Confirmation, expédition, CRM — tout est centralisé dans votre dashboard personnalisé." },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-emerald-500 text-white font-bold text-lg rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Tarifs simples et transparents</h2>
            <p className="text-lg text-gray-500">Pas de frais cachés. Évoluez à votre rythme.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Starter',
                price: 'Gratuit',
                sub: 'Pour tester',
                features: ['500 commandes/mois', '1 utilisateur', 'Intégration Shopify', 'Support email'],
                cta: 'Commencer',
                highlight: false,
              },
              {
                name: 'Pro',
                price: '499 DH',
                sub: '/mois',
                features: ['Commandes illimitées', '10 utilisateurs', 'Centre confirmation', 'Intégration Ameex', 'Analytiques avancées', 'Support prioritaire'],
                cta: 'Choisir Pro',
                highlight: true,
              },
              {
                name: 'Enterprise',
                price: 'Sur mesure',
                sub: 'Contactez-nous',
                features: ['Multi-boutiques', 'Utilisateurs illimités', 'API complète', 'Onboarding dédié', 'SLA garanti'],
                cta: 'Nous contacter',
                highlight: false,
              },
            ].map(p => (
              <div key={p.name} className={`rounded-2xl p-6 border ${p.highlight ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                <div className={`text-sm font-semibold mb-1 ${p.highlight ? 'text-emerald-100' : 'text-gray-500'}`}>{p.name}</div>
                <div className={`text-3xl font-extrabold mb-0.5`}>{p.price}</div>
                <div className={`text-sm mb-6 ${p.highlight ? 'text-emerald-100' : 'text-gray-400'}`}>{p.sub}</div>
                <ul className="space-y-2 mb-8">
                  {p.features.map(f => (
                    <li key={f} className={`text-sm flex items-center gap-2 ${p.highlight ? 'text-emerald-50' : 'text-gray-600'}`}>
                      <span className={p.highlight ? 'text-white' : 'text-emerald-500'}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="#waitlist" className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${p.highlight ? 'bg-white text-emerald-600 hover:bg-emerald-50' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section id="waitlist" className="py-24 px-6 bg-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4">Prêt à booster vos livraisons ?</h2>
          <p className="text-lg text-gray-400 mb-10">Rejoignez les marchands marocains qui utilisent Tawsilak pour gérer leur activité COD.</p>
          <WaitlistForm />
          <p className="text-xs text-gray-500 mt-4">+500 marchands nous font déjà confiance</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="font-bold text-gray-900">Tawsilak</span>
            <span className="text-gray-400 text-sm ml-2">© 2025</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/confidentialite" className="hover:text-gray-900 transition-colors">Confidentialité</Link>
            <Link href="/conditions" className="hover:text-gray-900 transition-colors">Conditions</Link>
            <Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
            <Link href="/admin/login" className="hover:text-gray-900 transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
