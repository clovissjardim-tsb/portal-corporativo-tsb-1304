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
import { Radio, Layers, Activity } from 'lucide-react'
import BoletimEletronico from '@/components/BoletimEletronicoOficial'
import PlataformaEletronica from '@/components/PlataformaEletronicaOficial'
import BlocoMonitoramentoOficial from '@/components/BlocoMonitoramentoOficial'

export default function Transparencia() {
  const { toast } = useToast()

  // Pilar ativo: 'boletim' | 'plataforma' | 'monitoramento'
  const [activePilar, setActivePilar] = useState<'boletim' | 'plataforma' | 'monitoramento'>(
    'boletim',
  )

  // Sub-abas da Plataforma: 'i_vi' | 'vii' | 'viii'
  const [subAbaPlataforma, setSubAbaPlataforma] = useState<'i_vi' | 'vii' | 'viii'>('i_vi')

  // Filtros da Programação Mensal
  const [filtroAnoMensal, setFiltroAnoMensal] = useState('2026')
  const [filtroMesMensal, setFiltroMesMensal] = useState('Setembro')

  // Consulta de protocolo Inciso VII (mantida intacta)
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
      {/* SELEÇÃO DE PILARES EM 3 BLOCOS DE TOPO (PADRÃO CONCORRENTES TAG/NTS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* BLOCO 1: BOLETIM ELETRÔNICO */}
        <button
          type="button"
          onClick={() => setActivePilar('boletim')}
          className={`text-left p-5 rounded-lg border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activePilar === 'boletim'
              ? 'border-[#143b73] bg-[#f0f9ff] shadow-sm'
              : 'border-slate-200 bg-white hover:border-[#143b73]/40 hover:bg-slate-50'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#e0f2fe] text-[#0e2b54] font-display">
                Bloco 1 • Livre
              </span>
              <span className="text-xs font-semibold text-slate-500 font-display">
                Portaria ANP nº 1/2003
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#0a1d37] flex items-center gap-2 font-display">
              <Radio className="h-5 w-5 text-[#143b73] shrink-0" />
              Boletim Eletrônico
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Itens I e II: instalações e serviços, alíneas a)–j) em acordeão e contratos vigentes.
            </p>
          </div>
        </button>

        {/* BLOCO 2: PLATAFORMA ELETRÔNICA */}
        <button
          type="button"
          onClick={() => setActivePilar('plataforma')}
          className={`text-left p-5 rounded-lg border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activePilar === 'plataforma'
              ? 'border-[#059669] bg-[#f0fdf4] shadow-sm'
              : 'border-slate-200 bg-white hover:border-[#059669]/50 hover:bg-slate-50'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] font-display">
                Bloco 2 • Livre
              </span>
              <span className="text-xs font-semibold text-slate-500 font-display">
                Res. ANP nº 11/2016
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#0a1d37] flex items-center gap-2 font-display">
              <Layers className="h-5 w-5 text-[#059669] shrink-0" />
              Plataforma Eletrônica
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Incisos I a VIII: fluxos físicos, previsões rolantes, solicitação de acesso e cessão.
            </p>
          </div>
        </button>

        {/* BLOCO 3: MONITORAMENTO DE CONGESTIONAMENTO (PADRÃO TAG/NTS) */}
        <button
          type="button"
          onClick={() => setActivePilar('monitoramento')}
          className={`text-left p-5 rounded-lg border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activePilar === 'monitoramento'
              ? 'border-[#0284c7] bg-[#f0f9ff] shadow-sm'
              : 'border-slate-200 bg-white hover:border-[#0284c7]/50 hover:bg-slate-50'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-sky-100 text-[#0369a1] font-display">
                Bloco 3 • Livre
              </span>
              <span className="text-xs font-semibold text-slate-500 font-display">
                Res. 11/2016, Art. 11
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#0a1d37] flex items-center gap-2 font-display">
              <Activity className="h-5 w-5 text-[#0284c7] shrink-0" />
              Monitoramento
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Utilização da capacidade e congestionamento físico ou contratual homologado na ANP.
            </p>
          </div>
        </button>
      </div>

      {/* CONTEÚDO DOS BLOCOS */}
      {/* BLOCO 1: BOLETIM ELETRÔNICO (PORTARIA ANP Nº 1/2003) */}
      {activePilar === 'boletim' && (
        <BoletimEletronico
          filtroAnoMensal={filtroAnoMensal}
          setFiltroAnoMensal={setFiltroAnoMensal}
          filtroMesMensal={filtroMesMensal}
          setFiltroMesMensal={setFiltroMesMensal}
        />
      )}

      {/* BLOCO 2: PLATAFORMA ELETRÔNICA (RES. ANP Nº 11/2016, INCISOS I–VIII) */}
      {activePilar === 'plataforma' && (
        <PlataformaEletronica
          subAba={subAbaPlataforma}
          setSubAba={setSubAbaPlataforma}
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
        />
      )}

      {/* BLOCO 3: MONITORAMENTO DE CAPACIDADE E CONGESTIONAMENTO (RES. ANP Nº 11/2016, ART. 11) */}
      {activePilar === 'monitoramento' && <BlocoMonitoramentoOficial />}
    </div>
  )
}
