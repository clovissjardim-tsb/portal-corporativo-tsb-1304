import React, { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
  Check,
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

// Pontos Relevantes da Malha TSB (Trecho 1: Uruguaiana; Trecho 3: Triunfo)
const PONTOS_RELEVANTES_TSB = [
  {
    id: 'libres_uruguaiana',
    nome: 'Trecho 1 — Paso de Los Libres ➔ UTE Uruguaiana',
    trecho: 'Trecho 1 (Gasoduto Uruguaiana)',
    ponto_recebimento: 'Paso de Los Libres (Fronteira Brasil/Argentina)',
    ponto_entrega: 'Uruguaiana (UTE Uruguaiana)',
  },
  {
    id: 'canoas_triunfo',
    nome: 'Trecho 3 — Canoas (Interconexão TBG) ➔ Triunfo (Polo Petroquímico)',
    trecho: 'Trecho 3 (Gasoduto Triunfo)',
    ponto_recebimento: 'Canoas (Interconexão TBG)',
    ponto_entrega: 'Triunfo (Polo Petroquímico)',
  },
  {
    id: 'emed_uruguaiana_ute',
    nome: 'Trecho 1 — EMED Uruguaiana ➔ UTE Uruguaiana',
    trecho: 'Trecho 1 (Gasoduto Uruguaiana)',
    ponto_recebimento: 'EMED Uruguaiana',
    ponto_entrega: 'Uruguaiana (UTE Uruguaiana)',
  },
  {
    id: 'canoas_emed_triunfo',
    nome: 'Trecho 3 — Canoas (TBG) ➔ EMED Triunfo',
    trecho: 'Trecho 3 (Gasoduto Triunfo)',
    ponto_recebimento: 'Canoas (Interconexão TBG)',
    ponto_entrega: 'EMED Triunfo',
  },
]

export function POC() {
  const { user, isAuthenticated, logout } = useAuth()
  const { toast } = useToast()
  const location = useLocation()

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

  // =========================================================================
  // NOVO: FORMULÁRIO DE SOLICITAÇÃO DE ACESSO — INCISO VII (ART. 10)
  // Requisitos mínimos literais do Art. 10, caput da Res. ANP nº 11/2016:
  // (I) modalidade pretendida (firme ou interruptível);
  // (II) período de contratação (datas início/fim);
  // (III) capacidade pretendida em m³/dia por Ponto Relevante;
  // (IV) pontos de recebimento e entrega (Trechos 1 e 3 da malha TSB).
  // =========================================================================
  const [formVII, setFormVII] = useState({
    modalidade: 'Firme Ordinário' as 'Firme Ordinário' | 'Interruptível',
    data_inicio: '2026-01-01',
    data_fim: '2026-12-31',
    capacidade: 150000,
    ponto_relevante_id: 'libres_uruguaiana',
    observacoes: '',
  })
  const [enviandoVII, setEnviandoVII] = useState(false)
  const [protocoloGeradoVII, setProtocoloGeradoVII] = useState<{
    protocolo: string
    registro: SolicitacaoIncisoVII
  } | null>(null)

  // Efeito para rolar suavemente até o card do Inciso VII se houver hash na URL
  useEffect(() => {
    if (location.hash === '#solicitacao-acesso-inciso-vii') {
      setTimeout(() => {
        const el = document.getElementById('solicitacao-acesso-inciso-vii')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 150)
    }
  }, [location.hash])

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
        description: `Protocolo único gerado: ${nova.protocolo}. Acompanhe as próximas etapas do Art. 37-A do POCC.`,
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

  // Submissão da Solicitação de Acesso à Malha (Inciso VII — Art. 10 da Res. ANP 11/2016)
  const handleEnviarSolicitacaoVII = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast({
        title: 'Autenticação necessária',
        description:
          'Faça login com a conta da sua empresa para protocolar a solicitação de acesso.',
        variant: 'destructive',
      })
      return
    }

    const pontoSel =
      PONTOS_RELEVANTES_TSB.find((p) => p.id === formVII.ponto_relevante_id) ||
      PONTOS_RELEVANTES_TSB[0]

    if (!formVII.capacidade || formVII.capacidade <= 0) {
      toast({
        title: 'Capacidade inválida',
        description: 'Informe uma capacidade pretendida maior que zero (m³/dia).',
        variant: 'destructive',
      })
      return
    }

    if (!formVII.data_inicio || !formVII.data_fim) {
      toast({
        title: 'Período obrigatório',
        description: 'Preencha as datas de início e término do período pretendido (Art. 10, II).',
        variant: 'destructive',
      })
      return
    }

    setEnviandoVII(true)
    try {
      const registro = await solicitacoesService.submeterPoc({
        modalidade: formVII.modalidade,
        data_inicio: formVII.data_inicio,
        data_fim: formVII.data_fim,
        capacidade: Number(formVII.capacidade),
        ponto_relevante_id: formVII.ponto_relevante_id,
        ponto_recebimento: pontoSel.ponto_recebimento,
        ponto_entrega: pontoSel.ponto_entrega,
        trecho: pontoSel.trecho,
        observacoes: formVII.observacoes,
      })

      setProtocoloGeradoVII({
        protocolo: registro.protocolo,
        registro,
      })

      // Atualiza automaticamente o campo de consulta para permitir verificação imediata
      setConsultaProtocolo(registro.protocolo)
      setResultadoConsulta({
        buscado: true,
        encontrado: true,
        protocoloPesquisado: registro.protocolo,
        dados: registro,
      })

      toast({
        title: 'Solicitação de Acesso Protocolada!',
        description: `Protocolo ${registro.protocolo} gerado com sucesso. SLA regulatório de 20 dias úteis em andamento.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar solicitação de acesso.'
      toast({
        title: 'Erro na submissão',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setEnviandoVII(false)
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
            Área do Carregador
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Ambiente corporativo de acesso da Transportadora Sulbrasileira de Gás — TSB. Consulte os
            dois ritos regulatórios distintos previstos na norma: o canal permanente de Solicitação
            de Acesso à Malha (Res. ANP nº 11/2016) e o procedimento temporário para capacidade nova
            do POCC (Res. ANP nº 961/2023).
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
          BLOCO 1 — SOLICITAÇÃO DE ACESSO À MALHA (INCISO VII — ART. 10, RES. ANP Nº 11/2016)
          Canal PERMANENTE de solicitação de acesso à capacidade de transporte dutoviário.
          Contém:
            1. Subtítulo/note explicativo sobre canal permanente, 20 dias úteis e cópia à ANP (§3º).
            2. Formulário de Submissão com identificação automática do usuário e 4 itens mínimos.
            3. Consulta de Protocolo & SLA dentro do próprio Bloco 1.
          ========================================================================= */}
      <section
        aria-label="Bloco 1: Solicitação de Acesso à Malha"
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs"
      >
        {/* CABEÇALHO DO BLOCO 1 */}
        <div className="space-y-2 pb-4 border-b border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#0a2540] text-white uppercase tracking-wider">
                Bloco 1 • Canal Permanente
              </span>
              <span className="text-[11px] font-mono font-semibold text-[#0284c7]">
                Inciso VII — Art. 10, Res. ANP nº 11/2016
              </span>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-sky-50 text-[#0284c7] border border-sky-200">
              SLA Regulatório: 20 dias úteis (Art. 10, §2º)
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[#0a2540]">
            Solicitação de Acesso à Malha (Inciso VII — Art. 10, Res. ANP nº 11/2016)
          </h2>

          <div className="p-3.5 bg-sky-50/60 border border-sky-200 rounded-lg text-xs text-slate-700 leading-relaxed space-y-1">
            <div className="flex items-center gap-2 font-semibold text-[#0a2540]">
              <Scale className="h-4 w-4 text-[#0284c7] shrink-0" />
              <span>Rito Permanente de Solicitação de Acesso — Distinto do POCC</span>
            </div>
            <p>
              Este é o canal permanente para requisição de acesso à capacidade de transporte na
              malha dutoviária da TSB. Conforme o Art. 10, §2º da Resolução ANP nº 11/2016, a
              Transportadora emitirá Parecer Técnico Fundamentado no prazo de até{' '}
              <strong>20 dias úteis</strong> contados da autuação. Nos desfechos previstos no Art.
              10, §3º (recusa fundamentada, celebração de contrato ou oferta de condições
              alternativas), cópia formal do parecer e das comunicações é encaminhada à ANP.
            </p>
          </div>
        </div>

        {/* 1.1 FORMULÁRIO DE SUBMISSÃO DA SOLICITAÇÃO (ART. 10) */}
        <Card
          id="solicitacao-acesso-inciso-vii"
          className="border border-slate-200 shadow-none bg-slate-50/40 overflow-hidden scroll-mt-6"
        >
          <CardHeader className="p-4 sm:p-5 bg-white border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <CardTitle className="text-base sm:text-lg font-bold text-[#0a2540] flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#0284c7]" />
                  Submissão de Nova Solicitação de Acesso
                </CardTitle>
                <p className="text-xs text-slate-600">
                  Apresente os 4 itens mínimos regulamentares do Art. 10 da Resolução ANP nº
                  11/2016.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Protocolo TSB-AAAA-XXXX gerado automaticamente
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-5">
            {/* CONFIRMAÇÃO VISUAL DO PROTOCOLO GERADO */}
            {protocoloGeradoVII && (
              <div className="p-4 sm:p-5 bg-emerald-50 border border-emerald-300 rounded-lg space-y-3 animate-fade-in">
                <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                        Solicitação Protocolada com Sucesso
                      </span>
                      <span className="font-mono text-lg sm:text-xl font-bold text-emerald-950">
                        {protocoloGeradoVII.protocolo}
                      </span>
                    </div>
                  </div>

                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-semibold">
                    Origem: Área do Carregador (autenticado)
                  </Badge>
                </div>

                <p className="text-xs text-emerald-900 leading-relaxed">
                  Sua solicitação de acesso foi autuada com sucesso no sistema da TSB sob o
                  protocolo <strong className="font-mono">{protocoloGeradoVII.protocolo}</strong>. O
                  prazo regulatório de <strong>20 dias úteis</strong> para emissão do Parecer
                  Técnico Fundamentado da Transportadora (Art. 10, §2º) está em contagem a partir de
                  hoje. O protocolo já pode ser acompanhado no campo de consulta abaixo.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('consulta-protocolo-vii')
                      el?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="font-semibold text-emerald-900 hover:text-emerald-950 underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Search className="h-3.5 w-3.5" />
                    Verificar na Consulta de Protocolo &amp; SLA &darr;
                  </button>
                  <span className="text-emerald-600">&bull;</span>
                  <button
                    type="button"
                    onClick={() => setProtocoloGeradoVII(null)}
                    className="text-emerald-800 hover:underline cursor-pointer"
                  >
                    Fechar aviso
                  </button>
                </div>
              </div>
            )}

            {/* IDENTIFICAÇÃO AUTOMÁTICA DO CARREGADOR (NÃO EDITÁVEL) */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-lg text-xs space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-[#0a2540] flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                  <Building2 className="h-3.5 w-3.5 text-[#0284c7]" />
                  Identificação do Carregador Solicitante (Art. 10, caput)
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Preenchido automaticamente a partir da conta autenticada (não editável)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700 pt-1">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                    Razão Social
                  </span>
                  <span className="font-bold text-slate-900 truncate block">
                    {(user as unknown as { razao_social?: string })?.razao_social ||
                      user?.name ||
                      'Carregador Cadastrado'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                    CNPJ
                  </span>
                  <span className="font-mono font-semibold text-slate-900 block">
                    {(user as unknown as { cnpj?: string })?.cnpj || 'Cadastro ativo'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                    E-mail Institucional do Carregador
                  </span>
                  <span className="text-slate-900 truncate block font-mono text-[11px]">
                    {user?.email || 'contato@carregador.com.br'}
                  </span>
                </div>
              </div>
            </div>

            {/* FORMULÁRIO COM OS 4 ITENS MÍNIMOS DA NORMA */}
            <form onSubmit={handleEnviarSolicitacaoVII} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* (I) MODALIDADE PRETENDIDA */}
                <div className="space-y-1">
                  <Label htmlFor="vii_mod" className="text-xs font-semibold text-slate-700">
                    (I) Modalidade Pretendida *
                  </Label>
                  <select
                    id="vii_mod"
                    value={formVII.modalidade}
                    onChange={(e) =>
                      setFormVII({
                        ...formVII,
                        modalidade: e.target.value as 'Firme Ordinário' | 'Interruptível',
                      })
                    }
                    className="w-full h-9 px-2.5 rounded border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0a2540]"
                  >
                    <option value="Firme Ordinário">Firme Ordinário</option>
                    <option value="Interruptível">Interruptível</option>
                  </select>
                  <span className="text-[10px] text-slate-500 block">Art. 10, I</span>
                </div>

                {/* (II) PERÍODO DE CONTRATAÇÃO: DATA INÍCIO */}
                <div className="space-y-1">
                  <Label htmlFor="vii_dt_ini" className="text-xs font-semibold text-slate-700">
                    (II) Data Início do Período *
                  </Label>
                  <Input
                    id="vii_dt_ini"
                    type="date"
                    required
                    value={formVII.data_inicio}
                    onChange={(e) => setFormVII({ ...formVII, data_inicio: e.target.value })}
                    className="h-9 text-xs bg-white"
                  />
                  <span className="text-[10px] text-slate-500 block">Art. 10, II</span>
                </div>

                {/* (II) PERÍODO DE CONTRATAÇÃO: DATA FIM */}
                <div className="space-y-1">
                  <Label htmlFor="vii_dt_fim" className="text-xs font-semibold text-slate-700">
                    (II) Data Término do Período *
                  </Label>
                  <Input
                    id="vii_dt_fim"
                    type="date"
                    required
                    value={formVII.data_fim}
                    onChange={(e) => setFormVII({ ...formVII, data_fim: e.target.value })}
                    className="h-9 text-xs bg-white"
                  />
                  <span className="text-[10px] text-slate-500 block">Art. 10, II</span>
                </div>

                {/* (III) CAPACIDADE PRETENDIDA EM M³/DIA */}
                <div className="space-y-1">
                  <Label htmlFor="vii_cap" className="text-xs font-semibold text-slate-700">
                    (III) Capacidade Pretendida (m³/dia) *
                  </Label>
                  <Input
                    id="vii_cap"
                    type="number"
                    required
                    min={1}
                    value={formVII.capacidade}
                    onChange={(e) => setFormVII({ ...formVII, capacidade: Number(e.target.value) })}
                    className="h-9 text-xs font-mono font-bold bg-white"
                  />
                  <span className="text-[10px] text-slate-500 block">Art. 10, III</span>
                </div>
              </div>

              {/* (IV) PONTOS DE RECEBIMENTO E ENTREGA (MALHA TSB - TRECHOS 1 E 3) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label htmlFor="vii_ponto_sel" className="text-xs font-semibold text-slate-700">
                    (IV) Ponto Relevante e Rota Dutoviária (Trechos 1 e 3 da Malha TSB) *
                  </Label>
                  <select
                    id="vii_ponto_sel"
                    value={formVII.ponto_relevante_id}
                    onChange={(e) => setFormVII({ ...formVII, ponto_relevante_id: e.target.value })}
                    className="w-full h-9 px-2.5 rounded border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0a2540]"
                  >
                    {PONTOS_RELEVANTES_TSB.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 block">
                    Art. 10, IV • Seleção entre os pontos homologados da infraestrutura TSB
                  </span>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="vii_obs" className="text-xs font-semibold text-slate-700">
                    Observações Técnicas (Opcional)
                  </Label>
                  <Input
                    id="vii_obs"
                    placeholder="Ex: perfil de pressão, sazonalidade..."
                    value={formVII.observacoes}
                    onChange={(e) => setFormVII({ ...formVII, observacoes: e.target.value })}
                    className="h-9 text-xs bg-white"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Informações complementares
                  </span>
                </div>
              </div>

              {/* RESUMO DOS PONTOS SELECIONADOS */}
              {(() => {
                const sel =
                  PONTOS_RELEVANTES_TSB.find((p) => p.id === formVII.ponto_relevante_id) ||
                  PONTOS_RELEVANTES_TSB[0]
                return (
                  <div className="p-3 bg-white border border-slate-200 rounded text-[11px] text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-x-1">
                      <span className="font-semibold text-slate-700">Ponto de Recebimento:</span>
                      <strong className="text-[#0a2540]">{sel.ponto_recebimento}</strong>
                      <span className="text-slate-400">&rarr;</span>
                      <span className="font-semibold text-slate-700">Ponto de Entrega:</span>
                      <strong className="text-[#0a2540]">{sel.ponto_entrega}</strong>
                    </div>
                    <span className="font-mono text-[10px] font-semibold text-slate-500">
                      {sel.trecho}
                    </span>
                  </div>
                )
              })()}

              {/* BOTÃO DE SUBMISSÃO DA SOLICITAÇÃO VII */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <span className="text-[11px] text-slate-500">
                  A submissão autua o protocolo <strong>TSB-AAAA-XXXX</strong> com prazo de resposta
                  de 20 dias úteis (Art. 10, §2º).
                </span>

                {isAuthenticated ? (
                  <Button
                    type="submit"
                    disabled={enviandoVII}
                    className="h-10 px-6 bg-[#0a2540] hover:bg-[#13395e] text-white font-semibold text-xs cursor-pointer shadow-xs transition-colors shrink-0"
                  >
                    {enviandoVII ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Protocolando Solicitação...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 mr-1.5 text-sky-400" />
                        Submeter Solicitação de Acesso (Inciso VII)
                      </>
                    )}
                  </Button>
                ) : (
                  <Link
                    to="/login"
                    state={{ from: { pathname: '/poc', hash: '#solicitacao-acesso-inciso-vii' } }}
                  >
                    <Button
                      type="button"
                      className="h-10 px-6 bg-[#0a2540] hover:bg-[#13395e] text-white font-semibold text-xs"
                    >
                      <Lock className="h-3.5 w-3.5 mr-1.5" />
                      Identifique-se para Submeter
                    </Button>
                  </Link>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 1.2 CONSULTA DE PROTOCOLO & SLA (DENTRO DO BLOCO 1 DO ART. 10) */}
        <Card
          id="consulta-protocolo-vii"
          className="border border-slate-200 shadow-none bg-slate-50/40 scroll-mt-6"
        >
          <CardHeader className="p-4 sm:p-5 bg-white border-b border-slate-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-[#0a2540]" />
                <CardTitle className="text-base sm:text-lg font-bold text-[#0a2540]">
                  Consulta de Protocolo &amp; SLA (Inciso VII)
                </CardTitle>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Parecer Técnico &amp; SLA de 20 dias úteis (Art. 10, §2º)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Acompanhe a tramitação, o prazo regulatório e o Parecer Fundamentado da Transportadora
              informando o número de protocolo autuado.
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Formulário de Busca */}
            <form onSubmit={handleConsultarProtocolo} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                value={consultaProtocolo}
                onChange={(e) => setConsultaProtocolo(e.target.value)}
                placeholder="INFORME O PROTOCOLO (EX: TSB-2026-8942)"
                className="font-mono text-xs uppercase h-11 border-slate-300 focus-visible:ring-1 focus-visible:ring-[#0a2540] flex-1 tracking-wider bg-white"
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
                      (sol.email &&
                        userEmail &&
                        sol.email.toLowerCase() === userEmail.toLowerCase()),
                    )

                    return (
                      <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-lg space-y-4">
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
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">
                              Modalidade
                            </span>
                            <span className="font-semibold text-[#0a2540]">
                              {sol.modalidade || 'Firme Ordinário'}
                            </span>
                          </div>

                          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">
                              Capacidade Solicitada
                            </span>
                            <span className="font-semibold text-[#0a2540] font-mono">
                              {Number(sol.capacidade).toLocaleString('pt-BR')} m³/dia
                            </span>
                          </div>

                          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">
                              Trecho / Instalação
                            </span>
                            <span className="font-semibold text-[#0a2540] truncate block">
                              {sol.trecho || 'Gasoduto Uruguaiana - Triunfo'}
                            </span>
                          </div>

                          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
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
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 leading-relaxed whitespace-pre-line shadow-2xs">
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
                      <strong className="font-mono">{resultadoConsulta.protocoloPesquisado}</strong>
                      . Verifique se o número foi digitado corretamente conforme o comprovante
                      formal recebido por e-mail (Ex: TSB-2026-8942).
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Nota de rodapé da consulta */}
            <div className="text-[11px] text-slate-500 pt-1 flex items-start gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                O Parecer Fundamentado é emitido no prazo regulatório de 20 dias úteis e registrado
                nos termos do Art. 10 da Resolução ANP nº 11/2016, com envio de cópia à ANP nos
                desfechos do §3º. Dúvidas:{' '}
                <strong className="text-slate-700">regulacao@tsb.com.br</strong>.
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* =========================================================================
          BLOCO 2 — POCC — PROCEDIMENTO DE OFERTA DE CAPACIDADE DE CONTRATAÇÃO
          (ART. 37-A, RES. ANP Nº 961/2023)
          Procedimento TEMPORÁRIO, vinculado a capacidade nova (construção/expansão).
          Contém:
            1. Aviso/explicação em 1 linha: o POCC é conduzido quando há capacidade nova; sem rodada aberta,
               os instrumentos permanecem publicados para consulta.
            2. Os 3 instrumentos da transportadora do Art. 37-A §2º (regulamento, contrato, proposta tarifária).
            3. Manifestação de Interesse (§5º, I, não vinculante) com botão/modal e tabela de histórico.
            4. Linha do tempo das 5 etapas do §5º com a etapa atual destacada.
            5. Nota de que não há etapa de leilão no escopo TSB.
          ========================================================================= */}
      <section
        aria-label="Bloco 2: Procedimento de Oferta de Capacidade de Contratação - POCC"
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs"
      >
        {/* CABEÇALHO DO BLOCO 2 */}
        <div className="space-y-2 pb-4 border-b border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#0284c7] text-white uppercase tracking-wider">
                Bloco 2 • Procedimento Temporário
              </span>
              <span className="text-[11px] font-mono font-semibold text-[#0a2540]">
                Art. 37-A, Res. ANP nº 961/2023
              </span>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Capacidade Nova • Construção / Expansão
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[#0a2540]">
            POCC — Procedimento de Oferta de Capacidade de Contratação (Art. 37-A, Res. ANP nº
            961/2023)
          </h2>

          {/* AVISO/EXPLICAÇÃO EM UMA LINHA CONFORME EXIGIDO */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Procedimento Temporário:</strong> O POCC é conduzido quando há capacidade nova
              a oferecer (projetos de construção ou expansão da malha); quando não houver rodada
              aberta, os instrumentos da transportadora permanecem publicados neste ambiente para
              consulta pública e subsidiar o planejamento dos Carregadores.
            </p>
          </div>
        </div>

        {/* 2.1 OS 3 INSTRUMENTOS DA TRANSPORTADORA DO ART. 37-A §2º */}
        <Card className="border border-slate-200 shadow-none bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0a2540]" />
                <CardTitle className="text-base sm:text-lg font-bold text-[#0a2540]">
                  Instrumentos da Transportadora (Art. 37-A, §2º)
                </CardTitle>
              </div>
              <p className="text-xs text-slate-500">
                Minuta do regulamento do POCC, minuta do Contrato de Serviço de Transporte e
                proposta tarifária disponibilizados para consulta dos Carregadores.
              </p>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {instrumentosNormativos.length} de {slotsArt37A.length} slots publicados
            </span>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
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

        {/* 2.2 MANIFESTAÇÃO DE INTERESSE (§5º, I — NÃO VINCULANTE) */}
        <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
          <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-slate-50 via-white to-sky-50/40">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-[#0a2540]">
                <Sparkles className="h-3 w-3 text-[#0284c7]" />
                Etapa I do Art. 37-A, §5º — Manifestação de Interesse Não Vinculante
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#0a2540]">
                Manifestação de Interesse no POCC (Art. 37-A, §5º, I — não vinculante)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Manifeste o interesse da sua empresa no Processo de Oferta e Contratação de
                Capacidade (POCC) — Ciclo 2026/2027. O registro é <strong>não vinculante</strong>,
                destina-se ao levantamento de demanda para aprovação das Tarifas de Referência pela
                ANP e habilita o carregador para a posterior apresentação de Propostas Vinculantes
                na Etapa III.
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-2">
              {isAuthenticated ? (
                <Button
                  onClick={() => setModalManifestacaoAberto(true)}
                  className="h-10 px-5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs cursor-pointer shadow-xs transition-colors"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5 text-sky-400" />
                  Registrar Manifestação de Interesse
                </Button>
              ) : (
                <Link to="/login" state={{ from: { pathname: '/poc' } }}>
                  <Button className="h-10 px-5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs">
                    <Lock className="h-3.5 w-3.5 mr-1.5" />
                    Identifique-se para Registrar
                  </Button>
                </Link>
              )}
              <span className="text-[11px] text-slate-500 text-center sm:text-right">
                Capacidade Firme Ofertada no Ciclo: <strong>150.000 m³/dia</strong>
              </span>
            </div>
          </div>

          {/* HISTÓRICO DE MANIFESTAÇÕES DO PRÓPRIO CARREGADOR (SE HOUVER) */}
          {isAuthenticated && temManifestacao && (
            <div className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-2">
              <div className="text-xs font-bold text-[#0a2540] uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="h-3.5 w-3.5 text-[#0284c7]" />
                Sua Manifestação Registrada para o Ciclo Vigente do POCC:
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

        {/* 2.3 LINHA DO TEMPO DAS 5 ETAPAS DO §5º (COM DESTAQUE DA ETAPA ATUAL) */}
        <Card className="border border-slate-200 shadow-none bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#0a2540]" />
                <CardTitle className="text-base sm:text-lg font-bold text-[#0a2540]">
                  Etapas Regulatórias do POCC (Art. 37-A, §5º)
                </CardTitle>
              </div>
              <p className="text-xs text-slate-500">
                Procedimento oficial de 5 etapas sequenciais estabelecido pelo §5º do Art. 37-A da
                Resolução ANP nº 11/2016 (com redação da Resolução ANP nº 961/2023).
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-[#0284c7] border border-sky-200 self-start sm:self-auto">
              {temManifestacao
                ? `Etapa Atual do seu Cadastro: ${ETAPAS_ART37A[etapaAtivaNumero - 1].romano}`
                : 'Ciclo em Andamento: Etapa I'}
            </span>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-4">
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

            {/* NOTA DE AUSÊNCIA DE LEILÃO NO ESCOPO TSB */}
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                <strong>Nota Regulatória:</strong> Em conformidade com o escopo do POCC da TSB, a
                alocação é realizada diretamente a partir das propostas vinculantes garantidas e das
                tarifas homologadas pela ANP, <em>sem etapa de leilão</em>.
              </span>
              <span className="font-semibold text-slate-800 shrink-0 font-mono">
                Ciclo: 2026/2027
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

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
                  Manifestação de Interesse no POCC (Art. 37-A §5º, I — não vinculante)
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
