import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  transparenciaService,
  type ItemTransparencia,
  resolverUrlDocumento,
  CABECALHOS_FALLBACK,
} from '@/services/transparencia'

// Ícone discreto de PDF padrão TSB / NTS (16px)
function PdfIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 inline-block align-middle text-red-600 ${className}`}
      aria-hidden="true"
      style={{ minWidth: '16px', minHeight: '16px', maxWidth: '20px', maxHeight: '20px' }}
    >
      <path
        d="M3 2.5C3 1.94772 3.44772 1.5 4 1.5H9.5L13 5V13.5C13 14.0523 12.5523 14.5 12 14.5H4C3.44772 14.5 3 14.0523 3 13.5V2.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="#fef2f2"
      />
      <path
        d="M9.5 1.5V5H13"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
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

interface DocumentLinkRowProps {
  url: string
  label: string
  title?: string
  sublabel?: string
}

function DocumentLinkRow({ url, label, title, sublabel }: DocumentLinkRowProps) {
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
      </a>
      {sublabel && (
        <span className="text-xs text-slate-500 pl-6 sm:pl-0 font-normal">{sublabel}</span>
      )}
    </div>
  )
}

export interface BlocoMonitoramentoProps {
  className?: string
}

export default function BlocoMonitoramentoOficial({ className = '' }: BlocoMonitoramentoProps) {
  // Itens cadastrados na coleção transparencia_conteudo
  const [itensBd, setItensBd] = useState<ItemTransparencia[]>([])
  const [pesquisa, setPesquisa] = useState<string>('')
  const [filtroAno, setFiltroAno] = useState<string>('todos')

  const carregarDados = useCallback(async () => {
    try {
      const todos = await transparenciaService.listarTodos()
      setItensBd(todos)
    } catch (e) {
      console.warn('[BlocoMonitoramento] Falha ao carregar itens do PocketBase:', e)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Cabeçalho institucional editável via Gestão Interna (chave: monitoramento_congestionamento_header)
  const cabecalho = useMemo(() => {
    const item = itensBd.find(
      (it) => it.secao === 'cabecalho' && it.chave === 'monitoramento_congestionamento_header',
    )
    const fallback = CABECALHOS_FALLBACK.monitoramento_congestionamento_header
    return {
      titulo:
        item?.ativo !== false && item?.titulo
          ? item.titulo
          : 'Relatório de Monitoramento de Utilização da Capacidade e Congestionamento',
      descricao:
        item?.ativo !== false && item?.descricao
          ? item.descricao
          : fallback.descricao ||
            'O Transportador deve produzir relatórios mensais de monitoramento da utilização da capacidade nos Pontos Relevantes e do Congestionamento Físico e Contratual, submetendo-os à aprovação da ANP e disponibilizando-os publicamente após homologação.',
      ativo: item ? item.ativo !== false : true,
    }
  }, [itensBd])

  // Itens de monitoramento cadastrados pela Gestão Interna (seção: monitoramento_congestionamento)
  const relatorios = useMemo(() => {
    return itensBd.filter((it) => it.secao === 'monitoramento_congestionamento' && it.ativo)
  }, [itensBd])

  // Lista filtrada e ordenada (mais recente primeiro)
  const relatoriosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()
    const filtrados = relatorios.filter((it) => {
      if (termo) {
        const matchTitulo = it.titulo.toLowerCase().includes(termo)
        const matchAno = (it.ano || '').includes(termo)
        const matchMes = (it.mes || '').toLowerCase().includes(termo)
        if (!matchTitulo && !matchAno && !matchMes) return false
      }
      if (filtroAno !== 'todos' && it.ano !== filtroAno) {
        return false
      }
      return true
    })

    return filtrados.sort((a, b) => {
      const pA = a.chave_periodo || `${a.ano || '0'}-${a.mes || '0'}`
      const pB = b.chave_periodo || `${b.ano || '0'}-${b.mes || '0'}`
      return pB.localeCompare(pA)
    })
  }, [relatorios, pesquisa, filtroAno])

  const anosDisponiveis = useMemo(() => {
    const set = new Set<string>()
    relatorios.forEach((it) => {
      if (it.ano) set.add(it.ano)
    })
    return Array.from(set).sort((a, b) => Number(b) - Number(a))
  }, [relatorios])

  if (!cabecalho.ativo) return null

  return (
    <section id="bloco-monitoramento" className={`space-y-4 ${className}`}>
      <Card className="border border-slate-200/90 shadow-xs bg-white overflow-hidden rounded-xl">
        {/* CABEÇALHO UNIFICADO E SÓBRIO COM IDENTIDADE TSB (MESMO PADRÃO DO BOLETIM E PLATAFORMA) */}
        <div className="px-6 py-7 sm:px-10 sm:py-9 bg-white border-b border-slate-200">
          <div className="max-w-4xl space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#143b73] tracking-wide uppercase font-display">
              <span>Resolução ANP nº 11, de 16/03/2016</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-normal normal-case">Art. 11 da Resolução</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0a2540] font-display">
              {cabecalho.titulo}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-justify sm:text-left">
              {cabecalho.descricao}
            </p>

            {/* FRASE DE STATUS HONESTA NO PADRÃO CONCORRENTES TAG/NTS */}
            <div className="pt-1">
              <p className="text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200/80 rounded-md px-3.5 py-2 inline-block">
                Status Atual:{' '}
                <span className="text-slate-900 font-semibold">
                  Não há congestionamento físico ou contratual registrado na malha de transporte da
                  TSB.
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-10 sm:py-10 space-y-6">
          {/* LISTA / SLOT DE RELATÓRIOS MENSAIS COM ESTADO VAZIO HONESTO */}
          <div className="space-y-4">
            {relatorios.length > 5 && (
              <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-md border border-slate-200 text-xs">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    type="text"
                    placeholder="Pesquisar relatório..."
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
                {anosDisponiveis.length > 1 && (
                  <select
                    value={filtroAno}
                    onChange={(e) => setFiltroAno(e.target.value)}
                    className="h-8 px-2 rounded-md border border-slate-300 text-xs bg-white text-slate-800"
                  >
                    <option value="todos">Todos os anos</option>
                    {anosDisponiveis.map((ano) => (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {relatoriosFiltrados.length > 0 ? (
              <div className="divide-y divide-slate-100 pl-1 space-y-2">
                {relatoriosFiltrados.map((item) => {
                  const doc = resolverUrlDocumento(item, item.url_externa || '')
                  const dataAtualizacao = item.updated
                    ? new Date(item.updated).toLocaleDateString('pt-BR')
                    : null
                  return (
                    <div key={item.id} className="pt-2 first:pt-0">
                      {doc.url ? (
                        <DocumentLinkRow
                          url={doc.url}
                          label={item.titulo}
                          sublabel={
                            item.descricao ||
                            (dataAtualizacao ? `Publicado em ${dataAtualizacao}` : undefined)
                          }
                        />
                      ) : (
                        <div className="text-xs text-slate-500 flex items-center gap-2 py-1">
                          <PdfIcon className="w-4 h-4 opacity-40" />
                          <span className="font-medium text-slate-700">{item.titulo}</span>
                          <span className="text-slate-400 italic text-[11px]">
                            (homologação técnica em processamento na ANP)
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              /* ESTADO VAZIO HONESTO E ENXUTO ENQUANTO NÃO HOUVER RELATÓRIOS PUBLICADOS */
              <div className="p-5 rounded-lg bg-slate-50/70 border border-slate-200 text-xs text-slate-600 space-y-1.5 max-w-3xl">
                <p className="font-semibold text-slate-800">
                  Relatórios Mensais em Processamento e Homologação na ANP
                </p>
                <p className="leading-relaxed text-justify">
                  Os relatórios mensais de monitoramento da utilização da capacidade nos Pontos
                  Relevantes e do Congestionamento Físico e Contratual são submetidos periodicamente
                  à aprovação técnica da Agência Nacional do Petróleo (ANP) e serão disponibilizados
                  diretamente neste slot assim que homologados.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </section>
  )
}
