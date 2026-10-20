import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Menu, X, LogIn, LogOut, User, ShieldCheck } from 'lucide-react'

interface LayoutProps {
  children?: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const navLinks = [
    { label: 'Institucional', to: '/' },
    { label: 'Transparência (ANP)', to: '/transparencia' },
    { label: 'Oferta de Capacidade (POC)', to: '/poc' },
    { label: 'Gestão Interna', to: '/gestao' },
  ]

  const handleAreaCarregadorClick = () => {
    if (isAuthenticated) {
      navigate('/poc')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#1e293b] font-sans antialiased">
      {/* HEADER FIXO / STICKY */}
      <header className="sticky top-0 z-50 bg-[#0a2540] text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        {/* TOP BAR */}
        <div className="border-b border-white/10 text-xs py-1.5 px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between">
            <span className="font-medium text-slate-300 truncate">
              Transportadora Sulbrasileira de Gás S.A. — Portal Corporativo e Regulatório
            </span>
            <div className="flex items-center gap-4 shrink-0 text-slate-300">
              <span className="cursor-default select-none text-slate-400">
                Idioma: <strong className="text-white font-semibold">PT</strong> | EN
              </span>
              <span className="text-slate-500">|</span>
              <Link
                to="/"
                className="hover:text-white transition-colors underline-offset-2 hover:underline"
              >
                Canal LGPD
              </Link>
            </div>
          </div>
        </div>

        {/* MAIN NAV BAR */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2.5 text-decoration-none group">
            <span className="text-2xl font-black tracking-tight text-white group-hover:text-sky-300 transition-colors">
              TSB
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#0284c7] text-white shadow-sm">
              REGULAÇÃO ANP
            </span>
          </Link>

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white/15 text-white shadow-inner font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* DESKTOP ACTIONS */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs font-semibold text-sky-300 flex items-center gap-1 justify-end">
                    <ShieldCheck className="h-3 w-3" />
                    <span>{user?.name || user?.email || 'Autenticado'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Sessão Ativa</div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Sair da sessão"
                  className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleAreaCarregadorClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded border border-white/30 text-white hover:bg-white/10 hover:border-white transition-all duration-200 shadow-sm"
            >
              {isAuthenticated ? (
                <>
                  <User className="h-3.5 w-3.5" />
                  Área do Carregador
                </>
              ) : (
                <>
                  <LogIn className="h-3.5 w-3.5" />
                  Área do Carregador
                </>
              )}
            </button>
          </div>

          {/* MOBILE MENU TOGGLE */}
          <div className="lg:hidden flex items-center gap-2">
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
                <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded text-xs text-slate-300">
                  <span className="truncate">Conectado: {user?.name || user?.email}</span>
                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="text-red-400 font-semibold hover:underline"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 px-3 text-sm font-semibold rounded bg-[#0284c7] text-white hover:bg-[#0369a1]"
                >
                  Entrar / Área do Carregador
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 my-8">{children}</main>

      {/* FOOTER */}
      <footer className="bg-[#0a2540] text-[#94a3b8] py-10 border-t border-white/10 mt-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
          {/* COLUNA 1: INSTITUCIONAL TSB */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white">TSB</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#0284c7] text-white shadow-sm">
                Transportadora
              </span>
            </div>
            <h4 className="text-white font-bold text-base">
              TSB — Transportadora Sulbrasileira de Gás S.A.
            </h4>
            <p className="text-xs leading-relaxed text-slate-400 max-w-md">
              Concessionária de Transporte Dutoviário de Gás Natural. Informações regulatórias
              disponibilizadas em estrita observância à Portaria ANP nº 1/2003, Resolução ANP nº
              11/2016 e Resolução ANP nº 961/2023.
            </p>
            <div className="pt-1">
              <Link
                to="/"
                className="text-xs text-sky-400 hover:text-sky-300 underline underline-offset-4 transition-colors inline-block"
              >
                Canal LGPD &amp; Encarregado de Proteção de Dados (DPO)
              </Link>
            </div>
          </div>

          {/* COLUNA 2: GRUPO LINKS */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-3">Links</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://www.tsb.com.br/a-tsb/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  A TSB
                </a>
              </li>
              <li>
                <a
                  href="https://www.tsb.com.br/gas-natural/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Gás Natural
                </a>
              </li>
              <li>
                <a
                  href="https://www.tsb.com.br/o-gasoduto/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  O Gasoduto
                </a>
              </li>
              <li>
                <Link
                  to="/transparencia"
                  className="hover:text-white transition-colors font-medium text-sky-300 hover:text-sky-200"
                  title="Boletim Eletrônico no portal interno de Transparência ANP"
                >
                  Boletim Eletrônico
                </Link>
              </li>
              <li>
                <a
                  href="https://www.tsb.com.br/fale-conosco/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Fale Conosco
                </a>
              </li>
              <li>
                <a
                  href="https://www.tsb.com.br/wp-content/uploads/2026/05/RELATORIO-DAS-DEMONSTRACOES-FINANCEIRAS-2025-TSB.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Relatório das Demonstrações Financeiras 2025
                </a>
              </li>
            </ul>
          </div>

          {/* COLUNA 3: GRUPO COMPLIANCE */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-3">
              COMPLIANCE
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://www.tsb.com.br/wp-content/uploads/2025/03/Politica-de-Contratacao-de-Fornecedores-e-Parceiros-TSB-REv.-07.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Política de Contratação Fornecedores e Parceiros
                </a>
              </li>
              <li>
                <a
                  href="https://www.tsb.com.br/wp-content/uploads/2025/03/Codigo_de_Integridade_e_Compliance_TSB.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Código de Integridade e Compliance
                </a>
              </li>
              <li>
                <a
                  href="https://www.tsb.com.br/politica-de-privacidade/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Políticas de Privacidade
                </a>
              </li>
              <li>
                <a
                  href="https://www.tsb.com.br/politica-de-cookies/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Politica de Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* BARRA INFERIOR DE COPYRIGHT */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-8 pt-4 border-t border-white/10 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} TSB — Todos os direitos reservados.</span>
          <span>Portal Corporativo e Regulatório Integrado</span>
        </div>
      </footer>
    </div>
  )
}
