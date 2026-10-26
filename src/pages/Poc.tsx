import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Lock, ArrowRight, ShieldCheck, Info, ChevronRight } from 'lucide-react'
import {
  transparenciaService,
  resolverUrlDocumento,
  type ItemTransparencia,
} from '@/services/transparencia'
import { pocService, type DocumentoPOCItem } from '@/services/poc'

// Ícone de documento PDF estilo NTS/Boletim (glifo discreto de 16-18px com canto dobrado e contorno refinado)
function PdfIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 inline-block align-middle text-red-600 ${className}`}
      aria-hidden="true"
      style={{ minWidth: '16px', minHeight: '16px', maxWidth: '18px', maxHeight: '18px' }}
    >
      {/* Contorno do arquivo com canto superior direito chanfrado */}
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

// Ícone de documento Word para os modelos .docx
function WordIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 inline-block align-middle text-blue-700 ${className}`}
      aria-hidden="true"
      style={{ minWidth: '16px', minHeight: '16px', maxWidth: '18px', maxHeight: '18px' }}
    >
      <path
        d="M3 2.5C3 1.94772 3.44772 1.5 4 1.5H9.5L13 5V13.5C13 14.0523 12.5523 14.5 12 14.5H4C3.44772 14.5 3 14.0523 3 13.5V2.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="#eff6ff"
      />
      <path
        d="M9.5 1.5V5H13"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="3.8" y="7.2" width="8.4" height="4.8" rx="0.8" fill="currentColor" />
      <text
        x="8"
        y="10.8"
        fill="#ffffff"
        fontSize="3.0"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
        textAnchor="middle"
        letterSpacing="0.2"
      >
        DOC
      </text>
    </svg>
  )
}

// Linha de documento simples e limpa no padrão consagrado da Transparência (Boletim / Plataforma)
interface DocumentLinkRowProps {
  url?: string
  label: string
  title?: string
  external?: boolean
  sublabel?: string
  formato?: 'pdf' | 'word'
  publicado?: boolean
  className?: string
}

