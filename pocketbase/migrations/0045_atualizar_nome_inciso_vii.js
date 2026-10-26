migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('transparencia_conteudo')
      const rec = app.findFirstRecordByData('transparencia_conteudo', 'chave', 'inciso_vii')
      if (rec) {
        rec.set('titulo', 'VII. Solicitação de Acesso à Capacidade de Transporte')
        rec.set('rotulo', 'Inciso VII • Solicitação de Acesso à Capacidade de Transporte')
        app.save(rec)
      }
    } catch (err) {
      console.warn('Registro inciso_vii não encontrado ou erro ao atualizar no seed:', err)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('transparencia_conteudo')
      const rec = app.findFirstRecordByData('transparencia_conteudo', 'chave', 'inciso_vii')
      if (rec) {
        rec.set('titulo', 'VII. Solicitação de Acesso')
        rec.set('rotulo', 'Inciso VII')
        app.save(rec)
      }
    } catch (err) {
      // ignore
    }
  },
)
