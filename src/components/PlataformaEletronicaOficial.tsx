import React from 'react'
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
} from 'lucide-react'
import type { SolicitacaoIncisoVII, ResumoPublicoSolicitacao } from '@/services/solicitacoes'
import type { OfertaCessaoIncisoVIII } from '@/services/cessoes'

export interface PlataformaEletronicaProps {
  // Sub-abas
  subAba: 'i_vi' | 'vii' | 'viii'
  setSubAba: (aba: 'i_vi' | 'vii' | 'viii') => void

  // Inciso VII
  formVII: {
    razao_social: string
    cnpj: string
    email: string
    modalidade: '' | 'Firme Ordinário' | 'Interruptível'
    capacidade: string
    trecho: string
    periodo: string
  }
  setFormVII: React.Dispatch<
    React.SetStateAction<{
      razao_social: string
      cnpj: string
      email: string
      modalidade: '' | 'Firme Ordinário' | 'Interruptível'
      capacidade: string
      trecho: string
      periodo: string
    }>
  >
  submetendoVII: boolean
  erroFormVII: string | null
  handleSubmeterVII: (e: React.FormEvent) => void

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
  carregandoResumoVII: boolean
  carregarResumoVII: () => void

  // Inciso VIII
  ofertasCessao: OfertaCessaoIncisoVIII[]
  carregandoCessoes: boolean
  carregarOfertasCessao: () => void
  mostrarFormCessao: boolean
  setMostrarFormCessao: (val: boolean) => void
  formCessao: {
    cedente: string
    trecho: string
    capacidade_ociosa: string
    periodo_contratual: string
    contato: string
    observacoes: string
  }
  setFormCessao: React.Dispatch<
    React.SetStateAction<{
      cedente: string
      trecho: string
      capacidade_ociosa: string
      periodo_contratual: string
      contato: string
      observacoes: string
    }>
  >
  submetendoCessao: boolean
  erroFormCessao: string | null
  handleSubmeterCessao: (e: React.FormEvent) => void
}

