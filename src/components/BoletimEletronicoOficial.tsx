import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
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
  Search,
  Calendar,
  ArrowUpDown,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Eye,
  RotateCcw,
  ChevronDown,
  Info,
  ShieldAlert,
  Activity,
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
  mesNum: number
  chavePeriodo: string
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

// Ícone de documento PDF estilo NTS (glifo discreto de 16-18px com canto dobrado e contorno refinado)
function PdfIcon({ className = 'w-4.5 h-4.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 inline-block align-middle text-red-600 ${className}`}
      aria-hidden="true"
      style={{ minWidth: '16px', minHeight: '16px', maxWidth: '20px', maxHeight: '20px' }}
    >
      {/* Contorno do arquivo com canto superior direito chanfrado/dobrado */}
      <path
        d="M3 2.5C3 1.94772 3.44772 1.5 4 1.5H9.5L13 5V13.5C13 14.0523 12.5523 14.5 12 14.5H4C3.44772 14.5 3 14.0523 3 13.5V2.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="#fef2f2"
      />
      {/* Canto dobrado */}
      <path
        d="M9.5 1.5V5H13"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Badge/Texto 'PDF' em miniatura */}
      <rect x="4.2" y="7.2" width="7.6" height="4.8" rx="0.8" fill="currentColor" />
      <text
        x="8"
        y="10.8"
        fill="#ffffff"
        fontSize="3.2"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
        textAnchor="middle"
        letterSpacing="0.2"
      >
        PDF
      </text>
    </svg>
  )
}

// Linha de documento simples e limpa estilo NTS: [PDF icon pequeno 16-18px] + Nome do documento com link sutil
interface DocumentLinkRowProps {
  url: string
  label: string
  title?: string
  external?: boolean
  sublabel?: string
}

function DocumentLinkRow({ url, label, title, external, sublabel }: DocumentLinkRowProps) {
  if (!url) return null
  return (
    <div className="group flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={title || label}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-[#0284c7] transition-colors py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] rounded-xs"
      >
        <PdfIcon className="w-4 h-4 text-red-600 transition-transform group-hover:scale-110" />
        <span className="underline decoration-slate-300 underline-offset-4 group-hover:decoration-[#0284c7]">
          {label}
        </span>
        {external && (
          <span className="text-[11px] text-slate-400 font-normal no-underline">(externo)</span>
        )}
      </a>
      {sublabel && (
        <span className="text-xs text-slate-500 pl-6 sm:pl-0 font-normal">{sublabel}</span>
      )}
    </div>
  )
}

