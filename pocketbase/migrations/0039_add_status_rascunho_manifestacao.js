migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('poc_manifestacoes')

    const statusField = col.fields.getByName('status')
    if (statusField) {
      const statusExistentes = statusField.values || []
      const novosStatus = [
        'Documento gerado — aguardando assinatura do representante legal',
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
    // Reversão segura se necessário
    try {
      const col = app.findCollectionByNameOrId('poc_manifestacoes')
      const statusField = col.fields.getByName('status')
      if (statusField) {
        statusField.values = (statusField.values || []).filter(
          (v) => v !== 'Documento gerado — aguardando assinatura do representante legal',
        )
        app.save(col)
      }
    } catch (_) {}
  },
)
