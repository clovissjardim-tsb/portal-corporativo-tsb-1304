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
    | 'Submetida'
    | 'Documento gerado — aguardando assinatura do representante legal'
    | 'Manifestação registrada — aguardando conferência da assinatura'
    | 'Recebida - Em Análise'
    | 'Habilitada para Etapa II'
    | 'Em Ajuste Cadastral'
    | 'Indeferida'
  observacoes_internas?: string
  declaracao_anp_aceita?: boolean
  arquivo_formulario?: string
  dados_formulario?: any
  rep_autorizado_nome?: string
  rep_autorizado_cpf?: string
  origem?: 'area_carregador' | 'manual_interno' | 'portal_web'
}

export interface NovaManifestacaoInput {
  protocolo?: string
  ciclo?: string
  razao_social: string
  cnpj: string
  email: string
  telefone?: string
  responsavel_nome: string
  autorizacao_anp?: string
  capacidade_solicitada: number
  modalidade?: 'Firme Ordinário' | 'Extraordinário' | 'Interruptível'
  trecho?: string
  ponto_recebimento?: string
  ponto_entrega?: string
  periodo_vigencia?: string
  declaracao_anp_aceita: boolean
  arquivo_formulario?: File | null
  dados_formulario?: any
  rep_autorizado_nome?: string
  rep_autorizado_cpf?: string
  origem?: 'area_carregador' | 'manual_interno' | 'portal_web'
  status?: ManifestacaoInteressePOC['status']
}

export type GarantiaTipo =
  | 'Fiança Bancária'
  | 'Seguro Garantia'
  | 'Depósito Caução'
  | 'Carta de Crédito'

export type StatusPropostaVinculante =
  | 'Submetida'
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
  arquivo_proposta_assinada?: string
  criterio_leilao?: string
  capacidade_minima_leilao?: number
  dados_formulario?: any
  capacidade_proposta: number
  tarifa_aceita?: number
  trecho: string
  ponto_recebimento?: string
  ponto_entrega?: string
  status: StatusPropostaVinculante | 'Submetida'
  parecer_alocacao?: string
  capacidade_alocada?: number
  origem?: 'area_carregador' | 'manual_interno' | 'portal_web'
}

export interface NovaPropostaInput {
  protocolo?: string
  manifestacao_id?: string
  ciclo?: string
  razao_social: string
  cnpj: string
  rep_legal_nome: string
  rep_legal_cpf: string
  rep_legal_rg: string
  rep_legal_endereco: string
  rep_legal_cargo?: string
  garantia_tipo?: GarantiaTipo
  garantia_valor?: number
  garantia_instituicao?: string
  garantia_vigencia?: string
  garantia_arquivo?: File | null
  documento_proposta?: File | null
  arquivo_proposta_assinada?: File | null
  criterio_leilao?: string
  capacidade_minima_leilao?: number
  dados_formulario?: any
  capacidade_proposta: number
  tarifa_aceita?: number
  trecho?: string
  ponto_recebimento?: string
  ponto_entrega?: string
  origem?: 'area_carregador' | 'manual_interno' | 'portal_web'
  status?: PropostaVinculantePOC['status']
}

