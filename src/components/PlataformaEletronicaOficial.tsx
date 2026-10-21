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
        emailDestino: emailRecebimentoCessoes,
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
              Resolução ANP nº 11/2016 • Art. 9º
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 font-display">
                <Layers className="h-6 w-6 sm:h-7 sm:w-7 text-sky-300" />
                {headerPlataformaTopo.titulo}
              </h1>
              {headerPlataformaTopo.descricao && (
                <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-3xl leading-relaxed">
                  {headerPlataformaTopo.url_externa ? (
                    <a
                      href={headerPlataformaTopo.url_externa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#38bdf8] hover:text-white underline inline-flex items-center gap-1 font-medium transition-colors"
                    >
                      {headerPlataformaTopo.descricao}
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ) : (
                    headerPlataformaTopo.descricao
                  )}
                </p>
              )}
            </div>
            {(() => {
              if (!headerPlataformaTopo.item) return null
              const doc = resolverUrlDocumento(headerPlataformaTopo.item, '')
              if (!doc.url) return null
              return (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-semibold shrink-0 transition-colors border border-white/20 self-start"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  {doc.nomeExibicao || 'Anexo da Plataforma'}
                </a>
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
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#0a1d37] text-white font-semibold font-display">
                    <tr>
                      <th className="p-3 w-16 text-center border-r border-slate-700/60 tracking-wider uppercase text-[11px]">
                        Inciso
                      </th>
                      <th className="p-3 w-3/5 sm:w-2/3 border-r border-slate-700/60 tracking-wider uppercase text-[11px]">
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
                            <span className="font-semibold text-[#0a2540]">
                              {item?.titulo ||
                                'III - Capacidade disponível, capacidade em fluxo oposto ao fluxo físico e capacidade ociosa por ponto relevante.'}
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
                            className="text-[11px] font-semibold text-[#059669] hover:underline inline-flex items-center gap-1"
                          >
                            &rarr; Abrir modelo oficial (PDF) e consulta regulatória
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          onClick={() => setSubAba('vii')}
                          className="bg-[#059669] hover:bg-[#047857] text-white text-[11px] h-7 px-3 font-semibold inline-flex items-center gap-1.5"
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
                            className="text-[11px] font-semibold text-[#0284c7] hover:underline inline-flex items-center gap-1"
                          >
                            &rarr; Ver resumo de ofertas e baixar formulário-padrão (PDF)
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          onClick={() => setSubAba('viii')}
                          className="bg-[#0284c7] hover:bg-[#0369a1] text-white text-[11px] h-7 px-3 font-semibold inline-flex items-center gap-1.5"
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
              SUB-ABA 2: INCISO VII (MODELO MISTO OFICIAL TSB)
              ======================================================== */}
          {subAba === 'vii' && (
            <div className="space-y-8">
              {/* ITEM 1 (PONTO DE ENTRADA DO CARREGADOR): MODELO MISTO OFICIAL TSB (Art. 9º, VII e Art. 10 da Res. ANP 11/2016) */}
              <div className="p-6 sm:p-7 bg-white border-2 border-[#1b4d96]/30 rounded-xl shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e30613] text-white uppercase tracking-wider font-display">
                        Inciso VII • Modelo Regulatório TSB
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Resolução ANP nº 11/2016 • Art. 9º, VII • Art. 10
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#0a1d37] font-display">
                      Inciso VII — Solicitação de Acesso Firme, Interruptível ou Troca Operacional
                      (Swap)
                    </h3>
                    <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                      Em cumprimento estrito às exigências regulatórias do{' '}
                      <strong>Art. 9º, Inciso VII</strong> e do <strong>Art. 10</strong> da ANP e
                      aos protocolos de segurança da informação e LGPD, a formalização de
                      solicitações de acesso à capacidade de transporte da TSB adota o modelo misto:
                      download do formulário oficial padronizado, assinatura física ou digital pelo
                      representante legal e envio ao canal corporativo oficial.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={handleBaixarFormularioAcessoPdf}
                    disabled={gerandoPdfAcesso}
                    className="bg-[#0a1d37] hover:bg-[#1b4d96] text-white font-bold text-xs sm:text-sm px-5 py-6 shrink-0 shadow-md flex items-center gap-2 font-display"
                  >
                    <Download className="h-4 w-4 text-sky-400" />
                    {gerandoPdfAcesso
                      ? 'Gerando Formulário PDF...'
                      : 'Baixar Formulário Oficial (PDF)'}
                  </Button>
                </div>

                {/* FLUXO DIDÁTICO EM 4 PASSOS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="w-7 h-7 rounded-full bg-[#0a1d37] text-white font-bold text-xs flex items-center justify-center font-display">
                      1
                    </div>
                    <h4 className="font-bold text-xs text-[#0a1d37]">Baixar o Formulário</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Faça o download do modelo oficial da TSB contendo os campos técnicos exigidos
                      pelo Art. 10 (modalidade, pontos de injeção/retirada, capacidade e período).
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="w-7 h-7 rounded-full bg-[#1b4d96] text-white font-bold text-xs flex items-center justify-center font-display">
                      2
                    </div>
                    <h4 className="font-bold text-xs text-[#0a1d37]">Preencher &amp; Assinar</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Preencha os dados cadastrais da empresa e obtenha a assinatura do
                      representante legal habilitado (assinatura com carimbo ou digital
                      ICP-Brasil/Gov.br).
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="w-7 h-7 rounded-full bg-[#0284c7] text-white font-bold text-xs flex items-center justify-center font-display">
                      3
                    </div>
                    <h4 className="font-bold text-xs text-[#0a1d37]">Enviar por E-mail</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Envie o documento assinado em anexo para o canal corporativo oficial de
                      recebimento:{' '}
                      <strong className="text-[#0a1d37] break-all">
                        {emailRecebimentoCessoes}
                      </strong>
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                    <div className="w-7 h-7 rounded-full bg-[#15803d] text-white font-bold text-xs flex items-center justify-center font-display">
                      4
                    </div>
                    <h4 className="font-bold text-xs text-[#15803d]">
                      Protocolo &amp; SLA 20 Dias
                    </h4>
                    <p className="text-[11px] text-emerald-900 leading-relaxed">
                      A TSB cadastra a solicitação no sistema, emite o número oficial de protocolo
                      com confirmação por e-mail e inicia a contagem do prazo regulatório de 20 dias
                      úteis.
                    </p>
                  </div>
                </div>

                {/* NOTA DE CONFORMIDADE LGPD E SIGILO */}
                <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-md flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#0284c7] shrink-0 mt-0.5" />
                  <div className="text-xs text-sky-950 leading-relaxed">
                    <strong>Privacidade e Sigilo Regulatório (LGPD):</strong> Os dados cadastrais,
                    representantes legais e informações comerciais constantes do formulário são de
                    uso estrito e confidencial da transportadora. As publicações exigidas pelo Art.
                    9º, Inciso VII na Plataforma Eletrônica são divulgadas exclusivamente sob forma
                    agregada por ponto relevante e trecho de transporte, garantindo o anonimato dos
                    solicitantes.
                  </div>
                </div>
              </div>

              {/* ITEM 2: CONSULTA DE PROTOCOLO E SLA */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                <h3 className="text-base font-bold text-[#0a2540] flex items-center gap-2">
                  <Search className="h-4 w-4 text-[#0284c7]" />
                  Consulta Pública de Protocolo, SLA e Parecer Fundamentado
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
                    {consultandoSLA ? 'Buscando...' : 'Verificar Protocolo'}
                  </Button>
                </form>

                {/* RESULTADO DA CONSULTA */}
                {resultadoConsulta && resultadoConsulta.buscado && (
                  <div className="animate-fade-in pt-2">
                    {resultadoConsulta.encontrado && resultadoConsulta.dados ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-bold text-sm flex items-center gap-1.5 text-emerald-800">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Protocolo: {resultadoConsulta.dados.protocolo}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#dcfce7] text-[#15803d] border border-emerald-300">
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
                            <span className="font-semibold text-emerald-900">
                              {resultadoConsulta.dados.status}
                            </span>
                          </div>

                          {resultadoConsulta.dados.garantias_seguranca_swap && (
                            <div className="text-purple-900">
                              <strong>Garantias de Segurança (Swap):</strong>{' '}
                              {resultadoConsulta.dados.garantias_seguranca_swap}
                            </div>
                          )}

                          {/* PARECER FUNDAMENTADO E DETALHAMENTO DO DESFECHO (SEM DADOS PESSOAIS) */}
                          {resultadoConsulta.dados.parecer_fundamentado && (
                            <div className="mt-3 p-3.5 bg-white/90 rounded border border-emerald-300 space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="font-bold text-emerald-950 block">
                                  Parecer Técnico-Regulatório Fundamentado (Art. 10, Res. 11/2016):
                                </span>
                                {resultadoConsulta.dados.desfecho_tipo && (
                                  <Badge className="bg-[#0a2540] text-white text-[10px]">
                                    {resultadoConsulta.dados.desfecho_tipo === 'CONFIRMACAO' &&
                                      'Desfecho I - Confirmação'}
                                    {resultadoConsulta.dados.desfecho_tipo === 'APROFUNDAMENTO' &&
                                      'Desfecho II - Aprofundamento'}
                                    {resultadoConsulta.dados.desfecho_tipo === 'NEGATIVA' &&
                                      'Desfecho III - Negativa'}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-slate-800 leading-relaxed italic">
                                &quot;{resultadoConsulta.dados.parecer_fundamentado}&quot;
                              </p>

                              {/* Termos e condições do Desfecho I */}
                              {resultadoConsulta.dados.termos_condicoes && (
                                <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 text-[11px] text-emerald-950">
                                  <strong>Termos e Condições do Atendimento:</strong>{' '}
                                  {resultadoConsulta.dados.termos_condicoes}
                                </div>
                              )}

                              {/* Condições, escopo, cronograma e custos do Desfecho II */}
                              {(resultadoConsulta.dados.aprofundamento_condicoes ||
                                resultadoConsulta.dados.aprofundamento_cronograma) && (
                                <div className="p-2.5 bg-sky-50 rounded border border-sky-200 text-[11px] text-sky-950 space-y-1">
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
                                <div className="p-2.5 bg-red-50 rounded border border-red-200 text-[11px] text-red-950">
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
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-900 space-y-1 flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <strong className="block font-semibold">
                            Protocolo não localizado no sistema TSB.
                          </strong>
                          <span>
                            Verifique o número informado. A solicitação é feita pelo
                            formulário-padrão TSB (PDF) enviado ao canal oficial{' '}
                            {emailRecebimentoCessoes}.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ITEM 3: RESUMO PÚBLICO DAS SOLICITAÇÕES POR PONTO RELEVANTE (ART. 9º, VII) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-[#0a2540] flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#059669]" />
                      Resumo Público das Solicitações por Ponto Relevante (Art. 9º, VII)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Agregação pública e anônima em estrita conformidade com a LGPD e Art. 9º, VII
                      da Resolução ANP nº 11/2016.
                    </p>
                  </div>
                  {carregarResumoVII && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={carregarResumoVII}
                      disabled={carregandoResumoVII}
                      className="text-xs text-slate-700 h-8 self-start sm:self-auto bg-white"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 mr-1.5 ${carregandoResumoVII ? 'animate-spin' : ''}`}
                      />
                      Atualizar Resumo
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#0a2540] text-white font-semibold font-display">
                      <tr>
                        <th className="p-3 border-r border-slate-700/60">Ponto de Recebimento</th>
                        <th className="p-3 border-r border-slate-700/60">Ponto de Entrega</th>
                        <th className="p-3 border-r border-slate-700/60">Instalação / Trecho</th>
                        <th className="p-3 border-r border-slate-700/60">Modalidade</th>
                        <th className="p-3 text-center border-r border-slate-700/60">
                          Total Solicitações
                        </th>
                        <th className="p-3 text-right border-r border-slate-700/60">
                          Capacidade Solicitada (m³/dia)
                        </th>
                        <th className="p-3 border-r border-slate-700/60">Períodos Demandados</th>
                        <th className="p-3 text-center">Status Predominante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {resumoPublicoVII && resumoPublicoVII.length > 0 ? (
                        resumoPublicoVII.map((item, idx) => (
                          <tr
                            key={`${item.pontoRelevante}_${item.modalidade}_${idx}`}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="p-3 font-semibold text-slate-800">
                              {item.pontoRecebimento}
                            </td>
                            <td className="p-3 font-semibold text-slate-800">
                              {item.pontoEntrega}
                            </td>
                            <td className="p-3 text-slate-700">{item.trecho}</td>
                            <td className="p-3">
                              <span className="inline-block text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                                {item.modalidade}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-800">
                              {item.totalSolicitacoes}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              {item.capacidadeTotalSolicitada.toLocaleString('pt-BR')}
                            </td>
                            <td className="p-3 text-slate-600 text-[11px]">
                              {item.periodosDemandados && item.periodosDemandados.length > 0
                                ? item.periodosDemandados.join(', ')
                                : '—'}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                                {item.statusPredominante}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500">
                            {carregandoResumoVII ? (
                              <div className="flex items-center justify-center gap-2">
                                <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                                <span>
                                  Carregando resumo de solicitações por ponto relevante...
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-700">
                                  Nenhuma solicitação registrada no momento.
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  As solicitações de acesso protocoladas junto à TSB serão agrupadas
                                  e publicadas nesta seção preservando a LGPD.
                                </p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ITEM 4: RESUMO DA DEMANDA POR INSTALAÇÃO DE TRANSPORTE (TRECHOS 1 E 3) */}
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-[#0a2540] flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#143b73]" />
                    Resumo da Demanda por Instalação de Transporte (Trechos 1 e 3)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Consolidação da capacidade total solicitada e modalidades demandadas
                    discriminadas por gasoduto integrante do sistema TSB.
                  </p>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#0a2540] text-white font-semibold font-display">
                      <tr>
                        <th className="p-3 border-r border-slate-700/60">
                          Instalação de Transporte
                        </th>
                        <th className="p-3 border-r border-slate-700/60">
                          Descrição Técnica da Instalação
                        </th>
                        <th className="p-3 text-center border-r border-slate-700/60">
                          Total Solicitações
                        </th>
                        <th className="p-3 text-right border-r border-slate-700/60">
                          Capacidade Total Solicitada (m³/dia)
                        </th>
                        <th className="p-3 border-r border-slate-700/60">Modalidades Presentes</th>
                        <th className="p-3 border-r border-slate-700/60">Períodos Demandados</th>
                        <th className="p-3 text-center">Status Predominante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {resumoInstalacaoVII && resumoInstalacaoVII.length > 0 ? (
                        resumoInstalacaoVII.map((inst, idx) => (
                          <tr
                            key={`${inst.instalacao}_${idx}`}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="p-3 font-bold text-[#0a2540]">{inst.instalacao}</td>
                            <td className="p-3 text-slate-700">{inst.descricaoInstalacao}</td>
                            <td className="p-3 text-center font-mono font-bold text-slate-800">
                              {inst.totalSolicitacoes}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              {inst.capacidadeTotalSolicitada.toLocaleString('pt-BR')}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {inst.modalidadesPresentes &&
                                inst.modalidadesPresentes.length > 0 ? (
                                  inst.modalidadesPresentes.map((mod, mIdx) => (
                                    <span
                                      key={mIdx}
                                      className="inline-block text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-medium"
                                    >
                                      {mod}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-slate-600 text-[11px]">
                              {inst.periodosDemandados && inst.periodosDemandados.length > 0
                                ? inst.periodosDemandados.join(', ')
                                : '—'}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                                {inst.statusPredominante}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            {carregandoResumoVII ? (
                              <div className="flex items-center justify-center gap-2">
                                <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                                <span>Carregando resumo por instalação de transporte...</span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-700">
                                  Nenhuma solicitação registrada no momento.
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  A consolidação por instalação de transporte (Trechos 1 e 3) será
                                  exibida após o recebimento de solicitações.
                                </p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MECANISMO DISCRETO DE RETORNO À TABELA CONSOLIDADA */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-xs text-slate-600">
                <button
                  type="button"
                  onClick={() => setSubAba('i_vi')}
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0a1d37] font-semibold transition-colors"
                >
                  &larr; Voltar para a tabela de Documentos e Estudos (Incisos I a VIII)
                </button>
                <button
                  type="button"
                  onClick={() => setSubAba('viii')}
                  className="inline-flex items-center gap-1.5 text-[#0284c7] hover:text-[#0369a1] font-semibold transition-colors"
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
              <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 rounded-lg space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#0a1d37] text-white font-display">
                        Inciso VIII • Modelo Regulatório TSB
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Resolução ANP nº 11/2016 • Art. 9º, VIII • Art. 10
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#0a1d37] flex items-center gap-2 font-display">
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
                      className="bg-[#0a1d37] hover:bg-[#143b73] text-white text-xs font-semibold h-9 px-4 shadow-sm inline-flex items-center gap-2 border border-slate-700"
                    >
                      <FileDown className={`h-4 w-4 ${gerandoPdfCessao ? 'animate-bounce' : ''}`} />
                      {gerandoPdfCessao ? 'Gerando PDF Oficial...' : 'Baixar Formulário (PDF)'}
                    </Button>
                  </div>
                </div>

                {/* PASSO A PASSO REGULATÓRIO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80 text-xs">
                  <div className="bg-white p-3 rounded-md border border-slate-200 space-y-1">
                    <div className="font-bold text-[#0a1d37] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-[#0284c7] font-bold text-[11px] flex items-center justify-center shrink-0">
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
                    <div className="font-bold text-[#0a1d37] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#059669] font-bold text-[11px] flex items-center justify-center shrink-0">
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
                    <div className="font-bold text-[#0a1d37] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1b4d96] font-bold text-[11px] flex items-center justify-center shrink-0">
                        3
                      </span>
                      <span>Publicação Automatizada</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      A TSB valida os dados operacionais e publica a oferta no resumo abaixo,
                      resguardando os dados de contato sob sigilo da LGPD.
                    </p>
                  </div>
                </div>
              </div>

              {/* TABELA PÚBLICA DE OFERTAS ATIVAS DE CESSÃO DE CAPACIDADE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-[#0a2540] flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#059669]" />
                      Ofertas Ativas de Cessão de Capacidade (Resumo Público)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Exibição restrita a dados técnico-operacionais (LGPD). Apenas ofertas
                      aprovadas e publicadas pela TSB.
                    </p>
                  </div>
                  {carregarOfertasCessao && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={carregarOfertasCessao}
                      disabled={carregandoCessoes}
                      className="text-xs text-slate-700 h-8 self-start sm:self-auto bg-white"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 mr-1.5 ${carregandoCessoes ? 'animate-spin' : ''}`}
                      />
                      Atualizar Resumo
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#0a2540] text-white font-semibold font-display">
                      <tr>
                        <th className="p-3 border-r border-slate-700/60">Referência</th>
                        <th className="p-3 border-r border-slate-700/60">Carregador Cedente</th>
                        <th className="p-3 border-r border-slate-700/60">Trecho / Instalação</th>
                        <th className="p-3 text-right border-r border-slate-700/60">
                          Capacidade Ociosa
                        </th>
                        <th className="p-3 border-r border-slate-700/60">Período Ofertado</th>
                        <th className="p-3 text-center">Status Operacional</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {ofertasCessao.length > 0 ? (
                        ofertasCessao.map((oferta) => (
                          <tr key={oferta.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-mono font-bold text-[#0a2540]">
                              {oferta.referencia ||
                                `CES-${oferta.id.substring(0, 8).toUpperCase()}`}
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-800">{oferta.cedente}</div>
                              {oferta.modalidade && (
                                <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-medium">
                                  {oferta.modalidade}
                                </span>
                              )}
                              {oferta.observacoes && (
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {oferta.observacoes}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-slate-700">
                              <div className="font-medium">{oferta.trecho}</div>
                              {(oferta.ponto_recebimento || oferta.ponto_entrega) && (
                                <div className="text-[10px] text-slate-500">
                                  {oferta.ponto_recebimento || 'Recebimento Conforme Contrato'}{' '}
                                  &rarr; {oferta.ponto_entrega || 'Entrega Conforme Contrato'}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              {oferta.capacidade_ociosa.toLocaleString('pt-BR')} m³/dia
                            </td>
                            <td className="p-3 text-slate-700">{oferta.periodo_contratual}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {oferta.status || 'Disponível'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            {carregandoCessoes ? (
                              <div className="flex items-center justify-center gap-2">
                                <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                                <span>Carregando ofertas de cessão publicadas...</span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-700">
                                  Nenhuma oferta ativa de cessão publicada no momento.
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Carregadores interessados em ceder capacidade podem utilizar o
                                  formulário-padrão acima para submissão à TSB.
                                </p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MECANISMO DISCRETO DE RETORNO À TABELA CONSOLIDADA */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-xs text-slate-600">
                <button
                  type="button"
                  onClick={() => setSubAba('i_vi')}
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0a1d37] font-semibold transition-colors"
                >
                  &larr; Voltar para a tabela de Documentos e Estudos (Incisos I a VIII)
                </button>
                <button
                  type="button"
                  onClick={() => setSubAba('vii')}
                  className="inline-flex items-center gap-1.5 text-[#059669] hover:text-[#047857] font-semibold transition-colors"
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
