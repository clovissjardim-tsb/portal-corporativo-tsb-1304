import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { solicitacoesService, type SolicitacaoIncisoVII } from '@/services/solicitacoes'
import {
  FileText,
  Radio,
  Calendar,
  Layers,
  Wrench,
  Gauge,
  HelpCircle,
  Search,
  CheckCircle2,
  XCircle,
  FileDown,
  Info,
} from 'lucide-react'

export default function Transparencia() {
  const { toast } = useToast()

  // Pilar ativo: 'boletim' | 'plataforma'
  const [activePilar, setActivePilar] = useState<'boletim' | 'plataforma'>('boletim')

  // Sub-abas do Boletim: 'diaria' | 'mensal' | 'manutencoes' | 'qualidade'
  const [subAbaBoletim, setSubAbaBoletim] = useState<
    'diaria' | 'mensal' | 'manutencoes' | 'qualidade'
  >('diaria')

  // Sub-abas da Plataforma: 'i_vi' | 'vii' | 'viii'
  const [subAbaPlataforma, setSubAbaPlataforma] = useState<'i_vi' | 'vii' | 'viii'>('i_vi')

  // Filtros da Programação Diária
  const [filtroDataDiaria, setFiltroDataDiaria] = useState('2026-09-09')
  const [filtroPontoDiaria, setFiltroPontoDiaria] = useState('Todos os Pontos')
  const [filtroDiariaAplicado, setFiltroDiariaAplicado] = useState({
    data: '2026-09-09',
    ponto: 'Todos os Pontos',
  })

  // Filtros da Programação Mensal
  const [filtroAnoMensal, setFiltroAnoMensal] = useState('2026')
  const [filtroMesMensal, setFiltroMesMensal] = useState('Setembro')

  // Formulário do Inciso VII
  const [formVII, setFormVII] = useState({
    razao_social: '',
    cnpj: '',
    email: '',
    modalidade: '' as '' | 'Firme Ordinário' | 'Interruptível',
    capacidade: '',
    trecho: '',
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

  // Filtragem da Programação Diária
  const handleFiltrarDiaria = (e: React.FormEvent) => {
    e.preventDefault()
    setFiltroDiariaAplicado({
      data: filtroDataDiaria,
      ponto: filtroPontoDiaria,
    })
    toast({
      title: 'Programação diária filtrada',
      description: `Data: ${filtroDataDiaria} | Ponto: ${filtroPontoDiaria}`,
    })
  }

  // Linhas da tabela de Programação Diária
  const linhasDiaria = [
    {
      ponto: 'EMED Uruguaiana',
      tipo: 'Recepção',
      contratada: '2.800.000',
      programado: '1.250.000',
      realizado: '1.248.500',
      pressao: '45,2',
    },
    {
      ponto: 'EMED Triunfo',
      tipo: 'Entrega',
      contratada: '2.800.000',
      programado: '1.250.000',
      realizado: '1.248.500',
      pressao: '38,7',
    },
  ]

  const linhasDiariaFiltradas = linhasDiaria.filter((linha) => {
    if (filtroDiariaAplicado.ponto === 'Todos os Pontos') return true
    if (filtroDiariaAplicado.ponto.includes('Uruguaiana') && linha.ponto.includes('Uruguaiana'))
      return true
    if (filtroDiariaAplicado.ponto.includes('Triunfo') && linha.ponto.includes('Triunfo'))
      return true
    return false
  })

  // Submissão do Inciso VII
  const handleSubmeterVII = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroFormVII(null)

    if (
      !formVII.razao_social ||
      !formVII.cnpj ||
      !formVII.email ||
      !formVII.modalidade ||
      !formVII.capacidade ||
      !formVII.trecho
    ) {
      setErroFormVII('Por favor, preencha todos os campos obrigatórios marcados com *.')
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
        modalidade: formVII.modalidade as 'Firme Ordinário' | 'Interruptível',
        capacidade: capacidadeNum,
        trecho: formVII.trecho.trim(),
      })

      toast({
        title: 'Solicitação Submetida com Sucesso!',
        description: `Protocolo ANP gerado: ${nova.protocolo}`,
      })

      // Limpa formulário
      setFormVII({
        razao_social: '',
        cnpj: '',
        email: '',
        modalidade: '',
        capacidade: '',
        trecho: '',
      })

      // Preenche campo de busca e já exibe resultado da consulta
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540]">
          Portal de Transparência Regulatória
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
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
              ? 'border-[#0284c7] bg-[#f0f9ff] shadow-sm'
              : 'border-slate-200 bg-white hover:border-[#0284c7]/50 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#e0f2fe] text-[#0369a1]">
              Acesso Livre
            </span>
            <span className="text-xs font-semibold text-slate-500">Portaria ANP nº 1/2003</span>
          </div>
          <h3 className="text-lg font-bold text-[#0a2540] flex items-center gap-2">
            <Radio className="h-5 w-5 text-[#0284c7]" />
            Boletim Eletrônico
          </h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Programação diária e mensal, manutenções programadas e qualidade do gás natural.
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
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d]">
              Acesso Livre
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Resolução ANP nº 11/2016 (Arts. 9º e 10)
            </span>
          </div>
          <h3 className="text-lg font-bold text-[#0a2540] flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#059669]" />
            Plataforma Eletrônica
          </h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Incisos I a VIII: capacidades, fluxos físicos, tarifas, solicitação de acesso e cessão.
          </p>
        </button>
      </div>

      {/* CONTEÚDO DO PILAR ATIVO */}

      {/* PILAR 1: BOLETIM ELETRÔNICO */}
      {activePilar === 'boletim' && (
        <Card className="border-t-4 border-t-[#0284c7] border-slate-200 shadow-sm bg-white overflow-hidden animate-fade-in">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xl font-bold text-[#0a2540]">
                  Boletim Eletrônico de Transporte de Gás Natural
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Em conformidade com as diretrizes da Portaria ANP nº 1/2003
                </p>
              </div>
              <Badge className="bg-[#0284c7] text-white">Portaria ANP nº 1/2003</Badge>
            </div>

            {/* SUB-ABAS BOLETIM */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200/60 mt-3">
              <button
                type="button"
                onClick={() => setSubAbaBoletim('diaria')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  subAbaBoletim === 'diaria'
                    ? 'bg-[#0a2540] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Programação Diária
              </button>
              <button
                type="button"
                onClick={() => setSubAbaBoletim('mensal')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  subAbaBoletim === 'mensal'
                    ? 'bg-[#0a2540] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Programação Mensal
              </button>
              <button
                type="button"
                onClick={() => setSubAbaBoletim('manutencoes')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  subAbaBoletim === 'manutencoes'
                    ? 'bg-[#0a2540] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Manutenções Programadas
              </button>
              <button
                type="button"
                onClick={() => setSubAbaBoletim('qualidade')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  subAbaBoletim === 'qualidade'
                    ? 'bg-[#0a2540] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Qualidade do Gás Natural
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* SUB-ABA 1: PROGRAMAÇÃO DIÁRIA */}
            {subAbaBoletim === 'diaria' && (
              <div className="space-y-6">
                <form
                  onSubmit={handleFiltrarDiaria}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="dataDiaria" className="text-xs font-semibold text-slate-700">
                      Data da Operação
                    </Label>
                    <Input
                      id="dataDiaria"
                      type="date"
                      value={filtroDataDiaria}
                      onChange={(e) => setFiltroDataDiaria(e.target.value)}
                      className="text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pontoDiaria" className="text-xs font-semibold text-slate-700">
                      Ponto de Recepção / Entrega
                    </Label>
                    <select
                      id="pontoDiaria"
                      value={filtroPontoDiaria}
                      onChange={(e) => setFiltroPontoDiaria(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                    >
                      <option value="Todos os Pontos">Todos os Pontos</option>
                      <option value="EMED Uruguaiana (Recepção)">EMED Uruguaiana (Recepção)</option>
                      <option value="EMED Triunfo (Entrega)">EMED Triunfo (Entrega)</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#0a2540] hover:bg-[#13395e] text-white text-xs font-semibold h-9"
                  >
                    Filtrar Programação
                  </Button>
                </form>

                {/* TABELA PROGRAMAÇÃO DIÁRIA */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#f1f5f9] text-[#0a2540] font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Ponto Operacional</th>
                        <th className="p-3">Tipo de Ponto</th>
                        <th className="p-3 text-right">Capacidade Contratada (m³/dia)</th>
                        <th className="p-3 text-right">Volume Programado (m³/dia)</th>
                        <th className="p-3 text-right">Volume Realizado (m³/dia)</th>
                        <th className="p-3 text-right">Pressão Média (kgf/cm²)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {linhasDiariaFiltradas.length > 0 ? (
                        linhasDiariaFiltradas.map((l) => (
                          <tr key={l.ponto} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-semibold text-[#0a2540]">{l.ponto}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  l.tipo === 'Recepção'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {l.tipo}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono">{l.contratada}</td>
                            <td className="p-3 text-right font-mono">{l.programado}</td>
                            <td className="p-3 text-right font-mono font-medium text-slate-800">
                              {l.realizado}
                            </td>
                            <td className="p-3 text-right font-mono">{l.pressao}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-500">
                            Nenhum ponto operacional encontrado para os filtros selecionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-ABA 2: PROGRAMAÇÃO MENSAL */}
            {subAbaBoletim === 'mensal' && (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-4 items-end">
                  <div className="space-y-1.5 w-44">
                    <Label htmlFor="anoMensal" className="text-xs font-semibold text-slate-700">
                      Ano de Referência
                    </Label>
                    <select
                      id="anoMensal"
                      value={filtroAnoMensal}
                      onChange={(e) => setFiltroAnoMensal(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 w-44">
                    <Label htmlFor="mesMensal" className="text-xs font-semibold text-slate-700">
                      Mês de Referência
                    </Label>
                    <select
                      id="mesMensal"
                      value={filtroMesMensal}
                      onChange={(e) => setFiltroMesMensal(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                    >
                      <option value="Setembro">Setembro</option>
                      <option value="Agosto">Agosto</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#f1f5f9] text-[#0a2540] font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Mês / Ano</th>
                        <th className="p-3 text-right">Capacidade Firme Contratada (m³/dia)</th>
                        <th className="p-3 text-right">Previsão de Transporte Média (m³/dia)</th>
                        <th className="p-3 text-center">Relatório Consolidado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-[#0a2540]">09/2026 (Setembro)</td>
                        <td className="p-3 text-right font-mono">2.800.000</td>
                        <td className="p-3 text-right font-mono">1.300.000</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              toast({
                                title: 'Relatório Mensal',
                                description:
                                  'Download simulado: Relatório de Programação Mensal Setembro/2026.',
                              })
                            }
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284c7] hover:underline"
                          >
                            <FileDown className="h-3.5 w-3.5" />
                            PDF Programação Mensal
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-ABA 3: MANUTENÇÕES PROGRAMADAS */}
            {subAbaBoletim === 'manutencoes' && (
              <div className="space-y-6">
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-950 flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
                  <p leading-relaxed>
                    Quadro informativo de paradas programadas para manutenção preventiva, calibração
                    de instrumentos e inspeção técnica nas instalações dutoviárias da TSB, com aviso
                    prévio aos carregadores conforme a Portaria ANP nº 1/2003.
                  </p>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#f1f5f9] text-[#0a2540] font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Trecho / Instalação</th>
                        <th className="p-3">Data Início</th>
                        <th className="p-3">Data Fim</th>
                        <th className="p-3">Impacto na Capacidade</th>
                        <th className="p-3">Descrição do Serviço</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-[#0a2540]">
                          EMED Uruguaiana - Filtros de Entrada
                        </td>
                        <td className="p-3">15/10/2026</td>
                        <td className="p-3">16/10/2026</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#fef3c7] text-[#b45309] border border-amber-200">
                            Redução de 10%
                          </span>
                        </td>
                        <td className="p-3 text-slate-700">
                          Inspeção periódica e troca de elementos filtrantes.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-ABA 4: QUALIDADE DO GÁS NATURAL */}
            {subAbaBoletim === 'qualidade' && (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2.5">
                  <Gauge className="h-4 w-4 text-[#0a2540] shrink-0 mt-0.5" />
                  <p leading-relaxed>
                    Valores médios apurados por cromatografia contínua em linha nas Estações de
                    Medição da TSB, certificados com base nos padrões regulatórios da Resolução ANP
                    nº 16/2008 (Poder Calorífico Superior - PCS, teor de inertes e composição
                    molecular).
                  </p>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#f1f5f9] text-[#0a2540] font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Componente / Parâmetro</th>
                        <th className="p-3">Unidade</th>
                        <th className="p-3 text-right">Valor Médio Apurado</th>
                        <th className="p-3 text-right">Especificação ANP (Res. 16/2008)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-[#0a2540]">
                          Poder Calorífico Superior (PCS)
                        </td>
                        <td className="p-3 text-slate-600">kcal/m³</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">9.450</td>
                        <td className="p-3 text-right font-mono text-slate-600">8.800 a 10.200</td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-[#0a2540]">Metano (C1)</td>
                        <td className="p-3 text-slate-600">% mol</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">88,50</td>
                        <td className="p-3 text-right font-mono text-slate-600">Mín. 85,0</td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-[#0a2540]">
                          Dióxido de Carbono (CO2)
                        </td>
                        <td className="p-3 text-slate-600">% mol</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">1,20</td>
                        <td className="p-3 text-right font-mono text-slate-600">Máx. 3,0</td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-[#0a2540]">Inertes Totais</td>
                        <td className="p-3 text-slate-600">% mol</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">2,10</td>
                        <td className="p-3 text-right font-mono text-slate-600">Máx. 5,0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PILAR 2: PLATAFORMA ELETRÔNICA */}
      {activePilar === 'plataforma' && (
        <Card className="border-t-4 border-t-[#059669] border-slate-200 shadow-sm bg-white overflow-hidden animate-fade-in">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xl font-bold text-[#0a2540]">
                  Plataforma Eletrônica de Acesso à Informação Dutoviária
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Regulamentada pelos Arts. 9º e 10 da Resolução ANP nº 11/2016
                </p>
              </div>
              <Badge className="bg-[#059669] text-white">Res. ANP nº 11/2016</Badge>
            </div>

            {/* SUB-ABAS PLATAFORMA */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200/60 mt-3">
              <button
                type="button"
                onClick={() => setSubAbaPlataforma('i_vi')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  subAbaPlataforma === 'i_vi'
                    ? 'bg-[#0a2540] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Incisos I a VI (Dados Operacionais)
              </button>
              <button
                type="button"
                onClick={() => setSubAbaPlataforma('vii')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  subAbaPlataforma === 'vii'
                    ? 'bg-[#0a2540] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Inciso VII (Solicitação de Acesso)
              </button>
              <button
                type="button"
                onClick={() => setSubAbaPlataforma('viii')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  subAbaPlataforma === 'viii'
                    ? 'bg-[#0a2540] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Inciso VIII (Cessão de Capacidade)
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* SUB-ABA 1: INCISOS I A VI */}
            {subAbaPlataforma === 'i_vi' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600">
                  Abaixo constam as informações públicas mandatórias e seus respectivos relatórios
                  periódicos estabelecidos pelos Incisos I a VI do Art. 9º da Resolução ANP nº
                  11/2016:
                </p>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#f1f5f9] text-[#0a2540] font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-28">Inciso</th>
                        <th className="p-3">Exigência Legal (Res. ANP 11/2016)</th>
                        <th className="p-3 w-32">Frequência</th>
                        <th className="p-3 w-40 text-center">Acesso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-[#0a2540]">Inciso I</td>
                        <td className="p-3 text-slate-800">
                          Fluxos físicos nos pontos de recepção e entrega
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            Diária
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              toast({
                                title: 'Inciso I',
                                description:
                                  'Visualização do Relatório Diário de Fluxos Físicos TSB.',
                              })
                            }
                            className="text-[#0284c7] font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <FileText className="h-3.5 w-3.5" /> Visualizar Relatório
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-[#0a2540]">Inciso II</td>
                        <td className="p-3 text-slate-800">
                          Características técnicas e operacionais das instalações
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            Anual
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              toast({
                                title: 'Inciso II',
                                description:
                                  'Download do Manual de Características Técnicas das Instalações TSB.',
                              })
                            }
                            className="text-[#0284c7] font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <FileDown className="h-3.5 w-3.5" /> Baixar Manual
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-[#0a2540]">Inciso III</td>
                        <td className="p-3 text-slate-800">
                          Capacidade disponível e ociosa do gasoduto
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            Mensal
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              toast({
                                title: 'Inciso III',
                                description:
                                  'Consulta à Matriz de Capacidades Disponíveis e Ociosas TSB.',
                              })
                            }
                            className="text-[#0284c7] font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <Search className="h-3.5 w-3.5" /> Consultar Tabela
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-[#0a2540]">Inciso IV</td>
                        <td className="p-3 text-slate-800">
                          Capacidades contratadas por carregador
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            Mensal
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              toast({
                                title: 'Inciso IV',
                                description:
                                  'Visualização da Matriz Consolidada de Contratação por Carregador.',
                              })
                            }
                            className="text-[#0284c7] font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <FileText className="h-3.5 w-3.5" /> Ver Matriz
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-[#0a2540]">Inciso V</td>
                        <td className="p-3 text-slate-800">
                          Relatórios de simulação termo-hidráulica
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            Semestral
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              toast({
                                title: 'Inciso V',
                                description:
                                  'Download dos Estudos e Simulação Termo-Hidráulica TSB.',
                              })
                            }
                            className="text-[#0284c7] font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <FileDown className="h-3.5 w-3.5" /> Baixar Simulação
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-[#0a2540]">Inciso VI</td>
                        <td className="p-3 text-slate-800">
                          Termos de acesso e condições tarifárias vigentes
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            Vigente
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              toast({
                                title: 'Inciso VI',
                                description:
                                  'Download da Tarifa Homologada e Termos Gerais de Acesso.',
                              })
                            }
                            className="text-[#0284c7] font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <FileDown className="h-3.5 w-3.5" /> Baixar Tarifas
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-ABA 2: INCISO VII (SOLICITAÇÃO DE ACESSO) */}
            {subAbaPlataforma === 'vii' && (
              <div className="space-y-8">
                {/* BANNER INFORMATIVO VERDE */}
                <div className="p-4 bg-[#f0fdf4] border-l-4 border-l-[#059669] border border-emerald-200 rounded-r-lg space-y-1">
                  <div className="flex items-center gap-2 text-[#059669] font-bold text-sm">
                    <Info className="h-4 w-4" />
                    Amparo Legal: Art. 9º, Inciso VII e Art. 10 da Resolução ANP nº 11/2016
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Envio direto sem necessidade de login prévio. Gera protocolo automático com
                    prazo legal de resposta de até 20 dias úteis para manifestação técnica e
                    comercial da transportadora.
                  </p>
                </div>

                {/* FORMULÁRIO */}
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg">
                  <h3 className="text-base font-bold text-[#0a2540] mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#0284c7]" />
                    Formulário de Solicitação de Acesso Firme ou Interruptível
                  </h3>

                  {erroFormVII && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span>{erroFormVII}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmeterVII} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="razao_social"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Razão Social *
                        </Label>
                        <Input
                          id="razao_social"
                          required
                          placeholder="Ex: Comercializadora de Energia S.A."
                          value={formVII.razao_social}
                          onChange={(e) => setFormVII({ ...formVII, razao_social: e.target.value })}
                          className="text-xs bg-white"
                          disabled={submetendoVII}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="cnpj" className="text-xs font-semibold text-slate-700">
                          CNPJ *
                        </Label>
                        <Input
                          id="cnpj"
                          required
                          placeholder="00.000.000/0001-00"
                          value={formVII.cnpj}
                          onChange={(e) => setFormVII({ ...formVII, cnpj: e.target.value })}
                          className="text-xs bg-white font-mono"
                          disabled={submetendoVII}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="emailCorp" className="text-xs font-semibold text-slate-700">
                          E-mail Corporativo *
                        </Label>
                        <Input
                          id="emailCorp"
                          type="email"
                          required
                          placeholder="regulacao@comercializadora.com.br"
                          value={formVII.email}
                          onChange={(e) => setFormVII({ ...formVII, email: e.target.value })}
                          className="text-xs bg-white"
                          disabled={submetendoVII}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="modalidade"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Modalidade de Serviço *
                        </Label>
                        <select
                          id="modalidade"
                          required
                          value={formVII.modalidade}
                          onChange={(e) =>
                            setFormVII({
                              ...formVII,
                              modalidade: e.target.value as 'Firme Ordinário' | 'Interruptível',
                            })
                          }
                          className="w-full h-9 px-3 rounded-md border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                          disabled={submetendoVII}
                        >
                          <option value="">Selecione a modalidade...</option>
                          <option value="Firme Ordinário">Firme Ordinário</option>
                          <option value="Interruptível">Interruptível</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="capacidade"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Capacidade Solicitada (m³/dia) *
                        </Label>
                        <Input
                          id="capacidade"
                          type="number"
                          min="1"
                          required
                          placeholder="Ex: 150000"
                          value={formVII.capacidade}
                          onChange={(e) => setFormVII({ ...formVII, capacidade: e.target.value })}
                          className="text-xs bg-white font-mono"
                          disabled={submetendoVII}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="trecho" className="text-xs font-semibold text-slate-700">
                          Trecho de Interesse *
                        </Label>
                        <select
                          id="trecho"
                          required
                          value={formVII.trecho}
                          onChange={(e) => setFormVII({ ...formVII, trecho: e.target.value })}
                          className="w-full h-9 px-3 rounded-md border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                          disabled={submetendoVII}
                        >
                          <option value="">Selecione o trecho...</option>
                          <option value="Uruguaiana -> Triunfo">Uruguaiana -&gt; Triunfo</option>
                        </select>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={submetendoVII}
                      className="w-full bg-[#0a2540] hover:bg-[#13395e] text-white font-semibold py-3 text-sm mt-4 shadow-sm"
                    >
                      {submetendoVII
                        ? 'Submetendo Solicitação...'
                        : 'Submeter Solicitação de Acesso (Gera Protocolo ANP)'}
                    </Button>
                  </form>
                </div>

                {/* CONSULTA DE PROTOCOLO E SLA */}
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                  <h3 className="text-base font-bold text-[#0a2540] flex items-center gap-2">
                    <Search className="h-4 w-4 text-[#0284c7]" />
                    Consulta Pública de Protocolo &amp; SLA
                  </h3>
                  <p className="text-xs text-slate-600">
                    Acompanhe o andamento regulatório da sua manifestação técnica pelo número de
                    protocolo gerado.
                  </p>

                  <form onSubmit={handleVerificarSLA} className="flex gap-2">
                    <Input
                      placeholder="Informe o protocolo (Ex: TSB-2026-8942)"
                      value={consultaProtocolo}
                      onChange={(e) => setConsultaProtocolo(e.target.value)}
                      className="text-xs bg-white uppercase font-mono"
                      disabled={consultandoSLA}
                    />
                    <Button
                      type="submit"
                      disabled={consultandoSLA || !consultaProtocolo.trim()}
                      className="bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold shrink-0"
                    >
                      {consultandoSLA ? 'Buscando...' : 'Verificar SLA'}
                    </Button>
                  </form>

                  {/* RESULTADO DA CONSULTA */}
                  {resultadoConsulta && resultadoConsulta.buscado && (
                    <div className="animate-fade-in pt-2">
                      {resultadoConsulta.encontrado && resultadoConsulta.dados ? (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-bold text-sm flex items-center gap-1.5 text-emerald-800">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              Protocolo: {resultadoConsulta.dados.protocolo}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#dcfce7] text-[#15803d] border border-emerald-300">
                              SLA Restante: {resultadoConsulta.dados.sla_dias} Dias Úteis
                            </span>
                          </div>
                          <div className="text-xs space-y-1 text-emerald-900/90 pt-1 border-t border-emerald-200">
                            <div>
                              <strong>Solicitante:</strong> {resultadoConsulta.dados.razao_social}{' '}
                              (CNPJ: {resultadoConsulta.dados.cnpj})
                            </div>
                            <div>
                              <strong>Modalidade / Trecho:</strong>{' '}
                              {resultadoConsulta.dados.modalidade} |{' '}
                              {resultadoConsulta.dados.trecho}
                            </div>
                            <div>
                              <strong>Capacidade:</strong>{' '}
                              {resultadoConsulta.dados.capacidade.toLocaleString('pt-BR')} m³/dia
                            </div>
                            <div>
                              <strong>Status:</strong>{' '}
                              <span className="font-semibold text-emerald-800">
                                {resultadoConsulta.dados.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-900 space-y-1 flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <strong className="block font-semibold">
                              Protocolo não localizado no sistema TSB.
                            </strong>
                            <span>
                              Verifique o número informado ou submeta uma nova solicitação acima.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-ABA 3: INCISO VIII (CESSÃO DE CAPACIDADE) */}
            {subAbaPlataforma === 'viii' && (
              <div className="space-y-6">
                {/* BANNER INFORMATIVO AZUL */}
                <div className="p-4 bg-[#eff6ff] border-l-4 border-l-[#0284c7] border border-blue-200 rounded-r-lg space-y-1">
                  <div className="flex items-center gap-2 text-[#0284c7] font-bold text-sm">
                    <Info className="h-4 w-4" />
                    Amparo Legal: Art. 9º, Inciso VIII da Resolução ANP nº 11/2016
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Mecanismo de divulgação de ofertas de capacidade ociosa para cessão entre
                    carregadores, promovendo o aproveitamento eficiente e secundário da malha
                    dutoviária da TSB.
                  </p>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#f1f5f9] text-[#0a2540] font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Carregador Cedente</th>
                        <th className="p-3">Trecho</th>
                        <th className="p-3 text-right">Capacidade Ociosa</th>
                        <th className="p-3">Período Contratual</th>
                        <th className="p-3">Contato</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-[#0a2540]">
                          Carregador Exemplo S.A.
                        </td>
                        <td className="p-3 text-slate-700">Uruguaiana -&gt; Triunfo</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          20.000 m³/dia
                        </td>
                        <td className="p-3 text-slate-700">Out/2026 a Dez/2026</td>
                        <td className="p-3">
                          <a
                            href="mailto:comercial@carregadorexemplo.com.br"
                            className="text-[#0284c7] font-medium hover:underline"
                          >
                            comercial@carregadorexemplo.com.br
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
