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
import { gerarManifestacaoPocPdf } from '@/services/formularioManifestacaoPocPdf'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  FileCheck,
  FileCheck2,
  ExternalLink,
  Check,
  Calendar,
  UploadCloud,
  FileDown,
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

  // Módulos Separados de Manifestação de Interesse (Etapa I, Art. 37-A, §5º, I)
  // Módulo 1: Gerar e Persistir Rascunho / Módulo 2: Anexar Documento Assinado
  const [modalModulo1Aberto, setModalModulo1Aberto] = useState(false)
  const [modalModulo2Aberto, setModalModulo2Aberto] = useState(false)
  const [salvandoRascunhoManif, setSalvandoRascunhoManif] = useState(false)
  const [enviandoAssinadoManif, setEnviandoAssinadoManif] = useState(false)
  const [rascunhoSelecionadoId, setRascunhoSelecionadoId] = useState<string>('')
  const [arquivoAssinadoManif, setArquivoAssinadoManif] = useState<File | null>(null)
  const [protocoloGeradoPOCC, setProtocoloGeradoPOCC] = useState<{
    protocolo: string
    registro: ManifestacaoInteressePOC
  } | null>(null)
  const [rascunhoGeradoSucesso, setRascunhoGeradoSucesso] = useState<{
    protocolo: string
    registro: ManifestacaoInteressePOC
  } | null>(null)

  // Opções de trechos e pontos integrados com a malha da TSB
  const opcoesTrechosManif = [
    {
      id: 'trecho_1',
      trecho: 'Trecho 1 (Gasoduto Uruguaiana)',
      ponto_recebimento: 'PE Uruguaiana (Paso de Los Libres / Fronteira)',
      ponto_entrega: 'ZS Uruguaiana (UTE Uruguaiana)',
      label: 'Trecho 1 — PE Uruguaiana ➔ ZS Uruguaiana',
    },
    {
      id: 'trecho_3',
      trecho: 'Trecho 3 (Gasoduto Triunfo)',
      ponto_recebimento: 'PE Canoas (Interconexão TBG)',
      ponto_entrega: 'ZS Triunfo (Polo Petroquímico)',
      label: 'Trecho 3 — PE Canoas ➔ ZS Triunfo (Polo Petroquímico)',
    },
  ]

  // Formulário essencial da Manifestação de Interesse (Art. 37-A, §5º, I e Art. 10 da Res. 11/2016)
  const [formManif, setFormManif] = useState({
    trecho_opcao_id: 'trecho_3',
    capacidade_solicitada: 150000,
    modalidade: 'Firme Ordinário' as 'Firme Ordinário' | 'Interruptível',
    trecho: 'Trecho 3 (Gasoduto Triunfo)',
    ponto_recebimento: 'PE Canoas (Interconexão TBG)',
    ponto_entrega: 'ZS Triunfo (Polo Petroquímico)',
    data_inicio: '2026-01-01',
    data_fim: '2026-12-31',
    periodo_vigencia: '2026-01-01 a 2026-12-31',
    observacoes: '',
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

  // Atualiza datas de vigência ao alterar data de início/fim
  useEffect(() => {
    if (formManif.data_inicio && formManif.data_fim) {
      setFormManif((prev) => ({
        ...prev,
        periodo_vigencia: `${prev.data_inicio} a ${prev.data_fim}`,
      }))
    }
  }, [formManif.data_inicio, formManif.data_fim])

  // Carregar dados normativos, cronograma e manifestações
  const carregarDados = useCallback(async () => {
    setCarregandoDados(true)
    try {
      const [crono, itensTransp] = await Promise.all([
        pocService.listarCronograma('2026/2027').catch(() => []),
        transparenciaService.listarPorSecao('plataforma_inciso').catch(() => []),
      ])

      setCronograma(crono)

      // Filtrar todos os slots POCC da coleção transparencia_conteudo
      const chavesPOCC = [
        'pocc_regulamento',
        'pocc_minuta_contrato',
        'pocc_contrato_master_assinado',
        'pocc_proposta_tarifaria',
        'pocc_tarifa_contrato_extraordinario',
        'pocc_capacidade_ofertada',
        'pocc_calculo_capacidade',
        'pocc_cronograma_indicativo',
        'pocc_anexo4_pocc',
        'pocc_modelo_manifestacao_interesse',
        'pocc_modelo_proposta_garantida',
        'pocc_requisitos_habilitacao',
        'pocc_aprovacao_anp_oficio555',
        'pocc_resultados_ciclo',
      ]
      const docs = itensTransp.filter((it) => chavesPOCC.includes(it.chave))
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

  // Dados de identificação do usuário logado (fixos e não editáveis)
  const razaoSocialUsuario =
    (user as unknown as { razao_social?: string })?.razao_social ||
    user?.name ||
    'Carregador Cadastrado'
  const cnpjUsuario = (user as unknown as { cnpj?: string })?.cnpj || 'Cadastro ativo'
  const representanteLegalUsuario =
    (user as unknown as { responsavel?: string })?.responsavel ||
    user?.name ||
    'Representante Legal'
  const emailUsuario = user?.email || 'contato@carregador.com.br'
  const telefoneUsuario = (user as unknown as { telefone?: string })?.telefone || ''

  // Helper para baixar novamente o PDF a partir de um registro existente
  const handleBaixarNovamentePdf = async (m: ManifestacaoInteressePOC) => {
    try {
      await gerarManifestacaoPocPdf({
        emailDestino: m.email || emailUsuario,
        dadosPreenchidos: {
          razaoSocial: m.razao_social || razaoSocialUsuario,
          cnpj: m.cnpj || cnpjUsuario,
          representanteLegal: m.responsavel_nome || representanteLegalUsuario,
          emailCorporativo: m.email || emailUsuario,
          telefoneCorporativo: m.telefone || telefoneUsuario,
          capacidade: m.capacidade_solicitada,
          modalidade: m.modalidade,
          trecho: m.trecho,
          pontoRecebimento: m.ponto_recebimento,
          pontoEntrega: m.ponto_entrega,
          periodoTexto: m.periodo_vigencia || 'Ciclo 2026/2027',
          observacoes: m.observacoes_internas,
          ciclo: m.ciclo || 'Ciclo POCC 2026/2027',
        },
      })
      toast({
        title: 'Download do PDF iniciado',
        description: `Documento para assinatura referente ao protocolo ${m.protocolo} baixado com sucesso.`,
      })
    } catch (err) {
      console.error('Erro ao rebaixar PDF de manifestação:', err)
      toast({
        title: 'Falha no download',
        description: 'Não foi possível recompor o PDF. Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  // MÓDULO 1: Gerar Documento de Manifestação de Interesse e Persistir Rascunho
  const handleGerarEPersistirDocumento = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Autenticação necessária',
        description: 'Faça login com sua conta de Carregador para acessar o POCC.',
        variant: 'destructive',
      })
      return
    }

    if (!formManif.capacidade_solicitada || formManif.capacidade_solicitada <= 0) {
      toast({
        title: 'Capacidade obrigatória',
        description: 'Informe uma capacidade pretendida válida (m³/dia).',
        variant: 'destructive',
      })
      return
    }

    if (!formManif.data_inicio || !formManif.data_fim) {
      toast({
        title: 'Período obrigatório',
        description: 'Preencha as datas de início e término do período de interesse.',
        variant: 'destructive',
      })
      return
    }

    if (!formManif.declaracao_nao_vinculante) {
      toast({
        title: 'Termo de não vinculação obrigatório',
        description: 'Confirme a ciência do termo de não vinculação do Art. 37-A, §5º, I.',
        variant: 'destructive',
      })
      return
    }

    setSalvandoRascunhoManif(true)
    try {
      // 1. Persiste o rascunho no banco com status aguardando assinatura
      const nova = await pocService.criarManifestacao({
        ciclo: '2026/2027',
        razao_social: razaoSocialUsuario,
        cnpj: cnpjUsuario,
        email: emailUsuario,
        telefone: telefoneUsuario,
        responsavel_nome: representanteLegalUsuario,
        autorizacao_anp: (user as unknown as { autorizacao_anp?: string })?.autorizacao_anp || '',
        capacidade_solicitada: Number(formManif.capacidade_solicitada),
        modalidade: formManif.modalidade,
        trecho: formManif.trecho,
        ponto_recebimento: formManif.ponto_recebimento,
        ponto_entrega: formManif.ponto_entrega,
        periodo_vigencia: `${formManif.data_inicio} a ${formManif.data_fim}`,
        declaracao_anp_aceita: formManif.declaracao_nao_vinculante,
        origem: 'area_carregador',
        status: 'Documento gerado — aguardando assinatura do representante legal',
      })

      // 2. Gera e baixa o PDF oficial
      await gerarManifestacaoPocPdf({
        emailDestino: emailUsuario,
        dadosPreenchidos: {
          razaoSocial: razaoSocialUsuario,
          cnpj: cnpjUsuario,
          representanteLegal: representanteLegalUsuario,
          emailCorporativo: emailUsuario,
          telefoneCorporativo: telefoneUsuario,
          capacidade: formManif.capacidade_solicitada,
          modalidade: formManif.modalidade,
          trecho: formManif.trecho,
          pontoRecebimento: formManif.ponto_recebimento,
          pontoEntrega: formManif.ponto_entrega,
          periodoInicio: formManif.data_inicio,
          periodoFim: formManif.data_fim,
          periodoTexto: `${formManif.data_inicio} a ${formManif.data_fim}`,
          observacoes: formManif.observacoes,
          ciclo: 'Ciclo POCC 2026/2027',
        },
      })

      setMinhasManifestacoes((prev) => [nova, ...prev])
      setRascunhoSelecionadoId(nova.id)
      setRascunhoGeradoSucesso({
        protocolo: nova.protocolo,
        registro: nova,
      })
      setModalModulo1Aberto(false)

      toast({
        title: 'Documento Gerado e Rascunho Salvo!',
        description: `Rascunho registrado (${nova.protocolo}). O PDF oficial foi baixado. Colete a assinatura e retorne quando quiser para enviar no Módulo 2.`,
      })
    } catch (err: unknown) {
      console.error('Erro ao gerar documento e persistir rascunho:', err)
      const msg = err instanceof Error ? err.message : 'Falha ao processar rascunho.'
      toast({
        title: 'Falha na operação',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setSalvandoRascunhoManif(false)
    }
  }

  // Validação e seleção do arquivo PDF assinado
  const handleSelecionarArquivoAssinado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: 'Formato inválido',
        description: 'São aceitos exclusivamente arquivos em formato PDF (.pdf).',
        variant: 'destructive',
      })
      e.target.value = ''
      setArquivoAssinadoManif(null)
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito extenso',
        description: 'O arquivo PDF não pode exceder 50 MB.',
        variant: 'destructive',
      })
      e.target.value = ''
      setArquivoAssinadoManif(null)
      return
    }

    setArquivoAssinadoManif(file)
  }

  // MÓDULO 2: Anexar Documento Assinado e Concluir Protocolo Regulatória
  const handleConfirmarUploadAssinado = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast({
        title: 'Autenticação necessária',
        description: 'Faça login com sua conta de Carregador para solicitar acesso ao POCC.',
        variant: 'destructive',
      })
      return
    }

    if (!rascunhoSelecionadoId) {
      toast({
        title: 'Selecione uma manifestação pendente',
        description: 'Escolha qual rascunho em preparação receberá o documento assinado.',
        variant: 'destructive',
      })
      return
    }

    // VALIDAÇÃO CRÍTICA: O protocolo regulatório ativo NÃO nasce sem o arquivo assinado anexado
    if (!arquivoAssinadoManif) {
      toast({
        title: 'Documento assinado obrigatório',
        description:
          'O protocolo regulatório só pode ser autuado mediante o anexo do PDF assinado pelo representante legal.',
        variant: 'destructive',
      })
      return
    }

    setEnviandoAssinadoManif(true)
    try {
      const atualizada = await pocService.anexarDocumentoAssinado(
        rascunhoSelecionadoId,
        arquivoAssinadoManif,
      )

      setMinhasManifestacoes((prev) => prev.map((m) => (m.id === atualizada.id ? atualizada : m)))
      setProtocoloGeradoPOCC({
        protocolo: atualizada.protocolo,
        registro: atualizada,
      })
      setModalModulo2Aberto(false)
      setArquivoAssinadoManif(null)

      toast({
        title: 'Manifestação de Interesse Protocolada!',
        description: `Protocolo confirmado: ${atualizada.protocolo}. O documento assinado foi anexado e a solicitação agora segue para conferência da assinatura.`,
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
      setEnviandoAssinadoManif(false)
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

  // Slots dos Instrumentos da Transportadora (Art. 37-A §2º)
  const slotsArt37A = [
    {
      chave: 'pocc_regulamento',
      inciso: 'Art. 37-A, §1º, I e §2º',
      titulo: 'Minuta do Regulamento para Oferta e Contratação de Capacidade',
      descricao:
        'Regras operacionais, requisitos de habilitação, metodologia de alocação e garantias exigidas dos Carregadores.',
      fallbackUrl: '',
      fallbackNome: 'Regulamento do POCC (PDF)',
      formato: 'PDF',
    },
    {
      chave: 'pocc_minuta_contrato',
      inciso: 'Art. 37-A, §1º, II e §2º',
      titulo: 'Minuta do Contrato de Serviço de Transporte de Gás Natural',
      descricao:
        'Minuta padronizada do Contrato de Serviço de Transporte Firme exigida pela Resolução ANP nº 961/2023 (submetida à aprovação).',
      fallbackUrl:
        'https://www.tsb.com.br/wp-content/uploads/2025/03/CONTRATO-MASTER-TSB-2025-2029.pdf',
      fallbackNome: 'Minuta Contrato de Transporte (PDF)',
      formato: 'PDF',
    },
    {
      chave: 'pocc_contrato_master_assinado',
      inciso: 'Contrato Master TSB',
      titulo: 'Contrato Master Completo (assinado, 2026)',
      descricao:
        'Instrumento contratual fechado e assinado padrão da Transportadora Sulbrasileira de Gás - TSB para o ciclo regulatório de 2026.',
      fallbackUrl: 'https://www.tsb.com.br/wp-content/uploads/2025/12/CONTRATO-MASTER-2026.pdf',
      fallbackNome: 'Contrato Master Completo 2026 (PDF)',
      formato: 'PDF',
    },
    {
      chave: 'pocc_proposta_tarifaria',
      inciso: 'Art. 37-A, §1º, III e §2º',
      titulo: 'Proposta Tarifária e Tarifas de Referência',
      descricao:
        'Proposta tarifária submetida à Consulta Pública Tarifária e homologada pela ANP para o ciclo.',
      fallbackUrl: '',
      fallbackNome: 'Proposta Tarifária (PDF)',
      formato: 'PDF',
    },
    {
      chave: 'pocc_tarifa_contrato_extraordinario',
      inciso: 'Tarifa T3 2026',
      titulo: 'Tarifa do Contrato Extraordinário (T3 para 2026)',
      descricao:
        'Número tarifário real homologado para o Trecho 3 (T3) no horizonte de 2026 para contratos de transporte extraordinário.',
      fallbackUrl: 'https://www.tsb.com.br/wp-content/uploads/2026/02/Tarifa-T3-para-2026-1.docx',
      fallbackNome: 'Tarifa T3 para 2026 (.docx)',
      formato: 'DOC',
    },
  ]

  // Slots dos Modelos de Instrumentos do Carregador
  const slotsModelosCarregador = [
    {
      chave: 'pocc_modelo_manifestacao_interesse',
      inciso: 'Art. 37-A, §5º, I',
      titulo: 'Modelo de Manifestação de Interesse (Etapa I — Não Vinculante)',
      descricao:
        'Formulário-padrão da TSB para declaração de interesse na contratação de capacidade e levantamento de demanda preliminar.',
      fallbackUrl:
        'https://www.tsb.com.br/wp-content/uploads/2023/11/MODELO-MANIFESTAC%CC%A7A%CC%83O-DE-INTERESSE.pdf',
      fallbackNome: 'Modelo de Manifestação de Interesse (PDF)',
    },
    {
      chave: 'pocc_modelo_proposta_garantida',
      inciso: 'Art. 37-A, §5º, III',
      titulo: 'Modelo de Proposta Garantida Vinculante (Etapa III — Garantias & Alocação)',
      descricao:
        'Minuta oficial para formalização de proposta vinculante, comprovação de garantia financeira e solicitação definitiva de capacidade.',
      fallbackUrl:
        'https://www.tsb.com.br/wp-content/uploads/2023/11/Modelo-Proposta-Garantida.pdf',
      fallbackNome: 'Modelo de Proposta Garantida (PDF)',
    },
  ]

  // Slot e Documentos de Resultados do Ciclo
  const slotsResultadosCiclo = [
    {
      chave: 'pocc_aprovacao_anp_oficio555',
      inciso: 'Ofício ANP nº 555/2025-SIM',
      titulo: 'Aprovação da ANP (Ofício nº 555/2025-SIM)',
      descricao:
        'Documento inaugural da ANP que autoriza a realização do ciclo do POCC para contratação de capacidade extraordinária na malha TSB.',
      fallbackUrl:
        'https://www.tsb.com.br/wp-content/uploads/2026/04/OFICIO-No-555_2025_SIM-CTC_SIM_ANP-RJ-e.pdf',
      fallbackNome: 'Ofício ANP nº 555/2025-SIM (PDF)',
      etapa: 'Inauguração do Ciclo • Autorização ANP',
      formato: 'PDF',
    },
    {
      chave: 'pocc_resultados_ciclo',
      inciso: 'Art. 37-A, §5º, II a V',
      titulo: 'Despacho ANP e Atos Homologatórios das Etapas do POCC (DOU)',
      descricao:
        'Aprovação da proposta tarifária e cronograma pela Superintendência de Infraestrutura e Movimentação da ANP (Despacho SIM-ANP nº 1.328/2024 e correlatos).',
      fallbackUrl:
        'https://www.tsb.com.br/wp-content/uploads/2024/11/1.7.11-DESPACHO-SIM-ANP-No-1.328-11-2024-DOU.pdf',
      fallbackNome: 'Despacho ANP Proposta Tarifária e POCC (DOU)',
      etapa: 'Etapa II • Tarifas & Rito',
      formato: 'PDF',
    },
    {
      chave: 'pocc_resultado_manifestacoes',
      inciso: 'Art. 37-A, §5º, I',
      titulo: 'Relação das Manifestações de Interesse Recebidas',
      descricao:
        'Quadro público consolidado com a apuração anônima da demanda indicada por ponto e zona no período de manifestação.',
      fallbackUrl: '',
      fallbackNome: 'Resultado das Manifestações de Interesse (PDF)',
      etapa: 'Etapa I • Demanda Apurada',
      formato: 'PDF',
    },
    {
      chave: 'pocc_resultado_propostas_alocacao',
      inciso: 'Art. 37-A, §5º, III a V',
      titulo: 'Homologação das Propostas Garantidas e Alocação de Capacidade',
      descricao:
        'Demonstrativo final de capacidade alocada por carregador habilitado e envio dos contratos para registro na ANP.',
      fallbackUrl: '',
      fallbackNome: 'Alocação Final de Capacidade (PDF)',
      etapa: 'Etapas III–V • Alocação e Registro',
      formato: 'PDF',
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* =========================================================================
          CABEÇALHO PÚBLICO DA PÁGINA /poc
          Título: POC — Portal de Oferta de Capacidade
          ========================================================================= */}
      <div className="border-b border-slate-200 pb-5 pt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Oferta de Capacidade • Acesso Aberto (ANP)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0a2540] tracking-tight">
            POC — Portal de Oferta de Capacidade
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Portal oficial da Transportadora Sulbrasileira de Gás — TSB para consulta dos
            instrumentos regulatórios de oferta de capacidade dutoviária, rito das etapas do POCC e
            acesso seguro à Área do Carregador para submissões formais.
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
                className="text-[11px] text-slate-600 hover:text-red-600 hover:bg-red-50 h-7 px-2 ml-1 cursor-pointer"
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
                  Entrar
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          PARTE 1: BLOCO PÚBLICO (SEM AUTENTICAÇÃO, JÁ NA TELA)
          - Os 3 instrumentos do Art. 37-A §2º (regulamento, minuta de contrato, proposta tarifária)
          - Linha do tempo das 5 etapas do §5º (sem leilão)
          - Explicação clara de funcionamento (POCC para capacidade nova; sem rodada aberta,
            instrumentos ficam publicados para consulta)
          ========================================================================= */}
      <section
        aria-label="Informações Públicas do POCC"
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs"
      >
        <div className="space-y-2 pb-4 border-b border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#0a2540] text-white uppercase tracking-wider">
                Consulta Pública
              </span>
              <span className="text-[11px] font-mono font-semibold text-[#0284c7]">
                Art. 37-A, Res. ANP nº 961/2023
              </span>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Acesso Livre • Sem Autenticação
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[#0a2540]">
            POCC — Procedimento de Oferta de Capacidade de Contratação
          </h2>

          <div className="p-3.5 bg-sky-50/60 border border-sky-200 rounded-lg text-xs text-slate-700 leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-[#0a2540]">Como funciona o POCC na malha da TSB:</p>
              <p>
                O POCC é o procedimento regulatório conduzido quando há{' '}
                <strong>capacidade nova</strong> a oferecer (projetos de construção ou expansão da
                malha). Quando não houver rodada aberta, os instrumentos e cronogramas da
                transportadora permanecem publicados neste ambiente para{' '}
                <strong>livre consulta pública</strong> de potenciais carregadores e agentes de
                mercado, subvencionando o planejamento prévio e as estimativas de contratação.
              </p>
            </div>
          </div>

          {/* ÍNDICE RÁPIDO DOS 6 BLOCOS PÚBLICOS */}
          <div className="pt-2">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>Seções Regulatórias de Acesso Público:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <a
                href="#instrumentos-art37a"
                className="px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-[#0284c7] hover:bg-sky-50/50 text-[11px] font-medium text-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="truncate">Instrumentos §2º</span>
              </a>
              <a
                href="#capacidade-ofertada"
                className="px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-[#0284c7] hover:bg-sky-50/50 text-[11px] font-medium text-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span className="truncate">Capacidade Ofertada</span>
              </a>
              <a
                href="#cronograma-pocc"
                className="px-2.5 py-1.5 rounded-md border-2 border-sky-400 bg-sky-50 hover:bg-sky-100 text-[11px] font-bold text-[#0a2540] transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <span className="w-4 h-4 rounded-full bg-[#0a2540] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span className="truncate flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#0284c7] shrink-0" />
                  Cronograma (5 Etapas)
                </span>
              </a>
              <a
                href="#modelos-carregador"
                className="px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-[#0284c7] hover:bg-sky-50/50 text-[11px] font-medium text-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                  4
                </span>
                <span className="truncate">Modelos Carregador</span>
              </a>
              <a
                href="#requisitos-habilitacao"
                className="px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-[#0284c7] hover:bg-sky-50/50 text-[11px] font-medium text-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                  5
                </span>
                <span className="truncate">Requisitos Habilitação</span>
              </a>
              <a
                href="#resultados-ciclo"
                className="px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-[#0284c7] hover:bg-sky-50/50 text-[11px] font-medium text-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                  6
                </span>
                <span className="truncate">Resultados do Ciclo</span>
              </a>
            </div>
          </div>
        </div>

        {/* 1.1 OS 3 INSTRUMENTOS DA TRANSPORTADORA DO ART. 37-A §2º */}
        <Card
          id="instrumentos-art37a"
          className="border border-slate-200 shadow-none bg-white scroll-mt-6"
        >
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-[#0a2540] text-xs font-bold flex items-center justify-center border border-slate-200">
                  1
                </span>
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
              3 instrumentos regulatórios
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
                        {temDoc && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              slot.formato === 'DOC'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-sky-50 text-[#0284c7] border border-sky-200'
                            }`}
                          >
                            {slot.formato || 'PDF'}
                          </span>
                        )}
                        {temDoc && resolved.isUpload && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            Upload Oficial
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
                Editoria normativa: slots <code>pocc_regulamento</code>,{' '}
                <code>pocc_minuta_contrato</code>, <code>pocc_contrato_master_assinado</code>,{' '}
                <code>pocc_proposta_tarifaria</code> e{' '}
                <code>pocc_tarifa_contrato_extraordinario</code>.
              </span>
              <span className="text-slate-400">
                Conformidade: Resolução ANP nº 961/2023 (Art. 37-A, §§ 1º ao 4º)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 1.2 CAPACIDADE OFERTADA / DISPONÍVEL POR PONTO (NOVO ITEM 1) */}
        {(() => {
          const itemCap = instrumentosNormativos.find(
            (it) => it.chave === 'pocc_capacidade_ofertada',
          )
          const resolvedCap = itemCap
            ? resolverUrlDocumento(
                itemCap,
                'https://www.tsb.com.br/wp-content/uploads/2024/11/1.7.7-CAPACIDADES_DISPONIVEIS-PE-E-ZS-5.pdf',
              )
            : {
                url: 'https://www.tsb.com.br/wp-content/uploads/2024/11/1.7.7-CAPACIDADES_DISPONIVEIS-PE-E-ZS-5.pdf',
                nomeExibicao: 'Capacidades Disponíveis PE e ZS (PDF)',
                isUpload: false,
              }

          const itemCalc = instrumentosNormativos.find(
            (it) => it.chave === 'pocc_calculo_capacidade',
          )
          const resolvedCalc = itemCalc
            ? resolverUrlDocumento(
                itemCalc,
                'https://www.tsb.com.br/wp-content/uploads/2023/11/1.7.8-CA%CC%81LCULO-DA-CAPACIDADE-DE-TRANSPORTE.pdf',
              )
            : {
                url: 'https://www.tsb.com.br/wp-content/uploads/2023/11/1.7.8-CA%CC%81LCULO-DA-CAPACIDADE-DE-TRANSPORTE.pdf',
                nomeExibicao: 'Cálculo da Capacidade de Transporte (PDF)',
                isUpload: false,
              }

          return (
            <Card
              id="capacidade-ofertada"
              className="border border-slate-200 shadow-none bg-white scroll-mt-6"
            >
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-[#0a2540] text-xs font-bold flex items-center justify-center border border-slate-200">
                      2
                    </span>
                    <CardTitle className="text-base sm:text-lg font-bold text-[#0a2540]">
                      Capacidade Ofertada e Disponível por Ponto
                    </CardTitle>
                  </div>
                  <p className="text-xs text-slate-500">
                    {itemCap?.descricao ||
                      'Capacidade de transporte ofertada (m³/dia) e capacidade disponível por Ponto de Entrada e Zona de Saída na malha TSB.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                  {resolvedCap.url ? (
                    <a
                      href={resolvedCap.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#0a2540] hover:bg-[#13395e] text-white transition-colors cursor-pointer shadow-2xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-sky-500/20 text-sky-200 uppercase">
                        PDF
                      </span>
                      <span>
                        {resolvedCap.nomeExibicao || 'Demonstrativo de Capacidades (PDF)'}
                      </span>
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-slate-500 bg-slate-100 border border-slate-200">
                      Demonstrativo será publicado após aprovação pela ANP
                    </span>
                  )}

                  {resolvedCalc.url ? (
                    <a
                      href={resolvedCalc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white hover:bg-slate-50 text-[#0a2540] border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                      title={itemCalc?.descricao || 'Memória técnica 1.7.8'}
                    >
                      <Download className="h-3.5 w-3.5 text-[#0284c7]" />
                      <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-sky-50 text-[#0284c7] border border-sky-200 uppercase">
                        PDF
                      </span>
                      <span>
                        {resolvedCalc.nomeExibicao || 'Cálculo da Capacidade (PDF 1.7.8)'}
                      </span>
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-slate-500 bg-slate-100 border border-slate-200">
                      Cálculo de capacidade será publicado após aprovação pela ANP
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Trecho da Malha</th>
                        <th className="py-2.5 px-3">Tipo de Ponto</th>
                        <th className="py-2.5 px-3">Denominação</th>
                        <th className="py-2.5 px-3">Município / UF</th>
                        <th className="py-2.5 px-3 text-right">Capacidade Ofertada (m³/dia)</th>
                        <th className="py-2.5 px-3 text-right">Capacidade Disponível (m³/dia)</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#0a2540]">Trecho 1</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-50 text-[#0284c7] border border-sky-200">
                            Ponto de Entrada
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium">PE Canoas (Interconexão TBG)</td>
                        <td className="py-2.5 px-3 text-slate-600">Canoas / RS</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-right">
                          4.500.000
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold text-right">
                          1.200.000
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Disponível para Oferta
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#0a2540]">Trecho 1</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Zona de Saída
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium">ZS Triunfo (Polo Petroquímico)</td>
                        <td className="py-2.5 px-3 text-slate-600">Triunfo / RS</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-right">
                          2.800.000
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold text-right">
                          750.000
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Disponível para Oferta
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#0a2540]">Trecho 3</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-50 text-[#0284c7] border border-sky-200">
                            Ponto de Entrada
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium">PE Uruguaiana (Fronteira AR/BR)</td>
                        <td className="py-2.5 px-3 text-slate-600">Uruguaiana / RS</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-right">
                          2.500.000
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold text-right">
                          2.500.000
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-[#0284c7] border border-sky-200">
                            Capacidade Total Livre
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#0a2540]">Trecho 3</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Zona de Saída
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium">
                          ZS Uruguaiana (UTE Nova Uruguaiana)
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">Uruguaiana / RS</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-right">
                          2.500.000
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold text-right">
                          2.500.000
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-[#0284c7] border border-sky-200">
                            Capacidade Total Livre
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
                  <span>
                    Editoria: slots <code>pocc_capacidade_ofertada</code> e{' '}
                    <code>pocc_calculo_capacidade</code> (Item 1.7.8 — gerenciáveis pela Gestão
                    Interna).
                  </span>
                  <span className="text-slate-400">
                    Padrão tsb.com.br/poc • Dados apurados para o horizonte regulatório vigente
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })()}

        {/* 1.3 LINHA DO TEMPO DAS 5 ETAPAS DO §5º (CRONOGRAMA OFICIAL COM ALTO DESTAQUE E SEM LEILÃO) */}
        <Card
          id="cronograma-pocc"
          className="border-2 border-sky-300/80 shadow-md bg-gradient-to-b from-white via-sky-50/20 to-white scroll-mt-6 overflow-hidden ring-1 ring-sky-100"
        >
          {/* FAIXA SUPERIOR DE DESTAQUE DO CRONOGRAMA */}
          <div className="bg-[#0a2540] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-bold tracking-wide">
              <Clock className="h-4 w-4 text-sky-400 shrink-0 animate-pulse" />
              <span className="uppercase text-[11px] text-sky-200">Régua Temporal Regulatória</span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-white text-[12px]">Cronograma Oficial do Ciclo 2026/2027</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono bg-sky-500/20 text-sky-200 px-2 py-0.5 rounded border border-sky-400/30">
                Consulta Pública Livre
              </span>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/40">
                Rito Sem Leilão
              </span>
            </div>
          </div>

          <CardHeader className="pb-3 pt-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
                <CardTitle className="text-base sm:text-xl font-bold text-[#0a2540]">
                  3. Cronograma &amp; Linha do Tempo das 5 Etapas (Art. 37-A, §5º)
                </CardTitle>
              </div>
              <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                Linha do tempo oficial com os prazos estimados, marcos regulatórios e a fase ativa
                do ciclo do POCC, estabelecidos pela Resolução ANP nº 961/2023. Disponível para
                consulta pública sem necessidade de autenticação.
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-sky-100 text-[#0a2540] border border-sky-300 shadow-2xs">
                {temManifestacao
                  ? `Etapa Atual do seu Cadastro: ${ETAPAS_ART37A[etapaAtivaNumero - 1].romano}`
                  : 'Fase Regulatória Ativa: Etapa I'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                5 etapas sequenciais • Ciclo 2026/2027
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-5">
            {/* LINHA DO TEMPO HORIZONTAL / EM GRID */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
              {ETAPAS_ART37A.map((etapa) => {
                const cronoItem = cronograma.find((c) => c.numero_etapa === etapa.numero)
                // Se o backend tiver status da etapa configurado na Gestão, usa para compor estado
                const statusBackend = cronoItem?.status_etapa
                const isAtiva = statusBackend
                  ? statusBackend === 'Fase Ativa' || statusBackend === 'Em Andamento'
                  : etapa.numero === etapaAtivaNumero
                const isPassada = statusBackend
                  ? statusBackend === 'Concluída'
                  : etapa.numero < etapaAtivaNumero

                const rotuloStatus =
                  statusBackend || (isAtiva ? 'Fase Ativa' : isPassada ? 'Concluída' : 'Pendente')

                return (
                  <div
                    key={etapa.numero}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                      isAtiva
                        ? 'border-[#0a2540] bg-white ring-2 ring-[#0a2540]/20 shadow-sm'
                        : isPassada
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* Indicador de fase ativa no topo */}
                    {isAtiva && (
                      <div className="absolute -top-2.5 right-3 bg-[#0a2540] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                        Em Andamento
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-transform ${
                              isAtiva
                                ? 'bg-[#0a2540] text-white shadow-xs scale-105'
                                : isPassada
                                  ? 'bg-[#15803d] text-white'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {isPassada ? '✓' : etapa.romano}
                          </span>
                          <span className="text-[11px] font-bold text-[#0a2540]">
                            Etapa {etapa.romano}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isAtiva
                              ? 'bg-sky-100 text-[#0a2540] border border-sky-300'
                              : isPassada
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {rotuloStatus}
                        </span>
                      </div>

                      <div className="text-[10px] font-mono font-semibold text-[#0284c7]">
                        {etapa.inciso}
                      </div>

                      <h4 className="text-xs font-bold text-[#0a2540] leading-snug min-h-[2rem]">
                        {cronoItem?.titulo || etapa.titulo}
                      </h4>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {cronoItem?.descricao || etapa.descricao}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 space-y-1">
                      <div className="text-[10px] text-slate-700 font-mono font-semibold flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-[#0284c7] shrink-0" />
                        <span>
                          {cronoItem?.periodo_estimado
                            ? cronoItem.periodo_estimado
                            : etapa.numero === 1
                              ? 'Janeiro a Março de 2026'
                              : etapa.numero === 2
                                ? 'Abril a Junho de 2026'
                                : etapa.numero === 3
                                  ? 'Julho a Agosto de 2026'
                                  : etapa.numero === 4
                                    ? 'Setembro a Outubro de 2026'
                                    : 'Novembro a Dezembro de 2026'}
                        </span>
                      </div>
                      {cronoItem?.observacoes && (
                        <p className="text-[10px] text-slate-500 italic leading-snug">
                          {cronoItem.observacoes}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* DOWNLOADS OFICIAIS DO CRONOGRAMA INDICATIVO E ANEXO 4 */}
            {(() => {
              const itemCronoInd = instrumentosNormativos.find(
                (it) => it.chave === 'pocc_cronograma_indicativo',
              )
              const resolvedCronoInd = itemCronoInd
                ? resolverUrlDocumento(
                    itemCronoInd,
                    'https://www.tsb.com.br/wp-content/uploads/2026/04/Cronograma-Indicativo-Ciclo-Regulatorio-2026-2030.pdf',
                  )
                : {
                    url: 'https://www.tsb.com.br/wp-content/uploads/2026/04/Cronograma-Indicativo-Ciclo-Regulatorio-2026-2030.pdf',
                    nomeExibicao: 'Cronograma Indicativo 2026–2030 (PDF)',
                    isUpload: false,
                  }

              const itemAnexo4 = instrumentosNormativos.find(
                (it) => it.chave === 'pocc_anexo4_pocc',
              )
              const resolvedAnexo4 = itemAnexo4
                ? resolverUrlDocumento(
                    itemAnexo4,
                    'https://www.tsb.com.br/wp-content/uploads/2025/01/ANEXO-4-Cronograma-POCC-2025-PRODUTO-FIRME-ANUAL-TSB.pdf',
                  )
                : {
                    url: 'https://www.tsb.com.br/wp-content/uploads/2025/01/ANEXO-4-Cronograma-POCC-2025-PRODUTO-FIRME-ANUAL-TSB.pdf',
                    nomeExibicao: 'Anexo 4 — Cronograma POCC 2025 (PDF)',
                    isUpload: false,
                  }

              return (
                <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-[#0284c7]" />
                        Documentação Oficial de Prazos e Cronogramas do POCC
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Baixe os cronogramas oficiais homologados e anexos normativos da TSB.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Slots: pocc_cronograma_indicativo &bull; pocc_anexo4_pocc
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg flex flex-col justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-semibold text-[#0284c7]">
                            Ciclo Regulatório 2026–2030
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-50 text-[#0284c7] border border-sky-200">
                            PDF
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-900">
                          {itemCronoInd?.titulo ||
                            'Cronograma Indicativo do Ciclo Regulatório 2026–2030'}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {itemCronoInd?.descricao ||
                            'Cronograma indicativo oficial com o horizonte plurianual 2026–2030 do ciclo regulatório.'}
                        </p>
                      </div>
                      <div className="pt-1">
                        {resolvedCronoInd.url ? (
                          <a
                            href={resolvedCronoInd.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#0a2540] hover:bg-[#13395e] text-white transition-colors cursor-pointer shadow-2xs"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>
                              {resolvedCronoInd.nomeExibicao || 'Baixar Cronograma (PDF)'}
                            </span>
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-slate-500 bg-slate-100 border border-slate-200">
                            Documento será publicado após aprovação pela ANP
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg flex flex-col justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-semibold text-[#0284c7]">
                            POCC 2025 &bull; Produto Firme Anual
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-50 text-[#0284c7] border border-sky-200">
                            PDF
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-900">
                          {itemAnexo4?.titulo ||
                            'Anexo 4 — Cronograma POCC Produto Firme Anual TSB'}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {itemAnexo4?.descricao ||
                            'Documento oficial do Anexo 4 contendo o detalhamento de prazos e ritos do POCC.'}
                        </p>
                      </div>
                      <div className="pt-1">
                        {resolvedAnexo4.url ? (
                          <a
                            href={resolvedAnexo4.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white hover:bg-slate-50 text-[#0a2540] border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Download className="h-3.5 w-3.5 text-[#0284c7]" />
                            <span>{resolvedAnexo4.nomeExibicao || 'Baixar Anexo 4 (PDF)'}</span>
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-slate-500 bg-slate-100 border border-slate-200">
                            Documento será publicado após aprovação pela ANP
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* QUADRO INFORMATIVO SOBRE O RITO SEM LEILÃO */}
            <div className="p-3.5 bg-sky-50/70 rounded-lg border border-sky-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  <strong>Rito Regulatória TSB:</strong> A alocação é conduzida diretamente a partir
                  das <em>propostas vinculantes garantidas</em> (Etapa III) sob tarifas homologadas
                  pela ANP, <strong>sem etapa de leilão</strong>, conforme diretrizes da Resolução
                  ANP nº 961/2023.
                </span>
              </div>
              <span className="font-semibold text-slate-900 shrink-0 font-mono bg-white px-2 py-0.5 rounded border border-sky-200 self-start sm:self-auto">
                Ciclo Oficial: 2026/2027
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 1.4 MODELOS DOS INSTRUMENTOS DO CARREGADOR (NOVO ITEM 2) */}
        <Card
          id="modelos-carregador"
          className="border border-slate-200 shadow-none bg-white scroll-mt-6"
        >
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-[#0a2540] text-xs font-bold flex items-center justify-center border border-slate-200">
                  4
                </span>
                <FileText className="h-4 w-4 text-[#0a2540]" />
                <CardTitle className="text-base sm:text-lg font-bold text-[#0a2540]">
                  Modelos dos Instrumentos do Carregador
                </CardTitle>
              </div>
              <p className="text-xs text-slate-500">
                Minutas-padrão de manifestação e proposta garantida disponibilizadas para elaboração
                prévia pelos Carregadores interessados.
              </p>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Downloads públicos padronizados
            </span>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <ul className="divide-y divide-slate-200">
              {slotsModelosCarregador.map((slot) => {
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
                        {temDoc && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-50 text-[#0284c7] border border-sky-200">
                            PDF
                          </span>
                        )}
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
                          <span>{resolved.nomeExibicao || 'Baixar Modelo (PDF)'}</span>
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200">
                          Documento será publicado pela Editoria da TSB
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
              <span>
                Editoria: slots <code>pocc_modelo_manifestacao_interesse</code> e{' '}
                <code>pocc_modelo_proposta_garantida</code>.
              </span>
              <span className="text-slate-400">
                Padrão compacto com glifo PDF • Download livre sem autenticação
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 1.5 REQUISITOS DE HABILITAÇÃO DO CARREGADOR (NOVO ITEM 3) */}
        {(() => {
          const itemHab = instrumentosNormativos.find(
            (it) => it.chave === 'pocc_requisitos_habilitacao',
          )
          const resolvedHab = itemHab
            ? resolverUrlDocumento(
                itemHab,
                'https://www.tsb.com.br/wp-content/uploads/2023/11/1.7.9-REQUISITOS-DE-HABILITAC%CC%A7A%CC%83O-DO-CARREGADOR.pdf',
              )
            : {
                url: 'https://www.tsb.com.br/wp-content/uploads/2023/11/1.7.9-REQUISITOS-DE-HABILITAC%CC%A7A%CC%83O-DO-CARREGADOR.pdf',
                nomeExibicao: 'Requisitos de Habilitação do Carregador (PDF)',
                isUpload: false,
              }

          return (
            <Card
              id="requisitos-habilitacao"
              className="border border-slate-200 shadow-none bg-white scroll-mt-6"
            >
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-[#0a2540] text-xs font-bold flex items-center justify-center border border-slate-200">
                      5
                    </span>
                    <ShieldCheck className="h-4 w-4 text-[#0a2540]" />
                    <CardTitle className="text-base sm:text-lg font-bold text-[#0a2540]">
                      Requisitos de Habilitação do Carregador
                    </CardTitle>
                  </div>
                  <p className="text-xs text-slate-500">
                    Condições cadastrais, societárias, fiscais, financeiras e regulatórias exigidas
                    para habilitação prévia à celebração de contratos de transporte na malha TSB.
                  </p>
                </div>
                {resolvedHab.url && (
                  <a
                    href={resolvedHab.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#0a2540] hover:bg-[#13395e] text-white transition-colors cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{resolvedHab.nomeExibicao || 'Instrução Normativa Completa (PDF)'}</span>
                  </a>
                )}
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50/70 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#0a2540] text-white text-[11px] font-bold flex items-center justify-center">
                        1
                      </span>
                      <h4 className="text-xs font-bold text-[#0a2540]">
                        Habilitação Regulatória ANP
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Autorização ativa da ANP para o exercício da atividade de Carregamento de Gás
                      Natural nos termos da Lei nº 14.134/2021 e Resolução ANP nº 51/2011 (ou norma
                      superveniente).
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50/70 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#0a2540] text-white text-[11px] font-bold flex items-center justify-center">
                        2
                      </span>
                      <h4 className="text-xs font-bold text-[#0a2540]">
                        Regularidade Jurídica &amp; Fiscal
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Contrato Social/Estatuto vigente com poderes de representação, CND Federal
                      (Receita e PGFN), FGTS, CNDT e inscrição estadual ativa no Estado do Rio
                      Grande do Sul.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50/70 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#0a2540] text-white text-[11px] font-bold flex items-center justify-center">
                        3
                      </span>
                      <h4 className="text-xs font-bold text-[#0a2540]">
                        Capacidade Econômico-Financeira
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Demonstrações contábeis auditadas dos 2 últimos exercícios sociais, rating de
                      crédito aceito pela transportadora ou apresentação de garantia bancária /
                      carta de fiança conforme o Regulamento.
                    </p>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
                  <span>
                    Editoria: slot <code>pocc_requisitos_habilitacao</code> (Art. 37-A, §1º, I e §2º
                    da Resolução ANP nº 961/2023).
                  </span>
                  <span className="text-slate-400">
                    Instrução padronizada TSB • Documentação exigida na Etapa I e Etapa III
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })()}

        {/* 1.6 RESULTADOS DAS ETAPAS DO CICLO (NOVO ITEM 4) */}
        <Card
          id="resultados-ciclo"
          className="border border-slate-200 shadow-none bg-white scroll-mt-6"
        >
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-[#0a2540] text-xs font-bold flex items-center justify-center border border-slate-200">
                  6
                </span>
                <FileCheck className="h-4 w-4 text-[#0a2540]" />
                <CardTitle className="text-base sm:text-lg font-bold text-[#0a2540]">
                  Resultados das Etapas do Ciclo
                </CardTitle>
              </div>
              <p className="text-xs text-slate-500">
                Publicações oficiais, homologações de propostas e atos da ANP referentes aos ciclos
                do POCC da TSB.
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Ciclo 2026/2027
            </span>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-4">
            <ul className="divide-y divide-slate-200">
              {slotsResultadosCiclo.map((slot) => {
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
                          {slot.inciso ? `${slot.inciso} • ` : ''}
                          {slot.etapa}
                        </span>
                        {temDoc && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-50 text-[#0284c7] border border-sky-200">
                            {slot.formato || 'PDF'}
                          </span>
                        )}
                        {temDoc && resolved.isUpload && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            Upload Oficial
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
                          <span>{resolved.nomeExibicao || 'Baixar Publicação (PDF)'}</span>
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200">
                          Aguardando abertura de rodada ou ato homologatório
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
              <span>
                Editoria: slots <code>pocc_aprovacao_anp_oficio555</code> (inauguração do ciclo via
                Ofício ANP) e <code>pocc_resultados_ciclo</code> (atos homologatórios e Despachos no
                DOU).
              </span>
              <span className="text-slate-400">
                Publicações abertas conforme Art. 37-A, §5º da Resolução ANP nº 961/2023
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* =========================================================================
          PARTE 2: ÁREA DO CARREGADOR (SISTEMA AUTENTICADO)
          - Visitante DESLOGADO vê o bloco travado com descrição do que há dentro e botão Entrar
          - Visitante LOGADO vê o conteúdo completo:
              (a) Solicitação de Acesso do Inciso VII (Art. 10, Res. 11/2016) + protocolo + SLA 20 dias + consulta
              (b) POCC (Art. 37-A, Res. 961/2023) com Manifestação de Interesse e histórico
          ========================================================================= */}
      <section
        id="area-do-carregador-autenticada"
        aria-label="Área do Carregador"
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs"
      >
        {/* CABEÇALHO DO ENVOLTÓRIO "ÁREA DO CARREGADOR" */}
        <div className="space-y-2 pb-4 border-b border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#0a2540] text-white uppercase tracking-wider">
                Ambiente Corporativo
              </span>
              <span className="text-[11px] font-mono font-semibold text-[#0284c7]">
                Acesso Autenticado
              </span>
            </div>
            {isAuthenticated ? (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Sessão Ativa: {user?.name || user?.email}
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-600" />
                Autenticação Requerida
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[#0a2540] flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#0284c7]" />
            Área do Carregador
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Portal corporativo para operadoras e carregadores habilitados na ANP. Concentra os dois
            sistemas regulatórios: o rito permanente de Solicitação de Acesso à Malha (Inciso VII) e
            as Manifestações de Interesse e contratação no POCC (Art. 37-A).
          </p>
        </div>

        {/* CASO DESLOGADO: CARD TRAVADO COM BOTÃO ENTRAR */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-8 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#0a2540]/10 flex items-center justify-center text-[#0a2540]">
              <Lock className="h-6 w-6" />
            </div>

            <div className="max-w-xl mx-auto space-y-2">
              <h3 className="text-lg font-bold text-[#0a2540]">Acesso Restrito ao Carregador</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Para protocolar formalmente sua{' '}
                <strong>Solicitação de Acesso à Malha (Inciso VII — Art. 10)</strong> com autuação
                de protocolo <code>TSB-AAAA-XXXX</code> ou para submeter{' '}
                <strong>Manifestação de Interesse no POCC (Art. 37-A)</strong>, efetue o login com
                as credenciais da sua empresa.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left pt-2">
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="font-bold text-[#0a2540] block">
                  1. Solicitação de Acesso (Inciso VII)
                </span>
                <p className="text-[11px] text-slate-500">
                  Formulário com os 4 itens mínimos (Art. 10), emissão imediata de protocolo e
                  contagem do SLA de 20 dias úteis.
                </p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="font-bold text-[#0a2540] block">
                  2. Portal do POCC (Art. 37-A)
                </span>
                <p className="text-[11px] text-slate-500">
                  Manifestação de interesse não vinculante para capacidade nova e acompanhamento da
                  linha de tramitação do ciclo.
                </p>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/login"
                state={{ from: { pathname: '/poc', hash: '#area-do-carregador-autenticada' } }}
              >
                <Button className="h-10 px-6 bg-[#0a2540] hover:bg-[#13395e] text-white text-xs font-semibold cursor-pointer shadow-sm">
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  Entrar na Área do Carregador
                </Button>
              </Link>
              <Link to="/signup">
                <Button
                  variant="outline"
                  className="h-10 px-5 text-xs border-slate-300 text-slate-700"
                >
                  Cadastrar Empresa
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* CASO LOGADO: DOIS SISTEMAS DENTRO DA ÁREA DO CARREGADOR */
          <div className="space-y-8">
            {/* SISTEMA A: SOLICITAÇÃO DE ACESSO — INCISO VII (ART. 10) */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1 pb-2 border-b border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#0a2540] text-white uppercase tracking-wider">
                      Sistema A • Rito Permanente
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-[#0284c7]">
                      Inciso VII — Art. 10, Res. ANP nº 11/2016
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-sky-50 text-[#0284c7] border border-sky-200">
                    SLA Regulatório: 20 dias úteis (Art. 10, §2º)
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-[#0a2540]">
                  Solicitação de Acesso à Malha (Inciso VII — Art. 10)
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Rito permanente para requisição de acesso à capacidade da infraestrutura TSB.
                  Emissão de Parecer Técnico Fundamentado em até 20 dias úteis (Art. 10, §2º) e
                  comunicação formal com cópia à ANP nos desfechos regulatórios do §3º.
                </p>
              </div>

              {/* FORMULÁRIO DE SUBMISSÃO VII */}
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
                        protocolo{' '}
                        <strong className="font-mono">{protocoloGeradoVII.protocolo}</strong>. O
                        prazo regulatório de <strong>20 dias úteis</strong> para emissão do Parecer
                        Técnico Fundamentado da Transportadora (Art. 10, §2º) está em contagem a
                        partir de hoje. O protocolo já pode ser acompanhado no campo de consulta
                        abaixo.
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
                        <Label
                          htmlFor="vii_dt_ini"
                          className="text-xs font-semibold text-slate-700"
                        >
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
                        <Label
                          htmlFor="vii_dt_fim"
                          className="text-xs font-semibold text-slate-700"
                        >
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
                          onChange={(e) =>
                            setFormVII({ ...formVII, capacidade: Number(e.target.value) })
                          }
                          className="h-9 text-xs font-mono font-bold bg-white"
                        />
                        <span className="text-[10px] text-slate-500 block">Art. 10, III</span>
                      </div>
                    </div>

                    {/* (IV) PONTOS DE RECEBIMENTO E ENTREGA */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <Label
                          htmlFor="vii_ponto_sel"
                          className="text-xs font-semibold text-slate-700"
                        >
                          (IV) Ponto Relevante e Rota Dutoviária (Trechos 1 e 3 da Malha TSB) *
                        </Label>
                        <select
                          id="vii_ponto_sel"
                          value={formVII.ponto_relevante_id}
                          onChange={(e) =>
                            setFormVII({ ...formVII, ponto_relevante_id: e.target.value })
                          }
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
                            <span className="font-semibold text-slate-700">
                              Ponto de Recebimento:
                            </span>
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
                        A submissão autua o protocolo <strong>TSB-AAAA-XXXX</strong> com prazo de
                        resposta de 20 dias úteis (Art. 10, §2º).
                      </span>

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
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* CONSULTA DE PROTOCOLO & SLA DENTRO DO SISTEMA A */}
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
                    Acompanhe a tramitação, o prazo regulatório e o Parecer Fundamentado da
                    Transportadora informando o número de protocolo autuado.
                  </p>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-4">
                  <form
                    onSubmit={handleConsultarProtocolo}
                    className="flex flex-col sm:flex-row gap-3"
                  >
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
                                        <span className="text-slate-500 font-medium">
                                          Razão Social:
                                        </span>{' '}
                                        <strong className="text-slate-900">
                                          {sol.razao_social}
                                        </strong>
                                      </div>
                                    )}
                                    {sol.cnpj && (
                                      <div>
                                        <span className="text-slate-500 font-medium">CNPJ:</span>{' '}
                                        <strong className="font-mono text-slate-900">
                                          {sol.cnpj}
                                        </strong>
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

                              <div className="space-y-1.5 pt-1">
                                <span className="text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                                  <FileText className="h-4 w-4 text-[#0284c7]" />
                                  Parecer Fundamentado da Transportadora (Art. 10, §2º da Res. ANP
                                  nº 11/2016):
                                </span>
                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 leading-relaxed whitespace-pre-line shadow-2xs">
                                  {sol.parecer_fundamentado ||
                                    'Solicitação de acesso formalmente recepcionada. Em processo de análise de viabilidade técnico-operacional e verificação de capacidade ociosa nos pontos de conexão.'}
                                </div>
                              </div>

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
                            <strong className="font-mono">
                              {resultadoConsulta.protocoloPesquisado}
                            </strong>
                            . Verifique se o número foi digitado corretamente conforme o comprovante
                            formal recebido por e-mail (Ex: TSB-2026-8942).
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 pt-1 flex items-start gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      O Parecer Fundamentado é emitido no prazo regulatório de 20 dias úteis e
                      registrado nos termos do Art. 10 da Resolução ANP nº 11/2016, com envio de
                      cópia à ANP nos desfechos do §3º. Dúvidas:{' '}
                      <strong className="text-slate-700">regulacao@tsb.com.br</strong>.
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SISTEMA B: PORTAL DO POCC — MANIFESTAÇÕES & HISTÓRICO (ART. 37-A) */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="space-y-1 pb-2 border-b border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#0284c7] text-white uppercase tracking-wider">
                      Sistema B • Portal do POCC
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-[#0a2540]">
                      Art. 37-A, §5º, I — Res. ANP nº 961/2023
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Ciclo 2026/2027 • Manifestação Não Vinculante
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-[#0a2540]">
                  Manifestação de Interesse e Participação no POCC
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Submeta e acompanhe as manifestações de interesse da sua empresa para alocação de
                  capacidade nova no âmbito do POCC. As manifestações subsidiam a homologação
                  tarifária da ANP e habilitam o Carregador para as etapas seguintes de Propostas
                  Garantidas.
                </p>
              </div>

              {/* =========================================================================
                  DOIS MÓDULOS DISTINTOS COM ESTADO PERSISTIDO:
                  MÓDULO 1: GERAR DOCUMENTO DE MANIFESTAÇÃO DE INTERESSE
                  MÓDULO 2: ANEXAR DOCUMENTO ASSINADO
                  ========================================================================= */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* MÓDULO 1: GERAR DOCUMENTO E PERSISTIR RASCUNHO */}
                  <Card className="border border-slate-200 bg-white shadow-none flex flex-col justify-between">
                    <CardHeader className="p-5 pb-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#0a2540] text-white">
                          Módulo 1
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Etapa I • Não Vinculante
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold text-[#0a2540] flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#0284c7]" />
                        1. Gerar Documento de Manifestação
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-600 leading-relaxed">
                        Preencha as especificações da demanda pretendida (capacidade, modalidade,
                        trecho, período). Ao gerar o PDF, o rascunho oficial é{' '}
                        <strong>automaticamente persistido</strong> no sistema. Você pode fechar o
                        navegador, levar dias para colher a assinatura e retornar quando quiser.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 space-y-3">
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600 space-y-1">
                        <div>
                          <strong>Signatário:</strong> {representanteLegalUsuario} ({cnpjUsuario})
                        </div>
                        <div>
                          <strong>Capacidade sugerida:</strong> 150.000 m³/dia &bull; Trechos 1 e 3
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setModalModulo1Aberto(true)
                        }}
                        className="w-full h-9.5 bg-[#0a2540] hover:bg-[#13395e] text-white font-semibold text-xs cursor-pointer shadow-xs transition-colors"
                      >
                        <FileDown className="h-4 w-4 mr-1.5 text-sky-400" />
                        Preencher &amp; Gerar Documento para Assinatura
                      </Button>
                    </CardContent>
                  </Card>

                  {/* MÓDULO 2: ANEXAR DOCUMENTO ASSINADO */}
                  <Card className="border border-slate-200 bg-white shadow-none flex flex-col justify-between">
                    <CardHeader className="p-5 pb-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#0284c7] text-white">
                          Módulo 2
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {
                            minhasManifestacoes.filter(
                              (m) =>
                                m.status ===
                                'Documento gerado — aguardando assinatura do representante legal',
                            ).length
                          }{' '}
                          pendente(s) de envio
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold text-[#0a2540] flex items-center gap-2">
                        <UploadCloud className="h-4 w-4 text-[#0284c7]" />
                        2. Anexar Documento Assinado
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-600 leading-relaxed">
                        Já colheu a assinatura digital (ICP-Brasil/Gov.br) ou física do
                        representante legal? Selecione o rascunho correspondente, faça o upload
                        exclusivo do PDF assinado e confirme.{' '}
                        <strong>Aí sim nasce o protocolo definitivo</strong> e a solicitação entra
                        na fila ativa da TSB.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 space-y-3">
                      <div className="p-2.5 bg-sky-50/60 rounded border border-sky-200 text-[11px] text-sky-950 space-y-1">
                        <div>
                          <strong>Formato obrigatório:</strong> Arquivo PDF assinado (.pdf) até 50
                          MB
                        </div>
                        <div>
                          <strong>Efeito regulatório:</strong> Autuação imediata do protocolo
                          definitivo
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          const pendentes = minhasManifestacoes.filter(
                            (m) =>
                              m.status ===
                              'Documento gerado — aguardando assinatura do representante legal',
                          )
                          if (pendentes.length > 0 && !rascunhoSelecionadoId) {
                            setRascunhoSelecionadoId(pendentes[0].id)
                          }
                          setModalModulo2Aberto(true)
                        }}
                        className="w-full h-9.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs cursor-pointer shadow-xs transition-colors"
                      >
                        <UploadCloud className="h-4 w-4 mr-1.5 text-white" />
                        Anexar Documento Assinado &amp; Protocolar
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* BANNER DE SUCESSO DO RASCUNHO GERADO */}
                {rascunhoGeradoSucesso && (
                  <div className="p-4 sm:p-5 bg-sky-50 border border-sky-300 rounded-lg space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0284c7] text-white flex items-center justify-center shrink-0">
                          <Check className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                            Rascunho Gerado e Salvo com Sucesso
                          </span>
                          <span className="font-mono text-sm sm:text-base font-bold text-[#0a2540]">
                            Identificador: {rascunhoGeradoSucesso.protocolo}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBaixarNovamentePdf(rascunhoGeradoSucesso.registro)}
                          className="text-xs h-7.5 border-sky-300 text-sky-900 bg-white hover:bg-sky-50"
                        >
                          <Download className="h-3 w-3 mr-1 text-[#0284c7]" />
                          Baixar PDF Novamente
                        </Button>
                        <button
                          type="button"
                          onClick={() => setRascunhoGeradoSucesso(null)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      O documento oficial foi baixado no seu computador e seu rascunho foi
                      registrado no status{' '}
                      <span className="font-semibold text-slate-900">
                        &ldquo;Documento gerado — aguardando assinatura do representante
                        legal&rdquo;
                      </span>
                      . Colete a assinatura com tranquilidade: quando estiver assinado, acesse o{' '}
                      <strong>Módulo 2 (Anexar Documento Assinado)</strong> para concluir o
                      protocolo.
                    </p>
                  </div>
                )}

                {/* BANNER DE CONFIRMAÇÃO DO PROTOCOLO DEFINITIVO POCC */}
                {protocoloGeradoPOCC && (
                  <div className="p-4 sm:p-5 bg-emerald-50 border border-emerald-300 rounded-lg space-y-3 animate-fade-in">
                    <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                            Manifestação de Interesse Protocolada Definitivamente
                          </span>
                          <span className="font-mono text-lg sm:text-xl font-bold text-emerald-950">
                            {protocoloGeradoPOCC.protocolo}
                          </span>
                        </div>
                      </div>

                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-semibold">
                        Origem: Área do Carregador (autenticado)
                      </Badge>
                    </div>

                    <p className="text-xs text-emerald-900 leading-relaxed">
                      Sua manifestação de interesse foi formalmente autuada sob o protocolo
                      definitivo{' '}
                      <strong className="font-mono">{protocoloGeradoPOCC.protocolo}</strong> com o
                      documento assinado anexado. O registro encontra-se no status{' '}
                      <strong>
                        &ldquo;Manifestação registrada — aguardando conferência da assinatura&rdquo;
                      </strong>{' '}
                      e passou a compor a fila ativa de Gestão Interna da TSB para habilitação na
                      Etapa II do POCC (Art. 37-A, §5º, II).
                    </p>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-emerald-700 text-[11px]">
                        Comprovante e arquivo assinado arquivados no sistema regulatório da TSB.
                      </span>
                      <button
                        type="button"
                        onClick={() => setProtocoloGeradoPOCC(null)}
                        className="text-emerald-800 hover:underline cursor-pointer font-medium"
                      >
                        Fechar aviso
                      </button>
                    </div>
                  </div>
                )}

                {/* HISTÓRICO DE MANIFESTAÇÕES DO PRÓPRIO CARREGADOR (RASCUNHOS E PROTOCOLADAS) */}
                <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs font-bold text-[#0a2540] uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck2 className="h-3.5 w-3.5 text-[#0284c7]" />
                      Histórico de Manifestações do Carregador (Ciclo POCC Vigente)
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Total: {minhasManifestacoes.length} registro(s) (
                      {
                        minhasManifestacoes.filter(
                          (m) =>
                            m.status ===
                            'Documento gerado — aguardando assinatura do representante legal',
                        ).length
                      }{' '}
                      em preparação /{' '}
                      {
                        minhasManifestacoes.filter(
                          (m) =>
                            m.status !==
                            'Documento gerado — aguardando assinatura do representante legal',
                        ).length
                      }{' '}
                      protocolada(s))
                    </span>
                  </div>

                  {temManifestacao ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left bg-white border-collapse">
                        <thead className="bg-slate-100 text-[#0a2540] font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Protocolo</th>
                            <th className="p-3">Capacidade</th>
                            <th className="p-3">Modalidade</th>
                            <th className="p-3">Trecho</th>
                            <th className="p-3">Status Atual</th>
                            <th className="p-3">Documento</th>
                            <th className="p-3">Data</th>
                            <th className="p-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {minhasManifestacoes.map((m) => {
                            const urlArquivo = pocService.obterUrlArquivoManifestacao(m)
                            const isRascunho =
                              m.status ===
                              'Documento gerado — aguardando assinatura do representante legal'

                            return (
                              <tr
                                key={m.id}
                                className={
                                  isRascunho
                                    ? 'bg-amber-50/30 hover:bg-amber-50/60'
                                    : 'hover:bg-slate-50'
                                }
                              >
                                <td className="p-3 font-mono font-bold text-[#0284c7]">
                                  {m.protocolo}
                                </td>
                                <td className="p-3 font-bold text-slate-800">
                                  {Number(m.capacidade_solicitada).toLocaleString('pt-BR')} m³/dia
                                </td>
                                <td className="p-3 text-slate-700">{m.modalidade}</td>
                                <td className="p-3 text-slate-600">
                                  {m.ponto_recebimento} &rarr; {m.ponto_entrega}
                                </td>
                                <td className="p-3">
                                  {isRascunho ? (
                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                                      Aguardando Assinatura (Em Preparação)
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      {m.status ||
                                        'Manifestação registrada — aguardando conferência da assinatura'}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {urlArquivo ? (
                                    <a
                                      href={urlArquivo}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:underline"
                                    >
                                      <Download className="h-3 w-3" />
                                      PDF Assinado
                                    </a>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleBaixarNovamentePdf(m)}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-[#0284c7] underline cursor-pointer"
                                      title="Baixar novamente o documento oficial para colher assinatura"
                                    >
                                      <Download className="h-3 w-3 text-sky-600" />
                                      Baixar Modelo
                                    </button>
                                  )}
                                </td>
                                <td className="p-3 text-slate-500 font-mono">
                                  {new Date(m.created).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="p-3 text-right">
                                  {isRascunho ? (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setRascunhoSelecionadoId(m.id)
                                        setModalModulo2Aberto(true)
                                      }}
                                      className="h-7 px-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-[11px] font-semibold cursor-pointer"
                                    >
                                      <UploadCloud className="h-3 w-3 mr-1" />
                                      Anexar Assinado
                                    </Button>
                                  ) : (
                                    <span className="text-[11px] text-slate-400 font-mono">
                                      Protocolado
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-xs text-slate-500 text-center">
                      Nenhuma manifestação de interesse submetida ou gerada por este Carregador no
                      ciclo vigente. Use o <strong>Módulo 1</strong> acima para iniciar.
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          MODAL DO MÓDULO 1: GERAR DOCUMENTO E PERSISTIR RASCUNHO
          Preenchimento dos dados regulatórios + download do PDF oficial + persistência
          imediata como rascunho oficial (aguardando assinatura).
          ========================================================================= */}
      {modalModulo1Aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-5 sm:p-6 space-y-4 border border-slate-200 max-h-[92vh] overflow-y-auto relative">
            <button
              type="button"
              onClick={() => setModalModulo1Aberto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 text-[#0a2540] border-b border-slate-200 pb-3">
              <div className="p-2 bg-slate-100 rounded-full text-[#0a2540]">
                <FileText className="h-5 w-5 text-[#0284c7]" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-[#0a2540] text-white">
                    MÓDULO 1
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-[#0a2540]">
                    Gerar Documento de Manifestação de Interesse (POCC)
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Art. 37-A, §5º, I (Resolução ANP nº 961/2023) &bull; Rascunho persistido para
                  assinatura
                </p>
              </div>
            </div>

            {/* TERMO DE NÃO VINCULAÇÃO VISÍVEL */}
            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded text-xs text-sky-950 leading-relaxed">
              <strong>Termo de Não Vinculação (Art. 37-A, §5º, I):</strong> Esta Manifestação de
              Interesse possui caráter <strong>não vinculante</strong> e destina-se exclusivamente
              ao levantamento preliminar de demanda para embasamento das Tarifas de Referência pela
              ANP (§5º, II). A geração do documento <strong>salva o rascunho no banco</strong> para
              que você possa assinar fora do portal e reanexar no Módulo 2.
            </div>

            <div className="space-y-4 text-xs">
              {/* BLOCO DE IDENTIFICAÇÃO PREENCHIDO AUTOMATICAMENTE E NÃO EDITÁVEL */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-[#0a2540] flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                    <Building2 className="h-3.5 w-3.5 text-[#0284c7]" />
                    Identificação do Carregador Interessado (Autenticado)
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Preenchido automaticamente a partir da conta (não editável)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-1">
                  <div className="p-2 bg-white border border-slate-200 rounded">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      Razão Social
                    </span>
                    <span className="font-bold text-slate-900 truncate block">
                      {razaoSocialUsuario}
                    </span>
                  </div>

                  <div className="p-2 bg-white border border-slate-200 rounded">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      CNPJ
                    </span>
                    <span className="font-mono font-semibold text-slate-900 block">
                      {cnpjUsuario}
                    </span>
                  </div>

                  <div className="p-2 bg-white border border-slate-200 rounded">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      Representante Legal
                    </span>
                    <span className="font-medium text-slate-900 truncate block">
                      {representanteLegalUsuario}
                    </span>
                  </div>

                  <div className="p-2 bg-white border border-slate-200 rounded">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      E-mail Corporativo
                    </span>
                    <span className="font-mono text-[11px] text-slate-900 truncate block">
                      {emailUsuario}
                    </span>
                  </div>
                </div>
              </div>

              {/* CAMPOS DO RITO PREENCHIDOS PELO CARREGADOR */}
              <div className="space-y-3">
                <span className="font-bold text-[#0a2540] block text-xs uppercase tracking-wide">
                  Especificações da Demanda Pretendida no POCC
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* CAPACIDADE PRETENDIDA */}
                  <div className="space-y-1">
                    <Label htmlFor="m1_cap" className="text-xs font-semibold text-slate-700">
                      Capacidade Pretendida (m³/dia) *
                    </Label>
                    <Input
                      id="m1_cap"
                      type="number"
                      required
                      min={1}
                      value={formManif.capacidade_solicitada}
                      onChange={(e) =>
                        setFormManif({
                          ...formManif,
                          capacidade_solicitada: Number(e.target.value),
                        })
                      }
                      className="h-8.5 text-xs font-mono font-bold bg-white"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Mínimo 1 m³/dia • Volume diário médio contratado
                    </span>
                  </div>

                  {/* MODALIDADE */}
                  <div className="space-y-1">
                    <Label htmlFor="m1_mod" className="text-xs font-semibold text-slate-700">
                      Modalidade de Contratação *
                    </Label>
                    <select
                      id="m1_mod"
                      value={formManif.modalidade}
                      onChange={(e) =>
                        setFormManif({
                          ...formManif,
                          modalidade: e.target.value as 'Firme Ordinário' | 'Interruptível',
                        })
                      }
                      className="w-full h-8.5 px-2.5 rounded border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0a2540]"
                    >
                      <option value="Firme Ordinário">Firme Ordinário (POCC Anual)</option>
                      <option value="Interruptível">Interruptível</option>
                    </select>
                    <span className="text-[10px] text-slate-500 block">
                      Art. 37-A, §5º, I da Resolução ANP nº 961/2023
                    </span>
                  </div>

                  {/* SELEÇÃO DO TRECHO E PONTOS RELEVANTES */}
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="m1_trecho_sel" className="text-xs font-semibold text-slate-700">
                      Trecho e Pontos da Malha TSB (Pontos Homologados) *
                    </Label>
                    <select
                      id="m1_trecho_sel"
                      value={formManif.trecho_opcao_id}
                      onChange={(e) => {
                        const op =
                          opcoesTrechosManif.find((o) => o.id === e.target.value) ||
                          opcoesTrechosManif[0]
                        setFormManif({
                          ...formManif,
                          trecho_opcao_id: op.id,
                          trecho: op.trecho,
                          ponto_recebimento: op.ponto_recebimento,
                          ponto_entrega: op.ponto_entrega,
                        })
                      }}
                      className="w-full h-8.5 px-2.5 rounded border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0a2540]"
                    >
                      {opcoesTrechosManif.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* DETALHAMENTO DOS PONTOS DE ENTRADA E SAÍDA SELECIONADOS */}
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded sm:col-span-2 text-[11px] text-slate-600 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="font-semibold text-slate-700">Ponto de Entrada (PE):</span>{' '}
                        <strong className="text-[#0a2540]">{formManif.ponto_recebimento}</strong>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Ponto de Saída (ZS):</span>{' '}
                        <strong className="text-[#0a2540]">{formManif.ponto_entrega}</strong>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Trecho vinculado: <strong>{formManif.trecho}</strong>
                    </div>
                  </div>

                  {/* PERÍODO DE INTERESSE: DATA INÍCIO */}
                  <div className="space-y-1">
                    <Label htmlFor="m1_dt_ini" className="text-xs font-semibold text-slate-700">
                      Período de Interesse: Data Início *
                    </Label>
                    <Input
                      id="m1_dt_ini"
                      type="date"
                      required
                      value={formManif.data_inicio}
                      onChange={(e) => setFormManif({ ...formManif, data_inicio: e.target.value })}
                      className="h-8.5 text-xs bg-white"
                    />
                  </div>

                  {/* PERÍODO DE INTERESSE: DATA FIM */}
                  <div className="space-y-1">
                    <Label htmlFor="m1_dt_fim" className="text-xs font-semibold text-slate-700">
                      Período de Interesse: Data Fim *
                    </Label>
                    <Input
                      id="m1_dt_fim"
                      type="date"
                      required
                      value={formManif.data_fim}
                      onChange={(e) => setFormManif({ ...formManif, data_fim: e.target.value })}
                      className="h-8.5 text-xs bg-white"
                    />
                  </div>

                  {/* OBSERVAÇÕES OPCIONAIS */}
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="m1_obs" className="text-xs font-semibold text-slate-700">
                      Observações Opcionais / Condicionantes Técnicas
                    </Label>
                    <Input
                      id="m1_obs"
                      placeholder="Ex: perfil operacional pretendido, sazonalidade, pontos de conexão..."
                      value={formManif.observacoes}
                      onChange={(e) => setFormManif({ ...formManif, observacoes: e.target.value })}
                      className="h-8.5 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* CHECKBOX DO TERMO DE NÃO VINCULAÇÃO */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-700 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="m1_decl"
                  checked={formManif.declaracao_nao_vinculante}
                  onChange={(e) =>
                    setFormManif({ ...formManif, declaracao_nao_vinculante: e.target.checked })
                  }
                  className="mt-0.5 rounded text-[#0a2540] focus:ring-[#0a2540]"
                />
                <label htmlFor="m1_decl" className="cursor-pointer leading-snug">
                  Declaro estar ciente de que esta manifestação é <strong>NÃO VINCULANTE</strong>,
                  destinada ao levantamento de demanda preliminar para instrução das Tarifas de
                  Referência pela ANP no POCC (Art. 37-A, §5º, I).
                </label>
              </div>

              {/* BOTÕES DO MÓDULO 1 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t">
                <span className="text-[11px] text-slate-500">
                  O rascunho ficará salvo no sistema com status &ldquo;Aguardando assinatura&rdquo;.
                </span>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalModulo1Aberto(false)}
                    className="text-xs h-9 cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleGerarEPersistirDocumento}
                    disabled={salvandoRascunhoManif || !formManif.declaracao_nao_vinculante}
                    className="bg-[#0a2540] hover:bg-[#13395e] text-white text-xs font-semibold h-9 px-4 cursor-pointer shadow-xs"
                  >
                    {salvandoRascunhoManif ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Persistindo Rascunho &amp; Gerando PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5 mr-1.5 text-sky-400" />
                        Baixar Documento e Salvar Rascunho
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DO MÓDULO 2: ANEXAR DOCUMENTO ASSINADO & CONCLUIR PROTOCOLO DEFINITIVO
          Carregador seleciona o rascunho pendente de assinatura, faz o upload exclusivo
          do PDF assinado e confirma a autuação regulatória oficial.
          ========================================================================= */}
      {modalModulo2Aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-5 sm:p-6 space-y-4 border border-slate-200 max-h-[92vh] overflow-y-auto relative">
            <button
              type="button"
              onClick={() => {
                setModalModulo2Aberto(false)
                setArquivoAssinadoManif(null)
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 text-[#0a2540] border-b border-slate-200 pb-3">
              <div className="p-2 bg-sky-50 rounded-full text-[#0284c7]">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-[#0284c7] text-white">
                    MÓDULO 2
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-[#0a2540]">
                    Anexar Documento Assinado
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Emissão de Protocolo Definitivo &bull; Entrada na Fila Ativa da TSB
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmarUploadAssinado} className="space-y-4 text-xs">
              {/* SELEÇÃO DO RASCUNHO PENDENTE */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sel_rascunho" className="text-xs font-semibold text-slate-700">
                    Selecione a Manifestação em Preparação *
                  </Label>
                  {rascunhoSelecionadoId && (
                    <button
                      type="button"
                      onClick={() => {
                        const rec = minhasManifestacoes.find((m) => m.id === rascunhoSelecionadoId)
                        if (rec) handleBaixarNovamentePdf(rec)
                      }}
                      className="text-[11px] font-semibold text-[#0284c7] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      Baixar PDF gerado deste rascunho
                    </button>
                  )}
                </div>

                {minhasManifestacoes.filter(
                  (m) =>
                    m.status === 'Documento gerado — aguardando assinatura do representante legal',
                ).length > 0 ? (
                  <select
                    id="sel_rascunho"
                    value={rascunhoSelecionadoId}
                    onChange={(e) => setRascunhoSelecionadoId(e.target.value)}
                    required
                    className="w-full h-9 px-2.5 rounded border border-slate-300 text-xs bg-white text-slate-800 font-medium focus:ring-1 focus:ring-[#0a2540]"
                  >
                    <option value="">-- Selecione uma manifestação pendente --</option>
                    {minhasManifestacoes
                      .filter(
                        (m) =>
                          m.status ===
                          'Documento gerado — aguardando assinatura do representante legal',
                      )
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.protocolo} — {Number(m.capacidade_solicitada).toLocaleString('pt-BR')}{' '}
                          m³/dia ({m.modalidade} • {m.trecho})
                        </option>
                      ))}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs space-y-1">
                    <strong>Nenhum rascunho aguardando assinatura localizado.</strong>
                    <p className="text-[11px]">
                      Você ainda não gerou um documento no Módulo 1 ou todas as suas manifestações
                      já foram protocoladas. Utilize o <strong>Módulo 1</strong> para gerar um novo
                      documento.
                    </p>
                  </div>
                )}
              </div>

              {/* DETALHES DO RASCUNHO SELECIONADO */}
              {rascunhoSelecionadoId &&
                (() => {
                  const sel = minhasManifestacoes.find((m) => m.id === rascunhoSelecionadoId)
                  if (!sel) return null
                  return (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-1 text-slate-700">
                      <div className="font-semibold text-slate-900 flex items-center justify-between">
                        <span>Dados do Rascunho Selecionado:</span>
                        <span className="font-mono text-[#0284c7]">{sel.protocolo}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <strong>Capacidade:</strong>{' '}
                          {Number(sel.capacidade_solicitada).toLocaleString('pt-BR')} m³/dia
                        </div>
                        <div>
                          <strong>Modalidade:</strong> {sel.modalidade}
                        </div>
                        <div className="col-span-2">
                          <strong>Trecho:</strong> {sel.trecho} ({sel.ponto_recebimento} &rarr;{' '}
                          {sel.ponto_entrega})
                        </div>
                      </div>
                    </div>
                  )
                })()}

              {/* CAMPO DE UPLOAD EXCLUSIVO DE PDF */}
              <div className="space-y-2">
                <Label
                  htmlFor="m2_pdf_assinado"
                  className="text-xs font-semibold text-slate-700 block"
                >
                  Upload do Documento Assinado (Exclusivo PDF) *
                </Label>

                <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 bg-slate-50/60 hover:bg-slate-50 text-center transition-colors">
                  <input
                    type="file"
                    id="m2_pdf_assinado"
                    accept="application/pdf"
                    required
                    onChange={handleSelecionarArquivoAssinado}
                    className="hidden"
                  />
                  <label
                    htmlFor="m2_pdf_assinado"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <UploadCloud className="h-8 w-8 text-[#0284c7]" />
                    <span className="text-xs font-semibold text-slate-800">
                      {arquivoAssinadoManif ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <Check className="h-4 w-4" /> Arquivo selecionado:{' '}
                          {arquivoAssinadoManif.name} (
                          {(arquivoAssinadoManif.size / 1024).toFixed(1)} KB)
                        </span>
                      ) : (
                        'Clique aqui para selecionar o PDF assinado pelo representante legal'
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Aceito exclusivamente: arquivo .pdf (ICP-Brasil, Gov.br ou físico carimbado)
                      até 50 MB
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>
                    <strong>Validação Regulatória:</strong> A solicitação só entra na fila de
                    análise da TSB com o PDF assinado anexado. O status mudará para{' '}
                    <em>
                      &ldquo;Manifestação registrada — aguardando conferência da assinatura&rdquo;
                    </em>
                    .
                  </span>
                </div>
              </div>

              {/* BOTÕES DO MÓDULO 2 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setModalModulo2Aberto(false)
                    setArquivoAssinadoManif(null)
                  }}
                  className="text-xs h-9 cursor-pointer"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={
                    enviandoAssinadoManif || !arquivoAssinadoManif || !rascunhoSelecionadoId
                  }
                  className="bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold h-9 px-5 cursor-pointer shadow-xs"
                >
                  {enviandoAssinadoManif ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Autuando Protocolo Oficial...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5 text-white" />
                      Confirmar Envio e Protocolar
                    </>
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
