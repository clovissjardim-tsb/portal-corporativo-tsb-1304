import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  FileDown,
  ExternalLink,
  Search,
  CheckCircle2,
  Info,
  ShieldCheck,
  Lock,
  ChevronDown,
} from 'lucide-react'
import {
  transparenciaService,
  resolverUrlDocumento,
  resolverUrlSecundaria,
  CABECALHOS_FALLBACK,
  type ItemTransparencia,
} from '@/services/transparencia'
import type {
  SolicitacaoIncisoVII,
  ResumoPublicoSolicitacao,
  ResumoPublicoInstalacao,
  ModalidadeSolicitacao,
} from '@/services/solicitacoes'
import type { OfertaCessaoPublica } from '@/services/cessoes'

// Ícone de documento PDF estilo NTS idêntico ao do Boletim Eletrônico
// (glifo discreto de 16-18px com canto dobrado e mini-etiqueta 'PDF')
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

// Linha de link de documento compacta idêntica ao Boletim Eletrônico
interface DocumentLinkRowProps {
  url: string
  label: string
  title?: string
  external?: boolean
  sublabel?: string
  onClick?: () => void
}

function DocumentLinkRow({ url, label, title, external, sublabel, onClick }: DocumentLinkRowProps) {
  if (!url && !onClick) return null
  return (
    <div className="group flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          title={title || label}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-[#0284c7] transition-colors py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] rounded-xs cursor-pointer text-left"
        >
          <PdfIcon className="w-4 h-4 text-red-600 transition-transform group-hover:scale-110" />
          <span className="underline decoration-slate-300 underline-offset-4 group-hover:decoration-[#0284c7]">
            {label}
          </span>
        </button>
      ) : (
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
      )}
      {sublabel && (
        <span className="text-xs text-slate-500 pl-6 sm:pl-0 font-normal">{sublabel}</span>
      )}
    </div>
  )
}

export interface PlataformaEletronicaProps {
  // Sub-abas
  subAba: 'i_vi' | 'vii'
  setSubAba: (aba: 'i_vi' | 'vii') => void

  // Inciso VII (opcional/legado para retrocompatibilidade)
  formVII?: {
    razao_social: string
    cnpj: string
    email: string
    modalidade: '' | ModalidadeSolicitacao
    capacidade: string
    trecho: string
    ponto_recebimento: string
    ponto_entrega: string
    periodo: string
    garantias_seguranca_swap: string
  }
  setFormVII?: React.Dispatch<
    React.SetStateAction<{
      razao_social: string
      cnpj: string
      email: string
      modalidade: '' | ModalidadeSolicitacao
      capacidade: string
      trecho: string
      ponto_recebimento: string
      ponto_entrega: string
      periodo: string
      garantias_seguranca_swap: string
    }>
  >
  submetendoVII?: boolean
  erroFormVII?: string | null
  handleSubmeterVII?: (e: React.FormEvent) => void

  // Consulta Inciso VII (opcional/legado)
  consultaProtocolo?: string
  setConsultaProtocolo?: (val: string) => void
  consultandoSLA?: boolean
  handleVerificarSLA?: (e: React.FormEvent) => void
  resultadoConsulta?: {
    buscado: boolean
    encontrado: boolean
    dados?: SolicitacaoIncisoVII
  } | null

  // Resumo Público Inciso VII
  resumoPublicoVII: ResumoPublicoSolicitacao[]
  resumoInstalacaoVII?: ResumoPublicoInstalacao[]
  carregandoResumoVII: boolean
  carregarResumoVII: () => void

  // Inciso VIII
  ofertasCessao: OfertaCessaoPublica[]
  carregandoCessoes: boolean
  carregarOfertasCessao?: () => void
  mostrarFormCessao?: boolean
  setMostrarFormCessao?: (val: boolean) => void
  formCessao?: {
    cedente: string
    trecho: string
    capacidade_ociosa: string
    periodo_contratual: string
    contato: string
    observacoes: string
  }
  setFormCessao?: React.Dispatch<
    React.SetStateAction<{
      cedente: string
      trecho: string
      capacidade_ociosa: string
      periodo_contratual: string
      contato: string
      observacoes: string
    }>
  >
  submetendoCessao?: boolean
  erroFormCessao?: string | null
  handleSubmeterCessao?: (e: React.FormEvent) => void
}

