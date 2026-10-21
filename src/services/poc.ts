import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export type CategoriaDocumentoPOC =
  | 'edital'
  | 'regulamento'
  | 'minuta_contrato_transporte'
  | 'proposta_tarifaria'
  | 'procedimentos_operacionais'
  | 'cronograma'
  | 'comunicados'
  | 'faq'
  | 'resultado_manifestacao'
  | 'resultado_final'

export interface DocumentoPOCItem extends RecordModel {
  ciclo: string
  categoria: CategoriaDocumentoPOC
  chave: string
  titulo: string
  descricao?: string
  ordem?: number
  url_externa?: string
  arquivo?: string
  nome_arquivo_custom?: string
  ativo: boolean
}

export interface InputDocumentoPOCItem {
  ciclo: string
  categoria: CategoriaDocumentoPOC
  chave: string
  titulo: string
  descricao?: string
  ordem?: number
  url_externa?: string
  nome_arquivo_custom?: string
  ativo: boolean
  arquivo?: File | null
  remover_arquivo?: boolean
}

export type StatusEtapaCronograma = 'Concluída' | 'Fase Ativa' | 'Em Andamento' | 'Pendente'

export interface CronogramaEtapaPOC extends RecordModel {
  ciclo: string
  numero_etapa: number
  titulo: string
  inciso_legal?: string
  descricao?: string
  periodo_estimado?: string
  status_etapa: StatusEtapaCronograma
  observacoes?: string
}

export interface ManifestacaoInteressePOC extends RecordModel {
  user_id: string
  protocolo: string
  ciclo: string
  razao_social: string
  cnpj: string
  email: string
  telefone?: string
  responsavel_nome: string
  autorizacao_anp?: string
  capacidade_solicitada: number
  modalidade: 'Firme Ordinário' | 'Extraordinário' | 'Interruptível'
  trecho: string
  ponto_recebimento?: string
  ponto_entrega?: string
  periodo_vigencia?: string
  status:
    | 'Recebida - Em Análise'
    | 'Habilitada para Etapa II'
    | 'Em Ajuste Cadastral'
    | 'Indeferida'
  observacoes_internas?: string
  declaracao_anp_aceita?: boolean
}

export interface NovaManifestacaoInput {
  ciclo?: string
  razao_social: string
  cnpj: string
  email: string
  telefone?: string
  responsavel_nome: string
  autorizacao_anp?: string
  capacidade_solicitada: number
  modalidade: 'Firme Ordinário' | 'Extraordinário' | 'Interruptível'
  trecho: string
  ponto_recebimento?: string
  ponto_entrega?: string
  periodo_vigencia?: string
  declaracao_anp_aceita: boolean
}

export type GarantiaTipo =
  | 'Fiança Bancária'
  | 'Seguro Garantia'
  | 'Depósito Caução'
  | 'Carta de Crédito'

export type StatusPropostaVinculante =
  | 'Proposta Recebida'
  | 'Garantia em Análise'
  | 'Capacidade Alocada (Art. 37-A, III)'
  | 'Aguardando Assinatura (Art. 37-A, IV)'
  | 'Contrato Celebrado e Enviado à ANP (Art. 37-A, V)'
  | 'Indeferida'

export interface PropostaVinculantePOC extends RecordModel {
  user_id: string
  manifestacao_id?: string
  protocolo: string
  ciclo: string
  razao_social: string
  cnpj: string
  rep_legal_nome: string
  rep_legal_cpf: string
  rep_legal_rg: string
  rep_legal_endereco: string
  rep_legal_cargo?: string
  garantia_tipo: GarantiaTipo
  garantia_valor: number
  garantia_instituicao?: string
  garantia_vigencia?: string
  garantia_arquivo?: string
  documento_proposta?: string
  capacidade_proposta: number
  tarifa_aceita?: number
  trecho: string
  ponto_recebimento?: string
  ponto_entrega?: string
  status: StatusPropostaVinculante
  parecer_alocacao?: string
  capacidade_alocada?: number
}

export interface NovaPropostaInput {
  manifestacao_id?: string
  ciclo?: string
  razao_social: string
  cnpj: string
  rep_legal_nome: string
  rep_legal_cpf: string
  rep_legal_rg: string
  rep_legal_endereco: string
  rep_legal_cargo?: string
  garantia_tipo: GarantiaTipo
  garantia_valor: number
  garantia_instituicao?: string
  garantia_vigencia?: string
  garantia_arquivo?: File | null
  documento_proposta?: File | null
  capacidade_proposta: number
  tarifa_aceita?: number
  trecho: string
  ponto_recebimento?: string
  ponto_entrega?: string
}

export function gerarProtocoloPOC(tipo: 'POCC' | 'PROP' = 'POCC'): string {
  const ano = new Date().getFullYear()
  const random4 = Math.floor(1000 + Math.random() * 9000)
  return `${tipo}-TSB-${ano}-${random4}`
}

