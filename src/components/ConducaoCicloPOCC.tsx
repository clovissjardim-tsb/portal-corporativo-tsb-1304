import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  pocService,
  resolverUrlDocPOC,
  type DocumentoPOCItem,
  type CronogramaEtapaPOC,
  type ManifestacaoInteressePOC,
  type PropostaVinculantePOC,
  type StatusEtapaCronograma,
} from '@/services/poc'
import {
  FileText,
  Clock,
  Send,
  Scale,
  RefreshCw,
  Plus,
  Save,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Upload,
  UserCheck,
  Building2,
  X,
  FileCheck,
  Download,
} from 'lucide-react'

export function ConducaoCicloPOCC() {
  const { toast } = useToast()

  const [subAba, setSubAba] = useState<'cronograma' | 'documentos' | 'manifestacoes' | 'propostas'>(
    'cronograma',
  )

  const [cicloAtual] = useState('2026/2027')
  const [carregando, setCarregando] = useState(true)

  // Dados
  const [etapas, setEtapas] = useState<CronogramaEtapaPOC[]>([])
  const [documentos, setDocumentos] = useState<DocumentoPOCItem[]>([])
  const [manifestacoes, setManifestacoes] = useState<ManifestacaoInteressePOC[]>([])
  const [propostas, setPropostas] = useState<PropostaVinculantePOC[]>([])

  // Modal de edição de documento do POC
  const [modalDocAberto, setModalDocAberto] = useState(false)
  const [docEmEdicao, setDocEmEdicao] = useState<Partial<DocumentoPOCItem> | null>(null)
  const [arquivoDocUpload, setArquivoDocUpload] = useState<File | null>(null)
  const [salvandoDoc, setSalvandoDoc] = useState(false)

  // Modal de deliberação de manifestação
  const [modalManifAberto, setModalManifAberto] = useState(false)
  const [manifSelecionada, setManifSelecionada] = useState<ManifestacaoInteressePOC | null>(null)
  const [statusManifForm, setStatusManifForm] =
    useState<ManifestacaoInteressePOC['status']>('Recebida - Em Análise')
  const [obsManifForm, setObsManifForm] = useState('')
  const [salvandoManif, setSalvandoManif] = useState(false)

  // Modal de deliberação de proposta
  const [modalPropAberto, setModalPropAberto] = useState(false)
  const [propSelecionada, setPropSelecionada] = useState<PropostaVinculantePOC | null>(null)
  const [statusPropForm, setStatusPropForm] =
    useState<PropostaVinculantePOC['status']>('Proposta Recebida')
  const [capAlocadaForm, setCapAlocadaForm] = useState<number>(150000)
  const [parecerPropForm, setParecerPropForm] = useState('')
  const [salvandoProp, setSalvandoProp] = useState(false)

  const carregarDados = useCallback(async () => {
    setCarregando(true)
    try {
      const [crono, docs, manifs, props] = await Promise.all([
        pocService.listarCronograma(cicloAtual),
        pocService.listarTodosDocumentos(cicloAtual),
        pocService.listarTodasManifestacoes(),
        pocService.listarTodasPropostas(),
      ])
      setEtapas(crono)
      setDocumentos(docs)
      setManifestacoes(manifs)
      setPropostas(props)
    } catch (e) {
      console.warn('Erro ao carregar dados do POCC na gestão:', e)
    } finally {
      setCarregando(false)
    }
  }, [cicloAtual])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Salvar status de etapa do cronograma
  const handleAtualizarEtapa = async (
    id: string,
    novoStatus: StatusEtapaCronograma,
    periodoEstimado?: string,
  ) => {
    try {
      const atualizada = await pocService.atualizarStatusEtapa(id, novoStatus, periodoEstimado)
      setEtapas((prev) => prev.map((e) => (e.id === atualizada.id ? atualizada : e)))
      toast({
        title: 'Cronograma Atualizado!',
        description: `Etapa ${atualizada.numero_etapa} atualizada para "${novoStatus}". Refletido no módulo público /poc.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar cronograma.'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    }
  }

  // Abrir modal de criação/edição de documento
  const abrirModalDocumento = (doc?: DocumentoPOCItem) => {
    if (doc) {
      setDocEmEdicao(doc)
    } else {
      setDocEmEdicao({
        ciclo: cicloAtual,
        categoria: 'edital',
        chave: `doc_custom_${Date.now()}`,
        titulo: '',
        descricao: '',
        ordem: documentos.length + 1,
        url_externa: 'https://www.tsb.com.br/poc/',
        nome_arquivo_custom: 'Visualizar Documento',
        ativo: true,
      })
    }
    setArquivoDocUpload(null)
    setModalDocAberto(true)
  }

  // Salvar documento
  const handleSalvarDocumento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docEmEdicao || !docEmEdicao.titulo?.trim()) return

    setSalvandoDoc(true)
    try {
      const salvo = await pocService.salvarDocumento(docEmEdicao.id || '', {
        ciclo: docEmEdicao.ciclo || cicloAtual,
        categoria: docEmEdicao.categoria || 'edital',
        chave: docEmEdicao.chave || `doc_${Date.now()}`,
        titulo: docEmEdicao.titulo.trim(),
        descricao: docEmEdicao.descricao || '',
        ordem: Number(docEmEdicao.ordem ?? 1),
        url_externa: docEmEdicao.url_externa || '',
        nome_arquivo_custom: docEmEdicao.nome_arquivo_custom || '',
        ativo: docEmEdicao.ativo !== false,
        arquivo: arquivoDocUpload,
      })

      setDocumentos((prev) => {
        const idx = prev.findIndex((d) => d.id === salvo.id)
        if (idx >= 0) {
          const copia = [...prev]
          copia[idx] = salvo
          return copia
        }
        return [...prev, salvo]
      })

      toast({
        title: 'Documento do POCC Salvo!',
        description: `Documento "${salvo.titulo}" publicado com sucesso.`,
      })
      setModalDocAberto(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar documento.'
      toast({ title: 'Falha ao salvar', description: msg, variant: 'destructive' })
    } finally {
      setSalvandoDoc(false)
    }
  }

  // Deliberar manifestação
  const handleSalvarDeliberacaoManif = async () => {
    if (!manifSelecionada) return
    setSalvandoManif(true)
    try {
      const atualizada = await pocService.atualizarStatusManifestacao(
        manifSelecionada.id,
        statusManifForm,
        obsManifForm,
      )
      setManifestacoes((prev) => prev.map((m) => (m.id === atualizada.id ? atualizada : m)))
      toast({
        title: 'Manifestação Atualizada!',
        description: `Protocolo ${atualizada.protocolo} atualizado para "${atualizada.status}".`,
      })
      setModalManifAberto(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar manifestação.'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    } finally {
      setSalvandoManif(false)
    }
  }

  // Deliberar proposta
  const handleSalvarDeliberacaoProp = async () => {
    if (!propSelecionada) return
    setSalvandoProp(true)
    try {
      const atualizada = await pocService.atualizarStatusProposta(
        propSelecionada.id,
        statusPropForm,
        Number(capAlocadaForm),
        parecerPropForm,
      )
      setPropostas((prev) => prev.map((p) => (p.id === atualizada.id ? atualizada : p)))
      toast({
        title: 'Proposta Vinculante Deliberada!',
        description: `Protocolo ${atualizada.protocolo}: status atualizado com sucesso.`,
      })
      setModalPropAberto(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao deliberar proposta.'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    } finally {
      setSalvandoProp(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* BANNER GESTÃO POCC */}
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="font-bold text-[#0a2540] text-sm flex items-center gap-1.5">
            <Scale className="h-4 w-4 text-[#0284c7]" />
            Condução do Ciclo POCC — Resolução ANP nº 961/2023 (Arts. 37-A e 38-A)
          </div>
          <p className="text-slate-600">
            Painel interno para gestão das 5 etapas do cronograma, publicação de documentos e
            minutas oficiais, e análise técnica das manifestações e propostas vinculantes.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={carregarDados}
          disabled={carregando}
          className="text-xs text-slate-700 h-8 shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${carregando ? 'animate-spin' : ''}`} />
          Recarregar
        </Button>
      </div>

      {/* SUB-ABAS DA CONDUÇÃO POCC */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setSubAba('cronograma')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            subAba === 'cronograma'
              ? 'bg-[#0a2540] text-white shadow-xs font-bold'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          1. Cronograma das 5 Etapas (Art. 37-A, §5º)
        </button>

        <button
          type="button"
          onClick={() => setSubAba('documentos')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            subAba === 'documentos'
              ? 'bg-[#0a2540] text-white shadow-xs font-bold'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileText className="h-3.5 w-3.5 text-sky-400" />
          2. Documentos &amp; Minutas ({documentos.length})
        </button>

        <button
          type="button"
          onClick={() => setSubAba('manifestacoes')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            subAba === 'manifestacoes'
              ? 'bg-[#0a2540] text-white shadow-xs font-bold'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Send className="h-3.5 w-3.5 text-emerald-400" />
          3. Manifestações de Interesse
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-sky-200 text-[#0a2540] font-bold">
            {manifestacoes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubAba('propostas')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            subAba === 'propostas'
              ? 'bg-[#0a2540] text-white shadow-xs font-bold'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Scale className="h-3.5 w-3.5 text-purple-400" />
          4. Propostas Garantidas Vinculantes
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-200 text-purple-900 font-bold">
            {propostas.length}
          </span>
        </button>
      </div>

      {/* SUB-ABA 1: CRONOGRAMA */}
      {subAba === 'cronograma' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-600 flex items-center justify-between">
            <span>
              Controle a fase ativa do ciclo POCC. As alterações são sincronizadas em tempo real com
              o cronograma exibido publicamente na página <code>/poc</code>.
            </span>
            <span className="font-semibold text-slate-800">Ciclo: {cicloAtual}</span>
          </div>

          <div className="space-y-3">
            {etapas.map((etapa) => (
              <div
                key={etapa.id}
                className="p-4 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0a2540] text-white flex items-center justify-center text-xs font-bold">
                      {etapa.numero_etapa}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{etapa.titulo}</h4>
                      <span className="text-[10px] text-[#0284c7] font-semibold">
                        {etapa.inciso_legal}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor={`st_${etapa.id}`} className="text-[11px] text-slate-500">
                      Status da Etapa:
                    </Label>
                    <select
                      id={`st_${etapa.id}`}
                      value={etapa.status_etapa}
                      onChange={(e) =>
                        handleAtualizarEtapa(
                          etapa.id,
                          e.target.value as StatusEtapaCronograma,
                          etapa.periodo_estimado,
                        )
                      }
                      className="h-8 px-2 rounded border border-slate-300 text-xs font-semibold bg-white"
                    >
                      <option value="Concluída">Concluída</option>
                      <option value="Fase Ativa">Fase Ativa</option>
                      <option value="Em Andamento">Em Andamento</option>
                      <option value="Pendente">Pendente</option>
                    </select>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{etapa.descricao}</p>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <div>
                    <strong>Período Estimado:</strong> {etapa.periodo_estimado || 'A definir'}
                  </div>
                  {etapa.observacoes && (
                    <div>
                      <strong>Observações:</strong> {etapa.observacoes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-ABA 2: DOCUMENTOS DO POCC */}
      {subAba === 'documentos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              Gerencie a documentação do ciclo (Edital, Minuta do Contrato de Transporte, Proposta
              Tarifária, FAQ, etc.). Cada item aceita link externo ou upload de PDF real (até 50
              MB).
            </p>
            <Button
              onClick={() => abrirModalDocumento()}
              size="sm"
              className="bg-[#059669] hover:bg-[#047857] text-white text-xs shrink-0"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Novo Documento do POCC
            </Button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-[#0a2540] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Ordem</th>
                  <th className="p-3">Documento / Título</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Arquivo / Link</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {documentos.map((doc) => {
                  const resDoc = resolverUrlDocPOC(doc)
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700">{doc.ordem}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{doc.titulo}</div>
                        {doc.descricao && (
                          <div className="text-[10px] text-slate-500 line-clamp-1">
                            {doc.descricao}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
                          {doc.categoria}
                        </span>
                      </td>
                      <td className="p-3">
                        <a
                          href={resDoc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#0284c7] font-semibold hover:underline"
                        >
                          {resDoc.isUpload ? 'PDF Hospedado' : 'Link Externo'}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="p-3">
                        {doc.ativo ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Ativo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                            Oculto
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => abrirModalDocumento(doc)}
                          className="text-[11px] h-7 px-2.5 text-slate-700"
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-ABA 3: MANIFESTAÇÕES DE INTERESSE */}
      {subAba === 'manifestacoes' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-600">
            Fila de manifestações de interesse não vinculantes recebidas no âmbito da Etapa I do
            POCC.
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-[#0a2540] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Protocolo</th>
                  <th className="p-3">Origem</th>
                  <th className="p-3">Carregador (Razão / CNPJ)</th>
                  <th className="p-3">Capacidade</th>
                  <th className="p-3">Modalidade</th>
                  <th className="p-3">Doc. Assinado</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Data</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {manifestacoes.length > 0 ? (
                  manifestacoes.map((m) => {
                    const urlArquivo = pocService.obterUrlArquivoManifestacao(m)
                    const isAreaCarregador = m.origem === 'area_carregador' || !m.origem

                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-[#0284c7]">{m.protocolo}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isAreaCarregador
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {isAreaCarregador
                              ? 'Área do Carregador (autenticado)'
                              : m.origem || 'Interno'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{m.razao_social}</div>
                          <div className="text-[10px] text-slate-500 font-mono">CNPJ: {m.cnpj}</div>
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          {Number(m.capacidade_solicitada).toLocaleString('pt-BR')} m³/dia
                        </td>
                        <td className="p-3">{m.modalidade}</td>
                        <td className="p-3">
                          {urlArquivo ? (
                            <a
                              href={urlArquivo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-[#0284c7] hover:underline"
                            >
                              <Download className="h-3 w-3" />
                              Baixar PDF
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Sem anexo</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            {m.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 font-mono">
                          {new Date(m.created).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setManifSelecionada(m)
                              setStatusManifForm(m.status)
                              setObsManifForm(m.observacoes_internas || '')
                              setModalManifAberto(true)
                            }}
                            className="bg-[#0284c7] hover:bg-[#0369a1] text-white text-[11px] h-7 px-2.5"
                          >
                            Analisar
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-500">
                      Nenhuma manifestação de interesse registrada no momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-ABA 4: PROPOSTAS VINCULANTES */}
      {subAba === 'propostas' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-600">
            Propostas Garantidas Vinculantes recebidas na Etapa III. Dados de Representantes Legais
            e instrumentos de garantia sob sigilo profissional (LGPD Art. 7º, II).
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-[#0a2540] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Protocolo</th>
                  <th className="p-3">Carregador</th>
                  <th className="p-3">Representante Legal (LGPD)</th>
                  <th className="p-3">Capacidade Proposta</th>
                  <th className="p-3">Garantia Financeira</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {propostas.length > 0 ? (
                  propostas.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-[#059669]">{p.protocolo}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{p.razao_social}</div>
                        <div className="text-[10px] text-slate-500 font-mono">CNPJ: {p.cnpj}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-900">{p.rep_legal_nome}</div>
                        <div className="text-[10px] text-slate-500">CPF: {p.rep_legal_cpf}</div>
                      </td>
                      <td className="p-3 font-bold text-slate-800">
                        {Number(p.capacidade_proposta).toLocaleString('pt-BR')} m³/dia
                      </td>
                      <td className="p-3">
                        <div className="font-semibold">{p.garantia_tipo}</div>
                        <div className="text-[10px] text-slate-500">
                          R$ {Number(p.garantia_valor).toLocaleString('pt-BR')}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-900">
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setPropSelecionada(p)
                            setStatusPropForm(p.status)
                            setCapAlocadaForm(p.capacidade_alocada || p.capacidade_proposta)
                            setParecerPropForm(p.parecer_alocacao || '')
                            setModalPropAberto(true)
                          }}
                          className="bg-[#059669] hover:bg-[#047857] text-white text-[11px] h-7 px-2.5"
                        >
                          Deliberar Alocação
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      Nenhuma proposta garantida vinculante recebida no momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR DOCUMENTO DO POCC */}
      {modalDocAberto && docEmEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setModalDocAberto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-[#0a2540]">
              <FileText className="h-5 w-5 text-[#0284c7]" />
              <h3 className="text-base font-bold">
                {docEmEdicao.id ? 'Editar Documento do POCC' : 'Novo Documento do POCC'}
              </h3>
            </div>

            <form onSubmit={handleSalvarDocumento} className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="ed_tit">Título do Documento *</Label>
                <Input
                  id="ed_tit"
                  required
                  value={docEmEdicao.titulo || ''}
                  onChange={(e) => setDocEmEdicao({ ...docEmEdicao, titulo: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ed_cat">Categoria *</Label>
                  <select
                    id="ed_cat"
                    value={docEmEdicao.categoria || 'edital'}
                    onChange={(e) =>
                      setDocEmEdicao({
                        ...docEmEdicao,
                        categoria: e.target.value as DocumentoPOCItem['categoria'],
                      })
                    }
                    className="w-full h-8 px-2 rounded border border-slate-300 text-xs bg-white"
                  >
                    <option value="edital">Edital</option>
                    <option value="regulamento">Regulamento</option>
                    <option value="minuta_contrato_transporte">
                      Minuta Contrato de Transporte
                    </option>
                    <option value="proposta_tarifaria">Proposta Tarifária</option>
                    <option value="procedimentos_operacionais">Procedimentos Operacionais</option>
                    <option value="cronograma">Cronograma</option>
                    <option value="comunicados">Comunicados</option>
                    <option value="faq">FAQ</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="ed_ord">Ordem de Exibição</Label>
                  <Input
                    id="ed_ord"
                    type="number"
                    value={docEmEdicao.ordem ?? 1}
                    onChange={(e) =>
                      setDocEmEdicao({ ...docEmEdicao, ordem: Number(e.target.value) })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="ed_desc">Descrição Explicativa</Label>
                <Textarea
                  id="ed_desc"
                  rows={2}
                  value={docEmEdicao.descricao || ''}
                  onChange={(e) => setDocEmEdicao({ ...docEmEdicao, descricao: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ed_url">URL Externa Oficial (Fallback)</Label>
                <Input
                  id="ed_url"
                  placeholder="https://www.tsb.com.br/poc/..."
                  value={docEmEdicao.url_externa || ''}
                  onChange={(e) => setDocEmEdicao({ ...docEmEdicao, url_externa: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ed_up">Upload de Arquivo PDF (até 50 MB)</Label>
                <Input
                  id="ed_up"
                  type="file"
                  accept=".pdf,.zip"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setArquivoDocUpload(e.target.files[0])
                    }
                  }}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ed_atv"
                  checked={docEmEdicao.ativo !== false}
                  onChange={(e) => setDocEmEdicao({ ...docEmEdicao, ativo: e.target.checked })}
                  className="rounded text-[#0284c7]"
                />
                <Label htmlFor="ed_atv" className="text-xs cursor-pointer">
                  Documento Ativo e Visível no Portal Público (/poc)
                </Label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalDocAberto(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={salvandoDoc}
                  className="bg-[#0a2540] hover:bg-[#13395e] text-white text-xs font-semibold"
                >
                  {salvandoDoc ? 'Salvando...' : 'Salvar Documento'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELIBERAÇÃO DE MANIFESTAÇÃO */}
      {modalManifAberto && manifSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setModalManifAberto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-[#0a2540]">
              <Send className="h-5 w-5 text-[#0284c7]" />
              <h3 className="text-base font-bold">Análise da Manifestação de Interesse</h3>
            </div>

            <div className="p-3 bg-slate-50 rounded border text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Protocolo:</strong>{' '}
                  <span className="font-mono font-bold text-[#0284c7]">
                    {manifSelecionada.protocolo}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800 border border-sky-300">
                  {manifSelecionada.origem === 'area_carregador' || !manifSelecionada.origem
                    ? 'Área do Carregador (autenticado)'
                    : manifSelecionada.origem}
                </span>
              </div>
              <div>
                <strong>Carregador:</strong> {manifSelecionada.razao_social} (CNPJ:{' '}
                {manifSelecionada.cnpj})
              </div>
              <div>
                <strong>Responsável / Signatário:</strong> {manifSelecionada.responsavel_nome}{' '}
                &bull; {manifSelecionada.email}
              </div>
              <div>
                <strong>Capacidade:</strong>{' '}
                {Number(manifSelecionada.capacidade_solicitada).toLocaleString('pt-BR')} m³/dia
                &bull; <strong>Modalidade:</strong> {manifSelecionada.modalidade}
              </div>
              <div>
                <strong>Trecho:</strong> {manifSelecionada.trecho} (
                {manifSelecionada.ponto_recebimento} &rarr; {manifSelecionada.ponto_entrega})
              </div>
              {pocService.obterUrlArquivoManifestacao(manifSelecionada) && (
                <div className="pt-1 border-t border-slate-200">
                  <strong>Documento Assinado do Carregador:</strong>{' '}
                  <a
                    href={pocService.obterUrlArquivoManifestacao(manifSelecionada)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-[#0284c7] hover:underline ml-1"
                  >
                    <Download className="h-3 w-3" />
                    Abrir / Baixar PDF Assinado
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="m_st_form">Status da Manifestação *</Label>
                <select
                  id="m_st_form"
                  value={statusManifForm}
                  onChange={(e) =>
                    setStatusManifForm(e.target.value as ManifestacaoInteressePOC['status'])
                  }
                  className="w-full h-8 px-2 rounded border border-slate-300 text-xs bg-white"
                >
                  <option value="Manifestação registrada — aguardando conferência da assinatura">
                    Manifestação registrada — aguardando conferência da assinatura
                  </option>
                  <option value="Recebida - Em Análise">Recebida - Em Análise</option>
                  <option value="Habilitada para Etapa II">
                    Habilitada para Etapa II (Aprovação de Tarifas e Redistribuição)
                  </option>
                  <option value="Em Ajuste Cadastral">Em Ajuste Cadastral</option>
                  <option value="Indeferida">Indeferida</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="m_obs_form">Observações Internas da Comissão</Label>
                <Textarea
                  id="m_obs_form"
                  rows={3}
                  value={obsManifForm}
                  onChange={(e) => setObsManifForm(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalManifAberto(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleSalvarDeliberacaoManif}
                  disabled={salvandoManif}
                  className="bg-[#0a2540] hover:bg-[#13395e] text-white text-xs font-semibold"
                >
                  {salvandoManif ? 'Salvando...' : 'Salvar Deliberação'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELIBERAÇÃO DE PROPOSTA VINCULANTE */}
      {modalPropAberto && propSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setModalPropAberto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-[#0a2540]">
              <Scale className="h-5 w-5 text-[#059669]" />
              <h3 className="text-base font-bold">Deliberação da Proposta e Alocação</h3>
            </div>

            <div className="p-3 bg-slate-50 rounded border text-xs space-y-1">
              <div>
                <strong>Protocolo:</strong> {propSelecionada.protocolo}
              </div>
              <div>
                <strong>Carregador:</strong> {propSelecionada.razao_social}
              </div>
              <div>
                <strong>Representante Legal:</strong> {propSelecionada.rep_legal_nome} (CPF:{' '}
                {propSelecionada.rep_legal_cpf})
              </div>
              <div>
                <strong>Garantia Apresentada:</strong> {propSelecionada.garantia_tipo} (R${' '}
                {Number(propSelecionada.garantia_valor).toLocaleString('pt-BR')})
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="pr_st_form">Status da Proposta Vinculante *</Label>
                <select
                  id="pr_st_form"
                  value={statusPropForm}
                  onChange={(e) =>
                    setStatusPropForm(e.target.value as PropostaVinculantePOC['status'])
                  }
                  className="w-full h-8 px-2 rounded border border-slate-300 text-xs bg-white"
                >
                  <option value="Proposta Recebida">Proposta Recebida</option>
                  <option value="Garantia em Análise">Garantia em Análise</option>
                  <option value="Capacidade Alocada (Art. 37-A, III)">
                    Capacidade Alocada (Art. 37-A, III)
                  </option>
                  <option value="Aguardando Assinatura (Art. 37-A, IV)">
                    Aguardando Assinatura (Art. 37-A, IV)
                  </option>
                  <option value="Contrato Celebrado e Enviado à ANP (Art. 37-A, V)">
                    Contrato Celebrado e Enviado à ANP (Art. 37-A, V)
                  </option>
                  <option value="Indeferida">Indeferida</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="pr_cap_form">Capacidade Alocada Definitiva (m³/dia)</Label>
                <Input
                  id="pr_cap_form"
                  type="number"
                  value={capAlocadaForm}
                  onChange={(e) => setCapAlocadaForm(Number(e.target.value))}
                  className="h-8 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pr_par_form">Parecer de Alocação / Deliberação da Comissão</Label>
                <Textarea
                  id="pr_par_form"
                  rows={3}
                  value={parecerPropForm}
                  onChange={(e) => setParecerPropForm(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalPropAberto(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleSalvarDeliberacaoProp}
                  disabled={salvandoProp}
                  className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold"
                >
                  {salvandoProp ? 'Salvando...' : 'Confirmar Deliberação'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
