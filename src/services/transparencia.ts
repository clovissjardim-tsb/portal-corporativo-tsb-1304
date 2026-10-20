import pb from '@/lib/pocketbase/client'

export type SecaoTransparencia =
  | 'boletim_master'
  | 'boletim_secao1'
  | 'boletim_secao2'
  | 'plataforma_inciso'

export interface ItemTransparencia {
  id: string
  secao: SecaoTransparencia
  chave: string
  rotulo?: string
  titulo: string
  descricao?: string
  ordem?: number
  url_externa?: string
  arquivo?: string // nome do arquivo no storage PocketBase
  nome_arquivo_custom?: string
  ativo: boolean
  ano?: string
  mes?: string
  chave_periodo?: string
  url_secundaria?: string
  nome_url_secundaria?: string
  arquivo_secundario?: string
  created?: string
  updated?: string
  collectionId?: string
  collectionName?: string
}

export interface InputItemTransparencia {
  secao: SecaoTransparencia
  chave: string
  rotulo?: string
  titulo: string
  descricao?: string
  ordem?: number
  url_externa?: string
  nome_arquivo_custom?: string
  ativo: boolean
  ano?: string
  mes?: string
  chave_periodo?: string
  url_secundaria?: string
  nome_url_secundaria?: string
  arquivo?: File | null
  remover_arquivo?: boolean
  arquivo_secundario?: File | null
  remover_arquivo_secundario?: boolean
}

/**
 * Retorna a URL pública completa para baixar ou visualizar o arquivo armazenado no PocketBase,
 * ou fallback para a URL externa informada, ou string vazia.
 */
export function resolverUrlDocumento(
  item?: Partial<ItemTransparencia> | null,
  fallbackUrl: string = '',
): { url: string; isUpload: boolean; nomeExibicao: string } {
  if (!item) {
    return {
      url: fallbackUrl,
      isUpload: false,
      nomeExibicao: '- Baixar Arquivo',
    }
  }

  // 1. Prioridade: arquivo enviado via upload no PocketBase
  if (item.arquivo && item.id && item.collectionId) {
    const fileUrl = pb.files.getURL(item, item.arquivo)
    return {
      url: fileUrl,
      isUpload: true,
      nomeExibicao: item.nome_arquivo_custom?.trim() || item.arquivo,
    }
  }

  // 2. Segunda prioridade: URL externa editada
  if (item.url_externa && item.url_externa.trim()) {
    return {
      url: item.url_externa.trim(),
      isUpload: false,
      nomeExibicao: item.nome_arquivo_custom?.trim() || '- Baixar Arquivo',
    }
  }

  // 3. Fallback canônico
  return {
    url: fallbackUrl,
    isUpload: false,
    nomeExibicao: item.nome_arquivo_custom?.trim() || '- Baixar Arquivo',
  }
}

/**
 * Resolve a URL do documento secundário (ex.: fluxos físicos no item f ou RSTH Trecho 3)
 */
export function resolverUrlSecundaria(
  item?: Partial<ItemTransparencia> | null,
  fallbackUrl: string = '',
): { url: string; isUpload: boolean; nomeExibicao: string } {
  if (!item) {
    return {
      url: fallbackUrl,
      isUpload: false,
      nomeExibicao: item?.nome_url_secundaria || 'Arquivo Secundário',
    }
  }

  if (item.arquivo_secundario && item.id && item.collectionId) {
    const fileUrl = pb.files.getURL(item, item.arquivo_secundario)
    return {
      url: fileUrl,
      isUpload: true,
      nomeExibicao: item.nome_url_secundaria?.trim() || item.arquivo_secundario,
    }
  }

  if (item.url_secundaria && item.url_secundaria.trim()) {
    return {
      url: item.url_secundaria.trim(),
      isUpload: false,
      nomeExibicao: item.nome_url_secundaria?.trim() || 'Arquivo Secundário',
    }
  }

  return {
    url: fallbackUrl,
    isUpload: false,
    nomeExibicao: item.nome_url_secundaria?.trim() || 'Arquivo Secundário',
  }
}

