import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Menu, X, LogIn, LogOut, ShieldCheck } from 'lucide-react'
import logoTsb from '@/assets/image-ee90b.png'

interface LayoutProps {
  children?: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  const navLinks = [
    { label: 'Institucional', to: '/' },
    { label: 'Transparência (ANP)', to: '/transparencia' },
    { label: 'POC', subtitle: 'Oferta de Capacidade', to: '/poc' },
    { label: 'Gestão Interna', to: '/gestao' },
  ]

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
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* LOGO OFICIAL TSB */}
          <Link
            to="/"
            className="flex items-center gap-3 text-decoration-none group py-1"
            title="TSB — Transportadora Sulbrasileira de Gás S.A."
          >
            {/* Box com fundo branco translúcido/limpo para destaque de alto contraste do logo TSB sobre o header escuro */}
            <div className="bg-white/95 hover:bg-white transition-all duration-200 px-3 py-1.5 rounded-md shadow-sm border border-white/20 flex items-center">
              <img
                src={logoTsb}
                alt="TSB — Transportadora Sulbrasileira de Gás S.A."
                className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </div>
            <div className="hidden xl:flex flex-col">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-200 font-display leading-tight">
                Portal Regulatório
              </span>
              <span className="text-[9px] font-semibold text-slate-400 tracking-wider uppercase">
                Acesso Aberto
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#e30613] text-white shadow-xs font-display">
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
                  className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                state={{ from: { pathname: '/poc' } }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded border border-white/30 text-white hover:bg-white/10 hover:border-white transition-all duration-200 shadow-sm"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Entrar</span>
              </Link>
            )}
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
                    className="text-red-400 font-semibold hover:underline cursor-pointer"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  state={{ from: { pathname: '/poc' } }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 px-3 text-sm font-semibold rounded bg-[#0284c7] text-white hover:bg-[#0369a1]"
                >
                  Entrar no Portal
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
            <div className="flex items-center gap-3">
              <div className="bg-white/95 p-2 rounded-md shadow-sm inline-flex items-center">
                <img
                  src={logoTsb}
                  alt="TSB — Transportadora Sulbrasileira de Gás S.A."
                  className="h-7 w-auto object-contain"
                />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#e30613] text-white shadow-sm font-display">
                Transportadora
              </span>
            </div>
            <h4 className="text-white font-bold text-base font-display tracking-tight">
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
            <h4 className="text-white font-bold text-xs tracking-wider uppercase mb-3 font-display text-slate-300">
              Links Rápidos
            </h4>
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
            <h4 className="text-white font-bold text-xs tracking-wider uppercase mb-3 font-display text-slate-300">
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
