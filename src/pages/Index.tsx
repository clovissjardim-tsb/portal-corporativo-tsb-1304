import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Network, Headphones, ShieldAlert, FileDown } from 'lucide-react'
import { QuadroTarifaDestaque } from '@/components/QuadroTarifaDestaque'
import { tarifaService, type QuadroTarifa, TARIFA_SEED_FALLBACK } from '@/services/tarifa'
import {
  transparenciaService,
  resolverUrlDocumento,
  CABECALHOS_FALLBACK,
  type ItemTransparencia,
} from '@/services/transparencia'

export default function Index() {
  const [tarifa, setTarifa] = useState<QuadroTarifa | null>(null)
  const [carregandoTarifa, setCarregandoTarifa] = useState(true)
  const [avisoServidaoItem, setAvisoServidaoItem] = useState<ItemTransparencia | null>(null)

  useEffect(() => {
    let ativo = true
    transparenciaService
      .obterPorChave('cabecalho', 'aviso_faixas_servidao')
      .then((item) => {
        if (ativo) setAvisoServidaoItem(item)
      })
      .catch(() => {
        // fallback é utilizado
      })

    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    let ativo = true
    tarifaService
      .obterTarifaPrincipal()
      .then((dados) => {
        if (ativo) {
          setTarifa(dados)
        }
      })
      .catch(() => {
        if (ativo) {
          setTarifa(TARIFA_SEED_FALLBACK)
        }
      })
      .finally(() => {
        if (ativo) {
          setCarregandoTarifa(false)
        }
      })

    return () => {
      ativo = false
    }
  }, [])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* BLOCO DE TARIFA EM DESTAQUE (REPRODUÇÃO FIEL AO QUADRO CONTRATO EXTRAORDINÁRIO) */}
      {!carregandoTarifa && tarifa && tarifa.ativo && (
        <section aria-label="Quadro de Tarifa em Destaque">
          <QuadroTarifaDestaque tarifa={tarifa} />
        </section>
      )}

      {/* 3 CARDS INFORMATIVOS — ESTILO UNIFORME, SÓBRIO E SEM CORES CONCORRENTES */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: A Companhia */}
        <Card className="border border-slate-200 shadow-xs bg-white rounded-xl">
          <CardHeader className="pb-3 flex flex-row items-center gap-3 space-y-0">
            <div className="p-2 rounded-lg bg-slate-100 text-[#0284c7]">
              <Building2 className="h-5 w-5" />
            </div>
            <CardTitle className="text-base sm:text-lg font-bold text-[#0a2540] font-display">
              A Companhia
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2.5">
            <p>
              Constituída com a missão de conectar centros de produção, importação e consumo no Cone
              Sul, a TSB desempenha papel fundamental no suprimento seguro de gás natural.
            </p>
            <p>
              Nossa estrutura societária e governança prezam pela excelência técnica,
              sustentabilidade ambiental e transparência irrestrita com os agentes de mercado e a
              sociedade.
            </p>
          </CardContent>
        </Card>

        {/* CARD 2: Malha de Gasodutos */}
        <Card className="border border-slate-200 shadow-xs bg-white rounded-xl flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 flex flex-row items-center gap-3 space-y-0">
              <div className="p-2 rounded-lg bg-slate-100 text-[#0284c7]">
                <Network className="h-5 w-5" />
              </div>
              <CardTitle className="text-base sm:text-lg font-bold text-[#0a2540] font-display">
                Malha de Gasodutos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2.5">
              <p>
                O sistema dutoviário da TSB abrange trechos estratégicos entre a fronteira oeste
                (Uruguaiana) e o Polo Petroquímico de Triunfo/Porto Alegre.
              </p>
              <p>
                Operamos com modernas Estações de Medição e Regulagem de Pressão (EMEDs), sistemas
                de supervisão SCADA de alta precisão e integridade estrutural contínua de dutos.
              </p>
            </CardContent>
          </div>

          {/* AVISO DISCRETO DE FAIXAS DE SERVIDÃO (RES. ANP 42/2012, ART. 46) JUNTO AO CARD */}
          {avisoServidaoItem?.ativo !== false && (
            <div className="p-3.5 m-4 mt-0 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#0a2540]">
                <ShieldAlert className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="font-display">Segurança das Faixas de Servidão</span>
                <Badge
                  variant="outline"
                  className="bg-white text-slate-700 border-slate-300 text-[9px] font-mono ml-auto"
                >
                  Res. 42/2012
                </Badge>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug line-clamp-3">
                {avisoServidaoItem?.descricao ||
                  CABECALHOS_FALLBACK.aviso_faixas_servidao.descricao}
              </p>
              <div className="pt-0.5 flex items-center justify-between">
                <Link
                  to="/transparencia"
                  className="text-[10px] font-bold text-[#0a2540] hover:text-[#0284c7] hover:underline"
                >
                  Ver no Boletim &rarr;
                </Link>
                {(() => {
                  const doc = resolverUrlDocumento(avisoServidaoItem, '')
                  if (!doc.url) return null
                  return (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-slate-500 hover:text-[#0284c7] inline-flex items-center gap-1"
                    >
                      <FileDown className="h-3 w-3" />
                      {doc.nomeExibicao || 'Resolução ANP'}
                    </a>
                  )
                })()}
              </div>
            </div>
          )}
        </Card>

        {/* CARD 3: Atendimento ao Cliente */}
        <Card className="border border-slate-200 shadow-xs bg-white rounded-xl">
          <CardHeader className="pb-3 flex flex-row items-center gap-3 space-y-0">
            <div className="p-2 rounded-lg bg-slate-100 text-[#0284c7]">
              <Headphones className="h-5 w-5" />
            </div>
            <CardTitle className="text-base sm:text-lg font-bold text-[#0a2540] font-display">
              Atendimento ao Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2.5">
            <p>
              Canal direto para carregadores, agentes da cadeia de suprimento de gás natural e
              interessados no acesso aberto à infraestrutura.
            </p>
            <p>
              Atendimento técnico e comercial para solicitações de acesso (Inciso VII), cessão de
              capacidade (Inciso VIII) e informações regulatórias da ANP.
            </p>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-[#0a2540] block">
                Contato Operacional &amp; Regulatório:
              </span>
              <span className="text-xs text-slate-700 font-medium">
                regulacao@tsb.com.br | (51) 3210-0000
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
