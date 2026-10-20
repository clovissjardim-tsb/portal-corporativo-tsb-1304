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

        <div className="p-6 sm:p-8 space-y-10">
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

                  {/* g) */}
                  {(() => {
                    const item = secao1BdMap.get('alinea_g')
                    if (item && item.ativo === false) return null
                    const doc = resolverUrlDocumento(
                      item,
                      'https://www.tsb.com.br/wp-content/uploads/2024/10/bol_elet_I_g-cap-disponivel.pdf',
                    )
                    return (
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
                                  'Consultar Tabela no item "Quantidades realizadas de gás nos pontos de recepção e entrega" constante no final dessa página'}
                              </strong>
                              <div className="mt-1">
                                <a
                                  href="#secao-ii-quantidades"
                                  className="text-[11px] font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline inline-flex items-center gap-1"
                                >
                                  &rarr; Ver relatórios mensais na Seção II abaixo
                                </a>
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
          </div>

          {/* ITEM 4: SEÇÃO II - QUANTIDADES PROGRAMADAS E REALIZADAS NOS TRECHOS 1 E 3 */}
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
                              <ExternalLink className="h-3 w-3 text-slate-400" />- Consultar no Site
                              Oficial
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
          </div>
        </div>
      </Card>
    </div>
  )
}
