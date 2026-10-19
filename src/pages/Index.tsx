import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Building2, Network, Headphones, Shield, ArrowRight } from 'lucide-react'

export default function Index() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* HERO CARD */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0a2540 0%, #0284c7 100%)',
        }}
        className="text-white rounded-xl p-8 sm:p-12 shadow-md relative overflow-hidden"
      >
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-sky-200 border border-white/20">
            <Shield className="h-3.5 w-3.5" />
            Infraestrutura Dutoviária Estratégica do Sul do Brasil
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
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
              className="inline-flex items-center gap-2 bg-white text-[#0a2540] hover:bg-slate-100 font-semibold px-4 py-2.5 rounded-md text-sm transition-colors shadow-sm"
            >
              Consultar Transparência Regulatória
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/poc"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-md text-sm transition-colors border border-white/30"
            >
              Oferta de Capacidade (POC)
            </Link>
          </div>
        </div>

        {/* Efeito decorativo sutil de fundo */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-white/5 pointer-events-none blur-2xl" />
      </section>

      {/* 3 CARDS INFORMATIVOS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: A Companhia */}
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
          <CardHeader className="pb-3 flex flex-row items-center gap-3 space-y-0">
            <div className="p-2.5 rounded-lg bg-sky-50 text-[#0284c7]">
              <Building2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold text-[#0a2540]">A Companhia</CardTitle>
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
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
          <CardHeader className="pb-3 flex flex-row items-center gap-3 space-y-0">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-[#059669]">
              <Network className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold text-[#0a2540]">Malha de Gasodutos</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 leading-relaxed space-y-2">
            <p>
              O sistema dutoviário da TSB abrange trechos estratégicos entre a fronteira oeste
              (Uruguaiana) e o Polo Petroquímico de Triunfo/Porto Alegre.
            </p>
            <p>
              Operamos com modernas Estações de Medição e Regulagem de Pressão (EMEDs), sistemas de
              supervisão SCADA de alta precisão e integridade estrutural contínua de dutos.
            </p>
          </CardContent>
        </Card>

        {/* CARD 3: Atendimento ao Cliente */}
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
          <CardHeader className="pb-3 flex flex-row items-center gap-3 space-y-0">
            <div className="p-2.5 rounded-lg bg-amber-50 text-[#d97706]">
              <Headphones className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold text-[#0a2540]">
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
              <span className="text-xs font-semibold text-[#0a2540] block">
                Contato Operacional &amp; Regulatório:
              </span>
              <span className="text-xs text-[#0284c7] font-medium">
                regulacao@tsb.com.br | (51) 3210-0000
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
