import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface OfertaCessaoIncisoVIII extends RecordModel {
  cedente: string
  trecho: string
  capacidade_ociosa: number
  periodo_contratual: string
  contato?: string
  referencia?: string
  observacoes?: string
  status?: 'Disponível' | 'Em Negociação' | 'Concluída' | 'Cancelada'
}

export interface OfertaCessaoPublica {
  id: string
  referencia: string
  cedente: string
  trecho: string
  capacidade_ociosa: number
  periodo_contratual: string
  observacoes?: string
  status: string
  created: string
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
  /**
   * Lista ofertas de cessão para exibição PÚBLICA (100% LGPD-compliant).
   * Não expõe e-mails, telefones ou contatos comerciais de solicitantes/carregadores.
   * Utiliza o endpoint sanitizado do backend.
   */
  async listarPublico(): Promise<OfertaCessaoPublica[]> {
    try {
      const res = await fetch(`${pb.baseUrl}/backend/v1/public/ofertas-cessao`)
      if (res.ok) {
        return (await res.json()) as OfertaCessaoPublica[]
      }
    } catch {
      // Fallback gracioso
    }

    // Se estiver autenticado, tenta via SDK e remove dados pessoais se for exibir em público
    try {
      const records = await pb
        .collection<OfertaCessaoIncisoVIII>('ofertas_cessao_inciso_viii')
        .getFullList({
          sort: '-created',
        })
      return records.map((r) => ({
        id: r.id,
        referencia: 'CES-' + r.id.substring(0, 8).toUpperCase(),
        cedente: r.cedente,
        trecho: r.trecho,
        capacidade_ociosa: r.capacidade_ociosa,
        periodo_contratual: r.periodo_contratual,
        observacoes: r.observacoes,
        status: r.status || 'Disponível',
        created: r.created,
      }))
    } catch {
      return []
    }
  },

  /**
   * Lista completa para uso EXCLUSIVO na Gestão Interna (/gestao) - Requer Autenticação.
   * Contém os dados de contato completos para a equipe operacional da TSB.
   */
  async listarInterno(): Promise<OfertaCessaoIncisoVIII[]> {
    try {
      return await pb.collection<OfertaCessaoIncisoVIII>('ofertas_cessao_inciso_viii').getFullList({
        sort: '-created',
      })
    } catch {
      return []
    }
  },

  // Mantido para compatibilidade retroativa
  async listar(): Promise<OfertaCessaoIncisoVIII[]> {
    return this.listarInterno()
  },

  /**
   * Atualiza status da oferta na Gestão Interna
   */
  async atualizarStatus(
    id: string,
    status: 'Disponível' | 'Em Negociação' | 'Concluída' | 'Cancelada',
  ): Promise<OfertaCessaoIncisoVIII> {
    return await pb.collection<OfertaCessaoIncisoVIII>('ofertas_cessao_inciso_viii').update(id, {
      status,
    })
  },

  /**
   * Cadastro público de nova oferta de cessão.
   * O contato comercial é gravado no banco restrito para que a equipe TSB intermedie / contacte,
   * mas NUNCA é exposto em telas ou rotas públicas.
   */
  async criar(data: NovaOfertaCessaoInput): Promise<OfertaCessaoIncisoVIII> {
    return await pb.collection<OfertaCessaoIncisoVIII>('ofertas_cessao_inciso_viii').create({
      ...data,
      status: 'Disponível',
    })
  },
}
