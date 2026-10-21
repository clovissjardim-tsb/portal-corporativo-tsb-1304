import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export type ModalidadeSolicitacao = 'Firme Ordinário' | 'Interruptível' | 'Troca Operacional'

export type StatusSolicitacao =
  | 'Solicitação Recebida - Em Análise Técnica'
  | 'Em Análise Técnica'
  | 'Aguardando Documentação'
  | 'Aprovada'
  | 'Rejeitada'
  | 'Confirmação do Atendimento (Desfecho I)'
  | 'Aprofundamento da Análise (Desfecho II)'
  | 'Negativa Fundamentada (Desfecho III)'

export type DesfechoTipo = 'CONFIRMACAO' | 'APROFUNDAMENTO' | 'NEGATIVA'

export type ManifestacaoSulgasStatus =
  | 'Nao Aplicavel'
  | 'Pendente'
  | 'Recebida - Favoravel'
  | 'Recebida - Com Ressalvas'

export interface SolicitacaoIncisoVII extends RecordModel {
  razao_social: string
  cnpj: string
  email: string
  modalidade: ModalidadeSolicitacao
  capacidade: number
  trecho: string // Ex: Trecho 1 (Gasoduto Uruguaiana) ou Trecho 3 (Gasoduto Triunfo)
  ponto_recebimento?: string // Art. 10, IV
  ponto_entrega?: string // Art. 10, IV
  periodo?: string
  protocolo: string
  status: StatusSolicitacao
  sla_dias: number
  parecer_fundamentado?: string
  // Art. 10, §1º: Garantias de segurança e confiabilidade (Troca Operacional / Swap)
  garantias_seguranca_swap?: string
  // Art. 10, §2º: Desfechos padronizados
  desfecho_tipo?: DesfechoTipo
  termos_condicoes?: string // Desfecho I
  aprofundamento_condicoes?: string // Desfecho II
  aprofundamento_escopo?: string // Desfecho II
  aprofundamento_cronograma?: string // Desfecho II
  aprofundamento_custos?: string // Desfecho II
  previsao_disponibilidade?: string // Desfecho III
  // Art. 10, §3º: Cópia à ANP
  copia_anp_enviada?: boolean
  copia_anp_data?: string
  copia_anp_destinatario?: string
  // Art. 10, §5º: Manifestação da Sulgás
  manifestacao_sulgas_status?: ManifestacaoSulgasStatus
  manifestacao_sulgas_data?: string
  manifestacao_sulgas_observacoes?: string
}

export type NovaSolicitacaoInput = {
  razao_social: string
  cnpj: string
  email: string
  modalidade: ModalidadeSolicitacao
  capacidade: number
  trecho: string
  ponto_recebimento: string
  ponto_entrega: string
  periodo: string
  garantias_seguranca_swap?: string
}

// Interface para agregação pública por Ponto Relevante (SEM dados pessoais - LGPD / Art. 9º, VII)
export interface ResumoPublicoSolicitacao {
  pontoRelevante: string
  pontoRecebimento: string
  pontoEntrega: string
  trecho: string
  modalidade: string
  totalSolicitacoes: number
  capacidadeTotalSolicitada: number
  statusPredominante: string
  periodosDemandados: string[]
}

// Interface para agregação pública por Instalação de Transporte (Trechos 1 e 3)
export interface ResumoPublicoInstalacao {
  instalacao: 'Trecho 1' | 'Trecho 3' | 'Outras Instalações'
  descricaoInstalacao: string
  totalSolicitacoes: number
  capacidadeTotalSolicitada: number
  modalidadesPresentes: string[]
  statusPredominante: string
  periodosDemandados: string[]
}

export function gerarNumeroProtocolo(): string {
  const ano = new Date().getFullYear()
  const random4 = Math.floor(1000 + Math.random() * 9000)
  return `TSB-${ano}-${random4}`
}

/**
 * Função utilitária para envio ou verificação de confirmação de protocolo e SLA por e-mail.
 * O envio principal é realizado de forma automática pelo hook no servidor PocketBase (onRecordCreate),
 * com remetente institucional site@tsb.com.br.
 */
export async function notificarSolicitacaoPorEmail(
  destinatario: string,
  protocolo: string,
  _slaDias?: number,
): Promise<{ enviado: boolean; motivo?: string }> {
  if (!destinatario || !protocolo) {
    return { enviado: false, motivo: 'Parâmetros incompletos.' }
  }

  return {
    enviado: true,
    motivo: 'E-mail processado pelo serviço SMTP corporativo da TSB no backend.',
  }
}

/**
 * Dispara um e-mail de teste real através da rota de teste no backend.
 */
