migrate(
  (app) => {
    // -------------------------------------------------------------------------
    // Inversão explícita solicitada pelo usuário:
    // Bloco Contratos passa a ser "I. Contratos de Serviço de Transporte"
    // Bloco Instalações passa a ser "II. Instalações de Transporte e Serviços Prestados"
    // -------------------------------------------------------------------------

    // 1. Atualizar registro boletim_contratos_header para "I. Contratos de Serviço de Transporte"
    try {
      const recsContratos = app.findRecordsByFilter(
        'transparencia_conteudo',
        "chave = 'boletim_contratos_header'",
        '-created',
        10,
        0,
      )
      for (let i = 0; i < recsContratos.length; i++) {
        const r = recsContratos[i]
        const tituloAtual = r.getString('titulo')
        if (tituloAtual !== 'I. Contratos de Serviço de Transporte') {
          r.set('titulo', 'I. Contratos de Serviço de Transporte')
          app.save(r)
        }
      }
    } catch (e) {
      console.log('Erro ao atualizar cabeçalho boletim_contratos_header para Item I:', e)
    }

    // 2. Atualizar registro boletim_secao1_header para "II. Instalações de Transporte e Serviços Prestados"
    try {
      const recsSecao1 = app.findRecordsByFilter(
        'transparencia_conteudo',
        "chave = 'boletim_secao1_header'",
        '-created',
        10,
        0,
      )
      for (let i = 0; i < recsSecao1.length; i++) {
        const r = recsSecao1[i]
        const tituloAtual = r.getString('titulo')
        if (tituloAtual !== 'II. Instalações de Transporte e Serviços Prestados') {
          r.set('titulo', 'II. Instalações de Transporte e Serviços Prestados')
          app.save(r)
        }
      }
    } catch (e) {
      console.log('Erro ao atualizar cabeçalho boletim_secao1_header para Item II:', e)
    }

    // 3. Atualizar rótulo de contratos_transporte_documento se necessário
    try {
      const recsDocContratos = app.findRecordsByFilter(
        'transparencia_conteudo',
        "chave = 'contratos_transporte_documento'",
        '-created',
        10,
        0,
      )
      for (let i = 0; i < recsDocContratos.length; i++) {
        const r = recsDocContratos[i]
        if (r.getString('rotulo') === 'Contratos • Item II') {
          r.set('rotulo', 'Contratos • Item I')
          app.save(r)
        }
      }
    } catch (e) {
      console.log('Erro ao atualizar rótulo contratos_transporte_documento:', e)
    }
  },
  (app) => {
    // Reverter para estado da migration 0027
    try {
      const recsContratos = app.findRecordsByFilter(
        'transparencia_conteudo',
        "chave = 'boletim_contratos_header'",
        '-created',
        10,
        0,
      )
      for (let i = 0; i < recsContratos.length; i++) {
        const r = recsContratos[i]
        r.set('titulo', 'II. Contratos de Serviço de Transporte')
        app.save(r)
      }
    } catch (_) {}

    try {
      const recsSecao1 = app.findRecordsByFilter(
        'transparencia_conteudo',
        "chave = 'boletim_secao1_header'",
        '-created',
        10,
        0,
      )
      for (let i = 0; i < recsSecao1.length; i++) {
        const r = recsSecao1[i]
        r.set('titulo', 'I. Instalações de Transporte e Serviços Prestados')
        app.save(r)
      }
    } catch (_) {}

    try {
      const recsDocContratos = app.findRecordsByFilter(
        'transparencia_conteudo',
        "chave = 'contratos_transporte_documento'",
        '-created',
        10,
        0,
      )
      for (let i = 0; i < recsDocContratos.length; i++) {
        const r = recsDocContratos[i]
        r.set('rotulo', 'Contratos • Item II')
        app.save(r)
      }
    } catch (_) {}
  },
)
