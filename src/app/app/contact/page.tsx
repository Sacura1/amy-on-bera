'use client';

import Link from 'next/link';
import { SOCIAL_LINKS } from '@/lib/constants';
import { XIcon, TelegramIcon, DiscordIcon } from '@/components';

export default function PartnersPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="max-w-3xl mx-auto bg-gray-900/80 rounded-2xl border border-gray-700/50 p-4 md:p-10">
            <p className="text-sm md:text-xl text-gray-200 leading-relaxed font-medium">
              Amy is a money app being built on Berachain – starting with Pay, simple Earn strategies, Amy Points and education.
            </p>
            <p className="text-sm md:text-lg text-gray-300 mt-3 md:mt-4">
              If you&apos;re interested in working with us:
            </p>
          </div>
        </div>

        {/* Protocols & Product Partners Section */}
        <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-4 md:p-10 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="text-3xl md:text-5xl">🤝</div>
            <h2 className="text-xl md:text-3xl font-black text-yellow-400">
              Protocols & Product Partners
            </h2>
          </div>

          <p className="text-gray-300 mb-4 md:mb-6 text-sm md:text-lg">
            We work with partners in two main ways:
          </p>

          <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
            <div className="bg-gray-800/60 p-4 md:p-5 rounded-xl">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="text-xl md:text-3xl">📅</div>
                <div>
                  <h3 className="text-base md:text-xl font-bold text-white mb-1 md:mb-2">Weekly Focus campaigns</h3>
                  <p className="text-gray-300 text-xs md:text-base">
                    Our community (&quot;Angels&quot;) use your product, share real feedback and content, and we track actual usage rather than vanity metrics.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/60 p-4 md:p-5 rounded-xl">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="text-xl md:text-3xl">💎</div>
                <div>
                  <h3 className="text-base md:text-xl font-bold text-white mb-1 md:mb-2">Amy-branded strategies</h3>
                  <p className="text-gray-300 text-xs md:text-base">
                    Over time, selected partners will sit under simple &quot;Amy Stable / Balanced / Hedge&quot; strategies so users can access you from inside the app.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">
            If you&apos;d like to explore a Focus week or strategy integration, reach out via:
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <a
              href={SOCIAL_LINKS.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-samy btn-samy-enhanced text-white px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-bold uppercase inline-flex items-center justify-center gap-2 md:gap-3"
            >
              <XIcon className="w-4 h-4 md:w-5 md:h-5" />
              @amy_on_bera
            </a>
            <a
              href="mailto:theteam@amyonbera.com"
              className="bg-yellow-500 text-black px-4 md:px-6 py-2 md:py-3 rounded-full text-xs md:text-base font-bold uppercase border-2 md:border-4 border-black hover:bg-yellow-400 transition inline-flex items-center justify-center gap-2"
            >
              <span className="text-sm md:text-base">📧</span>
              <span className="truncate">theteam@amyonbera.com</span>
            </a>
          </div>
        </div>

        {/* Investors Section */}
        <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-4 md:p-10 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="text-3xl md:text-5xl">💰</div>
            <h2 className="text-xl md:text-3xl font-black text-yellow-400">
              Investors
            </h2>
          </div>

          <p className="text-gray-300 mb-4 md:mb-6 text-sm md:text-lg">
            We&apos;re building Amy as a money app on crypto rails, not as a pure token play.
          </p>

          <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">
            If you&apos;re a fund or angel focused on fintech / web3 and want a short overview of:
          </p>

          <div className="bg-gray-800/60 p-4 md:p-5 rounded-xl mb-4 md:mb-6">
            <ul className="space-y-2 md:space-y-3 text-gray-300 text-sm md:text-base">
              <li className="flex items-center gap-2 md:gap-3">
                <span className="text-gray-400 text-base md:text-xl">→</span>
                <span>our roadmap (Pay / Earn / Points / Learn),</span>
              </li>
              <li className="flex items-center gap-2 md:gap-3">
                <span className="text-gray-400 text-base md:text-xl">→</span>
                <span>current traction from Angels & partner campaigns,</span>
              </li>
              <li className="flex items-center gap-2 md:gap-3">
                <span className="text-gray-400 text-base md:text-xl">→</span>
                <span>and where $AMY fits as a loyalty layer,</span>
              </li>
            </ul>
          </div>

          <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">you can contact us via:</p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <a
              href={SOCIAL_LINKS.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-samy btn-samy-enhanced text-white px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-bold uppercase inline-flex items-center justify-center gap-2 md:gap-3"
            >
              <XIcon className="w-4 h-4 md:w-5 md:h-5" />
              @amy_on_bera
            </a>
            <a
              href="mailto:theteam@amyonbera.com"
              className="bg-yellow-500 text-black px-4 md:px-6 py-2 md:py-3 rounded-full text-xs md:text-base font-bold uppercase border-2 md:border-4 border-black hover:bg-yellow-400 transition inline-flex items-center justify-center gap-2"
            >
              <span className="text-sm md:text-base">📧</span>
              <span className="truncate">theteam@amyonbera.com</span>
            </a>
          </div>
        </div>

        {/* Community & Updates Section */}
        <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-4 md:p-10">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="text-3xl md:text-5xl">🌟</div>
            <h2 className="text-xl md:text-3xl font-black text-yellow-400">
              Community & Updates
            </h2>
          </div>

          <p className="text-gray-300 mb-4 md:mb-6 text-sm md:text-lg">
            If you&apos;re here to hang out with the community, get support or follow along as we ship:
          </p>

          <p className="text-white font-bold mb-3 md:mb-4 text-sm md:text-base">Join us on:</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
            <a
              href={SOCIAL_LINKS.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-samy btn-samy-enhanced text-white px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-bold uppercase inline-flex items-center justify-center gap-2 md:gap-3"
            >
              <DiscordIcon className="w-4 h-4 md:w-5 md:h-5" />
              Discord
            </a>
            <a
              href={SOCIAL_LINKS.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-samy btn-samy-enhanced text-white px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-bold uppercase inline-flex items-center justify-center gap-2 md:gap-3"
            >
              <TelegramIcon className="w-4 h-4 md:w-5 md:h-5" />
              Telegram
            </a>
            <a
              href={SOCIAL_LINKS.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-samy btn-samy-enhanced text-white px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-bold uppercase inline-flex items-center justify-center gap-2 md:gap-3"
            >
              <XIcon className="w-4 h-4 md:w-5 md:h-5" />
              X
            </a>
          </div>

          <p className="text-gray-400 text-xs md:text-base">
            We share Weekly Focus announcements, leaderboards, Amy Points updates and product news there first.
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8 md:mt-12">
          <Link
            href="/"
            className="btn-samy btn-samy-enhanced text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-bold uppercase inline-block"
          >
            BACK TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
