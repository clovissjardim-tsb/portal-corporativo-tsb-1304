import pb from '@/lib/pocketbase/client'

export type SecaoTransparencia =
  | 'cabecalho'
  | 'boletim_master'
  | 'boletim_secao1'
  | 'boletim_secao2'
  | 'monitoramento_congestionamento'
  | 'plataforma_inciso'

/**
 * Textos canônicos e oficiais para fallback de títulos e cabeçalhos
 * Garantem que a página nunca fique vazia mesmo se um cabeçalho for excluído no BD.
 */
export const CABECALHOS_FALLBACK: Record<
  string,
  {
    titulo: string
    descricao?: string
    url_externa?: string
    nome_arquivo_custom?: string
  }
> = {
  boletim_topo: {
    titulo: 'Boletim Eletrônico',
    descricao:
      'Estabelece os procedimentos para o envio das informações referentes às atividades de transporte e de compra e venda de gás natural ao mercado, aos Carregadores e à Agência Nacional do Petróleo - ANP.',
  },
  boletim_master_header: {
    titulo: 'Modelo de Contrato Master de Transporte Firme para períodos de curto prazo e anuais',
    descricao:
      'Estabelece os procedimentos para o envio das informações referentes às atividades de transporte e de compra e venda de gás natural ao mercado, aos Carregadores e à Agência Nacional do Petróleo - ANP.',
    url_externa:
      'https://www.tsb.com.br/wp-content/uploads/2025/03/CONTRATO-MASTER-TSB-2025-2029.pdf',
    nome_arquivo_custom: 'Baixar Arquivo',
  },
  boletim_secao1_header: {
    titulo: 'I - Instalações de Transporte e Serviços Prestados, atualizadas permanentemente',
    descricao:
      'Informações sobre instalações de transporte dutoviário, modelos contratuais, mapas e termos gerais de serviço.',
  },
  boletim_secao2_header: {
    titulo: 'II - Quantidades Programadas e realizadas nos Trechos 1 e 3',
    descricao:
      'Série histórica e demonstrativos mensais de quantidades programadas e realizadas de gás natural nos pontos de recepção e entrega.',
    url_externa: 'https://www.tsb.com.br/boletim-eletronico/',
    nome_arquivo_custom: 'Consultar no Site Oficial',
  },
  boletim_explicativo_capacidade_g: {
    titulo:
      'Entendimento Conceitual sobre Capacidade Firme e Simulação Termo-Hidráulica (Padrão NTS)',
    descricao:
      'A Capacidade Técnica Máxima (CTM) resulta da simulação termo-hidráulica do gasoduto considerando pressões, vazões nominais e o perfil operacional de entrada e saída. A Capacidade Comercial (CC) é obtida deduzindo-se da capacidade técnica o consumo operacional/gás combustível e as margens prudenciais de segurança do sistema dutoviário. Os percentuais de capacidade firme, interrompível e de curto prazo (contratos com vigência inferior a um ano) devem ser informados aos agentes e à ANP, em conformidade com a Portaria ANP nº 1/2003 (Art. 2º, I, "g") e a Resolução ANP nº 11/2016.',
  },
  aviso_faixas_servidao: {
    titulo:
      'Aviso Regulatório: Segurança e Integridade das Faixas de Servidão de Gasodutos (Resolução ANP nº 42/2012, Art. 46)',
    descricao:
      'As faixas de servidão administrativas dos gasodutos pertencem a terceiros ou ao poder público, constituindo áreas de utilidade pública legalmente gravadas para a segurança da população, do meio ambiente e da infraestrutura de transporte de gás natural. Conforme o Art. 46 da Resolução ANP nº 42/2012, qualquer interferência física nas faixas de dutos — incluindo obras de construção civil, plantio de árvores de porte, escavações, aterros, trânsito de máquinas pesadas ou instalação de cruzamentos de outras concessionárias — é estritamente condicionada à consulta, análise técnica e autorização formal prévia da Transportadora Sulbrasileira de Gás (TSB). Em caso de planejamento de intervenção, entre em contato imediatamente com a engenharia e segurança operacional da TSB através de regulacao@tsb.com.br.',
    nome_arquivo_custom: 'Ver Resolução ANP nº 42/2012',
  },
  monitoramento_congestionamento_header: {
    titulo: 'Monitoramento de Utilização da Capacidade e Congestionamento Físico e Contratual',
    descricao:
      'Em cumprimento ao Art. 12 da Resolução ANP nº 11/2016, a TSB submete mensalmente à ANP e disponibiliza publicamente os relatórios de monitoramento de utilização de capacidade do sistema dutoviário (Art. 12, caput e §1º). Os relatórios retratam a consolidação do fluxo operacional e a verificação de eventuais congestionamentos físicos ou contratuais nos pontos de recepção e entrega dos Trechos 1 e 3 da malha dutoviária, assegurando ampla transparência ao mercado.',
  },
  plataforma_topo: {
    titulo: 'Plataforma Eletrônica',
    descricao:
      'Conforme estabelecido pelo Art. 9º da Resolução ANP nº 11 de 16/03/2016, publicado no DOU em 18/03/2016.',
    url_externa:
      'https://www.tsb.com.br/wp-content/uploads/2023/08/Artigo-9o-RESOLUCAO-11-2016docx.pdf',
    nome_arquivo_custom: 'Ver Resolução ANP nº 11/2016',
  },
  plataforma_incisos_i_vi_header: {
    titulo: 'Exigências Legais do Art. 9º da Resolução ANP nº 11/2016',
    descricao:
      'Documentação oficial e estudos técnicos disponibilizados pela Transportadora Sulbrasileira de Gás - TSB em atendimento aos incisos I a VIII do Art. 9º da Resolução ANP nº 11/2016. Clique nos botões correspondentes para baixar os arquivos ou consultar os estudos oficiais.',
  },
}

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