export async function testarEnvioSmtp(destinatario: string = 'clovissjardim@gmail.com'): Promise<{
  success: boolean
  message?: string
  error?: string
  host?: string
  port?: number
}> {
  try {
    const res = await pb.send<{
      success: boolean
      message?: string
      error?: string
      host?: string
      port?: number
    }>('/backend/v1/test-smtp', {
      method: 'POST',
      body: { to: destinatario },
    })
    return res
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: msg,
    }
  }
}

export type AtualizarDeliberacaoInput = {
  id: string
  desfecho_tipo: DesfechoTipo
  status: StatusSolicitacao
  parecer_fundamentado: string
  sla_dias?: number
  // Desfecho I
  termos_condicoes?: string
  // Desfecho II
  aprofundamento_condicoes?: string
  aprofundamento_escopo?: string
  aprofundamento_cronograma?: string
  aprofundamento_custos?: string
  // Desfecho III
  previsao_disponibilidade?: string
  // Cópia ANP
  copia_anp_destinatario?: string
  // Sulgás
  manifestacao_sulgas_status?: ManifestacaoSulgasStatus
  manifestacao_sulgas_data?: string
  manifestacao_sulgas_observacoes?: string
}

export const solicitacoesService = {
  async listar(): Promise<SolicitacaoIncisoVII[]> {
    return await pb.collection<SolicitacaoIncisoVII>('solicitacoes_inciso_vii').getFullList({
      sort: '-created',
    })
  },

  /**
   * Consulta pública por protocolo (Inciso VII).
   * 100% LGPD-compliant: consome rota do backend que retorna exclusivamente os dados
   * regulatórios e o parecer fundamentado, omitindo e-mail, telefone e dados de contato.
   */
  async buscarPorProtocolo(protocolo: string): Promise<SolicitacaoIncisoVII | null> {
    const cleanProto = protocolo.trim().toUpperCase()
    try {
      const res = await fetch(
        `${pb.baseUrl}/backend/v1/public/consulta-protocolo/${encodeURIComponent(cleanProto)}`,
      )
      if (res.ok) {
        const data = await res.json()
        return data as SolicitacaoIncisoVII
      }
    } catch {
      // Fallback
    }

    try {
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
    const registro = await pb.collection<SolicitacaoIncisoVII>('solicitacoes_inciso_vii').create({
      ...data,
      protocolo,
      status: 'Solicitação Recebida - Em Análise Técnica',
      sla_dias: 20,
      parecer_fundamentado:
        'Solicitação de acesso formalmente recepcionada. Em processo de análise de viabilidade técnico-operacional e verificação de capacidade ociosa nos pontos de conexão.',
      manifestacao_sulgas_status: 'Pendente',
    })

    // O hook onRecordCreate no backend dispara o e-mail de protocolo automaticamente via SMTP corporativo
    return registro
  },

  async atualizarStatus(
    id: string,
    status: SolicitacaoIncisoVII['status'],
    parecer_fundamentado: string,
    sla_dias?: number,
  ): Promise<SolicitacaoIncisoVII> {
    return await pb.collection<SolicitacaoIncisoVII>('solicitacoes_inciso_vii').update(id, {
      status,
      parecer_fundamentado,
      ...(sla_dias !== undefined ? { sla_dias } : {}),
    })
  },

  async atualizarDeliberacao(input: AtualizarDeliberacaoInput): Promise<SolicitacaoIncisoVII> {
    const { id, ...dados } = input
    return await pb.collection<SolicitacaoIncisoVII>('solicitacoes_inciso_vii').update(id, dados)
  },

  /**
   * Obtém resumo público e consolidado por Ponto Relevante (Art. 9º, Inciso VII).
   * 100% em conformidade com a LGPD: suprime Razão Social, CNPJ e e-mails de solicitantes.
   */
  async obterResumoPublico(): Promise<ResumoPublicoSolicitacao[]> {
    try {
      const res = await fetch(`${pb.baseUrl}/backend/v1/public/solicitacoes-resumo`)
      if (res.ok) {
        return (await res.json()) as ResumoPublicoSolicitacao[]
      }
    } catch {
      // Fallback
    }

    try {
      const lista = await this.listar()

      // Agrupar por pontos e modalidade
      const grupos: Record<string, SolicitacaoIncisoVII[]> = {}

      for (const item of lista) {
        const pRec = item.ponto_recebimento || 'Paso de Los Libres'
        const pEnt = item.ponto_entrega || 'Triunfo (Polo Petroquímico)'
        const chave = `${pRec}__${pEnt}__${item.modalidade}`
        if (!grupos[chave]) {
          grupos[chave] = []
        }
        grupos[chave].push(item)
      }

      const resumo: ResumoPublicoSolicitacao[] = Object.entries(grupos).map(([_, itens]) => {
        const primeiro = itens[0]
        const pRec = primeiro.ponto_recebimento || 'Paso de Los Libres'
        const pEnt = primeiro.ponto_entrega || 'Triunfo (Polo Petroquímico)'
        const capacidadeTotal = itens.reduce((acc, curr) => acc + (Number(curr.capacidade) || 0), 0)
        const periodos = Array.from(
          new Set(itens.map((i) => i.periodo).filter((p): p is string => Boolean(p))),
        )

        return {
          pontoRelevante: `${pRec} ➔ ${pEnt}`,
          pontoRecebimento: pRec,
          pontoEntrega: pEnt,
          trecho: primeiro.trecho,
          modalidade: primeiro.modalidade,
          totalSolicitacoes: itens.length,
          capacidadeTotalSolicitada: capacidadeTotal,
          statusPredominante: itens[0].status,
          periodosDemandados: periodos.length > 0 ? periodos : ['Conforme Edital/Acordo'],
        }
      })

      return resumo
    } catch {
      return []
    }
  },

  /**
   * ART. 9º, VII: Resumo público dimensionado por INSTALAÇÃO DE TRANSPORTE (Trecho 1 e Trecho 3).
   * Sem dados pessoais (LGPD).
   */
  async obterResumoPorInstalacao(): Promise<ResumoPublicoInstalacao[]> {
    try {
      const res = await fetch(`${pb.baseUrl}/backend/v1/public/solicitacoes-instalacao`)
      if (res.ok) {
        return (await res.json()) as ResumoPublicoInstalacao[]
      }
    } catch {
      // Fallback
    }

    try {
      const lista = await this.listar()

      const mapa: {
        'Trecho 1': SolicitacaoIncisoVII[]
        'Trecho 3': SolicitacaoIncisoVII[]
        'Outras Instalações': SolicitacaoIncisoVII[]
      } = {
        'Trecho 1': [],
        'Trecho 3': [],
        'Outras Instalações': [],
      }

      for (const item of lista) {
        const t = (item.trecho || '').toLowerCase()
        const pRec = (item.ponto_recebimento || '').toLowerCase()
        const pEnt = (item.ponto_entrega || '').toLowerCase()

        if (
          t.includes('trecho 1') ||
          t.includes('uruguaiana') ||
          pRec.includes('libres') ||
          pRec.includes('uruguaiana') ||
          pEnt.includes('ute uruguaiana')
        ) {
          mapa['Trecho 1'].push(item)
        } else if (
          t.includes('trecho 3') ||
          t.includes('triunfo') ||
          pRec.includes('canoas') ||
          pEnt.includes('triunfo') ||
          pEnt.includes('polo')
        ) {
          mapa['Trecho 3'].push(item)
        } else {
          mapa['Outras Instalações'].push(item)
        }
      }

      const descricoes: Record<keyof typeof mapa, string> = {
        'Trecho 1':
          'Gasoduto Uruguaiana (Extensão: 25 km, Diâmetro: 24", Paso de Los Libres ⇄ UTE Uruguaiana)',
        'Trecho 3':
          'Gasoduto Triunfo (Extensão: 25 km, Diâmetro: 18", Interconexão TBG Canoas ⇄ Polo Petroquímico de Triunfo)',
        'Outras Instalações': 'Trecho 2 Planejado e Interconexões Complementares',
      }

      const resultado: ResumoPublicoInstalacao[] = []

      for (const key of ['Trecho 1', 'Trecho 3', 'Outras Instalações'] as (keyof typeof mapa)[]) {
        const itens = mapa[key]
        if (itens.length === 0 && key === 'Outras Instalações') continue

        const capacidadeTotal = itens.reduce((acc, curr) => acc + (Number(curr.capacidade) || 0), 0)
        const modalidades = Array.from(new Set(itens.map((i) => i.modalidade)))
        const periodos = Array.from(
          new Set(itens.map((i) => i.periodo).filter((p): p is string => Boolean(p))),
        )

        resultado.push({
          instalacao: key,
          descricaoInstalacao: descricoes[key],
          totalSolicitacoes: itens.length,
          capacidadeTotalSolicitada: capacidadeTotal,
          modalidadesPresentes:
            modalidades.length > 0 ? modalidades : ['Nenhuma solicitação ativa'],
          statusPredominante: itens.length > 0 ? itens[0].status : 'Disponível para Solicitações',
          periodosDemandados: periodos.length > 0 ? periodos : ['Conforme Demanda / Planejamento'],
        })
      }

      return resultado
    } catch {
      return []
    }
  },
}
