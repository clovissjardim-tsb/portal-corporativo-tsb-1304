import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  FileText,
  FileDown,
  Search,
  ExternalLink,
  Calendar,
  Layers,
  Wrench,
  Gauge,
  Building2,
  FileCheck2,
  Info,
  CheckCircle2,
  ChevronRight,
  Filter,
  Eye,
} from 'lucide-react'

interface BoletimEletronicoProps {
  // Filtros compartilhados / controlados
  filtroDataDiaria: string
  setFiltroDataDiaria: (val: string) => void
  filtroPontoDiaria: string
  setFiltroPontoDiaria: (val: string) => void
  filtroDiariaAplicado: { data: string; ponto: string }
  handleFiltrarDiaria: (e: React.FormEvent) => void
  linhasDiariaFiltradas: Array<{
    ponto: string
    tipo: string
    contratada: string
    programado: string
    realizado: string
    pressao: string
  }>
  filtroAnoMensal: string
  setFiltroAnoMensal: (val: string) => void
  filtroMesMensal: string
  setFiltroMesMensal: (val: string) => void
}

// Histórico oficial de relatórios de quantidades programadas e realizadas (Trechos 1 e 3)
const HISTORICO_QUANTIDADES_OFICIAL = [
  {
    titulo: 'Quantidades programadas e realizadas nos pontos de recepção e entrega - Setembro/2026',
    mes: 'Setembro',
    ano: '2026',
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/10/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Setembro26-1.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Setembro26.pdf',
  },
  {
    titulo: 'Quantidades programadas e realizadas nos pontos de recepção e entrega - Agosto/2026',
    mes: 'Agosto',
    ano: '2026',
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/09/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Agosto26-2.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Agosto26.pdf',
  },
  {
    titulo: 'Quantidades programadas e realizadas nos pontos de recepção e entrega - Julho/2026',
    mes: 'Julho',
    ano: '2026',
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/08/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Julho26-2.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Julho26.pdf',
  },
  {
    titulo: 'Quantidades programadas e realizadas nos pontos de recepção e entrega - Junho/2026',
    mes: 'Junho',
    ano: '2026',
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/07/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Junho26-1.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Junho26.pdf',
  },
  {
    titulo: 'Quantidades programadas e realizadas nos pontos de recepção e entrega - Maio/2026',
    mes: 'Maio',
    ano: '2026',
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/06/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Maio26.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Maio26.pdf',
  },
  {
    titulo: 'Quantidades programadas e realizadas nos pontos de recepção e entrega - Abril/2026',
    mes: 'Abril',
    ano: '2026',
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/05/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Abril26.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Abril26.pdf',
  },
  {
    titulo: 'Quantidades programadas e realizadas nos pontos de recepção e entrega - Março/2026',
    mes: 'Março',
    ano: '2026',
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/04/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Marco26.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Marco26.pdf',
  },
  {
    titulo:
      'Quantidades programadas e realizadas nos pontos de recepção e entrega - Fevereiro/2026',
    mes: 'Fevereiro',
    ano: '2026',
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/03/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Fevereiro26.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Fevereiro26.pdf',
  },
  {
    titulo: 'Quantidades programadas e realizadas nos pontos de recepção e entrega - Janeiro/2026',
    mes: 'Janeiro',
    ano: '2026',
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/02/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Janeiro26.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Janeiro26.pdf',
  },
  {
    titulo: 'Quantidades programadas e realizadas nos pontos de recepção e entrega - Dezembro/2025',
    mes: 'Dezembro',
    ano: '2025',
    url: 'https://www.tsb.com.br/wp-content/uploads/2026/01/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Dezembro25.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Dezembro25.pdf',
  },
  {
    titulo: 'Quantidades programadas e realizadas nos pontos de recepção e entrega - Novembro/2025',
    mes: 'Novembro',
    ano: '2025',
    url: 'https://www.tsb.com.br/wp-content/uploads/2025/12/Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Novembro25.pdf',
    nomeArquivo: 'Art_2o_Alinea-I_Item_h-quantidades-programadas-e-realizadas_Novembro25.pdf',
  },
]

