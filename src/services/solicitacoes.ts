import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface SolicitacaoIncisoVII extends RecordModel {
  razao_social: string
  cnpj: string
  email: string
  modalidade: 'Firme Ordinário' | 'Interruptível'
  capacidade: number
  trecho: string
  protocolo: string
  status:
    | 'Solicitação Recebida - Em Análise Técnica'
    | 'Em Análise Técnica'
    | 'Aguardando Documentação'
    | 'Aprovada'
    | 'Rejeitada'
  sla_dias: number
}

export type NovaSolicitacaoInput = {
  razao_social: string
  cnpj: string
  email: string
  modalidade: 'Firme Ordinário' | 'Interruptível'
  capacidade: number
  trecho: string
}

export function gerarNumeroProtocolo(): string {
  const ano = new Date().getFullYear()
  const random4 = Math.floor(1000 + Math.random() * 9000)
  return `TSB-${ano}-${random4}`
}

export const solicitacoesService = {
  async listar(): Promise<SolicitacaoIncisoVII[]> {
    return await pb.collection<SolicitacaoIncisoVII>('solicitacoes_inciso_vii').getFullList({
      sort: '-created',
    })
  },

  async buscarPorProtocolo(protocolo: string): Promise<SolicitacaoIncisoVII | null> {
    try {
      const cleanProto = protocolo.trim().toUpperCase()
      const record = await pb
        .collection<SolicitacaoIncisoVII>('solicitacoes_inciso_vii')
        .getFirstListItem(`protocolo = "${cleanProto}"`)
      return record
    } catch {
      return null
    }
  },

  async criar(data: NovaSolicitacaoInput): Promise<SolicitacaoIncisoVII> {
    const protocolo = gerarNumeroProtocolo()
    return await pb.collection<SolicitacaoIncisoVII>('solicitacoes_inciso_vii').create({
      ...data,
      protocolo,
      status: 'Solicitação Recebida - Em Análise Técnica',
      sla_dias: 20,
    })
  },

  async atualizarStatus(
    id: string,
    status: SolicitacaoIncisoVII['status'],
    sla_dias?: number,
  ): Promise<SolicitacaoIncisoVII> {
    return await pb.collection<SolicitacaoIncisoVII>('solicitacoes_inciso_vii').update(id, {
      status,
      ...(sla_dias !== undefined ? { sla_dias } : {}),
    })
  },
}
