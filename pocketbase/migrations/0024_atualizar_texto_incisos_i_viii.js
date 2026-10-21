migrate(
  (app) => {
    try {
      const records = app.findRecordsByFilter(
        'transparencia_conteudo',
        "secao = 'cabecalho' && chave = 'plataforma_incisos_i_vi_header'",
        '-created',
        10,
        0,
      )

      for (let i = 0; i < records.length; i++) {
        const rec = records[i]
        const descAtual = rec.getString('descricao') || ''
        const descAtualizada = descAtual.replace('incisos I a VI', 'incisos I a VIII')
        rec.set('descricao', descAtualizada)
        rec.set('rotulo', 'Plataforma • Bloco I a VIII')
        app.save(rec)
      }
    } catch (e) {
      console.log('Erro ao atualizar cabecalho plataforma_incisos_i_vi_header:', e)
    }
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter(
        'transparencia_conteudo',
        "secao = 'cabecalho' && chave = 'plataforma_incisos_i_vi_header'",
        '-created',
        10,
        0,
      )

      for (let i = 0; i < records.length; i++) {
        const rec = records[i]
        const descAtual = rec.getString('descricao') || ''
        const descRevertida = descAtual.replace('incisos I a VIII', 'incisos I a VI')
        rec.set('descricao', descRevertida)
        rec.set('rotulo', 'Plataforma • Bloco I a VI')
        app.save(rec)
      }
    } catch (e) {
      console.log('Erro ao reverter cabecalho plataforma_incisos_i_vi_header:', e)
    }
  },
)
