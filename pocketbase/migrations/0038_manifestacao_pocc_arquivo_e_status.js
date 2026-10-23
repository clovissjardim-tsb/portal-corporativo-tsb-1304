migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('poc_manifestacoes')

    // 1. Campo de arquivo assinado (PDF até 50MB)
    if (!col.fields.getByName('arquivo_formulario')) {
      col.fields.add(
        new FileField({
          name: 'arquivo_formulario',
          maxSelect: 1,
          maxSize: 52428800,
          mimeTypes: ['application/pdf'],
          required: false,
        }),
      )
    }

    // 2. Campo origem (area_carregador | manual_interno | portal_web)
    if (!col.fields.getByName('origem')) {
      col.fields.add(
        new SelectField({
          name: 'origem',
          values: ['area_carregador', 'manual_interno', 'portal_web'],
          maxSelect: 1,
          required: false,
        }),
      )
    }

    // 3. Atualizar valores permitidos do status da manifestação
    const statusField = col.fields.getByName('status')
    if (statusField) {
      const statusExistentes = statusField.values || []
      const novosStatus = [
        'Manifestação registrada — aguardando conferência da assinatura',
        'Recebida - Em Análise',
        'Habilitada para Etapa II',
        'Em Ajuste Cadastral',
        'Indeferida',
      ]
      for (const st of novosStatus) {
        if (!statusExistentes.includes(st)) {
          statusExistentes.push(st)
        }
      }
      statusField.values = statusExistentes
    }

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('poc_manifestacoes')
      if (col.fields.getByName('arquivo_formulario')) {
        col.fields.removeByName('arquivo_formulario')
      }
      if (col.fields.getByName('origem')) {
        col.fields.removeByName('origem')
      }
      app.save(col)
    } catch (_) {}
  },
)