export function gerarProtocoloPOC(
  tipo: 'POCC' | 'PROP' | 'TSB' | 'POC-MI' | 'POC-PG' = 'TSB',
): string {
  const ano = new Date().getFullYear()
  const seq4 = String(Math.floor(1000 + Math.random() * 9000))
  if (tipo === 'POC-MI') {
    return `POC-MI-${ano}-${seq4}`
  }
  if (tipo === 'POC-PG') {
    return `POC-PG-${ano}-${seq4}`
  }
  if (tipo === 'TSB') {
    return `TSB-${ano}-${seq4}`
  }
  return `${tipo}-TSB-${ano}-${seq4}`
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

    const protocolo = input.protocolo || gerarProtocoloPOC('POC-MI')
    const ciclo = input.ciclo || '2026/2027'
    const statusInicial: ManifestacaoInteressePOC['status'] = input.status || 'Submetida'
    const origem = input.origem || 'area_carregador'

    const formData = new FormData()
    formData.append('user_id', userId)
    formData.append('protocolo', protocolo)
    formData.append('ciclo', ciclo)
    formData.append('razao_social', input.razao_social.trim())
    formData.append('cnpj', input.cnpj.trim())
    formData.append('email', input.email.trim())
    formData.append('telefone', input.telefone?.trim() || '')
    formData.append('responsavel_nome', input.responsavel_nome.trim())
    formData.append('autorizacao_anp', input.autorizacao_anp?.trim() || '')
    formData.append('capacidade_solicitada', String(input.capacidade_solicitada || 0))
    formData.append('modalidade', input.modalidade || 'Firme Ordinário')
    formData.append('trecho', input.trecho || 'Gasoduto Uruguaiana - Triunfo')
    formData.append('ponto_recebimento', input.ponto_recebimento || 'Paso de Los Libres')
    formData.append('ponto_entrega', input.ponto_entrega || 'Triunfo')
    formData.append('periodo_vigencia', input.periodo_vigencia || '2026/2027')
    formData.append('status', statusInicial)
    formData.append('origem', origem)
    formData.append('declaracao_anp_aceita', input.declaracao_anp_aceita ? 'true' : 'false')

    if (input.rep_autorizado_nome) {
      formData.append('rep_autorizado_nome', input.rep_autorizado_nome.trim())
    }
    if (input.rep_autorizado_cpf) {
      formData.append('rep_autorizado_cpf', input.rep_autorizado_cpf.trim())
    }
    if (input.dados_formulario) {
      formData.append('dados_formulario', JSON.stringify(input.dados_formulario))
    }
    if (input.arquivo_formulario instanceof File) {
      formData.append('arquivo_formulario', input.arquivo_formulario)
    }

    return await pb.collection<ManifestacaoInteressePOC>('poc_manifestacoes').create(formData, {
      requestKey: null,
    })
  },

  obterUrlArquivoManifestacao(record: ManifestacaoInteressePOC): string | null {
    if (!record.arquivo_formulario) return null
    return pb.files.getURL(record, record.arquivo_formulario)
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

  async anexarDocumentoAssinado(id: string, arquivo: File): Promise<ManifestacaoInteressePOC> {
    const formData = new FormData()
    formData.append('arquivo_formulario', arquivo)
    formData.append('status', 'Manifestação registrada — aguardando conferência da assinatura')
    formData.append('origem', 'area_carregador')

    return await pb.collection<ManifestacaoInteressePOC>('poc_manifestacoes').update(id, formData, {
      requestKey: null,
    })
  },

  // Propostas Garantidas Vinculantes (Art. 37-A §5º, III)
  async criarPropostaVinculante(input: NovaPropostaInput): Promise<PropostaVinculantePOC> {
    const userId = pb.authStore.record?.id
    if (!userId) {
      throw new Error('Usuário deve estar autenticado para enviar proposta vinculante.')
    }

    const protocolo = input.protocolo || gerarProtocoloPOC('POC-PG')
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
    formData.append('garantia_tipo', input.garantia_tipo || 'Fiança Bancária')
    formData.append('garantia_valor', String(input.garantia_valor || 0))
    if (input.garantia_instituicao) {
      formData.append('garantia_instituicao', input.garantia_instituicao.trim())
    }
    if (input.garantia_vigencia) {
      formData.append('garantia_vigencia', input.garantia_vigencia.trim())
    }
    if (input.garantia_arquivo instanceof File) {
      formData.append('garantia_arquivo', input.garantia_arquivo)
    }
    if (input.arquivo_proposta_assinada instanceof File) {
      formData.append('arquivo_proposta_assinada', input.arquivo_proposta_assinada)
    }
    if (input.documento_proposta instanceof File) {
      formData.append('documento_proposta', input.documento_proposta)
    }
    formData.append('capacidade_proposta', String(input.capacidade_proposta || 0))
    if (input.tarifa_aceita !== undefined) {
      formData.append('tarifa_aceita', String(input.tarifa_aceita))
    }
    formData.append('trecho', input.trecho || 'Gasoduto Uruguaiana - Triunfo')
    formData.append('ponto_recebimento', input.ponto_recebimento || 'Paso de Los Libres')
    formData.append('ponto_entrega', input.ponto_entrega || 'Triunfo')
    formData.append('status', input.status || 'Submetida')
    formData.append('origem', input.origem || 'area_carregador')

    if (input.criterio_leilao) {
      formData.append('criterio_leilao', input.criterio_leilao)
    }
    if (input.capacidade_minima_leilao !== undefined) {
      formData.append('capacidade_minima_leilao', String(input.capacidade_minima_leilao))
    }
    if (input.dados_formulario) {
      formData.append('dados_formulario', JSON.stringify(input.dados_formulario))
    }

    return await pb
      .collection<PropostaVinculantePOC>('poc_propostas_vinculantes')
      .create(formData, {
        requestKey: null,
      })
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
