import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
import { pocService, ManifestacaoInteressePOC, CronogramaEtapaPOC } from '@/services/poc'
import { solicitacoesService, SolicitacaoIncisoVII } from '@/services/solicitacoes'
import {
  transparenciaService,
  ItemTransparencia,
  resolverUrlDocumento,
} from '@/services/transparencia'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Send,
  Download,
  Building2,
  Lock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Scale,
  Sparkles,
  X,
  FileCheck2,
  ExternalLink,
} from 'lucide-react'

// 5 etapas literais do Art. 37-A, §5º da Resolução ANP nº 11/2016 (com redação da Res. 961/2023)
const ETAPAS_ART37A = [
  {
    numero: 1,
    romano: 'I',
    titulo: 'Identificação e Manifestação de Interesse',
    inciso: 'Art. 37-A, §5º, I',
    descricao:
      'Identificação dos potenciais Carregadores e manifestação de interesse não vinculante, etapa na qual é estimada a demanda.',
  },
  {
    numero: 2,
    romano: 'II',
    titulo: 'Aprovação das Tarifas ANP & Redistribuição',
    inciso: 'Art. 37-A, §5º, II',
    descricao:
      'Aprovação pela ANP das Tarifas de Referência e da eventual redistribuição da Capacidade Disponível.',
  },
  {
    numero: 3,
    romano: 'III',
    titulo: 'Propostas Garantidas & Alocação',
    inciso: 'Art. 37-A, §5º, III',
    descricao: 'Análise das propostas garantidas vinculantes e alocação de capacidade sem leilão.',
  },
  {
    numero: 4,
    romano: 'IV',
    titulo: 'Celebração dos Instrumentos & Garantias',
    inciso: 'Art. 37-A, §5º, IV',
    descricao:
      'Celebração dos instrumentos contratuais definitivos e apresentação das respectivas garantias.',
  },
  {
    numero: 5,
    romano: 'V',
    titulo: 'Envio dos Contratos para Registro na ANP',
    inciso: 'Art. 37-A, §5º, V',
    descricao:
      'Envio dos contratos celebrados para homologação e registro na ANP, conforme disposto no art. 26.',
  },
]

