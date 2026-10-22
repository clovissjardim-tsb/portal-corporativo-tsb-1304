import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FileText,
  FileDown,
  ExternalLink,
  Search,
  CheckCircle2,
  XCircle,
  Info,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Layers,
  Download,
  FileSpreadsheet,
  Mail,
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
import { cessoesService } from '@/services/cessoes'
import { gerarFormularioCessaoPdf } from '@/services/formularioCessaoPdf'
import { gerarFormularioAcessoPdf } from '@/services/formularioSolicitacaoAcessoPdf'

export interface PlataformaEletronicaProps {
  // Sub-abas
  subAba: 'i_vi' | 'vii' | 'viii'
  setSubAba: (aba: 'i_vi' | 'vii' | 'viii') => void

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

  // Consulta Inciso VII
  consultaProtocolo: string
  setConsultaProtocolo: (val: string) => void
  consultandoSLA: boolean
  handleVerificarSLA: (e: React.FormEvent) => void
  resultadoConsulta: {
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
  consultaProtocolo,
  setConsultaProtocolo,
  consultandoSLA,
  handleVerificarSLA,
  resultadoConsulta,
  resumoPublicoVII,
  resumoInstalacaoVII = [],
  carregandoResumoVII,
  carregarResumoVII,
  ofertasCessao,
  carregandoCessoes,
  carregarOfertasCessao,
}: PlataformaEletronicaProps) {
  const [emailRecebimentoCessoes, setEmailRecebimentoCessoes] = useState('acesso@tsb.com.br')
  const [gerandoPdfCessao, setGerandoPdfCessao] = useState(false)
  const [gerandoPdfAcesso, setGerandoPdfAcesso] = useState(false)

  useEffect(() => {
    cessoesService.obterEmailRecebimento().then((em) => {
      if (em) setEmailRecebimentoCessoes(em)
    })
  }, [])

  const handleBaixarFormularioPdf = async () => {
    setGerandoPdfCessao(true)
    try {
      await gerarFormularioCessaoPdf({
        emailDestino: emailRecebimentoCessoes,
      })
    } catch (err) {
      console.error('Erro ao gerar PDF do formulário de cessão:', err)
    } finally {
      setGerandoPdfCessao(false)
    }
  }

  const handleBaixarFormularioAcessoPdf = async () => {
    setGerandoPdfAcesso(true)
    try {
      await gerarFormularioAcessoPdf({
        emailDestino: 'regulacao@tsb.com.br',
      })
    } catch (err) {
      console.error('Erro ao gerar PDF do formulário de solicitação de acesso:', err)
    } finally {
      setGerandoPdfAcesso(false)
    }
  }
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
          {/* ========================================================
              SUB-ABA 1: INCISOS I A VI (ESPELHANDO FIELMENTE O SITE)
              ======================================================== */}
          {subAba === 'i_vi' && (
            <div className="space-y-6">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <h2 className="text-base sm:text-lg font-bold text-[#0a1d37] font-display">
                      {headerIncisos1a6.titulo}
                    </h2>
                    <div className="w-full h-px bg-slate-200 mt-2 mb-3" />
                    {headerIncisos1a6.descricao && (
                      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                        {headerIncisos1a6.descricao}
                      </p>
                    )}
                  </div>
                  {(() => {
                    if (!headerIncisos1a6.item) return null
                    const doc = resolverUrlDocumento(headerIncisos1a6.item, '')
                    if (!doc.url) return null
                    return (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-50 text-[#0284c7] hover:bg-sky-100 text-xs font-semibold shrink-0 transition-colors border border-sky-200 self-start mt-1"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        {doc.nomeExibicao || 'Anexo'}
                      </a>
                    )
                  })()}
                </div>
              </div>

              {/* TABELA PRINCIPAL NO MESMO PADRÃO DO BOLETIM ELETRÔNICO OFICIAL */}
              <div className="overflow-x-auto border border-slate-200 rounded-md bg-white">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-16 text-center border-r border-slate-200 tracking-wider uppercase text-[11px]">
                        Inciso
                      </th>
                      <th className="p-3 w-3/5 sm:w-2/3 border-r border-slate-200 tracking-wider uppercase text-[11px]">
                        Exigência Legal (Art. 9º, Res. ANP 11/2016)
                      </th>
                      <th className="p-3 w-2/5 sm:w-1/3 text-center tracking-wider uppercase text-[11px]">
                        Arquivo / Consulta
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {/* INCISO I */}
                    {(() => {
                      const item = incisosBdMap.get('inciso_i')
                      if (item && item.ativo === false) return null
                      const doc = resolverUrlDocumento(
                        item,
                        'https://tsb.com.br/wp-content/uploads/2023/04/fluxo_fisico.pdf',
                      )
                      return (
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-center font-bold text-[#0a2540] border-r border-slate-200">
                            I
                          </td>
                          <td className="p-3 text-slate-800 border-r border-slate-200">
                            <span className="font-semibold text-[#0a2540]">
                              {item?.titulo || 'I - Fluxo Físico'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                              {doc.nomeExibicao || '- Baixar Arquivo'}
                            </a>
                          </td>
                        </tr>
                      )
                    })()}

                    {/* INCISO II */}
                    {(() => {
                      const item = incisosBdMap.get('inciso_ii')
                      if (item && item.ativo === false) return null
                      const doc = resolverUrlDocumento(
                        item,
                        'https://tsb.com.br/wp-content/uploads/2023/04/bibArq000438-2.pdf',
                      )
                      return (
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-center font-bold text-[#0a2540] border-r border-slate-200">
                            II
                          </td>
                          <td className="p-3 text-slate-800 border-r border-slate-200">
                            <span className="font-semibold text-[#0a2540]">
                              {item?.titulo ||
                                'II - Características técnicas e operacionais de Instalação de Transporte'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                              {doc.nomeExibicao || '- Baixar Arquivo'}
                            </a>
                          </td>
                        </tr>
                      )
                    })()}

                    {/* INCISO III */}
                    {(() => {
                      const item = incisosBdMap.get('inciso_iii')
                      if (item && item.ativo === false) return null
                      const doc = resolverUrlDocumento(
                        item,
                        'https://www.tsb.com.br/wp-content/uploads/2023/08/Capacidade-Disponivel-SITE.pdf',
                      )
                      return (
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-center font-bold text-[#0a2540] border-r border-slate-200">
                            III
                          </td>
                          <td className="p-3 text-slate-800 border-r border-slate-200">
                            <div className="space-y-1">
                              <span className="font-semibold text-[#0a2540]">
                                {item?.titulo ||
                                  'III - Capacidade disponível, capacidade em fluxo oposto ao fluxo físico e capacidade ociosa por ponto relevante.'}
                              </span>
                              <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-700 leading-relaxed">
                                <span className="font-semibold text-[#0a2540]">
                                  Previsão de Disponibilidade (Padrão TBG):
                                </span>{' '}
                                A previsão rolante de 7 anos (capacidade firme) e 2 anos (capacidade
                                não-firme) é publicada neste documento oficial em PDF e atualizada
                                periodicamente pela área técnica da TSB.
                              </div>
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
                              {doc.nomeExibicao || '- Baixar Arquivo'}
                            </a>
                          </td>
                        </tr>
                      )
                    })()}

                    {/* INCISO IV */}
                    {(() => {
                      const item = incisosBdMap.get('inciso_iv')
                      if (item && item.ativo === false) return null
                      const doc = resolverUrlDocumento(
                        item,
                        'https://www.tsb.com.br/wp-content/uploads/2023/08/Capacidade-gasoduto-A.pdf',
                      )
                      return (
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-center font-bold text-[#0a2540] border-r border-slate-200">
                            IV
                          </td>
                          <td className="p-3 text-slate-800 border-r border-slate-200">
                            <span className="font-semibold text-[#0a2540]">
                              {item?.titulo ||
                                'IV - Capacidades contratadas por contrato de serviço de transporte celebrado'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                              {doc.nomeExibicao || '- Baixar Arquivo'}
                            </a>
                          </td>
                        </tr>
                      )
                    })()}

                    {/* INCISO V */}
                    {(() => {
                      const item = incisosBdMap.get('inciso_v')
                      if (item && item.ativo === false) return null
                      const doc1 = resolverUrlDocumento(
                        item,
                        'https://tsb.com.br/wp-content/uploads/2023/04/RSTH-Trecho-1.pdf',
                      )
                      const doc2 = resolverUrlSecundaria(
                        item,
                        'https://tsb.com.br/wp-content/uploads/2023/04/RSTH-Trecho-3.pdf',
                      )
                      return (
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-center font-bold text-[#0a2540] border-r border-slate-200">
                            V
                          </td>
                          <td className="p-3 text-slate-800 border-r border-slate-200">
                            <span className="font-semibold text-[#0a2540]">
                              {item?.titulo || 'V - Simulação termo-hidráulica'}
                            </span>
                            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-600">
                              <a
                                href={doc1.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0284c7] hover:underline inline-flex items-center gap-1 font-medium"
                              >
                                <FileDown className="h-3 w-3" />
                                {doc1.nomeExibicao || 'Simulação Trecho 1 (PDF)'}
                              </a>
                              <span className="text-slate-300">•</span>
                              <a
                                href={doc2.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0284c7] hover:underline inline-flex items-center gap-1 font-medium"
                              >
                                <FileDown className="h-3 w-3" />
                                {doc2.nomeExibicao || 'Simulação Trecho 3 (PDF)'}
                              </a>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <a
                              href="https://www.tsb.com.br/v-simulacao-termo-hidraulica/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Acessar Página Oficial
                            </a>
                          </td>
                        </tr>
                      )
                    })()}

                    {/* INCISO VI */}
                    {(() => {
                      const item = incisosBdMap.get('inciso_vi')
                      if (item && item.ativo === false) return null
                      const doc = resolverUrlDocumento(
                        item,
                        'https://tsb.com.br/wp-content/uploads/2023/04/termo_de_acesso.pdf',
                      )
                      return (
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-center font-bold text-[#0a2540] border-r border-slate-200">
                            VI
                          </td>
                          <td className="p-3 text-slate-800 border-r border-slate-200">
                            <span className="font-semibold text-[#0a2540]">
                              {item?.titulo ||
                                'VI - Termos e condições tarifárias e não tarifárias'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                              {doc.nomeExibicao || '- Baixar Arquivo'}
                            </a>
                          </td>
                        </tr>
                      )
                    })()}

                    {/* ATALHOS DIRETOS PARA OS INCISOS VII E VIII */}
                    <tr className="bg-slate-50/60 hover:bg-slate-100/60 transition-colors border-t-2 border-slate-200">
                      <td className="p-3 text-center font-bold text-[#0a2540] border-r border-slate-200">
                        VII
                      </td>
                      <td className="p-3 text-slate-800 border-r border-slate-200">
                        <span className="font-semibold text-[#0a2540]">
                          VII - Consulta de disponibilidade de acesso (Solicitação de Acesso)
                        </span>
                        <div className="mt-1 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSubAba('vii')}
                            className="text-[11px] font-medium text-[#0284c7] hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            &rarr; Abrir modelo oficial (PDF) e consulta regulatória
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSubAba('vii')}
                          className="border-[#0a2540] text-[#0a2540] hover:bg-[#0a2540] hover:text-white text-[11px] h-7 px-3 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Solicitar Acesso
                        </Button>
                      </td>
                    </tr>

                    <tr className="bg-slate-50/60 hover:bg-slate-100/60 transition-colors">
                      <td className="p-3 text-center font-bold text-[#0a2540] border-r border-slate-200">
                        VIII
                      </td>
                      <td className="p-3 text-slate-800 border-r border-slate-200">
                        <span className="font-semibold text-[#0a2540]">
                          VIII - Resumo das Ofertas de Cessão de Capacidade Contratada Informadas ao
                          Transportador por Carregadores
                        </span>
                        <div className="mt-1 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSubAba('viii')}
                            className="text-[11px] font-medium text-[#0284c7] hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            &rarr; Ver resumo de ofertas e baixar formulário-padrão (PDF)
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSubAba('viii')}
                          className="border-[#0a2540] text-[#0a2540] hover:bg-[#0a2540] hover:text-white text-[11px] h-7 px-3 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Painel de Cessão
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              SUB-ABA 2: INCISO VII (MODELO EXCLUSIVO POR E-MAIL - PADRÃO NTS/TAG/TBG)
              ======================================================== */}
          {subAba === 'vii' && (
            <div className="space-y-8">
              {/* CANAL OFICIAL EXCLUSIVO POR E-MAIL COM FORMULÁRIO PDF OFICIAL (PADRÃO NTS/TAG/TBG) */}
              <div className="p-6 bg-slate-50/70 border border-slate-200 rounded-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0a2540] text-white uppercase tracking-wider font-display">
                        Inciso VII • Canal Oficial
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        Padrão NTS / TAG / TBG • Envio por E-mail
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-[#0a2540] font-display flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#0284c7]" />
                      Solicitação de Acesso à Capacidade de Transporte Dutoviário
                    </h4>
                    <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                      Em conformidade com a prática padrão adotada pelas transportadoras brasileiras
                      (NTS, TAG e TBG), a solicitação de acesso é formalizada exclusivamente
                      mediante o download do formulário oficial em PDF, preenchimento dos requisitos
                      técnicos, assinatura do representante legal e envio por e-mail para{' '}
                      <strong className="text-[#0a2540]">regulacao@tsb.com.br</strong>. A equipe da
                      TSB autuará o processo internamente e emitirá o protocolo formal com contagem
                      do SLA regulatório.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="default"
                    onClick={handleBaixarFormularioAcessoPdf}
                    disabled={gerandoPdfAcesso}
                    className="bg-[#0a2540] hover:bg-[#143b73] text-white font-semibold text-xs px-4 py-2 shrink-0 shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-200" />
                    {gerandoPdfAcesso
                      ? 'Gerando Formulário PDF...'
                      : 'Baixar Formulário Oficial (PDF)'}
                  </Button>
                </div>

                {/* FLUXO EM 4 PASSOS: BAIXAR, PREENCHER E ASSINAR, ENVIAR POR E-MAIL, AGUARDAR RESPOSTA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                    <div className="w-5 h-5 rounded bg-slate-200 text-[#0a2540] font-bold text-[11px] flex items-center justify-center font-display">
                      1
                    </div>
                    <h5 className="font-bold text-xs text-[#0a2540]">Baixar Formulário Oficial</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Faça o download do modelo oficial TSB em PDF, estruturado com todos os
                      requisitos do Art. 10 da Resolução ANP nº 11/2016.
                    </p>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                    <div className="w-5 h-5 rounded bg-slate-200 text-[#0a2540] font-bold text-[11px] flex items-center justify-center font-display">
                      2
                    </div>
                    <h5 className="font-bold text-xs text-[#0a2540]">Preencher &amp; Assinar</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Preencha os dados da empresa, capacidade e trecho. Assine via certificado
                      digital (Gov.br / ICP-Brasil) ou assinatura física com carimbo.
                    </p>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                    <div className="w-5 h-5 rounded bg-slate-200 text-[#0a2540] font-bold text-[11px] flex items-center justify-center font-display">
                      3
                    </div>
                    <h5 className="font-bold text-xs text-[#0a2540]">Enviar por E-mail</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Encaminhe o documento assinado em anexo para o canal regulatório oficial:{' '}
                      <a
                        href="mailto:regulacao@tsb.com.br"
                        className="font-bold text-[#0284c7] hover:underline break-all"
                      >
                        regulacao@tsb.com.br
                      </a>
                    </p>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                    <div className="w-5 h-5 rounded bg-slate-200 text-[#0a2540] font-bold text-[11px] flex items-center justify-center font-display">
                      4
                    </div>
                    <h5 className="font-bold text-xs text-[#0a2540]">
                      Aguardar Resposta (20 dias)
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      A TSB autua o pedido, gera o protocolo formal e emitirá o parecer fundamentado
                      em até 20 dias úteis (Art. 10 da Res. ANP nº 11/2016).
                    </p>
                  </div>
                </div>
              </div>

              {/* ITEM 2: CONSULTA DE PROTOCOLO E SLA */}
              <div
                id="secao-consulta-protocolo-vii"
                className="p-5 sm:p-6 bg-slate-50/70 border border-slate-200 rounded-lg space-y-3"
              >
                <h3 className="text-sm font-bold text-[#0a2540] flex items-center gap-2">
                  <Search className="h-4 w-4 text-[#0284c7]" />
                  Consulta Pública de Protocolo, SLA e Parecer Fundamentado
                </h3>
                <p className="text-xs text-slate-600">
                  Acompanhe o andamento regulatório da sua manifestação técnica pelo número de
                  protocolo gerado.
                </p>

                <form onSubmit={handleVerificarSLA} className="flex gap-2 max-w-xl">
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
                    className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    {consultandoSLA ? 'Buscando...' : 'Verificar Protocolo'}
                  </Button>
                </form>

                {/* RESULTADO DA CONSULTA */}
                {resultadoConsulta && resultadoConsulta.buscado && (
                  <div className="animate-fade-in pt-2">
                    {resultadoConsulta.encontrado && resultadoConsulta.dados ? (
                      <div className="p-4 bg-white border border-slate-200 rounded-lg text-slate-800 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-bold text-sm flex items-center gap-1.5 text-[#0a2540]">
                            <CheckCircle2 className="h-4 w-4 text-[#0284c7]" />
                            Protocolo: {resultadoConsulta.dados.protocolo}
                          </span>
                          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            SLA Restante: {resultadoConsulta.dados.sla_dias} Dias Úteis
                          </span>
                        </div>

                        <div className="text-xs space-y-1.5 text-emerald-900/90 pt-1 border-t border-emerald-200">
                          <div>
                            <strong>Modalidade:</strong> {resultadoConsulta.dados.modalidade}
                          </div>
                          <div>
                            <strong>Pontos Regulatórios:</strong>{' '}
                            {resultadoConsulta.dados.ponto_recebimento || 'Paso de Los Libres'}{' '}
                            &rarr;{' '}
                            {resultadoConsulta.dados.ponto_entrega || 'Triunfo (Polo Petroquímico)'}
                          </div>
                          <div>
                            <strong>Instalação / Trecho:</strong> {resultadoConsulta.dados.trecho}
                          </div>
                          <div>
                            <strong>Capacidade Solicitada:</strong>{' '}
                            {resultadoConsulta.dados.capacidade.toLocaleString('pt-BR')} m³/dia
                          </div>
                          {resultadoConsulta.dados.periodo && (
                            <div>
                              <strong>Período Requisitado:</strong>{' '}
                              {resultadoConsulta.dados.periodo}
                            </div>
                          )}
                          <div>
                            <strong>Status Regulatório:</strong>{' '}
                            <span className="font-semibold text-slate-900">
                              {resultadoConsulta.dados.status}
                            </span>
                          </div>

                          {resultadoConsulta.dados.garantias_seguranca_swap && (
                            <div className="text-slate-700">
                              <strong>Garantias de Segurança (Swap):</strong>{' '}
                              {resultadoConsulta.dados.garantias_seguranca_swap}
                            </div>
                          )}

                          {/* PARECER FUNDAMENTADO E DETALHAMENTO DO DESFECHO (SEM DADOS PESSOAIS) */}
                          {resultadoConsulta.dados.parecer_fundamentado && (
                            <div className="mt-3 p-3.5 bg-slate-50 rounded border border-slate-200 space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="font-bold text-[#0a2540] block">
                                  Parecer Técnico-Regulatório Fundamentado (Art. 10, Res. 11/2016):
                                </span>
                                {resultadoConsulta.dados.desfecho_tipo && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0a2540] text-white">
                                    {resultadoConsulta.dados.desfecho_tipo === 'CONFIRMACAO' &&
                                      'Desfecho I - Confirmação'}
                                    {resultadoConsulta.dados.desfecho_tipo === 'APROFUNDAMENTO' &&
                                      'Desfecho II - Aprofundamento'}
                                    {resultadoConsulta.dados.desfecho_tipo === 'NEGATIVA' &&
                                      'Desfecho III - Negativa'}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-700 leading-relaxed italic">
                                &quot;{resultadoConsulta.dados.parecer_fundamentado}&quot;
                              </p>

                              {/* Termos e condições do Desfecho I */}
                              {resultadoConsulta.dados.termos_condicoes && (
                                <div className="p-2.5 bg-white rounded border border-slate-200 text-[11px] text-slate-700">
                                  <strong>Termos e Condições do Atendimento:</strong>{' '}
                                  {resultadoConsulta.dados.termos_condicoes}
                                </div>
                              )}

                              {/* Condições, escopo, cronograma e custos do Desfecho II */}
                              {(resultadoConsulta.dados.aprofundamento_condicoes ||
                                resultadoConsulta.dados.aprofundamento_cronograma) && (
                                <div className="p-2.5 bg-white rounded border border-slate-200 text-[11px] text-slate-700 space-y-1">
                                  <strong>
                                    Detalhamento do Aprofundamento da Análise (Art. 10, §2º, II):
                                  </strong>
                                  {resultadoConsulta.dados.aprofundamento_condicoes && (
                                    <div>
                                      • <strong>Condições:</strong>{' '}
                                      {resultadoConsulta.dados.aprofundamento_condicoes}
                                    </div>
                                  )}
                                  {resultadoConsulta.dados.aprofundamento_escopo && (
                                    <div>
                                      • <strong>Escopo:</strong>{' '}
                                      {resultadoConsulta.dados.aprofundamento_escopo}
                                    </div>
                                  )}
                                  {resultadoConsulta.dados.aprofundamento_cronograma && (
                                    <div>
                                      • <strong>Cronograma:</strong>{' '}
                                      {resultadoConsulta.dados.aprofundamento_cronograma}
                                    </div>
                                  )}
                                  {resultadoConsulta.dados.aprofundamento_custos && (
                                    <div>
                                      • <strong>Custos:</strong>{' '}
                                      {resultadoConsulta.dados.aprofundamento_custos}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Previsão de disponibilidade do Desfecho III */}
                              {resultadoConsulta.dados.previsao_disponibilidade && (
                                <div className="p-2.5 bg-white rounded border border-slate-200 text-[11px] text-slate-700">
                                  <strong>
                                    Previsão de Disponibilidade do Serviço (Art. 10, §2º, III):
                                  </strong>{' '}
                                  {resultadoConsulta.dados.previsao_disponibilidade}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 space-y-1 flex items-start gap-2">
                        <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <strong className="block font-semibold text-slate-900">
                            Protocolo não localizado no sistema TSB.
                          </strong>
                          <span className="text-slate-600">
                            Verifique o número informado. A solicitação é formalizada pelo
                            formulário-padrão TSB (PDF) enviado ao canal oficial
                            regulacao@tsb.com.br.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* =====================================================================
                  PADRÃO TBG: RESUMOS DO INCISO VII PUBLICADOS EM PDF ESTÁTICO
                  SUBSTITUIÇÃO DAS TABELAS VIVAS PÚBLICAS POR CARDS DE DOCUMENTO OFICIAL
                  ===================================================================== */}
              <div className="space-y-4">
                <div className="space-y-1 pb-2 border-b border-slate-200">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 uppercase tracking-wider font-display">
                      Art. 9º, VII • Resolução ANP nº 11/2016
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Padrão TBG • Publicação em Documento Estático (PDF)
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0a2540] flex items-center gap-2 font-display">
                    <ShieldCheck className="h-4 w-4 text-[#0284c7]" />
                    Resumos Oficiais de Solicitações e Demanda por Instalação (PDF)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
                    Em conformidade com a prática regulatória do setor e o Art. 9º, VII da Resolução
                    ANP nº 11/2016, a TSB consolida periodicamente as solicitações de acesso e a
                    demanda por trecho dutoviário em relatórios oficiais estáticos, garantindo a
                    transparência pública e a confidencialidade preconizada pela LGPD.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CARD 1: RESUMO DAS SOLICITAÇÕES POR PONTO RELEVANTE EM PDF */}
                  {(() => {
                    const itemDoc = incisosBdMap.get('resumo_solicitacoes_vii_pdf')
                    const doc = resolverUrlDocumento(itemDoc, itemDoc?.url_externa || '')
                    const dataAtualizacao = itemDoc?.updated
                      ? new Date(itemDoc.updated).toLocaleDateString('pt-BR')
                      : null
                    const dataReferencia = itemDoc?.periodo || null

                    return (
                      <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-lg shadow-xs flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0a2540] text-white">
                              Art. 9º, VII • Pontos Relevantes
                            </span>
                            {dataReferencia && (
                              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                Ref.: {dataReferencia}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-[#0a2540]">
                            {itemDoc?.titulo ||
                              'Resumo Público das Solicitações por Ponto Relevante'}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed text-justify">
                            {itemDoc?.descricao ||
                              'Documento consolidado com a relação anônima e agregada das solicitações de acesso por ponto relevante de recebimento e entrega, em conformidade com o Art. 9º, VII da Resolução ANP nº 11/2016 e as diretrizes da LGPD.'}
                          </p>
                          <div className="text-[11px] text-slate-500 pt-1">
                            {dataAtualizacao ? (
                              <span>Última atualização: {dataAtualizacao}</span>
                            ) : (
                              <span className="italic">
                                Atualização periódica pela equipe da TSB
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          {doc.url ? (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-medium transition-colors shadow-xs"
                            >
                              <FileDown className="h-4 w-4 text-slate-300" />
                              {doc.nomeExibicao || 'Baixar Resumo em PDF'}
                            </a>
                          ) : (
                            <div className="p-3 text-center bg-slate-50 border border-slate-200 rounded text-xs text-slate-500">
                              <span className="font-semibold block text-slate-700">
                                Ainda não há documento publicado.
                              </span>
                              <span>
                                O demonstrativo de solicitações em PDF será publicado pela equipe da
                                TSB.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* CARD 2: RESUMO DA DEMANDA POR INSTALAÇÃO DE TRANSPORTE (TRECHOS 1 E 3) */}
                  {(() => {
                    const itemDoc = incisosBdMap.get('resumo_demandas_trechos_vii_pdf')
                    const doc = resolverUrlDocumento(itemDoc, itemDoc?.url_externa || '')
                    const dataAtualizacao = itemDoc?.updated
                      ? new Date(itemDoc.updated).toLocaleDateString('pt-BR')
                      : null
                    const dataReferencia = itemDoc?.periodo || null

                    return (
                      <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-lg shadow-xs flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0a2540] text-white">
                              Art. 9º, VII • Trechos 1 e 3
                            </span>
                            {dataReferencia && (
                              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                Ref.: {dataReferencia}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-[#0a2540]">
                            {itemDoc?.titulo || 'Resumo da Demanda por Instalação de Transporte'}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed text-justify">
                            {itemDoc?.descricao ||
                              'Demonstrativo consolidado em PDF da capacidade demandada por instalação dutoviária (Trecho 1: Uruguaiana-Triunfo e Trecho 3: Polo Petroquímico), atualizado pela equipe técnica da TSB.'}
                          </p>
                          <div className="text-[11px] text-slate-500 pt-1">
                            {dataAtualizacao ? (
                              <span>Última atualização: {dataAtualizacao}</span>
                            ) : (
                              <span className="italic">
                                Atualização periódica pela equipe da TSB
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          {doc.url ? (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-medium transition-colors shadow-xs"
                            >
                              <FileDown className="h-4 w-4 text-slate-300" />
                              {doc.nomeExibicao || 'Baixar Demanda Trechos 1 e 3 (PDF)'}
                            </a>
                          ) : (
                            <div className="p-3 text-center bg-slate-50 border border-slate-200 rounded text-xs text-slate-500">
                              <span className="font-semibold block text-slate-700">
                                Ainda não há documento publicado.
                              </span>
                              <span>O relatório por trecho será publicado pela equipe da TSB.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* MECANISMO DISCRETO DE RETORNO À TABELA CONSOLIDADA */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-xs text-slate-600">
                <button
                  type="button"
                  onClick={() => setSubAba('i_vi')}
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0a2540] font-medium transition-colors cursor-pointer"
                >
                  &larr; Voltar para a tabela de Documentos e Estudos (Incisos I a VIII)
                </button>
                <button
                  type="button"
                  onClick={() => setSubAba('viii')}
                  className="inline-flex items-center gap-1.5 text-[#0284c7] hover:underline font-medium transition-colors cursor-pointer"
                >
                  Ir para Inciso VIII (Ofertas de Cessão) &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              SUB-ABA 3: INCISO VIII (MODELO MISTO OFICIAL TSB)
              ======================================================== */}
          {subAba === 'viii' && (
            <div className="space-y-6">
              {/* NOVO MODELO MISTO: CARD DE DOWNLOAD DO FORMULÁRIO-PADRÃO + INSTRUÇÕES DE ENVIO */}
              <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-lg space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#0a2540] text-white font-display">
                        Inciso VIII • Modelo Regulatório TSB
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        Resolução ANP nº 11/2016 • Art. 9º, VIII • Art. 10
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#0a2540] flex items-center gap-2 font-display">
                      <FileDown className="h-5 w-5 text-[#0284c7]" />
                      Inciso VIII — Formulário-Padrão TSB para Comunicação de Cessão de Capacidade
                    </h3>
                    <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                      Em cumprimento estrito às exigências regulatórias do{' '}
                      <strong>Art. 9º, Inciso VIII</strong> da ANP, a comunicação de cessão é feita
                      mediante formulário-padrão assinado pelo representante legal, enviado ao canal
                      oficial da TSB; após verificação da conformidade regulatória pela equipe
                      técnica, a oferta é publicada neste resumo oficial.
                    </p>
                  </div>

                  <div className="shrink-0 flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleBaixarFormularioPdf}
                      disabled={gerandoPdfCessao}
                      className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-medium h-9 px-4 shadow-xs inline-flex items-center gap-2 cursor-pointer"
                    >
                      <FileDown className={`h-4 w-4 ${gerandoPdfCessao ? 'animate-bounce' : ''}`} />
                      {gerandoPdfCessao ? 'Gerando PDF Oficial...' : 'Baixar Formulário (PDF)'}
                    </Button>
                  </div>
                </div>

                {/* PASSO A PASSO REGULATÓRIO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200 text-xs">
                  <div className="bg-white p-3 rounded-md border border-slate-200 space-y-1">
                    <div className="font-bold text-[#0a2540] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-slate-100 text-slate-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                        1
                      </span>
                      <span>Baixe e Preencha</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Faça o download do formulário oficial em PDF e preencha as características da
                      cessão (modalidade, trecho, capacidade e período).
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-md border border-slate-200 space-y-1">
                    <div className="font-bold text-[#0a2540] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-slate-100 text-slate-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                        2
                      </span>
                      <span>Assine e Envie por E-mail</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Assine com carimbo ou certificado digital (Gov.br/ICP) e envie para:{' '}
                      <a
                        href={`mailto:${emailRecebimentoCessoes}`}
                        className="font-bold text-[#0284c7] hover:underline"
                      >
                        {emailRecebimentoCessoes}
                      </a>
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-md border border-slate-200 space-y-1">
                    <div className="font-bold text-[#0a2540] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-slate-100 text-slate-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                        3
                      </span>
                      <span>Publicação Regulamentar</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      A TSB valida os dados operacionais e publica a oferta no resumo abaixo,
                      resguardando os dados de contato sob sigilo da LGPD.
                    </p>
                  </div>
                </div>
              </div>

              {/* =====================================================================
                  PADRÃO TBG: RESUMO DO INCISO VIII PUBLICADO EM PDF ESTÁTICO
                  SUBSTITUIÇÃO DA TABELA VIVA PÚBLICA POR CARD DE DOCUMENTO OFICIAL
                  ===================================================================== */}
              <div className="space-y-4">
                <div className="space-y-1 pb-2 border-b border-slate-200">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 uppercase tracking-wider font-display">
                      Art. 9º, VIII • Resolução ANP nº 11/2016
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Padrão TBG • Publicação em Documento Estático (PDF)
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0a2540] flex items-center gap-2 font-display">
                    <ShieldCheck className="h-4 w-4 text-[#0284c7]" />
                    Resumo Público das Ofertas Ativas de Cessão de Capacidade (PDF)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
                    A TSB publica o resumo consolidado das ofertas ativas de cessão de capacidade
                    contratada informadas por carregadores, após análise de conformidade técnica e
                    operacional. A publicação é realizada no padrão de documento estático,
                    assegurando o sigilo comercial e as regras de proteção de dados (LGPD).
                  </p>
                </div>

                {(() => {
                  const itemDoc = incisosBdMap.get('resumo_cessoes_viii_pdf')
                  const doc = resolverUrlDocumento(itemDoc, itemDoc?.url_externa || '')
                  const dataAtualizacao = itemDoc?.updated
                    ? new Date(itemDoc.updated).toLocaleDateString('pt-BR')
                    : null
                  const dataReferencia = itemDoc?.periodo || null

                  return (
                    <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-lg shadow-xs space-y-4 max-w-2xl">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0a2540] text-white">
                            Documento Oficial • Inciso VIII
                          </span>
                          {dataReferencia && (
                            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              Período de Referência: {dataReferencia}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm sm:text-base text-[#0a2540]">
                          {itemDoc?.titulo || 'Ofertas Ativas de Cessão de Capacidade Contratada'}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed text-justify">
                          {itemDoc?.descricao ||
                            'Publicação oficial das ofertas ativas de capacidade ociosa informadas por carregadores à TSB, elaborada e atualizada manualmente após verificação de conformidade regulatória (Art. 9º, VIII da Resolução ANP nº 11/2016).'}
                        </p>
                        <div className="text-[11px] text-slate-500 pt-1">
                          {dataAtualizacao ? (
                            <span>Última atualização: {dataAtualizacao}</span>
                          ) : (
                            <span className="italic">
                              Atualização periódica pela equipe técnica da TSB
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        {doc.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-medium transition-colors shadow-xs"
                          >
                            <FileDown className="h-4 w-4 text-slate-300" />
                            {doc.nomeExibicao || 'Baixar Resumo de Ofertas Ativas (PDF)'}
                          </a>
                        ) : (
                          <div className="p-4 text-center bg-slate-50 border border-slate-200 rounded text-xs text-slate-500">
                            <span className="font-semibold block text-slate-700">
                              Ainda não há ofertas ativas publicadas.
                            </span>
                            <span>
                              Quando houver ofertas ativas comunicadas e validadas, o documento
                              oficial em PDF será disponibilizado aqui.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* MECANISMO DISCRETO DE RETORNO À TABELA CONSOLIDADA */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-xs text-slate-600">
                <button
                  type="button"
                  onClick={() => setSubAba('i_vi')}
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0a2540] font-medium transition-colors cursor-pointer"
                >
                  &larr; Voltar para a tabela de Documentos e Estudos (Incisos I a VIII)
                </button>
                <button
                  type="button"
                  onClick={() => setSubAba('vii')}
                  className="inline-flex items-center gap-1.5 text-[#0284c7] hover:underline font-medium transition-colors cursor-pointer"
                >
                  Ir para Inciso VII (Solicitação de Acesso) &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
