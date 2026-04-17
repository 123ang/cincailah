'use client';

import Link from 'next/link';
import MakanCodeInput from '@/components/MakanCodeInput';
import DarkModeToggle from '@/components/DarkModeToggle';

export default function LandingPageClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-mamak/20 to-cream">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🍛</span>
            <span className="text-2xl font-black text-slate">cincailah</span>
          </div>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <Link
              href="/solo"
              className="hidden sm:inline-flex px-4 py-2 font-bold text-sm text-slate hover:text-sambal transition"
            >
              Try Solo
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 font-bold text-sm text-slate hover:text-sambal transition"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="btn-cincai text-white font-bold px-6 py-2 rounded-xl text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-20 text-center">
        <div className="inline-block mb-6">
          <span className="text-8xl animate-bounce inline-block">🍜</span>
          <span className="text-8xl animate-bounce inline-block" style={{ animationDelay: '0.1s' }}>🍛</span>
          <span className="text-8xl animate-bounce inline-block" style={{ animationDelay: '0.2s' }}>🍲</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-slate mb-6 leading-tight">
          Lunch Boss<br />
          <span className="text-sambal">Made Simple</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          No more "makan apa?" debates 😤<br />
          Let the wheel decide. Fair, fast, and fuss-free 🎯
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/solo"
            className="btn-cincai text-white font-black px-10 py-4 rounded-2xl text-lg shadow-lg hover:shadow-xl transition transform hover:scale-105"
          >
            🎲 Try Solo — No Signup
          </Link>
          <Link
            href="/register"
            className="bg-white border-2 border-sambal text-sambal font-black px-10 py-4 rounded-2xl text-lg hover:bg-sambal hover:text-white transition"
          >
            👥 Create Group
          </Link>
        </div>

        <p className="text-sm text-gray-400 mt-4">
          Spin instantly, or sign up free to decide with friends.
        </p>

        <div className="mt-10">
          <MakanCodeInput />
          <p className="text-xs text-gray-400 mt-3">
            Someone shared a code? Paste it above to jump straight in.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="text-4xl font-black text-center text-slate mb-16">
          Why Your Team Will Love It 💚
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition">
            <div className="text-6xl mb-4">🎰</div>
            <h3 className="text-2xl font-black text-slate mb-3">Cincailah Mode</h3>
            <p className="text-gray-600 leading-relaxed">
              Spin the wheel and let fate decide 🔥 No overthinking, no regrets. Perfect for the "anyhting lah" crowd.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition">
            <div className="text-6xl mb-4">🥊</div>
            <h3 className="text-2xl font-black text-slate mb-3">We Fight Mode</h3>
            <p className="text-gray-600 leading-relaxed">
              Democracy in action ⚡ 15 minutes to vote. Winner takes all. May the best nasi lemak win.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-2xl font-black text-slate mb-3">Smart Rotation</h3>
            <p className="text-gray-600 leading-relaxed">
              Anti-repeat algorithm 🧠 No more "we just ate there yesterday!" Built-in fairness for peace of mind.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-2xl font-black text-slate mb-3">Works Anywhere</h3>
            <p className="text-gray-600 leading-relaxed">
              Phone, laptop, tablet—semua boleh 📲 No app download needed. Just share your Makan Code and go.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-2xl font-black text-slate mb-3">Multiple Groups</h3>
            <p className="text-gray-600 leading-relaxed">
              Office crew, gym kakis, weekend gang 👯 Manage all your makan squads in one place. Switch anytime.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition">
            <div className="text-6xl mb-4">⚡</div>
            <h3 className="text-2xl font-black text-slate mb-3">Lightning Fast</h3>
            <p className="text-gray-600 leading-relaxed">
              Decision in 10 seconds flat 💨 Because lunch break is short and hunger doesn't wait. Boom, done.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-black text-center text-slate mb-16">
            Three Steps to Makan 🍽️
          </h2>

          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-sambal text-white font-black text-2xl rounded-full mb-6">
                1
              </div>
              <h3 className="text-xl font-black text-slate mb-3">Create Your Group</h3>
              <p className="text-gray-600">
                Register free, create a group, get your unique Makan Code 🔐
              </p>
            </div>

            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pandan text-white font-black text-2xl rounded-full mb-6">
                2
              </div>
              <h3 className="text-xl font-black text-slate mb-3">Add Restaurants</h3>
              <p className="text-gray-600">
                Everyone adds their faves. Build your personalized menu 📝
              </p>
            </div>

            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-mamak text-slate font-black text-2xl rounded-full mb-6">
                3
              </div>
              <h3 className="text-xl font-black text-slate mb-3">Decide & Go</h3>
              <p className="text-gray-600">
                Spin the wheel or vote. Decision made. Time to makan! 🚀
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / Social Proof */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-black text-center text-slate mb-16">
          What People Say 💬
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
            <p className="text-gray-700 text-lg mb-4 leading-relaxed">
              "Finally lah! No more 30 minute WhatsApp debates. Now we eat in 5 minutes 😂"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-sambal to-pandan rounded-full flex items-center justify-center text-2xl">
                👨‍💼
              </div>
              <div>
                <p className="font-bold text-slate">Ahmad, Tech Startup</p>
                <p className="text-sm text-gray-400">Cyberjaya</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
            <p className="text-gray-700 text-lg mb-4 leading-relaxed">
              "The voting feature saved our team. Democracy works! 🗳️ No more senior always decide."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pandan to-mamak rounded-full flex items-center justify-center text-2xl">
                👩‍💻
              </div>
              <div>
                <p className="font-bold text-slate">Siti, Finance Team</p>
                <p className="text-sm text-gray-400">KL Sentral</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-sambal via-sambal/90 to-sambal text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to Stop Wasting Time? 🕐
          </h2>
          <p className="text-xl md:text-2xl mb-10 opacity-90">
            Join thousands who've already solved their lunch problem
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-sambal font-black px-12 py-5 rounded-2xl text-lg shadow-2xl hover:shadow-3xl transition transform hover:scale-105"
          >
            🎉 Create Free Account
          </Link>
          <p className="text-sm mt-6 opacity-75">
            Setup takes 60 seconds. First decision in 2 minutes. 🚀
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-3xl">🍛</span>
            <span className="text-2xl font-black">cincailah</span>
          </div>
          <p className="text-gray-400 mb-6">
            The smartest way to decide where to makan
          </p>
          <div className="flex gap-6 justify-center text-sm text-gray-400">
            <a href="/about" className="hover:text-white transition">About</a>
            <a href="/privacy" className="hover:text-white transition">Privacy</a>
            <a href="/terms" className="hover:text-white transition">Terms</a>
            <a href="mailto:support@cincailah.com" className="hover:text-white transition">Contact</a>
          </div>
          <p className="text-xs text-gray-500 mt-8">
            © 2026 cincailah. Made with ❤️ for hungry people.
          </p>
        </div>
      </footer>
    </div>
  );
}
