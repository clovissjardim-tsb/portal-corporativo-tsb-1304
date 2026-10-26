import { useState, useEffect } from 'react'
import { QuadroTarifaDestaque } from '@/components/QuadroTarifaDestaque'
import { tarifaService, type QuadroTarifa, TARIFA_SEED_FALLBACK } from '@/services/tarifa'

export default function Index() {
  const [tarifa, setTarifa] = useState<QuadroTarifa | null>(null)
  const [carregandoTarifa, setCarregandoTarifa] = useState(true)

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
    </div>
  )
}
