import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtime } from '@/hooks/use-realtime'
import { solicitacoesService, type SolicitacaoIncisoVII } from '@/services/solicitacoes'
import {
  ShieldAlert,
  ShieldCheck,
  FileText,
  Clock,
  ArrowRight,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'

export default function Gestao() {
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoIncisoVII[]>([])
  const [carregando, setCarregando] = useState(true)
  const [itemSelecionado, setItemSelecionado] = useState<SolicitacaoIncisoVII | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [novoStatus, setNovoStatus] = useState<SolicitacaoIncisoVII['status']>(
    'Solicitação Recebida - Em Análise Técnica',
  )
  const [salvandoStatus, setSalvandoStatus] = useState(false)

  // Carregar solicitações do backend
  const carregarSolicitacoes = useCallback(async () => {
    try {
      const lista = await solicitacoesService.listar()
      setSolicitacoes(lista)
    } catch {
      // Ignora erro inicial
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarSolicitacoes()
  }, [carregarSolicitacoes])

  // Realtime hook para atualizar a fila quando novas solicitações forem criadas ou editadas
  useRealtime<SolicitacaoIncisoVII>(
    'solicitacoes_inciso_vii',
    (data) => {
      if (data.action === 'create') {
        setSolicitacoes((prev) => [data.record, ...prev.filter((r) => r.id !== data.record.id)])
        toast({
          title: 'Nova Solicitação do Inciso VII!',
          description: `Protocolo: ${data.record.protocolo} — ${data.record.razao_social}`,
        })
      } else if (data.action === 'update') {
        setSolicitacoes((prev) => prev.map((r) => (r.id === data.record.id ? data.record : r)))
      } else if (data.action === 'delete') {
        setSolicitacoes((prev) => prev.filter((r) => r.id !== data.record.id))
      }
    },
    true,
  )

  const abrirModalAnalise = (item: SolicitacaoIncisoVII) => {
    setItemSelecionado(item)
    setNovoStatus(item.status)
    setModalAberto(true)
  }

  const salvarRespostaAnalise = async () => {
    if (!itemSelecionado) return

    setSalvandoStatus(true)
    try {
      const atualizado = await solicitacoesService.atualizarStatus(itemSelecionado.id, novoStatus)
      setSolicitacoes((prev) => prev.map((s) => (s.id === atualizado.id ? atualizado : s)))
      toast({
        title: 'Status atualizado com sucesso',
        description: `Protocolo ${atualizado.protocolo} atualizado para: ${novoStatus}`,
      })
      setModalAberto(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar o status.'
      toast({
        title: 'Atenção na atualização',
        description:
          msg.includes('403') || msg.includes('Failed')
            ? 'Regra de segurança da ANP: atualização restrita à administração do sistema.'
            : msg,
        variant: 'destructive',
      })
    } finally {
      setSalvandoStatus(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* CARD PRINCIPAL COM BORDA SUPERIOR AZUL */}
      <Card className="border-t-4 border-t-[#0a2540] border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-[#0a2540]">
              Gestão Interna de Chamados e SLAs
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Controle regulatório de conformidade temporal para manifestações e solicitações de
              acesso
            </p>
          </div>

          <div>
            {isAuthenticated ? (
              <Badge className="bg-[#dcfce7] text-[#15803d] border border-emerald-300 font-bold hover:bg-[#dcfce7]">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                Autenticado Operações
              </Badge>
            ) : (
              <Badge className="bg-[#fee2e2] text-[#b91c1c] border border-red-300 font-bold hover:bg-[#fee2e2]">
                <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                Requer Autenticação
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!isAuthenticated ? (
            /* ESTADO NÃO AUTENTICADO */
            <div className="py-10 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#0a2540]">Acesso Restrito às Operações</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A visualização detalhada da fila regulatória, cumprimento dos prazos legais do
                  Art. 10 da Resolução ANP nº 11/2016 e emissão de pareceres requerem identificação
                  de operador credenciado da TSB.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/login" state={{ from: { pathname: '/gestao' } }}>
                  <Button className="bg-[#0a2540] hover:bg-[#13395e] text-white text-xs font-semibold px-6 py-2.5">
                    Autenticar Operador TSB
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* ESTADO AUTENTICADO (DASHBOARD) */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-[#0a2540] flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#0284c7]" />
                    Fila de Solicitações do Inciso VII (SLA Legal: 20 Dias Úteis)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sincronização em tempo real das submissões de acesso efetuadas no Portal de
                    Transparência
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={carregarSolicitacoes}
                  disabled={carregando}
                  className="text-xs text-slate-700 h-8 self-start sm:self-auto"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${carregando ? 'animate-spin' : ''}`} />
                  Atualizar Fila
                </Button>
              </div>

              {/* TABELA DE SOLICITAÇÕES */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#f1f5f9] text-[#0a2540] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Protocolo</th>
                      <th className="p-3">Solicitante</th>
                      <th className="p-3">SLA Restante</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {solicitacoes.length > 0 ? (
                      solicitacoes.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-[#0a2540]">
                            {item.protocolo}
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-800">{item.razao_social}</div>
                            <div className="text-[11px] text-slate-500">
                              {item.modalidade} &bull; {item.capacidade?.toLocaleString('pt-BR')}{' '}
                              m³/dia
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#dcfce7] text-[#15803d] border border-emerald-300">
                              {item.sla_dias || 20} Dias Úteis
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              size="sm"
                              onClick={() => abrirModalAnalise(item)}
                              className="bg-[#0284c7] hover:bg-[#0369a1] text-white text-[11px] font-semibold h-7 px-2.5"
                            >
                              Analisar e Responder
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-500">
                          {carregando
                            ? 'Carregando fila de solicitações...'
                            : 'Nenhuma solicitação encontrada no momento.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL DETALHES E ANÁLISE DA SOLICITAÇÃO */}
      {modalAberto && itemSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 text-[#0a2540]">
              <div className="p-2 bg-sky-50 rounded-full text-[#0284c7]">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Análise Regulatória</h3>
                <p className="text-xs text-slate-500 font-mono">
                  Protocolo: {itemSelecionado.protocolo}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border text-xs text-slate-700 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Razão Social:</span>
                  <strong className="text-slate-900">{itemSelecionado.razao_social}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">CNPJ:</span>
                  <strong className="font-mono text-slate-900">{itemSelecionado.cnpj}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">E-mail:</span>
                  <strong className="text-slate-900">{itemSelecionado.email}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Modalidade:</span>
                  <strong className="text-slate-900">{itemSelecionado.modalidade}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Capacidade Solicitada:</span>
                  <strong className="font-mono text-slate-900">
                    {itemSelecionado.capacidade?.toLocaleString('pt-BR')} m³/dia
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Trecho de Interesse:</span>
                  <strong className="text-slate-900">{itemSelecionado.trecho}</strong>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block">SLA Restante:</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#dcfce7] text-[#15803d]">
                  {itemSelecionado.sla_dias || 20} Dias Úteis
                </span>
              </div>
            </div>

            {/* SELEÇÃO DE STATUS */}
            <div className="space-y-1.5 pt-2">
              <Label htmlFor="statusModal" className="text-xs font-semibold text-slate-700">
                Atualizar Parecer / Status Regulatório:
              </Label>
              <select
                id="statusModal"
                value={novoStatus}
                onChange={(e) => setNovoStatus(e.target.value as SolicitacaoIncisoVII['status'])}
                className="w-full h-9 px-3 rounded-md border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
              >
                <option value="Solicitação Recebida - Em Análise Técnica">
                  Solicitação Recebida - Em Análise Técnica
                </option>
                <option value="Em Análise Técnica">Em Análise Técnica</option>
                <option value="Aguardando Documentação">Aguardando Documentação</option>
                <option value="Aprovada">Aprovada</option>
                <option value="Rejeitada">Rejeitada</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button variant="outline" onClick={() => setModalAberto(false)} className="text-xs">
                Cancelar
              </Button>
              <Button
                onClick={salvarRespostaAnalise}
                disabled={salvandoStatus}
                className="bg-[#0a2540] hover:bg-[#13395e] text-white text-xs font-semibold"
              >
                {salvandoStatus ? 'Salvando...' : 'Salvar Alteração'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
