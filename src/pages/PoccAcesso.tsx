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
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Building2,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
  Info,
  UserCheck,
} from 'lucide-react'

export default function PoccAcesso() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, isLoading } = useAuth()

  // Estado da Tela de Autenticação Fictícia / Simulada (idêntica ao padrão de /solicitacao-acesso)
  const [loginSimuladoLiberado, setLoginSimuladoLiberado] = useState<boolean>(false)
  const [loginUsuario, setLoginUsuario] = useState<string>('')
  const [loginSenha, setLoginSenha] = useState<string>('')
  const [autenticandoSimulacao, setAutenticandoSimulacao] = useState<boolean>(false)
  const [erroLoginSimulado, setErroLoginSimulado] = useState<string | null>(null)
  const [usuarioAutenticadoSimulado, setUsuarioAutenticadoSimulado] = useState<string>('')

  // Sincroniza usuário inicial com e-mail da sessão real caso o usuário já esteja autenticado no portal
  useEffect(() => {
    if (user?.email && !loginUsuario) {
      setLoginUsuario(user.email)
    }
  }, [user, loginUsuario])

  // Handler de submissão do login fictício
  const handleLoginSimuladoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErroLoginSimulado(null)

    const usuarioLimpo = loginUsuario.trim()
    const usuarioValidoDemo = 'usuario_carregador'
    const emailSessao = user?.email?.trim().toLowerCase()

    if (!usuarioLimpo) {
      setErroLoginSimulado(
        'Informe o usuário credenciado (utilize usuario_carregador no ambiente de demonstração).',
      )
      return
    }

    const usuarioInformadoLower = usuarioLimpo.toLowerCase()
    const ehUsuarioValido =
      usuarioInformadoLower === usuarioValidoDemo.toLowerCase() ||
      (emailSessao && usuarioInformadoLower === emailSessao)

    if (!ehUsuarioValido) {
      setErroLoginSimulado(
        'Usuário não reconhecido para demonstração. Utilize usuario_carregador para prosseguir.',
      )
      return
    }

    setAutenticandoSimulacao(true)

    // Breve estado de "Autenticando..." (~1,2s)
    setTimeout(() => {
      setAutenticandoSimulacao(false)

      // Se o usuário NÃO está realmente autenticado no portal:
      // Redireciona para /login preservando o state de retorno para /pocc-acesso
      if (!isAuthenticated) {
        navigate('/login', {
          replace: true,
          state: { from: { pathname: location.pathname, search: location.search } },
        })
        return
      }

      // Se o usuário está realmente autenticado: libera a área restrita
      setUsuarioAutenticadoSimulado(usuarioLimpo)
      setLoginSimuladoLiberado(true)
    }, 1200)
  }

  // Dados do usuário autenticado no padrão LGPD
  const userRazaoSocial =
    (user?.razao_social as string) || (user?.name as string) || 'Carregador Cadastrado'
  const userCnpj = (user?.cnpj as string) || 'Não informado no cadastro'
  const userResponsavel = (user?.responsavel as string) || (user?.name as string) || 'Não informado'
  const userEmail = (user?.email as string) || usuarioAutenticadoSimulado || 'Não informado'

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <RefreshCw className="h-4 w-4 animate-spin text-[#0a2540]" />
          <span>Verificando credenciais e preparando ambiente seguro...</span>
        </div>
      </div>
    )
  }

  // TELA DE AUTENTICAÇÃO FICTÍCIA (PORTÃO INICIAL)
  if (!loginSimuladoLiberado) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 animate-fade-in">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg p-6 sm:p-8 space-y-6">
          {/* CABEÇALHO INSTITUCIONAL SÓBRIO */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-slate-50 border border-slate-200 text-[#0a2540] mb-1">
              <Lock className="h-6 w-6 text-[#0284c7]" />
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#0a2540] text-white tracking-wider uppercase font-display">
              Área Restrita · POC
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0a2540] font-display">
              Acesso do Carregador
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              Processo de Oferta e Contratação de Capacidade (Res. ANP nº 961/2023, Art. 37-A)
            </p>{' '}
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
              <Label htmlFor="loginUsuarioPocc" className="text-xs font-semibold text-slate-700">
                Usuário do Carregador
              </Label>
              <Input
                id="loginUsuarioPocc"
                type="text"
                placeholder="usuario_carregador"
                value={loginUsuario}
                onChange={(e) => setLoginUsuario(e.target.value)}
                className="text-xs bg-white text-slate-900 border-slate-300 focus-visible:ring-[#0284c7]"
                disabled={autenticandoSimulacao}
                autoComplete="username"
              />
              <p className="text-[11px] text-slate-500">
                Ambiente demonstrativo: utilize{' '}
                <span className="font-mono font-medium text-slate-700">usuario_carregador</span> ou
                seu e-mail de cadastro.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="loginSenhaPocc" className="text-xs font-semibold text-slate-700">
                  Senha
                </Label>
                <span className="text-[11px] text-slate-400">Opcional na demonstração</span>
              </div>
              <Input
                id="loginSenhaPocc"
                type="password"
                placeholder="Em branco ou qualquer valor"
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
                    Entrar na Área Segura do POC
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* RODAPÉ DO CARD */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200">
            <Link
              to="/poc"
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao POC Público
            </Link>
            <span className="text-[11px] text-slate-400">TSB S.A. &bull; Res. ANP nº 961/2023</span>
          </div>
        </div>
      </div>
    )
  }

  // ÁREA RESERVADA DO POC (APÓS AUTENTICAÇÃO)
  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* NAVEGAÇÃO SUPERIOR DE RETORNO E CONFIRMAÇÃO DE SESSÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <Link
          to="/poc"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0a2540] font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para POC Público (Documentos)
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>
            Sessão autenticada &mdash;{' '}
            <strong className="text-emerald-950 font-semibold font-sans">
              {usuarioAutenticadoSimulado || userEmail || 'Carregador'}
            </strong>
          </span>
        </span>
      </div>

      {/* CABEÇALHO DA PÁGINA AUTENTICADA */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50/70 text-[#0a2540] text-[10px] font-bold tracking-wider uppercase font-display"
          >
            Resolução ANP nº 961/2023 · Art. 37-A
          </Badge>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Ambiente Autenticado do Carregador
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Ciclo POC 2025/2026
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540] font-display">
          Área Restrita do Carregador · POC
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl text-justify sm:text-left">
          Ambiente restrito e seguro da{' '}
          <strong>Transportadora Sulbrasileira de Gás S.A. (TSB)</strong> destinado à submissão
          eletrônica dos atos regulatórios reservados do Processo de Oferta e Contratação de
          Capacidade (Resolução ANP nº 961/2023, Art. 37-A, §5º). Em conformidade com a LGPD e as
          normas da ANP, o acesso a estes atos é restrito a carregadores credenciados e seus
          representantes legais.
        </p>
      </div>

      {/* BLOCO MEUS DADOS (LGPD COMPLIANT) */}
      <Card className="border border-slate-200 shadow-xs bg-white">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-[#0a2540]">
              <UserCheck className="h-4 w-4 text-[#0284c7]" />
              <CardTitle className="text-sm font-bold font-display">
                Identificação do Carregador Autenticado (LGPD)
              </CardTitle>
            </div>
            <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
              Dados resguardados nos termos da Lei nº 13.709/2018
            </span>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Informações cadastrais vinculadas à sessão autenticada. Os dados dos representantes
            legais só são exibidos e processados em ambiente protegido.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Razão Social:</span>
              <strong className="text-slate-900 font-medium">{userRazaoSocial}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">CNPJ:</span>
              <strong className="text-slate-900 font-mono font-medium">{userCnpj}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">E-mail da Sessão:</span>
              <strong className="text-slate-900 font-mono font-medium">{userEmail}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Representante Legal:</span>
              <strong className="text-slate-900 font-medium">{userResponsavel}</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ATOS RESERVADOS DO PROCESSO (ENXUTO E INFORMATIVO) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#0a2540] font-display flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#0284c7]" />
            Atos Regulatórios Reservados (Art. 37-A, § 5º)
          </h2>
          <p className="text-xs text-slate-500">
            Etapas conduzidas sob autenticação conforme o cronograma oficial homologado pela ANP
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CARD 1: MANIFESTAÇÃO DE INTERESSE */}
          <Card className="border border-slate-200 shadow-xs bg-white flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#0a2540] text-white font-mono">
                  Etapa I · Art. 37-A, § 5º, I
                </span>
                <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Aguardando Abertura de Fase
                </span>
              </div>
              <CardTitle className="text-base font-bold text-[#0a2540] font-display pt-2">
                Manifestação de Interesse Não Vinculante
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Mapeamento preliminar de demanda e identificação dos potenciais carregadores
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 text-xs text-slate-600 space-y-3 flex-1 flex flex-col justify-between">
              <p className="leading-relaxed">
                Submissão formal dos volumes pretendidos de capacidade de transporte firme nos
                pontos de entrada e zonas de saída da TSB, sem exigência de garantia financeira e
                sem vínculo contratual imediato.
              </p>
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Disponível na próxima fase do cronograma oficial</span>
                </div>
                <Button
                  disabled
                  variant="outline"
                  className="w-full text-xs text-slate-400 border-slate-200 cursor-not-allowed bg-slate-50"
                >
                  Submeter Manifestação (Disponível em breve)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: PROPOSTA GARANTIDA VINCULANTE */}
          <Card className="border border-slate-200 shadow-xs bg-white flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#0a2540] text-white font-mono">
                  Etapa III · Art. 37-A, § 5º, III
                </span>
                <span className="text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  Fase Futura (Após Aprovação ANP)
                </span>
              </div>
              <CardTitle className="text-base font-bold text-[#0a2540] font-display pt-2">
                Proposta Garantida Vinculante
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Apresentação de propostas firmes com aporte de garantia idônea
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 text-xs text-slate-600 space-y-3 flex-1 flex flex-col justify-between">
              <p className="leading-relaxed">
                Apresentação de proposta firme de contratação pelo Carregador após a aprovação da
                proposta tarifária pela ANP (Etapa II), acompanhada de garantia de proposta conforme
                previsto no edital/regulamento aprovado.
              </p>
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Disponível após homologação da Etapa II pela ANP</span>
                </div>
                <Button
                  disabled
                  variant="outline"
                  className="w-full text-xs text-slate-400 border-slate-200 cursor-not-allowed bg-slate-50"
                >
                  Submeter Proposta Vinculante (Fase Futura)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AVISO REGULATÓRIO */}
      <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 flex items-start gap-3">
        <Info className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-800">Diretrizes da ANP: </span>
          O cronograma e a liberação das etapas obedecem aos prazos preclusivos fixados pela Agência
          Nacional do Petróleo, Gás Natural e Biocombustíveis. Novas funcionalidades e formulários
          serão disponibilizados nesta área restrita conforme as publicações oficiais no Diário
          Oficial da União.
        </div>
      </div>

      {/* RODAPÉ */}
      <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200 space-y-1">
        <p>
          Transportadora Sulbrasileira de Gás S.A. &bull; Resolução ANP nº 961/2023 &bull; Resolução
          ANP nº 11/2016
        </p>
        <p>
          Contato do POC:{' '}
          <a
            href="mailto:comercial@tsb.com.br"
            className="text-[#0284c7] hover:underline font-medium"
          >
            comercial@tsb.com.br
          </a>
        </p>
      </div>
    </div>
  )
}
