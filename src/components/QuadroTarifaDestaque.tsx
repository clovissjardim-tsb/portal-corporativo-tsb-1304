import React from 'react'
import type { QuadroTarifa } from '@/services/tarifa'

interface QuadroTarifaProps {
  tarifa: QuadroTarifa
}

/**
 * Renderiza o texto explicativo destacando "ex-impostos" sublinhado e em negrito,
 * exatamente como visualizado no quadro institucional.
 */
function renderTextoFormatado(texto: string) {
  if (!texto) return null

  // Substitui "ex-impostos" por <u><strong>ex-impostos</strong></u>
  const regex = /(ex-impostos)/gi
  const partes = texto.split(regex)

  return (
    <>
      {partes.map((parte, i) => {
        if (parte.toLowerCase() === 'ex-impostos') {
          return (
            <span key={i} className="underline font-bold">
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
    <div
      className="bg-white border border-[#1f5fa9] rounded-sm p-6 sm:p-8 shadow-xs max-w-4xl mx-auto my-2 transition-all font-sans"
      style={{
        borderColor: '#1f5fa9',
      }}
    >
      {/* Título centralizado em azul #1f5fa9 aproximado */}
      <h2
        className="text-center font-bold text-lg sm:text-xl md:text-2xl tracking-wide mb-6 uppercase"
        style={{ color: '#1f5fa9' }}
      >
        {tarifa.titulo}
      </h2>

      {/* Conteúdo do quadro */}
      <div className="space-y-4 text-slate-900 text-sm sm:text-base leading-relaxed">
        {/* Texto explicativo */}
        <p className="font-medium text-slate-800">
          {renderTextoFormatado(tarifa.texto_explicativo)}
        </p>

        {/* Valor principal em destaque (vermelho, maior) */}
        <div className="pt-1">
          <span className="text-red-600 font-bold text-lg sm:text-xl md:text-2xl">
            R$/Mil m³ : {tarifa.valor_mil_m3}
          </span>
        </div>

        {/* Linha: Que corresponde a R$/MM Btu */}
        <div className="pt-2">
          <p className="font-semibold text-slate-800">
            Que corresponde a R$/MM Btu {tarifa.valor_mmbtu}
          </p>
        </div>

        {/* Linhas de Entrada e Saída */}
        <div className="pt-1 space-y-1.5 font-semibold text-slate-900">
          <p className="flex flex-wrap items-center gap-x-2">
            <span>{tarifa.entrada_percentual} :</span>
            <span className="text-slate-800">R$/MM Btu {tarifa.entrada_valor_mmbtu}</span>
            <span className="text-slate-400 font-normal">—</span>
            <span className="text-slate-800">R$/Mil m³ {tarifa.entrada_valor_mil_m3}</span>
          </p>

          <p className="flex flex-wrap items-center gap-x-2">
            <span>{tarifa.saida_percentual} :</span>
            <span className="text-slate-800">R$/MM Btu {tarifa.saida_valor_mmbtu}</span>
            <span className="text-slate-400 font-normal">—</span>
            <span className="text-slate-800">R$/Mil m³ {tarifa.saida_valor_mil_m3}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
