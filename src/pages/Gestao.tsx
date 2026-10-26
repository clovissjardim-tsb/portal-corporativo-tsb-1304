import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Lock,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Layers,
  DollarSign,
  Users,
  Clock,
  BookOpen,
  ListTodo,
  LogOut,
  Briefcase,
} from 'lucide-react'

export default function Gestao() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, isLoading } = useAuth()

  // Estado da Tela de Autenticação Fictícia / Simulada da Equipe TSB
  const [loginSimuladoLiberado, setLoginSimuladoLiberado] = useState<boolean>(false)
  const [loginUsuario, setLoginUsuario] = useState<string>('')
  const [loginSenha, setLoginSenha] = useState<string>('')
  const [autenticandoSimulacao, setAutenticandoSimulacao] = useState<boolean>(false)
  const [erroLoginSimulado, setErroLoginSimulado] = useState<string | null>(null)
  const [usuarioAutenticadoSimulado, setUsuarioAutenticadoSimulado] = useState<string>('')

  // Sincroniza o usuário inicial com o e-mail da sessão real caso o operador já esteja logado
  useEffect(() => {
    if (user?.email && !loginUsuario) {
      setLoginUsuario(user.email)
    }
  }, [user, loginUsuario])

  // Handler de submissão do Login Fictício / Simulado da Equipe TSB
  const handleLoginSimuladoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErroLoginSimulado(null)

    const usuarioLimpo = loginUsuario.trim()
    const usuarioValidoDemo = 'equipe_tsb'
    const emailSessao = user?.email?.trim().toLowerCase()

    if (!usuarioLimpo) {
      setErroLoginSimulado(
        'Informe o usuário da equipe (utilize equipe_tsb ou seu e-mail corporativo cadastrado).',
      )
      return
    }

    const usuarioInformadoLower = usuarioLimpo.toLowerCase()
    const ehUsuarioValido =
      usuarioInformadoLower === usuarioValidoDemo.toLowerCase() ||
      (emailSessao && usuarioInformadoLower === emailSessao)

    if (!ehUsuarioValido) {
      setErroLoginSimulado(
        'Usuário não reconhecido para demonstração da Equipe TSB. Utilize equipe_tsb ou seu e-mail logado.',
      )
      return
    }

    setAutenticandoSimulacao(true)

    // Micro-delay "Autenticando..." (spinner ~1,2s)
    setTimeout(() => {
      setAutenticandoSimulacao(false)

      // Se o operador NÃO está realmente logado no portal:
      // Redireciona para o login real e volta depois para a página
      if (!isAuthenticated) {
        navigate('/login', {
          replace: true,
          state: { from: { pathname: location.pathname, search: location.search } },
        })
        return
      }

      // Se o operador está realmente logado: libera o painel interno com roadmap
      setUsuarioAutenticadoSimulado(usuarioLimpo)
      setLoginSimuladoLiberado(true)
    }, 1200)
  }

  const handleEncerrarSessaoDemo = () => {
    setLoginSimuladoLiberado(false)
    setLoginSenha('')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <RefreshCw className="h-4 w-4 animate-spin text-[#0a2540]" />
          <span>Verificando credenciais corporativas da Equipe TSB...</span>
        </div>
      </div>
    )
  }

  // 1) TELA DE AUTENTICAÇÃO FICTÍCIA DA EQUIPE TSB
  if (!loginSimuladoLiberado) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 animate-fade-in">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg p-6 sm:p-8 space-y-6">
          {/* CABEÇALHO INSTITUCIONAL EQUIPE INTERNA */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-slate-50 border border-slate-200 text-[#0a2540] mb-1">
              <Lock className="h-6 w-6 text-[#0284c7]" />
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#0a2540] text-white tracking-wider uppercase font-display">
              Área Restrita · Equipe TSB
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0a2540] font-display">
              Gestão Interna Corporativa
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              Ambiente de operação e controle regulatório da Transportadora Sulbrasileira de Gás
            </p>
          </div>

          {/* INDICATIVO DE AMBIENTE DE DEMONSTRAÇÃO */}
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded border border-slate-200">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <ShieldCheck className="h-4 w-4 text-[#0284c7]" />
              Ambiente de demonstração
            </span>
            <span className="text-[11px] font-mono text-slate-500">Autenticação simulada</span>
          </div>

          {/* FORMULÁRIO DE LOGIN SIMULADO */}
          <form onSubmit={handleLoginSimuladoSubmit} className="space-y-4 pt-1">
            {erroLoginSimulado && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <span>{erroLoginSimulado}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="gestaoUsuario" className="text-xs font-semibold text-slate-700">
                Usuário da Equipe
              </Label>
              <Input
                id="gestaoUsuario"
                type="text"
                placeholder="equipe_tsb ou e-mail cadastrado"
                value={loginUsuario}
                onChange={(e) => setLoginUsuario(e.target.value)}
                className="text-xs bg-white text-slate-900 border-slate-300 focus-visible:ring-[#0284c7]"
                disabled={autenticandoSimulacao}
                autoComplete="username"
              />
              <p className="text-[11px] text-slate-500">
                Ambiente demonstrativo: utilize{' '}
                <span className="font-mono font-medium text-slate-700">equipe_tsb</span> ou o seu
                e-mail autenticado.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="gestaoSenha" className="text-xs font-semibold text-slate-700">
                  Senha
                </Label>
                <span className="text-[11px] text-slate-400">Opcional na demonstração</span>
              </div>
              <Input
                id="gestaoSenha"
                type="password"
                placeholder="Em branco ou qualquer texto"
                value={loginSenha}
                onChange={(e) => setLoginSenha(e.target.value)}
                className="text-xs bg-white text-slate-900 border-slate-300 focus-visible:ring-[#0284c7]"
                disabled={autenticandoSimulacao}
                autoComplete="current-password"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={autenticandoSimulacao}
                className="w-full bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-semibold py-2.5 h-auto cursor-pointer shadow-xs"
              >
                {autenticandoSimulacao ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-3.5 w-3.5 mr-2 text-sky-300" />
                    Entrar no Painel da Equipe
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* RODAPÉ DO CARD */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao Início
            </Link>
            <span className="text-[11px] text-slate-400">TSB S.A. &bull; Operação Interna</span>
          </div>
        </div>
      </div>
    )
  }

  // 2) CONTEÚDO INTERNO APÓS O LOGIN FICTÍCIO: ESCOPO A DESENVOLVER (ROADMAP)
  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-16">
      {/* BARRA SUPERIOR DE SESSÃO DA EQUIPE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold gap-1.5 py-1 px-2.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Sessão da Equipe · Autenticada</span>
          </Badge>
          <span className="text-slate-600">
            Operador:{' '}
            <strong className="text-slate-900 font-medium">
              {user?.name || usuarioAutenticadoSimulado || 'Equipe TSB'}
            </strong>
            {user?.email && (
              <span className="text-slate-500 font-mono text-[11px] ml-1">({user.email})</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEncerrarSessaoDemo}
            className="h-7 text-xs text-slate-600 hover:text-red-700 hover:bg-red-50 px-2.5"
            title="Bloquear painel"
          >
            <LogOut className="h-3.5 w-3.5 mr-1" />
            Bloquear Acesso
          </Button>
        </div>
      </div>

      {/* CABEÇALHO DO PAINEL */}
      <div className="bg-white border-t-4 border-t-[#0a2540] border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#0a2540] text-white tracking-wider uppercase font-display">
            Área Restrita TSB
          </span>
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 flex items-center gap-1">
            <ListTodo className="h-3 w-3" />
            Roadmap
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540] font-display">
          Gestão Interna — Escopo a Desenvolver
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
          Visão consolidada dos módulos previstos para o ambiente administrativo interno da{' '}
          <strong>Transportadora Sulbrasileira de Gás S.A. (TSB)</strong>.
        </p>
      </div>

      {/* SEÇÕES DO ROADMAP (6 CARDS APROVADOS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD 1: AUTENTICAÇÃO E CREDENCIAMENTO */}
        <Card className="border border-slate-200 shadow-xs bg-white hover:border-slate-300 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-[#0284c7] shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-[#0a2540]">
                Autenticação e Credenciamento
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 leading-relaxed pt-0 pl-14">
            Controle de acesso ao painel: credenciamento da equipe TSB e de usuários externos, com
            níveis de permissão por perfil.
          </CardContent>
        </Card>

        {/* CARD 2: ADMINISTRAÇÃO DO POCC */}
        <Card className="border border-slate-200 shadow-xs bg-white hover:border-slate-300 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-[#0284c7] shrink-0">
                <Briefcase className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-[#0a2540]">
                Administração do POCC
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 leading-relaxed pt-0 pl-14">
            Administração do POCC (Processo de Oferta e Contratação de Capacidade): acompanhamento
            das manifestações de interesse dos carregadores e condução das etapas até a contratação.
          </CardContent>
        </Card>

        {/* CARD 3: EDITORIA DA TRANSPARÊNCIA */}
        <Card className="border border-slate-200 shadow-xs bg-white hover:border-slate-300 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-[#0284c7] shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-[#0a2540]">
                Editoria da Transparência
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 leading-relaxed pt-0 pl-14">
            Criação, edição e exclusão do conteúdo público dos três módulos da Transparência —
            Boletim Eletrônico, Plataforma Eletrônica e Monitoramento — com upload de PDFs oficiais.
          </CardContent>
        </Card>

        {/* CARD 4: TARIFA EM DESTAQUE */}
        <Card className="border border-slate-200 shadow-xs bg-white hover:border-slate-300 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-[#0284c7] shrink-0">
                <DollarSign className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-[#0a2540]">Tarifa em Destaque</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 leading-relaxed pt-0 pl-14">
            Cadastro e atualização do quadro &quot;TARIFA CONTRATO EXTRAORDINÁRIO TRECHO T3 –
            2026&quot;, exibido em destaque na página inicial institucional do portal (tarifa,
            vigência e textos do card).
          </CardContent>
        </Card>

        {/* CARD 5: FILA DE SOLICITAÇÕES */}
        <Card className="border border-slate-200 shadow-xs bg-white hover:border-slate-300 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-[#0284c7] shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-[#0a2540]">
                Fila de Solicitações
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 leading-relaxed pt-0 pl-14">
            Recebimento, análise e resposta das Solicitações de Acesso do Inciso VII, com controle
            do prazo de resposta.
          </CardContent>
        </Card>

        {/* CARD 6: FERRAMENTAS DE APOIO */}
        <Card className="border border-slate-200 shadow-xs bg-white hover:border-slate-300 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-[#0284c7] shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-[#0a2540]">
                Ferramentas de Apoio
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 leading-relaxed pt-0 pl-14">
            Recursos do dia a dia: avisos no portal, documentos de referência e exportação de dados
            para planilhas.
          </CardContent>
        </Card>
      </div>

      {/* RODAPÉ DO ESCOPO */}
      <div className="text-center text-xs text-slate-500 pt-6 border-t border-slate-200">
        <p className="font-medium text-slate-700">
          Transportadora Sulbrasileira de Gás S.A. &bull; Gestão Interna
        </p>
      </div>
    </div>
  )
}
