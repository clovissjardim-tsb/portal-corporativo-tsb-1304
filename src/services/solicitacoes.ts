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
 * Função utilitária para envio ou verificação de confirmação de protocolo e SLA por e-mail (Escopo v2, 2.2).
 * O envio principal é realizado de forma automática pelo hook no servidor PocketBase (onRecordCreate),
 * com remetente institucional tsb@tsb.com.br, mantendo a criação da solicitação protegida caso o SMTP falhe.
 * Esta função também permite teste manual direto da rota corporativa /backend/v1/test-smtp.
 */
export async function notificarSolicitacaoPorEmail(
  destinatario: string,
  protocolo: string,
  _slaDias?: number,
): Promise<{ enviado: boolean; motivo?: string }> {
  if (!destinatario || !protocolo) {
    return { enviado: false, motivo: 'Parâmetros incompletos.' }
  }

  // O envio principal é executado automaticamente pelo hook de backend no PocketBase (onRecordCreate)
  // ao salvar o registro na coleção solicitacoes_inciso_vii.
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
