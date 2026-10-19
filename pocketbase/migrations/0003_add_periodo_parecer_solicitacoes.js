migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('solicitacoes_inciso_vii')

    // 1. Adicionar campo 'periodo' (Art. 10, inciso II da Res. 11/2016)
    if (!col.fields.getByName('periodo')) {
      col.fields.add(
        new TextField({
          name: 'periodo',
          required: false, // para não quebrar registros existentes
        }),
      )
    }

    // 2. Adicionar campo 'parecer_fundamentado' (Art. 10 da Res. 11/2016)
    if (!col.fields.getByName('parecer_fundamentado')) {
      col.fields.add(
        new TextField({
          name: 'parecer_fundamentado',
          required: false,
        }),
      )
    }

    // Permitir atualização por operadores autenticados (Gestão Interna)
    col.updateRule = "@request.auth.id != ''"
    col.viewRule = '' // Permitir view público para consulta de protocolo por qualquer pessoa

    app.save(col)

    // Atualizar registro semente existente se estiver vazio
    try {
      const rec = app.findFirstRecordByData('solicitacoes_inciso_vii', 'protocolo', 'TSB-2026-8942')
      if (rec && !rec.getString('periodo')) {
        rec.set('periodo', '01/01/2027 a 31/12/2027')
        rec.set(
          'parecer_fundamentado',
          'Solicitação preliminarmente avaliada e admitida para dimensionamento hidráulico e verificação de capacidade ociosa no trecho Uruguaiana -> Triunfo.',
        )
        app.save(rec)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('solicitacoes_inciso_vii')
      const campoPeriodo = col.fields.getByName('periodo')
      if (campoPeriodo) col.fields.remove(campoPeriodo)
      const campoParecer = col.fields.getByName('parecer_fundamentado')
      if (campoParecer) col.fields.remove(campoParecer)
      col.updateRule = null
      col.viewRule = null
      app.save(col)
    } catch (_) {}
  },
)
