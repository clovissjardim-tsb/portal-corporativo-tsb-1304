import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
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
  FileText,
  Clock,
  Layers,
  CheckCircle2,
  Info,
  UserCheck,
  Download,
  PlusCircle,
  CheckCircle,
  Search,
  ExternalLink,
} from 'lucide-react'
import {
  pocService,
  ManifestacaoInteressePOC,
  PropostaVinculantePOC,
  SubmissaoCompletaPOC,
  ResumoPublicoProtocoloPOC,
} from '@/services/poc'
import { FluxoSubmissaoPOC } from '@/components/FluxoSubmissaoPOC'

type ModoVisualizacao = 'dashboard' | 'fluxo_submissao'

export default function PoccAcesso() {
  const { user, isAuthenticated, isLoading } = useAuth()

  // Modo de visualização: dashboard ou fluxo sequencial único
  const [modo, setModo] = useState<ModoVisualizacao>('dashboard')

  // Submissão recém-concluída para destaque em modal / banner
  const [submissaoRecente, setSubmissaoRecente] = useState<{
    protocolo: string
    data: string
    email: string
  } | null>(null)

  // Histórico de submissões completas e legadas
  const [submissoesCompletas, setSubmissoesCompletas] = useState<SubmissaoCompletaPOC[]>([])
  const [manifestacoesLegadas, setManifestacoesLegadas] = useState<ManifestacaoInteressePOC[]>([])
  const [propostasLegadas, setPropostasLegadas] = useState<PropostaVinculantePOC[]>([])
  const [carregandoHistorico, setCarregandoHistorico] = useState<boolean>(false)

  // Consulta por Protocolo dentro da Área do Carregador
  const [termoBuscaProtocolo, setTermoBuscaProtocolo] = useState<string>('')
  const [consultandoProtocolo, setConsultandoProtocolo] = useState<boolean>(false)
  const [resultadoConsulta, setResultadoConsulta] = useState<ResumoPublicoProtocoloPOC | null>(null)
  const [erroConsulta, setErroConsulta] = useState<string | null>(null)

  // Estado da Tela de Autenticação Fictícia / Simulada
  const [loginSimuladoLiberado, setLoginSimuladoLiberado] = useState<boolean>(false)
  const [loginUsuario, setLoginUsuario] = useState<string>('')
  const [loginSenha, setLoginSenha] = useState<string>('')
  const [autenticandoSimulacao, setAutenticandoSimulacao] = useState<boolean>(false)
  const [erroLoginSimulado, setErroLoginSimulado] = useState<string | null>(null)
  const [usuarioAutenticadoSimulado, setUsuarioAutenticadoSimulado] = useState<string>('')

  // Handler de login fictício
  const handleLoginSimuladoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroLoginSimulado(null)
    setAutenticandoSimulacao(true)

    const usuarioLimpo = loginUsuario.trim() || 'usuario_carregador'

    if (!isAuthenticated) {
      try {
        await pb.collection('users').authWithPassword('clovissjardim@gmail.com', 'Skip@Pass')
      } catch (err) {
        console.warn('Aviso: sessão simulada POC sem conexão direta:', err)
      }
    }

    setTimeout(() => {
      setAutenticandoSimulacao(false)
      setUsuarioAutenticadoSimulado(usuarioLimpo)
      setLoginSimuladoLiberado(true)
    }, 800)
  }

  // Carregar histórico completo do usuário
  const carregarHistorico = useCallback(async () => {
    setCarregandoHistorico(true)
    try {
      const [completas, manifs, props] = await Promise.all([
        pocService.listarSubmissoesCompletasDoUsuario(),
        pocService.listarManifestacoesDoUsuario(),
        pocService.listarPropostasDoUsuario(),
      ])
      setSubmissoesCompletas(completas)
      setManifestacoesLegadas(manifs)
      setPropostasLegadas(props)
    } catch (err) {
      console.warn('Erro ao carregar histórico POC:', err)
    } finally {
      setCarregandoHistorico(false)
    }
  }, [])

  useEffect(() => {
    if (loginSimuladoLiberado) {
      carregarHistorico()
    }
  }, [loginSimuladoLiberado, carregarHistorico])

  // Handler de Consulta de Protocolo na Área do Carregador
  const handleConsultarProtocolo = async (e: React.FormEvent) => {
    e.preventDefault()
    const limpo = termoBuscaProtocolo.trim()
    if (!limpo) {
      setErroConsulta('Digite o número do protocolo.')
      return
    }

    setConsultandoProtocolo(true)
    setErroConsulta(null)
    setResultadoConsulta(null)

    try {
      const res = await pocService.consultarProtocoloPublico(limpo)
      if (res) {
        setResultadoConsulta(res)
      } else {
        setErroConsulta('Protocolo não localizado nos registros do POC.')
      }
    } catch (err: any) {
      setErroConsulta('Erro ao consultar protocolo: ' + (err?.message || 'tente novamente.'))
    } finally {
      setConsultandoProtocolo(false)
    }
  }

  // Dados do usuário autenticado no padrão LGPD
  const userRazaoSocial =
    (user?.razao_social as string) || (user?.name as string) || 'Carregador Habilitado'
  const userCnpj = (user?.cnpj as string) || 'Não informado no cadastro'
  const userResponsavel = (user?.responsavel as string) || (user?.name as string) || 'Não informado'
  const userEmail = (user?.email as string) || usuarioAutenticadoSimulado || 'Não informado'
  const userTelefone = (user?.telefone as string) || ''
  const userAutorizacaoAnp = (user?.autorizacao_anp as string) || ''

  const ultimaSubmissaoCompleta = submissoesCompletas[0]

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

  // TELA DE AUTENTICAÇÃO FICTÍCIA
  if (!loginSimuladoLiberado) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 animate-fade-in">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg p-6 sm:p-8 space-y-6">
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
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded border border-slate-200">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <ShieldCheck className="h-4 w-4 text-[#0284c7]" />
              Ambiente de demonstração
            </span>
            <span className="text-[11px] font-mono text-slate-500">Autenticação simulada</span>
          </div>

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
                placeholder="usuario_carregador ou e-mail"
                value={loginUsuario}
                onChange={(e) => setLoginUsuario(e.target.value)}
                className="text-xs bg-white text-slate-900 border-slate-300 focus-visible:ring-[#0284c7]"
                disabled={autenticandoSimulacao}
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="loginSenhaPocc" className="text-xs font-semibold text-slate-700">
                  Senha
                </Label>
                <span className="text-[11px] text-slate-400">Opcional</span>
              </div>
              <Input
                id="loginSenhaPocc"
                type="password"
                placeholder="••••••••"
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

  // ÁREA RESERVADA DO POC (AUTENTICADO)
  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* NAVEGAÇÃO SUPERIOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <Link
          to="/poc"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0a2540] font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para POC Público (Documentos)
        </Link>
        <div className="flex items-center gap-2">
          {modo !== 'dashboard' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModo('dashboard')}
              className="text-xs h-7 text-slate-600 hover:text-[#0a2540] border-slate-300"
            >
              Visão Geral do POC
            </Button>
          )}
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
      </div>

      {/* BANNER DE SUBMISSÃO RECENTE COM PROTOCOLO ÚNICO */}
      {submissaoRecente && (
        <div className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-xl shadow-xs animate-fade-in space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Submissão Completa Sequencial Concluída
                </span>
                <h3 className="text-base sm:text-lg font-bold text-emerald-950 font-display">
                  Processo Protocolado com Sucesso no POC
                </h3>
                <p className="text-xs text-emerald-900 leading-relaxed max-w-2xl">
                  Sua Manifestação de Interesse (PDF assinado) e sua Proposta Garantida (PDF
                  assinado + Comprovante da Garantia) foram integradas e persistidas com sucesso. O
                  comprovante oficial com o protocolo foi expedido por e-mail para{' '}
                  <strong>{submissaoRecente.email}</strong>.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSubmissaoRecente(null)}
              className="text-xs text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100"
            >
              Fechar
            </Button>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 block">Número de Protocolo Único:</span>
              <strong className="text-lg font-bold text-[#0284c7] font-mono tracking-wide">
                {submissaoRecente.protocolo}
              </strong>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-500 block">Data de Recepção:</span>
              <span className="font-medium text-slate-800">{submissaoRecente.data}</span>
            </div>
          </div>
        </div>
      )}

      {/* RENDERIZAÇÃO CONDICIONAL POR MODO */}
      {modo === 'fluxo_submissao' ? (
        <FluxoSubmissaoPOC
          onVoltar={() => setModo('dashboard')}
          onSucesso={(reg) => {
            setSubmissaoRecente({
              protocolo: reg.protocolo,
              data: new Date().toLocaleDateString('pt-BR'),
              email: reg.email,
            })
            setModo('dashboard')
            carregarHistorico()
          }}
          dadosPadrao={{
            razaoSocial: userRazaoSocial,
            cnpj: userCnpj !== 'Não informado no cadastro' ? userCnpj : '',
            responsavel: userResponsavel !== 'Não informado' ? userResponsavel : '',
            email: userEmail !== 'Não informado' ? userEmail : '',
            telefone: userTelefone,
            autorizacaoAnp: userAutorizacaoAnp,
          }}
        />
      ) : (
        /* DASHBOARD PRINCIPAL */
        <>
          {/* CABEÇALHO */}
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
                Ciclo POC 2026/2027
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540] font-display">
              Área Restrita do Carregador · POC
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl text-justify sm:text-left">
              Ambiente restrito e seguro da{' '}
              <strong>Transportadora Sulbrasileira de Gás S.A. (TSB)</strong> destinado à condução e
              submissão integrada do Processo de Oferta e Contratação de Capacidade (Resolução ANP
              nº 961/2023, Art. 37-A). Em conformidade com a LGPD e as normas regulatórias, o
              processo é conduzido em fluxo sequencial unificado com expedição de protocolo oficial
              por e-mail.
            </p>
          </div>

          {/* IDENTIFICAÇÃO DO CARREGADOR (LGPD) */}
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
                Informações cadastrais vinculadas à sessão autenticada.
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
                  <span className="text-slate-500 block text-[11px]">Representante:</span>
                  <strong className="text-slate-900 font-medium">{userResponsavel}</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD CENTRAL: NOVO FLUXO ÚNICO SEQUENCIAL */}
          <Card className="border-2 border-[#0284c7]/30 bg-gradient-to-br from-white to-sky-50/30 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#0a2540] text-white font-mono">
                    Fluxo Único Integrado
                  </span>
                  <span className="text-[11px] font-semibold text-[#0284c7]">
                    Etapa 1 ➔ Etapa 2 ➔ Etapa 3 (Envio)
                  </span>
                </div>
                {ultimaSubmissaoCompleta && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded flex items-center gap-1 font-mono">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    SUBMISSÃO ATIVA: {ultimaSubmissaoCompleta.protocolo}
                  </span>
                )}
              </div>
              <CardTitle className="text-lg font-bold text-[#0a2540] font-display pt-2">
                Submissão Sequencial do POC (Manifestação + Proposta Garantida)
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Processo sequencial estruturado: preenche e anexa o PDF assinado da Manifestação,
                preenche e anexa a Proposta com comprovante de garantia, e envia tudo de forma
                unificada com protocolo por e-mail.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <span className="font-bold text-[#0a2540] block">
                    Etapa 1: Manifestação de Interesse
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Preencha os dados, gere o PDF, assine eletronicamente e anexe o PDF assinado.
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <span className="font-bold text-[#0a2540] block">
                    Etapa 2: Proposta Garantida
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Defina critério de leilão, anexe comprovante de garantia e o PDF assinado.
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <span className="font-bold text-[#0a2540] block">Etapa 3: Revisão e Envio</span>
                  <p className="text-[11px] text-slate-500">
                    Confira os dados, confirme o envio definitivo e receba o protocolo por e-mail.
                  </p>
                </div>
              </div>

              {ultimaSubmissaoCompleta && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-emerald-900 font-semibold text-[11px]">
                      Última Submissão Registrada:
                    </span>
                    <strong className="text-[#0a2540] font-mono text-xs">
                      {ultimaSubmissaoCompleta.protocolo} &bull; Status:{' '}
                      {ultimaSubmissaoCompleta.status}
                    </strong>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1 border-t border-emerald-200/60">
                    <div>
                      <span>Capacidade Proposta: </span>
                      <strong className="text-slate-900 font-mono">
                        {Number(ultimaSubmissaoCompleta.capacidade_proposta || 0).toLocaleString(
                          'pt-BR',
                        )}{' '}
                        mil m³/dia
                      </strong>
                    </div>
                    <div>
                      <span>Garantia: </span>
                      <strong className="text-slate-900">
                        {ultimaSubmissaoCompleta.garantia_tipo} (R${' '}
                        {Number(ultimaSubmissaoCompleta.garantia_valor || 0).toLocaleString(
                          'pt-BR',
                        )}
                        )
                      </strong>
                    </div>
                    <div>
                      <span>Data: </span>
                      <span className="text-slate-900">
                        {new Date(ultimaSubmissaoCompleta.created).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  Os formulários anteriores foram unificados neste fluxo contínuo.
                </span>
                <Button
                  type="button"
                  onClick={() => setModo('fluxo_submissao')}
                  className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-semibold px-6 py-2.5 h-auto shadow-sm cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4 mr-2 text-sky-300" />
                  {ultimaSubmissaoCompleta
                    ? 'Iniciar Nova Submissão no POC'
                    : 'Iniciar Submissão Sequencial do POC'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CONSULTA DE PROTOCOLO DO POC (PADRÃO DO INCISO VII) */}
          <Card className="border border-slate-200 shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-[#0a2540]">
                  <Search className="h-4 w-4 text-[#0284c7]" />
                  <CardTitle className="text-sm font-bold font-display">
                    Consulta de Andamento por Protocolo POC
                  </CardTitle>
                </div>
                <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  Padrão Inciso VII · Resguardo LGPD
                </span>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Digite o número do protocolo para verificar o status e o parecer preliminar de
                análise da submissão.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <form onSubmit={handleConsultarProtocolo} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Ex: POC-2026-1234, POC-MI-... ou POC-PG-..."
                    value={termoBuscaProtocolo}
                    onChange={(e) => setTermoBuscaProtocolo(e.target.value)}
                    className="text-xs font-mono uppercase bg-white border-slate-300"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={consultandoProtocolo}
                  className="bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold shrink-0"
                >
                  {consultandoProtocolo ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Consultando...
                    </>
                  ) : (
                    <>
                      <Search className="h-3.5 w-3.5 mr-1.5" />
                      Consultar Protocolo
                    </>
                  )}
                </Button>
              </form>

              {erroConsulta && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{erroConsulta}</span>
                </div>
              )}

              {resultadoConsulta && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <span className="text-[11px] text-slate-500 block">
                        Protocolo Localizado:
                      </span>
                      <strong className="text-sm font-bold text-[#0a2540] font-mono">
                        {resultadoConsulta.protocolo}
                      </strong>
                    </div>
                    <Badge className="bg-[#0a2540] text-white text-xs">
                      {resultadoConsulta.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Ciclo / Modalidade:</span>
                      <span className="text-slate-800 font-medium">
                        POC {resultadoConsulta.ciclo}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Data de Recepção:</span>
                      <span className="text-slate-800">
                        {new Date(resultadoConsulta.created).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Capacidade Proposta:</span>
                      <span className="text-slate-800 font-mono font-medium">
                        {resultadoConsulta.capacidade_proposta
                          ? `${Number(resultadoConsulta.capacidade_proposta).toLocaleString('pt-BR')} mil m³/d`
                          : resultadoConsulta.capacidade_solicitada_manif
                            ? `${Number(resultadoConsulta.capacidade_solicitada_manif).toLocaleString('pt-BR')} mil m³/d`
                            : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                      Parecer Regulatório Oficial:
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {resultadoConsulta.parecer_fundamentado ||
                        'Submissão devidamente protocolada e em análise documental pela equipe técnica do POC.'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* HISTÓRICO CONSOLIDADO DE SUBMISSÕES */}
          {(submissoesCompletas.length > 0 ||
            manifestacoesLegadas.length > 0 ||
            propostasLegadas.length > 0) && (
            <Card className="border border-slate-200 shadow-xs bg-white">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-[#0a2540] font-display flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#0284c7]" />
                    Histórico de Submissões Desta Conta no POC
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Registros integrados da nova submissão e submissões legadas anteriores
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={carregarHistorico}
                  disabled={carregandoHistorico}
                  className="text-xs h-7 text-slate-600 border-slate-300"
                >
                  <RefreshCw
                    className={`h-3 w-3 mr-1 ${carregandoHistorico ? 'animate-spin' : ''}`}
                  />
                  Atualizar
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="divide-y divide-slate-100 text-xs">
                  {/* SUBMISSÕES COMPLETAS (NOVO FORMATO) */}
                  {submissoesCompletas.map((sub) => (
                    <div
                      key={sub.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-sky-50/20 px-2 rounded-md my-1"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0a2540]">
                            {sub.protocolo}
                          </span>
                          <span className="text-[10px] px-2 py-0.2 rounded bg-sky-100 text-sky-900 border border-sky-300 font-semibold uppercase">
                            Submissão Integrada
                          </span>
                          <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {sub.status || 'Submetida'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {sub.razao_social} &bull; Proposta:{' '}
                          <span className="font-mono font-medium text-slate-900">
                            {Number(sub.capacidade_proposta || 0).toLocaleString('pt-BR')} mil m³/d
                          </span>{' '}
                          &bull; Garantia:{' '}
                          <span className="text-slate-800 font-medium">
                            {sub.garantia_tipo} (R${' '}
                            {Number(sub.garantia_valor || 0).toLocaleString('pt-BR')})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span className="text-[11px] text-slate-400">
                          {new Date(sub.created).toLocaleDateString('pt-BR')}
                        </span>
                        {sub.arquivo_proposta_assinada && (
                          <a
                            href={pb.files.getURL(sub, sub.arquivo_proposta_assinada)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#0284c7] hover:underline font-medium ml-2"
                          >
                            <Download className="h-3 w-3" />
                            PDF Proposta
                          </a>
                        )}
                        {sub.arquivo_manifestacao_assinada && (
                          <a
                            href={pb.files.getURL(sub, sub.arquivo_manifestacao_assinada)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#0284c7] hover:underline font-medium ml-2"
                          >
                            <Download className="h-3 w-3" />
                            PDF Manif
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* MANIFESTAÇÕES LEGADAS */}
                  {manifestacoesLegadas.map((m) => (
                    <div
                      key={m.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0a2540]">{m.protocolo}</span>
                          <span className="text-[10px] px-2 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                            Manifestação (Legada)
                          </span>
                          <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {m.status || 'Submetida'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {m.razao_social} &bull; Trecho:{' '}
                          <span className="text-slate-700">{m.trecho || '—'}</span> &bull;
                          Capacidade:{' '}
                          <span className="font-mono font-medium text-slate-900">
                            {Number(m.capacidade_solicitada || 0).toLocaleString('pt-BR')} mil m³/d
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span className="text-[11px] text-slate-400">
                          {new Date(m.created).toLocaleDateString('pt-BR')}
                        </span>
                        {m.arquivo_formulario && (
                          <a
                            href={pb.files.getURL(m, m.arquivo_formulario)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#0284c7] hover:underline font-medium ml-2"
                          >
                            <Download className="h-3 w-3" />
                            PDF
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* PROPOSTAS LEGADAS */}
                  {propostasLegadas.map((p) => (
                    <div
                      key={p.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0a2540]">{p.protocolo}</span>
                          <span className="text-[10px] px-2 py-0.2 rounded bg-red-50 text-red-900 border border-red-200 font-medium">
                            Proposta (Legada)
                          </span>
                          <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {p.status || 'Submetida'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.razao_social} &bull; Trecho/Ponto:{' '}
                          <span className="text-slate-700">{p.trecho || '—'}</span> &bull;
                          Capacidade:{' '}
                          <span className="font-mono font-medium text-slate-900">
                            {Number(p.capacidade_proposta || 0).toLocaleString('pt-BR')} mil m³/d
                          </span>{' '}
                          &bull; Garantia: <span className="text-slate-700">{p.garantia_tipo}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span className="text-[11px] text-slate-400">
                          {new Date(p.created).toLocaleDateString('pt-BR')}
                        </span>
                        {p.arquivo_proposta_assinada && (
                          <a
                            href={pb.files.getURL(p, p.arquivo_proposta_assinada)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#0284c7] hover:underline font-medium ml-2"
                          >
                            <Download className="h-3 w-3" />
                            PDF
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AVISO REGULATÓRIO */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 flex items-start gap-3">
            <Info className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-slate-800">Diretrizes da ANP: </span>
              O cronograma e a liberação das etapas obedecem aos prazos preclusivos fixados pela
              Agência Nacional do Petróleo, Gás Natural e Biocombustíveis. Novas funcionalidades e
              formulários serão disponibilizados nesta área restrita conforme as publicações
              oficiais no Diário Oficial da União.
            </div>
          </div>

          {/* RODAPÉ */}
          <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200 space-y-1">
            <p>
              Transportadora Sulbrasileira de Gás S.A. &bull; Resolução ANP nº 961/2023 &bull;
              Resolução ANP nº 11/2016
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
        </>
      )}
    </div>
  )
}
