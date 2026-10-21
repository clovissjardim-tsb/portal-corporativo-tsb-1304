import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  transparenciaService,
  resolverUrlDocumento,
  resolverUrlSecundaria,
  CABECALHOS_FALLBACK,
  type ItemTransparencia,
} from '@/services/transparencia'
import {
  FileText,
  FileDown,
  ExternalLink,
  Search,
  Calendar,
  ArrowUpDown,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Eye,
  RotateCcw,
  Activity,
  ShieldAlert,
  Info,
  ChevronDown,
  Clock,
  CheckCircle2,
  FileCheck,
} from 'lucide-react'

export interface BoletimEletronicoProps {
  filtroAnoMensal?: string
  setFiltroAnoMensal?: (val: string) => void
  filtroMesMensal?: string
  setFiltroMesMensal?: (val: string) => void
}

export interface RelatorioMensalItem {
  id: string
  titulo: string
  mes: string
  ano: string
  anoNum: number
  mesNum: number // 1 a 12
  chavePeriodo: string // "YYYY-MM"
  url: string
  nomeArquivo: string
  temArquivoDireto: boolean
}

const NOMES_MESES: string[] = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

// URLs canônicas reais e verificadas da página oficial da TSB
const URLS_CONHECIDAS: Record<string, { url: string; nomeArquivo: string }> = {
  '2026-09': {
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/10/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Setembro26-1.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Setembro26-1.pdf',
  },
  '2026-08': {
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/09/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Agosto26-2.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Agosto26-2.pdf',
  },
  '2026-07': {
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/08/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Julho26-2.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Julho26-2.pdf',
  },
  '2026-06': {
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/07/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Junho26-1.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Junho26-1.pdf',
  },
  '2026-05': {
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/06/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Maio26.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Maio26.pdf',
  },
  '2026-04': {
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/05/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Abril26.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Abril26.pdf',
  },
  '2026-03': {
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/04/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Marco26.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Marco26.pdf',
  },
  '2026-02': {
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/03/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Fevereiro26.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Fevereiro26.pdf',
  },
  '2026-01': {
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/02/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Janeiro26.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Janeiro26.pdf',
  },
  '2025-12': {
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/01/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Dezembro25.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Dezembro25.pdf',
  },
  '2025-11': {
    url: 'https://www.tsb.com.br/wp-content/uploads/2025/12/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Novembro25.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Novembro25.pdf',
  },
}

// Gera a série histórica desde 2003 (ano de criação da Portaria ANP 1/2003)
function gerarHistoricoQuantidades(): RelatorioMensalItem[] {
  const agora = new Date()
  const anoAtual = Math.max(agora.getFullYear(), 2026)
  const mesAtual = anoAtual === agora.getFullYear() ? agora.getMonth() + 1 : 9 // se 2026, até setembro

  const lista: RelatorioMensalItem[] = []

  for (let ano = anoAtual; ano >= 2003; ano--) {
    const mesMax = ano === anoAtual ? mesAtual : 12
    for (let mes = mesMax; mes >= 1; mes--) {
      const mesStr = String(mes).padStart(2, '0')
      const chave = `${ano}-${mesStr}`
      const nomeMes = NOMES_MESES[mes - 1]

      const conhecida = URLS_CONHECIDAS[chave]
      const temArquivoDireto = Boolean(conhecida)
      const nomeArquivo = conhecida
        ? conhecida.nomeArquivo
        : `Art_2o_Alinea-I_Item_h_${nomeMes}${ano}.pdf`
      const url = conhecida ? conhecida.url : 'https://www.tsb.com.br/boletim-eletronico/'

      lista.push({
        id: chave,
        titulo: `Quantidades programadas e realizadas nos pontos de recepção e entrega -${nomeMes}/${ano}`,
        mes: nomeMes,
        ano: String(ano),
        anoNum: ano,
        mesNum: mes,
        chavePeriodo: chave,
        url,
        nomeArquivo,
        temArquivoDireto,
      })
    }
  }

  return lista
}

const HISTORICO_QUANTIDADES_COMPLETO: RelatorioMensalItem[] = gerarHistoricoQuantidades()

