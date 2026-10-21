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
// Apenas os meses com arquivo real conhecido usam a URL direta;
// Os demais apontam para a página oficial do Boletim da TSB como fallback, sem inventar arquivos inexistentes.
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
        // Nomenclatura oficial: "Quantidades programadas e realizadas nos pontos de recepção e entrega -<Mês>/<Ano>"
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

  // Estado colapsado por padrão do entendimento conceitual padrão NTS (entre alínea g e h)
  const [explicativoGExpandido, setExplicativoGExpandido] = useState<boolean>(false)

  // Sub-aba interna do Boletim: 'instalacoes_servicos' | 'programadas_realizadas' | 'monitoramento_congestionamento'
  const [subAbaBoletim, setSubAbaBoletim] = useState<
    'instalacoes_servicos' | 'programadas_realizadas' | 'monitoramento_congestionamento'
  >('instalacoes_servicos')

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

  // Bloco Master Cabeçalho
  const headerMaster = useMemo(() => {
    const item = cabecalhosBdMap.get('boletim_master_header')
    const fallback = CABECALHOS_FALLBACK.boletim_master_header
    return {
      titulo:
        item?.ativo !== false && item?.titulo ? item.titulo : masterBd?.titulo || fallback.titulo,
      descricao:
        item?.ativo !== false && item?.descricao
          ? item.descricao
          : masterBd?.descricao || fallback.descricao || '',
      item,
      ativo: item ? item.ativo !== false : true,
    }
  }, [cabecalhosBdMap, masterBd])

  // Bloco Seção I Cabeçalho
  const headerSecao1 = useMemo(() => {
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

  // Bloco Seção II Cabeçalho
  const headerSecao2 = useMemo(() => {
    const item = cabecalhosBdMap.get('boletim_secao2_header')
    const fallback = CABECALHOS_FALLBACK.boletim_secao2_header
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

  // Mesclagem da série histórica com registros editados/adicionados no BD
  const historicoComBd = useMemo(() => {
    // Mapa dos canônicos indexados por chavePeriodo
    const mapHistorico = new Map<string, RelatorioMensalItem>()
    HISTORICO_QUANTIDADES_COMPLETO.forEach((item) => {
      mapHistorico.set(item.chavePeriodo, { ...item })
    })

    // Aplica os registros do PocketBase (inclusive novos relatórios e uploads)
    secao2Bd.forEach((bd) => {
      if (!bd.ativo) {
        // Se foi desativado/ocultado na gestão interna, remove da listagem
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
        mesNum: 1, // ordenação feita por chavePeriodo
        chavePeriodo: chave,
        url: urlInfo.url,
        nomeArquivo: urlInfo.nomeExibicao,
        temArquivoDireto: Boolean(urlInfo.url),
      })
    })

    return Array.from(mapHistorico.values())
  }, [secao2Bd])

  // Seção II: Filtros e Pesquisa
  const [pesquisaSecaoII, setPesquisaSecaoII] = useState<string>('')
  const [filtroAnoSecaoII, setFiltroAnoSecaoII] = useState<string>('todos')
  const [ordemSecaoII, setOrdemSecaoII] = useState<'desc' | 'asc'>('desc')
  const [itensExibir, setItensExibir] = useState<number | 'todos'>(12)

  // Anos disponíveis na série histórica (incluindo anos criados no BD)
  const anosDisponiveis = useMemo(() => {
    const anosSet = new Set<number>()
    historicoComBd.forEach((item) => {
      if (item.anoNum) anosSet.add(item.anoNum)
    })
    return Array.from(anosSet).sort((a, b) => b - a)
  }, [historicoComBd])

  // Filtragem dos relatórios da Seção II
  const relatoriosFiltradosTotal = useMemo(() => {
    const termo = pesquisaSecaoII.trim().toLowerCase()

    const filtrados = historicoComBd.filter((item) => {
      // Filtro por texto pesquisado
      if (termo) {
        const correspondeTitulo = item.titulo.toLowerCase().includes(termo)
        const correspondeAno = item.ano.includes(termo)
        const correspondeMes = item.mes.toLowerCase().includes(termo)
        if (!correspondeTitulo && !correspondeAno && !correspondeMes) {
          return false
        }
      }

      // Filtro por Ano
      if (filtroAnoSecaoII !== 'todos' && String(item.anoNum) !== filtroAnoSecaoII) {
        return false
      }

      return true
    })

    // Ordenação
    return filtrados.sort((a, b) => {
      if (ordemSecaoII === 'asc') {
        return a.chavePeriodo.localeCompare(b.chavePeriodo)
      }
      return b.chavePeriodo.localeCompare(a.chavePeriodo)
    })
  }, [historicoComBd, pesquisaSecaoII, filtroAnoSecaoII, ordemSecaoII])

  // Itens visíveis conforme paginação
  const relatoriosVisiveis =
    itensExibir === 'todos'
      ? relatoriosFiltradosTotal
      : relatoriosFiltradosTotal.slice(0, itensExibir)

  // Filtros específicos do Monitoramento de Congestionamento
  const [pesquisaCongestionamento, setPesquisaCongestionamento] = useState<string>('')
  const [filtroAnoCongestionamento, setFiltroAnoCongestionamento] = useState<string>('todos')
  const [ordemCongestionamento, setOrdemCongestionamento] = useState<'desc' | 'asc'>('desc')

  // Relatórios de congestionamento ativos ordenados e filtrados
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

  const toggleOrdemSecaoII = () => {
    const novaOrdem = ordemSecaoII === 'desc' ? 'asc' : 'desc'
    setOrdemSecaoII(novaOrdem)
    toast({
      title: 'Ordenação alterada',
      description:
        novaOrdem === 'desc'
          ? 'Exibindo do MAIS NOVO PARA O MAIS VELHO.'
          : 'Exibindo do MAIS VELHO PARA O MAIS NOVO.',
    })
  }

  const limparFiltrosSecaoII = () => {
    setPesquisaSecaoII('')
    setFiltroAnoSecaoII('todos')
    setOrdemSecaoII('desc')
    setItensExibir(12)
    toast({
      title: 'Filtros redefinidos',
      description: 'Exibindo os 12 arquivos mais recentes da série histórica.',
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* CARD PRINCIPAL ESPELHANDO ESTRUTURA OFICIAL TSB */}
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

        {/* NAVEGAÇÃO RÁPIDA / SUMÁRIO DISCRETO (PADRÃO TRANSPARÊNCIA SEM ABAS PROEMINENTES) */}
        <div className="mx-6 sm:mx-8 mt-5 p-3 sm:p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              Seção ativa:
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0a1d37] text-white text-[11px] font-bold">
              {subAbaBoletim === 'instalacoes_servicos' && 'Seção I: Instalações & Contratos'}
              {subAbaBoletim === 'programadas_realizadas' &&
                'Seção II: Quantidades Programadas & Realizadas'}
              {subAbaBoletim === 'monitoramento_congestionamento' &&
                'Monitoramento de Congestionamento (Res. 11/2016)'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="text-slate-400 hidden md:inline">Ir para:</span>
            {subAbaBoletim !== 'instalacoes_servicos' && (
              <button
                type="button"
                onClick={() => {
                  setSubAbaBoletim('instalacoes_servicos')
                  window.scrollTo({ top: 380, behavior: 'smooth' })
                }}
                className="text-[#0284c7] hover:text-[#0369a1] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                &bull; Seção I (Instalações)
              </button>
            )}
            {subAbaBoletim !== 'programadas_realizadas' && (
              <button
                type="button"
                onClick={() => {
                  setSubAbaBoletim('programadas_realizadas')
                  window.scrollTo({ top: 380, behavior: 'smooth' })
                }}
                className="text-[#0284c7] hover:text-[#0369a1] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                &bull; Seção II (Quantidades)
              </button>
            )}
            {subAbaBoletim !== 'monitoramento_congestionamento' && (
              <button
                type="button"
                onClick={() => {
                  setSubAbaBoletim('monitoramento_congestionamento')
                  window.scrollTo({ top: 380, behavior: 'smooth' })
                }}
                className="text-amber-700 hover:text-amber-800 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                &bull; Monitoramento (Res. 11/2016)
              </button>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-10">
          {/* =========================================================================
              CONTEÚDO DA SUB-ABA 1: SEÇÃO I (CONTRATO MASTER + ALÍNEAS a-j)
              ========================================================================= */}
          {subAbaBoletim === 'instalacoes_servicos' && (
            <>
              {/* ITEM 1 & 2: MODELO DE CONTRATO MASTER DE TRANSPORTE FIRME */}
              {(!masterBd || masterBd.ativo) && headerMaster.ativo && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <h2 className="text-base sm:text-lg font-bold text-[#0a1d37] font-display">
                        {headerMaster.titulo}
                      </h2>
                      <div className="w-full h-px bg-slate-200 mt-2 mb-3" />
                      {headerMaster.descricao && (
                        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                          {headerMaster.descricao}
                        </p>
                      )}
                    </div>
                    {(() => {
                      if (!headerMaster.item) return null
                      const docHeader = resolverUrlDocumento(headerMaster.item, '')
                      if (!docHeader.url) return null
                      return (
                        <a
                          href={docHeader.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-50 text-[#0284c7] hover:bg-sky-100 text-xs font-semibold shrink-0 transition-colors border border-sky-200 self-start mt-1"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          {docHeader.nomeExibicao || 'Anexo do Cabeçalho'}
                        </a>
                      )
                    })()}
                  </div>

                  {/* TABELA: NOME DO DOCUMENTO | ARQUIVO */}
                  {(() => {
                    const docMaster = resolverUrlDocumento(
                      masterBd,
                      'https://www.tsb.com.br/wp-content/uploads/2025/03/CONTRATO-MASTER-TSB-2025-2029.pdf',
                    )
                    return (
                      <div className="overflow-x-auto border border-slate-200 rounded-md">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-[#0a1d37] text-white font-semibold font-display">
                            <tr>
                              <th className="p-3 w-3/4 sm:w-4/5 border-r border-slate-700/60 tracking-wide uppercase text-[11px]">
                                Nome do Documento
                              </th>
                              <th className="p-3 w-1/4 sm:w-1/5 text-center tracking-wide uppercase text-[11px]">
                                Arquivo
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 text-slate-800 font-medium">
                                {masterBd?.titulo ||
                                  headerMaster.titulo ||
                                  'Modelo de Contrato Master de Transporte Firme para períodos de curto prazo e anuais'}
                              </td>
                              <td className="p-3 text-center">
                                <a
                                  href={docMaster.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                                >
                                  <FileDown className="h-3.5 w-3.5" />
                                  {docMaster.nomeExibicao || 'Baixar Arquivo'}
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* ITEM 3: SEÇÃO I - INSTALAÇÕES DE TRANSPORTE E SERVIÇOS PRESTADOS */}
              <div className="space-y-4">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <h2 className="text-base sm:text-lg font-bold text-[#0a1d37] font-display">
                        {headerSecao1.titulo}
                      </h2>
                      <div className="w-full h-px bg-slate-200 mt-2 mb-2" />
                      {headerSecao1.descricao && (
                        <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                          {headerSecao1.descricao}
                        </p>
                      )}
                    </div>
                    {(() => {
                      if (!headerSecao1.item) return null
                      const doc = resolverUrlDocumento(headerSecao1.item, '')
                      if (!doc.url) return null
                      return (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-50 text-[#0284c7] hover:bg-sky-100 text-xs font-semibold shrink-0 transition-colors border border-sky-200 self-start mt-1"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          {doc.nomeExibicao || 'Anexo da Seção I'}
                        </a>
                      )
                    })()}
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-md">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#0a1d37] text-white font-semibold font-display">
                      <tr>
                        <th className="p-3 w-3/4 sm:w-4/5 border-r border-slate-700/60 tracking-wide uppercase text-[11px]">
                          Nome do Documento
                        </th>
                        <th className="p-3 w-1/4 sm:w-1/5 text-center tracking-wide uppercase text-[11px]">
                          Arquivo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {/* a) */}
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
                              {item?.titulo || 'Termos e condições gerais de prestação de serviço'}
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

                      {/* b) */}
                      {(() => {
                        const item = secao1BdMap.get('alinea_b')
                        if (item && item.ativo === false) return null
                        const doc = resolverUrlDocumento(
                          item,
                          'https://www.tsb.com.br/wp-content/uploads/2025/03/CONTRATO-MASTER-TSB-2025-2029.pdf',
                        )
                        return (
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-slate-800">
                              <span className="font-semibold text-[#0a2540]">b)</span>{' '}
                              {item?.titulo || 'Modelo de contrato para cada tipo de serviço'}
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

                      {/* c) */}
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
                              {item?.titulo || 'Modelo de acordo de conexão'}
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

                      {/* d) */}
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
                              {item?.titulo ||
                                'Modelo de Acordo Operativo de alocação das quantidades de gás nas estações de entrega'}
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

                      {/* e) */}
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
                              {item?.titulo || 'Mapa atualizado das instalações de transporte'}
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

                      {/* f) */}
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
                              {item?.titulo ||
                                'Características Físicas e Capacidade Máxima das Instalações de Transporte, nas melhores condições operacionais'}
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

                      {/* g) COM BLOCO EXPLICATIVO DE CAPACIDADE FIRME (PADRÃO NTS) */}
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
                                  'Capacidade Disponível para Prestação de Novos Serviços de Transporte Firme nas melhores condições operacionais'}
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

                            {/* BLOCO EXPLICATIVO PADRÃO NTS COLAPSÁVEL DE 1 LINHA (ENTRE g e h) */}
                            {blocoExplicativoG.ativo && (
                              <tr
                                className={`border-l-2 transition-colors ${
                                  explicativoGExpandido
                                    ? 'bg-sky-50/70 border-l-[#143b73]'
                                    : 'bg-slate-50/80 hover:bg-sky-50/50 border-l-slate-300 hover:border-l-[#143b73]'
                                }`}
                              >
                                <td colSpan={2} className="p-0">
                                  {/* Linha compacta (acionador discreto acessível) */}
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
                                        {explicativoGExpandido
                                          ? 'Ocultar detalhes'
                                          : 'Ver detalhes'}
                                      </span>
                                      <ChevronDown
                                        className={`h-4 w-4 transition-transform duration-200 ease-out text-[#143b73] ${
                                          explicativoGExpandido ? 'rotate-180' : 'rotate-0'
                                        }`}
                                      />
                                    </div>
                                  </button>

                                  {/* Conteúdo detalhado completo expandido */}
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
                                          <strong>CTM:</strong> Simulação Termo-Hidráulica (pressões
                                          e vazões nominais)
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                          <strong>CC:</strong> Dedução de consumo operacional e
                                          segurança
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                          <span className="w-2 h-2 rounded-full bg-amber-600" />
                                          <strong>Alocação:</strong> Firme, Interruptível e Curto
                                          Prazo (&lt; 1 ano)
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
                      {/* h) */}
                      {(() => {
                        const item = secao1BdMap.get('alinea_h')
                        if (item && item.ativo === false) return null
                        return (
                          <tr className="bg-sky-50/40 hover:bg-sky-50 transition-colors">
                            <td className="p-3 text-slate-800">
                              <div className="flex items-start gap-1.5">
                                <span className="font-semibold text-[#0a2540]">h)</span>
                                <div>
                                  <span>
                                    {item?.titulo ||
                                      'Quantidades Programadas e Realizadas de Gás nos pontos de recepção e entrega (dados diários, referentes ao mês anterior)'}{' '}
                                    -{' '}
                                  </span>
                                  <strong className="text-[#0a2540]">
                                    {item?.descricao ||
                                      'Consultar Tabela no item "Quantidades realizadas de gás nos pontos de recepção e entrega" constante na Seção II'}
                                  </strong>
                                  <div className="mt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSubAbaBoletim('programadas_realizadas')
                                        const el = document.getElementById('secao-ii-quantidades')
                                        if (el) el.scrollIntoView({ behavior: 'smooth' })
                                      }}
                                      className="text-[11px] font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      &rarr; Acessar Seção II (Quantidades Programadas &amp;
                                      Realizadas)
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-400">-</td>
                          </tr>
                        )
                      })()}

                      {/* i) */}
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
                                'Interrupções e Reduções de Capacidade, atuais e planejadas, no sistema'}
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

                      {/* j) */}
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
                              {item?.titulo || 'Ampliações Planejadas'}
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

                {/* NAVEGAÇÃO DISCRETA NO FINAL DA SEÇÃO I */}
                <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 text-xs text-slate-600">
                  <span className="text-slate-500 text-[11px]">
                    Boletim Eletrônico • Seção I Concluída
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSubAbaBoletim('programadas_realizadas')
                        window.scrollTo({ top: 380, behavior: 'smooth' })
                      }}
                      className="inline-flex items-center gap-1.5 text-[#0284c7] hover:text-[#0369a1] font-semibold transition-colors"
                    >
                      Ir para Seção II (Quantidades Programadas &amp; Realizadas) &rarr;
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSubAbaBoletim('monitoramento_congestionamento')
                        window.scrollTo({ top: 380, behavior: 'smooth' })
                      }}
                      className="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-800 font-semibold transition-colors"
                    >
                      Monitoramento de Congestionamento &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              CONTEÚDO DA SUB-ABA 2: SEÇÃO II (QUANTIDADES PROGRAMADAS E REALIZADAS)
              ========================================================================= */}
          {subAbaBoletim === 'programadas_realizadas' && (
            <div id="secao-ii-quantidades" className="space-y-4 scroll-mt-6">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <h2 className="text-base sm:text-lg font-bold text-[#0a1d37] font-display">
                      {headerSecao2.titulo}
                    </h2>
                    <div className="w-full h-px bg-slate-200 mt-2 mb-3" />
                    {headerSecao2.descricao && (
                      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                        {headerSecao2.descricao}
                      </p>
                    )}
                  </div>
                  {(() => {
                    if (!headerSecao2.item) return null
                    const doc = resolverUrlDocumento(headerSecao2.item, '')
                    if (!doc.url) return null
                    return (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-50 text-[#0284c7] hover:bg-sky-100 text-xs font-semibold shrink-0 transition-colors border border-sky-200 self-start mt-1"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        {doc.nomeExibicao || 'Anexo da Seção II'}
                      </a>
                    )
                  })()}
                </div>
              </div>

              {/* PAINEL DE BUSCA & FILTROS DA SEÇÃO II */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-lg border border-slate-200 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-[#143b73]" />
                    <span className="text-xs font-bold text-[#0a1d37] uppercase tracking-wider font-display">
                      Pesquisar &amp; Filtros de Série Histórica
                    </span>
                  </div>
                  {(pesquisaSecaoII ||
                    filtroAnoSecaoII !== 'todos' ||
                    ordemSecaoII !== 'desc' ||
                    itensExibir !== 12) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={limparFiltrosSecaoII}
                      className="h-7 px-2 text-[11px] text-slate-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Limpar filtros
                    </Button>
                  )}
                </div>

                {/* GRID COM CAMPO PESQUISAR + ANO + ORDENAÇÃO + EXIBIR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                  {/* 1. Campo Pesquisar (espelhando a funcionalidade do site oficial) */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="pesquisarSecaoII"
                      className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                    >
                      <Search className="h-3.5 w-3.5 text-[#0284c7]" />
                      Pesquisar:
                    </Label>
                    <Input
                      id="pesquisarSecaoII"
                      type="text"
                      placeholder="Pesquisar por mês ou ano..."
                      value={pesquisaSecaoII}
                      onChange={(e) => setPesquisaSecaoII(e.target.value)}
                      className="h-8 text-xs bg-white border-slate-300"
                    />
                  </div>

                  {/* 2. Filtro por Ano */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="seletorAnoSecaoII"
                      className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                    >
                      <Calendar className="h-3.5 w-3.5 text-[#0284c7]" />
                      Ano:
                    </Label>
                    <select
                      id="seletorAnoSecaoII"
                      value={filtroAnoSecaoII}
                      onChange={(e) => setFiltroAnoSecaoII(e.target.value)}
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

                  {/* 3. Ordenação: Mais novo ⇄ Mais velho */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <ArrowUpDown className="h-3.5 w-3.5 text-[#0284c7]" />
                      Ordenação:
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={toggleOrdemSecaoII}
                      className="w-full h-8 px-2.5 text-xs bg-white border-slate-300 text-[#0a2540] hover:bg-slate-100 font-semibold flex items-center justify-between"
                    >
                      <span className="truncate flex items-center gap-1.5">
                        {ordemSecaoII === 'desc' ? (
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

                  {/* 4. Quantidade de relatórios a exibir */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="seletorItensExibir"
                      className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#0284c7]" />
                      Exibir:
                    </Label>
                    <select
                      id="seletorItensExibir"
                      value={itensExibir}
                      onChange={(e) => {
                        const val = e.target.value
                        setItensExibir(val === 'todos' ? 'todos' : Number(val))
                      }}
                      className="w-full h-8 px-2.5 rounded-md border border-slate-300 text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                    >
                      <option value={12}>12 relatórios</option>
                      <option value={24}>24 relatórios</option>
                      <option value={36}>36 relatórios</option>
                      <option value={48}>48 relatórios</option>
                      <option value="todos">Todos ({relatoriosFiltradosTotal.length})</option>
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
                      Mostrando {relatoriosVisiveis.length} de {relatoriosFiltradosTotal.length}{' '}
                      relatórios
                    </Badge>
                    {filtroAnoSecaoII !== 'todos' && (
                      <span className="text-[11px] text-[#0284c7] font-semibold">
                        Ano: {filtroAnoSecaoII}
                      </span>
                    )}
                    {pesquisaSecaoII && (
                      <span className="text-[11px] text-slate-500">
                        Termo: &quot;{pesquisaSecaoII}&quot;
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
                        onClick={() => setItensExibir(qtd)}
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition-colors ${
                          itensExibir === qtd
                            ? 'bg-[#0a2540] text-white border-[#0a2540]'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {qtd}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setItensExibir('todos')}
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition-colors ${
                        itensExibir === 'todos'
                          ? 'bg-[#0a2540] text-white border-[#0a2540]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Todos
                    </button>
                  </div>
                </div>
              </div>

              {/* TABELA DE ARQUIVOS DA SEÇÃO II */}
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#0a1d37] text-white font-semibold font-display">
                    <tr>
                      <th className="p-3 w-3/4 sm:w-4/5 border-r border-slate-700/60 tracking-wider uppercase text-[11px]">
                        Documento / Mês de Referência (Trechos 1 e 3)
                      </th>
                      <th className="p-3 w-1/4 sm:w-1/5 text-center tracking-wider uppercase text-[11px]">
                        Arquivo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {relatoriosVisiveis.length > 0 ? (
                      relatoriosVisiveis.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-slate-800 font-medium">
                            <div className="flex items-center gap-2">
                              <FileText className="h-3.5 w-3.5 text-[#0284c7] shrink-0" />
                              <span>{item.titulo}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {item.temArquivoDireto ? (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                                title={`Baixar ${item.nomeArquivo}`}
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
                                <ExternalLink className="h-3 w-3 text-slate-400" />- Consultar no
                                Site Oficial
                              </a>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="p-6 text-center text-slate-500 space-y-2">
                          <p className="font-semibold text-slate-700">
                            Nenhum relatório encontrado para os critérios selecionados.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={limparFiltrosSecaoII}
                            className="text-xs h-7 mt-1 text-[#0284c7]"
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
              {itensExibir !== 'todos' &&
                relatoriosFiltradosTotal.length > relatoriosVisiveis.length && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <span className="text-xs text-slate-600">
                      Exibindo <strong>{relatoriosVisiveis.length}</strong> de{' '}
                      <strong>{relatoriosFiltradosTotal.length}</strong> relatórios correspondentes.
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const proximaQtd = (itensExibir as number) + 12
                          setItensExibir(proximaQtd)
                        }}
                        className="text-xs h-8 border-slate-300 text-[#0a2540] hover:bg-white"
                      >
                        + Exibir mais 12 relatórios
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setItensExibir('todos')}
                        className="text-xs h-8 bg-[#0a2540] hover:bg-[#13395e] text-white"
                      >
                        Exibir todos ({relatoriosFiltradosTotal.length})
                      </Button>
                    </div>
                  </div>
                )}

              {/* NAVEGAÇÃO DISCRETA INTEGRADA AO RODAPÉ DA SEÇÃO II */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 text-xs text-slate-600">
                <button
                  type="button"
                  onClick={() => {
                    setSubAbaBoletim('instalacoes_servicos')
                    window.scrollTo({ top: 380, behavior: 'smooth' })
                  }}
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0a1d37] font-semibold transition-colors"
                >
                  &larr; Voltar para Seção I (Instalações &amp; Contratos)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubAbaBoletim('monitoramento_congestionamento')
                    window.scrollTo({ top: 380, behavior: 'smooth' })
                  }}
                  className="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-800 font-semibold transition-colors"
                >
                  Ir para Monitoramento de Congestionamento (Res. 11/2016) &rarr;
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              CONTEÚDO DA SUB-ABA 3: MONITORAMENTO DE CONGESTIONAMENTO (RES. ANP 11/2016, ART. 12)
              ========================================================================= */}
          {subAbaBoletim === 'monitoramento_congestionamento' && (
            <div className="space-y-6">
              {/* CABEÇALHO DO MONITORAMENTO DE CONGESTIONAMENTO */}
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
                      mensalmente, submetidos formalmente à ANP e disponibilizados ao público logo
                      após o envio.
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
                      className="h-7 px-2 text-[11px] text-slate-600 hover:text-red-700"
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
                      className="w-full h-8 px-2 text-xs bg-white border-slate-300 text-[#0a2540] flex items-center justify-between"
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
                          Relatório de Utilização &amp; Congestionamento (Art. 12)
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
                /* FALLBACK OFICIAL TRANSPARENTE CONFORME REGRAS DO PROJETO */
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
                    homologação técnica.
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Gestores autorizados podem incluir novos relatórios mensais diretamente pela{' '}
                    <strong>Gestão Interna &rarr; Editoria de Transparência</strong>.
                  </p>
                </div>
              )}

              {/* NAVEGAÇÃO DISCRETA INTEGRADA AO RODAPÉ DO MONITORAMENTO */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 text-xs text-slate-600">
                <button
                  type="button"
                  onClick={() => {
                    setSubAbaBoletim('instalacoes_servicos')
                    window.scrollTo({ top: 380, behavior: 'smooth' })
                  }}
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0a1d37] font-semibold transition-colors"
                >
                  &larr; Voltar para Seção I (Instalações &amp; Contratos)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubAbaBoletim('programadas_realizadas')
                    window.scrollTo({ top: 380, behavior: 'smooth' })
                  }}
                  className="inline-flex items-center gap-1.5 text-[#0284c7] hover:text-[#0369a1] font-semibold transition-colors"
                >
                  Ir para Seção II (Quantidades Programadas &amp; Realizadas) &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
