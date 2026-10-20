import pb from '@/lib/pocketbase/client'

export interface QuadroTarifa {
  id: string
  chave: string
  titulo: string
  texto_explicativo: string
  valor_mil_m3: string
  valor_mmbtu: string
  entrada_percentual: string
  entrada_valor_mmbtu: string
  entrada_valor_mil_m3: string
  saida_percentual: string
  saida_valor_mmbtu: string
  saida_valor_mil_m3: string
  ativo: boolean
  ano_vigencia?: string
  created?: string
  updated?: string
}

export const TARIFA_SEED_FALLBACK: QuadroTarifa = {
  id: 'fallback_2026',
  chave: 'principal',
  titulo: 'TARIFA CONTRATO EXTRAORDINÁRIO TRECHO T3 – 2026',
  texto_explicativo:
    'Tarifa ex-impostos para 2026, considerando a variação de -1,05% do IGP-M de 2025 (55%) e de 4,26% do IPCA de 2025 (45%):',
  valor_mil_m3: '59,1750',
  valor_mmbtu: '1,5864',
  entrada_percentual: '70% Entrada',
  entrada_valor_mmbtu: '1,1089',
  entrada_valor_mil_m3: '41,3628',
  saida_percentual: '30% Saída',
  saida_valor_mmbtu: '0,4775',
  saida_valor_mil_m3: '17,8122',
  ativo: true,
  ano_vigencia: '2026',
}

export const tarifaService = {
  /**
   * Obtém o quadro de tarifa principal ativo para a página inicial
   */
  async obterTarifaPrincipal(): Promise<QuadroTarifa | null> {
    try {
      const records = await pb.collection('quadro_tarifa').getList<QuadroTarifa>(1, 1, {
        filter: 'chave = "principal"',
        sort: '-created',
        requestKey: null,
      })

      if (records.items.length > 0) {
        return records.items[0]
      }

      // Se a tabela estiver vazia, retorna o fallback da regulamentação 2026
      return TARIFA_SEED_FALLBACK
    } catch (error) {
      console.warn('Não foi possível obter quadro de tarifa do PocketBase; usando fallback:', error)
      return TARIFA_SEED_FALLBACK
    }
  },

  /**
   * Salva ou atualiza os dados do quadro de tarifa (exige autenticação)
   */
  async salvarTarifa(dados: Partial<QuadroTarifa> & { id?: string }): Promise<QuadroTarifa> {
    if (dados.id && dados.id !== 'fallback_2026') {
      const { id, created, updated, ...camposParaAtualizar } = dados
      return await pb
        .collection('quadro_tarifa')
        .update<QuadroTarifa>(id, camposParaAtualizar, { requestKey: null })
    }

    // Verificar se já existe registro com chave principal
    try {
      const existente = await pb
        .collection('quadro_tarifa')
        .getFirstListItem<QuadroTarifa>('chave = "principal"', { requestKey: null })
      const { id, created, updated, ...campos } = dados
      return await pb.collection('quadro_tarifa').update<QuadroTarifa>(existente.id, campos, {
        requestKey: null,
      })
    } catch {
      // Cria novo registro
      const novo = {
        chave: 'principal',
        ...dados,
      }
      return await pb.collection('quadro_tarifa').create<QuadroTarifa>(novo, {
        requestKey: null,
      })
    }
  },
}