export default function BoletimEletronico(_props: BoletimEletronicoProps = {}) {
  const { toast } = useToast()

  // Conteúdos editáveis vindos do PocketBase
  const [itensBd, setItensBd] = useState<ItemTransparencia[]>([])

  const carregarItensTransparencia = useCallback(async () => {
    try {
      const todos = await transparenciaService.listarTodos()
      setItensBd(todos)
    } catch (e) {
      console.warn('[BoletimEletronico] Usando dados canônicos como fallback:', e)
    }
  }, [])

  useEffect(() => {
    carregarItensTransparencia()
  }, [carregarItensTransparencia])

  // Mapas rápidos por chave e seção para itens do backend
  const cabecalhosBdMap = useMemo(() => {
    const map = new Map<string, ItemTransparencia>()
    itensBd.filter((it) => it.secao === 'cabecalho').forEach((it) => map.set(it.chave, it))
    return map
  }, [itensBd])

  const masterBd = useMemo(() => {
    return itensBd.find((it) => it.secao === 'boletim_master' && it.chave === 'contrato_master')
  }, [itensBd])

  const secao1BdMap = useMemo(() => {
    const map = new Map<string, ItemTransparencia>()
    itensBd.filter((it) => it.secao === 'boletim_secao1').forEach((it) => map.set(it.chave, it))
    return map
  }, [itensBd])

  const secao2Bd = useMemo(() => {
    return itensBd.filter((it) => it.secao === 'boletim_secao2')
  }, [itensBd])

  const congestionamentoBd = useMemo(() => {
    return itensBd.filter((it) => it.secao === 'monitoramento_congestionamento')
  }, [itensBd])

  // Estado colapsado por padrão do entendimento conceitual padrão NTS (na alínea g)
  const [explicativoGExpandido, setExplicativoGExpandido] = useState<boolean>(false)

  // Resolução dinâmica de cabeçalhos com fallback oficial canônico
  // Boletim Topo
  const headerBoletimTopo = useMemo(() => {
    const item = cabecalhosBdMap.get('boletim_topo')
    const fallback = CABECALHOS_FALLBACK.boletim_topo
    return {
      titulo: item?.ativo !== false && item?.titulo ? item.titulo : fallback.titulo,
      descricao:
        item?.ativo !== false && item?.descricao ? item.descricao : fallback.descricao || '',
      item,
      ativo: item ? item.ativo !== false : true,
    }
  }, [cabecalhosBdMap])

  // Bloco I Cabeçalho: "I. Instalações de Transporte e Serviços Prestados"
  const headerBlocoI = useMemo(() => {
    const item = cabecalhosBdMap.get('boletim_secao1_header')
    const fallback = CABECALHOS_FALLBACK.boletim_secao1_header
    return {
      titulo: item?.ativo !== false && item?.titulo ? item.titulo : fallback.titulo,
      descricao:
        item?.ativo !== false && item?.descricao ? item.descricao : fallback.descricao || '',
      item,
      ativo: item ? item.ativo !== false : true,
    }
  }, [cabecalhosBdMap])

  // Bloco II Cabeçalho: "II. Contratos de Serviço de Transporte"
  const headerBlocoII = useMemo(() => {
    const item = cabecalhosBdMap.get('boletim_contratos_header')
    const fallback = CABECALHOS_FALLBACK.boletim_contratos_header
    return {
      titulo: item?.ativo !== false && item?.titulo ? item.titulo : fallback.titulo,
      descricao:
        item?.ativo !== false && item?.descricao ? item.descricao : fallback.descricao || '',
      item,
      ativo: item ? item.ativo !== false : true,
    }
  }, [cabecalhosBdMap])

  // Bloco Explicativo Alínea g) (Padrão NTS)
  const blocoExplicativoG = useMemo(() => {
    const item = cabecalhosBdMap.get('boletim_explicativo_capacidade_g')
    const fallback = CABECALHOS_FALLBACK.boletim_explicativo_capacidade_g
    return {
      titulo: item?.ativo !== false && item?.titulo ? item.titulo : fallback.titulo,
      descricao:
        item?.ativo !== false && item?.descricao ? item.descricao : fallback.descricao || '',
      item,
      ativo: item ? item.ativo !== false : true,
    }
  }, [cabecalhosBdMap])

  // Bloco Faixas de Servidão (Res. ANP nº 42/2012, Art. 46)
  const avisoServidao = useMemo(() => {
    const item = cabecalhosBdMap.get('aviso_faixas_servidao')
    const fallback = CABECALHOS_FALLBACK.aviso_faixas_servidao
    return {
      titulo: item?.ativo !== false && item?.titulo ? item.titulo : fallback.titulo,
      descricao:
        item?.ativo !== false && item?.descricao ? item.descricao : fallback.descricao || '',
      item,
      ativo: item ? item.ativo !== false : true,
    }
  }, [cabecalhosBdMap])

  // Bloco Cabeçalho Monitoramento de Congestionamento (Res. 11/2016, Art. 12)
  const headerCongestionamento = useMemo(() => {
    const item = cabecalhosBdMap.get('monitoramento_congestionamento_header')
    const fallback = CABECALHOS_FALLBACK.monitoramento_congestionamento_header
    return {
      titulo: item?.ativo !== false && item?.titulo ? item.titulo : fallback.titulo,
      descricao:
        item?.ativo !== false && item?.descricao ? item.descricao : fallback.descricao || '',
      item,
      ativo: item ? item.ativo !== false : true,
    }
  }, [cabecalhosBdMap])

  // Mesclagem da série histórica com registros editados/adicionados no BD (Alínea h)
  const historicoComBd = useMemo(() => {
    const mapHistorico = new Map<string, RelatorioMensalItem>()
    HISTORICO_QUANTIDADES_COMPLETO.forEach((item) => {
      mapHistorico.set(item.chavePeriodo, { ...item })
    })

    secao2Bd.forEach((bd) => {
      if (!bd.ativo) {
        if (bd.chave_periodo) mapHistorico.delete(bd.chave_periodo)
        return
      }

      const chave = bd.chave_periodo || `${bd.ano}-${bd.mes}`
      const urlInfo = resolverUrlDocumento(bd, bd.url_externa || '')
      const anoNum = Number(bd.ano) || 2026
      const mesNome = bd.mes || bd.rotulo || ''

      mapHistorico.set(chave, {
        id: bd.id,
        titulo: bd.titulo,
        mes: mesNome,
        ano: bd.ano || '2026',
        anoNum,
        mesNum: 1,
        chavePeriodo: chave,
        url: urlInfo.url,
        nomeArquivo: urlInfo.nomeExibicao,
        temArquivoDireto: Boolean(urlInfo.url),
      })
    })

    return Array.from(mapHistorico.values())
  }, [secao2Bd])

  // Alínea h): Filtros e Pesquisa da Série Histórica
  const [pesquisaQuantidades, setPesquisaQuantidades] = useState<string>('')
  const [filtroAnoQuantidades, setFiltroAnoQuantidades] = useState<string>('todos')
  const [ordemQuantidades, setOrdemQuantidades] = useState<'desc' | 'asc'>('desc')
  const [itensExibirQuantidades, setItensExibirQuantidades] = useState<number | 'todos'>(12)

  const anosDisponiveis = useMemo(() => {
    const anosSet = new Set<number>()
    historicoComBd.forEach((item) => {
      if (item.anoNum) anosSet.add(item.anoNum)
    })
    return Array.from(anosSet).sort((a, b) => b - a)
  }, [historicoComBd])

  const relatoriosFiltradosTotal = useMemo(() => {
    const termo = pesquisaQuantidades.trim().toLowerCase()

    const filtrados = historicoComBd.filter((item) => {
      if (termo) {
        const correspondeTitulo = item.titulo.toLowerCase().includes(termo)
        const correspondeAno = item.ano.includes(termo)
        const correspondeMes = item.mes.toLowerCase().includes(termo)
        if (!correspondeTitulo && !correspondeAno && !correspondeMes) {
          return false
        }
      }

      if (filtroAnoQuantidades !== 'todos' && String(item.anoNum) !== filtroAnoQuantidades) {
        return false
      }

      return true
    })

    return filtrados.sort((a, b) => {
      if (ordemQuantidades === 'asc') {
        return a.chavePeriodo.localeCompare(b.chavePeriodo)
      }
      return b.chavePeriodo.localeCompare(a.chavePeriodo)
    })
  }, [historicoComBd, pesquisaQuantidades, filtroAnoQuantidades, ordemQuantidades])

  const relatoriosVisiveis =
    itensExibirQuantidades === 'todos'
      ? relatoriosFiltradosTotal
      : relatoriosFiltradosTotal.slice(0, itensExibirQuantidades)

  const toggleOrdemQuantidades = () => {
    const novaOrdem = ordemQuantidades === 'desc' ? 'asc' : 'desc'
    setOrdemQuantidades(novaOrdem)
    toast({
      title: 'Ordenação alterada',
      description:
        novaOrdem === 'desc'
          ? 'Exibindo do MAIS NOVO PARA O MAIS VELHO.'
          : 'Exibindo do MAIS VELHO PARA O MAIS NOVO.',
    })
  }

  const limparFiltrosQuantidades = () => {
    setPesquisaQuantidades('')
    setFiltroAnoQuantidades('todos')
    setOrdemQuantidades('desc')
    setItensExibirQuantidades(12)
    toast({
      title: 'Filtros redefinidos',
      description: 'Exibindo os 12 arquivos mais recentes da série histórica.',
    })
  }

  // Filtros específicos do Monitoramento de Congestionamento
  const [pesquisaCongestionamento, setPesquisaCongestionamento] = useState<string>('')
  const [filtroAnoCongestionamento, setFiltroAnoCongestionamento] = useState<string>('todos')
  const [ordemCongestionamento, setOrdemCongestionamento] = useState<'desc' | 'asc'>('desc')

  const relatoriosCongestionamentoTotal = useMemo(() => {
    const ativos = congestionamentoBd.filter((it) => it.ativo)
    const termo = pesquisaCongestionamento.trim().toLowerCase()

    const filtrados = ativos.filter((it) => {
      if (termo) {
        const correspondeTitulo = it.titulo.toLowerCase().includes(termo)
        const correspondeAno = (it.ano || '').includes(termo)
        const correspondeMes = (it.mes || '').toLowerCase().includes(termo)
        if (!correspondeTitulo && !correspondeAno && !correspondeMes) return false
      }
      if (filtroAnoCongestionamento !== 'todos' && it.ano !== filtroAnoCongestionamento) {
        return false
      }
      return true
    })

    return filtrados.sort((a, b) => {
      const periodoA = a.chave_periodo || `${a.ano || '0'}-${a.mes || '0'}`
      const periodoB = b.chave_periodo || `${b.ano || '0'}-${b.mes || '0'}`
      if (ordemCongestionamento === 'asc') {
        return periodoA.localeCompare(periodoB)
      }
      return periodoB.localeCompare(periodoA)
    })
  }, [
    congestionamentoBd,
    pesquisaCongestionamento,
    filtroAnoCongestionamento,
    ordemCongestionamento,
  ])

  const anosCongestionamentoDisponiveis = useMemo(() => {
    const anosSet = new Set<string>()
    congestionamentoBd.forEach((it) => {
      if (it.ano) anosSet.add(it.ano)
    })
    return Array.from(anosSet).sort((a, b) => Number(b) - Number(a))
  }, [congestionamentoBd])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* CARD PRINCIPAL ESPELHANDO ESTRUTURA OFICIAL TSB (PÁGINA ÚNICA, NAVEGAÇÃO POR ROLAGEM) */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        {/* CABEÇALHO OFICIAL COM PALETA TSB */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0a1d37 0%, #0c2340 50%, #143b73 100%)',
          }}
          className="text-white p-6 sm:p-8 border-b border-white/10"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-sky-200 font-display">
              Portal TSB • Regulação &amp; Acesso Público
            </span>
            <Badge className="bg-[#e30613] hover:bg-[#c50510] text-white border-0 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 font-display">
              Portaria ANP nº 1/2003 • Art. 2º
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
                {headerBoletimTopo.titulo}
              </h1>
              {headerBoletimTopo.descricao && (
                <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-3xl leading-relaxed">
                  {headerBoletimTopo.descricao}
                </p>
              )}
            </div>
            {(() => {
              if (!headerBoletimTopo.item) return null
              const doc = resolverUrlDocumento(headerBoletimTopo.item, '')
              if (!doc.url) return null
              return (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-semibold shrink-0 transition-colors border border-white/20 self-start"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  {doc.nomeExibicao || 'Anexo do Boletim'}
                </a>
              )
            })()}
          </div>
        </div>

        {/* AVISO DE FAIXAS DE SERVIDÃO (RES. 42/2012, ART. 46) NO TOPO DO BOLETIM */}
        {avisoServidao.ativo && (
          <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-lg bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row items-start gap-3">
            <div className="p-2 rounded-md bg-[#0a1d37] text-white shrink-0 mt-0.5">
              <ShieldAlert className="h-4 w-4 text-[#e30613]" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-[#0a1d37] font-display flex items-center gap-1.5">
                  {avisoServidao.titulo}
                </h4>
                <Badge
                  variant="outline"
                  className="bg-white text-[#143b73] border-blue-300 text-[10px] font-mono"
                >
                  Res. ANP nº 42/2012 • Art. 46
                </Badge>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed text-justify">
                {avisoServidao.descricao}
              </p>
              {(() => {
                if (!avisoServidao.item) return null
                const doc = resolverUrlDocumento(avisoServidao.item, '')
                if (!doc.url) return null
                return (
                  <div className="pt-1.5">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#143b73] hover:text-[#0c2340] hover:underline"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      {doc.nomeExibicao || 'Consultar Documento da Resolução ANP'}
                    </a>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-12">
          {/* =========================================================================
              BLOCO 1 — TÍTULO LITERAL: "I. Instalações de Transporte e Serviços Prestados"
              Subtítulo: (atualizadas permanentemente)
              Tabela com as 10 alíneas a)–j) literais da Portaria ANP nº 1/2003
              ========================================================================= */}
          <section id="bloco-item-i" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-[#0a1d37] font-display tracking-tight">
                    {headerBlocoI.titulo}
                  </h2>
                  <span className="text-xs sm:text-sm font-medium text-slate-500 italic">
                    (atualizadas permanentemente)
                  </span>
                </div>
                <div className="w-full h-px bg-slate-200 mt-2 mb-2" />
                {headerBlocoI.descricao && (
                  <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                    {headerBlocoI.descricao}
                  </p>
                )}
              </div>
              {(() => {
                if (!headerBlocoI.item) return null
                const doc = resolverUrlDocumento(headerBlocoI.item, '')
                if (!doc.url) return null
                return (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-50 text-[#0284c7] hover:bg-sky-100 text-xs font-semibold shrink-0 transition-colors border border-sky-200 self-start mt-1"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    {doc.nomeExibicao || 'Anexo do Item I'}
                  </a>
                )
              })()}
            </div>

            {/* TABELA DAS ALÍNEAS a) A j) COM RÓTULOS LITERAIS DA PORTARIA 1/2003 */}
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#0a2540] text-white font-semibold font-display">
                  <tr>
                    <th className="p-3 w-3/4 sm:w-4/5 border-r border-slate-700/60 tracking-wide uppercase text-[11px]">
                      Alínea
                    </th>
                    <th className="p-3 w-1/4 sm:w-1/5 text-center tracking-wide uppercase text-[11px]">
                      Documento
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {/* a) Termos e condições gerais do Contrato de Transporte */}
                  {(() => {
                    const item = secao1BdMap.get('alinea_a')
                    if (item && item.ativo === false) return null
                    const doc = resolverUrlDocumento(
                      item,
                      'https://www.tsb.com.br/wp-content/uploads/2023/08/Termos-e-Condicoes-do-Contrato-Extraor.pdf',
                    )
                    return (
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-800">
                          <span className="font-semibold text-[#0a2540]">a)</span>{' '}
                          {item?.titulo || 'Termos e condições gerais do Contrato de Transporte'}
                        </td>
                        <td className="p-3 text-center">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                          >
                            {doc.nomeExibicao || '- Baixar Arquivo'}
                          </a>
                        </td>
                      </tr>
                    )
                  })()}

                  {/* b) Modelo de Contrato de Serviço de Transporte, por tipo de serviço */}
                  {(() => {
                    const item = secao1BdMap.get('alinea_b')
                    if (item && item.ativo === false) return null
                    // Permanece aqui o "Contrato Master TSB 2025–2029" (transporte firme para períodos de curto prazo e anuais)
                    const docAlineaB = resolverUrlDocumento(
                      item,
                      'https://www.tsb.com.br/wp-content/uploads/2025/03/CONTRATO-MASTER-TSB-2025-2029.pdf',
                    )
                    const docMaster = masterBd
                      ? resolverUrlDocumento(
                          masterBd,
                          'https://www.tsb.com.br/wp-content/uploads/2025/03/CONTRATO-MASTER-TSB-2025-2029.pdf',
                        )
                      : null

                    return (
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-800">
                          <div className="space-y-1">
                            <div>
                              <span className="font-semibold text-[#0a2540]">b)</span>{' '}
                              <span>
                                {item?.titulo ||
                                  'Modelo de Contrato de Serviço de Transporte, por tipo de serviço'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 pl-4 space-y-0.5">
                              <p className="flex items-center gap-1.5 font-medium text-slate-700">
                                <FileCheck className="h-3 w-3 text-[#143b73] shrink-0" />
                                <span>
                                  Contrato Master TSB 2025–2029 (Transporte Firme para períodos de
                                  curto prazo e anuais)
                                </span>
                              </p>
                              {item?.descricao && (
                                <p className="text-slate-500">{item.descricao}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center space-y-1">
                          <div>
                            <a
                              href={docAlineaB.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                              {docAlineaB.nomeExibicao || 'Contrato Master TSB'}
                            </a>
                          </div>
                          {docMaster && docMaster.url && docMaster.url !== docAlineaB.url && (
                            <div>
                              <a
                                href={docMaster.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-[#0284c7] hover:underline"
                              >
                                <FileDown className="h-3 w-3" />
                                {docMaster.nomeExibicao || 'Anexo Adicional'}
                              </a>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })()}

                  {/* c) Modelo de Acordo de Conexão */}
                  {(() => {
                    const item = secao1BdMap.get('alinea_c')
                    if (item && item.ativo === false) return null
                    const doc = resolverUrlDocumento(
                      item,
                      'https://www.tsb.com.br/wp-content/uploads/2023/04/bibArq000435.pdf',
                    )
                    return (
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-800">
                          <span className="font-semibold text-[#0a2540]">c)</span>{' '}
                          {item?.titulo || 'Modelo de Acordo de Conexão'}
                        </td>
                        <td className="p-3 text-center">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                          >
                            {doc.nomeExibicao || '- Baixar Arquivo'}
                          </a>
                        </td>
                      </tr>
                    )
                  })()}

                  {/* d) Modelo de Acordo Operativo de Alocação de Capacidade */}
                  {(() => {
                    const item = secao1BdMap.get('alinea_d')
                    if (item && item.ativo === false) return null
                    const doc = resolverUrlDocumento(
                      item,
                      'https://www.tsb.com.br/wp-content/uploads/2023/04/bibArq000436.pdf',
                    )
                    return (
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-800">
                          <span className="font-semibold text-[#0a2540]">d)</span>{' '}
                          {item?.titulo || 'Modelo de Acordo Operativo de Alocação de Capacidade'}
                        </td>
                        <td className="p-3 text-center">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                          >
                            {doc.nomeExibicao || '- Baixar Arquivo'}
                          </a>
                        </td>
                      </tr>
                    )
                  })()}

                  {/* e) Mapa das instalações de transporte */}
                  {(() => {
                    const item = secao1BdMap.get('alinea_e')
                    if (item && item.ativo === false) return null
                    const doc = resolverUrlDocumento(
                      item,
                      'https://www.tsb.com.br/wp-content/uploads/2023/04/bibArq000437.pdf',
                    )
                    return (
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-800">
                          <span className="font-semibold text-[#0a2540]">e)</span>{' '}
                          {item?.titulo || 'Mapa das instalações de transporte'}
                        </td>
                        <td className="p-3 text-center">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                          >
                            {doc.nomeExibicao || '- Baixar Arquivo'}
                          </a>
                        </td>
                      </tr>
                    )
                  })()}

                  {/* f) Características físicas e Capacidade Técnica Máxima */}
                  {(() => {
                    const item = secao1BdMap.get('alinea_f')
                    if (item && item.ativo === false) return null
                    const doc = resolverUrlDocumento(
                      item,
                      'https://www.tsb.com.br/wp-content/uploads/2024/10/bol_ele_-I.f-_caracteristicas-.pdf',
                    )
                    const docSecundario = resolverUrlSecundaria(
                      item,
                      'https://www.tsb.com.br/wp-content/uploads/2024/10/bol_ele_item-I.f_-fluxos-fisicos.pdf',
                    )
                    return (
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-800">
                          <span className="font-semibold text-[#0a2540]">f)</span>{' '}
                          {item?.titulo || 'Características físicas e Capacidade Técnica Máxima'}
                        </td>
                        <td className="p-3 text-center space-y-1">
                          <div>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                            >
                              {doc.nomeExibicao || '- Características'}
                            </a>
                          </div>
                          <div>
                            <a
                              href={docSecundario.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                            >
                              {docSecundario.nomeExibicao || '- Fluxos Físicos do Gás Natural'}
                            </a>
                          </div>
                        </td>
                      </tr>
                    )
                  })()}

                  {/* g) Capacidade Disponível para novos serviços e condições para ampliá-la */}
                  {(() => {
                    const item = secao1BdMap.get('alinea_g')
                    if (item && item.ativo === false) return null
                    const doc = resolverUrlDocumento(
                      item,
                      'https://www.tsb.com.br/wp-content/uploads/2024/10/bol_elet_I_g-cap-disponivel.pdf',
                    )
                    return (
                      <>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-slate-800">
                            <span className="font-semibold text-[#0a2540]">g)</span>{' '}
                            {item?.titulo ||
                              'Capacidade Disponível para novos serviços e condições para ampliá-la'}
                          </td>
                          <td className="p-3 text-center">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                            >
                              {doc.nomeExibicao || '- Baixar Arquivo'}
                            </a>
                          </td>
                        </tr>

                        {/* BLOCO EXPLICATIVO PADRÃO NTS COLAPSÁVEL DE 1 LINHA COM CHEVRON (v0.0.33) */}
                        {blocoExplicativoG.ativo && (
                          <tr
                            className={`border-l-2 transition-colors ${
                              explicativoGExpandido
                                ? 'bg-sky-50/70 border-l-[#143b73]'
                                : 'bg-slate-50/80 hover:bg-sky-50/50 border-l-slate-300 hover:border-l-[#143b73]'
                            }`}
                          >
                            <td colSpan={2} className="p-0">
                              <button
                                type="button"
                                onClick={() => setExplicativoGExpandido((prev) => !prev)}
                                aria-expanded={explicativoGExpandido}
                                aria-controls="bloco-explicativo-nts-conteudo"
                                className="w-full text-left px-3 py-2 flex items-center justify-between gap-2.5 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143b73] focus-visible:ring-inset"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Info className="h-3.5 w-3.5 text-[#143b73] shrink-0" />
                                  <span className="text-xs font-semibold text-slate-800 group-hover:text-[#143b73] truncate">
                                    {blocoExplicativoG.titulo}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="hidden sm:inline-flex bg-white text-[#143b73] border-sky-300 text-[10px] font-mono shrink-0 py-0 px-1.5 h-4.5"
                                  >
                                    Padrão NTS • Portaria ANP 1/2003, Art. 2º, I, g
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 text-slate-500 group-hover:text-[#143b73]">
                                  <span className="text-[11px] font-medium hidden md:inline">
                                    {explicativoGExpandido ? 'Ocultar detalhes' : 'Ver detalhes'}
                                  </span>
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform duration-200 ease-out text-[#143b73] ${
                                      explicativoGExpandido ? 'rotate-180' : 'rotate-0'
                                    }`}
                                  />
                                </div>
                              </button>

                              {explicativoGExpandido && (
                                <div
                                  id="bloco-explicativo-nts-conteudo"
                                  className="px-3.5 pb-3.5 pt-1 sm:px-4 sm:pb-4 space-y-2 border-t border-sky-100 text-xs text-slate-700 animate-fade-in"
                                >
                                  <div className="flex sm:hidden items-center justify-start pt-1">
                                    <Badge
                                      variant="outline"
                                      className="bg-white text-[#143b73] border-sky-300 text-[10px] font-mono"
                                    >
                                      Padrão NTS • Portaria ANP 1/2003, Art. 2º, I, g
                                    </Badge>
                                  </div>
                                  <p className="text-slate-700 leading-relaxed text-justify">
                                    {blocoExplicativoG.descricao}
                                  </p>
                                  <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-600 font-medium">
                                    <span className="inline-flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full bg-[#143b73]" />
                                      <strong>CTM:</strong> Simulação Termo-Hidráulica (pressões e
                                      vazões nominais)
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                      <strong>CC:</strong> Dedução de consumo operacional e
                                      segurança
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full bg-amber-600" />
                                      <strong>Alocação:</strong> Firme, Interruptível e Curto Prazo
                                      (&lt; 1 ano)
                                    </span>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })()}

                  {/* h) Quantidades programadas e realizadas (dados diários do mês anterior)
                         A TABELA COM FILTROS DE ANO/MÊS E PESQUISA VOLTOU PARA DENTRO DO ITEM I NESTA POSIÇÃO h) */}
                  {(() => {
                    const item = secao1BdMap.get('alinea_h')
                    if (item && item.ativo === false) return null

                    return (
                      <tr id="alinea-h-quantidades" className="bg-sky-50/20 scroll-mt-6">
                        <td colSpan={2} className="p-4 sm:p-5 space-y-4">
                          {/* CABEÇALHO DA ALÍNEA h) */}
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[#0a2540]">h)</span>
                                <span className="font-bold text-sm text-[#0a2540]">
                                  {item?.titulo ||
                                    'Quantidades programadas e realizadas (dados diários do mês anterior)'}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className="bg-white text-[#143b73] border-blue-300 text-[10px] font-mono"
                              >
                                Trechos 1 e 3 • Portaria ANP 1/2003, Art. 2º, I, &quot;h&quot;
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Série histórica consolidada nos pontos de recepção e entrega da malha
                              TSB (Uruguaiana-Triunfo e Polo Petroquímico). Utilize os filtros
                              abaixo para pesquisar demonstrativos diários de qualquer mês ou ano
                              desde 2003.
                            </p>
                          </div>

                          {/* PAINEL DE BUSCA & FILTROS DA ALÍNEA h) */}
                          <div className="bg-slate-50 p-3.5 sm:p-4 rounded-lg border border-slate-200 space-y-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                              <div className="flex items-center gap-2">
                                <Search className="h-4 w-4 text-[#143b73]" />
                                <span className="text-xs font-bold text-[#0a1d37] uppercase tracking-wider font-display">
                                  Pesquisar &amp; Filtros de Série Histórica
                                </span>
                              </div>
                              {(pesquisaQuantidades ||
                                filtroAnoQuantidades !== 'todos' ||
                                ordemQuantidades !== 'desc' ||
                                itensExibirQuantidades !== 12) && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={limparFiltrosQuantidades}
                                  className="h-7 px-2 text-[11px] text-slate-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Limpar filtros
                                </Button>
                              )}
                            </div>

                            {/* GRID COM CAMPO PESQUISAR + ANO + ORDENAÇÃO + EXIBIR */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                              {/* 1. Pesquisar */}
                              <div className="space-y-1">
                                <Label
                                  htmlFor="pesquisarQuantidades"
                                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                                >
                                  <Search className="h-3.5 w-3.5 text-[#0284c7]" />
                                  Pesquisar:
                                </Label>
                                <Input
                                  id="pesquisarQuantidades"
                                  type="text"
                                  placeholder="Pesquisar por mês ou ano..."
                                  value={pesquisaQuantidades}
                                  onChange={(e) => setPesquisaQuantidades(e.target.value)}
                                  className="h-8 text-xs bg-white border-slate-300"
                                />
                              </div>

                              {/* 2. Filtro por Ano */}
                              <div className="space-y-1">
                                <Label
                                  htmlFor="seletorAnoQuantidades"
                                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                                >
                                  <Calendar className="h-3.5 w-3.5 text-[#0284c7]" />
                                  Ano:
                                </Label>
                                <select
                                  id="seletorAnoQuantidades"
                                  value={filtroAnoQuantidades}
                                  onChange={(e) => setFiltroAnoQuantidades(e.target.value)}
                                  className="w-full h-8 px-2.5 rounded-md border border-slate-300 text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                                >
                                  <option value="todos">
                                    Todos os anos (2003 - {anosDisponiveis[0] || 'atual'})
                                  </option>
                                  {anosDisponiveis.map((ano) => (
                                    <option key={ano} value={String(ano)}>
                                      {ano}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* 3. Ordenação */}
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                  <ArrowUpDown className="h-3.5 w-3.5 text-[#0284c7]" />
                                  Ordenação:
                                </Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={toggleOrdemQuantidades}
                                  className="w-full h-8 px-2.5 text-xs bg-white border-slate-300 text-[#0a2540] hover:bg-slate-100 font-semibold flex items-center justify-between cursor-pointer"
                                >
                                  <span className="truncate flex items-center gap-1.5">
                                    {ordemQuantidades === 'desc' ? (
                                      <>
                                        <ArrowDownWideNarrow className="h-3.5 w-3.5 text-[#0284c7] shrink-0" />
                                        <span>Mais novo primeiro</span>
                                      </>
                                    ) : (
                                      <>
                                        <ArrowUpNarrowWide className="h-3.5 w-3.5 text-[#0284c7] shrink-0" />
                                        <span>Mais velho primeiro</span>
                                      </>
                                    )}
                                  </span>
                                </Button>
                              </div>

                              {/* 4. Exibir */}
                              <div className="space-y-1">
                                <Label
                                  htmlFor="seletorItensExibirQuantidades"
                                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                                >
                                  <Eye className="h-3.5 w-3.5 text-[#0284c7]" />
                                  Exibir:
                                </Label>
                                <select
                                  id="seletorItensExibirQuantidades"
                                  value={itensExibirQuantidades}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setItensExibirQuantidades(
                                      val === 'todos' ? 'todos' : Number(val),
                                    )
                                  }}
                                  className="w-full h-8 px-2.5 rounded-md border border-slate-300 text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                                >
                                  <option value={12}>12 relatórios</option>
                                  <option value={24}>24 relatórios</option>
                                  <option value={36}>36 relatórios</option>
                                  <option value={48}>48 relatórios</option>
                                  <option value="todos">
                                    Todos ({relatoriosFiltradosTotal.length})
                                  </option>
                                </select>
                              </div>
                            </div>

                            {/* BARRA INFORMATIVA COM CONTAGEM */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-xs text-slate-600">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="bg-white text-[#0a2540] border-slate-300 font-mono text-[11px] px-2 py-0.5"
                                >
                                  Mostrando {relatoriosVisiveis.length} de{' '}
                                  {relatoriosFiltradosTotal.length} relatórios
                                </Badge>
                                {filtroAnoQuantidades !== 'todos' && (
                                  <span className="text-[11px] text-[#0284c7] font-semibold">
                                    Ano: {filtroAnoQuantidades}
                                  </span>
                                )}
                                {pesquisaQuantidades && (
                                  <span className="text-[11px] text-slate-500">
                                    Termo: &quot;{pesquisaQuantidades}&quot;
                                  </span>
                                )}
                              </div>

                              {/* BOTÕES RÁPIDOS DE QUANTIDADE */}
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] font-semibold text-slate-500 mr-1 hidden sm:inline">
                                  Exibir:
                                </span>
                                {[12, 24, 36, 48].map((qtd) => (
                                  <button
                                    key={qtd}
                                    type="button"
                                    onClick={() => setItensExibirQuantidades(qtd)}
                                    className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition-colors cursor-pointer ${
                                      itensExibirQuantidades === qtd
                                        ? 'bg-[#0a2540] text-white border-[#0a2540]'
                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                    }`}
                                  >
                                    {qtd}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => setItensExibirQuantidades('todos')}
                                  className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition-colors cursor-pointer ${
                                    itensExibirQuantidades === 'todos'
                                      ? 'bg-[#0a2540] text-white border-[#0a2540]'
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  Todos
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* SUBTABELA COM SÉRIE HISTÓRICA */}
                          <div className="overflow-x-auto border border-slate-200 rounded-md bg-white">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead className="bg-[#0c2340] text-white font-semibold font-display">
                                <tr>
                                  <th className="p-2.5 w-3/4 sm:w-4/5 border-r border-slate-700/60 tracking-wider uppercase text-[10px]">
                                    Documento / Mês de Referência (Trechos 1 e 3)
                                  </th>
                                  <th className="p-2.5 w-1/4 sm:w-1/5 text-center tracking-wider uppercase text-[10px]">
                                    Arquivo
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 bg-white">
                                {relatoriosVisiveis.length > 0 ? (
                                  relatoriosVisiveis.map((itemRel) => (
                                    <tr
                                      key={itemRel.id}
                                      className="hover:bg-slate-50 transition-colors"
                                    >
                                      <td className="p-2.5 text-slate-800 font-medium">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-3.5 w-3.5 text-[#0284c7] shrink-0" />
                                          <span>{itemRel.titulo}</span>
                                        </div>
                                      </td>
                                      <td className="p-2.5 text-center">
                                        {itemRel.temArquivoDireto ? (
                                          <a
                                            href={itemRel.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                                            title={`Baixar ${itemRel.nomeArquivo}`}
                                          >
                                            <FileDown className="h-3.5 w-3.5" />- Baixar Arquivo
                                          </a>
                                        ) : (
                                          <a
                                            href="https://www.tsb.com.br/boletim-eletronico/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-[#0284c7] hover:underline"
                                            title="Consultar no site oficial da TSB"
                                          >
                                            <ExternalLink className="h-3 w-3 text-slate-400" />-
                                            Consultar no Site Oficial
                                          </a>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={2}
                                      className="p-6 text-center text-slate-500 space-y-2"
                                    >
                                      <p className="font-semibold text-slate-700">
                                        Nenhum relatório encontrado para os critérios selecionados.
                                      </p>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={limparFiltrosQuantidades}
                                        className="text-xs h-7 mt-1 text-[#0284c7] cursor-pointer"
                                      >
                                        Limpar filtros e ver recentes
                                      </Button>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* BOTÕES DE CARREGAR MAIS */}
                          {itensExibirQuantidades !== 'todos' &&
                            relatoriosFiltradosTotal.length > relatoriosVisiveis.length && (
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md">
                                <span className="text-xs text-slate-600">
                                  Exibindo <strong>{relatoriosVisiveis.length}</strong> de{' '}
                                  <strong>{relatoriosFiltradosTotal.length}</strong> relatórios
                                  correspondentes.
                                </span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const proximaQtd = (itensExibirQuantidades as number) + 12
                                      setItensExibirQuantidades(proximaQtd)
                                    }}
                                    className="text-xs h-7 border-slate-300 text-[#0a2540] hover:bg-white cursor-pointer"
                                  >
                                    + Exibir mais 12 relatórios
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setItensExibirQuantidades('todos')}
                                    className="text-xs h-7 bg-[#0a2540] hover:bg-[#13395e] text-white cursor-pointer"
                                  >
                                    Exibir todos ({relatoriosFiltradosTotal.length})
                                  </Button>
                                </div>
                              </div>
                            )}
                        </td>
                      </tr>
                    )
                  })()}

                  {/* i) Interrupções e reduções de capacidade, atuais e planejadas */}
                  {(() => {
                    const item = secao1BdMap.get('alinea_i')
                    if (item && item.ativo === false) return null
                    const doc = resolverUrlDocumento(
                      item,
                      'https://www.tsb.com.br/wp-content/uploads/2023/04/bibArq000440.pdf',
                    )
                    return (
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-800">
                          <span className="font-semibold text-[#0a2540]">i)</span>{' '}
                          {item?.titulo ||
                            'Interrupções e reduções de capacidade, atuais e planejadas'}
                        </td>
                        <td className="p-3 text-center">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                          >
                            {doc.nomeExibicao || '- Baixar Arquivo'}
                          </a>
                        </td>
                      </tr>
                    )
                  })()}

                  {/* j) Ampliações em implantação ou planejadas */}
                  {(() => {
                    const item = secao1BdMap.get('alinea_j')
                    if (item && item.ativo === false) return null
                    const doc = resolverUrlDocumento(
                      item,
                      'https://www.tsb.com.br/wp-content/uploads/2023/08/Ampliacoes-Planejadas.pdf',
                    )
                    return (
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-800">
                          <span className="font-semibold text-[#0a2540]">j)</span>{' '}
                          {item?.titulo || 'Ampliações em implantação ou planejadas'}
                        </td>
                        <td className="p-3 text-center">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                          >
                            {doc.nomeExibicao || '- Baixar Arquivo'}
                          </a>
                        </td>
                      </tr>
                    )
                  })()}
                </tbody>
              </table>
            </div>
          </section>

          {/* =========================================================================
              BLOCO 2 — TÍTULO LITERAL: "II. Contratos de Serviço de Transporte"
              Subtítulo: (atualizado a cada novo contrato ou alteração)
              Bloco próprio e separado, no estilo NTS
              ========================================================================= */}
          {headerBlocoII.ativo && (
            <section id="bloco-item-ii" className="space-y-4 pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Badge
                      variant="outline"
                      className="bg-sky-50 text-[#143b73] border-sky-300 text-[10px] font-mono"
                    >
                      Item II, Portaria ANP nº 1/2003 • Art. 2º da Lei nº 14.134/2021
                    </Badge>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Padrão NTS / TBG • Documento Estático Regulatório
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-[#0a1d37] font-display tracking-tight">
                      {headerBlocoII.titulo}
                    </h2>
                    <span className="text-xs sm:text-sm font-medium text-slate-500 italic">
                      (atualizado a cada novo contrato ou alteração)
                    </span>
                  </div>
                  <div className="w-full h-px bg-slate-200 mt-2 mb-2" />
                  <p className="text-xs text-slate-600 leading-relaxed text-justify">
                    {headerBlocoII.descricao}
                  </p>
                </div>
              </div>

              {/* SLOT DE DOCUMENTO "RESUMO DOS CONTRATOS E TARIFAS VIGENTES" */}
              {(() => {
                // Item de contrato busca preferencialmente em boletim_contratos ou secao1BdMap
                const itemContrato =
                  itensBd.find(
                    (it) =>
                      it.secao === 'boletim_contratos' &&
                      it.chave === 'contratos_transporte_documento',
                  ) || secao1BdMap.get('contratos_transporte_documento')

                const doc = resolverUrlDocumento(itemContrato, itemContrato?.url_externa || '')
                const dataAtualizacao = itemContrato?.updated
                  ? new Date(itemContrato.updated).toLocaleDateString('pt-BR')
                  : null

                return (
                  <div className="overflow-x-auto border border-slate-200 rounded-md">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-[#0a2540] text-white font-semibold font-display">
                        <tr>
                          <th className="p-3 w-3/4 sm:w-4/5 border-r border-slate-700/60 tracking-wide uppercase text-[11px]">
                            Documento
                          </th>
                          <th className="p-3 w-1/4 sm:w-1/5 text-center tracking-wide uppercase text-[11px]">
                            Arquivo
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {doc.url ? (
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-slate-800">
                              <div className="space-y-1">
                                <div className="font-semibold text-[#0a2540]">
                                  {itemContrato?.titulo ||
                                    'Resumo dos Contratos e Tarifas Vigentes'}
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                  {itemContrato?.descricao ||
                                    'Histórico e dados consolidados dos contratos de transporte celebrados: nome do Carregador, modalidade de serviço, vigências, evolução de capacidades contratadas, tarifas/descontos e relação acionária.'}
                                </p>
                                {dataAtualizacao && (
                                  <div className="text-[10px] text-slate-500 font-mono pt-0.5">
                                    Última atualização: {dataAtualizacao}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                              >
                                <FileDown className="h-3.5 w-3.5" />
                                {doc.nomeExibicao || '- Baixar Documento'}
                              </a>
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td
                              colSpan={2}
                              className="p-6 text-center text-slate-500 bg-slate-50/60"
                            >
                              <p className="font-semibold text-slate-700">
                                Ainda não há contratos publicados.
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1 max-w-xl mx-auto">
                                O documento consolidado contendo as 6 informações regulamentares da
                                norma (nome do Carregador, tipo de serviço, datas de início/término,
                                evolução de capacidades, tarifas/descontos e relação acionária) será
                                disponibilizado nesta seção pela equipe de regulação da TSB assim
                                que houver contratos celebrados ou alterados.
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </section>
          )}

          {/* =========================================================================
              BLOCO 3 — MONITORAMENTO DO CONGESTIONAMENTO (RES. ANP 11/2016, ART. 12)
              Identificado como seção da Resolução ANP nº 11/2016, fora dos Itens I e II
              ========================================================================= */}
          {headerCongestionamento.ativo && (
            <section
              id="bloco-congestionamento"
              className="space-y-6 pt-6 border-t border-slate-200"
            >
              <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-amber-600" />
                    <h2 className="text-base sm:text-lg font-bold text-[#0a1d37] font-display">
                      {headerCongestionamento.titulo}
                    </h2>
                  </div>
                  <Badge className="bg-[#0a1d37] text-white border-0 text-[10px] font-mono">
                    Resolução ANP nº 11/2016 • Art. 12
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                  {headerCongestionamento.descricao}
                </p>

                {/* NOTAS REGULATÓRIAS ESPECÍFICAS DA RESOLUÇÃO ANP Nº 11/2016, ART. 12 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-700 space-y-1">
                    <div className="font-bold text-[#0a1d37] flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#143b73]" />
                      <span>Periodicidade &amp; Envio à ANP (Art. 12, §1º e §2º)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Os relatórios de monitoramento de utilização de capacidade são elaborados
                      mensalmente, submetidos formalmente à ANP e disponibilizados ao público após
                      homologação pela ANP.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-700 space-y-1">
                    <div className="font-bold text-[#0a1d37] flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Dados de Fluxo Operacional (Art. 12, caput)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Os dados de utilização e eventuais congestionamentos físicos e contratuais são
                      consolidados diretamente a partir do fluxo operacional medido nos pontos de
                      recepção e entrega.
                    </p>
                  </div>
                </div>
              </div>

              {/* BARRA DE FILTROS E PESQUISA DOS RELATÓRIOS DE CONGESTIONAMENTO */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-lg border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-[#143b73]" />
                    <span className="text-xs font-bold text-[#0a1d37] uppercase tracking-wider font-display">
                      Filtrar Relatórios Mensais de Congestionamento
                    </span>
                  </div>
                  {(pesquisaCongestionamento ||
                    filtroAnoCongestionamento !== 'todos' ||
                    ordemCongestionamento !== 'desc') && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPesquisaCongestionamento('')
                        setFiltroAnoCongestionamento('todos')
                        setOrdemCongestionamento('desc')
                      }}
                      className="h-7 px-2 text-[11px] text-slate-600 hover:text-red-700 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Limpar filtros
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Pesquisar:</Label>
                    <Input
                      type="text"
                      placeholder="Mês ou ano..."
                      value={pesquisaCongestionamento}
                      onChange={(e) => setPesquisaCongestionamento(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Ano:</Label>
                    <select
                      value={filtroAnoCongestionamento}
                      onChange={(e) => setFiltroAnoCongestionamento(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-md border border-slate-300 text-xs bg-white text-slate-800"
                    >
                      <option value="todos">Todos os anos</option>
                      {anosCongestionamentoDisponiveis.map((ano) => (
                        <option key={ano} value={ano}>
                          {ano}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Ordenação:</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setOrdemCongestionamento(ordemCongestionamento === 'desc' ? 'asc' : 'desc')
                      }
                      className="w-full h-8 px-2 text-xs bg-white border-slate-300 text-[#0a2540] flex items-center justify-between cursor-pointer"
                    >
                      <span>
                        {ordemCongestionamento === 'desc'
                          ? 'Mais recente primeiro'
                          : 'Mais antigo primeiro'}
                      </span>
                      <ArrowUpDown className="h-3.5 w-3.5 text-[#0284c7]" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* LISTAGEM DOS RELATÓRIOS DE CONGESTIONAMENTO OU FALLBACK OFICIAL */}
              {relatoriosCongestionamentoTotal.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-md">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#0a1d37] text-white font-semibold font-display">
                      <tr>
                        <th className="p-3 w-3/4 sm:w-4/5 border-r border-slate-700/60 tracking-wider uppercase text-[11px]">
                          Relatório de Utilização &amp; Congestionamento
                        </th>
                        <th className="p-3 w-1/4 sm:w-1/5 text-center tracking-wider uppercase text-[11px]">
                          Documento
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {relatoriosCongestionamentoTotal.map((item) => {
                        const doc = resolverUrlDocumento(item, item.url_externa || '')
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-slate-800 font-medium">
                              <div className="flex items-center gap-2">
                                <Activity className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                <div>
                                  <span className="font-semibold">{item.titulo}</span>
                                  {item.descricao && (
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      {item.descricao}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {doc.url ? (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                                >
                                  <FileDown className="h-3.5 w-3.5" />
                                  {doc.nomeExibicao || '- Baixar Relatório'}
                                </a>
                              ) : (
                                <span className="text-slate-400 italic">
                                  Disponibilização pendente
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
                <div className="p-8 text-center bg-slate-50/70 border border-slate-200 rounded-lg space-y-3">
                  <div className="inline-flex p-3 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <Activity className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0a1d37] font-display">
                    Relatórios em Processamento &amp; Publicação Mensal
                  </h3>
                  <p className="text-xs text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Os demonstrativos de Monitoramento de Utilização da Capacidade e
                    Congestionamento Físico e Contratual são submetidos mensalmente à Agência
                    Nacional do Petróleo (ANP) em conformidade com o Art. 12 da Resolução ANP nº
                    11/2016. Os arquivos são disponibilizados publicamente neste portal após
                    homologação técnica pela ANP.
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Gestores autorizados podem incluir novos relatórios mensais diretamente pela{' '}
                    <strong>Gestão Interna &rarr; Editoria de Transparência</strong>.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </Card>
    </div>
  )
}
