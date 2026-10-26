migrate(
  (app) => {
    // 1. Atualizar poc_manifestacoes
    const colManif = app.findCollectionByNameOrId('poc_manifestacoes')

    if (!colManif.fields.getByName('dados_formulario')) {
      colManif.fields.add(
        new JSONField({
          name: 'dados_formulario',
          maxSize: 1048576,
          required: false,
        }),
      )
    }

    if (!colManif.fields.getByName('rep_autorizado_nome')) {
      colManif.fields.add(new TextField({ name: 'rep_autorizado_nome', required: false }))
    }
    if (!colManif.fields.getByName('rep_autorizado_cpf')) {
      colManif.fields.add(new TextField({ name: 'rep_autorizado_cpf', required: false }))
    }

    const statusManifField = colManif.fields.getByName('status')
    if (statusManifField) {
      const vals = statusManifField.values || []
      const novos = [
        'Submetida',
        'Recebida - Em Análise',
        'Habilitada para Etapa II',
        'Em Ajuste Cadastral',
        'Indeferida',
        'Manifestação registrada — aguardando conferência da assinatura',
        'Documento gerado — aguardando assinatura do representante legal',
      ]
      for (const n of novos) {
        if (!vals.includes(n)) vals.push(n)
      }
      statusManifField.values = vals
    }
    app.save(colManif)

    // 2. Atualizar poc_propostas_vinculantes
    const colProp = app.findCollectionByNameOrId('poc_propostas_vinculantes')

    if (!colProp.fields.getByName('dados_formulario')) {
      colProp.fields.add(
        new JSONField({
          name: 'dados_formulario',
          maxSize: 1048576,
          required: false,
        }),
      )
    }

    if (!colProp.fields.getByName('arquivo_proposta_assinada')) {
      colProp.fields.add(
        new FileField({
          name: 'arquivo_proposta_assinada',
          maxSelect: 1,
          maxSize: 52428800,
          mimeTypes: ['application/pdf'],
          required: false,
        }),
      )
    }

    if (!colProp.fields.getByName('criterio_leilao')) {
      colProp.fields.add(
        new TextField({
          name: 'criterio_leilao',
          required: false,
        }),
      )
    }

    if (!colProp.fields.getByName('capacidade_minima_leilao')) {
      colProp.fields.add(
        new NumberField({
          name: 'capacidade_minima_leilao',
          required: false,
        }),
      )
    }

    if (!colProp.fields.getByName('origem')) {
      colProp.fields.add(
        new SelectField({
          name: 'origem',
          values: ['area_carregador', 'manual_interno', 'portal_web'],
          maxSelect: 1,
          required: false,
        }),
      )
    }

    // Tornar alguns campos que eram obrigatórios mais flexíveis caso os dados estejam em dados_formulario
    // Ex: rep_legal_endereco, rep_legal_cpf, rep_legal_rg, garantia_tipo, capacidade_proposta
    // No pocketbase, manter consistência com o modelo
    const statusPropField = colProp.fields.getByName('status')
    if (statusPropField) {
      const vals = statusPropField.values || []
      const novos = [
        'Submetida',
        'Proposta Recebida',
        'Garantia em Análise',
        'Capacidade Alocada (Art. 37-A, III)',
        'Aguardando Assinatura (Art. 37-A, IV)',
        'Contrato Celebrado e Enviado à ANP (Art. 37-A, V)',
        'Indeferida',
      ]
      for (const n of novos) {
        if (!vals.includes(n)) vals.push(n)
      }
      statusPropField.values = vals
    }
    app.save(colProp)
  },
  (app) => {
    try {
      const colManif = app.findCollectionByNameOrId('poc_manifestacoes')
      if (colManif.fields.getByName('dados_formulario')) {
        colManif.fields.removeByName('dados_formulario')
      }
      if (colManif.fields.getByName('rep_autorizado_nome')) {
        colManif.fields.removeByName('rep_autorizado_nome')
      }
      if (colManif.fields.getByName('rep_autorizado_cpf')) {
        colManif.fields.removeByName('rep_autorizado_cpf')
      }
      app.save(colManif)

      const colProp = app.findCollectionByNameOrId('poc_propostas_vinculantes')
      if (colProp.fields.getByName('dados_formulario')) {
        colProp.fields.removeByName('dados_formulario')
      }
      if (colProp.fields.getByName('arquivo_proposta_assinada')) {
        colProp.fields.removeByName('arquivo_proposta_assinada')
      }
      if (colProp.fields.getByName('criterio_leilao')) {
        colProp.fields.removeByName('criterio_leilao')
      }
      if (colProp.fields.getByName('capacidade_minima_leilao')) {
        colProp.fields.removeByName('capacidade_minima_leilao')
      }
      if (colProp.fields.getByName('origem')) {
        colProp.fields.removeByName('origem')
      }
      app.save(colProp)
    } catch (_) {}
  },
)