function DocumentLinkRow({
  url,
  label,
  title,
  external,
  sublabel,
  formato = 'pdf',
  publicado = true,
  className = '',
}: DocumentLinkRowProps) {
  if (!publicado || !url) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center gap-2">
          {formato === 'word' ? (
            <WordIcon className="w-4 h-4 text-slate-300" />
          ) : (
            <PdfIcon className="w-4 h-4 text-slate-300" />
          )}
          <span className="text-sm font-medium text-slate-400">{label}</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-mono italic">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
            Ainda não publicado
          </span>
        </div>
        {sublabel && (
          <p className="text-xs text-slate-500 pl-6 font-normal leading-relaxed">{sublabel}</p>
        )}
      </div>
    )
  }

  return (
    <div className={`group space-y-1 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={title || label}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-[#0284c7] transition-colors py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] rounded-xs text-left"
        >
          {formato === 'word' ? (
            <WordIcon className="w-4 h-4 text-blue-700 transition-transform group-hover:scale-110" />
          ) : (
            <PdfIcon className="w-4 h-4 text-red-600 transition-transform group-hover:scale-110" />
          )}
          <span className="underline decoration-slate-300 underline-offset-4 group-hover:decoration-[#0284c7]">
            {label}
          </span>
          {external && (
            <span className="text-[11px] text-slate-400 font-normal no-underline">(externo)</span>
          )}
        </a>
      </div>
      {sublabel && (
        <p className="text-xs text-slate-500 pl-6 font-normal leading-relaxed">{sublabel}</p>
      )}
    </div>
  )
}

// Definição dos slots de documentos agrupados conforme o site real da TSB
interface SlotDocConfig {
  chaveTransparencia?: string
  chavePocDoc?: string
  titulo: string
  subtitulo?: string
  formato: 'pdf' | 'word'
  rotuloArquivoPadrao: string
  urlPadrao?: string
}

interface GrupoDocsConfig {
  id: string
  tituloGrupo: string
  descricaoGrupo?: string
  slots: SlotDocConfig[]
}

const GRUPOS_DOCUMENTOS_POCC: GrupoDocsConfig[] = [
  {
    id: 'ciclo_2025_2026',
    tituloGrupo: 'Ciclo POCC 2025/2026',
    descricaoGrupo:
      'POCC 2025 para prestação de serviço de transporte extraordinário em 2026 (aprovado pela ANP)',
    slots: [
      {
        chaveTransparencia: 'pocc_aprovacao_anp_oficio555',
        titulo: 'Aprovação pela ANP',
        subtitulo: 'Ofício nº 555/2025/SIM-CTC/SIM/ANP-RJ-e',
        formato: 'pdf',
        rotuloArquivoPadrao: 'Ofício nº 555/2025-SIM (PDF)',
        urlPadrao:
          'https://www.tsb.com.br/wp-content/uploads/2026/04/OFICIO-No-555_2025_SIM-CTC_SIM_ANP-RJ-e.pdf',
      },
      {
        chaveTransparencia: 'pocc_contrato_master_assinado',
        chavePocDoc: 'minuta_contrato_transporte_2026',
        titulo: 'Contrato Master',
        subtitulo: 'Contrato Master completo do ciclo 2026',
        formato: 'pdf',
        rotuloArquivoPadrao: 'Contrato Master Completo (PDF)',
        urlPadrao: 'https://www.tsb.com.br/wp-content/uploads/2025/12/CONTRATO-MASTER-2026.pdf',
      },
      {
        chaveTransparencia: 'pocc_capacidade_ofertada',
        titulo: 'Capacidade de Transporte Ofertada',
        subtitulo: 'Capacidade de transporte ofertada para o ciclo de 2026',
        formato: 'pdf',
        rotuloArquivoPadrao: 'Capacidade de Transporte Ofertada (PDF)',
        urlPadrao:
          'https://www.tsb.com.br/wp-content/uploads/2025/12/CAPACIDADE-DE-TRANSPORTE-OFERTADA-PARA-2026.pdf',
      },
      {
        chaveTransparencia: 'pocc_cronograma_indicativo',
        chavePocDoc: 'cronograma_detalhado_2026',
        titulo: 'Cronograma',
        subtitulo: 'Cronograma indicativo do ciclo regulatório e etapas do POCC',
        formato: 'pdf',
        rotuloArquivoPadrao: 'Cronograma Indicativo 2026–2030 (PDF)',
        urlPadrao:
          'https://www.tsb.com.br/wp-content/uploads/2026/04/Cronograma-Indicativo-Ciclo-Regulatorio-2026-2030.pdf',
      },
      {
        chaveTransparencia: 'pocc_tarifa_contrato_extraordinario',
        titulo: 'Tarifa Contrato Extraordinário',
        subtitulo: 'Tarifa homologada para o Trecho 3 (T3) para o ciclo de 2026',
        formato: 'word',
        rotuloArquivoPadrao: 'Tarifa T3 para 2026 (Word)',
        urlPadrao: 'https://www.tsb.com.br/wp-content/uploads/2026/02/Tarifa-T3-para-2026-1.docx',
      },
    ],
  },
  {
    id: 'modelos',
    tituloGrupo: 'Modelos de Documentos',
    descricaoGrupo:
      'Minutas e formulários padronizados disponibilizados para download prévio pelos proponentes',
    slots: [
      {
        chaveTransparencia: 'pocc_modelo_manifestacao_interesse',
        titulo: 'Modelo de Manifestação de Interesse (PDF)',
        subtitulo:
          'Formulário-padrão de manifestação de interesse não vinculante (Art. 37-A, §5º, I)',
        formato: 'pdf',
        rotuloArquivoPadrao: 'Modelo de Manifestação de Interesse (PDF)',
        urlPadrao:
          'https://www.tsb.com.br/wp-content/uploads/2023/11/MODELO-MANIFESTAC%CC%A7A%CC%83O-DE-INTERESSE.pdf',
      },
      {
        chaveTransparencia: 'pocc_modelo_manifestacao_interesse_word',
        titulo: 'Modelo de Manifestação de Interesse (Word)',
        subtitulo: 'Formulário editável para preenchimento pelos carregadores interessados',
        formato: 'word',
        rotuloArquivoPadrao: 'Manifestação de Interesse — Modelo em Word',
        urlPadrao:
          'https://www.tsb.com.br/wp-content/uploads/2023/12/MODELO-MANIFESTAC%CC%A7A%CC%83O-DE-INTERESSE.docx',
      },
      {
        chaveTransparencia: 'pocc_modelo_proposta_garantida',
        titulo: 'Modelo de Proposta Garantida (PDF)',
        subtitulo:
          'Minuta-padrão de proposta vinculante com aporte de garantias (Art. 37-A, §5º, III)',
        formato: 'pdf',
        rotuloArquivoPadrao: 'Modelo de Proposta Garantida (PDF)',
        urlPadrao:
          'https://www.tsb.com.br/wp-content/uploads/2023/11/Modelo-Proposta-Garantida.pdf',
      },
      {
        chaveTransparencia: 'pocc_modelo_proposta_garantida_word',
        titulo: 'Modelo de Proposta Garantida (Word)',
        subtitulo: 'Minuta editável para submissão da proposta vinculante',
        formato: 'word',
        rotuloArquivoPadrao: 'Modelo de Proposta Garantida — Modelo em Word',
        urlPadrao:
          'https://www.tsb.com.br/wp-content/uploads/2023/12/Modelo-Proposta-Garantida.docx',
      },
    ],
  },
  {
    id: 'informacoes_tecnicas',
    tituloGrupo: 'Informações Técnicas e Cadastrais',
    descricaoGrupo:
      'Parâmetros hidráulicos da infraestrutura, capacidades operacionais e exigências habilitatórias',
    slots: [
      {
        chaveTransparencia: 'pocc_capacidades_pe_zs',
        titulo: 'Capacidades Disponíveis no Ponto de Entrada e Zonas de Saída',
        subtitulo: 'Valores nominais e operacionais nos Trechos 1 e 3 da malha TSB',
        formato: 'pdf',
        rotuloArquivoPadrao: 'Capacidades Disponíveis PE e ZS (PDF)',
        urlPadrao:
          'https://www.tsb.com.br/wp-content/uploads/2024/11/1.7.7-CAPACIDADES_DISPONIVEIS-PE-E-ZS-5.pdf',
      },
      {
        chaveTransparencia: 'pocc_calculo_capacidade',
        titulo: 'Cálculo da Capacidade de Transporte',
        subtitulo:
          'Memória técnica e metodologia da simulação termo-hidráulica da TSB (Item 1.7.8)',
        formato: 'pdf',
        rotuloArquivoPadrao: 'Cálculo da Capacidade de Transporte (PDF)',
        urlPadrao:
          'https://www.tsb.com.br/wp-content/uploads/2023/11/1.7.8-CA%CC%81LCULO-DA-CAPACIDADE-DE-TRANSPORTE.pdf',
      },
      {
        chaveTransparencia: 'pocc_requisitos_habilitacao',
        titulo: 'Requisitos de Habilitação do Carregador',
        subtitulo: 'Documentação societária, fiscal, técnica e cadastral exigida (Item 1.7.9)',
        formato: 'pdf',
        rotuloArquivoPadrao: 'Requisitos de Habilitação do Carregador (PDF)',
        urlPadrao:
          'https://www.tsb.com.br/wp-content/uploads/2023/11/1.7.9-REQUISITOS-DE-HABILITAC%CC%A7A%CC%83O-DO-CARREGADOR.pdf',
      },
    ],
  },
  {
    id: 'atos_regulatorios',
    tituloGrupo: 'Atos Regulatórios da ANP',
    descricaoGrupo:
      'Deliberações, aprovações de propostas tarifárias e despachos publicados no Diário Oficial da União',
    slots: [
      {
        chaveTransparencia: 'pocc_resultados_ciclo',
        chavePocDoc: 'proposta_tarifaria_anp_2026',
        titulo: 'Despacho ANP com aprovação da proposta tarifária (DOU)',
        subtitulo: 'Despacho SIM/ANP nº 1.328/2024 publicado no DOU',
        formato: 'pdf',
        rotuloArquivoPadrao: 'Despacho ANP nº 1.328/2024 (PDF / DOU)',
        urlPadrao:
          'https://www.tsb.com.br/wp-content/uploads/2024/11/1.7.11-DESPACHO-SIM-ANP-No-1.328-11-2024-DOU.pdf',
      },
    ],
  },
  {
    id: 'resultados',
    tituloGrupo: 'Resultados do Processo',
    descricaoGrupo:
      'Publicação formal das decisões e homologações de cada etapa conforme deliberação da ANP',
    slots: [
      {
        chaveTransparencia: 'pocc_resultado_manifestacao',
        chavePocDoc: 'resultado_manifestacao_2026',
        titulo: 'Resultado da Manifestação de Interesse',
        subtitulo: 'Ato oficial com o balanço preliminar de demanda (Art. 37-A, §5º, I)',
        formato: 'pdf',
        rotuloArquivoPadrao: 'Resultado da Manifestação de Interesse (PDF)',
        urlPadrao: undefined, // Estado inicial: Ainda não publicado
      },
      {
        chaveTransparencia: 'pocc_resultado_proposta_garantida',
        chavePocDoc: 'resultado_final_2026',
        titulo: 'Resultado de Proposta Garantida',
        subtitulo:
          'Classificação das propostas firmes e alocação final da capacidade (Art. 37-A, §5º, III)',
        formato: 'pdf',
        rotuloArquivoPadrao: 'Resultado de Proposta Garantida (PDF)',
        urlPadrao: undefined, // Estado inicial: Ainda não publicado
      },
      {
        chaveTransparencia: 'pocc_homologacao_mi',
        titulo: 'Homologação da etapa de Manifestação de Interesse (MI)',
        subtitulo: 'Ato de homologação da TSB e encaminhamento à ANP (Art. 37-A, §5º, II)',
        formato: 'pdf',
        rotuloArquivoPadrao: 'Homologação da Etapa de MI (PDF)',
        urlPadrao: undefined, // Estado inicial: Ainda não publicado
      },
    ],
  },
]

export default function Poc() {
  const [itensTransparencia, setItensTransparencia] = useState<ItemTransparencia[]>([])
  const [docsPocBd, setDocsPocBd] = useState<DocumentoPOCItem[]>([])

  const carregarDados = useCallback(async () => {
    try {
      const [todosTransp, docsPoc] = await Promise.all([
        transparenciaService.listarTodos(),
        pocService.listarTodosDocumentos(),
      ])
      setItensTransparencia(todosTransp)
      setDocsPocBd(docsPoc)
    } catch (e) {
      console.warn('[Poc] Usando fallbacks canônicos para documentos da POCC:', e)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Mapas para resolução rápida de uploads e URLs publicadas
  const transpMap = useMemo(() => {
    const map = new Map<string, ItemTransparencia>()
    itensTransparencia.forEach((it) => map.set(it.chave, it))
    return map
  }, [itensTransparencia])

  const pocDocMap = useMemo(() => {
    const map = new Map<string, DocumentoPOCItem>()
    docsPocBd.forEach((d) => map.set(d.chave, d))
    return map
  }, [docsPocBd])

  // Resolve para cada slot se há arquivo publicado no banco ou fallback
  const resolverSlot = (slot: SlotDocConfig) => {
    // 1. Tenta achar na coleção de transparência (onde a Editoria faz uploads)
    if (slot.chaveTransparencia && transpMap.has(slot.chaveTransparencia)) {
      const item = transpMap.get(slot.chaveTransparencia)!
      if (item.ativo !== false) {
        const info = resolverUrlDocumento(item, slot.urlPadrao || '')
        if (info.url && info.url !== 'https://www.tsb.com.br/poc/' && info.url !== '#') {
          return {
            publicado: true,
            url: info.url,
            rotulo:
              item.nome_arquivo_custom && item.nome_arquivo_custom !== '- Baixar Arquivo'
                ? item.nome_arquivo_custom
                : slot.rotuloArquivoPadrao,
            subtitulo: item.descricao || slot.subtitulo,
          }
        }
      }
    }

    // 2. Tenta achar na coleção poc_documentos
    if (slot.chavePocDoc && pocDocMap.has(slot.chavePocDoc)) {
      const item = pocDocMap.get(slot.chavePocDoc)!
      if (item.ativo) {
        if (item.arquivo && item.id && item.collectionId) {
          return {
            publicado: true,
            url: `/api/files/${item.collectionId}/${item.id}/${item.arquivo}`,
            rotulo: item.nome_arquivo_custom || slot.rotuloArquivoPadrao,
            subtitulo: item.descricao || slot.subtitulo,
          }
        }
        if (
          item.url_externa &&
          item.url_externa.trim() &&
          item.url_externa !== 'https://www.tsb.com.br/poc/'
        ) {
          return {
            publicado: true,
            url: item.url_externa.trim(),
            rotulo: item.nome_arquivo_custom || slot.rotuloArquivoPadrao,
            subtitulo: item.descricao || slot.subtitulo,
          }
        }
      }
    }

    // 3. Usa URL padrão do slot se informada (link oficial TSB)
    if (slot.urlPadrao) {
      return {
        publicado: true,
        url: slot.urlPadrao,
        rotulo: slot.rotuloArquivoPadrao,
        subtitulo: slot.subtitulo,
      }
    }

    // 4. Estado discreto "Ainda não publicado"
    return {
      publicado: false,
      url: '',
      rotulo: 'Ainda não publicado',
      subtitulo: slot.subtitulo,
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* CABEÇALHO DA PÁGINA PÚBLICA */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50/70 text-[#0a2540] text-[10px] font-bold tracking-wider uppercase font-display"
          >
            Resolução ANP nº 961/2023 · Arts. 2º XXXIV-C, 26 e 37-A
          </Badge>
          <Badge
            variant="outline"
            className="border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-medium"
          >
            Acesso Público
          </Badge>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Fase atual: aguardando abertura
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0a2540] font-display">
          Processo de Oferta e Contratação de Capacidade (POCC)
        </h1>

        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-4xl text-justify sm:text-left">
          Processo conduzido pela <strong>Transportadora Sulbrasileira de Gás S.A. (TSB)</strong>,
          sob regulação da{' '}
          <strong>Agência Nacional do Petróleo, Gás Natural e Biocombustíveis (ANP)</strong>, em
          cumprimento à Resolução ANP nº 961/2023 &mdash; que altera a Resolução ANP nº 11/2016
          (Arts. 2º, XXXIV-C; 26; e 37-A). O processo assegura publicidade, transparência e isonomia
          na contratação de capacidade firme de transporte na malha dutoviária da TSB.
        </p>
      </div>

      {/* SEÇÃO PÚBLICA: DOCUMENTOS DO PROCESSO (PADRÃO TRANSPARÊNCIA: UM CARD POR GRUPO DE DOCUMENTOS COM LINHAS EMPILHADAS) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5 text-[#0a2540]">
            <FileText className="h-5 w-5 text-[#0284c7] shrink-0" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight text-[#0a2540]">
                Documentos do Processo
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                Publicações oficiais, instrumentos contratuais, tarifas e deliberações regulatórias
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200 self-start sm:self-auto">
            Publicação Oficial · Res. ANP nº 961/2023
          </span>
        </div>

        <div className="space-y-6">
          {GRUPOS_DOCUMENTOS_POCC.map((grupo) => (
            <Card
              key={grupo.id}
              className="border border-slate-200 shadow-xs bg-white overflow-hidden rounded-xl"
            >
              <CardHeader className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-4 bg-[#0284c7] rounded-xs inline-block shrink-0" />
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold font-display text-[#0a2540]">
                      {grupo.tituloGrupo}
                    </CardTitle>
                    {grupo.descricaoGrupo && (
                      <p className="text-xs text-slate-500 font-normal mt-0.5 leading-relaxed">
                        {grupo.descricaoGrupo}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 sm:p-7">
                <div className="space-y-5 divide-y divide-slate-100">
                  {grupo.slots.map((slot, index) => {
                    const res = resolverSlot(slot)
                    const labelExibicao = slot.titulo
                    const sublabelExibicao = res.subtitulo || slot.subtitulo

                    return (
                      <div key={`${grupo.id}-${index}`} className="pt-4 first:pt-0">
                        <DocumentLinkRow
                          url={res.url}
                          label={labelExibicao}
                          title={`Abrir/baixar ${res.rotulo || slot.titulo}`}
                          sublabel={sublabelExibicao}
                          formato={slot.formato}
                          publicado={res.publicado}
                        />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* SEÇÃO PÚBLICA: PARTICIPAÇÃO NO PROCESSO (INFORMATIVA, SEM FORMULÁRIOS) COM BOTÃO ACESSAR POCC */}
      <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5 text-[#0a2540]">
              <div className="p-2 rounded-md bg-blue-50 text-[#0284c7]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold font-display">
                  Manifestação de Interesse
                </CardTitle>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Regras de habilitação prévia e acesso às etapas restritas aos carregadores
                </p>
              </div>
            </div>
            <span className="text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full font-mono">
              Art. 37-A, § 5º, I e III
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-5">
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
            <p>
              A contratação de capacidade de transporte firme na malha dutoviária da TSB observa as
              etapas regulatórias sequenciais estabelecidas no{' '}
              <strong>Art. 37-A da Resolução ANP nº 961/2023</strong>. A consulta aos editais,
              minutas contratuais e tarifas é <strong>integralmente pública e aberta</strong> a
              qualquer interessado nos blocos acima.
            </p>
            <p>
              Por determinação regulatória e conformidade com a LGPD (Lei nº 13.709/2018), a
              submissão dos atos formais &mdash; compreendendo a{' '}
              <strong>Manifestação de Interesse Não Vinculante</strong> (Etapa I, §5º, I) e a{' '}
              <strong>Proposta Garantida Vinculante</strong> (Etapa III, §5º, III) &mdash; é{' '}
              <strong>reservada exclusivamente a carregadores credenciados</strong> portadores de
              registro perante a ANP, mediante autenticação segura. Nenhum dado cadastral ou
              proposta é submetido em ambiente público.
            </p>
          </div>

          {/* DESTAQUE INSTITUCIONAL: BOTÃO ACESSAR POCC */}
          <div className="p-5 rounded-lg border-2 border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#0284c7]" />
                <h3 className="text-sm font-bold text-[#0a2540] font-display uppercase tracking-wide">
                  Área Restrita do Carregador · POCC
                </h3>
              </div>
              <p className="text-xs text-slate-600 max-w-xl">
                Acesse o ambiente seguro para credenciamento, manifestação de interesse e submissão
                de propostas com garantias nas etapas cabíveis do cronograma.
              </p>
            </div>

            <Button
              asChild
              className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-semibold px-5 py-2.5 h-auto cursor-pointer shadow-xs shrink-0"
            >
              <Link to="/pocc-acesso" className="inline-flex items-center gap-2">
                <span>Portal de Contratação de Capacidade</span>
                <ArrowRight className="h-3.5 w-3.5 text-sky-300" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AVISO REGULATÓRIO DISCRETO NO RODAPÉ */}
      <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 flex items-start sm:items-center gap-3">
        <Info className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5 sm:mt-0" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-800">Acompanhamento regulatório: </span>
          As datas, aditamentos e publicações das etapas serão divulgados nesta página conforme
          avançarem os prazos legais e as homologações da Agência Nacional do Petróleo, Gás Natural
          e Biocombustíveis.
        </div>
      </div>
    </div>
  )
}
