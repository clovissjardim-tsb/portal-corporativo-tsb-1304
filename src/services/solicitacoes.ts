import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface SolicitacaoIncisoVII extends RecordModel {
  razao_social: string
  cnpj: string
  email: string
  modalidade: 'Firme Ordinário' | 'Interruptível'
  capacidade: number
  trecho: string
  periodo?: string
  protocolo: string
  status:
    | 'Solicitação Recebida - Em Análise Técnica'
    | 'Em Análise Técnica'
    | 'Aguardando Documentação'
    | 'Aprovada'
    | 'Rejeitada'
  sla_dias: number
  parecer_fundamentado?: string
}

export type NovaSolicitacaoInput = {
  razao_social: string
  cnpj: string
  email: string
  modalidade: 'Firme Ordinário' | 'Interruptível'
  capacidade: number
  trecho: string
  periodo: string
}

// Interface para agregação pública (SEM dados pessoais - LGPD / Art. 9º, VII)
export interface ResumoPublicoSolicitacao {
  pontoRelevante: string
  trecho: string
  modalidade: string
  totalSolicitacoes: number
  capacidadeTotalSolicitada: number
  statusPredominante: string
  periodosDemandados: string[]
}

export function gerarNumeroProtocolo(): string {
  const ano = new Date().getFullYear()
  const random4 = Math.floor(1000 + Math.random() * 9000)
  return `TSB-${ano}-${random4}`
}

/**
 * Função utilitária com guarda para envio de confirmação de protocolo e SLA por e-mail (Escopo v2, 2.2).
 * Verifica se há infraestrutura real de envio configurada no cliente.
 * Como o Skip Cloud provê e-mails nativos apenas para users auth (verificação/reset) e não há
 * servidor SMTP externo para emails livres cadastrado em secrets, a função detecta e reporta sem simulação.
 */
export async function notificarSolicitacaoPorEmail(
  destinatario: string,
  protocolo: string,
  slaDias: number,
): Promise<{ enviado: boolean; motivo?: string }> {
  // Verificação de suporte de envio de e-mail transacional genérico no backend
  // Não simular com setTimeout nem fakes:
  if (!destinatario || !protocolo) {
    return { enviado: false, motivo: 'Parâmetros incompletos.' }
  }

  // Deixar o fluxo preparado caso haja endpoint futuro de envio
  try {
    // Se no futuro houver hook customizado /api/notificar-protocolo
    // const res = await pb.send('/api/notificar-protocolo', { method: 'POST', body: { destinatario, protocolo, slaDias } })
    // return { enviado: true }
    return {
      enviado: false,
      motivo:
        'Envio de e-mail transacional externo pendente de configuração de servidor SMTP corporativo no Skip Cloud.',
    }
  } catch (err) {
    return {
      enviado: false,
      motivo: err instanceof Error ? err.message : 'Falha no envio de e-mail.',
    }
  }
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
    const registro = await pb.collection<SolicitacaoIncisoVII>('solicitacoes_inciso_vii').create({
      ...data,
      protocolo,
      status: 'Solicitação Recebida - Em Análise Técnica',
      sla_dias: 20,
      parecer_fundamentado:
        'Solicitação de acesso formalmente recepcionada. Em processo de análise de viabilidade técnico-operacional e verificação de capacidade ociosa nos pontos de conexão.',
    })

    // Tentar notificação por e-mail com guarda (sem simulação falsa)
    try {
      await notificarSolicitacaoPorEmail(data.email, protocolo, 20)
    } catch {
      // Best-effort
    }

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

  /**
   * Obtém resumo público e consolidado por Ponto Relevante/Trecho (Art. 9º, Inciso VII).
   * 100% em conformidade com a LGPD: suprime Razão Social, CNPJ e e-mails de solicitantes.
   */
  async obterResumoPublico(): Promise<ResumoPublicoSolicitacao[]> {
    const lista = await this.listar()

    // Agrupar por trecho/ponto
    const grupos: Record<string, SolicitacaoIncisoVII[]> = {}

    for (const item of lista) {
      const chave = `${item.trecho}__${item.modalidade}`
      if (!grupos[chave]) {
        grupos[chave] = []
      }
      grupos[chave].push(item)
    }

    const resumo: ResumoPublicoSolicitacao[] = Object.entries(grupos).map(([_, itens]) => {
      const primeiro = itens[0]
      const capacidadeTotal = itens.reduce((acc, curr) => acc + (Number(curr.capacidade) || 0), 0)
      const periodos = Array.from(
        new Set(itens.map((i) => i.periodo).filter((p): p is string => Boolean(p))),
      )

      return {
        pontoRelevante:
          primeiro.trecho.includes('Uruguaiana') || primeiro.trecho.includes('Triunfo')
            ? 'EMED Uruguaiana / EMED Triunfo'
            : 'Pontos do Sistema TSB',
        trecho: primeiro.trecho,
        modalidade: primeiro.modalidade,
        totalSolicitacoes: itens.length,
        capacidadeTotalSolicitada: capacidadeTotal,
        statusPredominante: itens[0].status,
        periodosDemandados: periodos.length > 0 ? periodos : ['Conforme Edital/Acordo'],
      }
    })

    return resumo
  },
}
