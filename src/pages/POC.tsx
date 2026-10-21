import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
import {
  pocService,
  resolverUrlDocPOC,
  type DocumentoPOCItem,
  type CronogramaEtapaPOC,
  type ManifestacaoInteressePOC,
  type PropostaVinculantePOC,
  type GarantiaTipo,
} from '@/services/poc'
import {
  FileText,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Lock,
  Flame,
  AlertCircle,
  Download,
  Building2,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  History,
  FileCheck2,
  Scale,
  DollarSign,
  Briefcase,
  Upload,
  UserCheck,
  X,
  RefreshCw,
  Search,
} from 'lucide-react'

export default function POC() {
  const { isAuthenticated, user, logout } = useAuth()
  const { toast } = useToast()

  // Estados de dados carregados do banco PocketBase
  const [documentos, setDocumentos] = useState<DocumentoPOCItem[]>([])
  const [cronograma, setCronograma] = useState<CronogramaEtapaPOC[]>([])
  const [minhasManifestacoes, setMinhasManifestacoes] = useState<ManifestacaoInteressePOC[]>([])
  const [minhasPropostas, setMinhasPropostas] = useState<PropostaVinculantePOC[]>([])
  const [carregandoDados, setCarregandoDados] = useState(true)

  // Sub-abas na Área do Carregador (quando autenticado)
  const [abaAutenticada, setAbaAutenticada] = useState<
    'manifestacao' | 'proposta' | 'assinatura' | 'historico'
  >('manifestacao')

  // Modais de submissão
  const [modalManifestacaoAberto, setModalManifestacaoAberto] = useState(false)
  const [modalPropostaAberto, setModalPropostaAberto] = useState(false)
  const [enviandoForm, setEnviandoForm] = useState(false)

  // Formulário: Manifestação de Interesse (não vinculante - Art. 37-A, §5º, I)
  const [formManif, setFormManif] = useState({
    razao_social: '',
    cnpj: '',
    email: '',
    telefone: '',
    responsavel_nome: '',
    autorizacao_anp: '',
    capacidade_solicitada: 150000,
    modalidade: 'Firme Ordinário' as 'Firme Ordinário' | 'Extraordinário' | 'Interruptível',
    trecho: 'Gasoduto Uruguaiana - Triunfo (Trechos 1 e 3)',
    ponto_recebimento: 'Paso de Los Libres (Fronteira Argentina)',
    ponto_entrega: 'Triunfo (Polo Petroquímico)',
    periodo_vigencia: '2026/2027',
    declaracao_anp_aceita: true,
  })

  // Formulário: Proposta Garantida Vinculante (Art. 37-A, §5º, III e Art. 38-A, II - LGPD)
  const [formProp, setFormProp] = useState<{
    manifestacao_id?: string
    razao_social: string
    cnpj: string
    rep_legal_nome: string
    rep_legal_cpf: string
    rep_legal_rg: string
    rep_legal_endereco: string
    rep_legal_cargo: string
    garantia_tipo: GarantiaTipo
    garantia_valor: number
    garantia_instituicao: string
    garantia_vigencia: string
    capacidade_proposta: number
    tarifa_aceita: number
    trecho: string
    ponto_recebimento: string
    ponto_entrega: string
  }>({
    razao_social: '',
    cnpj: '',
    rep_legal_nome: '',
    rep_legal_cpf: '',
    rep_legal_rg: '',
    rep_legal_endereco: '',
    rep_legal_cargo: 'Diretor / Procurador',
    garantia_tipo: 'Fiança Bancária',
    garantia_valor: 500000,
    garantia_instituicao: '',
    garantia_vigencia: '2026-12-31',
    capacidade_proposta: 150000,
    tarifa_aceita: 59.175,
    trecho: 'Gasoduto Uruguaiana - Triunfo',
    ponto_recebimento: 'Paso de Los Libres',
    ponto_entrega: 'Triunfo',
  })
  const [arquivoGarantia, setArquivoGarantia] = useState<File | null>(null)
  const [arquivoDocProposta, setArquivoDocProposta] = useState<File | null>(null)

  // Filtros de histórico
  const [filtroHistoricoAno, setFiltroHistoricoAno] = useState<string>('todos')
  const [filtroHistoricoStatus, setFiltroHistoricoStatus] = useState<string>('todos')
  const [filtroHistoricoTexto, setFiltroHistoricoTexto] = useState<string>('')

  // Pré-preenchimento dos dados do usuário logado
  useEffect(() => {
    if (user) {
      setFormManif((prev) => ({
        ...prev,
        razao_social:
          (user as unknown as { razao_social?: string }).razao_social || user.name || '',
        cnpj: (user as unknown as { cnpj?: string }).cnpj || '',
        email: user.email || '',
        telefone: (user as unknown as { telefone?: string }).telefone || '',
        responsavel_nome:
          (user as unknown as { responsavel?: string }).responsavel || user.name || '',
        autorizacao_anp: (user as unknown as { autorizacao_anp?: string }).autorizacao_anp || '',
      }))

      setFormProp((prev) => ({
        ...prev,
        razao_social:
          (user as unknown as { razao_social?: string }).razao_social || user.name || '',
        cnpj: (user as unknown as { cnpj?: string }).cnpj || '',
        rep_legal_nome:
          (user as unknown as { responsavel?: string }).responsavel || user.name || '',
      }))
    }
  }, [user])

  // Carregar dados do POCC
  const carregarDadosPOCC = useCallback(async () => {
    setCarregandoDados(true)
    try {
      const [docs, crono] = await Promise.all([
        pocService.listarDocumentos('2026/2027'),
        pocService.listarCronograma('2026/2027'),
      ])
      setDocumentos(docs)
      setCronograma(crono)

      if (pb.authStore.record?.id) {
        const [manifs, props] = await Promise.all([
          pocService.listarManifestacoesDoUsuario(),
          pocService.listarPropostasDoUsuario(),
        ])
        setMinhasManifestacoes(manifs)
        setMinhasPropostas(props)
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do POC:', err)
    } finally {
      setCarregandoDados(false)
    }
  }, [])

  useEffect(() => {
    carregarDadosPOCC()
  }, [carregarDadosPOCC, isAuthenticated])

  // Submissão da Manifestação de Interesse (não vinculante)
  const handleEnviarManifestacao = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast({
        title: 'Autenticação necessária',
        description: 'Faça login com sua conta de Carregador para manifestar interesse.',
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
        email: formManif.email,
        telefone: formManif.telefone,
        responsavel_nome: formManif.responsavel_nome,
        autorizacao_anp: formManif.autorizacao_anp,
        capacidade_solicitada: Number(formManif.capacidade_solicitada),
        modalidade: formManif.modalidade,
        trecho: formManif.trecho,
        ponto_recebimento: formManif.ponto_recebimento,
        ponto_entrega: formManif.ponto_entrega,
        periodo_vigencia: formManif.periodo_vigencia,
        declaracao_anp_aceita: formManif.declaracao_anp_aceita,
      })

      setMinhasManifestacoes((prev) => [nova, ...prev])
      setModalManifestacaoAberto(false)
      toast({
        title: 'Manifestação de Interesse Registrada!',
        description: `Protocolo único: ${nova.protocolo}. Comprovante formal enviado ao e-mail institucional.`,
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

  // Submissão da Proposta Garantida Vinculante (Art. 37-A §5º, III + LGPD)
  const handleEnviarProposta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast({
        title: 'Autenticação necessária',
        description: 'Faça login para submeter Proposta Vinculante.',
        variant: 'destructive',
      })
      return
    }

    if (
      !formProp.rep_legal_cpf.trim() ||
      !formProp.rep_legal_rg.trim() ||
      !formProp.rep_legal_endereco.trim()
    ) {
      toast({
        title: 'Dados complementares obrigatórios',
        description:
          'Conforme a norma e LGPD, informe CPF, RG e endereço completo do Representante Legal.',
        variant: 'destructive',
      })
      return
    }

    setEnviandoForm(true)
    try {
      const nova = await pocService.criarPropostaVinculante({
        ciclo: '2026/2027',
        manifestacao_id: formProp.manifestacao_id || undefined,
        razao_social: formProp.razao_social,
        cnpj: formProp.cnpj,
        rep_legal_nome: formProp.rep_legal_nome,
        rep_legal_cpf: formProp.rep_legal_cpf,
        rep_legal_rg: formProp.rep_legal_rg,
        rep_legal_endereco: formProp.rep_legal_endereco,
        rep_legal_cargo: formProp.rep_legal_cargo,
        garantia_tipo: formProp.garantia_tipo,
        garantia_valor: Number(formProp.garantia_valor),
        garantia_instituicao: formProp.garantia_instituicao,
        garantia_vigencia: formProp.garantia_vigencia,
        garantia_arquivo: arquivoGarantia,
        documento_proposta: arquivoDocProposta,
        capacidade_proposta: Number(formProp.capacidade_proposta),
        tarifa_aceita: Number(formProp.tarifa_aceita),
        trecho: formProp.trecho,
        ponto_recebimento: formProp.ponto_recebimento,
        ponto_entrega: formProp.ponto_entrega,
      })

      setMinhasPropostas((prev) => [nova, ...prev])
      setModalPropostaAberto(false)
      setArquivoGarantia(null)
      setArquivoDocProposta(null)
      toast({
        title: 'Proposta Garantida Vinculante Registrada!',
        description: `Protocolo: ${nova.protocolo}. Garantia financeira recebida para análise da comissão.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar proposta vinculante.'
      toast({
        title: 'Erro no envio da proposta',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setEnviandoForm(false)
    }
  }

  // Filtragem de histórico do carregador
  const historicoFiltrado = minhasManifestacoes.filter((m) => {
    if (filtroHistoricoAno !== 'todos' && !m.ciclo.includes(filtroHistoricoAno)) return false
    if (filtroHistoricoStatus !== 'todos' && m.status !== filtroHistoricoStatus) return false
    if (filtroHistoricoTexto.trim()) {
      const busca = filtroHistoricoTexto.toLowerCase()
      const matchProto = m.protocolo.toLowerCase().includes(busca)
      const matchModalidade = m.modalidade.toLowerCase().includes(busca)
      if (!matchProto && !matchModalidade) return false
    }
    return true
  })

  return (
    <div className="space-y-8 animate-fade-in">
      {/* =========================================================================
          BANNER REGULATÓRIO POCC — Resolução ANP nº 961/2023 (Arts. 37-A e 38-A)
          ========================================================================= */}
      <div className="p-4 sm:p-5 bg-[#eff6ff] border-l-4 border-l-[#0284c7] border border-blue-200 rounded-r-lg space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm sm:text-base font-bold text-[#0a2540] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] animate-pulse" />
            Processo de Oferta e Contratação de Capacidade (POCC) — TSB
          </h2>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
            Resolução ANP nº 11/2016 (Arts. 37-A e 38-A, incluídos pela Res. 961/2023)
          </span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          O <strong>POCC</strong> é o rito regulatório conduzido de forma periódica e transparente
          pela Transportadora Sulbrasileira de Gás S.A. (TSB) em sua plataforma eletrônica própria
          para oferta de capacidade de transporte firme disponível em gasodutos existentes. O
          processo obedece estritamente às <strong>5 etapas sequenciais</strong> do Art. 37-A, §5º,
          assegurando isonomia, publicidade e eficiência de alocação de capacidade sem etapa de
          leilão.
        </p>
      </div>

      {/* =========================================================================
          BOXES REGULATÓRIOS: Art. 8º (Autorização Prévia ANP) e Art. 8º-A (Curto Prazo)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Box Art. 8º: Requisito de Autorização Prévia da ANP */}
        <Card className="border-l-4 border-l-amber-500 border border-slate-200 bg-amber-50/40 shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase tracking-wider">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              Requisito Regulatório: Autorização Prévia da ANP (Art. 8º da Res. 51/2013)
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Constitui condição indispensável para a contratação efetiva de capacidade de
              transporte dutoviário a prévia autorização como Carregador outorgada pela ANP. No
              entanto, em atendimento ao <strong>Art. 37-A, §5º, I</strong>, o cadastro inicial e a
              manifestação de interesse acolhem <em>potenciais carregadores</em>, consolidando-se a
              habilitação plena ao longo do ciclo até a celebração dos contratos.
            </p>
          </CardContent>
        </Card>

        {/* Box Art. 8º-A: Curto Prazo via Contrato Master */}
        <Card className="border-l-4 border-l-[#0284c7] border border-slate-200 bg-sky-50/40 shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-[#0a1d37] font-bold text-xs uppercase tracking-wider">
              <Flame className="h-4 w-4 text-[#e30613] shrink-0" />
              Serviço de Curto Prazo via Contrato Master (Art. 8º-A)
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Nos termos do <strong>Art. 8º-A</strong>, o <em>Contrato Master</em> padronizado
              aplica-se exclusivamente aos serviços de curto prazo (trimestrais, mensais, diários ou
              intradiários) celebrados eletronicamente. Já no ciclo anual do POCC (Art. 37-A), os
              produtos firmes plurianuais são formalizados mediante minuta do{' '}
              <strong>Contrato de Serviço de Transporte</strong>.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* =========================================================================
          CRONOGRAMA DO CICLO POCC 2026/2027 — 5 ETAPAS LITERAIS DO ART. 37-A, §5º
          ========================================================================= */}
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg sm:text-xl font-bold text-[#0a2540] flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#0284c7]" />
              Cronograma Oficial do Ciclo POCC TSB 2026/2027
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Etapas regulamentares do rito legal do Art. 37-A, §5º e Art. 38-A, I (Resolução ANP nº
              11/2016) — sem etapa de leilão
            </p>
          </div>
          <Badge className="bg-[#fef3c7] text-[#b45309] border border-amber-300 font-bold text-xs">
            Etapa Atual: I — Manifestação de Interesse
          </Badge>
        </CardHeader>

        <CardContent className="pt-6 pb-6">
          {/* Timeline com as 5 etapas da norma */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
            {(cronograma.length > 0
              ? cronograma
              : [
                  {
                    numero_etapa: 1,
                    titulo: 'I — Manifestação de Interesse Não Vinculante',
                    inciso_legal: 'Art. 37-A, §5º, I',
                    periodo_estimado: 'Jan a Mar/2026',
                    status_etapa: 'Fase Ativa',
                    descricao:
                      'Identificação de potenciais Carregadores e levantamento de demanda.',
                  },
                  {
                    numero_etapa: 2,
                    titulo: 'II — Tarifas ANP & Redistribuição',
                    inciso_legal: 'Art. 37-A, §5º, II',
                    periodo_estimado: 'Abr a Jun/2026',
                    status_etapa: 'Pendente',
                    descricao:
                      'Consulta Pública Tarifária e redistribuição preliminar de capacidade.',
                  },
                  {
                    numero_etapa: 3,
                    titulo: 'III — Propostas Garantidas & Alocação',
                    inciso_legal: 'Art. 37-A, §5º, III',
                    periodo_estimado: 'Jul a Ago/2026',
                    status_etapa: 'Pendente',
                    descricao:
                      'Envio de propostas vinculantes com garantia e alocação de capacidade.',
                  },
                  {
                    numero_etapa: 4,
                    titulo: 'IV — Celebração dos Contratos',
                    inciso_legal: 'Art. 37-A, §5º, IV',
                    periodo_estimado: 'Set a Out/2026',
                    status_etapa: 'Pendente',
                    descricao: 'Assinatura dos Contratos de Transporte e validação das garantias.',
                  },
                  {
                    numero_etapa: 5,
                    titulo: 'V — Registro na ANP',
                    inciso_legal: 'Art. 37-A, §5º, V',
                    periodo_estimado: 'Nov a Dez/2026',
                    status_etapa: 'Pendente',
                    descricao: 'Envio dos contratos para registro regulatório na ANP (Art. 26).',
                  },
                ]
            ).map((etapa) => {
              const isAtiva =
                etapa.status_etapa === 'Fase Ativa' || etapa.status_etapa === 'Em Andamento'
              const isConcluida = etapa.status_etapa === 'Concluída'

              return (
                <div
                  key={etapa.numero_etapa}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isAtiva
                      ? 'border-[#0284c7] bg-sky-50/70 shadow-xs ring-2 ring-sky-200'
                      : isConcluida
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isAtiva
                          ? 'bg-[#0284c7] text-white shadow-xs'
                          : isConcluida
                            ? 'bg-[#15803d] text-white'
                            : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isConcluida ? '✓' : etapa.numero_etapa}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isAtiva
                          ? 'bg-sky-200 text-sky-900'
                          : isConcluida
                            ? 'bg-emerald-200 text-emerald-900'
                            : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {etapa.status_etapa}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                    {etapa.titulo}
                  </h4>
                  <div className="text-[10px] font-semibold text-[#0284c7] mt-0.5">
                    {etapa.inciso_legal || `Etapa ${etapa.numero_etapa}`}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {etapa.descricao}
                  </p>
                  {etapa.periodo_estimado && (
                    <div className="text-[10px] text-slate-500 font-mono mt-2 pt-1 border-t border-slate-200/60">
                      Prazo: {etapa.periodo_estimado}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>
              <strong>Nota Regulatória:</strong> Em total conformidade com a Resolução ANP nº
              961/2023, o POCC não contém etapa de leilão. A alocação da capacidade é conduzida
              diretamente a partir das propostas vinculantes garantidas e tarifas de referência
              homologadas.
            </span>
            <span className="font-semibold text-slate-800 shrink-0">Ciclo Anual: 2026/2027</span>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================
          OFERTA DE CAPACIDADE DO CICLO (Art. 9º, §1º, III da Res. 11/2016)
          ========================================================================= */}
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg font-bold text-[#0a2540] flex items-center gap-2">
              <Scale className="h-5 w-5 text-[#0284c7]" />
              Oferta de Capacidade do Ciclo 2026/2027
            </CardTitle>
            <p className="text-xs text-slate-500">
              Características técnicas, pontos de injeção/retirada, capacidade ofertada e tarifas
              referenciais
            </p>
          </div>
          <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs">
            Capacidade Ofertada: 150.000 m³/dia
          </Badge>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Modalidade</span>
              <div className="text-sm font-bold text-[#0a2540]">Transporte Firme Anual</div>
              <p className="text-[11px] text-slate-600">Serviço extraordinário / anual ordinário</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">
                Pontos de Conexão
              </span>
              <div className="text-sm font-bold text-emerald-800">
                Paso de Los Libres &rarr; Triunfo
              </div>
              <p className="text-[11px] text-slate-600">Gasoduto Uruguaiana e Trecho 3 Polo</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Vigência</span>
              <div className="text-sm font-bold text-[#0a2540]">01/01/2026 a 31/12/2027</div>
              <p className="text-[11px] text-slate-600">Ciclo bienal com renovação regulada</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">
                Tarifa de Referência ANP
              </span>
              <div className="text-sm font-bold text-[#0284c7]">R$ 59,1750 / Mil m³</div>
              <p className="text-[11px] text-slate-600">Tarifa de referência homologada</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================
          CONSULTA PÚBLICA TARIFÁRIA (Art. 37-A, §3º) & RESULTADO DA MANIFESTAÇÃO
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bloco Consulta Pública Tarifária (Art. 37-A, §3º) */}
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-[#0a2540] flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Consulta Pública Tarifária (Art. 37-A, §3º)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs text-slate-700 leading-relaxed">
            <p>
              Em conformidade com o <strong>Art. 37-A, §3º</strong>, a TSB submete à Consulta
              Pública a sua proposta de metodologia e valores tarifários de referência antes da
              fixação final pela ANP. Agentes interessados e a sociedade podem submeter
              contribuições técnicas durante o período regulamentar.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
              <span>Status: Aguardando abertura do período de contribuições</span>
              <a
                href="https://www.tsb.com.br/poc/"
                target="_blank"
                rel="noreferrer"
                className="text-[#0284c7] font-semibold hover:underline inline-flex items-center gap-1"
              >
                Edital Tarifário <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Bloco Resultado da Manifestação e Tarifas Aprovadas (Art. 37-A, §5º, II e III) */}
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-[#0a2540] flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-[#0284c7]" />
              Resultado das Manifestações e Alocação Final (Art. 37-A, §5º, II e III)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs text-slate-700 leading-relaxed">
            <p>
              Os comunicados oficiais contendo a consolidação da demanda manifestada, tarifas
              homologadas pela ANP e redistribuição preliminar (Etapa II), bem como o Resultado
              Final de capacidade alocada (Etapa III), são publicados publicamente sem dados
              pessoais sensíveis de representantes (LGPD).
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
              <span>Alocação Preliminar: Prevista após Etapa II</span>
              <span className="font-semibold text-emerald-800">Sem etapa de leilão</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =========================================================================
          DOCUMENTAÇÃO PÚBLICA REAL DO POCC (Art. 37-A, §2º) — SEM BOTÃO SIMULADO!
          ========================================================================= */}
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg font-bold text-[#0a2540] flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#0284c7]" />
              Documentação Oficial do Processo (Art. 37-A, §2º da Resolução ANP nº 961/2023)
            </CardTitle>
            <p className="text-xs text-slate-500">
              Edital, Regulamento, Minuta do Contrato de Serviço de Transporte, Proposta Tarifária,
              Procedimentos, Comunicados e FAQ. Documentos reais com upload e fallback seguro.
            </p>
          </div>
          <span className="text-[11px] text-slate-500">
            {documentos.length} documento(s) homologado(s)
          </span>
        </CardHeader>
        <CardContent className="p-6">
          <ul className="space-y-3">
            {documentos.map((doc) => {
              const resDoc = resolverUrlDocPOC(doc)
              return (
                <li
                  key={doc.id || doc.chave}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <span className="text-base">📄</span>
                      <span>{doc.titulo}</span>
                    </div>
                    {doc.descricao && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {doc.descricao}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <a
                      href={resDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-2xs transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {resDoc.nomeExibicao}
                    </a>
                  </div>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      {/* =========================================================================
          CARD DE AUTENTICAÇÃO / SESSÃO DO CARREGADOR
          ========================================================================= */}
      <Card className="border border-slate-200 shadow-sm bg-slate-50/80">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Acesso Restrito ao Carregador do POC:
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#dcfce7] text-[#15803d] border border-emerald-300">
                    <ShieldCheck className="h-4 w-4" />
                    Carregador Autenticado
                  </span>
                  <span className="text-xs text-slate-700 hidden md:inline font-semibold">
                    {user?.name || user?.email}
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fee2e2] text-[#b91c1c] border border-red-300">
                  <ShieldAlert className="h-4 w-4" />
                  Visitante Público (Sem autenticação)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button
                variant="outline"
                onClick={logout}
                className="text-xs font-semibold text-red-700 border-red-200 hover:bg-red-50"
              >
                Encerrar Sessão
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/signup">
                  <Button
                    variant="outline"
                    className="text-xs font-semibold border-slate-300 text-slate-700"
                  >
                    Cadastrar Carregador
                  </Button>
                </Link>
                <Link to="/login" state={{ from: { pathname: '/poc' } }}>
                  <Button className="bg-[#0a2540] hover:bg-[#13395e] text-white text-xs font-semibold">
                    Acessar Área do Carregador
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================
          RAMO AUTENTICADO: AMBIENTE RESTRITO DO CARREGADOR
          - Manifestação de Interesse (não vinculante, protocolo persistido e e-mail)
          - Proposta Garantida Vinculante (dados de representantes legais LGPD + garantia)
          - Assinatura Contratual (Contrato de Transporte e Contrato Master)
          - Histórico dos Ciclos do Carregador
          ========================================================================= */}
      {isAuthenticated ? (
        <Card className="border-t-4 border-t-[#059669] border-slate-200 shadow-md bg-white animate-fade-in">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-xl font-bold text-[#0a2540] flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#059669]" />
                Área Restrita do Carregador — Ciclo POCC 2026/2027
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Ambiente seguro para manifestação não vinculante, proposta garantida, assinatura
                contratual e histórico
              </p>
            </div>
            <Badge className="bg-[#dcfce7] text-[#15803d] border border-emerald-300 font-bold">
              LGPD: Ambiente Autenticado e Criptografado
            </Badge>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* SUB-ABAS DO CARREGADOR */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setAbaAutenticada('manifestacao')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                  abaAutenticada === 'manifestacao'
                    ? 'bg-[#0a2540] text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Send className="h-4 w-4" />
                1. Manifestação de Interesse
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-sky-200 text-[#0a2540] font-bold">
                  {minhasManifestacoes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAbaAutenticada('proposta')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                  abaAutenticada === 'proposta'
                    ? 'bg-[#0a2540] text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Scale className="h-4 w-4 text-emerald-400" />
                2. Proposta Garantida (Vinculante)
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                  {minhasPropostas.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAbaAutenticada('assinatura')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                  abaAutenticada === 'assinatura'
                    ? 'bg-[#0a2540] text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Briefcase className="h-4 w-4 text-sky-400" />
                3. Assinatura Contratual (Art. 37-A, §5º, IV)
              </button>

              <button
                type="button"
                onClick={() => setAbaAutenticada('historico')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                  abaAutenticada === 'historico'
                    ? 'bg-[#0a2540] text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <History className="h-4 w-4 text-amber-500" />
                Histórico dos Ciclos
              </button>
            </div>

            {/* ABA 1: MANIFESTAÇÃO DE INTERESSE */}
            {abaAutenticada === 'manifestacao' && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#0a2540] text-sm flex items-center gap-1.5">
                      <Send className="h-4 w-4 text-[#0284c7]" />
                      Manifestação de Interesse Não Vinculante (Art. 37-A, §5º, I)
                    </div>
                    <p className="text-slate-600">
                      Identificação formal da demanda e dos potenciais Carregadores. Cada envio gera
                      protocolo eletrônico único persistido em banco de dados e dispara e-mail
                      automático via SMTP corporativo TSB.
                    </p>
                  </div>
                  <Button
                    onClick={() => setModalManifestacaoAberto(true)}
                    className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold shrink-0"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Nova Manifestação de Interesse
                  </Button>
                </div>

                {/* Lista de manifestações do usuário */}
                {minhasManifestacoes.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-100 text-[#0a2540] font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Protocolo</th>
                          <th className="p-3">Ciclo</th>
                          <th className="p-3">Capacidade</th>
                          <th className="p-3">Modalidade</th>
                          <th className="p-3">Rota</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {minhasManifestacoes.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-[#0284c7]">
                              {m.protocolo}
                            </td>
                            <td className="p-3 font-semibold">{m.ciclo}</td>
                            <td className="p-3 font-bold text-slate-800">
                              {Number(m.capacidade_solicitada).toLocaleString('pt-BR')} m³/dia
                            </td>
                            <td className="p-3">{m.modalidade}</td>
                            <td className="p-3 text-slate-600">
                              {m.ponto_recebimento} &rarr; {m.ponto_entrega}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {m.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 font-mono">
                              {new Date(m.created).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-500 space-y-2">
                    <p className="text-xs">
                      Sua empresa ainda não registrou manifestação de interesse para o ciclo
                      vigente.
                    </p>
                    <Button
                      onClick={() => setModalManifestacaoAberto(true)}
                      variant="outline"
                      size="sm"
                      className="text-xs text-[#0284c7] border-blue-300"
                    >
                      Preencher Formulário de Manifestação
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ABA 2: PROPOSTA GARANTIDA VINCULANTE (Art. 37-A §5º, III + LGPD) */}
            {abaAutenticada === 'proposta' && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                      <Scale className="h-4 w-4 text-[#059669]" />
                      Proposta Garantida Vinculante (Art. 37-A, §5º, III e Art. 38-A, II)
                    </div>
                    <p className="text-emerald-900">
                      Submissão de proposta formal que vincula o carregador à alocação de
                      capacidade. Exige dados pessoais de Representantes Legais sob sigilo (LGPD
                      Art. 7º, II) e apresentação de garantia financeira idônea.
                    </p>
                  </div>
                  <Button
                    onClick={() => setModalPropostaAberto(true)}
                    className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold shrink-0"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Enviar Proposta Garantida
                  </Button>
                </div>

                {minhasPropostas.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-100 text-[#0a2540] font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Protocolo</th>
                          <th className="p-3">Representante Legal (LGPD)</th>
                          <th className="p-3">Capacidade Proposta</th>
                          <th className="p-3">Garantia Financeira</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {minhasPropostas.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-[#059669]">
                              {p.protocolo}
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-900">{p.rep_legal_nome}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                CPF: ***.{p.rep_legal_cpf?.slice(4, 7) || '***'}.***-** (Ambiente
                                Seguro)
                              </div>
                            </td>
                            <td className="p-3 font-bold text-slate-800">
                              {Number(p.capacidade_proposta).toLocaleString('pt-BR')} m³/dia
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-800">
                                {p.garantia_tipo}
                              </span>
                              <div className="text-[11px] text-slate-500">
                                R$ {Number(p.garantia_valor).toLocaleString('pt-BR')}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                                {p.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 font-mono">
                              {new Date(p.created).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-500 space-y-2">
                    <p className="text-xs">
                      Nenhuma proposta vinculante submetida para este ciclo. A proposta vinculante é
                      formalizada na Etapa III do cronograma após a publicação das tarifas
                      homologadas.
                    </p>
                    <Button
                      onClick={() => setModalPropostaAberto(true)}
                      variant="outline"
                      size="sm"
                      className="text-xs text-[#059669] border-emerald-300"
                    >
                      Cadastrar Proposta Garantida
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ABA 3: ASSINATURA CONTRATUAL */}
            {abaAutenticada === 'assinatura' && (
              <div className="space-y-4 animate-fade-in text-xs text-slate-700">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="font-bold text-sm text-[#0a2540] flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-[#0284c7]" />
                    Celebração dos Contratos e Apresentação de Garantias Definitivas (Art. 37-A,
                    §5º, IV)
                  </div>
                  <p className="leading-relaxed">
                    Nesta etapa, após a homologação da alocação de capacidade pela TSB e ANP, os
                    instrumentos contratuais definitivos são assinados digitalmente pelos
                    Representantes Legais com certificado ICP-Brasil.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border border-slate-200 bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-[#0a2540] flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#0284c7]" />
                        Contrato de Serviço de Transporte Firme (POCC Anual)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-[11px] text-slate-600">
                        Instrumento que formaliza a capacidade firme alocada nos Trechos 1 e 3 da
                        TSB para o horizonte plurianual 2026/2027.
                      </p>
                      <Badge className="bg-slate-100 text-slate-700">
                        Aguardando Conclusão da Etapa III
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200 bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-[#0a2540] flex items-center gap-2">
                        <Flame className="h-4 w-4 text-[#e30613]" />
                        Contrato Master de Transporte (Curto Prazo - Art. 8º-A)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-[11px] text-slate-600">
                        Aplicável para contratações de curto prazo (trimestral, mensal, diário e
                        intradiário) diretamente na plataforma eletrônica.
                      </p>
                      <a
                        href="https://www.tsb.com.br/wp-content/uploads/2025/03/CONTRATO-MASTER-TSB-2025-2029.pdf"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[#0284c7] font-semibold hover:underline"
                      >
                        Baixar Minuta Contrato Master <Download className="h-3 w-3" />
                      </a>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ABA 4: HISTÓRICO DOS CICLOS COM FILTROS */}
            {abaAutenticada === 'historico' && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Filtrar por protocolo ou modalidade..."
                      value={filtroHistoricoTexto}
                      onChange={(e) => setFiltroHistoricoTexto(e.target.value)}
                      className="h-8 text-xs w-56"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Ano / Ciclo:</span>
                    <select
                      value={filtroHistoricoAno}
                      onChange={(e) => setFiltroHistoricoAno(e.target.value)}
                      className="h-8 px-2 rounded border border-slate-300 text-xs bg-white"
                    >
                      <option value="todos">Todos os Ciclos</option>
                      <option value="2026">2026/2027</option>
                      <option value="2025">2025/2026</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Situação:</span>
                    <select
                      value={filtroHistoricoStatus}
                      onChange={(e) => setFiltroHistoricoStatus(e.target.value)}
                      className="h-8 px-2 rounded border border-slate-300 text-xs bg-white"
                    >
                      <option value="todos">Todas as situações</option>
                      <option value="Recebida - Em Análise">Recebida - Em Análise</option>
                      <option value="Habilitada para Etapa II">Habilitada para Etapa II</option>
                      <option value="Indeferida">Indeferida</option>
                    </select>
                  </div>
                </div>

                {historicoFiltrado.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-100 text-[#0a2540] font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Protocolo</th>
                          <th className="p-3">Ciclo</th>
                          <th className="p-3">Produto / Modalidade</th>
                          <th className="p-3">Capacidade</th>
                          <th className="p-3">Situação</th>
                          <th className="p-3">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {historicoFiltrado.map((h) => (
                          <tr key={h.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-[#0284c7]">
                              {h.protocolo}
                            </td>
                            <td className="p-3 font-semibold">{h.ciclo}</td>
                            <td className="p-3">{h.modalidade}</td>
                            <td className="p-3 font-mono font-semibold">
                              {Number(h.capacidade_solicitada).toLocaleString('pt-BR')} m³/dia
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                {h.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 font-mono">
                              {new Date(h.created).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Nenhum registro encontrado para os filtros selecionados.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* CONVITE PARA LOGIN NO POC */
        <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-slate-200 text-[#0a2540]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">
                Área Restrita ao Carregador Cadastrado
              </div>
              <p className="text-slate-600 mt-0.5">
                Para manifestar interesse, submeter propostas vinculantes com garantia financeira e
                assinar contratos, identifique-se com sua conta corporativa.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/signup">
              <Button variant="outline" size="sm" className="text-xs">
                Cadastrar
              </Button>
            </Link>
            <Link to="/login" state={{ from: { pathname: '/poc' } }}>
              <Button size="sm" className="bg-[#0a2540] hover:bg-[#13395e] text-white text-xs">
                Entrar com Login &rarr;
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SUBMISSÃO DE MANIFESTAÇÃO DE INTERESSE (NÃO VINCULANTE)
          ========================================================================= */}
      {modalManifestacaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6 space-y-4 border border-slate-200 max-h-[92vh] overflow-y-auto relative">
            <button
              type="button"
              onClick={() => setModalManifestacaoAberto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 text-[#0a2540]">
              <div className="p-2 bg-sky-50 rounded-full text-[#0284c7]">
                <Send className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Manifestação de Interesse (Etapa I)</h3>
                <p className="text-xs text-slate-500">
                  Art. 37-A, §5º, I da Resolução ANP nº 11/2016 — Ciclo POCC 2026/2027
                </p>
              </div>
            </div>

            <form onSubmit={handleEnviarManifestacao} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded text-slate-700">
                Esta manifestação é <strong>não vinculante</strong> e destina-se ao levantamento de
                demanda nos pontos de conexão e fixação das tarifas de referência pela ANP.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="m_razao">Razão Social *</Label>
                  <Input
                    id="m_razao"
                    required
                    value={formManif.razao_social}
                    onChange={(e) => setFormManif({ ...formManif, razao_social: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="m_cnpj">CNPJ *</Label>
                  <Input
                    id="m_cnpj"
                    required
                    value={formManif.cnpj}
                    onChange={(e) => setFormManif({ ...formManif, cnpj: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="m_resp">Nome do Responsável *</Label>
                  <Input
                    id="m_resp"
                    required
                    value={formManif.responsavel_nome}
                    onChange={(e) =>
                      setFormManif({ ...formManif, responsavel_nome: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="m_email">E-mail Corporativo (Receberá o Protocolo) *</Label>
                  <Input
                    id="m_email"
                    type="email"
                    required
                    value={formManif.email}
                    onChange={(e) => setFormManif({ ...formManif, email: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="m_tel">Telefone de Contato</Label>
                  <Input
                    id="m_tel"
                    value={formManif.telefone}
                    onChange={(e) => setFormManif({ ...formManif, telefone: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="m_anp" className="flex items-center justify-between">
                    <span>Nº de Autorização ANP como Carregador</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Opcional nesta etapa
                    </span>
                  </Label>
                  <Input
                    id="m_anp"
                    placeholder="Se já possuir outorga da ANP"
                    value={formManif.autorizacao_anp}
                    onChange={(e) =>
                      setFormManif({ ...formManif, autorizacao_anp: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="m_cap">Capacidade Desejada (m³/dia) *</Label>
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
                  <Label htmlFor="m_mod">Modalidade *</Label>
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
                    <option value="Firme Ordinário">Firme Ordinário</option>
                    <option value="Extraordinário">Extraordinário</option>
                    <option value="Interruptível">Interruptível</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="m_trecho">Trecho Objeto / Instalação *</Label>
                  <Input
                    id="m_trecho"
                    required
                    value={formManif.trecho}
                    onChange={(e) => setFormManif({ ...formManif, trecho: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="m_decl"
                  checked={formManif.declaracao_anp_aceita}
                  onChange={(e) =>
                    setFormManif({ ...formManif, declaracao_anp_aceita: e.target.checked })
                  }
                  className="mt-0.5 rounded text-[#059669] focus:ring-[#059669]"
                />
                <label htmlFor="m_decl" className="cursor-pointer leading-snug">
                  Declaro ciência de que a contratação de capacidade exige autorização prévia da ANP
                  (Art. 8º da Res. 51/2013) e que o presente ato não constitui proposta vinculante,
                  habilitação preliminar ou reserva de capacidade.
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
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
                  disabled={enviandoForm || !formManif.declaracao_anp_aceita}
                  className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold"
                >
                  {enviandoForm ? 'Registrando Protocolo...' : 'Confirmar e Emitir Protocolo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SUBMISSÃO DE PROPOSTA GARANTIDA VINCULANTE (ETAPA III + LGPD)
          ========================================================================= */}
      {modalPropostaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 max-h-[92vh] overflow-y-auto relative">
            <button
              type="button"
              onClick={() => setModalPropostaAberto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 text-[#0a2540]">
              <div className="p-2 bg-emerald-50 rounded-full text-[#059669]">
                <Scale className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Proposta Garantida Vinculante (Etapa III)</h3>
                <p className="text-xs text-slate-500">
                  Art. 37-A, §5º, III e Art. 38-A, II da Resolução ANP nº 11/2016
                </p>
              </div>
            </div>

            <form onSubmit={handleEnviarProposta} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded text-emerald-950">
                <strong>ATENÇÃO (Vínculo Jurídico):</strong> Esta proposta é irrevogável e
                irretratável. Os dados pessoais de Representantes Legais trafegam sob ambiente
                autenticado e criptografado em conformidade com o{' '}
                <strong>Art. 7º, II da LGPD</strong>.
              </div>

              {/* DADOS DO REPRESENTANTE LEGAL (LGPD) */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-[#0284c7]" />
                  Dados do Representante Legal Signatário (LGPD Art. 7º, II)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="p_rep_nome">Nome Completo *</Label>
                    <Input
                      id="p_rep_nome"
                      required
                      placeholder="Nome do diretor / procurador"
                      value={formProp.rep_legal_nome}
                      onChange={(e) => setFormProp({ ...formProp, rep_legal_nome: e.target.value })}
                      className="h-8 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="p_rep_cargo">Cargo / Qualificação</Label>
                    <Input
                      id="p_rep_cargo"
                      placeholder="Diretor Presidente / Procurador"
                      value={formProp.rep_legal_cargo}
                      onChange={(e) =>
                        setFormProp({ ...formProp, rep_legal_cargo: e.target.value })
                      }
                      className="h-8 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="p_rep_cpf">CPF *</Label>
                    <Input
                      id="p_rep_cpf"
                      required
                      placeholder="000.000.000-00"
                      value={formProp.rep_legal_cpf}
                      onChange={(e) => setFormProp({ ...formProp, rep_legal_cpf: e.target.value })}
                      className="h-8 text-xs bg-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="p_rep_rg">RG / Órgão Expedidor *</Label>
                    <Input
                      id="p_rep_rg"
                      required
                      placeholder="1234567890 SSP/RS"
                      value={formProp.rep_legal_rg}
                      onChange={(e) => setFormProp({ ...formProp, rep_legal_rg: e.target.value })}
                      className="h-8 text-xs bg-white font-mono"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="p_rep_end">Endereço Comercial Completo *</Label>
                    <Input
                      id="p_rep_end"
                      required
                      placeholder="Logradouro, número, complemento, bairro, cidade/UF, CEP"
                      value={formProp.rep_legal_endereco}
                      onChange={(e) =>
                        setFormProp({ ...formProp, rep_legal_endereco: e.target.value })
                      }
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* GARANTIA FINANCEIRA (Art. 38-A, II) */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Garantia Financeira Vinculante (Art. 38-A, II)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="p_gar_tipo">Tipo de Garantia *</Label>
                    <select
                      id="p_gar_tipo"
                      value={formProp.garantia_tipo}
                      onChange={(e) =>
                        setFormProp({ ...formProp, garantia_tipo: e.target.value as GarantiaTipo })
                      }
                      className="w-full h-8 px-2 rounded border border-slate-300 text-xs bg-white"
                    >
                      <option value="Fiança Bancária">Fiança Bancária</option>
                      <option value="Seguro Garantia">Seguro Garantia</option>
                      <option value="Depósito Caução">Depósito Caução</option>
                      <option value="Carta de Crédito">Carta de Crédito</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="p_gar_val">Valor da Garantia (R$) *</Label>
                    <Input
                      id="p_gar_val"
                      type="number"
                      required
                      min={1}
                      value={formProp.garantia_valor}
                      onChange={(e) =>
                        setFormProp({ ...formProp, garantia_valor: Number(e.target.value) })
                      }
                      className="h-8 text-xs bg-white font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="p_gar_inst">Instituição Emissora</Label>
                    <Input
                      id="p_gar_inst"
                      placeholder="Banco / Seguradora"
                      value={formProp.garantia_instituicao}
                      onChange={(e) =>
                        setFormProp({ ...formProp, garantia_instituicao: e.target.value })
                      }
                      className="h-8 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-3">
                    <Label htmlFor="p_gar_file">
                      Upload do Instrumento de Garantia (PDF até 50 MB) *
                    </Label>
                    <Input
                      id="p_gar_file"
                      type="file"
                      accept=".pdf,.zip"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setArquivoGarantia(e.target.files[0])
                        }
                      }}
                      className="h-8 text-xs bg-white"
                    />
                    <span className="text-[10px] text-slate-500">
                      Envie a apólice ou carta fiança emitida pela instituição financeira
                      autorizada.
                    </span>
                  </div>
                </div>
              </div>

              {/* PARÂMETROS DA PROPOSTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="p_cap">Capacidade Proposta Firme (m³/dia) *</Label>
                  <Input
                    id="p_cap"
                    type="number"
                    required
                    min={1}
                    value={formProp.capacidade_proposta}
                    onChange={(e) =>
                      setFormProp({ ...formProp, capacidade_proposta: Number(e.target.value) })
                    }
                    className="h-8 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="p_tar">Tarifa Aceita (R$/Mil m³) *</Label>
                  <Input
                    id="p_tar"
                    type="number"
                    step="0.0001"
                    required
                    value={formProp.tarifa_aceita}
                    onChange={(e) =>
                      setFormProp({ ...formProp, tarifa_aceita: Number(e.target.value) })
                    }
                    className="h-8 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalPropostaAberto(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={enviandoForm}
                  className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold"
                >
                  {enviandoForm
                    ? 'Submetendo Proposta...'
                    : 'Submeter Proposta Garantida Vinculante'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
