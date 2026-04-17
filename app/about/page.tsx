import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Cincailah — the app that ends your lunch-time indecision.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-mamak/20 to-cream">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍛</span>
            <span className="text-xl font-black text-slate">cincailah</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-slate transition">
            ← Home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="text-7xl mb-4">🍜</div>
          <h1 className="text-4xl font-black text-slate mb-4">About Cincailah</h1>
          <p className="text-xl text-gray-600">
            The story behind Malaysia&apos;s favourite lunch-decision engine
          </p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-slate mb-4">Why We Built This</h2>
            <p className="mb-4">
              Every working day in Malaysia, millions of office workers face the same soul-crushing
              question: <strong>&quot;Makan apa?&quot;</strong> What follows is a 20-minute WhatsApp
              thread that ends with someone saying &quot;cincai lah&quot; — and everyone still ending
              up at the same nasi lemak stall.
            </p>
            <p>
              We built Cincailah to fix exactly this. One tap. The wheel spins. Lunch decided.
              No drama, no politics, no senior-always-decides energy.
            </p>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-slate mb-4">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl mb-3">🎰</div>
                <h3 className="font-black text-slate mb-2">Cincailah Mode</h3>
                <p className="text-sm text-gray-600">
                  The algorithm picks a random restaurant from your group list, respecting dietary
                  preferences, anti-repeat rules, and your favourites.
                </p>
              </div>
              <div>
                <div className="text-4xl mb-3">🥊</div>
                <h3 className="font-black text-slate mb-2">We Fight Mode</h3>
                <p className="text-sm text-gray-600">
                  Democracy at the lunch table. Everyone votes in 15 minutes. Most votes wins.
                  Ties are broken by fate.
                </p>
              </div>
              <div>
                <div className="text-4xl mb-3">🎲</div>
                <h3 className="font-black text-slate mb-2">Solo Mode</h3>
                <p className="text-sm text-gray-600">
                  Eating alone? Spin from your personal favourites or pick by cuisine. No account
                  needed.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-slate mb-4">Our Values</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-xl">⚡</span>
                <span><strong>Speed first.</strong> Decisions should take seconds, not minutes.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">🤝</span>
                <span><strong>Fairness.</strong> Anti-repeat so nobody always ends up at the same place.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">🔒</span>
                <span><strong>Privacy.</strong> We store only what we need. No ads, no tracking.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">🇲🇾</span>
                <span><strong>Built for Malaysia.</strong> Halal filters, Bahasa vibes, local food DNA.</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-slate mb-4">Get In Touch</h2>
            <p className="mb-4">
              Questions, feedback, or just want to say hi? We&apos;d love to hear from you.
            </p>
            <a
              href="mailto:support@cincailah.com"
              className="inline-block bg-sambal text-white font-bold px-6 py-3 rounded-xl hover:bg-sambal/90 transition"
            >
              support@cincailah.com
            </a>
          </section>
        </div>
      </main>

      <footer className="bg-slate text-white py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex gap-6 justify-center text-sm text-gray-400 mb-4">
            <Link href="/about" className="hover:text-white transition">About</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
          </div>
          <p className="text-xs text-gray-500">© 2026 cincailah. Made with ❤️ for hungry people.</p>
        </div>
      </footer>
    </div>
  );
}