export default function BoletimEletronico({
  filtroDataDiaria,
  setFiltroDataDiaria,
  filtroPontoDiaria,
  setFiltroPontoDiaria,
  filtroDiariaAplicado,
  handleFiltrarDiaria,
  linhasDiariaFiltradas,
  filtroAnoMensal,
  setFiltroAnoMensal,
  filtroMesMensal,
  setFiltroMesMensal,
}: BoletimEletronicoProps) {
  const { toast } = useToast()

  // Busca na tabela II (Pesquisar)
  const [buscaTabelaII, setBuscaTabelaII] = useState('')

  // Controle de expansão das tabelas detalhadas do protótipo
  const [detalhesItemH, setDetalhesItemH] = useState(true)
  const [detalhesContratos, setDetalhesContratos] = useState(true)
  const [detalhesQualidade, setDetalhesQualidade] = useState(true)
  const [detalhesManutencoes, setDetalhesManutencoes] = useState(true)

  // Filtragem dos arquivos da Seção II
  const arquivosTabelaIIFiltrados = HISTORICO_QUANTIDADES_OFICIAL.filter((item) => {
    if (!buscaTabelaII.trim()) return true
    const termo = buscaTabelaII.toLowerCase()
    return (
      item.titulo.toLowerCase().includes(termo) ||
      item.mes.toLowerCase().includes(termo) ||
      item.ano.toLowerCase().includes(termo)
    )
  })

  const baixarArquivoSimulado = (nome: string, urlOficial?: string) => {
    toast({
      title: 'Download de Documento Regulatório',
      description: `Arquivo: ${nome}. Link oficial da TSB disponível para consulta.`,
    })
    if (urlOficial) {
      window.open(urlOficial, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* CARD PRINCIPAL DO BOLETIM NO FORMATO OFICIAL DA TSB */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        {/* CABEÇALHO DO FORMATO OFICIAL TSB */}
        <div className="bg-[#0a2540] text-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#38bdf8]">
              Portal TSB • Regulação &amp; Acesso Público
            </span>
            <Badge className="bg-[#0284c7] hover:bg-[#0284c7] text-white border-0 text-xs px-3 py-1">
              Portaria ANP nº 1/2003 • Art. 2º
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Boletim Eletrônico
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
            Estabelece os procedimentos para o envio das informações referentes às atividades de
            transporte e de compra e venda de gás natural ao mercado, aos Carregadores e à Agência
            Nacional do Petróleo - ANP.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-10">
          {/* SEÇÃO DESTAQUE: MODELO DE CONTRATO MASTER DE TRANSPORTE FIRME */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#0a2540]">
                Modelo de Contrato Master de Transporte Firme para períodos de curto prazo e anuais
              </h3>
              <div className="w-full h-px bg-slate-200 mt-2 mb-3" />
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Estabelece os procedimentos para o envio das informações referentes às atividades de
                transporte e de compra e venda de gás natural ao mercado, aos Carregadores e à
                Agência Nacional do Petróleo - ANP.
              </p>
            </div>

            {/* TABELA PADRÃO TSB: NOME DO DOCUMENTO | ARQUIVO */}
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#0a2540] text-white font-semibold">
                  <tr>
                    <th className="p-3 w-3/4 sm:w-4/5 border-r border-slate-700/60">
                      Nome do Documento
                    </th>
                    <th className="p-3 w-1/4 sm:w-1/5 text-center">Arquivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-800 font-medium">
                      Modelo de Contrato Master de Transporte Firme para períodos de curto prazo e
                      anuais
                    </td>
                    <td className="p-3 text-center">
                      <a
                        href="https://www.tsb.com.br/wp-content/uploads/2025/03/CONTRATO-MASTER-TSB-2025-2029.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        Baixar Arquivo
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SEÇÃO I: INSTALAÇÕES DE TRANSPORTE E SERVIÇOS PRESTADOS */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#0a2540]">
                I - Instalações de Transporte e Serviços Prestados, atualizadas permanentemente
              </h3>
              <div className="w-full h-px bg-slate-200 mt-2" />
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-md shadow-xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#0a2540] text-white font-semibold">
                  <tr>
                    <th className="p-3 w-3/4 sm:w-4/5 border-r border-slate-700/60">
                      Nome do Documento
                    </th>
                    <th className="p-3 w-1/4 sm:w-1/5 text-center">Arquivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {/* a) */}
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-800">
                      <span className="font-semibold text-[#0a2540]">a)</span> Termos e condições
                      gerais de prestação de serviço
                    </td>
                    <td className="p-3 text-center">
                      <a
                        href="https://www.tsb.com.br/wp-content/uploads/2023/08/Termos-e-Condicoes-do-Contrato-Extraor.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                      >
                        - Baixar Arquivo
                      </a>
                    </td>
                  </tr>

                  {/* b) */}
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-800">
                      <span className="font-semibold text-[#0a2540]">b)</span> Modelo de contrato
                      para cada tipo de serviço
                    </td>
                    <td className="p-3 text-center">
                      <a
                        href="https://www.tsb.com.br/wp-content/uploads/2025/03/CONTRATO-MASTER-TSB-2025-2029.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                      >
                        - Baixar Arquivo
                      </a>
                    </td>
                  </tr>

                  {/* c) */}
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-800">
                      <span className="font-semibold text-[#0a2540]">c)</span> Modelo de acordo de
                      conexão
                    </td>
                    <td className="p-3 text-center">
                      <a
                        href="https://www.tsb.com.br/wp-content/uploads/2023/04/bibArq000435.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                      >
                        - Baixar Arquivo
                      </a>
                    </td>
                  </tr>

                  {/* d) */}
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-800">
                      <span className="font-semibold text-[#0a2540]">d)</span> Modelo de Acordo
                      Operativo de alocação das quantidades de gás nas estações de entrega
                    </td>
                    <td className="p-3 text-center">
                      <a
                        href="https://www.tsb.com.br/wp-content/uploads/2023/04/bibArq000436.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                      >
                        - Baixar Arquivo
                      </a>
                    </td>
                  </tr>

                  {/* e) */}
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-800">
                      <span className="font-semibold text-[#0a2540]">e)</span> Mapa atualizado das
                      instalações de transporte
                    </td>
                    <td className="p-3 text-center">
                      <a
                        href="https://www.tsb.com.br/wp-content/uploads/2023/04/bibArq000437.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                      >
                        - Baixar Arquivo
                      </a>
                    </td>
                  </tr>

                  {/* f) */}
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-800">
                      <span className="font-semibold text-[#0a2540]">f)</span> Características
                      Físicas e Capacidade Máxima das Instalações de Transporte, nas melhores
                      condições operacionais
                    </td>
                    <td className="p-3 text-center space-y-1">
                      <div>
                        <a
                          href="https://www.tsb.com.br/wp-content/uploads/2024/10/bol_ele_-I.f-_caracteristicas-.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                        >
                          - Características
                        </a>
                      </div>
                      <div>
                        <a
                          href="https://www.tsb.com.br/wp-content/uploads/2024/10/bol_ele_item-I.f_-fluxos-fisicos.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                        >
                          - Fluxos Físicos do Gás Natural
                        </a>
                      </div>
                    </td>
                  </tr>

                  {/* g) */}
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-800">
                      <span className="font-semibold text-[#0a2540]">g)</span> Capacidade Disponível
                      para Prestação de Novos Serviços de Transporte Firme nas melhores condições
                      operacionais
                    </td>
                    <td className="p-3 text-center">
                      <a
                        href="https://www.tsb.com.br/wp-content/uploads/2024/10/bol_elet_I_g-cap-disponivel.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                      >
                        - Baixar Arquivo
                      </a>
                    </td>
                  </tr>

                  {/* h) */}
                  <tr className="bg-sky-50/40 hover:bg-sky-50 transition-colors">
                    <td className="p-3 text-slate-800">
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-[#0a2540]">h)</span>
                        <div>
                          <span>
                            Quantidades Programadas e Realizadas de Gás nos pontos de recepção e
                            entrega (dados diários, referentes ao mês anterior) -{' '}
                          </span>
                          <strong className="text-[#0a2540]">
                            Consultar Tabela no item &quot;Quantidades realizadas de gás nos pontos
                            de recepção e entrega&quot; constante no final dessa página
                          </strong>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-400">-</td>
                  </tr>

                  {/* i) */}
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-800">
                      <span className="font-semibold text-[#0a2540]">i)</span> Interrupções e
                      Reduções de Capacidade, atuais e planejadas, no sistema
                    </td>
                    <td className="p-3 text-center">
                      <a
                        href="https://www.tsb.com.br/wp-content/uploads/2023/04/bibArq000440.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                      >
                        - Baixar Arquivo
                      </a>
                    </td>
                  </tr>

                  {/* j) */}
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-800">
                      <span className="font-semibold text-[#0a2540]">j)</span> Ampliações Planejadas
                    </td>
                    <td className="p-3 text-center">
                      <a
                        href="https://www.tsb.com.br/wp-content/uploads/2023/08/Ampliacoes-Planejadas.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                      >
                        - Baixar Arquivo
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SEÇÃO II: QUANTIDADES PROGRAMADAS E REALIZADAS NOS TRECHOS 1 E 3 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#0a2540]">
                II - Quantidades Programadas e realizadas nos Trechos 1 e 3
              </h3>
              <div className="w-full h-px bg-slate-200 mt-2 mb-3" />
            </div>

            {/* BARRA DE PESQUISA EXATAMENTE COMO NA PÁGINA TSB */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-md border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Search className="h-4 w-4 text-[#0284c7]" />
                <span>Pesquisar publicações de quantidades:</span>
              </div>
              <div className="relative w-full sm:w-72">
                <Input
                  type="text"
                  placeholder="Pesquisar..."
                  value={buscaTabelaII}
                  onChange={(e) => setBuscaTabelaII(e.target.value)}
                  className="h-8 text-xs bg-white pl-8 border-slate-300 focus-visible:ring-[#0284c7]"
                />
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* TABELA DE ARQUIVOS HISTÓRICOS */}
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#0a2540] text-white font-semibold">
                  <tr>
                    <th className="p-3 w-3/4 sm:w-4/5 border-r border-slate-700/60">
                      Documento / Mês de Referência (Trechos 1 e 3)
                    </th>
                    <th className="p-3 w-1/4 sm:w-1/5 text-center">Arquivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {arquivosTabelaIIFiltrados.length > 0 ? (
                    arquivosTabelaIIFiltrados.map((item) => (
                      <tr key={item.titulo} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-800 font-medium">{item.titulo}</td>
                        <td className="p-3 text-center">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline"
                          >
                            - Baixar Arquivo
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="p-4 text-center text-slate-500">
                        Nenhum arquivo encontrado para &quot;{buscaTabelaII}&quot;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAINEL REGULATÓRIO INTEGRADO: DADOS DIÁRIOS E DEMAIS CONFORMIDADES DA PORTARIA ANP 1/2003 */}
          <div className="pt-4 border-t border-slate-200 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0a2540] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
                  Quantidades realizadas de gás nos pontos de recepção e entrega (Portaria ANP nº
                  1/2003)
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Painel de consulta interativa aos registros diários, contratos celebrados, paradas
                  programadas e boletim de qualidade química do gás da TSB.
                </p>
              </div>
              <Badge className="bg-slate-100 text-[#0a2540] border border-slate-300">
                Dados Operacionais &amp; Contratuais
              </Badge>
            </div>

            {/* SELETORES DE EXIBIÇÃO EM FORMA DE BOTÕES DE SEÇÃO */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDetalhesItemH(!detalhesItemH)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  detalhesItemH
                    ? 'border-[#0284c7] bg-[#f0f9ff] text-[#0a2540] shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#0284c7]">
                  Item h / Art. 2º
                </div>
                <div className="text-xs font-semibold mt-0.5">Programação Diária</div>
                <div className="text-[10px] text-slate-500 mt-1">Volumes por ponto operacional</div>
              </button>

              <button
                type="button"
                onClick={() => setDetalhesContratos(!detalhesContratos)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  detalhesContratos
                    ? 'border-[#0284c7] bg-[#f0f9ff] text-[#0a2540] shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#0284c7]">
                  Item b / Art. 2º
                </div>
                <div className="text-xs font-semibold mt-0.5">Contratos Vigentes</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Carregadores, tarifas e vínculos
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDetalhesQualidade(!detalhesQualidade)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  detalhesQualidade
                    ? 'border-[#0284c7] bg-[#f0f9ff] text-[#0a2540] shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#0284c7]">
                  Res. ANP 16/2008
                </div>
                <div className="text-xs font-semibold mt-0.5">Qualidade do Gás</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Cromatografia contínua (PCS, C1)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDetalhesManutencoes(!detalhesManutencoes)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  detalhesManutencoes
                    ? 'border-[#0284c7] bg-[#f0f9ff] text-[#0a2540] shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#0284c7]">
                  Item i / Art. 2º
                </div>
                <div className="text-xs font-semibold mt-0.5">Manutenções</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Interrupções e reduções de rede
                </div>
              </button>
            </div>

            {/* BLOCO 1: PROGRAMAÇÃO DIÁRIA (ITEM H) */}
            {detalhesItemH && (
              <div className="p-4 sm:p-5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-[#0a2540]">
                      Tabela Operacional Diária — Pontos de Recepção e Entrega (Item h)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Dados diários operacionais nos trechos Uruguaiana e Triunfo (em conformidade
                      com o Art. 2º, I, h)
                    </p>
                  </div>
                  <Badge className="bg-[#0a2540] text-white text-[11px]">Item I.h</Badge>
                </div>

                {/* FILTROS DA TABELA DIÁRIA */}
                <form
                  onSubmit={handleFiltrarDiaria}
                  className="p-3 bg-white border border-slate-200 rounded-md grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
                >
                  <div className="space-y-1">
                    <Label htmlFor="dataDiaria" className="text-xs font-semibold text-slate-700">
                      Data da Operação
                    </Label>
                    <Input
                      id="dataDiaria"
                      type="date"
                      value={filtroDataDiaria}
                      onChange={(e) => setFiltroDataDiaria(e.target.value)}
                      className="text-xs bg-white h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="pontoDiaria" className="text-xs font-semibold text-slate-700">
                      Ponto de Recepção / Entrega
                    </Label>
                    <select
                      id="pontoDiaria"
                      value={filtroPontoDiaria}
                      onChange={(e) => setFiltroPontoDiaria(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                    >
                      <option value="Todos os Pontos">Todos os Pontos</option>
                      <option value="EMED Uruguaiana (Recepção)">EMED Uruguaiana (Recepção)</option>
                      <option value="EMED Triunfo (Entrega)">EMED Triunfo (Entrega)</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#0a2540] hover:bg-[#13395e] text-white text-xs font-semibold h-8"
                  >
                    Filtrar Programação
                  </Button>
                </form>

                {/* TABELA DE VOLUMES DIÁRIOS */}
                <div className="overflow-x-auto border border-slate-200 rounded-md bg-white">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#0a2540] text-white font-semibold border-b border-slate-700">
                      <tr>
                        <th className="p-2.5">Ponto Operacional</th>
                        <th className="p-2.5">Tipo de Ponto</th>
                        <th className="p-2.5 text-right">Capacidade Contratada (m³/dia)</th>
                        <th className="p-2.5 text-right">Volume Programado (m³/dia)</th>
                        <th className="p-2.5 text-right">Volume Realizado (m³/dia)</th>
                        <th className="p-2.5 text-right">Pressão Média (kgf/cm²)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {linhasDiariaFiltradas.length > 0 ? (
                        linhasDiariaFiltradas.map((l) => (
                          <tr key={l.ponto} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 font-semibold text-[#0a2540]">{l.ponto}</td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  l.tipo === 'Recepção'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {l.tipo}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono">{l.contratada}</td>
                            <td className="p-2.5 text-right font-mono">{l.programado}</td>
                            <td className="p-2.5 text-right font-mono font-medium text-slate-800">
                              {l.realizado}
                            </td>
                            <td className="p-2.5 text-right font-mono">{l.pressao}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-500">
                            Nenhum ponto operacional encontrado para os filtros selecionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>
                    Volume expresso em m³ padrão nas condições de referência (20 °C, 1 atm).
                  </span>
                  <span className="font-semibold text-slate-700">
                    Filtro ativo: {filtroDiariaAplicado.data} ({filtroDiariaAplicado.ponto})
                  </span>
                </div>
              </div>
            )}

            {/* BLOCO 2: CONTRATOS DE SERVIÇO DE TRANSPORTE (ITEM B / ART. 2º) */}
            {detalhesContratos && (
              <div className="p-4 sm:p-5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-[#0a2540]">
                      Contratos de Serviço de Transporte Celebrados e Vigentes
                    </h4>
                    <p className="text-xs text-slate-500">
                      Relação de carregadores, modalidades de contratação, prazos, tarifas e
                      vínculos societários (Portaria ANP nº 1/2003, Art. 2º)
                    </p>
                  </div>
                  <Badge className="bg-[#0284c7] text-white text-[11px]">Item I.b</Badge>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-md bg-white">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#0a2540] text-white font-semibold border-b border-slate-700">
                      <tr>
                        <th className="p-2.5">Carregador</th>
                        <th className="p-2.5">Tipo de Serviço</th>
                        <th className="p-2.5">Início</th>
                        <th className="p-2.5">Término</th>
                        <th className="p-2.5 text-right">Evolução Capacidade (m³/dia)</th>
                        <th className="p-2.5 text-right">Tarifa / Desconto</th>
                        <th className="p-2.5 text-center">Relação Acionária</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-semibold text-[#0a2540]">
                          Carregador A — Gás Sul Distribuição S.A.
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Firme Ordinário
                          </span>
                        </td>
                        <td className="p-2.5 font-mono">01/01/2024</td>
                        <td className="p-2.5 font-mono">31/12/2028</td>
                        <td className="p-2.5 text-right font-mono">
                          <div>2024-2025: 1.800.000</div>
                          <div className="text-slate-500 text-[11px]">2026-2028: 2.200.000</div>
                        </td>
                        <td className="p-2.5 text-right font-mono">
                          <div className="font-semibold text-slate-800">R$ 0,4250 / m³</div>
                          <div className="text-[11px] text-emerald-700">
                            Tarifa ANP (sem desconto)
                          </div>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                            Sem vínculo societário
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-semibold text-[#0a2540]">
                          Carregador B — Comercializadora Pampa S.A.
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Interruptível
                          </span>
                        </td>
                        <td className="p-2.5 font-mono">01/06/2025</td>
                        <td className="p-2.5 font-mono">31/05/2027</td>
                        <td className="p-2.5 text-right font-mono">
                          <div>Até 600.000 (ociosa)</div>
                        </td>
                        <td className="p-2.5 text-right font-mono">
                          <div className="font-semibold text-slate-800">R$ 0,3825 / m³</div>
                          <div className="text-[11px] text-sky-700">Desconto sazonal: 10%</div>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                            Sem vínculo societário
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-semibold text-[#0a2540]">
                          Carregador C — Térmica Fronteira Oeste Ltda.
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            Serviço de Curto Prazo (POCC)
                          </span>
                        </td>
                        <td className="p-2.5 font-mono">01/01/2026</td>
                        <td className="p-2.5 font-mono">31/12/2026</td>
                        <td className="p-2.5 text-right font-mono">
                          <div>400.000</div>
                        </td>
                        <td className="p-2.5 text-right font-mono">
                          <div className="font-semibold text-slate-800">R$ 0,4420 / m³</div>
                          <div className="text-[11px] text-slate-500">
                            Tarifa Curto Prazo (Res. 961)
                          </div>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            Acionista minoritário (5%)
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BLOCO 3: QUALIDADE DO GÁS NATURAL (RESOLUÇÃO ANP 16/2008) */}
            {detalhesQualidade && (
              <div className="p-4 sm:p-5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-[#0a2540]">
                      Qualidade do Gás Natural — Cromatografia Contínua em Linha
                    </h4>
                    <p className="text-xs text-slate-500">
                      Valores médios apurados nas Estações de Medição da TSB comparados aos limites
                      da Resolução ANP nº 16/2008
                    </p>
                  </div>
                  <Badge className="bg-emerald-700 text-white text-[11px]">Res. ANP 16/2008</Badge>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-md bg-white">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#0a2540] text-white font-semibold border-b border-slate-700">
                      <tr>
                        <th className="p-2.5">Componente / Parâmetro</th>
                        <th className="p-2.5">Unidade</th>
                        <th className="p-2.5 text-right">Valor Médio Apurado</th>
                        <th className="p-2.5 text-right">Especificação ANP (Res. 16/2008)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-semibold text-[#0a2540]">
                          Poder Calorífico Superior (PCS)
                        </td>
                        <td className="p-2.5 text-slate-600">kcal/m³</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          9.450
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-600">
                          8.800 a 10.200
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-semibold text-[#0a2540]">Metano (C1)</td>
                        <td className="p-2.5 text-slate-600">% mol</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          88,50
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-600">Mín. 85,0</td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-semibold text-[#0a2540]">
                          Dióxido de Carbono (CO2)
                        </td>
                        <td className="p-2.5 text-slate-600">% mol</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          1,20
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-600">Máx. 3,0</td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-semibold text-[#0a2540]">Inertes Totais</td>
                        <td className="p-2.5 text-slate-600">% mol</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          2,10
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-600">Máx. 5,0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BLOCO 4: MANUTENÇÕES PROGRAMADAS (ITEM I / ART. 2º) */}
            {detalhesManutencoes && (
              <div className="p-4 sm:p-5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-[#0a2540]">
                      Interrupções e Reduções de Capacidade Programadas (Item i)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Cronograma de paradas para manutenção preventiva com aviso regulatório aos
                      carregadores
                    </p>
                  </div>
                  <Badge className="bg-amber-600 text-white text-[11px]">Item I.i</Badge>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-md bg-white">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#0a2540] text-white font-semibold border-b border-slate-700">
                      <tr>
                        <th className="p-2.5">Trecho / Instalação</th>
                        <th className="p-2.5">Data Início</th>
                        <th className="p-2.5">Data Fim</th>
                        <th className="p-2.5">Impacto na Capacidade</th>
                        <th className="p-2.5">Descrição do Serviço</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-semibold text-[#0a2540]">
                          EMED Uruguaiana - Filtros de Entrada
                        </td>
                        <td className="p-2.5">15/10/2026</td>
                        <td className="p-2.5">16/10/2026</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#fef3c7] text-[#b45309] border border-amber-200">
                            Redução de 10%
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-700">
                          Inspeção periódica e troca de elementos filtrantes.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
