import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Network,
  Headphones,
  Shield,
  ArrowRight,
  ShieldAlert,
  FileDown,
} from 'lucide-react'
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
      {/* HERO CARD COM PALETA TSB E TIPOGRAFIA DE DISPLAY */}
      <section
        style={{
          background: 'linear-gradient(135deg, #061325 0%, #0c2340 50%, #143b73 100%)',
        }}
        className="text-white rounded-xl p-8 sm:p-12 shadow-lg relative overflow-hidden border border-white/10"
      >
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-slate-200 border border-white/20">
            <Shield className="h-3.5 w-3.5 text-[#e30613]" />
            <span className="font-display tracking-wider uppercase text-[11px]">
              Infraestrutura Dutoviária Estratégica do Sul do Brasil
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-[2.6rem] font-extrabold tracking-tight leading-tight text-white font-display">
            Transportadora Sulbrasileira de Gás — TSB
          </h1>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
            A TSB opera a infraestrutura de transporte dutoviário de gás natural no estado do Rio
            Grande do Sul, garantindo a integração energética regional, confiabilidade operacional e
            plena conformidade com as diretrizes regulatórias estabelecidas pela Agência Nacional do
            Petróleo, Gás Natural e Biocombustíveis (ANP).
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/transparencia"
              className="inline-flex items-center gap-2 bg-[#e30613] hover:bg-[#c50510] text-white font-bold px-4 py-2.5 rounded-md text-sm transition-colors shadow-sm font-display tracking-wide uppercase text-xs"
            >
              Consultar Transparência Regulatória
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/poc"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-md text-sm transition-colors border border-white/30 font-display tracking-wide uppercase text-xs"
            >
              Oferta de Capacidade (POC)
            </Link>
          </div>
        </div>

        {/* Efeito decorativo sutil com a curva vermelha/azul do logo */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-[#e30613]/10 pointer-events-none blur-3xl" />
        <div className="absolute right-32 top-0 w-64 h-64 rounded-full bg-blue-500/10 pointer-events-none blur-3xl" />
      </section>

      {/* BLOCO DE TARIFA EM DESTAQUE (REPRODUÇÃO FIEL AO QUADRO CONTRATO EXTRAORDINÁRIO) */}
      {!carregandoTarifa && tarifa && tarifa.ativo && (
        <section aria-label="Quadro de Tarifa em Destaque">
          <QuadroTarifaDestaque tarifa={tarifa} />
        </section>
      )}

      {/* 3 CARDS INFORMATIVOS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: A Companhia */}
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
          <CardHeader className="pb-3 flex flex-row items-center gap-3 space-y-0">
            <div className="p-2.5 rounded-lg bg-blue-50 text-[#143b73]">
              <Building2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold text-[#0a1d37] font-display">
              A Companhia
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 leading-relaxed space-y-2">
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
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 flex flex-row items-center gap-3 space-y-0">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-[#059669]">
                <Network className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-bold text-[#0a1d37] font-display">
                Malha de Gasodutos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 leading-relaxed space-y-2">
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
            <div className="p-3.5 m-4 mt-0 rounded-md bg-blue-50/80 border border-blue-200/90 text-xs text-slate-700 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#0a1d37]">
                <ShieldAlert className="h-3.5 w-3.5 text-[#e30613] shrink-0" />
                <span className="font-display">Segurança das Faixas de Servidão</span>
                <Badge
                  variant="outline"
                  className="bg-white text-[#143b73] border-blue-300 text-[9px] font-mono ml-auto"
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
                  className="text-[10px] font-bold text-[#143b73] hover:underline"
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
                      className="text-[10px] text-slate-500 hover:text-[#143b73] inline-flex items-center gap-1"
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
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
          <CardHeader className="pb-3 flex flex-row items-center gap-3 space-y-0">
            <div className="p-2.5 rounded-lg bg-red-50 text-[#e30613]">
              <Headphones className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold text-[#0a1d37] font-display">
              Atendimento ao Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 leading-relaxed space-y-2">
            <p>
              Canal direto para carregadores, agentes da cadeia de suprimento de gás natural e
              interessados no acesso aberto à infraestrutura.
            </p>
            <p>
              Atendimento técnico e comercial para solicitações de acesso (Inciso VII), cessão de
              capacidade (Inciso VIII) e informações regulatórias da ANP.
            </p>
            <div className="pt-2">
              <span className="text-xs font-semibold text-[#0a1d37] block">
                Contato Operacional &amp; Regulatório:
              </span>
              <span className="text-xs text-[#143b73] font-semibold">
                regulacao@tsb.com.br | (51) 3210-0000
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
