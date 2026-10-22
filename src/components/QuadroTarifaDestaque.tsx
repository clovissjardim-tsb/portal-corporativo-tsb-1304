import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowDownRight, ArrowUpRight, Flame, ShieldCheck } from 'lucide-react'
import type { QuadroTarifa } from '@/services/tarifa'

interface QuadroTarifaProps {
  tarifa: QuadroTarifa
}

/**
 * Renderiza o texto explicativo destacando "ex-impostos" com um chip/badge azul translúcido sutil
 * ou tag estilizada que se integra ao visual premium do portal.
 */
function renderTextoExplicativo(texto: string) {
  if (!texto) return null

  // Divide para destacar "ex-impostos" (case-insensitive)
  const regex = /(ex-impostos)/gi
  const partes = texto.split(regex)

  return (
    <>
      {partes.map((parte, i) => {
        if (parte.toLowerCase() === 'ex-impostos') {
          return (
            <span
              key={i}
              className="inline-flex items-center mx-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300"
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

/**
 * Componente QuadroTarifaDestaque
 *
 * Design premium e harmônico com a identidade visual do portal TSB:
 * - Card moderno com cantos arredondados, borda elegante e sombra suave.
 * - Cabeçalho com o gradiente corporativo TSB: linear-gradient(135deg, #0a2540 0%, #0369a1 60%, #0284c7 100%).
 * - Valor principal em card próprio com selo "Referência Oficial".
 * - Bloco de correspondência energética (R$/MM Btu).
 * - Dois cards de Entrada e Saída com ícones direcionais (ArrowDownRight azul e ArrowUpRight verde).
 * - Chip para "ex-impostos".
 * - Exibe SOMENTE as informações oficiais do quadro (sem textos ou notas inventadas).
 */
export function QuadroTarifaDestaque({ tarifa }: QuadroTarifaProps) {
  if (!tarifa.ativo) {
    return null
  }

  return (
    <div className="w-full flex justify-center my-2">
      <Card className="w-full max-w-4xl border border-slate-200 shadow-xs rounded-xl overflow-hidden bg-white">
        {/* CABEÇALHO SÓBRIO COM MESMA HIERARQUIA DA TRANSPARÊNCIA */}
        <div className="px-6 py-6 sm:px-8 sm:py-7 bg-white border-b border-slate-200">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#143b73] tracking-wide uppercase font-display">
              <span>Regulação ANP</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-normal normal-case">Tarifa Homologada</span>
              {tarifa.ano_vigencia && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-700 font-medium normal-case">
                    Vigência {tarifa.ano_vigencia}
                  </span>
                </>
              )}
            </div>

            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a2540] font-display">
              {tarifa.titulo}
            </CardTitle>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-5">
          {/* TEXTO EXPLICATIVO (VARIAÇÃO IGP-M / IPCA COM "EX-IMPOSTOS" DESTACADO) */}
          <div className="p-3.5 sm:p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            {renderTextoExplicativo(tarifa.texto_explicativo)}
          </div>

          {/* VALOR PRINCIPAL E CORRESPONDÊNCIA ENERGÉTICA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card do Valor Principal */}
            <div className="p-4 sm:p-5 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-display">
                  Valor da Tarifa
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-display">
                  <ShieldCheck className="h-3 w-3 text-[#0a2540]" />
                  Referência Oficial
                </span>
              </div>
              <div className="pt-1">
                <span className="text-xs text-slate-500 font-medium block font-sans">
                  R$/Mil m³
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] tracking-tight font-display">
                  {tarifa.valor_mil_m3}
                </span>
              </div>
            </div>

            {/* Card da Correspondência Energética */}
            <div className="p-4 sm:p-5 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-display">
                  Correspondência Energética
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-display">
                  <Flame className="h-3 w-3 text-slate-600" />
                  Base Térmica
                </span>
              </div>
              <div className="pt-1">
                <span className="text-xs text-slate-500 font-medium block font-sans">
                  Que corresponde a R$/MM Btu
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] tracking-tight font-display">
                  {tarifa.valor_mmbtu}
                </span>
              </div>
            </div>
          </div>

          {/* DESDOBRAMENTO: CARDS DE 70% ENTRADA E 30% SAÍDA */}
          <div className="space-y-3 pt-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block font-display">
              Desdobramento por Ponto de Transporte
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card de Entrada (ex: 70% Entrada) */}
              <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="p-1.5 rounded bg-slate-100 text-[#0a2540]">
                    <ArrowDownRight className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0a2540] leading-none font-display">
                      {tarifa.entrada_percentual}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Ponto de Injeção (Entrada)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">R$/MM Btu</span>
                    <span className="text-base sm:text-lg font-bold text-slate-900 font-display">
                      {tarifa.entrada_valor_mmbtu}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">R$/Mil m³</span>
                    <span className="text-base sm:text-lg font-bold text-slate-900 font-display">
                      {tarifa.entrada_valor_mil_m3}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card de Saída (ex: 30% Saída) */}
              <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="p-1.5 rounded bg-slate-100 text-[#0a2540]">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0a2540] leading-none font-display">
                      {tarifa.saida_percentual}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Ponto de Retirada (Saída)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">R$/MM Btu</span>
                    <span className="text-base sm:text-lg font-bold text-slate-900 font-display">
                      {tarifa.saida_valor_mmbtu}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">R$/Mil m³</span>
                    <span className="text-base sm:text-lg font-bold text-slate-900 font-display">
                      {tarifa.saida_valor_mil_m3}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
