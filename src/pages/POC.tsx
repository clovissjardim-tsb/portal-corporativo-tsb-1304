import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import {
  FileText,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Lock,
} from 'lucide-react'

export default function POC() {
  const { isAuthenticated, user, logout } = useAuth()
  const { toast } = useToast()
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false)
  const [manifestacaoEnviada, setManifestacaoEnviada] = useState(false)

  const handleEnviarManifestacao = () => {
    setManifestacaoEnviada(true)
    setModalConfirmacaoAberto(false)
    toast({
      title: 'Manifestação de Interesse Enviada!',
      description: 'Protocolo de participação registrado para o Ciclo POCC TSB 2026/2027.',
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* BANNER INFORMATIVO AZUL */}
      <div className="p-4 bg-[#eff6ff] border-l-4 border-l-[#0284c7] border border-blue-200 rounded-r-lg space-y-1">
        <h2 className="text-sm font-bold text-[#0284c7] flex items-center gap-2">
          Processo Oferta de Capacidade (POC/POCC): Resolução ANP nº 961/2023.
        </h2>
        <p className="text-xs text-slate-700 leading-relaxed">
          Etapas formais de contratação de capacidade de transporte no sistema dutoviário da TSB.
          Garantia de concorrência, transparência e eficiência alocativa aos carregadores de gás
          natural.
        </p>
      </div>

      {/* CARD DO CICLO POCC */}
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-xl font-bold text-[#0a2540]">
              Ciclo POCC TSB 2026/2027
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Cronograma regulatório vigente para alocação de capacidade de transporte firme
            </p>
          </div>
          <Badge className="bg-[#fef3c7] text-[#b45309] border border-amber-200 hover:bg-[#fef3c7] text-xs font-bold">
            Fase: Manifestação de Interesse
          </Badge>
        </CardHeader>
        <CardContent className="pt-6 pb-8">
          {/* TIMELINE HORIZONTAL DE 5 ETAPAS */}
          <div className="relative">
            {/* Linha base conectando os círculos */}
            <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-200 -z-0 hidden md:block" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
              {/* Etapa 1: Concluído */}
              <div className="flex md:flex-col items-center md:text-center gap-3 md:gap-2">
                <div className="w-10 h-10 rounded-full bg-[#dcfce7] text-[#15803d] border-2 border-[#059669] flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">1. Edital Público</div>
                  <div className="text-[11px] text-emerald-700 font-semibold">Concluído</div>
                </div>
              </div>

              {/* Etapa 2: Ativo */}
              <div className="flex md:flex-col items-center md:text-center gap-3 md:gap-2">
                <div className="w-10 h-10 rounded-full bg-[#0284c7] text-white border-2 border-[#0284c7] flex items-center justify-center font-bold text-sm shrink-0 shadow-md ring-4 ring-sky-100">
                  2
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0284c7]">
                    2. Manifestação de Interesse
                  </div>
                  <div className="text-[11px] text-sky-600 font-semibold">Fase Ativa</div>
                </div>
              </div>

              {/* Etapa 3: Pendente */}
              <div className="flex md:flex-col items-center md:text-center gap-3 md:gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 border-2 border-slate-300 flex items-center justify-center font-bold text-sm shrink-0">
                  3
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700">3. Tarifas ANP</div>
                  <div className="text-[11px] text-slate-400">Pendente</div>
                </div>
              </div>

              {/* Etapa 4: Pendente */}
              <div className="flex md:flex-col items-center md:text-center gap-3 md:gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 border-2 border-slate-300 flex items-center justify-center font-bold text-sm shrink-0">
                  4
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700">4. Garantias e Propostas</div>
                  <div className="text-[11px] text-slate-400">Pendente</div>
                </div>
              </div>

              {/* Etapa 5: Pendente */}
              <div className="flex md:flex-col items-center md:text-center gap-3 md:gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 border-2 border-slate-300 flex items-center justify-center font-bold text-sm shrink-0">
                  5
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700">5. Assinatura de Contratos</div>
                  <div className="text-[11px] text-slate-400">Pendente</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CARD DE PERFIL DE ACESSO */}
      <Card className="border border-slate-200 shadow-sm bg-slate-50/80">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Perfil de Acesso POC:
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#dcfce7] text-[#15803d] border border-emerald-300">
                    <ShieldCheck className="h-4 w-4" />
                    Sessão Ativa: Carregador Autenticado
                  </span>
                  <span className="text-xs text-slate-600 hidden md:inline">
                    ({user?.name || user?.email})
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fee2e2] text-[#b91c1c] border border-red-300">
                  <ShieldAlert className="h-4 w-4" />
                  Não Autenticado (Visualização Pública)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button
                variant="outline"
                onClick={logout}
                className="text-xs font-semibold text-red-700 border-red-200 hover:bg-red-50"
              >
                Encerrar Sessão
              </Button>
            ) : (
              <Link to="/login" state={{ from: { pathname: '/poc' } }}>
                <Button className="bg-[#0a2540] hover:bg-[#13395e] text-white text-xs font-semibold">
                  Acessar Área do Carregador
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CONTEÚDO PÚBLICO: DOCUMENTAÇÃO DO CICLO */}
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-[#0a2540] flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#0284c7]" />
            Documentação Pública do Ciclo Vigente
          </CardTitle>
          <p className="text-xs text-slate-500">
            Minutas, cronogramas e instrumentos convocatórios disponíveis para download e consulta
            livre
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <ul className="space-y-3">
            <li className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <span className="text-xs sm:text-sm font-medium text-slate-800 flex items-center gap-2">
                <span className="text-base">📄</span>
                Edital do Processo de Oferta de Capacidade TSB 2026 (PDF)
              </span>
              <button
                type="button"
                onClick={() =>
                  toast({
                    title: 'Edital do POCC 2026',
                    description: 'Download do edital completo oficial simulado com sucesso.',
                  })
                }
                className="text-xs font-semibold text-[#0284c7] hover:underline shrink-0 ml-2"
              >
                Visualizar PDF
              </button>
            </li>

            <li className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <span className="text-xs sm:text-sm font-medium text-slate-800 flex items-center gap-2">
                <span className="text-base">📄</span>
                Minuta do Contrato Master de Transporte de Gás Natural (PDF)
              </span>
              <button
                type="button"
                onClick={() =>
                  toast({
                    title: 'Minuta Contratual Master',
                    description: 'Download da minuta contratual simulado com sucesso.',
                  })
                }
                className="text-xs font-semibold text-[#0284c7] hover:underline shrink-0 ml-2"
              >
                Visualizar PDF
              </button>
            </li>

            <li className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <span className="text-xs sm:text-sm font-medium text-slate-800 flex items-center gap-2">
                <span className="text-base">📄</span>
                Cronograma Detalhado do POCC (PDF)
              </span>
              <button
                type="button"
                onClick={() =>
                  toast({
                    title: 'Cronograma POCC',
                    description: 'Download do cronograma detalhado de etapas simulado.',
                  })
                }
                className="text-xs font-semibold text-[#0284c7] hover:underline shrink-0 ml-2"
              >
                Visualizar PDF
              </button>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* AMBIENTE RESTRITO DO CARREGADOR (QUANDO AUTENTICADO) */}
      {isAuthenticated ? (
        <Card className="border-t-4 border-t-[#059669] border-slate-200 shadow-md bg-white animate-fade-in">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-xl font-bold text-[#0a2540] flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#059669]" />
                Ambiente Restrito do Carregador
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Módulo seguro para submissão de ofertas e documentação sigilosa
              </p>
            </div>
            <Badge className="bg-[#dcfce7] text-[#15803d] border border-emerald-300 font-bold">
              Sessão Segura
            </Badge>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Bem-vindo ao canal exclusivo do carregador credenciado. Através deste módulo você pode
              submeter manifestações de interesse firmes, realizar o upload de garantias financeiras
              e bancárias, e acompanhar a homologação de propostas no âmbito do Ciclo POCC
              2026/2027.
            </p>

            {manifestacaoEnviada ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-emerald-900 text-sm">
                    Manifestação de Interesse Registrada!
                  </div>
                  <div>
                    Sua empresa está habilitada para a fase de consulta tarifária da ANP e
                    apresentação de garantias. Protocolo POCC: <strong>POCC-TSB-2026-9104</strong>.
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <Button
                  onClick={() => setModalConfirmacaoAberto(true)}
                  className="bg-[#059669] hover:bg-[#047857] text-white font-semibold text-xs sm:text-sm py-2.5 px-4 shadow-sm inline-flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Enviar Formulário de Manifestação de Interesse
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Aviso discreto convidando ao login para acessar a área restrita */
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-400" />
            <span>
              Para submissão de propostas, envio de garantias e acesso ao ambiente restrito,
              identifique-se com sua credencial de carregador.
            </span>
          </div>
          <Link
            to="/login"
            state={{ from: { pathname: '/poc' } }}
            className="text-xs font-semibold text-[#0284c7] hover:underline"
          >
            Acessar Área do Carregador &rarr;
          </Link>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE MANIFESTAÇÃO DE INTERESSE */}
      {modalConfirmacaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-[#0a2540]">
              <div className="p-2 bg-sky-50 rounded-full text-[#0284c7]">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Confirmação de Manifestação</h3>
                <p className="text-xs text-slate-500">Ciclo POCC TSB 2026/2027</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ao confirmar, sua empresa declarará formalmente interesse em contratar capacidade de
              transporte firme no gasoduto TSB para o horizonte contratual 2026/2027,
              comprometendo-se com as regras e prazos previstos no Edital regulamentado pela
              Resolução ANP nº 961/2023.
            </p>

            <div className="p-3 bg-slate-50 rounded border text-xs text-slate-700 space-y-1">
              <div>
                <strong>Carregador:</strong> {user?.name || user?.email}
              </div>
              <div>
                <strong>Trecho Objeto:</strong> Gasoduto Uruguaiana - Triunfo
              </div>
              <div>
                <strong>Capacidade Referencial:</strong> 150.000 m³/dia
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                variant="outline"
                onClick={() => setModalConfirmacaoAberto(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEnviarManifestacao}
                className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold"
              >
                Confirmar Envio
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
