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
  // Novos campos do Modelo Misto (v0.0.25)
  publicada?: boolean
  arquivo_formulario?: string
  cnpj?: string
  representante_legal?: string
  modalidade?: string
  ponto_recebimento?: string
  ponto_entrega?: string
  operador_cadastro?: string
}

export interface OfertaCessaoPublica {
  id: string
  referencia: string
  cedente: string
  trecho: string
  capacidade_ociosa: number
  periodo_contratual: string
  modalidade?: string
  ponto_recebimento?: string
  ponto_entrega?: string
  observacoes?: string
  status: string
  created: string
}

export type NovaOfertaCessaoInternaInput = {
  cedente: string
  trecho: string
  capacidade_ociosa: number
  periodo_contratual: string
  contato: string
  observacoes?: string
  cnpj?: string
  representante_legal?: string
  modalidade?: string
  ponto_recebimento?: string
  ponto_entrega?: string
  publicada?: boolean
  arquivo_formulario?: File | null
  status?: 'Disponível' | 'Em Negociação' | 'Concluída' | 'Cancelada'
}

export type EditarOfertaCessaoInput = Partial<NovaOfertaCessaoInternaInput>

export const cessoesService = {
  /**
   * Lista ofertas de cessão para exibição PÚBLICA (100% LGPD-compliant).
   * Não expõe e-mails, telefones ou contatos comerciais de solicitantes/carregadores.
   * Utiliza o endpoint sanitizado do backend, que filtra exclusivamente publicada = true.
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

    // Se estiver autenticado ou rota indisponível, tenta via SDK filtrando publicada = true
    try {
      const records = await pb
        .collection<OfertaCessaoIncisoVIII>('ofertas_cessao_inciso_viii')
        .getFullList({
          filter: 'publicada = true',
          sort: '-created',
        })
      return records.map((r) => ({
        id: r.id,
        referencia: 'CES-' + r.id.substring(0, 8).toUpperCase(),
        cedente: r.cedente,
        trecho: r.trecho,
        capacidade_ociosa: r.capacidade_ociosa,
        periodo_contratual: r.periodo_contratual,
        modalidade: r.modalidade,
        ponto_recebimento: r.ponto_recebimento,
        ponto_entrega: r.ponto_entrega,
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
   * Contém os dados de contato completos e arquivos anexados para a equipe operacional da TSB.
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
   * Alterna publicação da oferta (visibilidade pública no portal).
   */
  async togglePublicada(id: string, publicada: boolean): Promise<OfertaCessaoIncisoVIII> {
    return await pb.collection<OfertaCessaoIncisoVIII>('ofertas_cessao_inciso_viii').update(id, {
      publicada,
    })
  },

  /**
   * Cadastra nova oferta de cessão na Gestão Interna a partir do formulário PDF recebido por e-mail.
   * Suporta anexo do próprio PDF assinado pelo carregador.
   */
  async cadastrarInterno(data: NovaOfertaCessaoInternaInput): Promise<OfertaCessaoIncisoVIII> {
    const formData = new FormData()
    formData.append('cedente', data.cedente)
    formData.append('trecho', data.trecho)
    formData.append('capacidade_ociosa', String(data.capacidade_ociosa))
    formData.append('periodo_contratual', data.periodo_contratual)
    formData.append('contato', data.contato)
    formData.append('status', data.status || 'Disponível')
    formData.append('publicada', String(data.publicada ?? false))

    if (data.observacoes) formData.append('observacoes', data.observacoes)
    if (data.cnpj) formData.append('cnpj', data.cnpj)
    if (data.representante_legal) formData.append('representante_legal', data.representante_legal)
    if (data.modalidade) formData.append('modalidade', data.modalidade)
    if (data.ponto_recebimento) formData.append('ponto_recebimento', data.ponto_recebimento)
    if (data.ponto_entrega) formData.append('ponto_entrega', data.ponto_entrega)

    // Grava identificação do operador logado
    const authModel = pb.authStore.record
    if (authModel) {
      const opInfo = (authModel.name as string) || (authModel.email as string) || authModel.id
      formData.append('operador_cadastro', opInfo)
    }

    if (data.arquivo_formulario) {
      formData.append('arquivo_formulario', data.arquivo_formulario)
    }

    return await pb
      .collection<OfertaCessaoIncisoVIII>('ofertas_cessao_inciso_viii')
      .create(formData)
  },

  /**
   * Edita uma oferta existente na Gestão Interna.
   */
  async editarInterno(id: string, data: EditarOfertaCessaoInput): Promise<OfertaCessaoIncisoVIII> {
    const formData = new FormData()
    if (data.cedente !== undefined) formData.append('cedente', data.cedente)
    if (data.trecho !== undefined) formData.append('trecho', data.trecho)
    if (data.capacidade_ociosa !== undefined) {
      formData.append('capacidade_ociosa', String(data.capacidade_ociosa))
    }
    if (data.periodo_contratual !== undefined) {
      formData.append('periodo_contratual', data.periodo_contratual)
    }
    if (data.contato !== undefined) formData.append('contato', data.contato)
    if (data.status !== undefined) formData.append('status', data.status)
    if (data.publicada !== undefined) formData.append('publicada', String(data.publicada))
    if (data.observacoes !== undefined) formData.append('observacoes', data.observacoes)
    if (data.cnpj !== undefined) formData.append('cnpj', data.cnpj)
    if (data.representante_legal !== undefined) {
      formData.append('representante_legal', data.representante_legal)
    }
    if (data.modalidade !== undefined) formData.append('modalidade', data.modalidade)
    if (data.ponto_recebimento !== undefined) {
      formData.append('ponto_recebimento', data.ponto_recebimento)
    }
    if (data.ponto_entrega !== undefined) formData.append('ponto_entrega', data.ponto_entrega)

    if (data.arquivo_formulario) {
      formData.append('arquivo_formulario', data.arquivo_formulario)
    }

    return await pb
      .collection<OfertaCessaoIncisoVIII>('ofertas_cessao_inciso_viii')
      .update(id, formData)
  },

  /**
   * Exclui uma oferta de cessão na Gestão Interna.
   */
  async excluirInterno(id: string): Promise<boolean> {
    return await pb.collection('ofertas_cessao_inciso_viii').delete(id)
  },

  /**
   * Retorna a URL para download/visualização segura do arquivo de PDF anexado.
   */
  obterUrlArquivo(record: OfertaCessaoIncisoVIII): string | null {
    if (!record.arquivo_formulario) return null
    return pb.files.getURL(record, record.arquivo_formulario)
  },

  /**
   * Obter e salvar o e-mail oficial de recebimento de cessões nas configurações da transparência.
   */
  async obterEmailRecebimento(): Promise<string> {
    try {
      const item = await pb
        .collection('transparencia_conteudo')
        .getFirstListItem("chave = 'email_recebimento_cessoes'")
      if (item && item.descricao) {
        return item.descricao.trim()
      }
    } catch {
      // Ignora erro
    }
    return 'acesso@tsb.com.br'
  },

  async salvarEmailRecebimento(novoEmail: string): Promise<string> {
    const emailLimpo = novoEmail.trim()
    try {
      const item = await pb
        .collection('transparencia_conteudo')
        .getFirstListItem("chave = 'email_recebimento_cessoes'")
      await pb.collection('transparencia_conteudo').update(item.id, {
        descricao: emailLimpo,
        titulo: 'Canal Oficial para Recebimento de Solicitações de Cessão',
      })
      return emailLimpo
    } catch {
      // Cria se não existir
      try {
        await pb.collection('transparencia_conteudo').create({
          secao: 'cabecalho',
          chave: 'email_recebimento_cessoes',
          titulo: 'Canal Oficial para Recebimento de Solicitações de Cessão',
          descricao: emailLimpo,
          ativo: true,
          ordem: 99,
        })
      } catch (e) {
        console.warn('Erro ao salvar e-mail em transparencia_conteudo:', e)
      }
      return emailLimpo
    }
  },
}
