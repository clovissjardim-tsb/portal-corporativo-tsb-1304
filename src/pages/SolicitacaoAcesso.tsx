import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
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
  FileText,
  AlertCircle,
  Building2,
  ArrowLeft,
  RefreshCw,
  Send,
  HelpCircle,
  FileCheck,
  Copy,
  Lock,
  KeyRound,
  Download,
} from 'lucide-react'

export default function SolicitacaoAcesso() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { toast } = useToast()

  // Estado da Tela de Login Fictícia / Simulada
  const [loginSimuladoLiberado, setLoginSimuladoLiberado] = useState<boolean>(false)
  const [loginUsuario, setLoginUsuario] = useState<string>('')
  const [loginSenha, setLoginSenha] = useState<string>('')
  const [autenticandoSimulacao, setAutenticandoSimulacao] = useState<boolean>(false)
  const [erroLoginSimulado, setErroLoginSimulado] = useState<string | null>(null)
  const [usuarioAutenticadoSimulado, setUsuarioAutenticadoSimulado] = useState<string>('')

  // Handler de submissão do Login Fictício / Simulado (aceita qualquer credencial ou campos em branco)
  const handleLoginSimuladoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroLoginSimulado(null)
    setAutenticandoSimulacao(true)

    const usuarioLimpo = loginUsuario.trim() || 'usuario_carregador'

    // Garante que haja sessão ativa no PocketBase em segundo plano para persistência de dados
    if (!isAuthenticated) {
      try {
        await pb.collection('users').authWithPassword('clovissjardim@gmail.com', 'Skip@Pass')
      } catch (err) {
        console.warn('Aviso: sessão simulada Inciso VII sem conexão direta:', err)
      }
    }

    // Micro-delay visual para feedback de simulação
    setTimeout(() => {
      setAutenticandoSimulacao(false)
      setUsuarioAutenticadoSimulado(usuarioLimpo)
      setLoginSimuladoLiberado(true)
    }, 800)
  }

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

  // Estado do Histórico de Protocolos do Carregador Autenticado (igual ao Meus Protocolos do POC)
  const [historicoSolicitacoes, setHistoricoSolicitacoes] = useState<SolicitacaoIncisoVII[]>([])
  const [carregandoHistorico, setCarregandoHistorico] = useState<boolean>(false)

  // Carrega histórico de solicitações da conta autenticada
  const carregarHistorico = useCallback(async () => {
    setCarregandoHistorico(true)
    try {
      const emailFiltro = emailContato || userEmailInicial || (user?.email as string) || ''
      const cnpjFiltro = userCnpj || (user?.cnpj as string) || ''
      const lista = await solicitacoesService.listarDoUsuario({
        email: emailFiltro,
        cnpj: cnpjFiltro,
      })
      setHistoricoSolicitacoes(lista)
    } catch (err) {
      console.warn('Erro ao carregar histórico de solicitações Inciso VII:', err)
    } finally {
      setCarregandoHistorico(false)
    }
  }, [emailContato, userEmailInicial, user?.email, userCnpj, user?.cnpj])

  // Dispara o carregamento do histórico assim que o acesso autenticado é liberado
  useEffect(() => {
    if (loginSimuladoLiberado) {
      carregarHistorico()
    }
  }, [loginSimuladoLiberado, carregarHistorico])

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

      // Atualiza a listagem do histórico com a nova solicitação
      carregarHistorico()

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

  const handleCopiarProtocolo = (proto: string) => {
    navigator.clipboard?.writeText(proto)
    toast({
      title: 'Protocolo copiado!',
      description: `${proto} copiado para a área de transferência.`,
    })
  }

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

  // TELA DE LOGIN FICTÍCIA / SIMULADA (PRIMEIRO ELEMENTO ANTES DO FORMULÁRIO)
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
              Área Restrita TSB
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0a2540] font-display">
              Acesso do Carregador
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              Solicitação de Acesso (Art. 10, Res. ANP nº 11/2016)
            </p>
          </div>

          {/* INDICATIVO DE AMBIENTE DE DEMONSTRAÇÃO / SESSÃO ATUAL */}
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
              <Label htmlFor="loginUsuario" className="text-xs font-semibold text-slate-700">
                Usuário do Carregador
              </Label>
              <Input
                id="loginUsuario"
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
                <Label htmlFor="loginSenha" className="text-xs font-semibold text-slate-700">
                  Senha
                </Label>
                <span className="text-[11px] text-slate-400">Opcional</span>
              </div>
              <Input
                id="loginSenha"
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
                    Entrar na Área Segura
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* RODAPÉ DO CARD DE LOGIN */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200">
            <Link
              to="/transparencia"
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao Portal
            </Link>
            <span className="text-[11px] text-slate-400">TSB S.A. &bull; Res. ANP nº 11/2016</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* NAVEGAÇÃO SUPERIOR DE RETORNO E CONFIRMAÇÃO DE SESSÃO AUTENTICADA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <Link
          to="/transparencia"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0a2540] font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para Transparência (Art. 9º, VII)
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>
            Sessão autenticada &mdash;{' '}
            <strong className="text-emerald-950 font-semibold font-sans">
              {usuarioAutenticadoSimulado || userEmailInicial || 'Carregador'}
            </strong>
          </span>
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
          Solicitação de Acesso à Capacidade de Transporte
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
                  <Clock className="h-4 w-4 text-sky-600 shrink-0" />
                  <span>Histórico de Protocolos</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-justify">
                  O andamento e os pareceres podem ser acompanhados na seção{' '}
                  <strong>Meus Protocolos</strong> logo abaixo nesta página, com o protocolo{' '}
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
                document.getElementById('secao-historico-protocolos')?.scrollIntoView({
                  behavior: 'smooth',
                })
              }}
              className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-semibold"
            >
              <Clock className="h-3.5 w-3.5 mr-1" />
              Ver Meus Protocolos Abaixo
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

      {/* SEÇÃO "MEUS PROTOCOLOS": HISTÓRICO DE SOLICITAÇÕES DO CARREGADOR AUTENTICADO (IGUAL AO POC) */}
      <div id="secao-historico-protocolos" className="space-y-4">
        <Card className="border border-slate-200 shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-[#0a2540] font-display flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#0284c7]" />
                Meus Protocolos · Solicitação de Acesso (Inciso VII)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Listagem completa de solicitações e status da conta autenticada, com detalhes
                técnicos, parecer regulatório e download do formulário anexado
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
              <RefreshCw className={`h-3 w-3 mr-1 ${carregandoHistorico ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </CardHeader>

          <CardContent className="pt-4">
            {historicoSolicitacoes.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Clock className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium text-slate-600">
                  Nenhuma solicitação registrada por esta conta até o momento.
                </p>
                <p className="text-[11px] text-slate-400">
                  Preencha o formulário eletrônico acima para protocolar sua primeira Solicitação de
                  Acesso (Art. 10 da Resolução ANP nº 11/2016).
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {historicoSolicitacoes.map((sub) => {
                  const urlArquivo = solicitacoesService.obterUrlArquivo(sub)

                  return (
                    <div
                      key={sub.id}
                      className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg space-y-3"
                    >
                      {/* CABEÇALHO DO PROTOCOLO */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#0a2540]">
                            {sub.protocolo}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300 font-semibold uppercase">
                            Inciso VII • {sub.modalidade}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                              sub.status?.includes('Confirmação') || sub.status === 'Aprovada'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : sub.status?.includes('Negativa') || sub.status === 'Rejeitada'
                                  ? 'bg-red-50 text-red-800 border-red-300'
                                  : sub.status?.includes('Aprofundamento')
                                    ? 'bg-sky-50 text-sky-800 border-sky-300'
                                    : 'bg-blue-50 text-blue-800 border-blue-300'
                            }`}
                          >
                            {sub.status || 'Solicitação Recebida - Em Análise Técnica'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span>{new Date(sub.created).toLocaleString('pt-BR')}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopiarProtocolo(sub.protocolo)}
                            className="h-6 px-1.5 text-slate-500 hover:text-[#0284c7]"
                            title="Copiar Protocolo"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* DADOS SENSÍVEIS E CADASTRAIS (LGPD OK NA ÁREA AUTENTICADA) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px] bg-white p-3 rounded border border-slate-200">
                        <div>
                          <span className="text-slate-500 block">Razão Social:</span>
                          <strong className="text-slate-900 font-medium">{sub.razao_social}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">CNPJ / MF:</span>
                          <strong className="text-slate-900 font-mono">{sub.cnpj}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">E-mail Cadastrado:</span>
                          <span className="text-[#0284c7] font-mono truncate block">
                            {sub.email}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Representante Legal:</span>
                          <strong className="text-slate-900">
                            {sub.representante_legal || 'Representante Legal'}
                          </strong>
                        </div>
                      </div>

                      {/* DETALHAMENTO TÉCNICO E OPERACIONAL */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px] bg-white p-3 rounded border border-slate-200">
                        <div>
                          <span className="text-slate-500 block">Capacidade Requisitada:</span>
                          <strong className="text-slate-900 font-mono">
                            {Number(sub.capacidade || 0).toLocaleString('pt-BR')} m³/dia
                          </strong>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {sub.trecho || 'Gasoduto TSB'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Ponto de Recebimento:</span>
                          <strong className="text-emerald-900 block truncate">
                            {sub.ponto_recebimento || '—'}
                          </strong>
                          <span className="text-[10px] text-slate-500 block">Injeção</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Ponto de Entrega:</span>
                          <strong className="text-sky-900 block truncate">
                            {sub.ponto_entrega || '—'}
                          </strong>
                          <span className="text-[10px] text-slate-500 block">Retirada</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Período / SLA Regulatório:</span>
                          <strong className="text-slate-900 block truncate">
                            {sub.periodo || '—'}
                          </strong>
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            SLA: {sub.sla_dias || 20} dias úteis
                          </span>
                        </div>
                      </div>

                      {/* SE MODALIDADE SWAP: GARANTIAS INFORMADAS */}
                      {sub.modalidade === 'Troca Operacional' && sub.garantias_seguranca_swap && (
                        <div className="p-2.5 bg-purple-50/70 rounded border border-purple-200 text-[11px] text-purple-950 space-y-1">
                          <strong className="block uppercase tracking-wider text-[10px] text-purple-900">
                            Garantias de Segurança e Confiabilidade Operacional (Swap - Art. 10,
                            §1º):
                          </strong>
                          <p className="leading-relaxed">{sub.garantias_seguranca_swap}</p>
                        </div>
                      )}

                      {/* PARECER TÉCNICO FUNDAMENTADO */}
                      {sub.parecer_fundamentado && (
                        <div className="p-2.5 bg-blue-50/70 rounded border border-blue-200 text-[11px] text-slate-700 space-y-1">
                          <strong className="text-[#0a2540] block uppercase tracking-wider text-[10px]">
                            Parecer Regulatório TSB (Art. 10 da Res. ANP 11/2016):
                          </strong>
                          <p className="leading-relaxed">{sub.parecer_fundamentado}</p>
                        </div>
                      )}

                      {/* DESFECHOS REGULATÓRIOS (QUANDO HOUVER) */}
                      {sub.desfecho_tipo === 'CONFIRMACAO' && sub.termos_condicoes && (
                        <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 text-[11px] text-emerald-950">
                          <strong>Termos e Condições Homologados (Desfecho I):</strong>{' '}
                          {sub.termos_condicoes}
                        </div>
                      )}

                      {sub.desfecho_tipo === 'APROFUNDAMENTO' && (
                        <div className="p-2.5 bg-sky-50 rounded border border-sky-200 text-[11px] text-sky-950 space-y-0.5">
                          <strong>Aprofundamento da Análise Técnica (Desfecho II):</strong>
                          {sub.aprofundamento_condicoes && (
                            <div>&bull; Condições: {sub.aprofundamento_condicoes}</div>
                          )}
                          {sub.aprofundamento_escopo && (
                            <div>&bull; Escopo: {sub.aprofundamento_escopo}</div>
                          )}
                          {sub.aprofundamento_cronograma && (
                            <div>&bull; Cronograma: {sub.aprofundamento_cronograma}</div>
                          )}
                        </div>
                      )}

                      {sub.desfecho_tipo === 'NEGATIVA' && sub.previsao_disponibilidade && (
                        <div className="p-2.5 bg-red-50 rounded border border-red-200 text-[11px] text-red-950">
                          <strong>Previsão de Disponibilidade (Desfecho III):</strong>{' '}
                          {sub.previsao_disponibilidade}
                        </div>
                      )}

                      {/* ARQUIVOS ANEXADOS (DOWNLOADS QUANDO HOUVER) */}
                      {urlArquivo && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200">
                          <span className="text-[11px] font-semibold text-slate-600 mr-2">
                            Documento Anexo:
                          </span>
                          <a
                            href={urlArquivo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[11px] text-[#0a2540] font-medium transition-colors"
                          >
                            <Download className="h-3 w-3 text-[#0284c7]" />
                            Formulário / Anexo Assinado (PDF)
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
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
