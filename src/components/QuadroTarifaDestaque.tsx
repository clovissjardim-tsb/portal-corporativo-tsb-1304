import React from 'react'
import type { QuadroTarifa } from '@/services/tarifa'
import {
  FileText,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  Flame,
  Info,
  Calendar,
  Layers,
} from 'lucide-react'

interface QuadroTarifaProps {
  tarifa: QuadroTarifa
}

/**
 * Renderiza o texto explicativo destacando "ex-impostos" de forma moderna e elegante:
 * como uma tag/badge destacada em conjunto com sublinhado e negrito,
 * mantendo conformidade textual e rigor regulatório.
 */
function renderTextoFormatado(texto: string) {
  if (!texto) return null

  // Substitui "ex-impostos" por tag destacada
  const regex = /(ex-impostos)/gi
  const partes = texto.split(regex)

  return (
    <>
      {partes.map((parte, i) => {
        if (parte.toLowerCase() === 'ex-impostos') {
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-full bg-sky-100 text-[#0369a1] font-bold text-xs uppercase tracking-wider underline underline-offset-2 border border-sky-200 align-middle shadow-2xs"
            >
              {parte}
            </span>
          )
        }
        return <React.Fragment key={i}>{parte}</React.Fragment>
      })}
    </>
  )
}

export function QuadroTarifaDestaque({ tarifa }: QuadroTarifaProps) {
  if (!tarifa.ativo) {
    return null
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-2 rounded-2xl bg-white border border-slate-200/90 shadow-[0_10px_30px_-5px_rgba(10,37,64,0.08)] hover:shadow-[0_16px_36px_-6px_rgba(10,37,64,0.12)] transition-all duration-300 overflow-hidden font-sans group">
      {/* HEADER PREMIUM COM GRADIENTE INSTITUCIONAL #0a2540 -> #0284c7 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0a2540 0%, #0369a1 60%, #0284c7 100%)',
        }}
        className="relative px-6 py-5 sm:px-8 sm:py-6 text-white overflow-hidden"
      >
        {/* Detalhe de fundo decorativo com brilho sutil */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none blur-2xl" />
        <div className="absolute top-0 right-1/4 w-32 h-32 rounded-full bg-sky-400/10 pointer-events-none blur-xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-sky-200 border border-white/20 text-[11px] font-semibold tracking-wide uppercase">
              <FileText className="h-3 w-3 text-sky-300" />
              <span>Regulatório ANP &bull; Contrato Vigente</span>
            </div>
            <h2 className="font-extrabold text-base sm:text-lg md:text-xl tracking-tight text-white uppercase leading-snug">
              {tarifa.titulo}
            </h2>
          </div>

          {tarifa.ano_vigencia && (
            <div className="shrink-0 self-start sm:self-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 text-white border border-white/20 text-xs font-bold backdrop-blur-xs">
                <Calendar className="h-3.5 w-3.5 text-sky-300" />
                <span>Exercício {tarifa.ano_vigencia}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL DO QUADRO */}
      <div className="p-6 sm:p-8 space-y-6 bg-linear-to-b from-white to-slate-50/50">
        {/* TEXTO EXPLICATIVO (VARIAÇÃO IGP-M / IPCA) */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs sm:text-sm leading-relaxed">
          <Info className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-[#0a2540] block text-xs uppercase tracking-wide">
              Condições de Reajuste &amp; Base Tributária:
            </span>
            <p className="text-slate-600 font-normal">
              {renderTextoFormatado(tarifa.texto_explicativo)}
            </p>
          </div>
        </div>

        {/* HERO DOS VALORES PRINCIPAIS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          {/* Card Principal: R$/Mil m³ */}
          <div className="md:col-span-7 rounded-xl p-5 bg-gradient-to-br from-white to-sky-50/40 border-2 border-sky-100 shadow-xs flex flex-col justify-between relative overflow-hidden group/primary hover:border-sky-300 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-bl-full pointer-events-none" />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-[#0284c7]" />
                  Tarifa Principal do Contrato
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wide border border-emerald-200">
                  Referência Oficial
                </span>
              </div>
              <div className="text-xs text-slate-600">Valor homologado por mil metros cúbicos</div>
            </div>

            <div className="pt-4 pb-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-600">R$/Mil m³ :</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-[#0a2540] font-mono tracking-tight group-hover/primary:text-[#0284c7] transition-colors">
                  {tarifa.valor_mil_m3}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100 flex items-center gap-1.5">
              <TrendingDown className="h-3 w-3 text-[#0284c7]" />
              <span>Base para transporte contínuo no trecho T3</span>
            </div>
          </div>

          {/* Card Correspondência: R$/MM Btu */}
          <div className="md:col-span-5 rounded-xl p-5 bg-slate-50/90 border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Layers className="h-3.5 w-3.5 text-slate-600" />
                Correspondência Energética
              </div>
              <div className="text-xs text-slate-600">Conversão para unidade térmica (MM Btu)</div>
            </div>

            <div className="pt-4 pb-1">
              <div className="text-xs text-slate-500">Que corresponde a:</div>
              <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-600">R$/MM Btu</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {tarifa.valor_mmbtu}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200/80">
              Índice energético padronizado
            </div>
          </div>
        </div>

        {/* COMPONENTES DE ENTRADA (70%) E SAÍDA (30%) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0a2540] flex items-center gap-1.5">
              <span>Desdobramento do Ponto de Transporte (Tarifa Binômia)</span>
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Alocação Entrada (70%) / Saída (30%)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* PARCELA DE ENTRADA */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-sm transition-all duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-50 text-[#0284c7] border border-sky-100">
                    <ArrowDownRight className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0a2540] block">
                      {tarifa.entrada_percentual}
                    </span>
                    <span className="text-[10px] text-slate-500">Ponto de Injeção de Gás</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-mono">
                  70%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    R$/MM Btu
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                    {tarifa.entrada_valor_mmbtu}
                  </span>
                </div>
                <div className="space-y-0.5 border-l border-slate-100 pl-3">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    R$/Mil m³
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#0a2540] font-mono">
                    {tarifa.entrada_valor_mil_m3}
                  </span>
                </div>
              </div>
            </div>

            {/* PARCELA DE SAÍDA */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-[#059669] border border-emerald-100">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0a2540] block">
                      {tarifa.saida_percentual}
                    </span>
                    <span className="text-[10px] text-slate-500">Ponto de Retirada / Entrega</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                  30%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    R$/MM Btu
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                    {tarifa.saida_valor_mmbtu}
                  </span>
                </div>
                <div className="space-y-0.5 border-l border-slate-100 pl-3">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    R$/Mil m³
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#0a2540] font-mono">
                    {tarifa.saida_valor_mil_m3}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NOTA INSTITUCIONAL / RODAPÉ DO QUADRO */}
        <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0284c7]" />
            Tarifa extraordinária regulamentada para o Trecho T3 &bull; TSB S.A.
          </span>
          <span className="font-mono text-[10px] text-slate-400">
            Valores sujeitos a homologação oficial da ANP
          </span>
        </div>
      </div>
    </div>
  )
}