export function resolverUrlDocPOC(
  item?: Partial<DocumentoPOCItem> | null,
  fallbackUrl: string = 'https://www.tsb.com.br/poc/',
): { url: string; isUpload: boolean; nomeExibicao: string } {
  if (!item) {
    return {
      url: fallbackUrl,
      isUpload: false,
      nomeExibicao: 'Visualizar Documento',
    }
  }

  if (item.arquivo && item.id && item.collectionId) {
    const fileUrl = pb.files.getURL(item, item.arquivo)
    return {
      url: fileUrl,
      isUpload: true,
      nomeExibicao: item.nome_arquivo_custom?.trim() || item.arquivo,
    }
  }

  if (item.url_externa && item.url_externa.trim()) {
    return {
      url: item.url_externa.trim(),
      isUpload: false,
      nomeExibicao: item.nome_arquivo_custom?.trim() || 'Visualizar no Site Oficial TSB',
    }
  }

  return {
    url: fallbackUrl,
    isUpload: false,
    nomeExibicao: item.nome_arquivo_custom?.trim() || 'Visualizar no Site Oficial TSB',
  }
}

export const pocService = {
  // Documentação pública do ciclo
  async listarDocumentos(ciclo = '2026/2027'): Promise<DocumentoPOCItem[]> {
    try {
      return await pb.collection<DocumentoPOCItem>('poc_documentos').getFullList({
        filter: `ciclo = "${ciclo}" && ativo = true`,
        sort: 'ordem,created',
        requestKey: null,
      })
    } catch {
      return []
    }
  },

  async listarTodosDocumentos(ciclo = '2026/2027'): Promise<DocumentoPOCItem[]> {
    try {
      return await pb.collection<DocumentoPOCItem>('poc_documentos').getFullList({
        filter: `ciclo = "${ciclo}"`,
        sort: 'ordem,created',
        requestKey: null,
      })
    } catch {
      return []
    }
  },

  async salvarDocumento(id: string, dados: InputDocumentoPOCItem): Promise<DocumentoPOCItem> {
    const formData = new FormData()
    formData.append('ciclo', dados.ciclo)
    formData.append('categoria', dados.categoria)
    formData.append('chave', dados.chave)
    formData.append('titulo', dados.titulo)
    formData.append('descricao', dados.descricao || '')
    formData.append('ordem', String(dados.ordem ?? 1))
    formData.append('url_externa', dados.url_externa || '')
    formData.append('nome_arquivo_custom', dados.nome_arquivo_custom || '')
    formData.append('ativo', dados.ativo ? 'true' : 'false')

    if (dados.arquivo instanceof File) {
      formData.append('arquivo', dados.arquivo)
    } else if (dados.remover_arquivo) {
      formData.append('arquivo', '')
    }

    if (id && !id.startsWith('novo_')) {
      return await pb.collection<DocumentoPOCItem>('poc_documentos').update(id, formData, {
        requestKey: null,
      })
    }

    return await pb.collection<DocumentoPOCItem>('poc_documentos').create(formData, {
      requestKey: null,
    })
  },

  // Cronograma das 5 etapas do Art. 37-A, §5º
  async listarCronograma(ciclo = '2026/2027'): Promise<CronogramaEtapaPOC[]> {
    try {
      return await pb.collection<CronogramaEtapaPOC>('poc_cronograma').getFullList({
        filter: `ciclo = "${ciclo}"`,
        sort: 'numero_etapa',
        requestKey: null,
      })
    } catch {
      return []
    }
  },

  async atualizarStatusEtapa(
    id: string,
    status: StatusEtapaCronograma,
    periodoEstimado?: string,
    observacoes?: string,
  ): Promise<CronogramaEtapaPOC> {
    return await pb.collection<CronogramaEtapaPOC>('poc_cronograma').update(
      id,
      {
        status_etapa: status,
        ...(periodoEstimado !== undefined ? { periodo_estimado: periodoEstimado } : {}),
        ...(observacoes !== undefined ? { observacoes } : {}),
      },
      { requestKey: null },
    )
  },

  // Manifestações de Interesse (não vinculante)
  async criarManifestacao(input: NovaManifestacaoInput): Promise<ManifestacaoInteressePOC> {
    const userId = pb.authStore.record?.id
    if (!userId) {
      throw new Error('Usuário deve estar autenticado para enviar manifestação de interesse.')
    }

    const protocolo = gerarProtocoloPOC('POCC')
    const ciclo = input.ciclo || '2026/2027'

    return await pb.collection<ManifestacaoInteressePOC>('poc_manifestacoes').create({
      user_id: userId,
      protocolo,
      ciclo,
      razao_social: input.razao_social.trim(),
      cnpj: input.cnpj.trim(),
      email: input.email.trim(),
      telefone: input.telefone?.trim() || '',
      responsavel_nome: input.responsavel_nome.trim(),
      autorizacao_anp: input.autorizacao_anp?.trim() || '',
      capacidade_solicitada: input.capacidade_solicitada,
      modalidade: input.modalidade,
      trecho: input.trecho,
      ponto_recebimento: input.ponto_recebimento || 'Paso de Los Libres',
      ponto_entrega: input.ponto_entrega || 'Triunfo',
      periodo_vigencia: input.periodo_vigencia || '2026/2027',
      status: 'Recebida - Em Análise',
      declaracao_anp_aceita: input.declaracao_anp_aceita,
    })
  },

  async listarManifestacoesDoUsuario(userId?: string): Promise<ManifestacaoInteressePOC[]> {
    const targetId = userId || pb.authStore.record?.id
    if (!targetId) return []

    try {
      return await pb.collection<ManifestacaoInteressePOC>('poc_manifestacoes').getFullList({
        filter: `user_id = "${targetId}"`,
        sort: '-created',
        requestKey: null,
      })
    } catch {
      return []
    }
  },

  async listarTodasManifestacoes(): Promise<ManifestacaoInteressePOC[]> {
    try {
      return await pb.collection<ManifestacaoInteressePOC>('poc_manifestacoes').getFullList({
        sort: '-created',
        requestKey: null,
      })
    } catch {
      return []
    }
  },

  async atualizarStatusManifestacao(
    id: string,
    status: ManifestacaoInteressePOC['status'],
    observacoesInternas?: string,
  ): Promise<ManifestacaoInteressePOC> {
    return await pb.collection<ManifestacaoInteressePOC>('poc_manifestacoes').update(id, {
      status,
      ...(observacoesInternas !== undefined ? { observacoes_internas: observacoesInternas } : {}),
    })
  },

  // Propostas Garantidas Vinculantes (Art. 37-A §5º, III)
  async criarPropostaVinculante(input: NovaPropostaInput): Promise<PropostaVinculantePOC> {
    const userId = pb.authStore.record?.id
    if (!userId) {
      throw new Error('Usuário deve estar autenticado para enviar proposta vinculante.')
    }

    const protocolo = gerarProtocoloPOC('PROP')
    const formData = new FormData()

    formData.append('user_id', userId)
    if (input.manifestacao_id) {
      formData.append('manifestacao_id', input.manifestacao_id)
    }
    formData.append('protocolo', protocolo)
    formData.append('ciclo', input.ciclo || '2026/2027')
    formData.append('razao_social', input.razao_social.trim())
    formData.append('cnpj', input.cnpj.trim())
    formData.append('rep_legal_nome', input.rep_legal_nome.trim())
    formData.append('rep_legal_cpf', input.rep_legal_cpf.trim())
    formData.append('rep_legal_rg', input.rep_legal_rg.trim())
    formData.append('rep_legal_endereco', input.rep_legal_endereco.trim())
    if (input.rep_legal_cargo) {
      formData.append('rep_legal_cargo', input.rep_legal_cargo.trim())
    }
    formData.append('garantia_tipo', input.garantia_tipo)
    formData.append('garantia_valor', String(input.garantia_valor))
    if (input.garantia_instituicao) {
      formData.append('garantia_instituicao', input.garantia_instituicao.trim())
    }
    if (input.garantia_vigencia) {
      formData.append('garantia_vigencia', input.garantia_vigencia.trim())
    }
    if (input.garantia_arquivo instanceof File) {
      formData.append('garantia_arquivo', input.garantia_arquivo)
    }
    if (input.documento_proposta instanceof File) {
      formData.append('documento_proposta', input.documento_proposta)
    }
    formData.append('capacidade_proposta', String(input.capacidade_proposta))
    if (input.tarifa_aceita) {
      formData.append('tarifa_aceita', String(input.tarifa_aceita))
    }
    formData.append('trecho', input.trecho)
    formData.append('ponto_recebimento', input.ponto_recebimento || 'Paso de Los Libres')
    formData.append('ponto_entrega', input.ponto_entrega || 'Triunfo')
    formData.append('status', 'Proposta Recebida')

    return await pb.collection<PropostaVinculantePOC>('poc_propostas_vinculantes').create(formData)
  },

  async listarPropostasDoUsuario(userId?: string): Promise<PropostaVinculantePOC[]> {
    const targetId = userId || pb.authStore.record?.id
    if (!targetId) return []

    try {
      return await pb.collection<PropostaVinculantePOC>('poc_propostas_vinculantes').getFullList({
        filter: `user_id = "${targetId}"`,
        sort: '-created',
        requestKey: null,
      })
    } catch {
      return []
    }
  },

  async listarTodasPropostas(): Promise<PropostaVinculantePOC[]> {
    try {
      return await pb.collection<PropostaVinculantePOC>('poc_propostas_vinculantes').getFullList({
        sort: '-created',
        requestKey: null,
      })
    } catch {
      return []
    }
  },

  async atualizarStatusProposta(
    id: string,
    status: StatusPropostaVinculante,
    capacidadeAlocada?: number,
    parecerAlocacao?: string,
  ): Promise<PropostaVinculantePOC> {
    return await pb.collection<PropostaVinculantePOC>('poc_propostas_vinculantes').update(id, {
      status,
      ...(capacidadeAlocada !== undefined ? { capacidade_alocada: capacidadeAlocada } : {}),
      ...(parecerAlocacao !== undefined ? { parecer_alocacao: parecerAlocacao } : {}),
    })
  },
}
