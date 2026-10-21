import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  transparenciaService,
  resolverUrlDocumento,
  resolverUrlSecundaria,
  type ItemTransparencia,
  type SecaoTransparencia,
} from '@/services/transparencia'
import {
  FileText,
  FileDown,
  ExternalLink,
  Upload,
  RefreshCw,
  PlusCircle,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  CheckCircle2,
  Radio,
  Layers,
  Search,
  Check,
  Calendar,
  Activity,
} from 'lucide-react'

const MESES = [
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

export function EditoriaTransparencia() {
  const { toast } = useToast()

  // Seletor de módulo: 'cabecalho' | 'boletim_master' | 'boletim_secao1' | 'boletim_secao2' | 'monitoramento_congestionamento' | 'plataforma_inciso'
  const [subSecaoAtiva, setSubSecaoAtiva] = useState<SecaoTransparencia>('cabecalho')

  const [itens, setItens] = useState<ItemTransparencia[]>([])
  const [carregando, setCarregando] = useState(true)

  // Item em edição (modal ou formulário inline)
  const [itemEmEdicao, setItemEmEdicao] = useState<ItemTransparencia | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [modoNovoRelatorio, setModoNovoRelatorio] = useState(false)

  // Formulário de edição
  const [formTitulo, setFormTitulo] = useState('')
  const [formRotulo, setFormRotulo] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [formOrdem, setFormOrdem] = useState(1)
  const [formUrlExterna, setFormUrlExterna] = useState('')
  const [formNomeArquivoCustom, setFormNomeArquivoCustom] = useState('')
  const [formAtivo, setFormAtivo] = useState(true)

  // Seção II e Monitoramento de Congestionamento específico
  const [formAno, setFormAno] = useState('2026')
  const [formMes, setFormMes] = useState('Setembro')
  const [formChavePeriodo, setFormChavePeriodo] = useState('2026-09')
  const [formPeriodo, setFormPeriodo] = useState('')

  // Segundo documento opcional
  const [formUrlSecundaria, setFormUrlSecundaria] = useState('')
  const [formNomeUrlSecundaria, setFormNomeUrlSecundaria] = useState('')

  // Uploads
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const [removerArquivoAtual, setRemoverArquivoAtual] = useState(false)
  const [arquivoSecundarioSelecionado, setArquivoSecundarioSelecionado] = useState<File | null>(
    null,
  )
  const [removerArquivoSecundarioAtual, setRemoverArquivoSecundarioAtual] = useState(false)

  // Estado de envio
  const [salvando, setSalvando] = useState(false)
  const [filtroPesquisa, setFiltroPesquisa] = useState('')

  // Carregar todos os itens da coleção
  const carregarItens = useCallback(async () => {
    setCarregando(true)
    try {
      const lista = await transparenciaService.listarTodos()
      setItens(lista)
    } catch {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os itens de transparência do servidor.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }, [toast])

  useEffect(() => {
    carregarItens()
  }, [carregarItens])

  // Itens filtrados pela subseção atual
  const itensSecao = useMemo(() => {
    return itens
      .filter((it) => it.secao === subSecaoAtiva)
      .filter((it) => {
        if (!filtroPesquisa.trim()) return true
        const termo = filtroPesquisa.toLowerCase()
        return (
          it.titulo.toLowerCase().includes(termo) ||
          (it.rotulo && it.rotulo.toLowerCase().includes(termo)) ||
          (it.ano && it.ano.includes(termo)) ||
          (it.mes && it.mes.toLowerCase().includes(termo))
        )
      })
      .sort((a, b) => {
        if (
          subSecaoAtiva === 'boletim_secao2' ||
          subSecaoAtiva === 'monitoramento_congestionamento'
        ) {
          // ordenar por chave_periodo decrescente por padrão
          return (b.chave_periodo || '').localeCompare(a.chave_periodo || '')
        }
        return (a.ordem ?? 0) - (b.ordem ?? 0)
      })
  }, [itens, subSecaoAtiva, filtroPesquisa])

  // Abrir modal de edição para um item existente
  const abrirEdicao = (item: ItemTransparencia) => {
    setItemEmEdicao(item)
    setModoNovoRelatorio(false)
    setFormTitulo(item.titulo || '')
    setFormRotulo(item.rotulo || '')
    setFormDescricao(item.descricao || '')
    setFormOrdem(item.ordem ?? 1)
    setFormUrlExterna(item.url_externa || '')
    setFormNomeArquivoCustom(item.nome_arquivo_custom || '')
    setFormAtivo(item.ativo !== false)

    setFormAno(item.ano || '2026')
    setFormMes(item.mes || 'Setembro')
    setFormChavePeriodo(item.chave_periodo || '2026-09')
    setFormPeriodo(item.periodo || '')

    setFormUrlSecundaria(item.url_secundaria || '')
    setFormNomeUrlSecundaria(item.nome_url_secundaria || '')

    setArquivoSelecionado(null)
    setRemoverArquivoAtual(false)
    setArquivoSecundarioSelecionado(null)
    setRemoverArquivoSecundarioAtual(false)

    setModalAberto(true)
  }

  // Abrir modal para novo relatório da Seção II ou Monitoramento de Congestionamento
  const abrirNovoRelatorio = (tipo: 'boletim_secao2' | 'monitoramento_congestionamento') => {
    setItemEmEdicao(null)
    setModoNovoRelatorio(true)

    const agora = new Date()
    const anoAtualStr = String(agora.getFullYear())
    const mesNum = agora.getMonth() + 1
    const mesAtualStr = MESES[mesNum - 1]
    const chavePeriodo = `${anoAtualStr}-${String(mesNum).padStart(2, '0')}`

    setFormAno(anoAtualStr)
    setFormMes(mesAtualStr)
    setFormChavePeriodo(chavePeriodo)
    setFormRotulo(`${mesAtualStr}/${anoAtualStr}`)

    if (tipo === 'monitoramento_congestionamento') {
      setFormTitulo(
        `Relatório de Monitoramento de Utilização da Capacidade e Congestionamento - ${mesAtualStr}/${anoAtualStr}`,
      )
      setFormDescricao(
        'Relatório mensal consolidado do fluxo operacional e monitoramento de capacidade conforme Art. 12 da Resolução ANP nº 11/2016.',
      )
      setFormNomeArquivoCustom(`Monitoramento_Congestionamento_${mesAtualStr}${anoAtualStr}.pdf`)
    } else {
      setFormTitulo(
        `Quantidades programadas e realizadas nos pontos de recepção e entrega -${mesAtualStr}/${anoAtualStr}`,
      )
      setFormDescricao('Relatório de quantidades programadas e realizadas nos Trechos 1 e 3.')
      setFormNomeArquivoCustom(`Art_2o_Alinea-I_Item_h_${mesAtualStr}${anoAtualStr}.pdf`)
    }

    setFormOrdem(1)
    setFormUrlExterna('')
    setFormAtivo(true)

    setFormUrlSecundaria('')
    setFormNomeUrlSecundaria('')

    setArquivoSelecionado(null)
    setRemoverArquivoAtual(false)
    setArquivoSecundarioSelecionado(null)
    setRemoverArquivoSecundarioAtual(false)

    setModalAberto(true)
  }

  // Alternar ativo/oculto de forma rápida
  const handleToggleAtivo = async (item: ItemTransparencia) => {
    try {
      const atualizado = await transparenciaService.alternarAtivo(item.id, item.ativo)
      setItens((prev) => prev.map((it) => (it.id === atualizado.id ? atualizado : it)))
      toast({
        title: atualizado.ativo ? 'Item Ativado' : 'Item Ocultado',
        description: `O item "${atualizado.titulo}" agora está ${
          atualizado.ativo ? 'visível publicamente' : 'oculto'
        }.`,
      })
    } catch {
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar a visibilidade do item.',
        variant: 'destructive',
      })
    }
  }

  // Salvar formulário
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitulo.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Informe o título do documento ou item regulatório.',
        variant: 'destructive',
      })
      return
    }

    setSalvando(true)

    try {
      let chave = itemEmEdicao?.chave || ''
      if (modoNovoRelatorio) {
        const prefixo =
          subSecaoAtiva === 'monitoramento_congestionamento' ? 'congestionamento' : 'mes'
        chave = `${prefixo}_${formChavePeriodo.replace('-', '_')}`
      }

      const ehRelatorioMensal =
        subSecaoAtiva === 'boletim_secao2' || subSecaoAtiva === 'monitoramento_congestionamento'

      const inputDados = {
        secao: subSecaoAtiva,
        chave,
        rotulo: formRotulo.trim(),
        titulo: formTitulo.trim(),
        descricao: formDescricao.trim(),
        ordem: Number(formOrdem) || 1,
        url_externa: formUrlExterna.trim(),
        nome_arquivo_custom: formNomeArquivoCustom.trim(),
        ativo: formAtivo,
        ano: ehRelatorioMensal ? formAno : undefined,
        mes: ehRelatorioMensal ? formMes : undefined,
        chave_periodo: ehRelatorioMensal ? formChavePeriodo : undefined,
        periodo: formPeriodo.trim() || undefined,
        url_secundaria: formUrlSecundaria.trim() || undefined,
        nome_url_secundaria: formNomeUrlSecundaria.trim() || undefined,
        arquivo: arquivoSelecionado,
        remover_arquivo: removerArquivoAtual,
        arquivo_secundario: arquivoSecundarioSelecionado,
        remover_arquivo_secundario: removerArquivoSecundarioAtual,
      }

      const salvo = await transparenciaService.salvarItem(
        itemEmEdicao ? itemEmEdicao.id : chave,
        inputDados,
      )

      setItens((prev) => {
        const existe = prev.some((it) => it.id === salvo.id)
        if (existe) {
          return prev.map((it) => (it.id === salvo.id ? salvo : it))
        }
        return [salvo, ...prev]
      })

      toast({
        title: 'Item Salvo com Sucesso!',
        description: `As alterações para "${salvo.titulo}" foram publicadas no Portal de Transparência.`,
      })

      setModalAberto(false)
      setItemEmEdicao(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar item.'
      toast({
        title: 'Erro ao salvar',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  // Excluir item
  const handleExcluir = async (item: ItemTransparencia) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir o item "${item.titulo}"? Esta ação removerá o registro e seu arquivo do backend.`,
      )
    ) {
      return
    }

    try {
      await transparenciaService.excluirItem(item.id)
      setItens((prev) => prev.filter((it) => it.id !== item.id))
      toast({
        title: 'Item Excluído',
        description: `O item "${item.titulo}" foi removido do sistema.`,
      })
    } catch {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o item.',
        variant: 'destructive',
      })
    }
  }

  // Contadores por seção
  const contagens = useMemo(() => {
    return {
      cabecalho: itens.filter((i) => i.secao === 'cabecalho').length,
      boletim_master: itens.filter((i) => i.secao === 'boletim_master').length,
      boletim_secao1: itens.filter((i) => i.secao === 'boletim_secao1').length,
      boletim_secao2: itens.filter((i) => i.secao === 'boletim_secao2').length,
      monitoramento_congestionamento: itens.filter(
        (i) => i.secao === 'monitoramento_congestionamento',
      ).length,
      plataforma_inciso: itens.filter((i) => i.secao === 'plataforma_inciso').length,
    }
  }, [itens])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* BANNER INFORMATIVO */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-[#0284c7] shrink-0" />
          <span>
            <strong>Editoria de Transparência Regulatória:</strong> Gerencie todo o conteúdo,
            redações, links oficiais e faça <strong>upload real de PDFs</strong> para o Boletim
            Eletrônico (Portaria ANP nº 1/2003) e Plataforma Eletrônica (Resolução ANP nº 11/2016),
            sem precisar alterar código fonte.
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={carregarItens}
          disabled={carregando}
          className="text-xs text-slate-700 h-8 self-start sm:self-auto shrink-0 bg-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${carregando ? 'animate-spin' : ''}`} />
          Recarregar
        </Button>
      </div>

      {/* SUB-ABAS DA EDITORIA */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => {
            setSubSecaoAtiva('cabecalho')
            setFiltroPesquisa('')
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            subSecaoAtiva === 'cabecalho'
              ? 'bg-[#0a2540] text-white shadow-xs font-bold'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Edit3 className="h-3.5 w-3.5 text-sky-400" />
          Títulos &amp; Cabeçalhos
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-[#0a2540] font-bold">
            {contagens.cabecalho}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSubSecaoAtiva('boletim_master')
            setFiltroPesquisa('')
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            subSecaoAtiva === 'boletim_master'
              ? 'bg-[#0a2540] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          Boletim: Contrato Master
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-sky-200 text-[#0a2540] font-bold">
            {contagens.boletim_master}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSubSecaoAtiva('boletim_secao1')
            setFiltroPesquisa('')
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            subSecaoAtiva === 'boletim_secao1'
              ? 'bg-[#0a2540] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Boletim: Seção I (Alíneas a–j)
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-sky-200 text-[#0a2540] font-bold">
            {contagens.boletim_secao1}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSubSecaoAtiva('boletim_secao2')
            setFiltroPesquisa('')
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            subSecaoAtiva === 'boletim_secao2'
              ? 'bg-[#0a2540] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          Boletim: Seção II (Relatórios Mensais)
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-sky-200 text-[#0a2540] font-bold">
            {contagens.boletim_secao2}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSubSecaoAtiva('monitoramento_congestionamento')
            setFiltroPesquisa('')
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            subSecaoAtiva === 'monitoramento_congestionamento'
              ? 'bg-[#0a1d37] text-white shadow-xs font-bold'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Activity className="h-3.5 w-3.5 text-amber-400" />
          Monitoramento de Congestionamento (Art. 12)
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-[#0a2540] font-bold">
            {contagens.monitoramento_congestionamento}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSubSecaoAtiva('plataforma_inciso')
            setFiltroPesquisa('')
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            subSecaoAtiva === 'plataforma_inciso'
              ? 'bg-[#0a2540] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Layers className="h-3.5 w-3.5 text-emerald-500" />
          Plataforma Eletrônica (Incisos I a VIII)
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200 text-[#0a2540] font-bold">
            {contagens.plataforma_inciso}
          </span>
        </button>
      </div>

      {/* BARRA DE AÇÕES E BUSCA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            type="text"
            placeholder="Pesquisar por título, alínea, mês ou ano..."
            value={filtroPesquisa}
            onChange={(e) => setFiltroPesquisa(e.target.value)}
            className="h-9 pl-9 text-xs bg-white"
          />
        </div>

        {subSecaoAtiva === 'boletim_secao2' && (
          <Button
            onClick={() => abrirNovoRelatorio('boletim_secao2')}
            className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold h-9 shrink-0 inline-flex items-center gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            Adicionar Relatório Mensal
          </Button>
        )}

        {subSecaoAtiva === 'monitoramento_congestionamento' && (
          <Button
            onClick={() => abrirNovoRelatorio('monitoramento_congestionamento')}
            className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold h-9 shrink-0 inline-flex items-center gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            Adicionar Relatório de Congestionamento
          </Button>
        )}
      </div>

      {/* TABELA DE ITENS DA SEÇÃO ATIVA */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-2xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-[#f8fafc] text-[#0a2540] font-bold border-b border-slate-200">
            <tr>
              <th className="p-3 w-16 text-center">Rótulo</th>
              <th className="p-3">Título / Descrição Regulamentar</th>
              <th className="p-3">Documento Atual &amp; Origem</th>
              <th className="p-3 text-center w-24">Status</th>
              <th className="p-3 text-right w-36">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {itensSecao.length > 0 ? (
              itensSecao.map((item) => {
                const docPrincipal = resolverUrlDocumento(item, item.url_externa || '')
                const docSecundario =
                  item.url_secundaria || item.arquivo_secundario
                    ? resolverUrlSecundaria(item, item.url_secundaria || '')
                    : null

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Rótulo */}
                    <td className="p-3 text-center font-bold font-mono text-[#0a2540]">
                      <Badge
                        variant="outline"
                        className="text-[11px] font-semibold border-slate-300"
                      >
                        {item.rotulo || item.chave}
                      </Badge>
                    </td>

                    {/* Título e Descrição */}
                    <td className="p-3 max-w-md">
                      <div className="font-semibold text-slate-900 leading-snug">{item.titulo}</div>
                      {item.descricao && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                          {item.descricao}
                        </p>
                      )}
                      {(subSecaoAtiva === 'boletim_secao2' ||
                        subSecaoAtiva === 'monitoramento_congestionamento') && (
                        <div className="text-[10px] text-[#0284c7] font-mono mt-1">
                          Período: {item.chave_periodo || `${item.ano}-${item.mes}`}
                        </div>
                      )}
                    </td>

                    {/* Documento Atual */}
                    <td className="p-3">
                      <div className="space-y-1">
                        {docPrincipal.url ? (
                          <div className="flex items-center gap-1.5">
                            {docPrincipal.isUpload ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-mono">
                                Upload PB
                              </Badge>
                            ) : (
                              <Badge className="bg-sky-100 text-sky-800 border-sky-300 text-[10px] font-mono">
                                Link Oficial
                              </Badge>
                            )}
                            <a
                              href={docPrincipal.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0284c7] hover:underline font-medium truncate max-w-xs inline-flex items-center gap-1"
                              title={docPrincipal.url}
                            >
                              <FileDown className="h-3 w-3 shrink-0" />
                              <span className="truncate">{docPrincipal.nomeExibicao}</span>
                              <ExternalLink className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sem documento vinculado</span>
                        )}

                        {docSecundario && docSecundario.url && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            {docSecundario.isUpload ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-mono">
                                Upload 2
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-[10px] font-mono">
                                Link 2
                              </Badge>
                            )}
                            <a
                              href={docSecundario.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0284c7] hover:underline font-medium text-[11px] truncate max-w-xs inline-flex items-center gap-1"
                              title={docSecundario.url}
                            >
                              <FileDown className="h-3 w-3 shrink-0" />
                              <span className="truncate">{docSecundario.nomeExibicao}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Ativo/Oculto */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAtivo(item)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                          item.ativo
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                        }`}
                        title={item.ativo ? 'Clique para ocultar' : 'Clique para ativar'}
                      >
                        {item.ativo ? (
                          <>
                            <Eye className="h-3 w-3" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" />
                            Oculto
                          </>
                        )}
                      </button>
                    </td>

                    {/* Ações */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => abrirEdicao(item)}
                          className="h-7 px-2.5 text-xs text-[#0a2540] border-slate-300 hover:bg-slate-100"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Editar
                        </Button>

                        {/* Todos os itens suportam exclusão com fallback seguro ao oficial */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExcluir(item)}
                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Excluir item (retorna ao texto oficial original)"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  {carregando
                    ? 'Carregando itens de transparência...'
                    : 'Nenhum item encontrado nesta seção.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL / DIALOG DE EDIÇÃO E UPLOAD */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl bg-white border border-slate-300 shadow-xl overflow-hidden my-6 animate-scale-in">
            {/* CABEÇALHO DO MODAL */}
            <div className="bg-[#0a1d37] text-white p-5 border-b border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-sky-200">
                  {modoNovoRelatorio ? 'Novo Relatório' : 'Editar Item de Transparência'}
                </span>
                <h3 className="text-lg font-bold">
                  {modoNovoRelatorio
                    ? subSecaoAtiva === 'monitoramento_congestionamento'
                      ? 'Adicionar Relatório de Congestionamento (Art. 12)'
                      : 'Adicionar Relatório Mensal (Seção II)'
                    : itemEmEdicao?.titulo}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalAberto(false)}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            {/* FORMULÁRIO */}
            <form onSubmit={handleSalvar} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* STATUS ATIVO/OCULTO */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <Label
                    htmlFor="formAtivoCheck"
                    className="text-xs font-bold text-[#0a2540] block"
                  >
                    Publicar no Portal (Visível aos Usuários)
                  </Label>
                  <span className="text-[11px] text-slate-500">
                    Se desmarcado, o item não será exibido na página pública de Transparência.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="formAtivoCheck"
                    type="checkbox"
                    checked={formAtivo}
                    onChange={(e) => setFormAtivo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0284c7]"></div>
                </label>
              </div>

              {/* CAMPOS ESPECÍFICOS DE MÊS/ANO DA SEÇÃO II E MONITORAMENTO DE CONGESTIONAMENTO */}
              {(subSecaoAtiva === 'boletim_secao2' ||
                subSecaoAtiva === 'monitoramento_congestionamento') && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-sky-50/60 border border-sky-200 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Ano *</Label>
                    <Input
                      type="number"
                      min="2000"
                      max="2035"
                      required
                      value={formAno}
                      onChange={(e) => {
                        const novoAno = e.target.value
                        setFormAno(novoAno)
                        const mesIdx = MESES.indexOf(formMes) + 1
                        const mesStr = String(mesIdx > 0 ? mesIdx : 1).padStart(2, '0')
                        setFormChavePeriodo(`${novoAno}-${mesStr}`)
                        setFormRotulo(`${formMes}/${novoAno}`)
                      }}
                      className="h-8 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Mês *</Label>
                    <select
                      value={formMes}
                      onChange={(e) => {
                        const novoMes = e.target.value
                        setFormMes(novoMes)
                        const mesIdx = MESES.indexOf(novoMes) + 1
                        const mesStr = String(mesIdx).padStart(2, '0')
                        setFormChavePeriodo(`${formAno}-${mesStr}`)
                        setFormRotulo(`${novoMes}/${formAno}`)
                      }}
                      className="w-full h-8 px-2 rounded-md border border-slate-300 text-xs bg-white text-slate-800"
                    >
                      {MESES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Chave Período</Label>
                    <Input
                      readOnly
                      value={formChavePeriodo}
                      className="h-8 text-xs bg-slate-100 font-mono text-slate-600"
                    />
                  </div>
                </div>
              )}

              {/* RÓTULO, ORDEM, TEXTO DO BOTÃO E DATA DE REFERÊNCIA */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Rótulo / Alínea</Label>
                  <Input
                    value={formRotulo}
                    onChange={(e) => setFormRotulo(e.target.value)}
                    placeholder="Ex: a), VII, Contratos"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Ordem de Exibição</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formOrdem}
                    onChange={(e) => setFormOrdem(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Data de Referência (Opcional)
                  </Label>
                  <Input
                    value={formPeriodo}
                    onChange={(e) => setFormPeriodo(e.target.value)}
                    placeholder="Ex: Março/2026 ou 2026"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Texto do Botão / Link
                  </Label>
                  <Input
                    value={formNomeArquivoCustom}
                    onChange={(e) => setFormNomeArquivoCustom(e.target.value)}
                    placeholder="Ex: - Baixar Arquivo"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* TÍTULO */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Título Regulamentar *
                </Label>
                <Input
                  required
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Título oficial do documento ou alínea"
                  className="text-xs font-medium"
                />
              </div>

              {/* DESCRIÇÃO / REDAÇÃO */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Descrição / Redação Explicativa
                </Label>
                <Textarea
                  rows={3}
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Texto explicativo ou exigência legal..."
                  className="text-xs"
                />
              </div>

              {/* ========================================================
                  BLOCO PRINCIPAL: UPLOAD DE PDF OU URL EXTERNA
                  ======================================================== */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                    <FileDown className="h-4 w-4 text-[#0284c7]" />
                    Documento Principal (PDF Oficial)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    O upload real para o PocketBase tem precedência sobre a URL externa
                  </span>
                </div>

                {/* Status do Arquivo Atual */}
                {itemEmEdicao?.arquivo && !removerArquivoAtual && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">Arquivo armazenado no servidor:</span>
                      <span className="font-mono truncate">{itemEmEdicao.arquivo}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemoverArquivoAtual(true)}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                    >
                      Remover / Substituir
                    </Button>
                  </div>
                )}

                {removerArquivoAtual && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center justify-between">
                    <span>O arquivo existente será removido ao salvar.</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRemoverArquivoAtual(false)}
                      className="text-xs h-6 px-2"
                    >
                      Desfazer
                    </Button>
                  </div>
                )}

                {/* Campo de Upload */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5 text-slate-500" />
                    Enviar Novo Arquivo PDF (Upload Direto no Servidor):
                  </Label>
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setArquivoSelecionado(e.target.files[0])
                        setRemoverArquivoAtual(false)
                      }
                    }}
                    className="text-xs bg-white file:text-xs file:bg-slate-100 file:border-0 file:rounded file:px-2 file:py-1 file:font-semibold"
                  />
                  {arquivoSelecionado && (
                    <span className="text-[11px] text-emerald-700 font-medium block">
                      ✓ Selecionado: {arquivoSelecionado.name} (
                      {(arquivoSelecionado.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>

                {/* Campo de URL Externa como Fallback */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                    Ou Link Externo Oficial (Fallback):
                  </Label>
                  <Input
                    type="text"
                    value={formUrlExterna}
                    onChange={(e) => setFormUrlExterna(e.target.value)}
                    placeholder="https://www.tsb.com.br/wp-content/uploads/..."
                    className="text-xs font-mono bg-white"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Utilizado como fallback automático quando nenhum arquivo direto for enviado.
                  </span>
                </div>
              </div>

              {/* DOCUMENTO SECUNDÁRIO (QUANDO APLICÁVEL, EX: ITEM f, V OU CABEÇALHO COM ANEXO EXTRA) */}
              {(subSecaoAtiva === 'boletim_secao1' ||
                subSecaoAtiva === 'plataforma_inciso' ||
                subSecaoAtiva === 'cabecalho') && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0a2540]">
                      Documento Secundário (Opcional - Ex: Fluxos Físicos ou Simulação Trecho 3)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">
                        Rótulo do Link 2
                      </Label>
                      <Input
                        value={formNomeUrlSecundaria}
                        onChange={(e) => setFormNomeUrlSecundaria(e.target.value)}
                        placeholder="Ex: - Fluxos Físicos do Gás Natural"
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">URL Secundária</Label>
                      <Input
                        value={formUrlSecundaria}
                        onChange={(e) => setFormUrlSecundaria(e.target.value)}
                        placeholder="https://..."
                        className="h-8 text-xs font-mono bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      Upload PDF Secundário:
                    </Label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setArquivoSecundarioSelecionado(e.target.files[0])
                        }
                      }}
                      className="text-xs bg-white file:text-xs file:bg-slate-100 file:border-0 file:rounded file:px-2 file:py-1"
                    />
                  </div>
                </div>
              )}

              {/* BOTÕES DE AÇÃO */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalAberto(false)}
                  disabled={salvando}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={salvando}
                  className="bg-[#0a2540] hover:bg-[#13395e] text-white text-xs font-bold px-4"
                >
                  {salvando ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Salvar e Publicar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
