migrate(
  (app) => {
    // Permitir o valor 'area_carregador' no campo select 'origem' da coleção solicitacoes_inciso_vii
    const col = app.findCollectionByNameOrId('solicitacoes_inciso_vii')
    const origemField = col.fields.getByName('origem')
    if (origemField) {
      const valoresAtuais = origemField.values || []
      if (!valoresAtuais.includes('area_carregador')) {
        origemField.values = [...valoresAtuais, 'area_carregador']
        app.save(col)
      }
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('solicitacoes_inciso_vii')
      const origemField = col.fields.getByName('origem')
      if (origemField) {
        origemField.values = (origemField.values || []).filter((v) => v !== 'area_carregador')
        app.save(col)
      }
    } catch (_) {}
  },
)