export function POC() {
  const { user, isAuthenticated, logout } = useAuth()
  const { toast } = useToast()

  // Estados dos dados POCC
  const [minhasManifestacoes, setMinhasManifestacoes] = useState<ManifestacaoInteressePOC[]>([])
  const [cronograma, setCronograma] = useState<CronogramaEtapaPOC[]>([])
  const [instrumentosNormativos, setInstrumentosNormativos] = useState<ItemTransparencia[]>([])
  const [carregandoDados, setCarregandoDados] = useState(false)

  // Consulta Inciso VII (Protocolo & SLA)
  const [consultaProtocolo, setConsultaProtocolo] = useState('')
  const [consultandoProtocolo, setConsultandoProtocolo] = useState(false)
  const [resultadoConsulta, setResultadoConsulta] = useState<{
    buscado: boolean
    encontrado: boolean
    protocoloPesquisado: string
    dados?: SolicitacaoIncisoVII
  } | null>(null)

  // Modal Manifestação de Interesse (Etapa I, não vinculante)
  const [modalManifestacaoAberto, setModalManifestacaoAberto] = useState(false)
  const [enviandoForm, setEnviandoForm] = useState(false)

  // Formulário essencial da Manifestação de Interesse (Art. 37-A, §5º, I e Art. 10 da Res. 11/2016)
  const [formManif, setFormManif] = useState({
    razao_social: '',
    cnpj: '',
    capacidade_solicitada: 150000,
    modalidade: 'Firme Ordinário' as 'Firme Ordinário' | 'Extraordinário' | 'Interruptível',
    trecho: 'Gasoduto Uruguaiana - Triunfo (Trechos 1 e 3)',
    ponto_recebimento: 'EMED Paso de Los Libres (Fronteira Argentina)',
    ponto_entrega: 'Triunfo (Polo Petroquímico)',
    periodo_vigencia: '2026/2027',
    declaracao_nao_vinculante: true,
  })

  // Pré-preenchimento dos dados cadastrais do Carregador autenticado
  useEffect(() => {
    if (user) {
      setFormManif((prev) => ({
        ...prev,
        razao_social:
          (user as unknown as { razao_social?: string }).razao_social || user.name || '',
        cnpj: (user as unknown as { cnpj?: string }).cnpj || '',
      }))
    }
  }, [user])

  // Carregar dados normativos, cronograma e manifestações
  const carregarDados = useCallback(async () => {
    setCarregandoDados(true)
    try {
      const [crono, itensTransp] = await Promise.all([
        pocService.listarCronograma('2026/2027').catch(() => []),
        transparenciaService.listarPorSecao('plataforma_inciso').catch(() => []),
      ])

      setCronograma(crono)

      // Filtrar os 3 instrumentos do Art. 37-A §2º
      const chavesArt37A = ['pocc_regulamento', 'pocc_minuta_contrato', 'pocc_proposta_tarifaria']
      const docs = itensTransp.filter((it) => chavesArt37A.includes(it.chave))
      setInstrumentosNormativos(docs)

      if (pb.authStore.record?.id) {
        const manifs = await pocService.listarManifestacoesDoUsuario().catch(() => [])
        setMinhasManifestacoes(manifs)
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do POCC:', err)
    } finally {
      setCarregandoDados(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados, isAuthenticated])

  // Consulta de Protocolo & SLA (Inciso VII)
  const handleConsultarProtocolo = async (e: React.FormEvent) => {
    e.preventDefault()
    const protoLimpo = consultaProtocolo.trim().toUpperCase()
    if (!protoLimpo) {
      toast({
        title: 'Informe o protocolo',
        description: 'Digite o número do protocolo regulatório no formato TSB-AAAA-XXXX.',
        variant: 'destructive',
      })
      return
    }

    setConsultandoProtocolo(true)
    try {
      const res = await solicitacoesService.buscarPorProtocolo(protoLimpo)
      if (res) {
        setResultadoConsulta({
          buscado: true,
          encontrado: true,
          protocoloPesquisado: protoLimpo,
          dados: res,
        })
      } else {
        setResultadoConsulta({
          buscado: true,
          encontrado: false,
          protocoloPesquisado: protoLimpo,
        })
      }
    } catch (err) {
      console.error('Erro ao consultar protocolo:', err)
      setResultadoConsulta({
        buscado: true,
        encontrado: false,
        protocoloPesquisado: protoLimpo,
      })
    } finally {
      setConsultandoProtocolo(false)
    }
  }

  // Submissão da Manifestação de Interesse (Etapa I — Não Vinculante)
  const handleEnviarManifestacao = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast({
        title: 'Autenticação necessária',
        description: 'Faça login com sua conta de Carregador para solicitar acesso ao POCC.',
        variant: 'destructive',
      })
      return
    }

    if (!formManif.razao_social.trim() || !formManif.cnpj.trim()) {
      toast({
        title: 'Dados cadastrais obrigatórios',
        description: 'Razão Social e CNPJ do Carregador são indispensáveis.',
        variant: 'destructive',
      })
      return
    }

    setEnviandoForm(true)
    try {
      const nova = await pocService.criarManifestacao({
        ciclo: '2026/2027',
        razao_social: formManif.razao_social,
        cnpj: formManif.cnpj,
        email: user?.email || '',
        telefone: (user as unknown as { telefone?: string })?.telefone || '',
        responsavel_nome:
          (user as unknown as { responsavel?: string })?.responsavel || user?.name || '',
        autorizacao_anp: (user as unknown as { autorizacao_anp?: string })?.autorizacao_anp || '',
        capacidade_solicitada: Number(formManif.capacidade_solicitada),
        modalidade: formManif.modalidade,
        trecho: formManif.trecho,
        ponto_recebimento: formManif.ponto_recebimento,
        ponto_entrega: formManif.ponto_entrega,
        periodo_vigencia: formManif.periodo_vigencia,
        declaracao_anp_aceita: formManif.declaracao_nao_vinculante,
      })

      setMinhasManifestacoes((prev) => [nova, ...prev])
      setModalManifestacaoAberto(false)
      toast({
        title: 'Manifestação de Interesse Registrada!',
        description: `Protocolo único gerado: ${nova.protocolo}. Acompanhe as próximas etapas do Art. 37-A.`,
      })
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Falha ao registrar manifestação de interesse.'
      toast({
        title: 'Erro no envio',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setEnviandoForm(false)
    }
  }

  // Determinar a etapa atual do carregador autenticado na linha do tempo
  const temManifestacao = minhasManifestacoes.length > 0
  const ultimaManifestacao = minhasManifestacoes[0]
  // Etapa padrão: I (Fase Ativa); se houver manifestação habilitada ou proposta, avança
  let etapaAtivaNumero = 1
  if (temManifestacao) {
    if (ultimaManifestacao.status?.toLowerCase().includes('habilitad')) {
      etapaAtivaNumero = 2
    } else if (ultimaManifestacao.status?.toLowerCase().includes('alocad')) {
      etapaAtivaNumero = 4
    } else if (ultimaManifestacao.status?.toLowerCase().includes('conclu')) {
      etapaAtivaNumero = 5
    }
  }

  // Slots do Art. 37-A §2º com fallback honesto
  const slotsArt37A = [
    {
      chave: 'pocc_regulamento',
      inciso: 'Art. 37-A, §1º, I e §2º',
      titulo: 'Minuta do Regulamento para Oferta e Contratação de Capacidade',
      descricao:
        'Regras operacionais, requisitos de habilitação, metodologia de alocação e garantias exigidas dos Carregadores.',
      fallbackUrl: '',
      fallbackNome: 'Regulamento do POCC (PDF)',
    },
    {
      chave: 'pocc_minuta_contrato',
      inciso: 'Art. 37-A, §1º, II e §2º',
      titulo: 'Minuta do Contrato de Serviço de Transporte de Gás Natural',
      descricao:
        'Minuta padronizada do Contrato de Serviço de Transporte Firme exigida pela Resolução ANP nº 961/2023.',
      fallbackUrl:
        'https://www.tsb.com.br/wp-content/uploads/2025/03/CONTRATO-MASTER-TSB-2025-2029.pdf',
      fallbackNome: 'Minuta Contrato de Transporte (PDF)',
    },
    {
      chave: 'pocc_proposta_tarifaria',
      inciso: 'Art. 37-A, §1º, III e §2º',
      titulo: 'Proposta Tarifária e Tarifas de Referência',
      descricao:
        'Proposta tarifária submetida à Consulta Pública Tarifária e homologada pela ANP para o ciclo.',
      fallbackUrl: '',
      fallbackNome: 'Proposta Tarifária (PDF)',
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* =========================================================================
          CABEÇALHO DA ÁREA DO CARREGADOR (LIMPO E SÓBRIO)
          ========================================================================= */}
      <div className="border-b border-slate-200 pb-5 pt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Plataforma Eletrônica de Contratação
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0a2540] tracking-tight">
            Área do Carregador — POCC TSB
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Ambiente exclusivo para consulta de protocolos, manifestação de interesse em capacidade
            firme e acompanhamento das etapas do Art. 37-A da Resolução ANP nº 11/2016 (alterada
            pela Resolução ANP nº 961/2023).
          </p>
        </div>

        {/* IDENTIFICAÇÃO E AÇÃO DA SESSÃO */}
        <div className="flex items-center gap-3 self-start md:self-center shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="text-left text-xs">
                <div className="font-bold text-[#0a2540] truncate max-w-[180px]">
                  {user?.name || user?.email}
                </div>
                <div className="text-[10px] text-slate-500">Carregador Autenticado</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-[11px] text-slate-600 hover:text-red-600 hover:bg-red-50 h-7 px-2 ml-1"
              >
                Sair
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/signup">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-slate-300 text-slate-700"
                >
                  Cadastrar
                </Button>
              </Link>
              <Link to="/login" state={{ from: { pathname: '/poc' } }}>
                <Button
                  size="sm"
                  className="bg-[#0a2540] hover:bg-[#13395e] text-white text-xs font-semibold"
                >
                  Entrar com Login
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          HERO BANNER: CTA PRINCIPAL "SOLICITAR ACESSO AO POCC" (ETAPA I)
          ========================================================================= */}
      <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-slate-50 via-white to-sky-50/40">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-[#0a2540]">
              <Sparkles className="h-3 w-3 text-[#0284c7]" />
              Etapa I do Art. 37-A, §5º — Manifestação de Interesse Não Vinculante
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0a2540]">
              Solicitar Acesso ao POCC — Ciclo 2026/2027
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Manifeste o interesse da sua empresa na contratação de capacidade firme nos gasodutos
              da TSB. O registro é <strong>não vinculante</strong>, destina-se ao levantamento de
              demanda para homologação tarifária pela ANP e gera protocolo regulatório autuado.
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-2">
            {isAuthenticated ? (
              <Button
                onClick={() => setModalManifestacaoAberto(true)}
                className="h-11 px-6 bg-[#0a2540] hover:bg-[#13395e] text-white font-semibold text-xs sm:text-sm cursor-pointer shadow-xs transition-colors"
              >
                <Send className="h-4 w-4 mr-2 text-sky-400" />
                Solicitar Acesso ao POCC
              </Button>
            ) : (
              <Link to="/login" state={{ from: { pathname: '/poc' } }}>
                <Button className="h-11 px-6 bg-[#0a2540] hover:bg-[#13395e] text-white font-semibold text-xs sm:text-sm">
                  <Lock className="h-4 w-4 mr-2" />
                  Identifique-se para Solicitar Acesso
                </Button>
              </Link>
            )}
            <span className="text-[11px] text-slate-500 text-center sm:text-right">
              Capacidade Firme Ofertada: <strong>150.000 m³/dia</strong>
            </span>
          </div>
        </div>

        {/* HISTÓRICO DE MANIFESTAÇÕES DO PRÓPRIO CARREGADOR (SE HOUVER) */}
        {isAuthenticated && temManifestacao && (
          <div className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-2">
            <div className="text-xs font-bold text-[#0a2540] uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck2 className="h-3.5 w-3.5 text-[#0284c7]" />
              Sua Manifestação Registrada para o Ciclo Vigente:
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left bg-white border border-slate-200 rounded">
                <thead className="bg-slate-100 text-[#0a2540] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Protocolo</th>
                    <th className="p-2.5">Capacidade</th>
                    <th className="p-2.5">Modalidade</th>
                    <th className="p-2.5">Trecho</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {minhasManifestacoes.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-[#0284c7]">{m.protocolo}</td>
                      <td className="p-2.5 font-bold text-slate-800">
                        {Number(m.capacidade_solicitada).toLocaleString('pt-BR')} m³/dia
                      </td>
                      <td className="p-2.5 text-slate-700">{m.modalidade}</td>
                      <td className="p-2.5 text-slate-600">
                        {m.ponto_recebimento} &rarr; {m.ponto_entrega}
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {m.status || 'Recebida'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-500 font-mono">
                        {new Date(m.created).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* =========================================================================
          ITEM 1: CONSULTA DE PROTOCOLO & SLA (INCISO VII) — MANTIDO INTACTO
          ========================================================================= */}
      <Card className="border border-slate-200 shadow-xs bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-[#0a2540]" />
              <CardTitle className="text-base sm:text-lg font-bold text-[#0a2540]">
                Consulta de Protocolo &amp; SLA (Inciso VII)
              </CardTitle>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Art. 9º, Inciso VII e Art. 10 da Resolução ANP nº 11/2016
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Acompanhe o andamento regulatório da sua solicitação de acesso pelo número de protocolo
            autuado (SLA regulatório padrão: 20 dias úteis).
          </p>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-4">
          {/* Formulário de Busca */}
          <form onSubmit={handleConsultarProtocolo} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              value={consultaProtocolo}
              onChange={(e) => setConsultaProtocolo(e.target.value)}
              placeholder="INFORME O PROTOCOLO (EX: TSB-2026-8942)"
              className="font-mono text-xs uppercase h-11 border-slate-300 focus-visible:ring-1 focus-visible:ring-[#0a2540] flex-1 tracking-wider"
            />
            <Button
              type="submit"
              disabled={consultandoProtocolo || !consultaProtocolo.trim()}
              className="h-11 px-6 bg-[#0a2540] hover:bg-[#13395e] text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-2xs"
            >
              {consultandoProtocolo ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Consultando...
                </>
              ) : (
                'Verificar Protocolo'
              )}
            </Button>
          </form>

          {/* Resultado da Consulta do Protocolo VII */}
          {resultadoConsulta && resultadoConsulta.buscado && (
            <div className="pt-2 animate-fade-in">
              {resultadoConsulta.encontrado && resultadoConsulta.dados ? (
                (() => {
                  const sol = resultadoConsulta.dados
                  const userCnpj = (user as unknown as { cnpj?: string })?.cnpj || ''
                  const userEmail = user?.email || ''
                  const isTitular = Boolean(
                    (sol.cnpj &&
                      userCnpj &&
                      sol.cnpj.replace(/\D/g, '') === userCnpj.replace(/\D/g, '')) ||
                    (sol.email && userEmail && sol.email.toLowerCase() === userEmail.toLowerCase()),
                  )

                  return (
                    <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                      {/* Cabeçalho do Resultado */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Protocolo Autuado
                          </span>
                          <div className="font-mono font-bold text-base sm:text-lg text-[#0a2540] flex items-center gap-2">
                            <span>{sol.protocolo}</span>
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
                              {sol.status || 'Em Análise Técnica'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-left sm:text-right text-xs text-slate-600">
                          <div className="font-semibold text-slate-800">
                            SLA Regulatório: {sol.sla_dias || 20} dias úteis
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Data de Entrada:{' '}
                            {sol.created
                              ? new Date(sol.created).toLocaleDateString('pt-BR')
                              : 'Conforme Registro'}
                          </div>
                        </div>
                      </div>

                      {/* Grid Técnico */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 bg-white border border-slate-200 rounded">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">
                            Modalidade
                          </span>
                          <span className="font-semibold text-[#0a2540]">
                            {sol.modalidade || 'Firme Ordinário'}
                          </span>
                        </div>

                        <div className="p-3 bg-white border border-slate-200 rounded">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">
                            Capacidade Solicitada
                          </span>
                          <span className="font-semibold text-[#0a2540] font-mono">
                            {Number(sol.capacidade).toLocaleString('pt-BR')} m³/dia
                          </span>
                        </div>

                        <div className="p-3 bg-white border border-slate-200 rounded">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">
                            Trecho / Instalação
                          </span>
                          <span className="font-semibold text-[#0a2540] truncate block">
                            {sol.trecho || 'Gasoduto Uruguaiana - Triunfo'}
                          </span>
                        </div>

                        <div className="p-3 bg-white border border-slate-200 rounded">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">
                            Pontos (Recebimento &rarr; Entrega)
                          </span>
                          <span className="font-semibold text-[#0a2540] truncate block">
                            {sol.ponto_recebimento || 'EMED Uruguaiana'} &rarr;{' '}
                            {sol.ponto_entrega || 'Triunfo'}
                          </span>
                        </div>
                      </div>

                      {/* Dados Cadastrais se for o titular logado */}
                      {isTitular && (
                        <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded text-xs space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#0a2540] flex items-center gap-1.5 text-xs">
                              <Building2 className="h-3.5 w-3.5 text-[#0284c7]" />
                              Dados Cadastrais da Titularidade (Ambiente Seguro)
                            </span>
                            <Badge className="bg-blue-100 text-[#143b73] border-blue-300 text-[10px]">
                              Solicitante Autenticado
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700 pt-1">
                            {sol.razao_social && (
                              <div>
                                <span className="text-slate-500 font-medium">Razão Social:</span>{' '}
                                <strong className="text-slate-900">{sol.razao_social}</strong>
                              </div>
                            )}
                            {sol.cnpj && (
                              <div>
                                <span className="text-slate-500 font-medium">CNPJ:</span>{' '}
                                <strong className="font-mono text-slate-900">{sol.cnpj}</strong>
                              </div>
                            )}
                            {sol.periodo && (
                              <div>
                                <span className="text-slate-500 font-medium">
                                  Período Demandado:
                                </span>{' '}
                                <strong className="text-slate-900">{sol.periodo}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Parecer Fundamentado Técnico */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-[#0284c7]" />
                          Parecer Fundamentado da Transportadora (Art. 10, §2º da Res. ANP nº
                          11/2016):
                        </span>
                        <div className="p-3.5 bg-white border border-slate-200 rounded text-xs text-slate-700 leading-relaxed whitespace-pre-line shadow-2xs">
                          {sol.parecer_fundamentado ||
                            'Solicitação de acesso formalmente recepcionada. Em processo de análise de viabilidade técnico-operacional e verificação de capacidade ociosa nos pontos de conexão.'}
                        </div>
                      </div>

                      {/* Desfecho Regulatório se houver */}
                      {sol.desfecho_tipo && (
                        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-950 space-y-1">
                          <span className="font-bold block">
                            Desfecho Regulatório (Art. 10, §2º): {sol.desfecho_tipo}
                          </span>
                          {sol.termos_condicoes && (
                            <p className="text-[11px] text-slate-700">
                              <strong>Termos e Condições:</strong> {sol.termos_condicoes}
                            </p>
                          )}
                          {sol.previsao_disponibilidade && (
                            <p className="text-[11px] text-slate-700">
                              <strong>Previsão de Disponibilidade:</strong>{' '}
                              {sol.previsao_disponibilidade}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    Protocolo não localizado
                  </div>
                  <p className="leading-relaxed">
                    Nenhum registro foi encontrado para o código{' '}
                    <strong className="font-mono">{resultadoConsulta.protocoloPesquisado}</strong>.
                    Verifique se o número foi digitado corretamente conforme o comprovante formal
                    recebido por e-mail (Ex: TSB-2026-8942).
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Nota de rodapé da consulta */}
          <div className="text-[11px] text-slate-500 pt-1 flex items-start gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              O Parecer Fundamentado é emitido no prazo de até 20 dias úteis e registrado nos termos
              do Art. 10 da Resolução ANP nº 11/2016. Em caso de dúvidas, contate{' '}
              <strong className="text-slate-700">regulacao@tsb.com.br</strong>.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================
          ITEM 3: BLOCO NORMATIVO DO PROCESSO DE OFERTA E CONTRATAÇÃO (ART. 37-A)
          5 etapas literais do §5º com a etapa atual destacada conforme o carregador
          ========================================================================= */}
      <Card className="border border-slate-200 shadow-xs bg-white">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#0a2540]" />
              <CardTitle className="text-base sm:text-lg font-bold text-[#0a2540]">
                Rito do Processo de Oferta e Contratação de Capacidade (Art. 37-A)
              </CardTitle>
            </div>
            <p className="text-xs text-slate-500">
              Procedimento oficial de 5 etapas sequenciais estabelecido pelo §5º do Art. 37-A da
              Resolução ANP nº 11/2016 (sem etapa de leilão).
            </p>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-[#0284c7] border border-sky-200 self-start sm:self-auto">
            {temManifestacao
              ? `Etapa Atual do seu Cadastro: ${ETAPAS_ART37A[etapaAtivaNumero - 1].romano}`
              : 'Ciclo em Andamento: Etapa I'}
          </span>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {ETAPAS_ART37A.map((etapa) => {
              const isAtiva = etapa.numero === etapaAtivaNumero
              const isPassada = etapa.numero < etapaAtivaNumero

              // Tentar puxar dados customizados do cronograma persistido, se houver
              const cronoItem = cronograma.find((c) => c.numero_etapa === etapa.numero)

              return (
                <div
                  key={etapa.numero}
                  className={`p-3.5 rounded-lg border text-left flex flex-col justify-between transition-colors ${
                    isAtiva
                      ? 'border-[#0a2540] bg-slate-50/90 shadow-2xs'
                      : isPassada
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isAtiva
                            ? 'bg-[#0a2540] text-white'
                            : isPassada
                              ? 'bg-[#15803d] text-white'
                              : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isPassada ? '✓' : etapa.romano}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isAtiva
                            ? 'bg-[#0a2540] text-white'
                            : isPassada
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isAtiva ? 'Etapa Atual' : isPassada ? 'Concluída' : 'Pendente'}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono font-semibold text-[#0284c7]">
                      {etapa.inciso}
                    </div>

                    <h4 className="text-xs font-bold text-[#0a2540] leading-snug">
                      {etapa.titulo}
                    </h4>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {cronoItem?.descricao || etapa.descricao}
                    </p>
                  </div>

                  {cronoItem?.periodo_estimado && (
                    <div className="text-[10px] text-slate-500 font-mono mt-2 pt-1.5 border-t border-slate-200">
                      Prazo: {cronoItem.periodo_estimado}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              <strong>Nota Regulatória:</strong> Em conformidade com o escopo do POCC da TSB, a
              alocação é realizada diretamente a partir das propostas vinculantes garantidas e das
              tarifas homologadas pela ANP, <em>sem realização de leilão</em>.
            </span>
            <span className="font-semibold text-slate-800 shrink-0 font-mono">
              Ciclo: 2026/2027
            </span>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================
          ITEM 4: INSTRUMENTOS DO §2º DO ART. 37-A (REGULAMENTO, CONTRATO, TARIFA)
          Slots de documentos para download alimentados pela Editoria da Gestão Interna
          Estilo compacto NTS com estados vazios honestos
          ========================================================================= */}
      <Card className="border border-slate-200 shadow-xs bg-white">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#0a2540]" />
              <CardTitle className="text-base sm:text-lg font-bold text-[#0a2540]">
                Instrumentos do Art. 37-A, §2º (Documentos Oficiais)
              </CardTitle>
            </div>
            <p className="text-xs text-slate-500">
              Minuta do regulamento, minuta do Contrato de Serviço de Transporte e proposta
              tarifária disponibilizados pelo Transportador após aprovação da ANP.
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {instrumentosNormativos.length} de {slotsArt37A.length} slots publicados
          </span>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          <ul className="divide-y divide-slate-200">
            {slotsArt37A.map((slot) => {
              const itemEditavel = instrumentosNormativos.find((it) => it.chave === slot.chave)
              const resolved = itemEditavel
                ? resolverUrlDocumento(itemEditavel, slot.fallbackUrl)
                : slot.fallbackUrl
                  ? {
                      url: slot.fallbackUrl,
                      nomeExibicao: slot.fallbackNome,
                      isUpload: false,
                    }
                  : { url: '', nomeExibicao: slot.fallbackNome, isUpload: false }

              const temDoc = Boolean(resolved.url)

              return (
                <li
                  key={slot.chave}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-[#0284c7]">
                        {slot.inciso}
                      </span>
                      {temDoc && resolved.isUpload && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          PDF Oficial
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-900">
                      {itemEditavel?.titulo || slot.titulo}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {itemEditavel?.descricao || slot.descricao}
                    </p>
                  </div>

                  <div className="shrink-0 self-start sm:self-center">
                    {temDoc ? (
                      <a
                        href={resolved.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#0a2540] hover:bg-[#13395e] text-white transition-colors cursor-pointer shadow-2xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{resolved.nomeExibicao || 'Baixar Arquivo'}</span>
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200">
                        Documento será publicado após aprovação pela ANP
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
            <span>
              Gerenciado via <strong>Editoria de Transparência</strong> na Gestão Interna da TSB.
            </span>
            <span className="text-slate-400">
              Conformidade: Resolução ANP nº 961/2023 (Art. 37-A, §§ 1º ao 4º)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================
          MODAL: SUBMISSÃO DE MANIFESTAÇÃO DE INTERESSE (ETAPA I — ESSENCIAL DA NORMA)
          Razão social, CNPJ, capacidade, trecho/pontos, modalidade firme, período.
          Manifestação de interesse NÃO vinculante (§5º, I).
          ========================================================================= */}
      {modalManifestacaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 max-h-[92vh] overflow-y-auto relative">
            <button
              type="button"
              onClick={() => setModalManifestacaoAberto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 text-[#0a2540]">
              <div className="p-2 bg-sky-50 rounded-full text-[#0284c7]">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold">
                  Manifestação de Interesse ao POCC
                </h3>
                <p className="text-xs text-slate-500">
                  Etapa I do Art. 37-A, §5º da Resolução ANP nº 11/2016 (Res. 961/2023)
                </p>
              </div>
            </div>

            <form onSubmit={handleEnviarManifestacao} className="space-y-4 text-xs">
              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded text-sky-950 leading-relaxed">
                <strong>Manifestação Não Vinculante (§5º, I):</strong> Este registro formaliza a
                identificação do Carregador Interessado e a indicação de demanda para embasamento
                das Tarifas de Referência pela ANP. Não constitui obrigação financeira ou reserva
                definitiva.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="m_razao" className="text-xs font-semibold text-slate-700">
                    Razão Social do Carregador Interessado *
                  </Label>
                  <Input
                    id="m_razao"
                    required
                    value={formManif.razao_social}
                    onChange={(e) => setFormManif({ ...formManif, razao_social: e.target.value })}
                    className="h-8 text-xs bg-slate-50 font-medium"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="m_cnpj" className="text-xs font-semibold text-slate-700">
                    CNPJ *
                  </Label>
                  <Input
                    id="m_cnpj"
                    required
                    value={formManif.cnpj}
                    onChange={(e) => setFormManif({ ...formManif, cnpj: e.target.value })}
                    className="h-8 text-xs font-mono bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="m_cap" className="text-xs font-semibold text-slate-700">
                    Capacidade de Interesse (m³/dia) *
                  </Label>
                  <Input
                    id="m_cap"
                    type="number"
                    required
                    min={1}
                    value={formManif.capacidade_solicitada}
                    onChange={(e) =>
                      setFormManif({ ...formManif, capacidade_solicitada: Number(e.target.value) })
                    }
                    className="h-8 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="m_mod" className="text-xs font-semibold text-slate-700">
                    Modalidade *
                  </Label>
                  <select
                    id="m_mod"
                    value={formManif.modalidade}
                    onChange={(e) =>
                      setFormManif({
                        ...formManif,
                        modalidade: e.target.value as
                          | 'Firme Ordinário'
                          | 'Extraordinário'
                          | 'Interruptível',
                      })
                    }
                    className="w-full h-8 px-2 rounded border border-slate-300 text-xs bg-white"
                  >
                    <option value="Firme Ordinário">Firme Ordinário (POCC Anual)</option>
                    <option value="Extraordinário">Extraordinário</option>
                    <option value="Interruptível">Interruptível</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="m_trecho" className="text-xs font-semibold text-slate-700">
                    Trecho / Instalação Objeto *
                  </Label>
                  <Input
                    id="m_trecho"
                    required
                    value={formManif.trecho}
                    onChange={(e) => setFormManif({ ...formManif, trecho: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="m_rec" className="text-xs font-semibold text-slate-700">
                    Ponto de Entrada / Recebimento *
                  </Label>
                  <Input
                    id="m_rec"
                    required
                    value={formManif.ponto_recebimento}
                    onChange={(e) =>
                      setFormManif({ ...formManif, ponto_recebimento: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="m_ent" className="text-xs font-semibold text-slate-700">
                    Ponto de Saída / Entrega *
                  </Label>
                  <Input
                    id="m_ent"
                    required
                    value={formManif.ponto_entrega}
                    onChange={(e) => setFormManif({ ...formManif, ponto_entrega: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="m_per" className="text-xs font-semibold text-slate-700">
                    Período de Contratação Desejado *
                  </Label>
                  <Input
                    id="m_per"
                    required
                    value={formManif.periodo_vigencia}
                    onChange={(e) =>
                      setFormManif({ ...formManif, periodo_vigencia: e.target.value })
                    }
                    className="h-8 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-700 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="m_decl"
                  checked={formManif.declaracao_nao_vinculante}
                  onChange={(e) =>
                    setFormManif({ ...formManif, declaracao_nao_vinculante: e.target.checked })
                  }
                  className="mt-0.5 rounded text-[#0a2540] focus:ring-[#0a2540]"
                />
                <label htmlFor="m_decl" className="cursor-pointer leading-snug">
                  Declaro que esta manifestação de interesse é <strong>não vinculante</strong> (§5º,
                  I), servindo para subsidiar a ANP na homologação tarifária e eventual
                  redistribuição da capacidade disponível para o Ciclo POCC 2026/2027.
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalManifestacaoAberto(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={enviandoForm || !formManif.declaracao_nao_vinculante}
                  className="bg-[#0a2540] hover:bg-[#13395e] text-white text-xs font-semibold cursor-pointer"
                >
                  {enviandoForm ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Registrando Protocolo...
                    </>
                  ) : (
                    'Confirmar Manifestação de Interesse'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default POC
