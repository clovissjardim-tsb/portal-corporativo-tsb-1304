import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  solicitacoesService,
  type SolicitacaoIncisoVII,
  type ResumoPublicoSolicitacao,
  type ResumoPublicoInstalacao,
  type ModalidadeSolicitacao,
} from '@/services/solicitacoes'
import { cessoesService, type OfertaCessaoPublica } from '@/services/cessoes'
import { Radio, Layers } from 'lucide-react'
import BoletimEletronico from '@/components/BoletimEletronicoOficial'
import PlataformaEletronica from '@/components/PlataformaEletronicaOficial'

export default function Transparencia() {
  const { toast } = useToast()

  // Pilar ativo: 'boletim' | 'plataforma'
  const [activePilar, setActivePilar] = useState<'boletim' | 'plataforma'>('boletim')

  // Sub-abas da Plataforma: 'i_vi' | 'vii' | 'viii'
  const [subAbaPlataforma, setSubAbaPlataforma] = useState<'i_vi' | 'vii' | 'viii'>('i_vi')

  // Filtros da Programação Mensal
  const [filtroAnoMensal, setFiltroAnoMensal] = useState('2026')
  const [filtroMesMensal, setFiltroMesMensal] = useState('Setembro')

  // Formulário do Inciso VII (Arts. 9º e 10 da Res. ANP 11/2016)
  const [formVII, setFormVII] = useState({
    razao_social: '',
    cnpj: '',
    email: '',
    modalidade: '' as '' | ModalidadeSolicitacao,
    capacidade: '',
    trecho: '',
    ponto_recebimento: '',
    ponto_entrega: '',
    periodo: '',
    garantias_seguranca_swap: '',
  })
  const [submetendoVII, setSubmetendoVII] = useState(false)
  const [erroFormVII, setErroFormVII] = useState<string | null>(null)

  // Consulta de protocolo Inciso VII
  const [consultaProtocolo, setConsultaProtocolo] = useState('')
  const [consultandoSLA, setConsultandoSLA] = useState(false)
  const [resultadoConsulta, setResultadoConsulta] = useState<{
    buscado: boolean
    encontrado: boolean
    dados?: SolicitacaoIncisoVII
  } | null>(null)

  // Resumo público agregado do Inciso VII (Art. 9º, VII - sem dados pessoais)
  const [resumoPublicoVII, setResumoPublicoVII] = useState<ResumoPublicoSolicitacao[]>([])
  const [resumoInstalacaoVII, setResumoInstalacaoVII] = useState<ResumoPublicoInstalacao[]>([])
  const [carregandoResumoVII, setCarregandoResumoVII] = useState(false)

  // Ofertas de Cessão do Inciso VIII (Públicas, sem e-mail/contato pessoal)
  const [ofertasCessao, setOfertasCessao] = useState<OfertaCessaoPublica[]>([])
  const [carregandoCessoes, setCarregandoCessoes] = useState(false)
  const [mostrarFormCessao, setMostrarFormCessao] = useState(false)
  const [formCessao, setFormCessao] = useState({
    cedente: '',
    trecho: '',
    capacidade_ociosa: '',
    periodo_contratual: '',
    contato: '',
    observacoes: '',
  })
  const [submetendoCessao, setSubmetendoCessao] = useState(false)
  const [erroFormCessao, setErroFormCessao] = useState<string | null>(null)

  // Carregar dados de resumo público do Inciso VII (Pontos e Instalações de Transporte)
  const carregarResumoVII = useCallback(async () => {
    setCarregandoResumoVII(true)
    try {
      const [dadosPontos, dadosInstalacoes] = await Promise.all([
        solicitacoesService.obterResumoPublico(),
        solicitacoesService.obterResumoPorInstalacao(),
      ])
      setResumoPublicoVII(dadosPontos)
      setResumoInstalacaoVII(dadosInstalacoes)
    } catch {
      // Ignora erro
    } finally {
      setCarregandoResumoVII(false)
    }
  }, [])

  // Carregar ofertas de cessão do Inciso VIII (dados públicos higienizados pela LGPD)
  const carregarOfertasCessao = useCallback(async () => {
    setCarregandoCessoes(true)
    try {
      const lista = await cessoesService.listarPublico()
      setOfertasCessao(lista)
    } catch {
      // Ignora erro
    } finally {
      setCarregandoCessoes(false)
    }
  }, [])

  useEffect(() => {
    if (activePilar === 'plataforma' && subAbaPlataforma === 'vii') {
      carregarResumoVII()
    } else if (activePilar === 'plataforma' && subAbaPlataforma === 'viii') {
      carregarOfertasCessao()
    }
  }, [activePilar, subAbaPlataforma, carregarResumoVII, carregarOfertasCessao])

  // Submissão do Inciso VII (com período obrigatório)
  const handleSubmeterVII = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroFormVII(null)

    if (
      !formVII.razao_social ||
      !formVII.cnpj ||
      !formVII.email ||
      !formVII.modalidade ||
      !formVII.capacidade ||
      !formVII.trecho ||
      !formVII.ponto_recebimento ||
      !formVII.ponto_entrega ||
      !formVII.periodo
    ) {
      setErroFormVII(
        'Por favor, preencha todos os campos obrigatórios marcados com *, incluindo Pontos de Recebimento e Entrega e o Período.',
      )
      return
    }

    if (formVII.modalidade === 'Troca Operacional' && !formVII.garantias_seguranca_swap.trim()) {
      setErroFormVII(
        'Para a modalidade de Troca Operacional (swap), é obrigatório indicar as garantias de segurança e confiabilidade da injeção e retirada (Art. 10, §1º).',
      )
      return
    }

    const capacidadeNum = Number(formVII.capacidade)
    if (isNaN(capacidadeNum) || capacidadeNum <= 0) {
      setErroFormVII('A capacidade solicitada deve ser um número positivo.')
      return
    }

    setSubmetendoVII(true)

    try {
      const nova = await solicitacoesService.criar({
        razao_social: formVII.razao_social.trim(),
        cnpj: formVII.cnpj.trim(),
        email: formVII.email.trim(),
        modalidade: formVII.modalidade as ModalidadeSolicitacao,
        capacidade: capacidadeNum,
        trecho: formVII.trecho.trim(),
        ponto_recebimento: formVII.ponto_recebimento.trim(),
        ponto_entrega: formVII.ponto_entrega.trim(),
        periodo: formVII.periodo.trim(),
        garantias_seguranca_swap:
          formVII.modalidade === 'Troca Operacional'
            ? formVII.garantias_seguranca_swap.trim()
            : undefined,
      })

      toast({
        title: 'Solicitação Submetida com Sucesso!',
        description: `Protocolo ANP gerado: ${nova.protocolo}. E-mail de confirmação enviado para ${nova.email}. Prazo de resposta: 20 dias úteis.`,
      })

      // Limpa formulário
      setFormVII({
        razao_social: '',
        cnpj: '',
        email: '',
        modalidade: '',
        capacidade: '',
        trecho: '',
        ponto_recebimento: '',
        ponto_entrega: '',
        periodo: '',
        garantias_seguranca_swap: '',
      })

      // Atualiza o resumo agregado e a consulta
      carregarResumoVII()
      setConsultaProtocolo(nova.protocolo)
      setResultadoConsulta({
        buscado: true,
        encontrado: true,
        dados: nova,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao submeter solicitação de acesso.'
      setErroFormVII(msg)
    } finally {
      setSubmetendoVII(false)
    }
  }

  // Consulta de SLA / Protocolo
  const handleVerificarSLA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consultaProtocolo.trim()) return

    setConsultandoSLA(true)
    try {
      const record = await solicitacoesService.buscarPorProtocolo(consultaProtocolo.trim())
      if (record) {
        setResultadoConsulta({
          buscado: true,
          encontrado: true,
          dados: record,
        })
      } else {
        setResultadoConsulta({
          buscado: true,
          encontrado: false,
        })
      }
    } catch {
      setResultadoConsulta({
        buscado: true,
        encontrado: false,
      })
    } finally {
      setConsultandoSLA(false)
    }
  }

  // Submissão do Formulário de Cessão (Inciso VIII)
  const handleSubmeterCessao = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroFormCessao(null)

    if (
      !formCessao.cedente ||
      !formCessao.trecho ||
      !formCessao.capacidade_ociosa ||
      !formCessao.periodo_contratual ||
      !formCessao.contato
    ) {
      setErroFormCessao('Por favor, preencha todos os campos obrigatórios da oferta de cessão.')
      return
    }

    const capacidadeNum = Number(formCessao.capacidade_ociosa)
    if (isNaN(capacidadeNum) || capacidadeNum <= 0) {
      setErroFormCessao('A capacidade ociosa deve ser um número positivo.')
      return
    }

    setSubmetendoCessao(true)
    try {
      await cessoesService.criar({
        cedente: formCessao.cedente.trim(),
        trecho: formCessao.trecho.trim(),
        capacidade_ociosa: capacidadeNum,
        periodo_contratual: formCessao.periodo_contratual.trim(),
        contato: formCessao.contato.trim(),
        observacoes: formCessao.observacoes.trim() || undefined,
      })

      toast({
        title: 'Oferta de Cessão Publicada com Sucesso!',
        description: 'A oferta já está visível no painel público do Inciso VIII.',
      })

      setFormCessao({
        cedente: '',
        trecho: '',
        capacidade_ociosa: '',
        periodo_contratual: '',
        contato: '',
        observacoes: '',
      })
      setMostrarFormCessao(false)
      carregarOfertasCessao()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar oferta de cessão.'
      setErroFormCessao(msg)
    } finally {
      setSubmetendoCessao(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-blue-50 border border-blue-200/80 text-[10px] font-bold tracking-wider uppercase text-[#143b73] font-display">
          <span>Regulação ANP</span>
          <span>•</span>
          <span>Acesso Público</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0a1d37] font-display">
          Portal de Transparência Regulatória
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-4xl">
          Acesso público e irrestrito às informações técnicas, operacionais e comerciais do sistema
          dutoviário TSB, em cumprimento integral à regulamentação expedida pela ANP.
        </p>
      </div>
      {/* SELEÇÃO DE PILARES (2 CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PILAR 1: BOLETIM ELETRÔNICO */}
        <button
          type="button"
          onClick={() => setActivePilar('boletim')}
          className={`text-left p-5 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
            activePilar === 'boletim'
              ? 'border-[#143b73] bg-[#f0f9ff] shadow-sm'
              : 'border-slate-200 bg-white hover:border-[#143b73]/40 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#e0f2fe] text-[#0e2b54] font-display">
              Acesso Livre
            </span>
            <span className="text-xs font-semibold text-slate-500 font-display">
              Portaria ANP nº 1/2003
            </span>
          </div>
          <h3 className="text-lg font-bold text-[#0a1d37] flex items-center gap-2 font-display">
            <Radio className="h-5 w-5 text-[#143b73]" />
            Boletim Eletrônico
          </h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Instalações de transporte e serviços prestados, quantidades programadas e realizadas nos
            Trechos 1 e 3 e modelos regulatórios.
          </p>
        </button>

        {/* PILAR 2: PLATAFORMA ELETRÔNICA */}
        <button
          type="button"
          onClick={() => setActivePilar('plataforma')}
          className={`text-left p-5 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
            activePilar === 'plataforma'
              ? 'border-[#059669] bg-[#f0fdf4] shadow-sm'
              : 'border-slate-200 bg-white hover:border-[#059669]/50 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] font-display">
              Acesso Livre
            </span>
            <span className="text-xs font-semibold text-slate-500 font-display">
              Resolução ANP nº 11/2016 (Arts. 9º e 10)
            </span>
          </div>
          <h3 className="text-lg font-bold text-[#0a1d37] flex items-center gap-2 font-display">
            <Layers className="h-5 w-5 text-[#059669]" />
            Plataforma Eletrônica
          </h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Incisos I a VIII: fluxos físicos, fluxo oposto, previsões rolantes, resumo agregado,
            solicitação de acesso e ofertas de cessão.
          </p>
        </button>
      </div>
      {/* CONTEÚDO DO PILAR ATIVO */}
      {/* PILAR 1: BOLETIM ELETRÔNICO (FORMATO OFICIAL TSB) */}
      {activePilar === 'boletim' && (
        <BoletimEletronico
          filtroAnoMensal={filtroAnoMensal}
          setFiltroAnoMensal={setFiltroAnoMensal}
          filtroMesMensal={filtroMesMensal}
          setFiltroMesMensal={setFiltroMesMensal}
        />
      )}
      {/* PILAR 2: PLATAFORMA ELETRÔNICA (ESPELHANDO FIELMENTE A PÁGINA OFICIAL DA TSB) */}
      {activePilar === 'plataforma' && (
        <PlataformaEletronica
          subAba={subAbaPlataforma}
          setSubAba={setSubAbaPlataforma}
          formVII={formVII}
          setFormVII={setFormVII}
          submetendoVII={submetendoVII}
          erroFormVII={erroFormVII}
          handleSubmeterVII={handleSubmeterVII}
          consultaProtocolo={consultaProtocolo}
          setConsultaProtocolo={setConsultaProtocolo}
          consultandoSLA={consultandoSLA}
          handleVerificarSLA={handleVerificarSLA}
          resultadoConsulta={resultadoConsulta}
          resumoPublicoVII={resumoPublicoVII}
          resumoInstalacaoVII={resumoInstalacaoVII}
          carregandoResumoVII={carregandoResumoVII}
          carregarResumoVII={carregarResumoVII}
          ofertasCessao={ofertasCessao}
          carregandoCessoes={carregandoCessoes}
          carregarOfertasCessao={carregarOfertasCessao}
          mostrarFormCessao={mostrarFormCessao}
          setMostrarFormCessao={setMostrarFormCessao}
          formCessao={formCessao}
          setFormCessao={setFormCessao}
          submetendoCessao={submetendoCessao}
          erroFormCessao={erroFormCessao}
          handleSubmeterCessao={handleSubmeterCessao}
        />
      )}{' '}
    </div>
  )
}
