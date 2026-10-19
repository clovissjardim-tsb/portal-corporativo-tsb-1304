import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface OfertaCessaoIncisoVIII extends RecordModel {
  cedente: string
  trecho: string
  capacidade_ociosa: number
  periodo_contratual: string
  contato: string
  observacoes?: string
  status?: 'Disponível' | 'Em Negociação' | 'Concluída' | 'Cancelada'
}

export type NovaOfertaCessaoInput = {
  cedente: string
  trecho: string
  capacidade_ociosa: number
  periodo_contratual: string
  contato: string
  observacoes?: string
}

export const cessoesService = {
  async listar(): Promise<OfertaCessaoIncisoVIII[]> {
    try {
      return await pb.collection<OfertaCessaoIncisoVIII>('ofertas_cessao_inciso_viii').getFullList({
        sort: '-created',
      })
    } catch {
      return []
    }
  },

  async criar(data: NovaOfertaCessaoInput): Promise<OfertaCessaoIncisoVIII> {
    return await pb.collection<OfertaCessaoIncisoVIII>('ofertas_cessao_inciso_viii').create({
      ...data,
      status: 'Disponível',
    })
  },
}