export default function PlataformaEletronica({
  subAba,
  setSubAba,
  formVII,
  setFormVII,
  submetendoVII,
  erroFormVII,
  handleSubmeterVII,
  consultaProtocolo,
  setConsultaProtocolo,
  consultandoSLA,
  handleVerificarSLA,
  resultadoConsulta,
  resumoPublicoVII,
  carregandoResumoVII,
  carregarResumoVII,
  ofertasCessao,
  carregandoCessoes,
  mostrarFormCessao,
  setMostrarFormCessao,
  formCessao,
  setFormCessao,
  submetendoCessao,
  erroFormCessao,
  handleSubmeterCessao,
}: PlataformaEletronicaProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* CARD PRINCIPAL ESPELHANDO ESTRUTURA OFICIAL TSB (IGUAL AO BOLETIM ELETRÔNICO OFICIAL) */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        {/* CABEÇALHO OFICIAL */}
        <div className="bg-[#0a2540] text-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#38bdf8]">
              Portal TSB • Regulação &amp; Acesso Público
            </span>
            <Badge className="bg-[#059669] hover:bg-[#059669] text-white border-0 text-xs px-3 py-1">
              Resolução ANP nº 11/2016 • Art. 9º
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="h-6 w-6 sm:h-7 sm:w-7 text-[#34d399]" />
            Plataforma Eletrônica
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
            <a
              href="https://www.tsb.com.br/wp-content/uploads/2023/08/Artigo-9o-RESOLUCAO-11-2016docx.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#38bdf8] hover:text-white underline inline-flex items-center gap-1 font-medium transition-colors"
            >
              Conforme estabelecido pelo Art. 9º da Resolução ANP nº 11 de 16/03/2016, publicado no
              DOU em 18/03/2016.
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          </p>

          {/* SUB-ABAS / SELETOR DE NAVEGAÇÃO DA PLATAFORMA */}
          <div className="flex flex-wrap gap-2 pt-6 mt-4 border-t border-slate-700/60">
            <button
              type="button"
              onClick={() => setSubAba('i_vi')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                subAba === 'i_vi'
                  ? 'bg-white text-[#0a2540] shadow-sm font-bold'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white'
              }`}
            >
              Incisos I a VI (Documentos &amp; Estudos Regulatórios)
            </button>
            <button
              type="button"
              onClick={() => setSubAba('vii')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                subAba === 'vii'
                  ? 'bg-white text-[#0a2540] shadow-sm font-bold'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white'
              }`}
            >
              Inciso VII (Solicitação de Acesso &amp; Resumo Público)
            </button>
            <button
              type="button"
              onClick={() => setSubAba('viii')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                subAba === 'viii'
                  ? 'bg-white text-[#0a2540] shadow-sm font-bold'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white'
              }`}
            >
              Inciso VIII (Ofertas de Cessão de Capacidade)
            </button>
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
                <h2 className="text-base sm:text-lg font-bold text-[#0a2540]">
                  Exigências Legais do Art. 9º da Resolução ANP nº 11/2016
                </h2>
                <div className="w-full h-px bg-slate-200 mt-2 mb-3" />
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Documentação oficial e estudos técnicos disponibilizados pela Transportadora
                  Sulbrasileira de Gás - TSB em atendimento aos incisos I a VI do Art. 9º da
                  Resolução ANP nº 11/2016. Clique nos botões correspondentes para baixar os
                  arquivos ou consultar os estudos oficiais.
                </p>
              </div>

              {/* TABELA PRINCIPAL NO MESMO PADRÃO DO BOLETIM ELETRÔNICO OFICIAL */}
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#0a2540] text-white font-semibold">
                    <tr>
                      <th className="p-3 w-16 text-center border-r border-slate-700/60">Inciso</th>
                      <th className="p-3 w-3/5 sm:w-2/3 border-r border-slate-700/60">
                        Exigência Legal (Art. 9º, Res. ANP 11/2016)
                      </th>
                      <th className="p-3 w-2/5 sm:w-1/3 text-center">Arquivo / Consulta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {/* INCISO I */}
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center font-bold text-[#0a2540] border-r border-slate-200">
                        I
                      </td>
                      <td className="p-3 text-slate-800 border-r border-slate-200">
                        <span className="font-semibold text-[#0a2540]">I - Fluxo Físico</span>
                      </td>
                      <td className="p-3 text-center">
                        <a
                          href="https://tsb.com.br/wp-content/uploads/2023/04/fluxo_fisico.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                        >
                          <FileDown className="h-3.5 w-3.5" />- Baixar Arquivo
                        </a>
                      </td>
                    </tr>

                    {/* INCISO II */}
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center font-bold text-[#0a2540] border-r border-slate-200">
                        II
                      </td>
                      <td className="p-3 text-slate-800 border-r border-slate-200">
                        <span className="font-semibold text-[#0a2540]">
                          II - Características técnicas e operacionais de Instalação de Transporte
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <a
                          href="https://tsb.com.br/wp-content/uploads/2023/04/bibArq000438-2.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                        >
                          <FileDown className="h-3.5 w-3.5" />- Baixar Arquivo
                        </a>
                      </td>
                    </tr>

                    {/* INCISO III */}
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center font-bold text-[#0a2540] border-r border-slate-200">
                        III
                      </td>
                      <td className="p-3 text-slate-800 border-r border-slate-200">
                        <span className="font-semibold text-[#0a2540]">
                          III - Capacidade disponível, capacidade em fluxo oposto ao fluxo físico e
                          capacidade ociosa por ponto relevante.
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <a
                          href="https://www.tsb.com.br/wp-content/uploads/2023/08/Capacidade-Disponivel-SITE.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                        >
                          <FileDown className="h-3.5 w-3.5" />- Baixar Arquivo
                        </a>
                      </td>
                    </tr>

                    {/* INCISO IV */}
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center font-bold text-[#0a2540] border-r border-slate-200">
                        IV
                      </td>
                      <td className="p-3 text-slate-800 border-r border-slate-200">
                        <span className="font-semibold text-[#0a2540]">
                          IV - Capacidades contratadas por contrato de serviço de transporte
                          celebrado
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <a
                          href="https://www.tsb.com.br/wp-content/uploads/2023/08/Capacidade-gasoduto-A.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                        >
                          <FileDown className="h-3.5 w-3.5" />- Baixar Arquivo
                        </a>
                      </td>
                    </tr>

                    {/* INCISO V */}
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center font-bold text-[#0a2540] border-r border-slate-200">
                        V
                      </td>
                      <td className="p-3 text-slate-800 border-r border-slate-200">
                        <span className="font-semibold text-[#0a2540]">
                          V - Simulação termo-hidráulica
                        </span>
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-600">
                          <a
                            href="https://tsb.com.br/wp-content/uploads/2023/04/RSTH-Trecho-1.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0284c7] hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            <FileDown className="h-3 w-3" />
                            Simulação Trecho 1 (PDF)
                          </a>
                          <span className="text-slate-300">•</span>
                          <a
                            href="https://tsb.com.br/wp-content/uploads/2023/04/RSTH-Trecho-3.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0284c7] hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            <FileDown className="h-3 w-3" />
                            Simulação Trecho 3 (PDF)
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

                    {/* INCISO VI */}
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center font-bold text-[#0a2540] border-r border-slate-200">
                        VI
                      </td>
                      <td className="p-3 text-slate-800 border-r border-slate-200">
                        <span className="font-semibold text-[#0a2540]">
                          VI - Termos e condições tarifárias e não tarifárias
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <a
                          href="https://tsb.com.br/wp-content/uploads/2023/04/termo_de_acesso.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                        >
                          <FileDown className="h-3.5 w-3.5" />- Baixar Arquivo
                        </a>
                      </td>
                    </tr>

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
                            &rarr; Abrir formulário público e resumo regulatório
                          </button>
                          <span className="text-slate-300">•</span>
                          <a
                            href="http://tsb.com.br:8443/Home/Solicitacao"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline inline-flex items-center gap-1"
                          >
                            Sistema legado TSB :8443
                            <ExternalLink className="h-3 w-3" />
                          </a>
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
                            &rarr; Ver painel de ofertas e cadastrar cessão
                          </button>
                          <span className="text-slate-300">•</span>
                          <a
                            href="http://tsb.com.br:8443/Home/Ofertas"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline inline-flex items-center gap-1"
                          >
                            Sistema legado TSB :8443
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          onClick={() => setSubAba('viii')}
                          className="bg-[#0284c7] hover:bg-[#0369a1] text-white text-[11px] h-7 px-3 font-semibold inline-flex items-center gap-1.5"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
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
              SUB-ABA 2: INCISO VII (SISTEMA INTEGRADO + LINK OFICIAL)
              ======================================================== */}
          {subAba === 'vii' && (
            <div className="space-y-8">
              {/* BANNER COM AMPARO LEGAL E LINK AO SISTEMA OFICIAL */}
              <div className="p-4 bg-[#f0fdf4] border-l-4 border-l-[#059669] border border-emerald-200 rounded-r-lg space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[#059669] font-bold text-sm">
                    <Info className="h-4 w-4" />
                    Amparo Legal: Art. 9º, Inciso VII e Art. 10 da Resolução ANP nº 11/2016
                  </div>
                  <a
                    href="http://tsb.com.br:8443/Home/Solicitacao"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline inline-flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded border border-emerald-300"
                  >
                    Acessar sistema oficial alternativo TSB (:8443)
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Envio público e direto sem necessidade de login prévio. Gera protocolo regulatório
                  automático com confirmação via e-mail corporativo (SMTP TSB) e prazo legal de
                  resposta de até 20 dias úteis para manifestação técnica e comercial fundamentada
                  por escrito da transportadora.
                </p>
              </div>

              {/* ITEM 1: RESUMO PÚBLICO DAS SOLICITAÇÕES DE ACESSO (Art. 9º, VII - SEM DADOS PESSOAIS / LGPD) */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#0a2540] flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#059669]" />
                      Resumo Público das Solicitações de Acesso por Ponto Relevante
                    </h3>
                    <p className="text-xs text-slate-500">
                      Publicação agregada e anonimizada da demanda solicitada no sistema (Art. 9º,
                      VII da Resolução ANP nº 11/2016 e conformidade com a LGPD).
                    </p>
                  </div>
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
                    Atualizar
                  </Button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#0a2540] text-white font-semibold">
                      <tr>
                        <th className="p-3 border-r border-slate-700/60">
                          Ponto / Trecho Relevante
                        </th>
                        <th className="p-3 border-r border-slate-700/60">Modalidade</th>
                        <th className="p-3 text-center border-r border-slate-700/60">
                          Nº de Solicitações
                        </th>
                        <th className="p-3 text-right border-r border-slate-700/60">
                          Capacidade Total Demandada (m³/dia)
                        </th>
                        <th className="p-3 border-r border-slate-700/60">
                          Período(s) Requisitado(s)
                        </th>
                        <th className="p-3 text-center">Status Predominante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {resumoPublicoVII.length > 0 ? (
                        resumoPublicoVII.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3">
                              <div className="font-semibold text-[#0a2540]">
                                {item.pontoRelevante}
                              </div>
                              <div className="text-[11px] text-slate-500">{item.trecho}</div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                                {item.modalidade}
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold font-mono">
                              {item.totalSolicitacoes}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              {item.capacidadeTotalSolicitada.toLocaleString('pt-BR')}
                            </td>
                            <td className="p-3 text-slate-700 text-[11px]">
                              {item.periodosDemandados.join(', ')}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                {item.statusPredominante}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-500">
                            {carregandoResumoVII
                              ? 'Consolidando resumo regulatório...'
                              : 'Nenhuma demanda de acesso registrada até o momento.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ITEM 2: FORMULÁRIO DO INCISO VII COM CAMPO PERÍODO (Art. 10, II) */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="text-base font-bold text-[#0a2540] mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#0284c7]" />
                  Formulário de Solicitação de Acesso Firme ou Interruptível (Art. 9º, VII)
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
                      <Label htmlFor="modalidade" className="text-xs font-semibold text-slate-700">
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
                      <Label htmlFor="capacidade" className="text-xs font-semibold text-slate-700">
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
                        <option value="EMED Triunfo -> Polo Petroquímico">
                          EMED Triunfo -&gt; Polo Petroquímico
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* CAMPO PERÍODO OBRIGATÓRIO (Art. 10, Inciso II da Resolução ANP nº 11/2016) */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="periodo"
                      className="text-xs font-semibold text-slate-700 flex items-center justify-between"
                    >
                      <span>Período(s) em que o serviço será requisitado *</span>
                      <span className="text-[10px] text-[#0284c7]">
                        Exigência legal: Art. 10, II da Res. 11/2016
                      </span>
                    </Label>
                    <Input
                      id="periodo"
                      required
                      placeholder="Ex: 01/01/2027 a 31/12/2027 ou Período Safra Out/2026 a Mar/2027"
                      value={formVII.periodo}
                      onChange={(e) => setFormVII({ ...formVII, periodo: e.target.value })}
                      className="text-xs bg-white"
                      disabled={submetendoVII}
                    />
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

              {/* ITEM 3: CONSULTA DE PROTOCOLO E SLA */}
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
                            <strong>Modalidade / Trecho:</strong>{' '}
                            {resultadoConsulta.dados.modalidade} | {resultadoConsulta.dados.trecho}
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

                          {resultadoConsulta.dados.parecer_fundamentado && (
                            <div className="mt-3 p-3 bg-white/80 rounded border border-emerald-300">
                              <span className="font-bold text-emerald-950 block mb-1">
                                Parecer Técnico-Regulatório Fundamentado (Art. 10, Res. 11/2016):
                              </span>
                              <p className="text-slate-800 leading-relaxed italic">
                                &quot;{resultadoConsulta.dados.parecer_fundamentado}&quot;
                              </p>
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

          {/* ========================================================
              SUB-ABA 3: INCISO VIII (SISTEMA INTEGRADO + LINK OFICIAL)
              ======================================================== */}
          {subAba === 'viii' && (
            <div className="space-y-6">
              {/* BANNER COM AMPARO LEGAL E LINK AO SISTEMA OFICIAL */}
              <div className="p-4 bg-[#eff6ff] border-l-4 border-l-[#0284c7] border border-blue-200 rounded-r-lg space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[#0284c7] font-bold text-sm">
                    <Info className="h-4 w-4" />
                    Amparo Legal: Art. 9º, Inciso VIII da Resolução ANP nº 11/2016
                  </div>
                  <a
                    href="http://tsb.com.br:8443/Home/Ofertas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline inline-flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded border border-blue-300"
                  >
                    Acessar sistema oficial alternativo TSB (:8443)
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Mecanismo de divulgação de ofertas de capacidade ociosa para cessão entre
                  carregadores, promovendo o aproveitamento eficiente e secundário da malha
                  dutoviária da TSB. Consulta e cadastro públicos de ofertas.
                </p>
              </div>

              {/* BARRA DE AÇÕES */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-[#0a2540]">
                  Ofertas Ativas de Cessão de Capacidade
                </h3>
                <Button
                  onClick={() => setMostrarFormCessao(!mostrarFormCessao)}
                  className="bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold h-8"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                  {mostrarFormCessao ? 'Fechar Formulário' : 'Publicar Oferta de Cessão'}
                </Button>
              </div>

              {/* FORMULÁRIO PÚBLICO DE COMUNICAÇÃO DE CESSÃO */}
              {mostrarFormCessao && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-4 animate-fade-in">
                  <h4 className="text-sm font-bold text-[#0a2540] flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#0284c7]" />
                    Formulário de Comunicação de Cessão de Capacidade (Inciso VIII)
                  </h4>

                  {erroFormCessao && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span>{erroFormCessao}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmeterCessao} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="cedente" className="text-xs font-semibold text-slate-700">
                          Carregador Cedente *
                        </Label>
                        <Input
                          id="cedente"
                          required
                          placeholder="Ex: Carregador Industrial Sul S.A."
                          value={formCessao.cedente}
                          onChange={(e) =>
                            setFormCessao({ ...formCessao, cedente: e.target.value })
                          }
                          className="text-xs bg-white"
                          disabled={submetendoCessao}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="trechoCessao"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Trecho do Gasoduto *
                        </Label>
                        <select
                          id="trechoCessao"
                          required
                          value={formCessao.trecho}
                          onChange={(e) => setFormCessao({ ...formCessao, trecho: e.target.value })}
                          className="w-full h-9 px-3 rounded-md border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                          disabled={submetendoCessao}
                        >
                          <option value="">Selecione o trecho...</option>
                          <option value="Uruguaiana -> Triunfo">Uruguaiana -&gt; Triunfo</option>
                          <option value="EMED Triunfo -> Polo Petroquímico">
                            EMED Triunfo -&gt; Polo Petroquímico
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="capacidadeCessao"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Capacidade Ociosa (m³/dia) *
                        </Label>
                        <Input
                          id="capacidadeCessao"
                          type="number"
                          min="1"
                          required
                          placeholder="Ex: 25000"
                          value={formCessao.capacidade_ociosa}
                          onChange={(e) =>
                            setFormCessao({ ...formCessao, capacidade_ociosa: e.target.value })
                          }
                          className="text-xs bg-white font-mono"
                          disabled={submetendoCessao}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="periodoCessao"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Período Contratual *
                        </Label>
                        <Input
                          id="periodoCessao"
                          required
                          placeholder="Ex: Nov/2026 a Fev/2027"
                          value={formCessao.periodo_contratual}
                          onChange={(e) =>
                            setFormCessao({ ...formCessao, periodo_contratual: e.target.value })
                          }
                          className="text-xs bg-white"
                          disabled={submetendoCessao}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="contatoCessao"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Contato Comercial *
                        </Label>
                        <Input
                          id="contatoCessao"
                          required
                          placeholder="comercial@empresa.com.br"
                          value={formCessao.contato}
                          onChange={(e) =>
                            setFormCessao({ ...formCessao, contato: e.target.value })
                          }
                          className="text-xs bg-white"
                          disabled={submetendoCessao}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="obsCessao" className="text-xs font-semibold text-slate-700">
                        Observações Adicionais (opcional)
                      </Label>
                      <Input
                        id="obsCessao"
                        placeholder="Ex: Disponibilidade para cessão parcial ou total."
                        value={formCessao.observacoes}
                        onChange={(e) =>
                          setFormCessao({ ...formCessao, observacoes: e.target.value })
                        }
                        className="text-xs bg-white"
                        disabled={submetendoCessao}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setMostrarFormCessao(false)}
                        className="text-xs"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={submetendoCessao}
                        className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold"
                      >
                        {submetendoCessao ? 'Publicando...' : 'Publicar Oferta de Cessão'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* TABELA DE OFERTAS DE CESSÃO */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#0a2540] text-white font-semibold">
                    <tr>
                      <th className="p-3 border-r border-slate-700/60">Carregador Cedente</th>
                      <th className="p-3 border-r border-slate-700/60">Trecho</th>
                      <th className="p-3 text-right border-r border-slate-700/60">
                        Capacidade Ociosa
                      </th>
                      <th className="p-3 border-r border-slate-700/60">Período Contratual</th>
                      <th className="p-3 border-r border-slate-700/60">Contato</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {ofertasCessao.length > 0 ? (
                      ofertasCessao.map((oferta) => (
                        <tr key={oferta.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-[#0a2540]">{oferta.cedente}</div>
                            {oferta.observacoes && (
                              <div className="text-[11px] text-slate-500">{oferta.observacoes}</div>
                            )}
                          </td>
                          <td className="p-3 text-slate-700">{oferta.trecho}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {oferta.capacidade_ociosa.toLocaleString('pt-BR')} m³/dia
                          </td>
                          <td className="p-3 text-slate-700">{oferta.periodo_contratual}</td>
                          <td className="p-3">
                            {oferta.contato.includes('@') ? (
                              <a
                                href={`mailto:${oferta.contato}`}
                                className="text-[#0284c7] font-medium hover:underline"
                              >
                                {oferta.contato}
                              </a>
                            ) : (
                              <span className="text-slate-800">{oferta.contato}</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {oferta.status || 'Disponível'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">
                          {carregandoCessoes
                            ? 'Carregando ofertas de cessão...'
                            : 'Nenhuma oferta de cessão cadastrada no momento.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
