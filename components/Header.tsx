'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import AnimatedLogo from '@/components/AnimatedLogo';
import { BackpackIcon, MountainIcon } from '@/components/NavIcons';
import { useCountry } from '@/hooks/useCountry';
import { COUNTRIES, getFlagUrl } from '@/lib/constants';

interface HeaderProps {
  activePage?: 'home' | 'gear' | 'trips';
  rightContent?: React.ReactNode;
}

export default function Header({ activePage, rightContent }: HeaderProps) {
  const { data: session } = useSession();
  const { country, setCountry } = useCountry();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  return (
    <div className="red-band">
      <div className="red-band-container">
        <AnimatedLogo variant="light" size="small" />
        <div className="flex items-center gap-4">
          {/* Nav links */}
          <div className="flex items-center gap-1 md:gap-3">
            <Link
              href="/gear"
              className={`nav-link ${activePage === 'gear' ? 'nav-link-active text-white' : 'text-white/80 hover:text-white'} text-sm font-medium transition-colors`}
              aria-label="My Gear"
            >
              <span className="nav-link-icon"><BackpackIcon isActive={activePage === 'gear'} /></span>
              <span className="nav-link-text">My Gear</span>
            </Link>
            <Link
              href="/trips"
              className={`nav-link ${activePage === 'trips' ? 'nav-link-active text-white' : 'text-white/80 hover:text-white'} text-sm font-medium transition-colors`}
              aria-label="My Trips"
            >
              <span className="nav-link-icon"><MountainIcon isActive={activePage === 'trips'} /></span>
              <span className="nav-link-text">My Trips</span>
            </Link>
          </div>

          {/* Country selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="hover:opacity-80 transition-opacity"
              title={country?.name || 'Select country'}
            >
              {country ? (
                <img src={getFlagUrl(country.code)} alt={country.name} className="w-6 h-4 object-cover rounded-sm" />
              ) : (
                <span className="text-white text-sm">🌍</span>
              )}
            </button>
            {showCountryDropdown && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-64 overflow-y-auto min-w-[180px]">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCountry(c);
                      setShowCountryDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${country?.code === c.code ? 'bg-gray-50' : ''}`}
                  >
                    <img src={getFlagUrl(c.code)} alt="" className="w-5 h-4 object-cover rounded-sm" />
                    <span className="text-charcoal">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User avatar / login */}
          <div className="relative">
            {session?.user ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/30 hover:border-white/60 transition-colors"
                >
                  {session.user.image ? (
                    <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/20 flex items-center justify-center text-white text-sm font-medium">
                      {session.user.name?.[0] || session.user.email?.[0] || '?'}
                    </div>
                  )}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[160px]">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <div className="text-sm font-medium text-charcoal">{session.user.name}</div>
                      <div className="text-xs text-muted">{session.user.email}</div>
                    </div>
                    <Link
                      href="/"
                      className="block w-full px-3 py-2 text-left text-sm text-charcoal hover:bg-gray-100"
                    >
                      Home
                    </Link>
                    <button
                      type="button"
                      onClick={() => signOut()}
                      className="w-full px-3 py-2 text-left text-sm text-charcoal hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => signIn('google')}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                title="Sign in"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            )}
          </div>

          {/* Custom right content (e.g., settings button on home page) */}
          {rightContent}
        </div>
      </div>
    </div>
  );
}
