migrate(
  (app) => {
    const textoDescricao =
      'Solicitação de acesso formalizada em ambiente autenticado, com protocolo regulatório gerado na confirmação e resposta da transportadora em até 20 dias úteis (Art. 10, §2º, da Resolução ANP nº 11/2016).'

    // 1. Atualizar registro do Inciso VII na coleção transparencia_conteudo
    try {
      const recs = app.findRecordsByFilter(
        'transparencia_conteudo',
        "chave = 'inciso_vii' || chave = 'plataforma_inciso_vii_header'",
        '-created',
        10,
        0,
      )

      for (let i = 0; i < recs.length; i++) {
        const rec = recs[i]
        rec.set('descricao', textoDescricao)
        if (rec.getString('chave') === 'inciso_vii') {
          rec.set('titulo', 'VII. Solicitação de Acesso')
        }
        app.save(rec)
      }
    } catch (e) {
      console.log('Erro ao atualizar textos do Inciso VII:', e)
    }
  },
  (app) => {
    try {
      const recs = app.findRecordsByFilter(
        'transparencia_conteudo',
        "chave = 'inciso_vii' || chave = 'plataforma_inciso_vii_header'",
        '-created',
        10,
        0,
      )

      for (let i = 0; i < recs.length; i++) {
        const rec = recs[i]
        rec.set(
          'descricao',
          'Envio público e direto sem necessidade de login prévio. Gera protocolo regulatório automático com confirmação via e-mail corporativo (SMTP TSB) e prazo legal de resposta de até 20 dias úteis para manifestação técnica e comercial fundamentada por escrito da transportadora.',
        )
        if (rec.getString('chave') === 'inciso_vii') {
          rec.set(
            'titulo',
            'Inciso VII — Consulta de Disponibilidade e Solicitação de Acesso (Firme, Interruptível ou Swap)',
          )
        }
        app.save(rec)
      }
    } catch (_) {}
  },
)
