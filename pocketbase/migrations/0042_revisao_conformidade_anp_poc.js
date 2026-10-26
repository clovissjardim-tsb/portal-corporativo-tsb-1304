migrate(
  (app) => {
    // 1. Atualizar registros em transparencia_conteudo relacionados à POC (sem alterar home / quadro_tarifa)
    try {
      const recTarifa = app.findFirstRecordByFilter(
        'transparencia_conteudo',
        "chave = 'pocc_tarifa_contrato_extraordinario'",
      )
      if (recTarifa) {
        recTarifa.set('titulo', 'Tarifa do Contrato de Capacidade Firme (T3 para 2026)')
        recTarifa.set(
          'descricao',
          'Tarifa homologada pela ANP para o Trecho 3 (T3) no horizonte de 2026 para contratação de capacidade firme na malha dutoviária da TSB.',
        )
        recTarifa.set('rotulo', 'Tarifa Firme T3')
        recTarifa.set('nome_arquivo_custom', 'Tarifa Firme T3 para 2026 (.docx)')
        app.save(recTarifa)
      }
    } catch (_) {}

    try {
      const recOficio = app.findFirstRecordByFilter(
        'transparencia_conteudo',
        "chave = 'pocc_aprovacao_anp_oficio555'",
      )
      if (recOficio) {
        recOficio.set('titulo', 'Aprovação da ANP (Ofício nº 555/2025-SIM)')
        recOficio.set(
          'descricao',
          'Aprovação da ANP que autoriza o ciclo do POC para prestação de serviço de transporte em regime de capacidade firme (Ofício nº 555/2025/SIM-CTC/SIM/ANP-RJ-e).',
        )
        app.save(recOficio)
      }
    } catch (_) {}

    try {
      const recRegulamento = app.findFirstRecordByFilter(
        'transparencia_conteudo',
        "chave = 'pocc_regulamento'",
      )
      if (recRegulamento) {
        recRegulamento.set('nome_arquivo_custom', 'Regulamento do POC (PDF)')
        app.save(recRegulamento)
      }
    } catch (_) {}

    try {
      const recModeloMI = app.findFirstRecordByFilter(
        'transparencia_conteudo',
        "chave = 'pocc_modelo_manifestacao_interesse'",
      )
      if (recModeloMI) {
        recModeloMI.set('titulo', 'Modelo de Manifestação de Interesse (POC — Art. 37-A, §5º, I)')
        app.save(recModeloMI)
      }
    } catch (_) {}

    try {
      const recModeloPG = app.findFirstRecordByFilter(
        'transparencia_conteudo',
        "chave = 'pocc_modelo_proposta_garantida'",
      )
      if (recModeloPG) {
        recModeloPG.set(
          'titulo',
          'Modelo de Proposta Garantida Vinculante (POC — Art. 37-A, §5º, III)',
        )
        app.save(recModeloPG)
      }
    } catch (_) {}

    try {
      const recCronograma = app.findFirstRecordByFilter(
        'transparencia_conteudo',
        "chave = 'pocc_cronograma_indicativo'",
      )
      if (recCronograma) {
        recCronograma.set(
          'descricao',
          'Cronograma indicativo oficial com o horizonte plurianual 2026–2030 do ciclo regulatório e etapas do POC na infraestrutura TSB.',
        )
        app.save(recCronograma)
      }
    } catch (_) {}

    try {
      const recAnexo4 = app.findFirstRecordByFilter(
        'transparencia_conteudo',
        "chave = 'pocc_anexo4_pocc'",
      )
      if (recAnexo4) {
        recAnexo4.set('rotulo', 'Anexo 4 POC')
        recAnexo4.set('titulo', 'Anexo 4 — Cronograma POC Produto Firme Anual TSB')
        recAnexo4.set(
          'descricao',
          'Documento oficial do Anexo 4 contendo o detalhamento de prazos e ritos do POC para contratação de produto firme anual.',
        )
        recAnexo4.set('nome_arquivo_custom', 'Anexo 4 — Cronograma POC (PDF)')
        app.save(recAnexo4)
      }
    } catch (_) {}

    try {
      const recResultados = app.findFirstRecordByFilter(
        'transparencia_conteudo',
        "chave = 'pocc_resultados_ciclo'",
      )
      if (recResultados) {
        recResultados.set('nome_arquivo_custom', 'Aprovação ANP Proposta Tarifária e POC (DOU)')
        app.save(recResultados)
      }
    } catch (_) {}

    // 2. Atualizar títulos e nomenclaturas em poc_documentos
    try {
      const docs = app.findRecordsByFilter('poc_documentos', 'ativo = true', 'ordem', 50, 0)
      for (const d of docs) {
        const chave = d.getString('chave')
        let alterado = false

        if (chave === 'edital_pocc_2026') {
          d.set('nome_arquivo_custom', 'Edital POC 2026/2027 (Oficial)')
          alterado = true
        } else if (chave === 'regulamento_pocc_2026') {
          d.set(
            'titulo',
            'Regulamento do POC — Regras Gerais, Habilitação e Alocação de Capacidade',
          )
          d.set('nome_arquivo_custom', 'Regulamento Geral do POC')
          alterado = true
        } else if (chave === 'cronograma_detalhado_2026') {
          d.set('titulo', 'Cronograma Detalhado do POC e Prazos Preclusivos (Art. 38-A, I)')
          alterado = true
        } else if (chave === 'comunicados_oficiais_2026') {
          d.set('titulo', 'Comunicados Oficiais, Circulares e Esclarecimentos da Comissão do POC')
          alterado = true
        } else if (chave === 'faq_pocc_2026') {
          d.set(
            'descricao',
            'Guia de dúvidas frequentes sobre autorização prévia da ANP, etapas do ciclo, garantias e contratação de capacidade firme.',
          )
          alterado = true
        }

        if (alterado) {
          app.save(d)
        }
      }
    } catch (_) {}
  },
  (app) => {
    // Reversão opcional (no-op seguro para backfills de nomenclatura)
  },
)