// Gera a série histórica desde 2003 (ano de criação da Portaria ANP 1/2003)
function gerarHistoricoQuantidades(): RelatorioMensalItem[] {
  const agora = new Date()
  const anoAtual = Math.max(agora.getFullYear(), 2026)
  const mesAtual = anoAtual === agora.getFullYear() ? agora.getMonth() + 1 : 9

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
        titulo: `Quantidades programadas e realizadas nos pontos de recepção e entrega - ${nomeMes}/${ano}`,
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

  // Mapas por chave e seção
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

  // Estado colapsado do bloco NTS na alínea g)
  const [explicativoGExpandido, setExplicativoGExpandido] = useState<boolean>(false)

  // Resolução dinâmica de cabeçalhos com fallback canônico
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

  // Bloco I agora é Contratos de Serviço de Transporte (decisão explícita do usuário)
  const headerBlocoI = useMemo(() => {
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

  // Bloco II agora é Instalações de Transporte e Serviços Prestados (decisão explícita do usuário)
  const headerBlocoII = useMemo(() => {
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

  // Mesclagem da série histórica com o BD
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

  // Filtros Alínea h
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

  // Filtros Monitoramento de Congestionamento
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

  // Helper de documento do topo
  const docTopo = useMemo(() => {
    if (!headerBoletimTopo.item) return null
    return resolverUrlDocumento(headerBoletimTopo.item, '')
  }, [headerBoletimTopo])

  // Helper do anexo do Bloco I (se houver)
  const docBlocoI = useMemo(() => {
    if (!headerBlocoI.item) return null
    return resolverUrlDocumento(headerBlocoI.item, '')
  }, [headerBlocoI])

  // Helper do anexo do Bloco II (se houver)
  const docBlocoII = useMemo(() => {
    if (!headerBlocoII.item) return null
    return resolverUrlDocumento(headerBlocoII.item, '')
  }, [headerBlocoII])

  // Estado do acordeão para as alíneas a) a j) do Bloco II
  // Inicialmente todas fechadas por padrão (Set vazio). Permite abertura múltipla simultânea.
  const [alineasAbertas, setAlineasAbertas] = useState<Set<string>>(new Set())

  const toggleAlinea = (letra: string) => {
    setAlineasAbertas((prev) => {
      const novo = new Set(prev)
      if (novo.has(letra)) {
        novo.delete(letra)
      } else {
        novo.add(letra)
      }
      return novo
    })
  }

  return (
    <div className="space-y-10 animate-fade-in text-slate-800">
      {/* CARD PRINCIPAL COM PADRÃO NTS: FUNDO BRANCO, ARQUITETURA LIMPA E ESPAÇO RESPIRANDO */}
      <Card className="border border-slate-200/90 shadow-xs bg-white overflow-hidden rounded-xl">
        {/* CABEÇALHO LIMPO E SÓBRIO COM IDENTIDADE TSB */}
        <div className="px-6 py-7 sm:px-10 sm:py-9 bg-white border-b border-slate-200">
          <div className="max-w-4xl space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#143b73] tracking-wide uppercase font-display">
              <span>Portaria ANP nº 1, de 06/01/2003</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-normal normal-case">Art. 2º da Portaria</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0a2540] font-display">
              {headerBoletimTopo.titulo}
            </h1>

            {headerBoletimTopo.descricao && (
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-justify sm:text-left">
                {headerBoletimTopo.descricao}
              </p>
            )}

            {docTopo && docTopo.url && (
              <div className="pt-2">
                <DocumentLinkRow
                  url={docTopo.url}
                  label={docTopo.nomeExibicao || 'Anexo Geral do Boletim Eletrônico'}
                />
              </div>
            )}
          </div>
        </div>

        {/* AVISO DE FAIXAS DE SERVIDÃO (RES. 42/2012, ART. 46) — BLOCO DISCRETO E CONTIDO */}
        {avisoServidao.ativo && (
          <div className="mx-6 sm:mx-10 mt-8 p-5 rounded-lg bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row items-start gap-4">
            <div className="p-2 rounded-md bg-[#0a2540] text-white shrink-0 mt-0.5">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-bold text-[#0a2540] font-display">
                  {avisoServidao.titulo}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Resolução ANP nº 42/2012 • Art. 46
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed text-justify">
                {avisoServidao.descricao}
              </p>
              {(() => {
                if (!avisoServidao.item) return null
                const doc = resolverUrlDocumento(avisoServidao.item, '')
                if (!doc.url) return null
                return (
                  <div className="pt-1">
                    <DocumentLinkRow
                      url={doc.url}
                      label={doc.nomeExibicao || 'Consultar Documento da Resolução ANP'}
                    />
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        <div className="px-6 py-8 sm:px-10 sm:py-12 space-y-16">
          {/* =========================================================================
              ITEM I — INSTALAÇÕES DE TRANSPORTE E SERVIÇOS PRESTADOS
              Padrão NTS:
              - Título de norma grande, claro e direto
              - Subtítulo discreto em itálico "(atualizadas permanentemente)"
              - Cada alínea é um bloco próprio e legível:
                  Letra + título da norma em destaque escuro
                  Linhas simples com [Ícone PDF] + Nome do documento
              - Sem caixas dentro de caixas, sem bordas duplas, sem badges aos montes
              ========================================================================= */}
          <section id="bloco-item-i" className="space-y-8">
            {/* Header de Seção estilo NTS */}
            <div className="space-y-2 border-b border-slate-200 pb-4">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-[#0a2540] font-display tracking-tight">
                  {headerBlocoI.titulo}
                </h2>
                <span className="text-sm font-normal text-slate-500 italic">
                  (atualizadas permanentemente)
                </span>
              </div>
              {headerBlocoI.descricao && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
                  {headerBlocoI.descricao}
                </p>
              )}
              {docBlocoI && docBlocoI.url && (
                <div className="pt-1">
                  <DocumentLinkRow
                    url={docBlocoI.url}
                    label={docBlocoI.nomeExibicao || 'Anexo do Item I'}
                  />
                </div>
              )}
            </div>

            {/* LISTAGEM DAS ALÍNEAS a) A j) — BLOCOS ESTILO NTS COM RESPIRO GENEROSO */}
            <div className="divide-y divide-slate-100 space-y-8">
              {/* a) Termos e condições gerais de prestação de serviço */}
              {(() => {
                const item = secao1BdMap.get('alinea_a')
                if (item && item.ativo === false) return null
                const doc = resolverUrlDocumento(
                  item,
                  'https://www.tsb.com.br/wp-content/uploads/2023/08/Termos-e-Condicoes-do-Contrato-Extraor.pdf',
                )
                const tituloTexto =
                  item?.titulo || 'Termos e condições gerais do Contrato de Transporte'
                return (
                  <div className="pt-6 first:pt-0 space-y-2.5">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                      <span className="font-bold text-[#0a2540] mr-1.5">a)</span>
                      {tituloTexto}
                    </h3>
                    {item?.descricao && (
                      <p className="text-xs text-slate-500 leading-relaxed">{item.descricao}</p>
                    )}
                    <div className="pl-5 space-y-1.5">
                      <DocumentLinkRow
                        url={doc.url}
                        label={
                          doc.nomeExibicao && doc.nomeExibicao !== '- Baixar Arquivo'
                            ? doc.nomeExibicao
                            : 'Termos e Condições Gerais do Contrato de Transporte Extraordinário'
                        }
                      />
                    </div>
                  </div>
                )
              })()}

              {/* b) Modelo de Contrato de Serviço de Transporte, por tipo de serviço */}
              {(() => {
                const item = secao1BdMap.get('alinea_b')
                if (item && item.ativo === false) return null
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
                const tituloTexto =
                  item?.titulo || 'Modelo de Contrato de Serviço de Transporte, por tipo de serviço'

                return (
                  <div className="pt-6 space-y-2.5">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                      <span className="font-bold text-[#0a2540] mr-1.5">b)</span>
                      {tituloTexto}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {item?.descricao ||
                        'Modelos de contrato padronizados para prestação de serviços de transporte firme e interruptível.'}
                    </p>
                    <div className="pl-5 space-y-2">
                      <DocumentLinkRow
                        url={docAlineaB.url}
                        label={
                          docAlineaB.nomeExibicao &&
                          docAlineaB.nomeExibicao !== '- Baixar Arquivo' &&
                          docAlineaB.nomeExibicao !== 'Contrato Master TSB'
                            ? docAlineaB.nomeExibicao
                            : 'Contrato Master TSB 2025–2029 (Transporte Firme para períodos de curto prazo e anuais)'
                        }
                      />
                      {docMaster && docMaster.url && docMaster.url !== docAlineaB.url && (
                        <DocumentLinkRow
                          url={docMaster.url}
                          label={
                            docMaster.nomeExibicao && docMaster.nomeExibicao !== '- Baixar Arquivo'
                              ? docMaster.nomeExibicao
                              : 'Modelo de Contrato Complementar TSB'
                          }
                        />
                      )}
                    </div>
                  </div>
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
                const tituloTexto = item?.titulo || 'Modelo de Acordo de Conexão'

                return (
                  <div className="pt-6 space-y-2.5">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                      <span className="font-bold text-[#0a2540] mr-1.5">c)</span>
                      {tituloTexto}
                    </h3>
                    {item?.descricao && (
                      <p className="text-xs text-slate-500 leading-relaxed">{item.descricao}</p>
                    )}
                    <div className="pl-5 space-y-1.5">
                      <DocumentLinkRow
                        url={doc.url}
                        label={
                          doc.nomeExibicao && doc.nomeExibicao !== '- Baixar Arquivo'
                            ? doc.nomeExibicao
                            : 'Modelo de Acordo de Conexão às Instalações de Transporte'
                        }
                      />
                    </div>
                  </div>
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
                const tituloTexto =
                  item?.titulo || 'Modelo de Acordo Operativo de Alocação de Capacidade'

                return (
                  <div className="pt-6 space-y-2.5">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                      <span className="font-bold text-[#0a2540] mr-1.5">d)</span>
                      {tituloTexto}
                    </h3>
                    {item?.descricao && (
                      <p className="text-xs text-slate-500 leading-relaxed">{item.descricao}</p>
                    )}
                    <div className="pl-5 space-y-1.5">
                      <DocumentLinkRow
                        url={doc.url}
                        label={
                          doc.nomeExibicao && doc.nomeExibicao !== '- Baixar Arquivo'
                            ? doc.nomeExibicao
                            : 'Modelo de Acordo Operativo de Alocação de Quantidades de Gás'
                        }
                      />
                    </div>
                  </div>
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
                const tituloTexto = item?.titulo || 'Mapa das instalações de transporte'

                return (
                  <div className="pt-6 space-y-2.5">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                      <span className="font-bold text-[#0a2540] mr-1.5">e)</span>
                      {tituloTexto}
                    </h3>
                    {item?.descricao && (
                      <p className="text-xs text-slate-500 leading-relaxed">{item.descricao}</p>
                    )}
                    <div className="pl-5 space-y-1.5">
                      <DocumentLinkRow
                        url={doc.url}
                        label={
                          doc.nomeExibicao && doc.nomeExibicao !== '- Baixar Arquivo'
                            ? doc.nomeExibicao
                            : 'Mapa das Instalações do Sistema Dutoviário TSB'
                        }
                      />
                    </div>
                  </div>
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
                const tituloTexto =
                  item?.titulo || 'Características físicas e Capacidade Técnica Máxima'

                return (
                  <div className="pt-6 space-y-2.5">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                      <span className="font-bold text-[#0a2540] mr-1.5">f)</span>
                      {tituloTexto}
                    </h3>
                    {item?.descricao && (
                      <p className="text-xs text-slate-500 leading-relaxed">{item.descricao}</p>
                    )}
                    <div className="pl-5 space-y-2">
                      <DocumentLinkRow
                        url={doc.url}
                        label={
                          doc.nomeExibicao &&
                          doc.nomeExibicao !== '- Baixar Arquivo' &&
                          doc.nomeExibicao !== '- Características'
                            ? doc.nomeExibicao
                            : 'Características Físicas e Operacionais das Instalações de Transporte'
                        }
                      />
                      {docSecundario.url && (
                        <DocumentLinkRow
                          url={docSecundario.url}
                          label={
                            docSecundario.nomeExibicao &&
                            docSecundario.nomeExibicao !== '- Fluxos Físicos do Gás Natural'
                              ? docSecundario.nomeExibicao
                              : 'Fluxos Físicos de Gás Natural na Malha Dutoviária'
                          }
                        />
                      )}
                    </div>
                  </div>
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
                const tituloTexto =
                  item?.titulo ||
                  'Capacidade Disponível para novos serviços e condições para ampliá-la'

                return (
                  <div className="pt-6 space-y-3">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                      <span className="font-bold text-[#0a2540] mr-1.5">g)</span>
                      {tituloTexto}
                    </h3>
                    {item?.descricao && (
                      <p className="text-xs text-slate-500 leading-relaxed">{item.descricao}</p>
                    )}
                    <div className="pl-5 space-y-1.5">
                      <DocumentLinkRow
                        url={doc.url}
                        label={
                          doc.nomeExibicao && doc.nomeExibicao !== '- Baixar Arquivo'
                            ? doc.nomeExibicao
                            : 'Demonstrativo de Capacidade Disponível para Novos Serviços'
                        }
                      />
                    </div>

                    {/* BLOCO COLAPSADO EM 1 LINHA COM CHEVRON: ENTENDIMENTO CONCEITUAL PADRÃO NTS */}
                    {blocoExplicativoG.ativo && (
                      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50/70 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExplicativoGExpandido((prev) => !prev)}
                          aria-expanded={explicativoGExpandido}
                          aria-controls="bloco-explicativo-nts-conteudo"
                          className="w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors cursor-pointer hover:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Info className="h-4 w-4 text-[#0284c7] shrink-0" />
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {blocoExplicativoG.titulo}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 text-slate-500 text-xs font-medium">
                            <span className="hidden sm:inline text-[11px] text-slate-500">
                              {explicativoGExpandido ? 'Ocultar' : 'Entender metodologia'}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 text-slate-600 transition-transform duration-200 ${
                                explicativoGExpandido ? 'rotate-180' : 'rotate-0'
                              }`}
                            />
                          </div>
                        </button>

                        {explicativoGExpandido && (
                          <div
                            id="bloco-explicativo-nts-conteudo"
                            className="px-4 py-3.5 border-t border-slate-200/80 text-xs text-slate-600 space-y-2.5 bg-white animate-fade-in"
                          >
                            <p className="leading-relaxed text-justify">
                              {blocoExplicativoG.descricao}
                            </p>
                            <div className="pt-1 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#0a2540]" />
                                <strong>CTM:</strong> Simulação Termo-Hidráulica (pressões e vazões
                                nominais)
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                <strong>CC:</strong> Dedução de consumo operacional e segurança
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-600" />
                                <strong>Alocação:</strong> Firme, Interruptível e Curto Prazo
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* h) Quantidades programadas e realizadas (dados diários do mês anterior)
                     TABELA DE DADOS ISOLADA NUM BLOCO PRÓPRIO E CLARAMENTE SEPARADO */}
              {(() => {
                const item = secao1BdMap.get('alinea_h')
                if (item && item.ativo === false) return null
                const tituloTexto =
                  item?.titulo ||
                  'Quantidades programadas e realizadas (dados diários do mês anterior)'

                return (
                  <div id="alinea-h-quantidades" className="pt-8 scroll-mt-6 space-y-4">
                    {/* Título da Alínea h */}
                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                        <span className="font-bold text-[#0a2540] mr-1.5">h)</span>
                        {tituloTexto}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                        Série histórica consolidada nos pontos de recepção e entrega da malha TSB
                        (Trechos 1 e 3: Uruguaiana-Triunfo e Polo Petroquímico), atualizada
                        mensalmente desde 2003.
                      </p>
                    </div>

                    {/* BLOCO CONTIDO E RECUADO PARA A SÉRIE HISTÓRICA */}
                    <div className="p-4 sm:p-5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-4">
                      {/* BARRA DE FILTROS LIMPA */}
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#0a2540] uppercase tracking-wider font-display">
                            Filtros de Pesquisa &amp; Consulta
                          </span>
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

                        {/* GRID DE ENTRADAS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {/* 1. Pesquisa */}
                          <div className="space-y-1">
                            <Label
                              htmlFor="pesquisarQuantidades"
                              className="text-xs font-medium text-slate-600 flex items-center gap-1"
                            >
                              <Search className="h-3 w-3 text-slate-400" />
                              Pesquisar:
                            </Label>
                            <Input
                              id="pesquisarQuantidades"
                              type="text"
                              placeholder="Mês ou ano..."
                              value={pesquisaQuantidades}
                              onChange={(e) => setPesquisaQuantidades(e.target.value)}
                              className="h-8 text-xs bg-white border-slate-300 focus-visible:ring-1 focus-visible:ring-[#0284c7]"
                            />
                          </div>

                          {/* 2. Ano */}
                          <div className="space-y-1">
                            <Label
                              htmlFor="seletorAnoQuantidades"
                              className="text-xs font-medium text-slate-600 flex items-center gap-1"
                            >
                              <Calendar className="h-3 w-3 text-slate-400" />
                              Ano de referência:
                            </Label>
                            <select
                              id="seletorAnoQuantidades"
                              value={filtroAnoQuantidades}
                              onChange={(e) => setFiltroAnoQuantidades(e.target.value)}
                              className="w-full h-8 px-2.5 rounded-md border border-slate-300 text-xs bg-white text-slate-800 font-normal focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                            >
                              <option value="todos">
                                Todos os anos (2003–{anosDisponiveis[0] || 'atual'})
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
                            <Label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                              <ArrowUpDown className="h-3 w-3 text-slate-400" />
                              Ordenação:
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={toggleOrdemQuantidades}
                              className="w-full h-8 px-2.5 text-xs bg-white border-slate-300 text-slate-700 hover:bg-slate-50 font-normal flex items-center justify-between cursor-pointer"
                            >
                              <span className="truncate flex items-center gap-1.5">
                                {ordemQuantidades === 'desc' ? (
                                  <>
                                    <ArrowDownWideNarrow className="h-3 w-3 text-[#0284c7] shrink-0" />
                                    <span>Mais novo primeiro</span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowUpNarrowWide className="h-3 w-3 text-[#0284c7] shrink-0" />
                                    <span>Mais antigo primeiro</span>
                                  </>
                                )}
                              </span>
                            </Button>
                          </div>

                          {/* 4. Limite de exibição */}
                          <div className="space-y-1">
                            <Label
                              htmlFor="seletorItensExibirQuantidades"
                              className="text-xs font-medium text-slate-600 flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3 text-slate-400" />
                              Exibir:
                            </Label>
                            <select
                              id="seletorItensExibirQuantidades"
                              value={itensExibirQuantidades}
                              onChange={(e) => {
                                const val = e.target.value
                                setItensExibirQuantidades(val === 'todos' ? 'todos' : Number(val))
                              }}
                              className="w-full h-8 px-2.5 rounded-md border border-slate-300 text-xs bg-white text-slate-800 font-normal focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
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

                        {/* Linha informativa discreta */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs text-slate-500">
                          <span>
                            Exibindo <strong>{relatoriosVisiveis.length}</strong> de{' '}
                            <strong>{relatoriosFiltradosTotal.length}</strong> relatórios
                            {filtroAnoQuantidades !== 'todos' &&
                              ` no ano de ${filtroAnoQuantidades}`}
                          </span>
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-slate-400">Atalhos:</span>
                            {[12, 24, 48].map((qtd) => (
                              <button
                                key={qtd}
                                type="button"
                                onClick={() => setItensExibirQuantidades(qtd)}
                                className={`px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                                  itensExibirQuantidades === qtd
                                    ? 'bg-[#0a2540] text-white font-semibold'
                                    : 'text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {qtd}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setItensExibirQuantidades('todos')}
                              className={`px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                                itensExibirQuantidades === 'todos'
                                  ? 'bg-[#0a2540] text-white font-semibold'
                                  : 'text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Todos
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* TABELA DE QUANTIDADES — DESIGN SIMPLES E LIMPO */}
                      <div className="overflow-x-auto border border-slate-200 rounded-md bg-white">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="p-3 font-semibold text-slate-700">
                                Demonstrativo Mensal (Trechos 1 e 3)
                              </th>
                              <th className="p-3 w-40 text-right font-semibold text-slate-700">
                                Documento
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {relatoriosVisiveis.length > 0 ? (
                              relatoriosVisiveis.map((itemRel) => (
                                <tr
                                  key={itemRel.id}
                                  className="hover:bg-slate-50/70 transition-colors"
                                >
                                  <td className="p-3 text-slate-800 font-medium">
                                    <div className="flex items-center gap-2.5">
                                      <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                      <span>{itemRel.titulo}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-right">
                                    {itemRel.temArquivoDireto ? (
                                      <a
                                        href={itemRel.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0284c7] hover:underline"
                                        title={`Baixar ${itemRel.nomeArquivo}`}
                                      >
                                        <PdfIcon className="w-3.5 h-3.5" />
                                        <span>Baixar PDF</span>
                                      </a>
                                    ) : (
                                      <a
                                        href="https://www.tsb.com.br/boletim-eletronico/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#0284c7] hover:underline"
                                        title="Consultar no site oficial da TSB"
                                      >
                                        <FileDown className="h-3 w-3" />
                                        <span>Portal TSB</span>
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
                                  <p className="font-medium text-slate-700">
                                    Nenhum relatório encontrado para os critérios selecionados.
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={limparFiltrosQuantidades}
                                    className="text-xs h-7 text-[#0284c7] cursor-pointer"
                                  >
                                    Limpar filtros
                                  </Button>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* MAIS RESULTADOS */}
                      {itensExibirQuantidades !== 'todos' &&
                        relatoriosFiltradosTotal.length > relatoriosVisiveis.length && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 text-xs text-slate-500">
                            <span>
                              Mostrando <strong>{relatoriosVisiveis.length}</strong> de{' '}
                              <strong>{relatoriosFiltradosTotal.length}</strong> registros.
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
                                className="text-xs h-7 border-slate-300 text-slate-700 hover:bg-white cursor-pointer"
                              >
                                + 12 relatórios
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
                    </div>
                  </div>
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
                const tituloTexto =
                  item?.titulo || 'Interrupções e reduções de capacidade, atuais e planejadas'

                return (
                  <div className="pt-6 space-y-2.5">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                      <span className="font-bold text-[#0a2540] mr-1.5">i)</span>
                      {tituloTexto}
                    </h3>
                    {item?.descricao && (
                      <p className="text-xs text-slate-500 leading-relaxed">{item.descricao}</p>
                    )}
                    <div className="pl-5 space-y-1.5">
                      <DocumentLinkRow
                        url={doc.url}
                        label={
                          doc.nomeExibicao && doc.nomeExibicao !== '- Baixar Arquivo'
                            ? doc.nomeExibicao
                            : 'Interrupções e Reduções de Capacidade no Sistema Dutoviário'
                        }
                      />
                    </div>
                  </div>
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
                const tituloTexto = item?.titulo || 'Ampliações em implantação ou planejadas'

                return (
                  <div className="pt-6 space-y-2.5">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                      <span className="font-bold text-[#0a2540] mr-1.5">j)</span>
                      {tituloTexto}
                    </h3>
                    {item?.descricao && (
                      <p className="text-xs text-slate-500 leading-relaxed">{item.descricao}</p>
                    )}
                    <div className="pl-5 space-y-1.5">
                      <DocumentLinkRow
                        url={doc.url}
                        label={
                          doc.nomeExibicao && doc.nomeExibicao !== '- Baixar Arquivo'
                            ? doc.nomeExibicao
                            : 'Projetos de Ampliações Planejadas e em Implantação'
                        }
                      />
                    </div>
                  </div>
                )
              })()}
            </div>
          </section>

          {/* =========================================================================
              ITEM II — CONTRATOS DE SERVIÇO DE TRANSPORTE
              Padrão NTS:
              - Título de norma grande e claro
              - Subtítulo em itálico "(atualizado a cada novo contrato ou alteração)"
              - Linha simples de documento com ícone de PDF ou estado vazio discreto
              ========================================================================= */}
          {headerBlocoII.ativo && (
            <section id="bloco-item-ii" className="space-y-6 pt-10 border-t border-slate-200">
              <div className="space-y-2 border-b border-slate-200 pb-4">
                <div className="flex flex-wrap items-baseline gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0a2540] font-display tracking-tight">
                    {headerBlocoII.titulo}
                  </h2>
                  <span className="text-sm font-normal text-slate-500 italic">
                    (atualizado a cada novo contrato ou alteração)
                  </span>
                </div>
                {headerBlocoII.descricao && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl text-justify sm:text-left">
                    {headerBlocoII.descricao}
                  </p>
                )}
              </div>

              {/* SLOT DO DOCUMENTO DO ITEM II ESTILO NTS */}
              {(() => {
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

                if (doc.url) {
                  return (
                    <div className="space-y-2 py-2">
                      <DocumentLinkRow
                        url={doc.url}
                        label={itemContrato?.titulo || 'Resumo dos Contratos e Tarifas Vigentes'}
                        sublabel={dataAtualizacao ? `Atualizado em ${dataAtualizacao}` : undefined}
                      />
                      {itemContrato?.descricao && (
                        <p className="text-xs text-slate-500 pl-7 max-w-3xl leading-relaxed">
                          {itemContrato.descricao}
                        </p>
                      )}
                    </div>
                  )
                }

                // Estado vazio honesto e limpo
                return (
                  <div className="p-6 rounded-lg bg-slate-50/70 border border-slate-200 text-xs text-slate-600 space-y-1.5 max-w-3xl">
                    <p className="font-semibold text-slate-800">
                      Resumo dos Contratos e Tarifas Vigentes
                    </p>
                    <p className="leading-relaxed text-justify">
                      Ainda não há contratos públicos celebrados ou alterados pendentes de
                      publicação. O documento consolidado contemplando os 6 requisitos
                      regulamentares da Portaria ANP nº 1/2003 e da Lei nº 14.134/2021 (nome do
                      Carregador, tipo de serviço, vigências, capacidades, tarifas e relação
                      acionária) será publicado diretamente neste slot pela equipe de regulação da
                      TSB.
                    </p>
                  </div>
                )
              })()}
            </section>
          )}

          {/* =========================================================================
              MONITORAMENTO DO CONGESTIONAMENTO (RES. ANP 11/2016, ART. 12)
              Seção independente, sem numeral I ou II, estilo NTS limpo
              ========================================================================= */}
          {headerCongestionamento.ativo && (
            <section
              id="bloco-congestionamento"
              className="space-y-6 pt-10 border-t border-slate-200"
            >
              <div className="space-y-2 border-b border-slate-200 pb-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0a2540] font-display tracking-tight">
                    {headerCongestionamento.titulo}
                  </h2>
                  <span className="text-xs text-slate-500 font-mono">
                    Resolução ANP nº 11/2016 • Art. 12
                  </span>
                </div>
                {headerCongestionamento.descricao && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl text-justify sm:text-left">
                    {headerCongestionamento.descricao}
                  </p>
                )}
              </div>

              {/* NOTAS NORMATIVAS EM LINHAS DISCRETAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-[#0284c7]" />
                    <span>Periodicidade e Homologação (Art. 12, §1º e §2º)</span>
                  </div>
                  <p className="text-slate-500 leading-relaxed">
                    Relatórios elaborados mensalmente e disponibilizados ao público após submissão e
                    homologação técnica formal pela ANP.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Fluxo Operacional Medido (Art. 12, caput)</span>
                  </div>
                  <p className="text-slate-500 leading-relaxed">
                    Consolidação direta do fluxo operacional medido nos pontos de recepção e entrega
                    para aferição de congestionamento físico ou contratual.
                  </p>
                </div>
              </div>

              {/* LISTAGEM DOS RELATÓRIOS OU ESTADO INFORMATIVO */}
              {relatoriosCongestionamentoTotal.length > 0 ? (
                <div className="space-y-4">
                  {/* Filtro simples se houver mais de 5 relatórios */}
                  {relatoriosCongestionamentoTotal.length > 5 && (
                    <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-md border border-slate-200 text-xs">
                      <div className="flex-1 min-w-[200px]">
                        <Input
                          type="text"
                          placeholder="Pesquisar relatório..."
                          value={pesquisaCongestionamento}
                          onChange={(e) => setPesquisaCongestionamento(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      {anosCongestionamentoDisponiveis.length > 1 && (
                        <select
                          value={filtroAnoCongestionamento}
                          onChange={(e) => setFiltroAnoCongestionamento(e.target.value)}
                          className="h-8 px-2 rounded-md border border-slate-300 text-xs bg-white text-slate-800"
                        >
                          <option value="todos">Todos os anos</option>
                          {anosCongestionamentoDisponiveis.map((ano) => (
                            <option key={ano} value={ano}>
                              {ano}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Linhas de documento padrão NTS */}
                  <div className="divide-y divide-slate-100 pl-1 space-y-2">
                    {relatoriosCongestionamentoTotal.map((item) => {
                      const doc = resolverUrlDocumento(item, item.url_externa || '')
                      return (
                        <div key={item.id} className="pt-2 first:pt-0">
                          {doc.url ? (
                            <DocumentLinkRow
                              url={doc.url}
                              label={item.titulo}
                              sublabel={item.descricao || undefined}
                            />
                          ) : (
                            <div className="text-xs text-slate-500 flex items-center gap-2 py-1">
                              <PdfIcon className="w-4 h-4 opacity-40" />
                              <span className="font-medium text-slate-700">{item.titulo}</span>
                              <span className="text-slate-400 italic text-[11px]">
                                (homologação pendente na ANP)
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-lg bg-slate-50/70 border border-slate-200 space-y-2 text-xs text-slate-600 max-w-3xl">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Activity className="h-4 w-4 text-amber-600" />
                    <span>Relatórios Mensais em Processamento e Homologação na ANP</span>
                  </div>
                  <p className="leading-relaxed text-justify">
                    Os demonstrativos de Monitoramento de Utilização da Capacidade e
                    Congestionamento Físico e Contratual são submetidos mensalmente à Agência
                    Nacional do Petróleo (ANP) e disponibilizados nesta seção conforme as
                    homologações técnicas forem concluídas.
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