export default function PlataformaEletronica({
  subAba,
  setSubAba,
  resumoPublicoVII,
  resumoInstalacaoVII = [],
  carregandoResumoVII,
  carregarResumoVII,
  ofertasCessao,
  carregandoCessoes,
  carregarOfertasCessao,
}: PlataformaEletronicaProps) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()

  // Itens da Plataforma Eletrônica gerenciados pelo PocketBase
  const [itensBd, setItensBd] = useState<ItemTransparencia[]>([])

  const carregarItensPlataforma = useCallback(async () => {
    try {
      const [itensIncisos, itensCabecalhos] = await Promise.all([
        transparenciaService.listarPorSecao('plataforma_inciso'),
        transparenciaService.listarPorSecao('cabecalho'),
      ])
      setItensBd([...itensIncisos, ...itensCabecalhos])
    } catch (e) {
      console.warn('[PlataformaEletronica] Usando dados canônicos como fallback:', e)
    }
  }, [])

  useEffect(() => {
    carregarItensPlataforma()
  }, [carregarItensPlataforma])

  const incisosBdMap = useMemo(() => {
    const map = new Map<string, ItemTransparencia>()
    itensBd.forEach((it) => map.set(it.chave, it))
    return map
  }, [itensBd])

  // Resolução dinâmica de cabeçalhos da Plataforma Eletrônica
  const headerPlataformaTopo = useMemo(() => {
    const item = incisosBdMap.get('plataforma_topo')
    const fallback = CABECALHOS_FALLBACK.plataforma_topo
    return {
      titulo: item?.ativo !== false && item?.titulo ? item.titulo : fallback.titulo,
      descricao:
        item?.ativo !== false && item?.descricao ? item.descricao : fallback.descricao || '',
      url_externa:
        item?.ativo !== false && item?.url_externa ? item.url_externa : fallback.url_externa || '',
      item,
      ativo: item ? item.ativo !== false : true,
    }
  }, [incisosBdMap])

  const headerIncisos1a6 = useMemo(() => {
    const item = incisosBdMap.get('plataforma_incisos_i_vi_header')
    const fallback = CABECALHOS_FALLBACK.plataforma_incisos_i_vi_header
    return {
      titulo: item?.ativo !== false && item?.titulo ? item.titulo : fallback.titulo,
      descricao:
        item?.ativo !== false && item?.descricao ? item.descricao : fallback.descricao || '',
      item,
      ativo: item ? item.ativo !== false : true,
    }
  }, [incisosBdMap])

  // Estado do acordeão para os Incisos I a VIII
  // Inicialmente todos colapsados por padrão (Set vazio). Permite abertura suave individual ou múltipla.
  const [incisosAbertos, setIncisosAbertos] = useState<Set<string>>(new Set())

  const toggleInciso = (numeroRomano: string) => {
    setIncisosAbertos((prev) => {
      const novo = new Set(prev)
      if (novo.has(numeroRomano)) {
        novo.delete(numeroRomano)
      } else {
        novo.add(numeroRomano)
      }
      return novo
    })
  }

  // Títulos curtos e descrições regulamentares de referência para os Incisos I a VIII
  const metaIncisos: Record<string, { tituloCurto: string; descricaoPadrao: string }> = {
    I: {
      tituloCurto: 'Fluxos Físicos',
      descricaoPadrao:
        'Apresenta os fluxos físicos de gás natural operados no sistema dutoviário da TSB, com os volumes programados e realizados nos pontos de recepção e entrega.',
    },
    II: {
      tituloCurto: 'Características Técnicas e Operacionais de Instalação de Transporte',
      descricaoPadrao:
        'Descrição técnica detalhada, parâmetros construtivos de operação, pressões de projeto e instalações dos gasodutos integrantes da malha TSB.',
    },
    III: {
      tituloCurto:
        'Capacidade Disponível, Fluxo Oposto ao Fluxo Físico e Capacidade Ociosa por Ponto Relevante',
      descricaoPadrao:
        'Demonstrativo técnico da capacidade disponível, capacidade em fluxo oposto e capacidade ociosa por ponto relevante, incluindo as previsões rolantes de 7 anos (capacidade firme) e 2 anos (capacidade interruptível).',
    },
    IV: {
      tituloCurto: 'Capacidades Contratadas por Contrato de Serviço de Transporte Celebrado',
      descricaoPadrao:
        'Relação consolidada das capacidades contratadas por ponto de recebimento e entrega para cada contrato de serviço de transporte vigente na malha dutoviária da TSB.',
    },
    V: {
      tituloCurto: 'Simulação Termo-Hidráulica',
      descricaoPadrao:
        'Estudos e relatórios de simulação termo-hidráulica em regime permanente e transiente para os Trechos 1 (Uruguaiana–Triunfo) e 3 (Polo Petroquímico) do sistema dutoviário da TSB.',
    },
    VI: {
      tituloCurto: 'Termos e Condições Tarifárias e Não Tarifárias',
      descricaoPadrao:
        'Condições gerais tarifárias, metodologia de cálculo tarifário homologada pela ANP, prazos de contratação, penalidades e regras de acesso de terceiros à infraestrutura dutoviária.',
    },
    VII: {
      tituloCurto: 'Solicitação de Acesso',
      descricaoPadrao:
        'Solicitação de acesso formalizada em ambiente autenticado, com protocolo regulatório gerado na confirmação e resposta da transportadora em até 20 dias úteis (Art. 10, §2º, da Resolução ANP nº 11/2016).',
    },
    VIII: {
      tituloCurto:
        'Resumo das Ofertas de Cessão de Capacidade Contratada Informadas ao Transportador',
      descricaoPadrao:
        'Mecanismo de divulgação de ofertas de capacidade ociosa para cessão entre carregadores, promovendo o aproveitamento eficiente e secundário da malha dutoviária da TSB. Consulta e cadastro públicos de ofertas.',
    },
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* CARD PRINCIPAL ESPELHANDO ESTRUTURA OFICIAL TSB (IGUAL AO BOLETIM ELETRÔNICO OFICIAL) */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        {/* CABEÇALHO UNIFICADO E SÓBRIO COM IDENTIDADE TSB (MESMO PADRÃO DO BOLETIM ELETRÔNICO) */}
        <div className="px-6 py-7 sm:px-10 sm:py-9 bg-white border-b border-slate-200">
          <div className="max-w-4xl space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#143b73] tracking-wide uppercase font-display">
              <span>Resolução ANP nº 11, de 16/03/2016</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-normal normal-case">Art. 9º da Resolução</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0a2540] font-display">
              {headerPlataformaTopo.titulo}
            </h1>

            {headerPlataformaTopo.descricao && (
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-justify sm:text-left">
                {headerPlataformaTopo.url_externa ? (
                  <a
                    href={headerPlataformaTopo.url_externa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0284c7] hover:underline inline-flex items-center gap-1 font-medium transition-colors"
                  >
                    {headerPlataformaTopo.descricao}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ) : (
                  headerPlataformaTopo.descricao
                )}
              </p>
            )}

            {(() => {
              if (!headerPlataformaTopo.item) return null
              const doc = resolverUrlDocumento(headerPlataformaTopo.item, '')
              if (!doc.url) return null
              return (
                <div className="pt-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-[#0284c7] transition-colors py-0.5"
                  >
                    <FileDown className="h-4 w-4 text-slate-500" />
                    <span className="underline decoration-slate-300 underline-offset-4 hover:decoration-[#0284c7]">
                      {doc.nomeExibicao || 'Anexo da Plataforma'}
                    </span>
                  </a>
                </div>
              )
            })()}
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="p-6 sm:p-8 space-y-10">
          {/* =========================================================================
              SEÇÃO PRINCIPAL: INCISOS I A VIII EM ACORDEÃO (PADRÃO BOLETIM ELETRÔNICO)
              - Cada inciso (I a VIII) é uma linha de acordeão colapsada por padrão
              - Título curto do inciso + chevron suave
              - Ao expandir: texto descritivo regulatório curto + links de documentos
                com o glifo compacto de PDF (16-18px) estilo NTS
              ========================================================================= */}
          <section id="bloco-incisos-acordeao" className="space-y-6">
            <div className="space-y-2 border-b border-slate-200 pb-4">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-[#0a2540] font-display tracking-tight">
                  {headerIncisos1a6.titulo}
                </h2>
                <span className="text-sm font-normal text-slate-500 italic">
                  (Incisos I a VIII)
                </span>
              </div>
              {headerIncisos1a6.descricao && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
                  {headerIncisos1a6.descricao}
                </p>
              )}
            </div>

            {/* LISTAGEM DOS INCISOS I A VIII EM ACORDEÃO */}
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden bg-white shadow-xs">
              {/* INCISO I */}
              {(() => {
                const item = incisosBdMap.get('inciso_i')
                if (item && item.ativo === false) return null
                const isOpen = incisosAbertos.has('I')
                const doc = resolverUrlDocumento(
                  item,
                  'https://tsb.com.br/wp-content/uploads/2023/04/fluxo_fisico.pdf',
                )
                const tituloTexto = metaIncisos.I.tituloCurto
                const labelDoc =
                  doc.nomeExibicao && doc.nomeExibicao !== '- Baixar Arquivo'
                    ? doc.nomeExibicao
                    : 'Fluxos Físicos de Gás Natural — Demonstrativo Técnico'

                return (
                  <div className="transition-colors">
                    <button
                      type="button"
                      onClick={() => toggleInciso('I')}
                      aria-expanded={isOpen}
                      className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7]"
                    >
                      <span className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                        <span className="font-bold text-[#0a2540] mr-2">I.</span>
                        {tituloTexto}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#0284c7]' : 'rotate-0'
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 space-y-3 bg-slate-50/40 border-t border-slate-100 animate-fade-in">
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
                          {item?.descricao || metaIncisos.I.descricaoPadrao}
                        </p>
                        <div className="pt-1">
                          <DocumentLinkRow url={doc.url} label={labelDoc} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* INCISO II */}
              {(() => {
                const item = incisosBdMap.get('inciso_ii')
                if (item && item.ativo === false) return null
                const isOpen = incisosAbertos.has('II')
                const doc = resolverUrlDocumento(
                  item,
                  'https://tsb.com.br/wp-content/uploads/2023/04/bibArq000438-2.pdf',
                )
                const tituloTexto = metaIncisos.II.tituloCurto
                const labelDoc =
                  doc.nomeExibicao && doc.nomeExibicao !== '- Baixar Arquivo'
                    ? doc.nomeExibicao
                    : 'Características Técnicas e Operacionais das Instalações de Transporte'

                return (
                  <div className="transition-colors">
                    <button
                      type="button"
                      onClick={() => toggleInciso('II')}
                      aria-expanded={isOpen}
                      className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7]"
                    >
                      <span className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                        <span className="font-bold text-[#0a2540] mr-2">II.</span>
                        {tituloTexto}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#0284c7]' : 'rotate-0'
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 space-y-3 bg-slate-50/40 border-t border-slate-100 animate-fade-in">
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
                          {item?.descricao || metaIncisos.II.descricaoPadrao}
                        </p>
                        <div className="pt-1">
                          <DocumentLinkRow url={doc.url} label={labelDoc} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* INCISO III */}
              {(() => {
                const item = incisosBdMap.get('inciso_iii')
                if (item && item.ativo === false) return null
                const isOpen = incisosAbertos.has('III')
                const doc = resolverUrlDocumento(
                  item,
                  'https://www.tsb.com.br/wp-content/uploads/2023/08/Capacidade-Disponivel-SITE.pdf',
                )
                const tituloTexto = metaIncisos.III.tituloCurto
                const labelDoc =
                  doc.nomeExibicao && doc.nomeExibicao !== '- Baixar Arquivo'
                    ? doc.nomeExibicao
                    : 'Demonstrativo de Capacidade Disponível por Ponto Relevante'

                return (
                  <div className="transition-colors">
                    <button
                      type="button"
                      onClick={() => toggleInciso('III')}
                      aria-expanded={isOpen}
                      className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7]"
                    >
                      <span className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                        <span className="font-bold text-[#0a2540] mr-2">III.</span>
                        {tituloTexto}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#0284c7]' : 'rotate-0'
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 space-y-3 bg-slate-50/40 border-t border-slate-100 animate-fade-in">
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
                          {item?.descricao || metaIncisos.III.descricaoPadrao}
                        </p>
                        <div className="pt-1">
                          <DocumentLinkRow url={doc.url} label={labelDoc} />
                        </div>
                        <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed max-w-3xl">
                          <span className="font-semibold text-[#0a2540]">
                            Previsão de Disponibilidade (Padrão TBG):
                          </span>{' '}
                          A previsão rolante de 7 anos (capacidade firme) e 2 anos (capacidade
                          não-firme) é publicada neste documento oficial em PDF e atualizada
                          periodicamente pela área técnica da TSB.
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* INCISO IV */}
              {(() => {
                const item = incisosBdMap.get('inciso_iv')
                if (item && item.ativo === false) return null
                const isOpen = incisosAbertos.has('IV')
                const doc = resolverUrlDocumento(
                  item,
                  'https://tsb.com.br/wp-content/uploads/2023/04/capacidade_contratada.pdf',
                )
                const tituloTexto = metaIncisos.IV.tituloCurto
                const labelDoc =
                  doc.nomeExibicao && doc.nomeExibicao !== '- Baixar Arquivo'
                    ? doc.nomeExibicao
                    : 'Relatório de Capacidade Contratada por Ponto e Trecho'

                return (
                  <div className="transition-colors">
                    <button
                      type="button"
                      onClick={() => toggleInciso('IV')}
                      aria-expanded={isOpen}
                      className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7]"
                    >
                      <span className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                        <span className="font-bold text-[#0a2540] mr-2">IV.</span>
                        {tituloTexto}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#0284c7]' : 'rotate-0'
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 space-y-3 bg-slate-50/40 border-t border-slate-100 animate-fade-in">
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
                          {item?.descricao || metaIncisos.IV.descricaoPadrao}
                        </p>
                        <div className="pt-1">
                          <DocumentLinkRow url={doc.url} label={labelDoc} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
              {/* INCISO VI */}
              {(() => {
                const item = incisosBdMap.get('inciso_vi')
                if (item && item.ativo === false) return null
                const isOpen = incisosAbertos.has('VI')
                const doc = resolverUrlDocumento(
                  item,
                  'https://tsb.com.br/wp-content/uploads/2023/04/termo_de_acesso.pdf',
                )
                const tituloTexto = metaIncisos.VI.tituloCurto
                const labelDoc =
                  doc.nomeExibicao && doc.nomeExibicao !== '- Baixar Arquivo'
                    ? doc.nomeExibicao
                    : 'Termos e Condições Tarifárias e Não Tarifárias de Acesso'

                return (
                  <div className="transition-colors">
                    <button
                      type="button"
                      onClick={() => toggleInciso('VI')}
                      aria-expanded={isOpen}
                      className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7]"
                    >
                      <span className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                        <span className="font-bold text-[#0a2540] mr-2">VI.</span>
                        {tituloTexto}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#0284c7]' : 'rotate-0'
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 space-y-3 bg-slate-50/40 border-t border-slate-100 animate-fade-in">
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
                          {item?.descricao || metaIncisos.VI.descricaoPadrao}
                        </p>
                        <div className="pt-1">
                          <DocumentLinkRow url={doc.url} label={labelDoc} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* INCISO VII */}
              {(() => {
                const item = incisosBdMap.get('inciso_vii')
                const isOpen = incisosAbertos.has('VII')
                const docResumoPontos = resolverUrlDocumento(
                  incisosBdMap.get('resumo_solicitacoes_vii_pdf'),
                  '',
                )
                const docResumoTrechos = resolverUrlDocumento(
                  incisosBdMap.get('resumo_demandas_trechos_vii_pdf'),
                  '',
                )
                const tituloTexto = metaIncisos.VII.tituloCurto

                return (
                  <div className="transition-colors">
                    <button
                      type="button"
                      onClick={() => toggleInciso('VII')}
                      aria-expanded={isOpen}
                      className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7]"
                    >
                      <span className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                        <span className="font-bold text-[#0a2540] mr-2">VII.</span>
                        {tituloTexto}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#0284c7]' : 'rotate-0'
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 space-y-4 bg-slate-50/40 border-t border-slate-100 animate-fade-in">
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
                          {item?.descricao || metaIncisos.VII.descricaoPadrao}
                        </p>

                        {/* AÇÃO PRINCIPAL E DOCUMENTOS EM PDF */}
                        <div className="space-y-3 pt-1">
                          {/* Botão para Solicitação de Acesso (fluxo web automatizado autenticado) */}
                          <div>
                            <Button
                              size="sm"
                              type="button"
                              onClick={() => {
                                if (!isAuthenticated) {
                                  navigate('/login', {
                                    state: { from: { pathname: '/solicitacao-acesso' } },
                                  })
                                } else {
                                  navigate('/solicitacao-acesso')
                                }
                              }}
                              className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-sky-300" />
                              Solicitação de Acesso à Capacidade de Transporte
                            </Button>
                          </div>

                          {/* 1. Resumo das Solicitações por Ponto Relevante */}
                          <div className="space-y-1">
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Documento consolidado com a relação anônima e agregada das
                              solicitações de acesso por ponto relevante de recebimento e entrega
                            </p>
                            {docResumoPontos.url ? (
                              <DocumentLinkRow
                                url={docResumoPontos.url}
                                label={
                                  docResumoPontos.nomeExibicao &&
                                  docResumoPontos.nomeExibicao !== '- Baixar Arquivo' &&
                                  docResumoPontos.nomeExibicao !== 'Baixar Documento'
                                    ? docResumoPontos.nomeExibicao
                                    : 'Resumo das Solicitações por Ponto Relevante'
                                }
                              />
                            ) : (
                              <DocumentLinkRow
                                url="#"
                                onClick={() => {
                                  toast({
                                    title: 'Resumo das Solicitações por Ponto Relevante',
                                    description:
                                      'Documento oficial publicado periodicamente pela equipe da TSB (Art. 9º, §1º, VII da Resolução ANP nº 11/2016).',
                                  })
                                }}
                                label="Resumo das Solicitações por Ponto Relevante"
                              />
                            )}
                          </div>

                          {/* 2. Resumo da Demanda por Instalação de Transporte — Trechos 1 e 3 */}
                          <div className="space-y-1">
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Demonstrativo consolidado em PDF da capacidade demandada por
                              instalação dutoviária (Trecho 1: Uruguaiana-Triunfo e Trecho 3: Polo
                              Petroquímico)
                            </p>
                            {docResumoTrechos.url ? (
                              <DocumentLinkRow
                                url={docResumoTrechos.url}
                                label={
                                  docResumoTrechos.nomeExibicao &&
                                  docResumoTrechos.nomeExibicao !== '- Baixar Arquivo' &&
                                  docResumoTrechos.nomeExibicao !== 'Baixar Documento'
                                    ? docResumoTrechos.nomeExibicao
                                    : 'Resumo da Demanda por Instalação de Transporte — Trechos 1 e 3'
                                }
                              />
                            ) : (
                              <DocumentLinkRow
                                url="#"
                                onClick={() => {
                                  toast({
                                    title:
                                      'Resumo da Demanda por Instalação de Transporte — Trechos 1 e 3',
                                    description:
                                      'Documento oficial publicado periodicamente pela equipe da TSB (Art. 9º, §1º, VII da Resolução ANP nº 11/2016).',
                                  })
                                }}
                                label="Resumo da Demanda por Instalação de Transporte — Trechos 1 e 3"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* INCISO VIII */}
              {(() => {
                const item = incisosBdMap.get('inciso_viii')
                const isOpen = incisosAbertos.has('VIII')
                const docResumoCessoes = resolverUrlDocumento(
                  incisosBdMap.get('resumo_cessoes_viii_pdf'),
                  '',
                )
                const tituloTexto = metaIncisos.VIII.tituloCurto

                return (
                  <div className="transition-colors">
                    <button
                      type="button"
                      onClick={() => toggleInciso('VIII')}
                      aria-expanded={isOpen}
                      className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7]"
                    >
                      <span className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                        <span className="font-bold text-[#0a2540] mr-2">VIII.</span>
                        {tituloTexto}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#0284c7]' : 'rotate-0'
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 space-y-4 bg-slate-50/40 border-t border-slate-100 animate-fade-in">
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
                          {item?.descricao || metaIncisos.VIII.descricaoPadrao}
                        </p>

                        {/* DOCUMENTO EM PDF DE RESUMO DAS OFERTAS DE CESSÃO */}
                        <div className="pt-1">
                          {docResumoCessoes.url ? (
                            <DocumentLinkRow
                              url={docResumoCessoes.url}
                              label={
                                docResumoCessoes.nomeExibicao &&
                                docResumoCessoes.nomeExibicao !== '- Baixar Arquivo'
                                  ? docResumoCessoes.nomeExibicao
                                  : 'Resumo das Ofertas de Cessão de Capacidade Contratada (PDF)'
                              }
                              sublabel="Documento oficial publicado pela TSB"
                            />
                          ) : (
                            <DocumentLinkRow
                              url="#"
                              onClick={() => {
                                toast({
                                  title: 'Resumo das Ofertas de Cessão de Capacidade Contratada',
                                  description:
                                    'Documento oficial publicado periodicamente pela equipe da TSB.',
                                })
                              }}
                              label="Resumo das Ofertas de Cessão de Capacidade Contratada (PDF)"
                              sublabel="Documento oficial publicado pela TSB"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </section>
        </div>
      </Card>
    </div>
  )
}
