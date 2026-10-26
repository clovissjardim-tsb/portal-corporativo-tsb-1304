import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Menu, X, LogIn, LogOut } from 'lucide-react'

interface LayoutProps {
  children?: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  const navLinks: { label: string; to: string; subtitle?: string }[] = [
    { label: 'Institucional', to: '/' },
    { label: 'Transparência (ANP)', to: '/transparencia' },
    { label: 'POC — Programa de Oferta de Capacidade', to: '/poc' },
    { label: 'Gestão Interna', to: '/gestao' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#1e293b] font-sans antialiased">
      {/* HEADER FIXO / STICKY */}
      <header className="sticky top-0 z-50 bg-[#0a2540] text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        {/* MAIN NAV BAR */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* DESKTOP NAV LINKS */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                title={item.subtitle ? `${item.label} — ${item.subtitle}` : undefined}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-baseline gap-1.5 ${
                    isActive
                      ? 'bg-white/15 text-white shadow-inner font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <span>{item.label}</span>
                {item.subtitle && (
                  <span className="text-[10px] font-normal text-slate-400 group-hover:text-slate-300 hidden xl:inline">
                    ({item.subtitle})
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* DESKTOP ACTIONS */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={logout}
                title="Sair da sessão"
                aria-label="Sair da sessão"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded border border-white/30 text-white hover:bg-white/10 hover:border-white transition-all duration-200 shadow-sm cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sair</span>
              </button>
            ) : (
              <Link
                to="/login"
                state={{ from: { pathname: '/transparencia' } }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded border border-white/30 text-white hover:bg-white/10 hover:border-white transition-all duration-200 shadow-sm"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Entrar</span>
              </Link>
            )}
          </div>

          {/* MOBILE MENU TOGGLE & ACTIONS */}
          <div className="lg:hidden flex items-center gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={logout}
                title="Sair da sessão"
                aria-label="Sair da sessão"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-white/30 text-white hover:bg-white/10 hover:border-white transition-all duration-200 shadow-sm cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sair</span>
              </button>
            ) : (
              <Link
                to="/login"
                state={{ from: { pathname: '/transparencia' } }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-white/30 text-white hover:bg-white/10 hover:border-white transition-all duration-200 shadow-sm"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Entrar</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white rounded-md hover:bg-white/10 focus:outline-none"
              aria-label="Alternar menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#071a2e] border-t border-white/10 px-4 pt-3 pb-5 space-y-2 animate-fade-in">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    setMobileMenuOpen(false)
                  }}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-semibold rounded border border-white/30 text-white hover:bg-white/10 hover:border-white transition-all duration-200 shadow-sm cursor-pointer"
                  title="Sair da sessão"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  state={{ from: { pathname: '/transparencia' } }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-semibold rounded border border-white/30 text-white hover:bg-white/10 hover:border-white transition-all duration-200 shadow-sm"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Entrar</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 my-8">{children}</main>
    </div>
  )
}