export const transparenciaService = {
  /**
   * Lista todos os itens de uma seção (leitura pública sem necessidade de login)
   */
  async listarPorSecao(
    secao: SecaoTransparencia,
    apenasAtivos = false,
  ): Promise<ItemTransparencia[]> {
    try {
      const filter = apenasAtivos ? `secao = "${secao}" && ativo = true` : `secao = "${secao}"`

      const records = await pb.collection('transparencia_conteudo').getFullList<ItemTransparencia>({
        filter,
        sort: 'ordem,created',
        requestKey: null,
      })

      return records
    } catch (error) {
      console.warn(`[transparenciaService] Falha ao listar seção ${secao}:`, error)
      return []
    }
  },

  /**
   * Lista todos os itens de todas as seções (para a gestão interna ou cache completo)
   */
  async listarTodos(): Promise<ItemTransparencia[]> {
    try {
      return await pb.collection('transparencia_conteudo').getFullList<ItemTransparencia>({
        sort: 'secao,ordem,created',
        requestKey: null,
      })
    } catch (error) {
      console.warn('[transparenciaService] Falha ao listar todos os itens:', error)
      return []
    }
  },

  /**
   * Obtém um item específico pela chave e seção
   */
  async obterPorChave(secao: SecaoTransparencia, chave: string): Promise<ItemTransparencia | null> {
    try {
      return await pb
        .collection('transparencia_conteudo')
        .getFirstListItem<ItemTransparencia>(`secao = "${secao}" && chave = "${chave}"`, {
          requestKey: null,
        })
    } catch {
      return null
    }
  },

  /**
   * Cria ou atualiza um item na coleção transparencia_conteudo com suporte a upload de arquivo
   */
  async salvarItem(idOuChave: string, dados: InputItemTransparencia): Promise<ItemTransparencia> {
    const formData = new FormData()

    formData.append('secao', dados.secao)
    formData.append('chave', dados.chave)
    formData.append('titulo', dados.titulo)
    formData.append('rotulo', dados.rotulo || '')
    formData.append('descricao', dados.descricao || '')
    formData.append('ordem', String(dados.ordem ?? 1))
    formData.append('url_externa', dados.url_externa || '')
    formData.append('nome_arquivo_custom', dados.nome_arquivo_custom || '')
    formData.append('ativo', dados.ativo ? 'true' : 'false')

    if (dados.ano) formData.append('ano', dados.ano)
    if (dados.mes) formData.append('mes', dados.mes)
    if (dados.chave_periodo) formData.append('chave_periodo', dados.chave_periodo)
    if (dados.url_secundaria) formData.append('url_secundaria', dados.url_secundaria)
    if (dados.nome_url_secundaria) formData.append('nome_url_secundaria', dados.nome_url_secundaria)

    // Upload de arquivo principal
    if (dados.arquivo instanceof File) {
      formData.append('arquivo', dados.arquivo)
    } else if (dados.remover_arquivo) {
      formData.append('arquivo', '')
    }

    // Upload de arquivo secundário
    if (dados.arquivo_secundario instanceof File) {
      formData.append('arquivo_secundario', dados.arquivo_secundario)
    } else if (dados.remover_arquivo_secundario) {
      formData.append('arquivo_secundario', '')
    }

    // Se tiver id real existente no PocketBase, faz update
    try {
      // Tenta buscar se existe por id ou por chave+secao
      let registroExistente: ItemTransparencia | null = null
      if (idOuChave && !idOuChave.startsWith('novo_') && !idOuChave.startsWith('fallback_')) {
        try {
          registroExistente = await pb
            .collection('transparencia_conteudo')
            .getOne<ItemTransparencia>(idOuChave, { requestKey: null })
        } catch {
          // busca por chave+secao
        }
      }

      if (!registroExistente) {
        try {
          registroExistente = await pb
            .collection('transparencia_conteudo')
            .getFirstListItem<ItemTransparencia>(
              `secao = "${dados.secao}" && chave = "${dados.chave}"`,
              { requestKey: null },
            )
        } catch {
          registroExistente = null
        }
      }

      if (registroExistente) {
        return await pb
          .collection('transparencia_conteudo')
          .update<ItemTransparencia>(registroExistente.id, formData, {
            requestKey: null,
          })
      }

      // Se não existe, cria novo
      return await pb
        .collection('transparencia_conteudo')
        .create<ItemTransparencia>(formData, { requestKey: null })
    } catch (error) {
      console.error('[transparenciaService] Erro ao salvar item de transparência:', error)
      throw error
    }
  },

  /**
   * Exclui um item (por exemplo, relatório customizado da Seção II)
   */
  async excluirItem(id: string): Promise<boolean> {
    try {
      await pb.collection('transparencia_conteudo').delete(id, { requestKey: null })
      return true
    } catch (error) {
      console.error('[transparenciaService] Erro ao excluir item:', error)
      throw error
    }
  },

  /**
   * Alterna a visibilidade ativa/oculta de um item
   */
  async alternarAtivo(id: string, ativoAtual: boolean): Promise<ItemTransparencia> {
    return await pb
      .collection('transparencia_conteudo')
      .update<ItemTransparencia>(id, { ativo: !ativoAtual }, { requestKey: null })
  },
}
