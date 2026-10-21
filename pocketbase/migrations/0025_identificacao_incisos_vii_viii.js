migrate(
  (app) => {
    // 1. Atualizar ou criar cabeçalho oficial do Inciso VII em transparencia_conteudo
    try {
      const recordsVII = app.findRecordsByFilter(
        'transparencia_conteudo',
        "chave = 'plataforma_inciso_vii_header' || (secao = 'plataforma_inciso' && chave = 'inciso_vii')",
        '-created',
        10,
        0,
      )

      for (let i = 0; i < recordsVII.length; i++) {
        const rec = recordsVII[i]
        rec.set('rotulo', 'Inciso VII')
        if (rec.getString('chave') === 'inciso_vii') {
          rec.set(
            'titulo',
            'Inciso VII — Consulta de Disponibilidade e Solicitação de Acesso (Firme, Interruptível ou Swap)',
          )
        } else if (rec.getString('chave') === 'plataforma_inciso_vii_header') {
          rec.set(
            'titulo',
            'Inciso VII — Amparo Legal: Art. 9º, Inciso VII e Art. 10 da Resolução ANP nº 11/2016',
          )
        }
        app.save(rec)
      }
    } catch (e) {
      console.log('Erro ao atualizar cabeçalho do Inciso VII:', e)
    }

    // 2. Harmonizar e atualizar cabeçalho oficial do Inciso VIII em transparencia_conteudo
    try {
      const recordsVIII = app.findRecordsByFilter(
        'transparencia_conteudo',
        "chave = 'plataforma_inciso_viii_header' || (secao = 'plataforma_inciso' && chave = 'inciso_viii')",
        '-created',
        10,
        0,
      )

      for (let i = 0; i < recordsVIII.length; i++) {
        const rec = recordsVIII[i]
        rec.set('rotulo', 'Inciso VIII')
        if (rec.getString('chave') === 'inciso_viii') {
          rec.set(
            'titulo',
            'Inciso VIII — Resumo das Ofertas de Cessão de Capacidade Contratada Informadas ao Transportador por Carregadores',
          )
        }
        app.save(rec)
      }
    } catch (e) {
      console.log('Erro ao atualizar cabeçalho do Inciso VIII:', e)
    }
  },
  (app) => {
    try {
      const recordsVII = app.findRecordsByFilter(
        'transparencia_conteudo',
        "chave = 'plataforma_inciso_vii_header' || (secao = 'plataforma_inciso' && chave = 'inciso_vii')",
        '-created',
        10,
        0,
      )
      for (let i = 0; i < recordsVII.length; i++) {
        const rec = recordsVII[i]
        rec.set('rotulo', 'VII')
        if (rec.getString('chave') === 'inciso_vii') {
          rec.set('titulo', 'VII - Consulta de disponibilidade de acesso (Solicitação de Acesso)')
        }
        app.save(rec)
      }
    } catch (_) {}

    try {
      const recordsVIII = app.findRecordsByFilter(
        'transparencia_conteudo',
        "chave = 'plataforma_inciso_viii_header' || (secao = 'plataforma_inciso' && chave = 'inciso_viii')",
        '-created',
        10,
        0,
      )
      for (let i = 0; i < recordsVIII.length; i++) {
        const rec = recordsVIII[i]
        rec.set('rotulo', 'VIII')
        if (rec.getString('chave') === 'inciso_viii') {
          rec.set(
            'titulo',
            'VIII - Resumo das Ofertas de Cessão de Capacidade Contratada Informadas ao Transportador por Carregadores',
          )
        }
        app.save(rec)
      }
    } catch (_) {}
  },
)
