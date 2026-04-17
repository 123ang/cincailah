import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Cincailah collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  const lastUpdated = 'April 17, 2026';

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
        <h1 className="text-4xl font-black text-slate mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {lastUpdated}</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-slate mb-3">1. Information We Collect</h2>
            <p className="mb-3">When you use Cincailah, we collect the following:</p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><strong>Account information:</strong> Your email address and display name when you register.</li>
              <li><strong>Group data:</strong> Group names, Makan Codes, and member lists you create or join.</li>
              <li><strong>Restaurant data:</strong> Restaurants you add to your groups, including tags and preferences.</li>
              <li><strong>Decision history:</strong> Records of lunch decisions and votes to power anti-repeat logic.</li>
              <li><strong>Favourites:</strong> Restaurants you heart.</li>
            </ul>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-slate mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>To provide and improve the Cincailah service.</li>
              <li>To send transactional emails (password reset, email verification).</li>
              <li>To power anti-repeat and personalisation features.</li>
              <li>We do <strong>not</strong> sell your data to third parties.</li>
              <li>We do <strong>not</strong> run advertising.</li>
            </ul>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-slate mb-3">3. Data Storage & Security</h2>
            <p className="mb-3 text-sm">
              Your data is stored in a PostgreSQL database. Passwords are hashed using bcrypt and
              never stored in plaintext. Sessions are secured with an encrypted cookie. We use
              industry-standard transport encryption (HTTPS) for all communication.
            </p>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-slate mb-3">4. Cookies</h2>
            <p className="text-sm">
              We use a single secure, HTTP-only session cookie to keep you logged in. We do not use
              third-party tracking cookies or analytics cookies.
            </p>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-slate mb-3">5. Your Rights</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>You can delete your account and all associated data by contacting us.</li>
              <li>You can leave any group at any time from the group settings page.</li>
              <li>You can remove favourites at any time from the Favourites page.</li>
            </ul>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-slate mb-3">6. Contact</h2>
            <p className="text-sm">
              For any privacy-related questions, email us at{' '}
              <a href="mailto:privacy@cincailah.com" className="text-sambal hover:underline">
                privacy@cincailah.com
              </a>
              .
            </p>
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
