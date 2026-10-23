migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('transparencia_conteudo')

    const novosSlotsPOCC = [
      // 1. Aprovação da ANP (Ofício nº 555/2025-SIM, PDF) -> Bloco 6 (Resultados das Etapas do Ciclo)
      {
        chave: 'pocc_aprovacao_anp_oficio555',
        rotulo: 'Aprovação ANP',
        titulo: 'Aprovação da ANP (Ofício nº 555/2025-SIM)',
        descricao:
          'Aprovação da ANP que inaugura e autoriza o ciclo do POCC para prestação de serviço de transporte extraordinário (Ofício nº 555/2025/SIM-CTC/SIM/ANP-RJ-e).',
        ordem: 28,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2026/04/OFICIO-No-555_2025_SIM-CTC_SIM_ANP-RJ-e.pdf',
        nome_arquivo_custom: 'Ofício ANP nº 555/2025-SIM (PDF)',
        ativo: true,
      },
      // 2. Contrato Master completo (assinado, 2026) -> Bloco 1 (Instrumentos)
      {
        chave: 'pocc_contrato_master_assinado',
        rotulo: 'Contrato Master',
        titulo: 'Contrato Master Completo (assinado, 2026)',
        descricao:
          'Instrumento contratual fechado e assinado padrão da Transportadora Sulbrasileira de Gás - TSB para o ciclo regulatório de 2026.',
        ordem: 29,
        url_externa: 'https://www.tsb.com.br/wp-content/uploads/2025/12/CONTRATO-MASTER-2026.pdf',
        nome_arquivo_custom: 'Contrato Master Completo 2026 (PDF)',
        ativo: true,
      },
      // 3. Tarifa do Contrato Extraordinário (T3 para 2026, .docx) -> Bloco 1 (Instrumentos)
      {
        chave: 'pocc_tarifa_contrato_extraordinario',
        rotulo: 'Tarifa T3',
        titulo: 'Tarifa do Contrato Extraordinário (T3 para 2026)',
        descricao:
          'Número tarifário real homologado para o Trecho 3 (T3) no horizonte de 2026 para contratos de transporte extraordinário da malha TSB.',
        ordem: 30,
        url_externa: 'https://www.tsb.com.br/wp-content/uploads/2026/02/Tarifa-T3-para-2026-1.docx',
        nome_arquivo_custom: 'Tarifa T3 para 2026 (.docx)',
        ativo: true,
      },
      // 4. Cálculo da Capacidade de Transporte (PDF técnico 1.7.8) -> Bloco 2 (Capacidade Ofertada)
      {
        chave: 'pocc_calculo_capacidade',
        rotulo: 'Memória Técnica',
        titulo: 'Cálculo da Capacidade de Transporte (Item 1.7.8)',
        descricao:
          'Estudo técnico e memória de cálculo da capacidade de transporte da malha TSB, considerando simulação termo-hidráulica e premissas operacionais.',
        ordem: 31,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2023/11/1.7.8-CA%CC%81LCULO-DA-CAPACIDADE-DE-TRANSPORTE.pdf',
        nome_arquivo_custom: 'Cálculo da Capacidade de Transporte (PDF)',
        ativo: true,
      },
      // 5. Cronograma Indicativo do Ciclo Regulatório 2026–2030 (PDF) -> Bloco 3 (Cronograma)
      {
        chave: 'pocc_cronograma_indicativo',
        rotulo: 'Cronograma 2026–2030',
        titulo: 'Cronograma Indicativo do Ciclo Regulatório 2026–2030',
        descricao:
          'Cronograma indicativo oficial com o horizonte plurianual 2026–2030 do ciclo regulatório e etapas do POCC na infraestrutura TSB.',
        ordem: 32,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2026/04/Cronograma-Indicativo-Ciclo-Regulatorio-2026-2030.pdf',
        nome_arquivo_custom: 'Cronograma Indicativo 2026–2030 (PDF)',
        ativo: true,
      },
      // 6. Anexo 4 do POCC 2025 (PDF) -> Bloco 3 (Cronograma)
      {
        chave: 'pocc_anexo4_pocc',
        rotulo: 'Anexo 4 POCC',
        titulo: 'Anexo 4 — Cronograma POCC Produto Firme Anual TSB',
        descricao:
          'Documento oficial do Anexo 4 contendo o detalhamento de prazos e ritos do POCC para contratação de produto firme anual.',
        ordem: 33,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2025/01/ANEXO-4-Cronograma-POCC-2025-PRODUTO-FIRME-ANUAL-TSB.pdf',
        nome_arquivo_custom: 'Anexo 4 — Cronograma POCC (PDF)',
        ativo: true,
      },
    ]

    for (const item of novosSlotsPOCC) {
      let rec
      try {
        rec = app.findFirstRecordByFilter(
          'transparencia_conteudo',
          `secao = 'plataforma_inciso' && chave = '${item.chave}'`,
        )
      } catch (_) {
        rec = null
      }

      if (!rec) {
        rec = new Record(col)
        rec.set('secao', 'plataforma_inciso')
        rec.set('chave', item.chave)
        rec.set('rotulo', item.rotulo)
        rec.set('titulo', item.titulo)
        rec.set('descricao', item.descricao)
        rec.set('ordem', item.ordem)
        rec.set('url_externa', item.url_externa)
        rec.set('nome_arquivo_custom', item.nome_arquivo_custom)
        rec.set('ativo', item.ativo)
        app.save(rec)
      }
    }
  },
  (app) => {
    const chaves = [
      'pocc_aprovacao_anp_oficio555',
      'pocc_contrato_master_assinado',
      'pocc_tarifa_contrato_extraordinario',
      'pocc_calculo_capacidade',
      'pocc_cronograma_indicativo',
      'pocc_anexo4_pocc',
    ]
    for (const ch of chaves) {
      try {
        const rec = app.findFirstRecordByFilter(
          'transparencia_conteudo',
          `secao = 'plataforma_inciso' && chave = '${ch}'`,
        )
        if (rec) app.delete(rec)
      } catch (_) {}
    }
  },
)
