import React from 'react'
import type { QuadroTarifa } from '@/services/tarifa'

interface QuadroTarifaProps {
  tarifa: QuadroTarifa
}

/**
 * Renderiza o texto explicativo destacando "ex-impostos" com negrito e sublinhado simples,
 * conforme o layout oficial publicado da TSB.
 */
function renderTextoExplicativo(texto: string) {
  if (!texto) return null

  // Divide para aplicar sublinhado em "ex-impostos" (case-insensitive) mantendo o negrito
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

/**
 * Componente QuadroTarifaDestaque
 *
 * Reproduz EXATAMENTE o layout do quadro oficial publicado no site da TSB:
 * - Caixa retangular única com borda preta sólida (1.5px a 2px) e fundo branco
 * - Sem cards internos, sem gradientes, sem ícones, badges ou chips
 * - Título centralizado em azul (#1f5fa9), negrito, tamanho destacado
 * - Texto explicativo em negrito preto, alinhado à esquerda, com "ex-impostos" sublinhado
 * - Linha de valor principal em VERMELHO e negrito: "R$/Mil m³ : <valor>"
 * - Linha da correspondência térmica em negrito preto: "Que corresponde a R$/MM Btu <valor>"
 * - Linhas do desdobramento de Entrada e Saída em negrito preto com alinhamento tabular fiel
 * - Todos os valores continuam dinâmicos a partir da coleção `quadro_tarifa` / serviço
 */
export function QuadroTarifaDestaque({ tarifa }: QuadroTarifaProps) {
  if (!tarifa.ativo) {
    return null
  }

  return (
    <div className="w-full flex justify-center my-3">
      <div
        className="w-full max-w-4xl bg-white border-2 border-black p-5 sm:p-7 text-black font-sans leading-relaxed text-sm sm:text-base selection:bg-slate-200"
        style={{
          borderColor: '#000000',
        }}
      >
        {/* TÍTULO DO QUADRO: Azul corporativo (#1f5fa9), negrito, centralizado */}
        <h2
          className="text-center font-bold text-lg sm:text-xl md:text-2xl uppercase tracking-normal mb-5 leading-snug"
          style={{ color: '#1f5fa9' }}
        >
          {tarifa.titulo}
        </h2>

        <div className="space-y-4">
          {/* TEXTO EXPLICATIVO: Negrito preto, alinhado à esquerda, "ex-impostos" sublinhado */}
          <p className="font-bold text-black text-left leading-normal">
            {renderTextoExplicativo(tarifa.texto_explicativo)}
          </p>

          {/* VALOR PRINCIPAL: Vermelho (#cc0000 / #c00000), negrito, destaque de tamanho */}
          <div className="pt-1">
            <span
              className="font-bold text-base sm:text-lg tracking-tight"
              style={{ color: '#c00000' }}
            >
              R$/Mil m³ : {tarifa.valor_mil_m3}
            </span>
          </div>

          {/* CORRESPONDÊNCIA ENERGÉTICA: Negrito preto */}
          <div>
            <span className="font-bold text-black">
              Que corresponde a R$/MM Btu {tarifa.valor_mmbtu}
            </span>
          </div>

          {/* DESDOBRAMENTO ENTRADA / SAÍDA: Negrito preto, alinhamento limpo */}
          <div className="space-y-1 pt-1 font-bold text-black">
            {/* Linha de Entrada: "70% Entrada : R$/MM Btu 1,1089 R$/Mil m³ 41,3628" */}
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span>{tarifa.entrada_percentual} :</span>
              <span className="inline-flex flex-wrap items-baseline gap-x-3">
                <span>R$/MM Btu {tarifa.entrada_valor_mmbtu}</span>
                <span>R$/Mil m³ {tarifa.entrada_valor_mil_m3}</span>
              </span>
            </div>

            {/* Linha de Saída: "30% Saída :    R$/ MM Btu 0,4775 R$/Mil m³ 17,8122" */}
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span>{tarifa.saida_percentual} :</span>
              <span className="inline-flex flex-wrap items-baseline gap-x-3 sm:ml-1">
                <span>R$/ MM Btu {tarifa.saida_valor_mmbtu}</span>
                <span>R$/Mil m³ {tarifa.saida_valor_mil_m3}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
