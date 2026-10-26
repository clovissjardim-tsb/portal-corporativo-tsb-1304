import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  solicitacoesService,
  ModalidadeSolicitacao,
  SolicitacaoIncisoVII,
} from '@/services/solicitacoes'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  FileText,
  AlertCircle,
  Building2,
  ExternalLink,
  ArrowLeft,
  RefreshCw,
  Send,
  HelpCircle,
  FileCheck,
  Copy,
} from 'lucide-react'

export default function SolicitacaoAcesso() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { toast } = useToast()

  // Redirecionamento autenticado: se não estiver logado, redirecionar para /login guardando o retorno
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', {
        replace: true,
        state: { from: { pathname: location.pathname, search: location.search } },
      })
    }
  }, [isAuthenticated, isLoading, navigate, location])

  // Campos pré-carregados do usuário autenticado (travados na tela)
  const userRazaoSocial =
    (user?.razao_social as string) || (user?.name as string) || 'Carregador Cadastrado'
  const userCnpj = (user?.cnpj as string) || 'Não informado no cadastro'
  const userResponsavel = (user?.responsavel as string) || (user?.name as string) || ''
  const userEmailInicial = (user?.email as string) || ''

  // Estado do formulário
  const [emailContato, setEmailContato] = useState(userEmailInicial)
  const [modalidade, setModalidade] = useState<ModalidadeSolicitacao>('Firme Ordinário')
  const [trecho, setTrecho] = useState('Trecho 1 (Gasoduto Uruguaiana)')
  const [pontoRecebimento, setPontoRecebimento] = useState(
    'Paso de Los Libres (Fronteira Brasil/Argentina)',
  )
  const [pontoEntrega, setPontoEntrega] = useState('Triunfo (Polo Petroquímico)')
  const [capacidade, setCapacidade] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [garantiasSwap, setGarantiasSwap] = useState('')

  // Sincroniza e-mail inicial caso o usuário carregue após montagem
  useEffect(() => {
    if (user?.email && !emailContato) {
      setEmailContato(user.email)
    }
  }, [user, emailContato])

  // Estado de envio
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  // Estado de sucesso da submissão
  const [solicitacaoCriada, setSolicitacaoCriada] = useState<SolicitacaoIncisoVII | null>(null)

  // Estado da consulta por protocolo na mesma página
  const [termoBusca, setTermoBusca] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultadoBusca, setResultadoBusca] = useState<{
    executado: boolean
    encontrado: boolean
    dados?: SolicitacaoIncisoVII
  } | null>(null)

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroEnvio(null)

    const capNum = parseFloat(capacidade.replace(/\./g, '').replace(',', '.'))
    if (isNaN(capNum) || capNum <= 0) {
      setErroEnvio('Informe uma capacidade diária válida maior que zero (m³/dia).')
      return
    }

    if (!emailContato.trim()) {
      setErroEnvio('Informe um e-mail de contato válido.')
      return
    }

    if (!periodo.trim()) {
      setErroEnvio('O período pretendido é obrigatório (Art. 10, II da Res. ANP nº 11/2016).')
      return
    }

    if (modalidade === 'Troca Operacional' && (!garantiasSwap || garantiasSwap.trim().length < 5)) {
      setErroEnvio(
        'Para a modalidade Troca Operacional (Swap), as garantias de segurança e confiabilidade operacional são obrigatórias (Art. 10, §1º da Res. ANP nº 11/2016).',
      )
      return
    }

    setEnviando(true)

    try {
      // Reutiliza diretamente a coleção solicitacoes_inciso_vii via serviço existente
      const novoRegistro = await solicitacoesService.criar({
        razao_social: userRazaoSocial,
        cnpj: userCnpj,
        email: emailContato.trim(),
        modalidade,
        capacidade: capNum,
        trecho,
        ponto_recebimento: pontoRecebimento,
        ponto_entrega: pontoEntrega,
        periodo: periodo.trim(),
        observacoes: observacoes.trim() || undefined,
        garantias_seguranca_swap:
          modalidade === 'Troca Operacional' ? garantiasSwap.trim() : undefined,
        representante_legal: userResponsavel || undefined,
        origem: 'area_carregador', // Identifica na Gestão Interna como vinda do portal autenticado
      })

      setSolicitacaoCriada(novoRegistro)
      // Preenche o campo de busca com o protocolo gerado para conveniência
      setTermoBusca(novoRegistro.protocolo)

      toast({
        title: 'Solicitação Protocolada com Sucesso!',
        description: `Protocolo ${novoRegistro.protocolo} gerado. SLA de 20 dias úteis em andamento.`,
      })

      // Rola suavemente até o banner de confirmação
      setTimeout(() => {
        document.getElementById('banner-sucesso-solicitacao')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }, 100)
    } catch (err: unknown) {
      console.error('Erro ao submeter solicitação de acesso:', err)
      const msg =
        err instanceof Error
          ? err.message
          : 'Falha ao registrar a solicitação no sistema. Tente novamente.'
      setErroEnvio(msg)
      toast({
        title: 'Erro na Solicitação',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setEnviando(false)
    }
  }

  const handleBuscarProtocolo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanProto = termoBusca.trim()
    if (!cleanProto) return

    setBuscando(true)
    try {
      const res = await solicitacoesService.buscarPorProtocolo(cleanProto)
      if (res) {
        setResultadoBusca({
          executado: true,
          encontrado: true,
          dados: res,
        })
      } else {
        setResultadoBusca({
          executado: true,
          encontrado: false,
        })
      }
    } catch (err) {
      console.error('Erro na consulta por protocolo:', err)
      setResultadoBusca({
        executado: true,
        encontrado: false,
      })
    } finally {
      setBuscando(false)
    }
  }

  const handleCopiarProtocolo = (proto: string) => {
    navigator.clipboard?.writeText(proto)
    toast({
      title: 'Protocolo copiado!',
      description: `${proto} copiado para a área de transferência.`,
    })
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <RefreshCw className="h-4 w-4 animate-spin text-[#0a2540]" />
          <span>Verificando credenciais e preparando ambiente seguro...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* NAVEGAÇÃO SUPERIOR DE RETORNO */}
      <div className="flex items-center justify-between gap-4 text-xs text-slate-600">
        <Link
          to="/transparencia"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0a2540] font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para Transparência (Art. 9º, VII)
        </Link>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Ambiente Autenticado • Sessão Ativa
        </span>
      </div>

      {/* CABEÇALHO DA PÁGINA DEDICADA */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#0a2540] text-white tracking-wider uppercase font-display">
            Resolução ANP nº 11/2016 • Art. 10
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-[#0284c7] border border-sky-200">
            Inciso VII • Consulta de Disponibilidade de Acesso
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Fluxo Eletrônico Automatizado
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540] font-display">
          Solicitação de Acesso à Capacidade de Transporte Dutoviário
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl text-justify sm:text-left">
          Canal regulatório oficial da{' '}
          <strong>Transportadora Sulbrasileira de Gás S.A. (TSB)</strong> para autuação formal de
          solicitações de acesso de terceiros (Art. 10 da Resolução ANP nº 11/2016). O envio gera
          imediatamente o <strong>Protocolo Formal da TSB</strong>, dispara o comprovante por e-mail
          corporativo com SLA legal de resposta e inicia a análise técnica de viabilidade pela
          equipe de engenharia e operações.
        </p>
      </div>

      {/* ESTADO DE SUCESSO: BANNER VERDE COM PROTOCOLO EM DESTAQUE + ORIENTAÇÕES */}
      {solicitacaoCriada && (
        <div
          id="banner-sucesso-solicitacao"
          className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-6 sm:p-8 shadow-md space-y-6 animate-fade-in"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600 text-white rounded-full shrink-0 shadow-sm">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-800">
                  Solicitação Registrada e Autuada com Sucesso
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-emerald-950">
                  Protocolo Oficial Gerado
                </h2>
              </div>
            </div>

            {/* PROTOCOLO EM DESTAQUE */}
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-lg border border-emerald-300 shadow-xs">
              <div className="text-right">
                <span className="block text-[10px] uppercase font-semibold text-slate-500">
                  Número do Protocolo TSB
                </span>
                <span className="font-mono text-xl sm:text-2xl font-extrabold text-[#0284c7] tracking-wider">
                  {solicitacaoCriada.protocolo}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopiarProtocolo(solicitacaoCriada.protocolo)}
                className="h-8 px-2 text-slate-600 hover:text-[#0284c7]"
                title="Copiar Protocolo"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* DADOS DA SOLICITAÇÃO REGISTRADA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white/70 p-4 rounded-lg border border-emerald-200 text-xs">
            <div>
              <span className="text-slate-500 block">Solicitante:</span>
              <strong className="text-slate-900">{solicitacaoCriada.razao_social}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Modalidade:</span>
              <strong className="text-slate-900">{solicitacaoCriada.modalidade}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Capacidade Requisitada:</span>
              <strong className="text-slate-900 font-mono">
                {solicitacaoCriada.capacidade?.toLocaleString('pt-BR')} m³/dia
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Trecho Solicitado:</span>
              <strong className="text-slate-900">{solicitacaoCriada.trecho}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Injeção (Recebimento):</span>
              <strong className="text-emerald-900">{solicitacaoCriada.ponto_recebimento}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Retirada (Entrega):</span>
              <strong className="text-sky-900">{solicitacaoCriada.ponto_entrega}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Período Demandado:</span>
              <strong className="text-slate-900">{solicitacaoCriada.periodo}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">E-mail de Confirmação:</span>
              <strong className="text-slate-900 font-mono">{solicitacaoCriada.email}</strong>
            </div>
          </div>

          {/* ORIENTAÇÕES DETALHADAS DO PROCESSO REGULATÓRIO (ART. 10, §2º) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-700" />
              Orientações do Processo e Prazos Regulamentares (Resolução ANP nº 11/2016):
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-white rounded-lg border border-emerald-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Prazo de Resposta (SLA)</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-justify">
                  Conforme o <strong>Art. 10, §2º</strong> da Resolução ANP nº 11/2016, a TSB
                  emitirá seu parecer técnico fundamentado por escrito no prazo máximo de{' '}
                  <strong>20 (vinte) dias úteis</strong> a contar desta autuação (ou prazo menor
                  conforme previsto nos Termos de Acesso).
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-lg border border-emerald-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-sky-900">
                  <Search className="h-4 w-4 text-sky-600 shrink-0" />
                  <span>Acompanhamento por Protocolo</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-justify">
                  O andamento pode ser consultado a qualquer momento no campo de pesquisa logo
                  abaixo nesta mesma página ou no Portal de Transparência, utilizando o número{' '}
                  <strong className="font-mono text-[#0284c7]">
                    {solicitacaoCriada.protocolo}
                  </strong>
                  .
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-lg border border-emerald-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-[#0a2540]">
                  <FileCheck className="h-4 w-4 text-[#0284c7] shrink-0" />
                  <span>Análise Técnica e Desfechos</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-justify">
                  A equipe técnica da TSB analisará a viabilidade hidráulica e capacidade ociosa,
                  concluindo em um dos 3 desfechos legais: I - Confirmação do Atendimento; II -
                  Aprofundamento da Análise (com escopo e custos); ou III - Negativa Fundamentada
                  (com cópia à ANP).
                </p>
              </div>
            </div>

            <div className="p-3 bg-emerald-100/70 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>
                Um comprovante oficial com o protocolo, SLA e dados completos foi enviado
                automaticamente para <strong>{solicitacaoCriada.email}</strong> via SMTP corporativo
                TSB.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSolicitacaoCriada(null)
                setCapacidade('')
                setPeriodo('')
                setObservacoes('')
                setGarantiasSwap('')
              }}
              className="text-xs border-emerald-400 text-emerald-900 hover:bg-emerald-100"
            >
              Nova Solicitação de Acesso
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                document.getElementById('secao-consulta-protocolo')?.scrollIntoView({
                  behavior: 'smooth',
                })
              }}
              className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-semibold"
            >
              <Search className="h-3.5 w-3.5 mr-1" />
              Consultar Andamento Abaixo
            </Button>
          </div>
        </div>
      )}

      {/* FORMULÁRIO AUTOMATIZADO DE SOLICITAÇÃO DE ACESSO (INCISO VII, ART. 10) */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2 text-[#0a2540]">
            <FileText className="h-5 w-5 text-[#0284c7]" />
            <CardTitle className="text-lg font-bold">
              Formulário Eletrônico de Solicitação de Acesso
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-600">
            Preencha os parâmetros técnico-operacionais da contratação pretendida. Os dados
            societários da sua empresa são preenchidos automaticamente com base no perfil
            cadastrado.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {erroEnvio && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <span>{erroEnvio}</span>
              </div>
            )}

            {/* SEÇÃO 1: IDENTIFICAÇÃO DO SOLICITANTE (TRAVADOS DO PERFIL AUTENTICADO) */}
            <div className="space-y-3 p-4 bg-slate-50/80 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0a2540] uppercase tracking-wider flex items-center gap-1.5 font-display">
                  <Building2 className="h-4 w-4 text-[#0284c7]" />
                  1. Identificação do Solicitante (Perfil Autenticado)
                </span>
                <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  Dados Cadastrais Travados
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="solRazaoSocial" className="text-xs font-semibold text-slate-700">
                    Razão Social da Empresa Solicitante
                  </Label>
                  <Input
                    id="solRazaoSocial"
                    value={userRazaoSocial}
                    disabled
                    className="bg-slate-100 text-slate-800 font-semibold cursor-not-allowed text-xs"
                  />
                  <p className="text-[10px] text-slate-500">
                    Preenchida a partir do seu cadastro corporativo na TSB.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="solCnpj" className="text-xs font-semibold text-slate-700">
                    CNPJ
                  </Label>
                  <Input
                    id="solCnpj"
                    value={userCnpj}
                    disabled
                    className="bg-slate-100 text-slate-800 font-mono font-semibold cursor-not-allowed text-xs"
                  />
                  <p className="text-[10px] text-slate-500">
                    Identificação fiscal vinculada à conta autenticada.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="solEmailContato" className="text-xs font-semibold text-slate-700">
                    E-mail de Contato para Notificações *
                  </Label>
                  <Input
                    id="solEmailContato"
                    type="email"
                    required
                    value={emailContato}
                    onChange={(e) => setEmailContato(e.target.value)}
                    placeholder="usuario@empresa.com.br"
                    className="bg-white text-xs"
                    disabled={enviando}
                  />
                  <p className="text-[10px] text-slate-500">
                    Endereço onde o protocolo e os pareceres serão formalmente entregues.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="solResponsavel" className="text-xs font-semibold text-slate-700">
                    Responsável / Representante Legal Cadastrado
                  </Label>
                  <Input
                    id="solResponsavel"
                    value={userResponsavel || 'Representante Legal'}
                    disabled
                    className="bg-slate-100 text-slate-700 cursor-not-allowed text-xs"
                  />
                  <p className="text-[10px] text-slate-500">
                    Art. 10, I: requerente legalmente constituído.
                  </p>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: PARÂMETROS TÉCNICOS DA CONTRATAÇÃO (ART. 10, IV) */}
            <div className="space-y-4 p-4 bg-white rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-[#0a2540] uppercase tracking-wider flex items-center gap-1.5 font-display">
                <FileCheck className="h-4 w-4 text-[#0284c7]" />
                2. Parâmetros Técnico-Operacionais da Demanda (Art. 10, IV)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="solModalidade" className="text-xs font-semibold text-slate-700">
                    Modalidade de Serviço *
                  </Label>
                  <select
                    id="solModalidade"
                    value={modalidade}
                    onChange={(e) => setModalidade(e.target.value as ModalidadeSolicitacao)}
                    className="w-full h-9 px-3 rounded-md border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                    disabled={enviando}
                  >
                    <option value="Firme Ordinário">Firme Ordinário</option>
                    <option value="Interruptível">Interruptível</option>
                    <option value="Troca Operacional">Troca Operacional (Swap)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="solCapacidade" className="text-xs font-semibold text-slate-700">
                    Capacidade Requisitada (m³/dia) *
                  </Label>
                  <Input
                    id="solCapacidade"
                    required
                    type="number"
                    min="1"
                    step="any"
                    placeholder="Ex: 150000"
                    value={capacidade}
                    onChange={(e) => setCapacidade(e.target.value)}
                    className="text-xs font-mono bg-white"
                    disabled={enviando}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="solTrecho" className="text-xs font-semibold text-slate-700">
                    Instalação / Trecho Dutoviário *
                  </Label>
                  <select
                    id="solTrecho"
                    value={trecho}
                    onChange={(e) => setTrecho(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                    disabled={enviando}
                  >
                    <option value="Trecho 1 (Gasoduto Uruguaiana)">
                      Trecho 1 (Gasoduto Uruguaiana - 24&quot;)
                    </option>
                    <option value="Trecho 3 (Gasoduto Triunfo)">
                      Trecho 3 (Gasoduto Triunfo - 18&quot;)
                    </option>
                    <option value="Uruguaiana -> Triunfo (Sistema Completo)">
                      Uruguaiana &rarr; Triunfo (Sistema Completo TSB)
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="solPontoRecebimento"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Ponto de Recebimento / Injeção (Art. 10, IV) *
                  </Label>
                  <select
                    id="solPontoRecebimento"
                    value={pontoRecebimento}
                    onChange={(e) => setPontoRecebimento(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                    disabled={enviando}
                  >
                    <option value="Paso de Los Libres (Fronteira Brasil/Argentina)">
                      Paso de Los Libres (Fronteira Brasil/Argentina)
                    </option>
                    <option value="Canoas (Interconexão TBG)">Canoas (Interconexão TBG)</option>
                    <option value="EMED Uruguaiana">EMED Uruguaiana</option>
                    <option value="EMED Triunfo">EMED Triunfo</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="solPontoEntrega" className="text-xs font-semibold text-slate-700">
                    Ponto de Entrega / Retirada (Art. 10, IV) *
                  </Label>
                  <select
                    id="solPontoEntrega"
                    value={pontoEntrega}
                    onChange={(e) => setPontoEntrega(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                    disabled={enviando}
                  >
                    <option value="Triunfo (Polo Petroquímico)">Triunfo (Polo Petroquímico)</option>
                    <option value="Uruguaiana (UTE Uruguaiana)">Uruguaiana (UTE Uruguaiana)</option>
                    <option value="Canoas (Interconexão TBG)">Canoas (Interconexão TBG)</option>
                    <option value="Paso de Los Libres">Paso de Los Libres</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="solPeriodo"
                  className="text-xs font-semibold text-slate-700 flex items-center justify-between"
                >
                  <span>Período Desejado de Prestação do Serviço (Art. 10, II) *</span>
                  <span className="text-[10px] text-sky-700 font-normal">
                    Exigência Regulamentar
                  </span>
                </Label>
                <Input
                  id="solPeriodo"
                  required
                  placeholder="Ex: 01/01/2027 a 31/12/2027 ou Período Safra Out/2026 a Mar/2027"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="bg-white text-xs"
                  disabled={enviando}
                />
              </div>

              {/* SE TROCA OPERACIONAL: GARANTIAS DO ART. 10, §1º */}
              {modalidade === 'Troca Operacional' && (
                <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-lg space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="solGarantiasSwap"
                      className="text-xs font-bold text-purple-950 flex items-center gap-1.5"
                    >
                      <span>
                        Garantias de Segurança e Confiabilidade Operacional (Swap - Art. 10, §1º) *
                      </span>
                    </Label>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                      Obrigatório para Swap
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-900 leading-relaxed">
                    Em conformidade com o §1º do Art. 10 da Resolução ANP nº 11/2016, a solicitação
                    de acesso na modalidade de Troca Operacional deve especificar as garantias de
                    segurança e confiabilidade operacional oferecidas pelo solicitante.
                  </p>
                  <Textarea
                    id="solGarantiasSwap"
                    required
                    rows={3}
                    placeholder="Descreva detalhadamente o lastro físico, disponibilidade de gás nos pontos de injeção, salvaguardas contratuais e planos de contingência técnica..."
                    value={garantiasSwap}
                    onChange={(e) => setGarantiasSwap(e.target.value)}
                    className="bg-white text-xs resize-y"
                    disabled={enviando}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="solObservacoes" className="text-xs font-semibold text-slate-700">
                  Observações e Informações Complementares (Opcional)
                </Label>
                <Textarea
                  id="solObservacoes"
                  rows={2}
                  placeholder="Particularidades técnicas sobre pressão de entrega, especificações físico-químicas ou regime operacional..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="bg-white text-xs resize-y"
                  disabled={enviando}
                />
              </div>
            </div>

            {/* AVISO REGULATÓRIO E BOTÃO DE SUBMISSÃO */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Ao submeter este formulário, o registro será formalizado na fila regulatória de
                  acesso da TSB, gerando o <strong>Protocolo TSB-AAAA-XXXX</strong> com prazo de
                  resposta de <strong>20 dias úteis</strong> (Art. 10, §2º da Res. ANP nº 11/2016).
                  Os dados cadastrais estão resguardados nos termos da LGPD, sendo o resumo técnico
                  agregado publicado no Portal de Transparência (Art. 9º, VII).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
              <Button
                type="submit"
                disabled={enviando}
                className="bg-[#0a2540] hover:bg-[#143b73] text-white text-sm font-semibold px-6 py-2.5 h-auto cursor-pointer shadow-sm"
              >
                {enviando ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Protocolando Solicitação...
                  </>
                ) : (
                  <>
                    <FileCheck className="h-4 w-4 mr-2" />
                    Enviar Solicitação de Acesso
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* CAMPO DE PESQUISA POR PROTOCOLO JÁ ABERTO NA MESMA PÁGINA (CONSULTA PÚBLICA EXISTENTE) */}
      <div id="secao-consulta-protocolo" className="space-y-4">
        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-[#0a2540]">
                <Search className="h-5 w-5 text-[#0284c7]" />
                <CardTitle className="text-base font-bold">
                  Consulta de Solicitação por Protocolo (Art. 10 da Res. ANP 11/2016)
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] bg-white font-normal text-slate-500">
                100% LGPD-Compliant
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-600">
              Acompanhe em tempo real o status, o parecer fundamentado e o SLA regulatório da sua
              solicitação através do número do protocolo.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            <form
              onSubmit={handleBuscarProtocolo}
              className="flex flex-col sm:flex-row gap-2 max-w-xl"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Ex: TSB-2026-8942"
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-9 font-mono text-xs uppercase"
                  disabled={buscando}
                />
              </div>
              <Button
                type="submit"
                disabled={buscando || !termoBusca.trim()}
                className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-semibold px-4 cursor-pointer"
              >
                {buscando ? (
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

            {/* RESULTADO DA CONSULTA POR PROTOCOLO */}
            {resultadoBusca && resultadoBusca.executado && (
              <div className="animate-fade-in pt-2">
                {resultadoBusca.encontrado && resultadoBusca.dados ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                          Protocolo Localizado
                        </span>
                        <span className="font-mono text-lg font-bold text-[#0284c7]">
                          {resultadoBusca.dados.protocolo}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          resultadoBusca.dados.status?.includes('Confirmação') ||
                          resultadoBusca.dados.status === 'Aprovada'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : resultadoBusca.dados.status?.includes('Negativa') ||
                                resultadoBusca.dados.status === 'Rejeitada'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : resultadoBusca.dados.status?.includes('Aprofundamento')
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {resultadoBusca.dados.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Modalidade:</span>
                        <strong className="text-slate-900">
                          {resultadoBusca.dados.modalidade}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Capacidade:</span>
                        <strong className="text-slate-900 font-mono">
                          {resultadoBusca.dados.capacidade?.toLocaleString('pt-BR')} m³/dia
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Trecho:</span>
                        <strong className="text-slate-900">{resultadoBusca.dados.trecho}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">SLA Regulatório:</span>
                        <strong className="text-emerald-700 font-bold">
                          {resultadoBusca.dados.sla_dias || 20} dias úteis
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Ponto de Injeção:</span>
                        <strong className="text-slate-900">
                          {resultadoBusca.dados.ponto_recebimento || '-'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Ponto de Entrega:</span>
                        <strong className="text-slate-900">
                          {resultadoBusca.dados.ponto_entrega || '-'}
                        </strong>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500 block">Período Demandado:</span>
                        <strong className="text-slate-900">
                          {resultadoBusca.dados.periodo || '-'}
                        </strong>
                      </div>
                    </div>

                    {/* PARECER TÉCNICO FUNDAMENTADO */}
                    <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-1">
                      <span className="text-xs font-bold text-[#0a2540] block">
                        Parecer Técnico Fundamentado da TSB (Art. 10 da Res. ANP 11/2016):
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed italic text-justify">
                        &quot;
                        {resultadoBusca.dados.parecer_fundamentado ||
                          'Solicitação em processo de análise de viabilidade técnico-operacional e verificação de capacidade ociosa.'}
                        &quot;
                      </p>
                    </div>

                    {/* ELEMENTOS DE DESFECHO QUANDO HOUVER */}
                    {resultadoBusca.dados.desfecho_tipo === 'CONFIRMACAO' &&
                      resultadoBusca.dados.termos_condicoes && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-950">
                          <strong>Termos e Condições Homologados (Desfecho I):</strong>{' '}
                          {resultadoBusca.dados.termos_condicoes}
                        </div>
                      )}

                    {resultadoBusca.dados.desfecho_tipo === 'APROFUNDAMENTO' && (
                      <div className="p-3 bg-sky-50 border border-sky-200 rounded-md text-xs text-sky-950 space-y-1">
                        <strong>Aprofundamento da Análise Técnica (Desfecho II):</strong>
                        {resultadoBusca.dados.aprofundamento_condicoes && (
                          <div>
                            &bull; Condições: {resultadoBusca.dados.aprofundamento_condicoes}
                          </div>
                        )}
                        {resultadoBusca.dados.aprofundamento_escopo && (
                          <div>&bull; Escopo: {resultadoBusca.dados.aprofundamento_escopo}</div>
                        )}
                        {resultadoBusca.dados.aprofundamento_cronograma && (
                          <div>
                            &bull; Cronograma: {resultadoBusca.dados.aprofundamento_cronograma}
                          </div>
                        )}
                      </div>
                    )}

                    {resultadoBusca.dados.desfecho_tipo === 'NEGATIVA' &&
                      resultadoBusca.dados.previsao_disponibilidade && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-950">
                          <strong>Previsão de Disponibilidade (Desfecho III):</strong>{' '}
                          {resultadoBusca.dados.previsao_disponibilidade}
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Protocolo não localizado</span>
                      <span>
                        Nenhum registro encontrado para o protocolo{' '}
                        <strong className="font-mono">{termoBusca}</strong>. Verifique o número
                        digitado (ex: TSB-2026-8942) e tente novamente.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RODAPÉ INFORMATIVO REGULATÓRIO */}
      <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200 space-y-1">
        <p>
          Transportadora Sulbrasileira de Gás S.A. &bull; Resolução ANP nº 11, de 16/03/2016 &bull;
          Lei nº 14.134/2021 (Nova Lei do Gás)
        </p>
        <p>
          Para dúvidas regulatórias ou suporte operacional:{' '}
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
