'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Calendar, Sparkles, CheckSquare, Settings, LogIn, LogOut, User } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Calendar },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/calendar', label: 'Weekly Planner', icon: Sparkles },
    { href: '/preferences', label: 'Preferences', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-purple-600 to-emerald-400 p-[1px] shadow-glow-indigo transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
                Chronos AI
              </span>
              <span className="block text-[10px] uppercase font-semibold tracking-wider text-brand-400/90 -mt-1">
                Calendar Planner
              </span>
            </div>
          </Link>

          {/* Nav Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/60">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-glow-indigo'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile / Auth Action */}
          <div className="flex items-center gap-3">
            {session?.user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-300 font-medium">{session.user.name || session.user.email}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('demo-credentials', { callbackUrl: '/' })}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-sm font-semibold shadow-glow-indigo transition-all duration-200 hover:scale-[1.02]"
              >
                <LogIn className="w-4 h-4" />
                <span>Quick Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
