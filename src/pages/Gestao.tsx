import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtime } from '@/hooks/use-realtime'
import {
  solicitacoesService,
  type SolicitacaoIncisoVII,
  type DesfechoTipo,
  type StatusSolicitacao,
  type ManifestacaoSulgasStatus,
} from '@/services/solicitacoes'
import { cessoesService, type OfertaCessaoIncisoVIII } from '@/services/cessoes'
import { tarifaService, type QuadroTarifa, TARIFA_SEED_FALLBACK } from '@/services/tarifa'
import { QuadroTarifaDestaque } from '@/components/QuadroTarifaDestaque'
import { EditoriaTransparencia } from '@/components/EditoriaTransparencia'
import { ConducaoCicloPOCC } from '@/components/ConducaoCicloPOCC'
import {
  ShieldAlert,
  ShieldCheck,
  FileText,
  Clock,
  Scale,
  ArrowRight,
  X,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  FileSignature,
  Send,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  DollarSign,
  Save,
  Eye,
  EyeOff,
  PlusCircle,
  Trash2,
  Layers,
  Handshake,
  Mail,
  UserCheck,
} from 'lucide-react'

export default function Gestao() {
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoIncisoVII[]>([])
  const [carregando, setCarregando] = useState(true)
  const [itemSelecionado, setItemSelecionado] = useState<SolicitacaoIncisoVII | null>(null)
  const [modalAberto, setModalAberto] = useState(false)

  // ART. 10, §2º: Os 3 Desfechos Oficiais Padronizados
  const [desfechoTipo, setDesfechoTipo] = useState<DesfechoTipo>('CONFIRMACAO')
  const [novoStatus, setNovoStatus] = useState<StatusSolicitacao>(
    'Confirmação do Atendimento (Desfecho I)',
  )
  const [parecerFundamentado, setParecerFundamentado] = useState('')
  const [erroParecer, setErroParecer] = useState<string | null>(null)
  const [salvandoStatus, setSalvandoStatus] = useState(false)

  // Campos específicos dos desfechos
  // Desfecho I: Confirmação com termos e condições
  const [termosCondicoes, setTermosCondicoes] = useState('')
  // Desfecho II: Aprofundamento com 4 elementos
  const [condicoesAprofundamento, setCondicoesAprofundamento] = useState('')
  const [escopoAprofundamento, setEscopoAprofundamento] = useState('')
  const [cronogramaAprofundamento, setCronogramaAprofundamento] = useState('')
  const [custosAprofundamento, setCustosAprofundamento] = useState('')
  // Desfecho III: Negativa com previsão de disponibilidade
  const [previsaoDisponibilidade, setPrevisaoDisponibilidade] = useState('')

  // ART. 10, §3º: Cópia à ANP
  const [copiaAnpDestinatario, setCopiaAnpDestinatario] = useState('acesso.transporte@anp.gov.br')

  // ART. 10, §5º: Manifestação da Concessionária Estadual (Sulgás)
  const [sulgasStatus, setSulgasStatus] = useState<ManifestacaoSulgasStatus>('Pendente')
  const [sulgasData, setSulgasData] = useState('')
  const [sulgasObs, setSulgasObs] = useState('')
  const [prontoContratacaoTentado, setProntoContratacaoTentado] = useState(false)

  // Fila de Cessões do Inciso VIII (Gestão Interna - com dados de contato protegidos pela LGPD)
  const [cessoesInternas, setCessoesInternas] = useState<OfertaCessaoIncisoVIII[]>([])
  const [carregandoCessoesInternas, setCarregandoCessoesInternas] = useState(false)
  const [emailRecebimentoCessoes, setEmailRecebimentoCessoes] = useState('acesso@tsb.com.br')
  const [editandoEmailRecebimento, setEditandoEmailRecebimento] = useState(false)
  const [novoEmailRecebimento, setNovoEmailRecebimento] = useState('acesso@tsb.com.br')
  const [salvandoEmailRecebimento, setSalvandoEmailRecebimento] = useState(false)

  // Modal / Formulário de Cadastro e Edição de Oferta a partir de PDF
  const [modalCessaoAberto, setModalCessaoAberto] = useState(false)
  const [cessaoEmEdicao, setCessaoEmEdicao] = useState<OfertaCessaoIncisoVIII | null>(null)
  const [salvandoCessao, setSalvandoCessao] = useState(false)
  const [erroFormCessaoInterna, setErroFormCessaoInterna] = useState<string | null>(null)
  const [formCessaoInterna, setFormCessaoInterna] = useState({
    cedente: '',
    cnpj: '',
    representante_legal: '',
    contato: '',
    modalidade: 'Firme Ordinário',
    capacidade_ociosa: '',
    trecho: 'Uruguaiana -> Triunfo',
    ponto_recebimento: 'Paso de Los Libres (RS)',
    ponto_entrega: 'Triunfo - Polo Petroquímico (RS)',
    periodo_contratual: '',
    observacoes: '',
    status: 'Disponível' as 'Disponível' | 'Em Negociação' | 'Concluída' | 'Cancelada',
    publicada: true,
  })
  const [arquivoPdfUpload, setArquivoPdfUpload] = useState<File | null>(null)

  // Aba ativa na Gestão Interna: 'solicitacoes' | 'cessoes' | 'pocc' | 'tarifa' | 'transparencia'
  const [abaAtiva, setAbaAtiva] = useState<
    'solicitacoes' | 'cessoes' | 'pocc' | 'tarifa' | 'transparencia'
  >('solicitacoes')

  // Estado da Tarifa em Destaque
  const [tarifaForm, setTarifaForm] = useState<QuadroTarifa>(TARIFA_SEED_FALLBACK)
  const [carregandoTarifa, setCarregandoTarifa] = useState(false)
  const [salvandoTarifa, setSalvandoTarifa] = useState(false)

  // Carregar solicitações do backend
  const carregarSolicitacoes = useCallback(async () => {
    try {
      const lista = await solicitacoesService.listar()
      setSolicitacoes(lista)
    } catch {
      // Ignora erro inicial
    } finally {
      setCarregando(false)
    }
  }, [])

  // Carregar ofertas de cessão com contato completo (Gestão Interna) e e-mail de recebimento
  const carregarCessoesInternas = useCallback(async () => {
    setCarregandoCessoesInternas(true)
    try {
      const [lista, email] = await Promise.all([
        cessoesService.listarInterno(),
        cessoesService.obterEmailRecebimento(),
      ])
      setCessoesInternas(lista)
      if (email) {
        setEmailRecebimentoCessoes(email)
        setNovoEmailRecebimento(email)
      }
    } catch {
      // Ignora erro
    } finally {
      setCarregandoCessoesInternas(false)
    }
  }, [])

  const salvarNovoEmailRecebimento = async () => {
    if (!novoEmailRecebimento.trim()) return
    setSalvandoEmailRecebimento(true)
    try {
      const salvo = await cessoesService.salvarEmailRecebimento(novoEmailRecebimento)
      setEmailRecebimentoCessoes(salvo)
      setEditandoEmailRecebimento(false)
      toast({
        title: 'Canal Oficial Atualizado!',
        description: `E-mail de recebimento definido para: ${salvo}`,
      })
    } catch {
      toast({
        title: 'Erro ao salvar e-mail',
        description: 'Não foi possível atualizar o canal de recebimento.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoEmailRecebimento(false)
    }
  }

  const abrirModalNovaCessao = () => {
    setCessaoEmEdicao(null)
    setErroFormCessaoInterna(null)
    setArquivoPdfUpload(null)
    setFormCessaoInterna({
      cedente: '',
      cnpj: '',
      representante_legal: '',
      contato: '',
      modalidade: 'Firme Ordinário',
      capacidade_ociosa: '',
      trecho: 'Uruguaiana -> Triunfo',
      ponto_recebimento: 'Paso de Los Libres (RS)',
      ponto_entrega: 'Triunfo - Polo Petroquímico (RS)',
      periodo_contratual: '',
      observacoes: '',
      status: 'Disponível',
      publicada: true,
    })
    setModalCessaoAberto(true)
  }

  const abrirModalEditarCessao = (cessao: OfertaCessaoIncisoVIII) => {
    setCessaoEmEdicao(cessao)
    setErroFormCessaoInterna(null)
    setArquivoPdfUpload(null)
    setFormCessaoInterna({
      cedente: cessao.cedente || '',
      cnpj: cessao.cnpj || '',
      representante_legal: cessao.representante_legal || '',
      contato: cessao.contato || '',
      modalidade: cessao.modalidade || 'Firme Ordinário',
      capacidade_ociosa: cessao.capacidade_ociosa ? String(cessao.capacidade_ociosa) : '',
      trecho: cessao.trecho || 'Uruguaiana -> Triunfo',
      ponto_recebimento: cessao.ponto_recebimento || 'Paso de Los Libres (RS)',
      ponto_entrega: cessao.ponto_entrega || 'Triunfo - Polo Petroquímico (RS)',
      periodo_contratual: cessao.periodo_contratual || '',
      observacoes: cessao.observacoes || '',
      status: cessao.status || 'Disponível',
      publicada: cessao.publicada !== false,
    })
    setModalCessaoAberto(true)
  }

  const salvarCessaoInterna = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroFormCessaoInterna(null)

    if (
      !formCessaoInterna.cedente.trim() ||
      !formCessaoInterna.trecho.trim() ||
      !formCessaoInterna.capacidade_ociosa ||
      !formCessaoInterna.periodo_contratual.trim() ||
      !formCessaoInterna.contato.trim()
    ) {
      setErroFormCessaoInterna('Preencha os campos obrigatórios marcados com *.')
      return
    }

    const capNum = Number(formCessaoInterna.capacidade_ociosa)
    if (isNaN(capNum) || capNum <= 0) {
      setErroFormCessaoInterna('A capacidade ociosa deve ser um número positivo.')
      return
    }

    setSalvandoCessao(true)
    try {
      if (cessaoEmEdicao) {
        // Atualizar
        await cessoesService.editarInterno(cessaoEmEdicao.id, {
          cedente: formCessaoInterna.cedente.trim(),
          cnpj: formCessaoInterna.cnpj.trim() || undefined,
          representante_legal: formCessaoInterna.representante_legal.trim() || undefined,
          contato: formCessaoInterna.contato.trim(),
          modalidade: formCessaoInterna.modalidade.trim() || undefined,
          capacidade_ociosa: capNum,
          trecho: formCessaoInterna.trecho.trim(),
          ponto_recebimento: formCessaoInterna.ponto_recebimento.trim() || undefined,
          ponto_entrega: formCessaoInterna.ponto_entrega.trim() || undefined,
          periodo_contratual: formCessaoInterna.periodo_contratual.trim(),
          observacoes: formCessaoInterna.observacoes.trim() || undefined,
          status: formCessaoInterna.status,
          publicada: formCessaoInterna.publicada,
          arquivo_formulario: arquivoPdfUpload || undefined,
        })
        toast({
          title: 'Oferta de Cessão Atualizada!',
          description: `Oferta CES-${cessaoEmEdicao.id.substring(0, 8).toUpperCase()} salva com sucesso.`,
        })
      } else {
        // Criar nova a partir do PDF
        const nova = await cessoesService.cadastrarInterno({
          cedente: formCessaoInterna.cedente.trim(),
          cnpj: formCessaoInterna.cnpj.trim() || undefined,
          representante_legal: formCessaoInterna.representante_legal.trim() || undefined,
          contato: formCessaoInterna.contato.trim(),
          modalidade: formCessaoInterna.modalidade.trim() || undefined,
          capacidade_ociosa: capNum,
          trecho: formCessaoInterna.trecho.trim(),
          ponto_recebimento: formCessaoInterna.ponto_recebimento.trim() || undefined,
          ponto_entrega: formCessaoInterna.ponto_entrega.trim() || undefined,
          periodo_contratual: formCessaoInterna.periodo_contratual.trim(),
          observacoes: formCessaoInterna.observacoes.trim() || undefined,
          status: formCessaoInterna.status,
          publicada: formCessaoInterna.publicada,
          arquivo_formulario: arquivoPdfUpload,
        })
        toast({
          title: 'Oferta Cadastrada com Sucesso!',
          description: `Nova oferta cadastrada: CES-${nova.id.substring(0, 8).toUpperCase()} (${formCessaoInterna.publicada ? 'Publicada no portal' : 'Salva como Rascunho Oculto'}).`,
        })
      }
      setModalCessaoAberto(false)
      carregarCessoesInternas()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar oferta de cessão.'
      setErroFormCessaoInterna(msg)
    } finally {
      setSalvandoCessao(false)
    }
  }

  const handleAlternarPublicada = async (cessao: OfertaCessaoIncisoVIII) => {
    const novoValor = !(cessao.publicada ?? false)
    try {
      await cessoesService.togglePublicada(cessao.id, novoValor)
      toast({
        title: novoValor ? 'Oferta Publicada no Portal!' : 'Oferta Ocultada do Portal!',
        description: `CES-${cessao.id.substring(0, 8).toUpperCase()} agora está ${novoValor ? 'visível publicamente' : 'oculta da consulta pública'}.`,
      })
      carregarCessoesInternas()
    } catch {
      toast({
        title: 'Erro ao alterar visibilidade',
        description: 'Não foi possível alterar a visibilidade da oferta.',
        variant: 'destructive',
      })
    }
  }

  const handleExcluirCessao = async (cessao: OfertaCessaoIncisoVIII) => {
    if (
      !window.confirm(
        `Deseja realmente excluir a oferta CES-${cessao.id.substring(0, 8).toUpperCase()} de ${cessao.cedente}?`,
      )
    ) {
      return
    }
    try {
      await cessoesService.excluirInterno(cessao.id)
      toast({
        title: 'Oferta Excluída!',
        description: `Oferta CES-${cessao.id.substring(0, 8).toUpperCase()} removida com sucesso.`,
      })
      carregarCessoesInternas()
    } catch {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o registro.',
        variant: 'destructive',
      })
    }
  }

  // Carregar quadro de tarifa do backend
  const carregarTarifa = useCallback(async () => {
    setCarregandoTarifa(true)
    try {
      const dados = await tarifaService.obterTarifaPrincipal()
      if (dados) {
        setTarifaForm(dados)
      }
    } catch (e) {
      console.warn('Erro ao carregar tarifa na gestão:', e)
    } finally {
      setCarregandoTarifa(false)
    }
  }, [])

  useEffect(() => {
    carregarSolicitacoes()
    carregarCessoesInternas()
    carregarTarifa()
  }, [carregarSolicitacoes, carregarCessoesInternas, carregarTarifa])

  const salvarTarifaGestao = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvandoTarifa(true)
    try {
      const salva = await tarifaService.salvarTarifa(tarifaForm)
      setTarifaForm(salva)
      toast({
        title: 'Quadro de Tarifa Salvo!',
        description:
          'Os dados do quadro de tarifa em destaque da página inicial foram atualizados com sucesso.',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar quadro de tarifa.'
      toast({
        title: 'Erro ao salvar tarifa',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setSalvandoTarifa(false)
    }
  }

  // Realtime hook para atualizar a fila quando novas solicitações forem criadas ou editadas
  useRealtime<SolicitacaoIncisoVII>(
    'solicitacoes_inciso_vii',
    (data) => {
      if (data.action === 'create') {
        setSolicitacoes((prev) => [data.record, ...prev.filter((r) => r.id !== data.record.id)])
        toast({
          title: 'Nova Solicitação do Inciso VII!',
          description: `Protocolo: ${data.record.protocolo} — ${data.record.razao_social}`,
        })
      } else if (data.action === 'update') {
        setSolicitacoes((prev) => prev.map((r) => (r.id === data.record.id ? data.record : r)))
      } else if (data.action === 'delete') {
        setSolicitacoes((prev) => prev.filter((r) => r.id !== data.record.id))
      }
    },
    true,
  )

  const abrirModalAnalise = (item: SolicitacaoIncisoVII) => {
    setItemSelecionado(item)

    // Dedução do desfecho tipo inicial
    let inicialTipo: DesfechoTipo = 'CONFIRMACAO'
    if (item.desfecho_tipo === 'APROFUNDAMENTO' || item.status.includes('Aprofundamento')) {
      inicialTipo = 'APROFUNDAMENTO'
    } else if (
      item.desfecho_tipo === 'NEGATIVA' ||
      item.status.includes('Negativa') ||
      item.status === 'Rejeitada'
    ) {
      inicialTipo = 'NEGATIVA'
    } else if (
      item.desfecho_tipo === 'CONFIRMACAO' ||
      item.status === 'Aprovada' ||
      item.status.includes('Confirmação')
    ) {
      inicialTipo = 'CONFIRMACAO'
    }

    setDesfechoTipo(inicialTipo)
    setNovoStatus(
      inicialTipo === 'CONFIRMACAO'
        ? 'Confirmação do Atendimento (Desfecho I)'
        : inicialTipo === 'APROFUNDAMENTO'
          ? 'Aprofundamento da Análise (Desfecho II)'
          : 'Negativa Fundamentada (Desfecho III)',
    )

    setParecerFundamentado(item.parecer_fundamentado || '')
    setTermosCondicoes(
      item.termos_condicoes ||
        'Atendimento com disponibilidade de capacidade firme/interruptível conforme condições técnicas e tarifárias aprovadas pela ANP para o sistema TSB.',
    )
    setCondicoesAprofundamento(
      item.aprofundamento_condicoes ||
        'Necessidade de modelagem hidráulica transitória e dimensionamento de reforço na estação de compressão/medição.',
    )
    setEscopoAprofundamento(
      item.aprofundamento_escopo ||
        'Estudo termo-hidráulico avançado e verificação de integridade operacional para atendimento da curva de vazão solicitada.',
    )
    setCronogramaAprofundamento(
      item.aprofundamento_cronograma || '60 dias úteis para emissão do relatório executivo',
    )
    setCustosAprofundamento(
      item.aprofundamento_custos ||
        'Custos técnicos de estudo orçados em conformidade com tabela de serviços técnicos da transportadora.',
    )
    setPrevisaoDisponibilidade(
      item.previsao_disponibilidade ||
        'Indisponibilidade física momentânea. Previsão de nova capacidade mediante expansão planejada do Trecho 2 ou conclusão do próximo ciclo de contratação anual.',
    )

    setCopiaAnpDestinatario(item.copia_anp_destinatario || 'acesso.transporte@anp.gov.br')

    // Sulgás
    setSulgasStatus(item.manifestacao_sulgas_status || 'Pendente')
    setSulgasData(item.manifestacao_sulgas_data || new Date().toISOString().split('T')[0])
    setSulgasObs(item.manifestacao_sulgas_observacoes || '')
    setProntoContratacaoTentado(false)

    setErroParecer(null)
    setModalAberto(true)
  }

  // Sincroniza status conforme o tipo de desfecho
  const handleMudarDesfecho = (tipo: DesfechoTipo) => {
    setDesfechoTipo(tipo)
    if (tipo === 'CONFIRMACAO') {
      setNovoStatus('Confirmação do Atendimento (Desfecho I)')
    } else if (tipo === 'APROFUNDAMENTO') {
      setNovoStatus('Aprofundamento da Análise (Desfecho II)')
    } else if (tipo === 'NEGATIVA') {
      setNovoStatus('Negativa Fundamentada (Desfecho III)')
    }
  }

  // ART. 10: SALVAMENTO COM VALIDAÇÕES REGULATÓRIAS
  const salvarRespostaAnalise = async () => {
    if (!itemSelecionado) return

    // 1. Parecer técnico fundamentado obrigatório por escrito (Art. 10)
    if (!parecerFundamentado.trim() || parecerFundamentado.trim().length < 15) {
      setErroParecer(
        'O Art. 10 da Resolução ANP nº 11/2016 exige parecer técnico fundamentado por escrito (mínimo de 15 caracteres).',
      )
      return
    }

    // 2. Validações por tipo de desfecho
    if (desfechoTipo === 'CONFIRMACAO') {
      if (!termosCondicoes.trim()) {
        setErroParecer(
          'Para o Desfecho I (Confirmação do Atendimento), é obrigatório indicar os termos e condições regulatórios (Art. 10, §2º, I).',
        )
        return
      }

      // ART. 10, §5º: BLOQUEIO ANTES DA CONTRATAÇÃO SE MANIFESTAÇÃO SULGÁS PENDENTE
      // Quando o operador confirmar a aprovação definitiva para contratação
      if (sulgasStatus === 'Pendente' && prontoContratacaoTentado) {
        setErroParecer(
          'BLOQUEIO REGULATÓRIO (Art. 10, §5º): Antes da assinatura do contrato ou conclusão para contratação, é obrigatória a formalização da manifestação da distribuidora estadual (Sulgás). Altere o status da manifestação para "Recebida - Favorável" ou informe as ressalvas.',
        )
        return
      }
    } else if (desfechoTipo === 'APROFUNDAMENTO') {
      if (
        !condicoesAprofundamento.trim() ||
        !escopoAprofundamento.trim() ||
        !cronogramaAprofundamento.trim() ||
        !custosAprofundamento.trim()
      ) {
        setErroParecer(
          'Para o Desfecho II (Aprofundamento), é obrigatório preencher as Condições Necessárias, o Escopo, o Cronograma Previsto e os Custos Estimados (Art. 10, §2º, II).',
        )
        return
      }
    } else if (desfechoTipo === 'NEGATIVA') {
      if (!previsaoDisponibilidade.trim()) {
        setErroParecer(
          'Para o Desfecho III (Negativa), é obrigatório informar por escrito a previsão de quando o serviço estará disponível (Art. 10, §2º, III).',
        )
        return
      }
    }

    setSalvandoStatus(true)
    setErroParecer(null)

    try {
      const atualizado = await solicitacoesService.atualizarDeliberacao({
        id: itemSelecionado.id,
        desfecho_tipo: desfechoTipo,
        status: novoStatus,
        parecer_fundamentado: parecerFundamentado.trim(),
        // I
        termos_condicoes: desfechoTipo === 'CONFIRMACAO' ? termosCondicoes.trim() : undefined,
        // II
        aprofundamento_condicoes:
          desfechoTipo === 'APROFUNDAMENTO' ? condicoesAprofundamento.trim() : undefined,
        aprofundamento_escopo:
          desfechoTipo === 'APROFUNDAMENTO' ? escopoAprofundamento.trim() : undefined,
        aprofundamento_cronograma:
          desfechoTipo === 'APROFUNDAMENTO' ? cronogramaAprofundamento.trim() : undefined,
        aprofundamento_custos:
          desfechoTipo === 'APROFUNDAMENTO' ? custosAprofundamento.trim() : undefined,
        // III
        previsao_disponibilidade:
          desfechoTipo === 'NEGATIVA' ? previsaoDisponibilidade.trim() : undefined,
        // Cópia ANP
        copia_anp_destinatario: copiaAnpDestinatario.trim() || 'acesso.transporte@anp.gov.br',
        // Sulgás
        manifestacao_sulgas_status: sulgasStatus,
        manifestacao_sulgas_data: sulgasData.trim() || undefined,
        manifestacao_sulgas_observacoes: sulgasObs.trim() || undefined,
      })

      setSolicitacoes((prev) => prev.map((s) => (s.id === atualizado.id ? atualizado : s)))

      const avisoAnp =
        desfechoTipo === 'APROFUNDAMENTO' || desfechoTipo === 'NEGATIVA'
          ? ' Cópia regulatória enviada automaticamente à ANP pelo SMTP corporativo (§3º).'
          : ''

      toast({
        title: 'Deliberação e Parecer Concluídos!',
        description: `Protocolo ${atualizado.protocolo}: ${atualizado.status}.${avisoAnp}`,
      })
      setModalAberto(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar a deliberação regulatória.'
      toast({
        title: 'Atenção na atualização',
        description:
          msg.includes('403') || msg.includes('Failed')
            ? 'Regra de segurança da ANP: atualização restrita à administração do sistema.'
            : msg,
        variant: 'destructive',
      })
    } finally {
      setSalvandoStatus(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* CARD PRINCIPAL COM BORDA SUPERIOR AZUL */}
      <Card className="border-t-4 border-t-[#0a2540] border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-[#0a2540]">
              Gestão Interna de Chamados e SLAs
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Controle regulatório de conformidade temporal, deliberações oficiais e pareceres (Art.
              10 da Resolução ANP nº 11/2016)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Badge className="bg-[#dcfce7] text-[#15803d] border border-emerald-300 font-bold hover:bg-[#dcfce7]">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  Operador Autenticado
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[11px] border-slate-300 text-slate-600 hidden sm:inline-flex items-center gap-1"
                >
                  <KeyRound className="h-3 w-3 text-[#0284c7]" />
                  Painel Seguro (2FA Operador)
                </Badge>
              </>
            ) : (
              <Badge className="bg-[#fee2e2] text-[#b91c1c] border border-red-300 font-bold hover:bg-[#fee2e2]">
                <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                Requer Autenticação
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!isAuthenticated ? (
            /* ESTADO NÃO AUTENTICADO */
            <div className="py-10 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#0a2540]">Acesso Restrito às Operações</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A visualização detalhada da fila regulatória, dados de contato e emissão de
                  pareceres fundamentados por escrito requerem autenticação de operador credenciado
                  da TSB, protegendo os dados sob sigilo da LGPD.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/login" state={{ from: { pathname: '/gestao' } }}>
                  <Button className="bg-[#0a2540] hover:bg-[#13395e] text-white text-xs font-semibold px-6 py-2.5">
                    Autenticar Operador TSB
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* ESTADO AUTENTICADO (DASHBOARD) */
            <div className="space-y-6">
              {/* NAVEGAÇÃO POR ABAS NA GESTÃO INTERNA */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setAbaAtiva('solicitacoes')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
                    abaAtiva === 'solicitacoes'
                      ? 'bg-[#0a2540] text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  Fila Inciso VII (SLA 20d)
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-sky-200 text-[#0a2540] font-bold">
                    {solicitacoes.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAbaAtiva('cessoes')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
                    abaAtiva === 'cessoes'
                      ? 'bg-[#0a2540] text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Handshake className="h-4 w-4 text-emerald-400" />
                  Fila Inciso VIII (Cessões)
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200 text-[#0a2540] font-bold">
                    {cessoesInternas.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAbaAtiva('pocc')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
                    abaAtiva === 'pocc'
                      ? 'bg-[#0a2540] text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Scale className="h-4 w-4 text-amber-400" />
                  Condução do Ciclo POCC (Art. 37-A / 38-A)
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-[#0a2540] font-bold">
                    5 Etapas
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAbaAtiva('transparencia')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
                    abaAtiva === 'transparencia'
                      ? 'bg-[#0a2540] text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Layers className="h-4 w-4 text-sky-400" />
                  Editoria de Transparência (Boletim &amp; Plataforma)
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 text-[#0a2540] font-bold">
                    Editável
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAbaAtiva('tarifa')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
                    abaAtiva === 'tarifa'
                      ? 'bg-[#0a2540] text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  Tarifa em Destaque (Página Inicial)
                  {tarifaForm.ativo ? (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-bold">
                      Ativo
                    </span>
                  ) : (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-600 font-bold">
                      Oculto
                    </span>
                  )}
                </button>
              </div>

              {/* ABA 1: FILA DE SOLICITAÇÕES REGULATÓRIAS */}
              {abaAtiva === 'solicitacoes' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Box de aviso sobre os 3 desfechos regulatórios */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileSignature className="h-4 w-4 text-[#0284c7] shrink-0" />
                      <span>
                        <strong>Conformidade Art. 10 (Res. ANP nº 11/2016):</strong> Fila integrada
                        com os 3 desfechos padronizados (I - Confirmação com termos; II -
                        Aprofundamento com escopo/custos; III - Negativa fundamentada com previsão
                        de disponibilidade), cópia automática à ANP (§3º) e checklist de
                        manifestação da Sulgás (§5º).
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 whitespace-nowrap">
                      Operador: {user?.name || user?.email}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <h3 className="text-base font-bold text-[#0a2540] flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#0284c7]" />
                        Fila de Solicitações do Inciso VII (SLA Legal: 20 Dias Úteis)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Sincronização em tempo real das submissões de acesso efetuadas no Portal de
                        Transparência
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={carregarSolicitacoes}
                      disabled={carregando}
                      className="text-xs text-slate-700 h-8 self-start sm:self-auto"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 mr-1.5 ${carregando ? 'animate-spin' : ''}`}
                      />
                      Atualizar Fila
                    </Button>
                  </div>

                  {/* TABELA DE SOLICITAÇÕES COM PONTOS SEPARADOS E DESFECHOS */}
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-[#f1f5f9] text-[#0a2540] font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Protocolo</th>
                          <th className="p-3">Solicitante (Razão / CNPJ)</th>
                          <th className="p-3">Pontos (Recebimento &rarr; Entrega)</th>
                          <th className="p-3">Status / Desfecho</th>
                          <th className="p-3">Sulgás (§5º)</th>
                          <th className="p-3">SLA</th>
                          <th className="p-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {solicitacoes.length > 0 ? (
                          solicitacoes.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-mono font-bold text-[#0a2540]">
                                {item.protocolo}
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-800">
                                  {item.razao_social}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  CNPJ: {item.cnpj} &bull;{' '}
                                  <span
                                    className={
                                      item.modalidade === 'Troca Operacional'
                                        ? 'text-purple-700 font-semibold'
                                        : ''
                                    }
                                  >
                                    {item.modalidade}
                                  </span>{' '}
                                  &bull; {item.capacidade?.toLocaleString('pt-BR')} m³/dia
                                </div>
                                {item.email_solicitante && (
                                  <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5 font-mono">
                                    <Mail className="h-3 w-3 text-sky-600 shrink-0" />
                                    <span>{item.email_solicitante}</span>
                                    {item.telefone_solicitante && (
                                      <span className="text-slate-400">
                                        &bull; {item.telefone_solicitante}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="text-slate-800 font-medium">
                                  {item.ponto_recebimento || 'Paso de Los Libres'} &rarr;{' '}
                                  {item.ponto_entrega || 'Triunfo'}
                                </div>
                                <div className="text-[10px] text-slate-500">{item.trecho}</div>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                    item.status.includes('Confirmação') ||
                                    item.status === 'Aprovada'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : item.status.includes('Negativa') ||
                                          item.status === 'Rejeitada'
                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                        : item.status.includes('Aprofundamento')
                                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}
                                >
                                  {item.status}
                                </span>
                                {item.copia_anp_enviada && (
                                  <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                                    <Send className="h-2.5 w-2.5 text-blue-600" />
                                    Cópia ANP enviada
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    item.manifestacao_sulgas_status === 'Recebida - Favoravel'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : item.manifestacao_sulgas_status ===
                                          'Recebida - Com Ressalvas'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {item.manifestacao_sulgas_status || 'Pendente'}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#dcfce7] text-[#15803d] border border-emerald-300">
                                  {item.sla_dias || 20}d
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <Button
                                  size="sm"
                                  onClick={() => abrirModalAnalise(item)}
                                  className="bg-[#0284c7] hover:bg-[#0369a1] text-white text-[11px] font-semibold h-7 px-2.5"
                                >
                                  Deliberar Parecer
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-slate-500">
                              {carregando
                                ? 'Carregando fila de solicitações...'
                                : 'Nenhuma solicitação encontrada no momento.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ABA 2: EDITORIA DO QUADRO DE TARIFA EM DESTAQUE */}
              {abaAtiva === 'tarifa' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-bold text-[#0a2540]">
                        <DollarSign className="h-4 w-4 text-[#0284c7]" />
                        <span>Gerenciamento do Quadro de Tarifa na Página Inicial</span>
                      </div>
                      <p className="text-slate-600">
                        Edite os valores e textos da tarifa contratual extraordinária exibida na
                        página inicial (/), reproduzindo as diretrizes e resoluções aplicáveis da
                        ANP. O termo &ldquo;ex-impostos&rdquo; será automaticamente formatado em
                        negrito e sublinhado no layout final.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={carregarTarifa}
                      disabled={carregandoTarifa}
                      className="text-xs text-slate-700 h-8 self-start sm:self-auto shrink-0"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 mr-1.5 ${carregandoTarifa ? 'animate-spin' : ''}`}
                      />
                      Recarregar Dados
                    </Button>
                  </div>

                  <form
                    onSubmit={salvarTarifaGestao}
                    className="space-y-5 bg-white border border-slate-200 rounded-lg p-5"
                  >
                    {/* Status Ativo/Inativo */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <Label
                          htmlFor="tarifaAtiva"
                          className="text-xs font-bold text-[#0a2540] block"
                        >
                          Exibir Quadro na Página Inicial
                        </Label>
                        <span className="text-[11px] text-slate-500">
                          Se desativado, o quadro de tarifa será completamente ocultado da página
                          inicial do portal.
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          id="tarifaAtiva"
                          type="checkbox"
                          checked={tarifaForm.ativo}
                          onChange={(e) =>
                            setTarifaForm({ ...tarifaForm, ativo: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0284c7]"></div>
                      </label>
                    </div>

                    {/* Título e Ano */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label
                          htmlFor="tarifaTitulo"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Título Centralizado do Quadro *
                        </Label>
                        <Input
                          id="tarifaTitulo"
                          required
                          value={tarifaForm.titulo}
                          onChange={(e) => setTarifaForm({ ...tarifaForm, titulo: e.target.value })}
                          className="text-xs font-medium"
                          placeholder="Ex: TARIFA CONTRATO EXTRAORDINÁRIO TRECHO T3 – 2026"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="tarifaAno" className="text-xs font-semibold text-slate-700">
                          Ano de Vigência
                        </Label>
                        <Input
                          id="tarifaAno"
                          value={tarifaForm.ano_vigencia || ''}
                          onChange={(e) =>
                            setTarifaForm({ ...tarifaForm, ano_vigencia: e.target.value })
                          }
                          className="text-xs font-medium"
                          placeholder="Ex: 2026"
                        />
                      </div>
                    </div>

                    {/* Texto explicativo */}
                    <div className="space-y-1.5">
                      <Label htmlFor="tarifaTexto" className="text-xs font-semibold text-slate-700">
                        Texto Explicativo da Tarifa (Variação IGP-M / IPCA) *
                      </Label>
                      <Textarea
                        id="tarifaTexto"
                        required
                        rows={2}
                        value={tarifaForm.texto_explicativo}
                        onChange={(e) =>
                          setTarifaForm({ ...tarifaForm, texto_explicativo: e.target.value })
                        }
                        className="text-xs"
                        placeholder="Tarifa ex-impostos para 2026, considerando a variação de -1,05% do IGP-M de 2025 (55%) e de 4,26% do IPCA de 2025 (45%):"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Nota: A expressão &ldquo;ex-impostos&rdquo; será automaticamente destacada
                        em um chip visual harmonioso no card.
                      </span>
                    </div>

                    {/* Valores Principais */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <span className="text-xs font-bold text-[#0a2540] block">
                        Valores Globais do Contrato
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="tarifaMilM3"
                            className="text-xs font-semibold text-slate-700"
                          >
                            Valor Principal da Tarifa (R$/Mil m³) *
                          </Label>
                          <Input
                            id="tarifaMilM3"
                            required
                            value={tarifaForm.valor_mil_m3}
                            onChange={(e) =>
                              setTarifaForm({ ...tarifaForm, valor_mil_m3: e.target.value })
                            }
                            className="text-xs font-bold text-[#0a2540] bg-white"
                            placeholder="59,1750"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="tarifaMmbtu"
                            className="text-xs font-semibold text-slate-700"
                          >
                            Correspondência em R$/MM Btu *
                          </Label>
                          <Input
                            id="tarifaMmbtu"
                            required
                            value={tarifaForm.valor_mmbtu}
                            onChange={(e) =>
                              setTarifaForm({ ...tarifaForm, valor_mmbtu: e.target.value })
                            }
                            className="text-xs font-semibold bg-white"
                            placeholder="1,5864"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Linha 70% Entrada */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <span className="text-xs font-bold text-[#0a2540] block">
                        Parcela de Entrada (Ponto de Injeção)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="entradaPerc"
                            className="text-[11px] font-semibold text-slate-700"
                          >
                            Identificação / Percentual *
                          </Label>
                          <Input
                            id="entradaPerc"
                            required
                            value={tarifaForm.entrada_percentual}
                            onChange={(e) =>
                              setTarifaForm({ ...tarifaForm, entrada_percentual: e.target.value })
                            }
                            className="h-8 text-xs bg-white"
                            placeholder="70% Entrada"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label
                            htmlFor="entradaMmbtu"
                            className="text-[11px] font-semibold text-slate-700"
                          >
                            Valor R$/MM Btu *
                          </Label>
                          <Input
                            id="entradaMmbtu"
                            required
                            value={tarifaForm.entrada_valor_mmbtu}
                            onChange={(e) =>
                              setTarifaForm({ ...tarifaForm, entrada_valor_mmbtu: e.target.value })
                            }
                            className="h-8 text-xs bg-white"
                            placeholder="1,1089"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label
                            htmlFor="entradaMilM3"
                            className="text-[11px] font-semibold text-slate-700"
                          >
                            Valor R$/Mil m³ *
                          </Label>
                          <Input
                            id="entradaMilM3"
                            required
                            value={tarifaForm.entrada_valor_mil_m3}
                            onChange={(e) =>
                              setTarifaForm({ ...tarifaForm, entrada_valor_mil_m3: e.target.value })
                            }
                            className="h-8 text-xs bg-white"
                            placeholder="41,3628"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Linha 30% Saída */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <span className="text-xs font-bold text-[#0a2540] block">
                        Parcela de Saída (Ponto de Retirada)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="saidaPerc"
                            className="text-[11px] font-semibold text-slate-700"
                          >
                            Identificação / Percentual *
                          </Label>
                          <Input
                            id="saidaPerc"
                            required
                            value={tarifaForm.saida_percentual}
                            onChange={(e) =>
                              setTarifaForm({ ...tarifaForm, saida_percentual: e.target.value })
                            }
                            className="h-8 text-xs bg-white"
                            placeholder="30% Saída"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label
                            htmlFor="saidaMmbtu"
                            className="text-[11px] font-semibold text-slate-700"
                          >
                            Valor R$/MM Btu *
                          </Label>
                          <Input
                            id="saidaMmbtu"
                            required
                            value={tarifaForm.saida_valor_mmbtu}
                            onChange={(e) =>
                              setTarifaForm({ ...tarifaForm, saida_valor_mmbtu: e.target.value })
                            }
                            className="h-8 text-xs bg-white"
                            placeholder="0,4775"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label
                            htmlFor="saidaMilM3"
                            className="text-[11px] font-semibold text-slate-700"
                          >
                            Valor R$/Mil m³ *
                          </Label>
                          <Input
                            id="saidaMilM3"
                            required
                            value={tarifaForm.saida_valor_mil_m3}
                            onChange={(e) =>
                              setTarifaForm({ ...tarifaForm, saida_valor_mil_m3: e.target.value })
                            }
                            className="h-8 text-xs bg-white"
                            placeholder="17,8122"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pré-visualização do quadro em tempo real */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Eye className="h-4 w-4 text-[#0284c7]" />
                        <span>
                          Pré-visualização do Quadro (Exatamente como aparecerá na Página Inicial):
                        </span>
                      </div>
                      <div className="p-4 bg-slate-100 rounded-lg">
                        <QuadroTarifaDestaque tarifa={tarifaForm} />
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setTarifaForm(TARIFA_SEED_FALLBACK)}
                        className="text-xs"
                      >
                        Restaurar Valores Padrão (2026)
                      </Button>
                      <Button
                        type="submit"
                        disabled={salvandoTarifa}
                        className="bg-[#0a2540] hover:bg-[#13395e] text-white text-xs font-semibold px-5"
                      >
                        {salvandoTarifa ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Salvando no Banco...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Alterações da Tarifa
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* ABA DE CESSÕES DO INCISO VIII (MODELO MISTO: RECEBER PDF -> CADASTRAR -> PUBLICAR) */}
              {abaAtiva === 'cessoes' && (
                <div className="space-y-6 animate-fade-in">
                  {/* CARD DE CONTROLE E FLUXO MISTO */}
                  <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-lg text-xs text-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-bold text-[#0a2540]">
                          <Handshake className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm">
                            Fila de Gestão do Inciso VIII (Modelo Misto: PDF &rarr; Publicação
                            Automatizada)
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed max-w-3xl">
                          Fluxo seguro aprovado: Carregadores baixam o formulário oficial em PDF no
                          portal, assinam e enviam por e-mail. A equipe TSB confere a conformidade,
                          anexa o PDF assinado e decide quando publicar a oferta no resumo público.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          onClick={abrirModalNovaCessao}
                          className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold h-8 shadow-xs inline-flex items-center gap-1.5"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          Cadastrar Oferta do PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={carregarCessoesInternas}
                          disabled={carregandoCessoesInternas}
                          className="text-xs text-slate-700 h-8 bg-white"
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 mr-1.5 ${carregandoCessoesInternas ? 'animate-spin' : ''}`}
                          />
                          Atualizar
                        </Button>
                      </div>
                    </div>

                    {/* CANAL OFICIAL EDITÁVEL PARA RECEBIMENTO DE CESSÕES */}
                    <div className="pt-2 border-t border-emerald-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-[#0284c7]" />
                        <span className="font-semibold text-slate-700">
                          Canal de E-mail de Recebimento TSB:
                        </span>
                        {!editandoEmailRecebimento ? (
                          <span className="font-mono font-bold text-[#0a2540] bg-white px-2 py-0.5 rounded border border-slate-200">
                            {emailRecebimentoCessoes}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Input
                              type="email"
                              value={novoEmailRecebimento}
                              onChange={(e) => setNovoEmailRecebimento(e.target.value)}
                              className="h-7 text-xs w-56 bg-white font-mono"
                            />
                            <Button
                              size="sm"
                              onClick={salvarNovoEmailRecebimento}
                              disabled={salvandoEmailRecebimento}
                              className="h-7 px-2.5 text-xs bg-[#0a2540] text-white"
                            >
                              {salvandoEmailRecebimento ? 'Salvando...' : 'Salvar'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setNovoEmailRecebimento(emailRecebimentoCessoes)
                                setEditandoEmailRecebimento(false)
                              }}
                              className="h-7 px-2 text-xs"
                            >
                              Cancelar
                            </Button>
                          </div>
                        )}
                        {!editandoEmailRecebimento && (
                          <button
                            type="button"
                            onClick={() => setEditandoEmailRecebimento(true)}
                            className="text-[11px] text-[#0284c7] hover:underline font-semibold ml-1"
                          >
                            (Editar Canal)
                          </button>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>
                          Contatos &amp; Documentos visíveis apenas para operadores autenticados
                          (LGPD)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TABELA COMPLETA DE CESSÕES INTERNAS */}
                  <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-[#f1f5f9] text-[#0a2540] font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Ref / ID</th>
                          <th className="p-3">Cedente &amp; CNPJ</th>
                          <th className="p-3">Trecho / Instalação</th>
                          <th className="p-3 text-right">Capacidade Ociosa</th>
                          <th className="p-3">Período</th>
                          <th className="p-3">Contato Comercial (LGPD)</th>
                          <th className="p-3 text-center">Arquivo PDF</th>
                          <th className="p-3 text-center">Visibilidade</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {cessoesInternas.length > 0 ? (
                          cessoesInternas.map((cessao) => {
                            const isPublicada = cessao.publicada !== false
                            const urlPdf = cessoesService.obterUrlArquivo(cessao)

                            return (
                              <tr key={cessao.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-mono font-bold text-[#0a2540]">
                                  CES-{cessao.id.substring(0, 8).toUpperCase()}
                                  {cessao.operador_cadastro && (
                                    <div className="text-[9px] text-slate-400 font-normal">
                                      Op: {cessao.operador_cadastro}
                                    </div>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="font-semibold text-slate-800">
                                    {cessao.cedente}
                                  </div>
                                  {cessao.cnpj && (
                                    <div className="text-[10px] font-mono text-slate-500">
                                      CNPJ: {cessao.cnpj}
                                    </div>
                                  )}
                                  {cessao.representante_legal && (
                                    <div className="text-[10px] text-slate-500">
                                      Rep: {cessao.representante_legal}
                                    </div>
                                  )}
                                  {cessao.modalidade && (
                                    <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-medium">
                                      {cessao.modalidade}
                                    </span>
                                  )}
                                  {cessao.observacoes && (
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                      {cessao.observacoes}
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 text-slate-700">
                                  <div className="font-medium">{cessao.trecho}</div>
                                  {(cessao.ponto_recebimento || cessao.ponto_entrega) && (
                                    <div className="text-[10px] text-slate-500">
                                      {cessao.ponto_recebimento || 'Recebimento Conforme Contrato'}{' '}
                                      &rarr; {cessao.ponto_entrega || 'Entrega Conforme Contrato'}
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-slate-900">
                                  {cessao.capacidade_ociosa.toLocaleString('pt-BR')} m³/dia
                                </td>
                                <td className="p-3 text-slate-700">{cessao.periodo_contratual}</td>
                                <td className="p-3">
                                  <div className="font-mono text-xs text-blue-700 font-medium flex items-center gap-1">
                                    <Mail className="h-3 w-3 text-blue-500 shrink-0" />
                                    <a
                                      href={`mailto:${cessao.contato}`}
                                      className="hover:underline"
                                    >
                                      {cessao.contato}
                                    </a>
                                  </div>
                                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 mt-0.5">
                                    <ShieldCheck className="h-2.5 w-2.5" /> Protegido LGPD
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  {urlPdf ? (
                                    <a
                                      href={urlPdf}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-sky-50 text-[#0284c7] hover:bg-sky-100 font-semibold text-[11px] border border-sky-200"
                                      title="Abrir PDF assinado recebido"
                                    >
                                      <FileText className="h-3 w-3" />
                                      Ver PDF
                                    </a>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">
                                      Sem anexo
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAlternarPublicada(cessao)}
                                    className={`h-7 px-2.5 text-[11px] font-semibold border ${
                                      isPublicada
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                        : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                                    }`}
                                    title={
                                      isPublicada
                                        ? 'Clique para ocultar do portal público'
                                        : 'Clique para publicar no portal público'
                                    }
                                  >
                                    {isPublicada ? (
                                      <>
                                        <Eye className="h-3 w-3 mr-1 text-emerald-600" />
                                        Publicada
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff className="h-3 w-3 mr-1 text-amber-600" />
                                        Oculta
                                      </>
                                    )}
                                  </Button>
                                </td>
                                <td className="p-3 text-center">
                                  <select
                                    value={cessao.status || 'Disponível'}
                                    onChange={async (e) => {
                                      const novoSt = e.target.value as
                                        | 'Disponível'
                                        | 'Em Negociação'
                                        | 'Concluída'
                                        | 'Cancelada'
                                      try {
                                        await cessoesService.atualizarStatus(cessao.id, novoSt)
                                        toast({
                                          title: 'Status da Cessão Atualizado',
                                          description: `Oferta CES-${cessao.id.substring(0, 8).toUpperCase()} alterada para "${novoSt}".`,
                                        })
                                        carregarCessoesInternas()
                                      } catch {
                                        toast({
                                          title: 'Erro ao alterar status',
                                          description: 'Não foi possível atualizar a cessão.',
                                          variant: 'destructive',
                                        })
                                      }
                                    }}
                                    className="h-7 text-[11px] rounded border border-slate-300 bg-white px-2 text-slate-700 font-medium"
                                  >
                                    <option value="Disponível">Disponível</option>
                                    <option value="Em Negociação">Em Negociação</option>
                                    <option value="Concluída">Concluída</option>
                                    <option value="Cancelada">Cancelada</option>
                                  </select>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => abrirModalEditarCessao(cessao)}
                                      className="h-7 px-2 text-slate-700 hover:text-slate-900"
                                      title="Editar dados da oferta"
                                    >
                                      <FileSignature className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleExcluirCessao(cessao)}
                                      className="h-7 px-2 text-red-600 hover:text-red-800 hover:bg-red-50"
                                      title="Excluir oferta"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                        ) : (
                          <tr>
                            <td colSpan={10} className="p-8 text-center text-slate-500">
                              {carregandoCessoesInternas ? (
                                <div className="flex items-center justify-center gap-2">
                                  <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                                  <span>Carregando ofertas de cessão...</span>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <p className="font-semibold text-slate-700">
                                    Nenhuma oferta de cessão cadastrada.
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Ao receber o formulário em PDF assinado por e-mail, clique em
                                    &quot;Cadastrar Oferta do PDF&quot; para inserir e publicar.
                                  </p>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ABA 2: CONDUÇÃO DO CICLO POCC (ARTS. 37-A E 38-A) */}
              {abaAtiva === 'pocc' && <ConducaoCicloPOCC />}

              {/* ABA 3: EDITORIA DE TRANSPARÊNCIA (BOLETIM E PLATAFORMA) */}
              {abaAtiva === 'transparencia' && <EditoriaTransparencia />}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL CADASTRO / EDIÇÃO DE OFERTA DE CESSÃO A PARTIR DE FORMULÁRIO PDF (MODELO MISTO) */}
      {modalCessaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 relative max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setModalCessaoAberto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 text-[#0a1d37]">
              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-700">
                <FileSignature className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {cessaoEmEdicao ? 'Editar Oferta de Cessão' : 'Cadastrar Oferta a partir de PDF'}
                </h3>
                <p className="text-xs text-slate-500">
                  Resolução ANP nº 11/2016, Art. 9º, VIII e Art. 10 • Modelo Misto TSB
                </p>
              </div>
            </div>

            {erroFormCessaoInterna && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{erroFormCessaoInterna}</span>
              </div>
            )}

            <form onSubmit={salvarCessaoInterna} className="space-y-4 text-xs">
              {/* 1. DADOS CADASTRAIS DO CEDENTE */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="font-bold text-[#0a1d37] flex items-center gap-1.5 text-xs">
                  <UserCheck className="h-4 w-4 text-[#0284c7]" />
                  <span>1. Identificação do Carregador Cedente (Conforme PDF Assinado)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="cedenteNome"
                      className="text-[11px] font-semibold text-slate-700"
                    >
                      Razão Social do Cedente *
                    </Label>
                    <Input
                      id="cedenteNome"
                      required
                      placeholder="Ex: Petrobras S.A. ou Carregador Alfa Ltda."
                      value={formCessaoInterna.cedente}
                      onChange={(e) =>
                        setFormCessaoInterna({ ...formCessaoInterna, cedente: e.target.value })
                      }
                      className="bg-white h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="cedenteCnpj"
                      className="text-[11px] font-semibold text-slate-700"
                    >
                      CNPJ do Cedente
                    </Label>
                    <Input
                      id="cedenteCnpj"
                      placeholder="00.000.000/0000-00"
                      value={formCessaoInterna.cnpj}
                      onChange={(e) =>
                        setFormCessaoInterna({ ...formCessaoInterna, cnpj: e.target.value })
                      }
                      className="bg-white h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="cedenteRep"
                      className="text-[11px] font-semibold text-slate-700"
                    >
                      Representante Legal / Signatário
                    </Label>
                    <Input
                      id="cedenteRep"
                      placeholder="Nome completo do signatário do PDF"
                      value={formCessaoInterna.representante_legal}
                      onChange={(e) =>
                        setFormCessaoInterna({
                          ...formCessaoInterna,
                          representante_legal: e.target.value,
                        })
                      }
                      className="bg-white h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="cedenteContato"
                      className="text-[11px] font-semibold text-slate-700 flex items-center justify-between"
                    >
                      <span>E-mail / Contato Comercial *</span>
                      <span className="text-[10px] text-emerald-700 font-bold">Sigilo LGPD</span>
                    </Label>
                    <Input
                      id="cedenteContato"
                      required
                      placeholder="comercial@carregador.com.br"
                      value={formCessaoInterna.contato}
                      onChange={(e) =>
                        setFormCessaoInterna({ ...formCessaoInterna, contato: e.target.value })
                      }
                      className="bg-white h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 2. DADOS TÉCNICOS DA CAPACIDADE (ART. 10) */}
              <div className="p-3.5 bg-blue-50/50 rounded-lg border border-blue-200/80 space-y-3">
                <div className="font-bold text-[#0a1d37] flex items-center gap-1.5 text-xs">
                  <Layers className="h-4 w-4 text-[#1b4d96]" />
                  <span>2. Dados Operacionais da Oferta (Art. 10 da Res. ANP nº 11/2016)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="cessaoModalidade"
                      className="text-[11px] font-semibold text-slate-700"
                    >
                      Modalidade de Serviço *
                    </Label>
                    <select
                      id="cessaoModalidade"
                      value={formCessaoInterna.modalidade}
                      onChange={(e) =>
                        setFormCessaoInterna({ ...formCessaoInterna, modalidade: e.target.value })
                      }
                      className="w-full h-8 px-2.5 rounded border border-slate-300 text-xs bg-white text-slate-800"
                    >
                      <option value="Firme Ordinário">Firme Ordinário</option>
                      <option value="Interruptível">Interruptível</option>
                      <option value="Extraordinário">Extraordinário</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="cessaoCapacidade"
                      className="text-[11px] font-semibold text-slate-700"
                    >
                      Capacidade Ociosa (m³/dia) *
                    </Label>
                    <Input
                      id="cessaoCapacidade"
                      type="number"
                      min="1"
                      required
                      placeholder="Ex: 25000"
                      value={formCessaoInterna.capacidade_ociosa}
                      onChange={(e) =>
                        setFormCessaoInterna({
                          ...formCessaoInterna,
                          capacidade_ociosa: e.target.value,
                        })
                      }
                      className="bg-white h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="cessaoTrecho"
                      className="text-[11px] font-semibold text-slate-700"
                    >
                      Trecho do Gasoduto *
                    </Label>
                    <select
                      id="cessaoTrecho"
                      value={formCessaoInterna.trecho}
                      onChange={(e) =>
                        setFormCessaoInterna({ ...formCessaoInterna, trecho: e.target.value })
                      }
                      className="w-full h-8 px-2.5 rounded border border-slate-300 text-xs bg-white text-slate-800"
                    >
                      <option value="Uruguaiana -> Triunfo">Uruguaiana -&gt; Triunfo</option>
                      <option value="EMED Triunfo -> Polo Petroquímico">
                        EMED Triunfo -&gt; Polo Petroquímico
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="cessaoPontoRec"
                      className="text-[11px] font-semibold text-slate-700"
                    >
                      Ponto de Recebimento (Injeção)
                    </Label>
                    <Input
                      id="cessaoPontoRec"
                      placeholder="Ex: Paso de Los Libres (RS)"
                      value={formCessaoInterna.ponto_recebimento}
                      onChange={(e) =>
                        setFormCessaoInterna({
                          ...formCessaoInterna,
                          ponto_recebimento: e.target.value,
                        })
                      }
                      className="bg-white h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="cessaoPontoEnt"
                      className="text-[11px] font-semibold text-slate-700"
                    >
                      Ponto de Entrega (Retirada)
                    </Label>
                    <Input
                      id="cessaoPontoEnt"
                      placeholder="Ex: Triunfo - Polo Petroquímico (RS)"
                      value={formCessaoInterna.ponto_entrega}
                      onChange={(e) =>
                        setFormCessaoInterna({
                          ...formCessaoInterna,
                          ponto_entrega: e.target.value,
                        })
                      }
                      className="bg-white h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="cessaoPeriodo"
                    className="text-[11px] font-semibold text-slate-700"
                  >
                    Período Contratual Ofertado *
                  </Label>
                  <Input
                    id="cessaoPeriodo"
                    required
                    placeholder="Ex: Nov/2026 a Fev/2027 ou 01/11/2026 a 28/02/2027"
                    value={formCessaoInterna.periodo_contratual}
                    onChange={(e) =>
                      setFormCessaoInterna({
                        ...formCessaoInterna,
                        periodo_contratual: e.target.value,
                      })
                    }
                    className="bg-white h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cessaoObs" className="text-[11px] font-semibold text-slate-700">
                    Observações e Condições Operacionais Relevantes
                  </Label>
                  <Textarea
                    id="cessaoObs"
                    rows={2}
                    placeholder="Ex: Cessão total ou parcial divisível. Sem restrições sazonais de pressão."
                    value={formCessaoInterna.observacoes}
                    onChange={(e) =>
                      setFormCessaoInterna({ ...formCessaoInterna, observacoes: e.target.value })
                    }
                    className="bg-white text-xs resize-y"
                  />
                </div>
              </div>

              {/* 3. UPLOAD DO PDF ASSINADO RECEBIDO + STATUS DE PUBLICAÇÃO */}
              <div className="p-3.5 bg-amber-50/50 rounded-lg border border-amber-200 space-y-3">
                <div className="font-bold text-[#0a1d37] flex items-center gap-1.5 text-xs">
                  <FileText className="h-4 w-4 text-amber-600" />
                  <span>3. Anexo do Formulário em PDF &amp; Visibilidade Pública</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="uploadPdfCessao"
                      className="text-[11px] font-semibold text-slate-700"
                    >
                      Anexar PDF Assinado Recebido (até 50 MB, sigilo interno)
                    </Label>
                    <Input
                      id="uploadPdfCessao"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setArquivoPdfUpload(file)
                      }}
                      className="bg-white h-8 text-xs file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-slate-100 file:text-slate-700 cursor-pointer"
                    />
                    {cessaoEmEdicao?.arquivo_formulario && !arquivoPdfUpload && (
                      <span className="text-[10px] text-emerald-700 block mt-0.5">
                        PDF já anexado no cadastro ({cessaoEmEdicao.arquivo_formulario}). Selecione
                        outro apenas se desejar substituir.
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="statusOpCessao"
                      className="text-[11px] font-semibold text-slate-700"
                    >
                      Status Operacional da Oferta
                    </Label>
                    <select
                      id="statusOpCessao"
                      value={formCessaoInterna.status}
                      onChange={(e) =>
                        setFormCessaoInterna({
                          ...formCessaoInterna,
                          status: e.target.value as
                            | 'Disponível'
                            | 'Em Negociação'
                            | 'Concluída'
                            | 'Cancelada',
                        })
                      }
                      className="w-full h-8 px-2.5 rounded border border-slate-300 text-xs bg-white text-slate-800"
                    >
                      <option value="Disponível">Disponível</option>
                      <option value="Em Negociação">Em Negociação</option>
                      <option value="Concluída">Concluída</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>

                {/* BOTÃO/TOGGLE PUBLICADA */}
                <div className="pt-2 flex items-center justify-between p-2.5 bg-white rounded border border-slate-200">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      {formCessaoInterna.publicada ? (
                        <Eye className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-amber-600" />
                      )}
                      <span>Publicar imediatamente na tabela pública do Portal?</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {formCessaoInterna.publicada
                        ? 'Sim, a oferta aparecerá na tabela pública do Inciso VIII (somente dados operacionais).'
                        : 'Não, manter salva como rascunho interno oculto até confirmação técnica.'}
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formCessaoInterna.publicada}
                      onChange={(e) =>
                        setFormCessaoInterna({
                          ...formCessaoInterna,
                          publicada: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* BOTÕES DE SUBMISSÃO */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalCessaoAberto(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={salvandoCessao}
                  className="bg-[#0a1d37] hover:bg-[#143b73] text-white text-xs font-semibold px-5"
                >
                  {salvandoCessao ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Salvando Oferta...
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4 mr-1.5" />
                      {cessaoEmEdicao ? 'Salvar Alterações' : 'Cadastrar e Publicar Oferta'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALHES E DELIBERAÇÃO COM OS 3 DESFECHOS OFICIAIS (ART. 10, §2º) */}
      {modalAberto && itemSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 relative max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 text-[#0a2540]">
              <div className="p-2 bg-sky-50 rounded-full text-[#0284c7]">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Deliberação Regulatória Oficial (Art. 10)</h3>
                <p className="text-xs text-slate-500 font-mono">
                  Protocolo: {itemSelecionado.protocolo} &bull; Resolução ANP nº 11/2016
                </p>
              </div>
            </div>

            {/* DADOS CADASTRAIS DA SOLICITAÇÃO (ART. 10, IV) */}
            <div className="p-4 bg-slate-50 rounded-lg border text-xs text-slate-700 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Razão Social:</span>
                  <strong className="text-slate-900">{itemSelecionado.razao_social}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">CNPJ:</span>
                  <strong className="font-mono text-slate-900">{itemSelecionado.cnpj}</strong>
                </div>
              </div>

              {/* DADOS DE CONTATO E REPRESENTANTE (EXCLUSIVOS DO AMBIENTE AUTENTICADO - LGPD) */}
              <div className="p-2.5 bg-blue-50/70 rounded border border-blue-200 mt-1">
                <span className="text-blue-900 font-bold block mb-1 text-[11px] flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-blue-700" />
                  Contato do Solicitante / Representante Legal (Restrito - LGPD):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">E-mail Cadastrado:</span>
                    <strong className="text-[#0a2540] font-mono">
                      {itemSelecionado.email_solicitante || 'Não informado'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Telefone:</span>
                    <strong className="text-[#0a2540]">
                      {itemSelecionado.telefone_solicitante || 'Não informado'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Ponto de Recebimento (Injeção):</span>
                  <strong className="text-emerald-900 font-semibold">
                    {itemSelecionado.ponto_recebimento || 'Paso de Los Libres'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Ponto de Entrega (Retirada):</span>
                  <strong className="text-blue-900 font-semibold">
                    {itemSelecionado.ponto_entrega || 'Triunfo (Polo Petroquímico)'}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-500 block">Modalidade:</span>
                  <strong className="text-slate-900">{itemSelecionado.modalidade}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Capacidade Solicitada:</span>
                  <strong className="font-mono text-slate-900">
                    {itemSelecionado.capacidade?.toLocaleString('pt-BR')} m³/dia
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Instalação / Trecho:</span>
                  <strong className="text-slate-900">{itemSelecionado.trecho}</strong>
                </div>
              </div>

              {/* Se for Swap, exibe garantias do §1º */}
              {itemSelecionado.garantias_seguranca_swap && (
                <div className="p-2.5 bg-purple-50 rounded border border-purple-200 mt-1">
                  <span className="text-purple-900 font-bold block mb-0.5">
                    Garantias de Segurança e Confiabilidade (Swap - Art. 10, §1º):
                  </span>
                  <p className="text-purple-950 italic">
                    &quot;{itemSelecionado.garantias_seguranca_swap}&quot;
                  </p>
                </div>
              )}
            </div>

            {/* SELEÇÃO DOS 3 DESFECHOS OFICIAIS (ART. 10, §2º) */}
            <div className="space-y-2 pt-2">
              <Label className="text-xs font-bold text-slate-800 block">
                Escolha o Desfecho Oficial da Análise Técnica (Art. 10, §2º da Res. ANP 11/2016):
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleMudarDesfecho('CONFIRMACAO')}
                  className={`p-3 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    desfechoTipo === 'CONFIRMACAO'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Desfecho I</span>
                  </div>
                  <div className="font-semibold">Confirmação</div>
                  <div className="text-[10px] font-normal text-slate-500 mt-1">
                    Atendimento integral com termos e condições.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleMudarDesfecho('APROFUNDAMENTO')}
                  className={`p-3 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    desfechoTipo === 'APROFUNDAMENTO'
                      ? 'border-sky-600 bg-sky-50 text-sky-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-sky-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>Desfecho II</span>
                  </div>
                  <div className="font-semibold">Aprofundamento</div>
                  <div className="text-[10px] font-normal text-slate-500 mt-1">
                    Depende de estudos, escopo, cronograma e custos.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleMudarDesfecho('NEGATIVA')}
                  className={`p-3 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    desfechoTipo === 'NEGATIVA'
                      ? 'border-red-600 bg-red-50 text-red-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-red-700">
                    <X className="h-4 w-4" />
                    <span>Desfecho III</span>
                  </div>
                  <div className="font-semibold">Negativa</div>
                  <div className="text-[10px] font-normal text-slate-500 mt-1">
                    Recusa fundamentada com previsão de disponibilidade.
                  </div>
                </button>
              </div>
            </div>

            {/* CAMPOS ESPECÍFICOS CONFORME O DESFECHO SELECIONADO */}
            {/* DESFECHO I: TERMOS E CONDIÇÕES */}
            {desfechoTipo === 'CONFIRMACAO' && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2 animate-fade-in text-xs">
                <Label htmlFor="termosCondicoes" className="font-bold text-emerald-950">
                  Termos e Condições do Atendimento (Art. 10, §2º, I) *
                </Label>
                <Textarea
                  id="termosCondicoes"
                  required
                  rows={2}
                  placeholder="Especifique as condições operacionais, pressão mínima e máxima de entrega, programação e tarifa regulatória..."
                  value={termosCondicoes}
                  onChange={(e) => setTermosCondicoes(e.target.value)}
                  className="bg-white text-xs"
                />
              </div>
            )}

            {/* DESFECHO II: 4 ELEMENTOS OBRIGATÓRIOS DO APROFUNDAMENTO DA ANÁLISE */}
            {desfechoTipo === 'APROFUNDAMENTO' && (
              <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-lg space-y-3 animate-fade-in text-xs">
                <span className="font-bold text-sky-950 block">
                  Exigências do Aprofundamento da Análise (Art. 10, §2º, II):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="condicoesAprof"
                      className="text-[11px] font-semibold text-slate-700"
                    >
                      1. Condições Necessárias *
                    </Label>
                    <Input
                      id="condicoesAprof"
                      required
                      placeholder="Ex: Reforço nas válvulas reguladoras da EMED"
                      value={condicoesAprofundamento}
                      onChange={(e) => setCondicoesAprofundamento(e.target.value)}
                      className="bg-white text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="escopoAprof"
                      className="text-[11px] font-semibold text-slate-700"
                    >
                      2. Escopo dos Estudos *
                    </Label>
                    <Input
                      id="escopoAprof"
                      required
                      placeholder="Ex: Simulação termo-hidráulica em regime transiente"
                      value={escopoAprofundamento}
                      onChange={(e) => setEscopoAprofundamento(e.target.value)}
                      className="bg-white text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="cronogramaAprof"
                      className="text-[11px] font-semibold text-slate-700"
                    >
                      3. Cronograma Previsto *
                    </Label>
                    <Input
                      id="cronogramaAprof"
                      required
                      placeholder="Ex: 45 dias úteis a partir do aceite"
                      value={cronogramaAprofundamento}
                      onChange={(e) => setCronogramaAprofundamento(e.target.value)}
                      className="bg-white text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="custosAprof"
                      className="text-[11px] font-semibold text-slate-700"
                    >
                      4. Custos Estimados *
                    </Label>
                    <Input
                      id="custosAprof"
                      required
                      placeholder="Ex: R$ 38.000,00 (conforme tabela TSB)"
                      value={custosAprofundamento}
                      onChange={(e) => setCustosAprofundamento(e.target.value)}
                      className="bg-white text-xs h-8"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* DESFECHO III: NEGATIVA COM PREVISÃO DE DISPONIBILIDADE */}
            {desfechoTipo === 'NEGATIVA' && (
              <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-lg space-y-2 animate-fade-in text-xs">
                <Label htmlFor="prevDisponibilidade" className="font-bold text-red-950">
                  Previsão de Quando o Serviço Estará Disponível (Art. 10, §2º, III) *
                </Label>
                <Input
                  id="prevDisponibilidade"
                  required
                  placeholder="Ex: Previsão no ciclo de oferta pública do 2º semestre de 2027 ou expansão do Trecho 2..."
                  value={previsaoDisponibilidade}
                  onChange={(e) => setPrevisaoDisponibilidade(e.target.value)}
                  className="bg-white text-xs"
                />
              </div>
            )}

            {/* PARECER TÉCNICO FUNDAMENTADO POR ESCRITO (OBRIGATÓRIO PARA TODOS OS CASOS - ART. 10) */}
            <div className="space-y-1.5">
              <Label
                htmlFor="parecerTexto"
                className="text-xs font-semibold text-slate-700 flex items-center justify-between"
              >
                <span>Parecer Técnico-Regulatório Fundamentado por Escrito (Art. 10) *</span>
                <span className="text-[10px] text-amber-700 font-normal">
                  Visível na consulta pública por protocolo (sem dados pessoais)
                </span>
              </Label>
              <Textarea
                id="parecerTexto"
                required
                rows={3}
                placeholder="Insira a fundamentação técnica e operacional detalhada da TSB..."
                value={parecerFundamentado}
                onChange={(e) => setParecerFundamentado(e.target.value)}
                className="text-xs bg-white resize-y"
              />
            </div>

            {/* ART. 10, §3º: CÓPIA AUTOMÁTICA À ANP (QUANDO DESFECHO II OU III) */}
            {(desfechoTipo === 'APROFUNDAMENTO' || desfechoTipo === 'NEGATIVA') && (
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg space-y-1.5 text-xs text-blue-950 animate-fade-in">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <Send className="h-4 w-4 text-blue-700" />
                  <span>Cópia Oficial à ANP (Art. 10, §3º)</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Conforme exigência do §3º, a TSB encaminhará automaticamente cópia integral desta
                  decisão à ANP via SMTP corporativo (<code>site@tsb.com.br</code>) com registro nos
                  logs.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Label
                    htmlFor="anpDest"
                    className="text-[11px] font-semibold text-blue-900 shrink-0"
                  >
                    Destinatário ANP:
                  </Label>
                  <Input
                    id="anpDest"
                    value={copiaAnpDestinatario}
                    onChange={(e) => setCopiaAnpDestinatario(e.target.value)}
                    className="h-7 text-xs bg-white"
                  />
                </div>
              </div>
            )}

            {/* ART. 10, §5º: CHECKLIST DE MANIFESTAÇÃO DA SULGÁS (DISTRIBUIDORA ESTADUAL) */}
            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-lg space-y-2.5 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <Building2 className="h-4 w-4 text-amber-700" />
                  <span>Manifestação da Concessionária Estadual - Sulgás (Art. 10, §5º)</span>
                </div>
                <Badge
                  className={`text-[10px] ${
                    sulgasStatus === 'Recebida - Favoravel'
                      ? 'bg-emerald-600 text-white'
                      : sulgasStatus === 'Recebida - Com Ressalvas'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-500 text-white'
                  }`}
                >
                  {sulgasStatus}
                </Badge>
              </div>

              <p className="text-[11px] text-amber-900 leading-relaxed">
                Antes da celebração do contrato de transporte (Art. 10, §5º), deve ser registrada a
                manifestação da Sulgás sobre a solicitação aprovada. A aprovação não pode avançar
                para contratação sem essa manifestação formal.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label
                    htmlFor="sulgasStatus"
                    className="text-[11px] font-semibold text-slate-700"
                  >
                    Status da Manifestação da Sulgás *
                  </Label>
                  <select
                    id="sulgasStatus"
                    value={sulgasStatus}
                    onChange={(e) => setSulgasStatus(e.target.value as ManifestacaoSulgasStatus)}
                    className="w-full h-8 px-2.5 rounded border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Pendente">Pendente de Resposta da Sulgás</option>
                    <option value="Recebida - Favoravel">Recebida - Favorável sem Ressalvas</option>
                    <option value="Recebida - Com Ressalvas">
                      Recebida - Com Ressalvas Técnicas
                    </option>
                    <option value="Nao Aplicavel">Não Aplicável</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sulgasData" className="text-[11px] font-semibold text-slate-700">
                    Data da Manifestação / Protocolo Sulgás
                  </Label>
                  <Input
                    id="sulgasData"
                    type="date"
                    value={sulgasData}
                    onChange={(e) => setSulgasData(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="sulgasObs" className="text-[11px] font-semibold text-slate-700">
                  Observações / Parecer da Sulgás
                </Label>
                <Input
                  id="sulgasObs"
                  placeholder="Ex: Ofício Sulgás nº 412/2026 atestando conformidade com a malha local..."
                  value={sulgasObs}
                  onChange={(e) => setSulgasObs(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>

              {desfechoTipo === 'CONFIRMACAO' && sulgasStatus === 'Pendente' && (
                <div className="p-2 bg-amber-100 border border-amber-300 rounded text-[11px] text-amber-900 flex items-center justify-between gap-2">
                  <span>
                    Aviso: Enquanto pendente a manifestação da Sulgás, a solicitação pode ser
                    confirmada tecnicamente, mas fica{' '}
                    <strong>bloqueada para contratação final</strong>.
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setProntoContratacaoTentado(true)
                      setErroParecer(
                        'BLOQUEIO REGULATÓRIO (Art. 10, §5º): Antes da assinatura do contrato ou conclusão para contratação, é obrigatória a formalização da manifestação da Sulgás.',
                      )
                    }}
                    className="text-[10px] h-6 px-2 border-amber-400 bg-white text-amber-900 shrink-0"
                  >
                    Testar Bloqueio
                  </Button>
                </div>
              )}
            </div>

            {erroParecer && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{erroParecer}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button variant="outline" onClick={() => setModalAberto(false)} className="text-xs">
                Cancelar
              </Button>
              <Button
                onClick={salvarRespostaAnalise}
                disabled={salvandoStatus}
                className="bg-[#0a2540] hover:bg-[#13395e] text-white text-xs font-semibold"
              >
                {salvandoStatus ? (
                  'Salvando Deliberação...'
                ) : (
                  <>
                    <FileCheck className="h-4 w-4 mr-1.5" />
                    Publicar Deliberação Regulatória
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
