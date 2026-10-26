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
  FileText,
  DollarSign,
  Users,
  Clock,
  BookOpen,
  CheckCircle2,
  ListTodo,
  LogOut,
  FolderGit2,
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
      <div className="bg-white border-t-4 border-t-[#0a2540] border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#0a2540] text-white tracking-wider uppercase font-display">
            Área Restrita TSB
          </span>
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-[#0284c7] border border-sky-200 flex items-center gap-1">
            <ListTodo className="h-3 w-3" />
            Roadmap Arquitetural
          </span>
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Versão de Planejamento Técnico
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540] font-display">
          Gestão Interna — Escopo a Desenvolver
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl text-justify sm:text-left">
          Documento técnico e estrutural consolidando todos os módulos funcionais, fluxos de
          editoria e controles regulatórios que comporão a versão final do painel administrativo
          interno da <strong>Transportadora Sulbrasileira de Gás S.A. (TSB)</strong>. O escopo
          abaixo especifica as responsabilidades operacionais, pilares de transparência segundo as
          resoluções da ANP e governança de dados nos termos da LGPD.
        </p>
      </div>

      {/* SEÇÕES DO ROADMAP (CARDS FORMATADOS) */}
      <div className="space-y-6">
        {/* TÓPICO 1: PORTÃO DE AUTENTICAÇÃO */}
        <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-[#0a2540]">
              <div className="p-1.5 bg-slate-200/70 rounded text-[#0a2540]">
                <KeyRound className="h-4 w-4 text-[#0284c7]" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  1. Portão de Autenticação da Equipe TSB
                </CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Segurança perimetral, fatores adicionais e segmentação de privilégios de acesso
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-3 text-xs text-slate-700">
            <ul className="space-y-2.5 list-none">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Autenticação Forte e Segura:</strong> Integração com provedor corporativo,
                  geração de tokens temporários de sessão autenticada e previsão de camada
                  multifator (2FA) para operadores com privilégios elevados.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Segmentação por Papéis Internos (RBAC):</strong> Perfis granulares
                  distinguindo <em>Editor de Conteúdo</em> (alimenta Boletim e Plataforma),{' '}
                  <em>Operador de Fila</em> (analisa solicitações do Inciso VII e cessões do Inciso
                  VIII) e <em>Administrador do Sistema</em> (gerencia credenciais e auditoria).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Proteção de Sessão e Timeout:</strong> Encerramento automático de
                  inatividade, bloqueio preventivo contra força bruta e renovação segura de
                  credenciais.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* TÓPICO 2: PAINEL INICIAL EXPLICATIVO */}
        <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-[#0a2540]">
              <div className="p-1.5 bg-slate-200/70 rounded text-[#0a2540]">
                <FolderGit2 className="h-4 w-4 text-[#0284c7]" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  2. Painel Inicial e Escopo de Gestão do Portal
                </CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Visão executiva e delimitação clara das atribuições de cada módulo operacional
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-3 text-xs text-slate-700">
            <ul className="space-y-2.5 list-none">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Transparência Regulatória ANP:</strong> Manutenção centralizada das
                  publicações obrigatórias determinadas pela Resolução ANP nº 11/2016 e Portaria ANP
                  nº 1/2003, assegurando conformidade contínua e tempestividade das publicações.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Fila e Triagem de Solicitações VII:</strong> Recepção, qualificação
                  jurídica e encaminhamento técnico dos pedidos de acesso formulados pelos
                  carregadores.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Administração de Credenciais e Conteúdo Público:</strong> Manutenção do
                  catálogo informativo, quadro de tarifas vigentes, avisos operacionais em banner e
                  autorização de acesso às áreas autenticadas.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* TÓPICO 3: EDITORIA COMPLETA DA TRANSPARÊNCIA */}
        <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-[#0a2540]">
              <div className="p-1.5 bg-slate-200/70 rounded text-[#0a2540]">
                <Layers className="h-4 w-4 text-[#0284c7]" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  3. Editoria Completa da Transparência Separada por Pilar
                </CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Gestão individualizada dos 3 blocos oficiais mantidos no Portal de Transparência
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4 text-xs text-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="font-bold text-[#0a2540] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0284c7]"></span>
                  Pilar 1: Boletim Eletrônico
                </div>
                <p className="text-slate-600 leading-relaxed text-justify">
                  Editoria das alíneas <strong>a) a j)</strong> da Portaria ANP nº 1/2003, incluindo
                  o Item II (histórico de versões anteriores nos termos do §2º), upload de
                  relatórios mensais aprovados, notas técnicas e detalhamento de capacidade firme
                  com padrão NTS.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="font-bold text-[#0a2540] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0284c7]"></span>
                  Pilar 2: Plataforma Eletrônica
                </div>
                <p className="text-slate-600 leading-relaxed text-justify">
                  Gestão dos <strong>Incisos I a VIII</strong> do Art. 9º da Resolução ANP nº
                  11/2016: formulários completos de inserção, edição e exclusão de textos, prévias
                  gráficas, upload de PDFs anexos e links regulatórios para download oficial.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="font-bold text-[#0a2540] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0284c7]"></span>
                  Pilar 3: Monitoramento Art. 11
                </div>
                <p className="text-slate-600 leading-relaxed text-justify">
                  Ciclo mensal de monitoramento de congestionamento: publicação em PDF do relatório
                  homologado ou declaração formal de ausência de congestionamento contratual e
                  físico (padrão regulatório TAG/TBG/NTS).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TÓPICO 4: QUADRO DE TARIFA EM DESTAQUE */}
        <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-[#0a2540]">
              <div className="p-1.5 bg-slate-200/70 rounded text-[#0a2540]">
                <DollarSign className="h-4 w-4 text-[#0284c7]" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  4. Editoria do Quadro de Tarifa em Destaque
                </CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Gerenciamento da precificação extraordinária apresentada na página inicial (/)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-3 text-xs text-slate-700">
            <ul className="space-y-2.5 list-none">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Parâmetros Contratuais Editáveis:</strong> Identificação do contrato
                  (&ldquo;TARIFA CONTRATO EXTRAORDINÁRIO TRECHO T3 – 2026&rdquo;), trecho
                  regulatório especificado, período de vigência e valor homologado em R$/m³.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Formatação Automática e Textos Explicativos:</strong> Aplicação
                  padronizada do destaque &ldquo;ex-impostos&rdquo;, notas explicativas de base de
                  cálculo e condições de reajuste periódico.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Suporte a Múltiplos Cards e Alternador de Destaque:</strong> Capacidade de
                  cadastrar novos quadros para outros trechos ou contratos, alternando a exibição
                  ativa ou inativa na vitrine pública.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* TÓPICO 5: GESTÃO DE CREDENCIAIS E ACESSOS */}
        <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-[#0a2540]">
              <div className="p-1.5 bg-slate-200/70 rounded text-[#0a2540]">
                <Users className="h-4 w-4 text-[#0284c7]" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  5. Gestão de Credenciais, Acessos e LGPD
                </CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Governança de contas internas e carregadores externos com trilha de auditoria
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-3 text-xs text-slate-700">
            <ul className="space-y-2.5 list-none">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Administração da Equipe TSB:</strong> Cadastro, desativação preventiva e
                  atribuição de papéis (Editor de Conteúdo, Operador de Fila, Administrador Geral).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Gestão de Usuários Externos (Carregadores):</strong> Triagem de novos
                  cadastros, verificação de dados societários (CNPJ, razão social, representante
                  legal), bloqueio e reativação de credenciais de acesso à Área do Carregador.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Trilha de Auditoria (LGPD):</strong> Registro em log imutável de todas as
                  consultas e modificações de dados sensíveis ou concorrenciais, garantindo
                  rastreabilidade total perante os órgãos de fiscalização.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* TÓPICO 6: FILA REFINADA DO INCISO VII */}
        <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-[#0a2540]">
              <div className="p-1.5 bg-slate-200/70 rounded text-[#0a2540]">
                <Clock className="h-4 w-4 text-[#0284c7]" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  6. Fila de Solicitações do Inciso VII Refinada
                </CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Fluxo regulatório com controle temporal do SLA de 20 dias úteis (Art. 10, §2º)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-3 text-xs text-slate-700">
            <ul className="space-y-2.5 list-none">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Esteira de Triagem Regulamentar:</strong> Fases padronizadas de análise:
                  <em>Recebido</em> &rarr; <em>Em Análise Técnica</em> &rarr;{' '}
                  <em>Concluído com Parecer Fundamentado</em>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Formalização dos 3 Desfechos Legais:</strong> Emissão guiada dos desfechos
                  oficiais (I - Confirmação do Atendimento com termos e condições; II -
                  Aprofundamento da Análise com escopo, cronograma e custos; III - Negativa
                  Fundamentada com previsão de disponibilidade).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Gestão de Anexos e Notificação SMTP:</strong> Anexação do parecer assinado
                  por protocolo, reenvio automatizado de comprovantes por e-mail corporativo e cópia
                  institucional à ANP nos termos do §3º.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Monitor de SLA:</strong> Contagem regressiva em dias úteis a partir da
                  autuação, disparando alertas operacionais para evitar ultrapassagem do prazo
                  máximo regulamentar de 20 dias úteis.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* TÓPICO 7: EXTRAS REGULATÓRIOS E FERRAMENTAS */}
        <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-[#0a2540]">
              <div className="p-1.5 bg-slate-200/70 rounded text-[#0a2540]">
                <BookOpen className="h-4 w-4 text-[#0284c7]" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  7. Extras Regulatórios e Ferramentas Operacionais
                </CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Base normativa de apoio, avisos gerais do portal e utilitários de exportação
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-3 text-xs text-slate-700">
            <ul className="space-y-2.5 list-none">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Papelada Normativa de Referência:</strong> Repositório consolidado com a
                  legislação aplicável: <em>Portaria ANP nº 1/2003</em>,{' '}
                  <em>Resolução ANP nº 11/2016</em>, <em>Resolução ANP nº 51/2013</em> e a Nova Lei
                  do Gás (<em>Lei nº 14.134/2021</em>).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Banner de Avisos Gerais do Portal:</strong> Módulo de edição rápida para
                  publicar ou desativar alertas temporários, comunicados de manutenção operacional
                  ou chamadas institucionais no topo do site.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Exportação da Fila em CSV/Planilha:</strong> Utilitário para extração de
                  relatórios gerenciais de demandas recebidas, tempo médio de resposta e
                  consolidação estatística para prestação de contas à diretoria e à agência
                  reguladora.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* RODAPÉ DO ESCOPO */}
      <div className="text-center text-xs text-slate-500 pt-6 border-t border-slate-200 space-y-1">
        <p className="font-semibold text-slate-700">
          Transportadora Sulbrasileira de Gás S.A. &bull; Diretoria de Operações e Regulação
        </p>
        <p>
          Escopo funcional sujeito a homologação interna conforme a Resolução ANP nº 11/2016 e
          diretrizes de conformidade regulatória.
        </p>
      </div>
    </div>
  )
}
