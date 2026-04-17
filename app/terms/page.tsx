import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using Cincailah.',
};

export default function TermsPage() {
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
        <h1 className="text-4xl font-black text-slate mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {lastUpdated}</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-slate mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm">
              By accessing or using Cincailah (&quot;the Service&quot;), you agree to be bound by these Terms
              of Service. If you do not agree, please do not use the Service.
            </p>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-slate mb-3">2. Use of the Service</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>You must be at least 13 years old to create an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You agree not to use the Service for any unlawful purpose.</li>
              <li>You agree not to attempt to circumvent rate limits, abuse the API, or reverse-engineer the Service.</li>
              <li>Restaurant data you add must be legitimate and not misleading.</li>
            </ul>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-slate mb-3">3. Content</h2>
            <p className="text-sm mb-3">
              You retain ownership of content you submit (restaurant names, group names, etc.). By
              submitting content, you grant us a worldwide, royalty-free licence to store and display
              it within the Service.
            </p>
            <p className="text-sm">
              We reserve the right to remove content that violates these Terms or applicable law.
            </p>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-slate mb-3">4. Service Availability</h2>
            <p className="text-sm">
              We aim to keep Cincailah running reliably, but we do not guarantee uninterrupted
              availability. We may modify or discontinue features with reasonable notice.
            </p>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-slate mb-3">5. Limitation of Liability</h2>
            <p className="text-sm">
              Cincailah is provided &quot;as is&quot; without warranties of any kind. To the fullest extent
              permitted by law, we are not liable for any indirect, incidental, or consequential
              damages arising from your use of the Service — including, but not limited to,
              regrettable lunch choices.
            </p>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-slate mb-3">6. Changes to Terms</h2>
            <p className="text-sm">
              We may update these Terms from time to time. Continued use of the Service after
              changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-slate mb-3">7. Contact</h2>
            <p className="text-sm">
              Questions about these Terms? Email{' '}
              <a href="mailto:legal@cincailah.com" className="text-sambal hover:underline">
                legal@cincailah.com
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
