import pb from '@/lib/pocketbase/client'

export type SecaoTransparencia =
  | 'cabecalho'
  | 'boletim_master'
  | 'boletim_secao1'
  | 'boletim_secao2'
  | 'boletim_contratos'
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
    titulo: 'I – Instalações de Transporte e Serviços Prestados',
    descricao:
      'Instalações de transporte e serviços prestados indicando termos e condições gerais, modelos de contrato por tipo de serviço, acordos operacionais e de conexão, mapa atualizado, características físicas e capacidade máxima, capacidade disponível para transporte firme, quantidades programadas e realizadas, interrupções e ampliações planejadas (Art. 2º, I da Portaria ANP nº 1/2003).',
  },
  boletim_secao2_header: {
    titulo: 'Quantidades programadas e realizadas (dados diários do mês anterior)',
    descricao:
      'Série histórica e demonstrativos mensais de quantidades programadas e realizadas de gás natural nos pontos de recepção e entrega dos Trechos 1 e 3.',
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
  boletim_contratos_header: {
    titulo: 'II – Contratos de Serviço de Transporte',
    descricao:
      'Atualizado sempre que houver assinatura de um novo contrato ou alteração de contrato vigente, indicando: nome completo do Carregador; tipo de serviço; data de início e término do contrato; evolução das capacidades contratadas; tarifas e descontos aplicados a cada carregador; relação acionária entre Transportador e Carregador (Art. 2º, II da Portaria ANP nº 1/2003).',
    nome_arquivo_custom: 'Baixar Documento',
  },
  contratos_transporte_documento: {
    titulo: 'Resumo dos Contratos e Tarifas Vigentes',
    descricao:
      'Histórico consolidado dos contratos de serviço de transporte celebrados pela TSB: nome do Carregador, modalidade de serviço, prazos de vigência, evolução de capacidade contratada, tarifas e descontos pactuados e relação societária (Item II da Portaria ANP nº 1/2003 e Art. 2º da Lei nº 14.134/2021).',
    nome_arquivo_custom: 'Baixar Documento',
  },
  resumo_solicitacoes_vii_pdf: {
    titulo: 'Resumo Público das Solicitações por Ponto Relevante (Art. 9º, VII)',
    descricao:
      'Documento consolidado com a relação anônima e agregada das solicitações de acesso por ponto relevante de recebimento e entrega, em conformidade com o Art. 9º, VII da Resolução ANP nº 11/2016 e as diretrizes da LGPD.',
    nome_arquivo_custom: 'Baixar Documento',
  },
  resumo_demandas_trechos_vii_pdf: {
    titulo: 'Resumo da Demanda por Instalação de Transporte — Trechos 1 e 3',
    descricao:
      'Demonstrativo consolidado em PDF da capacidade demandada por instalação dutoviária (Trecho 1: Uruguaiana-Triunfo e Trecho 3: Polo Petroquímico), atualizado pela equipe técnica da TSB.',
    nome_arquivo_custom: 'Baixar Documento',
  },
  resumo_cessoes_viii_pdf: {
    titulo: 'Ofertas Ativas de Cessão de Capacidade Contratada (Art. 9º, VIII)',
    descricao:
      'Publicação oficial das ofertas ativas de capacidade ociosa informadas por carregadores à TSB, elaborada e atualizada manualmente após verificação de conformidade regulatória (Art. 9º, VIII da Resolução ANP nº 11/2016).',
    nome_arquivo_custom: 'Baixar Documento',
  },
  monitoramento_congestionamento_header: {
    titulo: 'Relatório de Monitoramento de Utilização da Capacidade e Congestionamento',
    descricao:
      'O Transportador deve produzir relatórios mensais de monitoramento da utilização da capacidade nos Pontos Relevantes e do Congestionamento Físico e Contratual, submetendo-os à aprovação da ANP e disponibilizando-os publicamente após homologação.',
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
  plataforma_inciso_vii_header: {
    titulo: 'Inciso VII — Amparo Legal: Art. 9º, Inciso VII e Art. 10 da Resolução ANP nº 11/2016',
    descricao:
      'Publicação pública dos resumos consolidados na Plataforma Eletrônica (padrão TBG). A solicitação de acesso e contratação de capacidade ocorre no ambiente seguro e autenticado do POCC (com login), mantendo-se a formalização via formulário PDF e e-mail como canal alternativo.',
  },
  pocc_regulamento: {
    titulo: 'Minuta do Regulamento para Oferta e Contratação de Capacidade',
    descricao:
      'Regras operacionais, requisitos de habilitação, metodologia de alocação e garantias exigidas dos Carregadores (Art. 37-A, §1º, I e §2º da Resolução ANP nº 11/2016).',
    nome_arquivo_custom: 'Regulamento do POCC (PDF)',
  },
  pocc_minuta_contrato: {
    titulo: 'Minuta do Contrato de Serviço de Transporte de Gás Natural',
    descricao:
      'Minuta padronizada do Contrato de Serviço de Transporte Firme exigida pela Resolução ANP nº 961/2023 (Art. 37-A, §1º, II e §2º).',
    url_externa:
      'https://www.tsb.com.br/wp-content/uploads/2025/03/CONTRATO-MASTER-TSB-2025-2029.pdf',
    nome_arquivo_custom: 'Minuta Contrato de Transporte (PDF)',
  },
  pocc_proposta_tarifaria: {
    titulo: 'Proposta Tarifária e Tarifas de Referência',
    descricao:
      'Proposta tarifária submetida à Consulta Pública Tarifária e homologada pela ANP para o ciclo (Art. 37-A, §1º, III e §2º).',
    nome_arquivo_custom: 'Proposta Tarifária (PDF)',
  },
  pocc_capacidade_ofertada: {
    titulo: 'Capacidade Ofertada e Disponível por Ponto de Entrada e Zona de Saída',
    descricao:
      'Demonstrativo consolidado da capacidade de transporte ofertada (m³/dia) e capacidade disponível por Ponto de Entrada (Canoas) e Zona de Saída (Triunfo / Uruguaiana) nos Trechos 1 e 3 da malha TSB.',
    url_externa:
      'https://www.tsb.com.br/wp-content/uploads/2024/11/1.7.7-CAPACIDADES_DISPONIVEIS-PE-E-ZS-5.pdf',
    nome_arquivo_custom: 'Capacidades Disponíveis PE e ZS (PDF)',
  },
  pocc_modelo_manifestacao_interesse: {
    titulo: 'Modelo de Manifestação de Interesse (POCC — Art. 37-A, §5º, I)',
    descricao:
      'Formulário-padrão de manifestação de interesse não vinculante para download pelo Carregador, com identificação cadastral, indicação de demanda estimada e declarações regulatórias.',
    url_externa:
      'https://www.tsb.com.br/wp-content/uploads/2023/11/MODELO-MANIFESTAC%CC%A7A%CC%83O-DE-INTERESSE.pdf',
    nome_arquivo_custom: 'Modelo de Manifestação de Interesse (PDF)',
  },
  pocc_modelo_proposta_garantida: {
    titulo: 'Modelo de Proposta Garantida Vinculante (POCC — Art. 37-A, §5º, III)',
    descricao:
      'Minuta-padrão de proposta vinculante para apresentação de garantia financeira, indicação de capacidade, tarifa de transporte de referência e ponto de entrada/zona de saída.',
    url_externa: 'https://www.tsb.com.br/wp-content/uploads/2023/11/Modelo-Proposta-Garantida.pdf',
    nome_arquivo_custom: 'Modelo de Proposta Garantida (PDF)',
  },
  pocc_requisitos_habilitacao: {
    titulo: 'Requisitos de Habilitação do Carregador (Documentos e Condições Cadastrais)',
    descricao:
      'Relação documental e requisitos técnicos, societários, fiscais, regulatórios (Autorização ANP) e de classificação de crédito exigidos para habilitação prévia do Carregador junto à TSB.',
    url_externa:
      'https://www.tsb.com.br/wp-content/uploads/2023/11/1.7.9-REQUISITOS-DE-HABILITAC%CC%A7A%CC%83O-DO-CARREGADOR.pdf',
    nome_arquivo_custom: 'Requisitos de Habilitação do Carregador (PDF)',
  },
  pocc_resultados_ciclo: {
    titulo: 'Resultados e Publicações das Etapas do Ciclo (Manifestações, Propostas e ANP)',
    descricao:
      'Publicação oficial das manifestações de interesse recebidas, propostas garantidas homologadas, alocações de capacidade e atos de aprovação da ANP (Despachos e Notas Técnicas no DOU).',
    url_externa:
      'https://www.tsb.com.br/wp-content/uploads/2024/11/1.7.11-DESPACHO-SIM-ANP-No-1.328-11-2024-DOU.pdf',
    nome_arquivo_custom: 'Aprovação ANP Proposta Tarifária e POCC (DOU)',
  },
  pocc_aprovacao_anp_oficio555: {
    titulo: 'Aprovação da ANP (Ofício nº 555/2025-SIM)',
    descricao:
      'Aprovação da ANP que inaugura e autoriza o ciclo do POCC para prestação de serviço de transporte extraordinário (Ofício nº 555/2025/SIM-CTC/SIM/ANP-RJ-e).',
    url_externa:
      'https://www.tsb.com.br/wp-content/uploads/2026/04/OFICIO-No-555_2025_SIM-CTC_SIM_ANP-RJ-e.pdf',
    nome_arquivo_custom: 'Ofício ANP nº 555/2025-SIM (PDF)',
  },
  pocc_contrato_master_assinado: {
    titulo: 'Contrato Master Completo (assinado, 2026)',
    descricao:
      'Instrumento contratual fechado e assinado padrão da Transportadora Sulbrasileira de Gás - TSB para o ciclo regulatório de 2026.',
    url_externa: 'https://www.tsb.com.br/wp-content/uploads/2025/12/CONTRATO-MASTER-2026.pdf',
    nome_arquivo_custom: 'Contrato Master Completo 2026 (PDF)',
  },
  pocc_tarifa_contrato_extraordinario: {
    titulo: 'Tarifa do Contrato Extraordinário (T3 para 2026)',
    descricao:
      'Número tarifário real homologado para o Trecho 3 (T3) no horizonte de 2026 para contratos de transporte extraordinário da malha TSB.',
    url_externa: 'https://www.tsb.com.br/wp-content/uploads/2026/02/Tarifa-T3-para-2026-1.docx',
    nome_arquivo_custom: 'Tarifa T3 para 2026 (.docx)',
  },
  pocc_calculo_capacidade: {
    titulo: 'Cálculo da Capacidade de Transporte (Item 1.7.8)',
    descricao:
      'Estudo técnico e memória de cálculo da capacidade de transporte da malha TSB, considerando simulação termo-hidráulica e premissas operacionais.',
    url_externa:
      'https://www.tsb.com.br/wp-content/uploads/2023/11/1.7.8-CA%CC%81LCULO-DA-CAPACIDADE-DE-TRANSPORTE.pdf',
    nome_arquivo_custom: 'Cálculo da Capacidade de Transporte (PDF)',
  },
  pocc_cronograma_indicativo: {
    titulo: 'Cronograma Indicativo do Ciclo Regulatório 2026–2030',
    descricao:
      'Cronograma indicativo oficial com o horizonte plurianual 2026–2030 do ciclo regulatório e etapas do POCC na infraestrutura TSB.',
    url_externa:
      'https://www.tsb.com.br/wp-content/uploads/2026/04/Cronograma-Indicativo-Ciclo-Regulatorio-2026-2030.pdf',
    nome_arquivo_custom: 'Cronograma Indicativo 2026–2030 (PDF)',
  },
  pocc_anexo4_pocc: {
    titulo: 'Anexo 4 — Cronograma POCC Produto Firme Anual TSB',
    descricao:
      'Documento oficial do Anexo 4 contendo o detalhamento de prazos e ritos do POCC para contratação de produto firme anual.',
    url_externa:
      'https://www.tsb.com.br/wp-content/uploads/2025/01/ANEXO-4-Cronograma-POCC-2025-PRODUTO-FIRME-ANUAL-TSB.pdf',
    nome_arquivo_custom: 'Anexo 4 — Cronograma POCC (PDF)',
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
  periodo?: string
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
  periodo?: string
  url_secundaria?: string
  nome_url_secundaria?: string
  arquivo?: File | null
  remover_arquivo?: boolean
  arquivo_secundario?: File | null
  remover_arquivo_secundario?: boolean
}

export interface VersaoTransparencia {
  id: string
  conteudo_id?: string
  slot_chave: string
  titulo: string
  data_versao?: string
  descricao?: string
  ordem?: number
  arquivo?: string
  url_externa?: string
  nome_arquivo_custom?: string
  ativo?: boolean
  created?: string
  updated?: string
  collectionId?: string
  collectionName?: string
}

export interface InputVersaoTransparencia {
  conteudo_id?: string
  slot_chave: string
  titulo: string
  data_versao?: string
  descricao?: string
  ordem?: number
  url_externa?: string
  nome_arquivo_custom?: string
  ativo?: boolean
  arquivo?: File | null
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
    if (dados.periodo) formData.append('periodo', dados.periodo)
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

  // =========================================================================
  // ACERVO DE VERSÕES ANTERIORES (PORTARIA ANP Nº 1/2003, ART. 2º, §2º)
  // =========================================================================

  /**
   * Lista todas as versões ativas ou cadastradas para um slot_chave (ou para todos os slots)
   */
  async listarVersoes(slotChave?: string, apenasAtivos = false): Promise<VersaoTransparencia[]> {
    try {
      let filter = ''
      if (slotChave) {
        filter = apenasAtivos
          ? `slot_chave = "${slotChave}" && ativo != false`
          : `slot_chave = "${slotChave}"`
      } else if (apenasAtivos) {
        filter = `ativo != false`
      }

      const records = await pb
        .collection('transparencia_versoes')
        .getFullList<VersaoTransparencia>({
          filter: filter || undefined,
          sort: '-created,-data_versao',
          requestKey: null,
        })
      return records
    } catch (error) {
      console.warn('[transparenciaService] Falha ao listar versões:', error)
      return []
    }
  },

  /**
   * Cria uma nova versão arquivada para um slot
   */
  async criarVersao(dados: InputVersaoTransparencia): Promise<VersaoTransparencia> {
    const formData = new FormData()
    formData.append('slot_chave', dados.slot_chave)
    formData.append('titulo', dados.titulo)
    if (dados.conteudo_id) formData.append('conteudo_id', dados.conteudo_id)
    if (dados.data_versao) formData.append('data_versao', dados.data_versao)
    if (dados.descricao) formData.append('descricao', dados.descricao)
    if (dados.ordem !== undefined) formData.append('ordem', String(dados.ordem))
    if (dados.url_externa) formData.append('url_externa', dados.url_externa)
    if (dados.nome_arquivo_custom) formData.append('nome_arquivo_custom', dados.nome_arquivo_custom)
    formData.append('ativo', dados.ativo !== false ? 'true' : 'false')

    if (dados.arquivo instanceof File) {
      formData.append('arquivo', dados.arquivo)
    }

    try {
      return await pb
        .collection('transparencia_versoes')
        .create<VersaoTransparencia>(formData, { requestKey: null })
    } catch (error) {
      console.error('[transparenciaService] Erro ao criar versão:', error)
      throw error
    }
  },

  /**
   * Arquiva o documento atualmente vigente em um slot antes de substituí-lo
   * Copia o arquivo atual (ou URL externa atual) para a tabela de versões
   */
  async arquivarDocumentoAtual(
    item: ItemTransparencia,
    tituloVersao: string,
    dataVersao?: string,
    descricao?: string,
  ): Promise<VersaoTransparencia> {
    // Se o item tem arquivo no PocketBase, obtemos seu Blob para enviar como arquivo da versão
    let arquivoParaEnviar: File | null = null

    if (item.arquivo && item.id && item.collectionId) {
      try {
        const fileUrl = pb.files.getURL(item, item.arquivo)
        const res = await fetch(fileUrl)
        if (res.ok) {
          const blob = await res.blob()
          arquivoParaEnviar = new File([blob], item.arquivo, {
            type: blob.type || 'application/pdf',
          })
        }
      } catch (err) {
        console.warn(
          '[transparenciaService] Não foi possível fazer download do blob atual, gravando URL externa:',
          err,
        )
      }
    }

    const fallbackUrl = item.url_externa || ''
    const fallbackNome = item.nome_arquivo_custom || ''

    return await this.criarVersao({
      conteudo_id: item.id,
      slot_chave: item.chave,
      titulo: tituloVersao || `Versão arquivada em ${new Date().toLocaleDateString('pt-BR')}`,
      data_versao:
        dataVersao ||
        (item.updated
          ? new Date(item.updated).toLocaleDateString('pt-BR')
          : new Date().toLocaleDateString('pt-BR')),
      descricao: descricao || item.descricao || '',
      url_externa: arquivoParaEnviar ? undefined : fallbackUrl,
      nome_arquivo_custom: fallbackNome,
      arquivo: arquivoParaEnviar,
      ativo: true,
    })
  },

  /**
   * Exclui uma versão arquivada
   */
  async excluirVersao(id: string): Promise<boolean> {
    try {
      await pb.collection('transparencia_versoes').delete(id, { requestKey: null })
      return true
    } catch (error) {
      console.error('[transparenciaService] Erro ao excluir versão:', error)
      throw error
    }
  },
}
