migrate(
  (app) => {
    // -------------------------------------------------------------------------
    // 1. Atualizar registro boletim_secao1_header:
    //    De: "I - Instalações de Transporte e Serviços Prestados, atualizadas permanentemente"
    //    Para: "I. Instalações de Transporte e Serviços Prestados"
    //    (a nota de atualização "(atualizadas permanentemente)" é renderizada como subtítulo separado)
    // -------------------------------------------------------------------------
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
        if (tituloAtual !== 'I. Instalações de Transporte e Serviços Prestados') {
          r.set('titulo', 'I. Instalações de Transporte e Serviços Prestados')
          app.save(r)
        }
      }
    } catch (e) {
      console.log('Erro ao atualizar cabeçalho boletim_secao1_header:', e)
    }

    // -------------------------------------------------------------------------
    // 2. Atualizar registro boletim_contratos_header:
    //    De: "Contratos de Serviço de Transporte"
    //    Para: "II. Contratos de Serviço de Transporte"
    //    (adicionando o numeral "II." conforme padrão TBG/TAG/NTS)
    // -------------------------------------------------------------------------
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
        if (tituloAtual !== 'II. Contratos de Serviço de Transporte') {
          r.set('titulo', 'II. Contratos de Serviço de Transporte')
          app.save(r)
        }
      }
    } catch (e) {
      console.log('Erro ao atualizar cabeçalho boletim_contratos_header:', e)
    }
  },
  (app) => {
    // Rollback para valores anteriores se necessário
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
        r.set(
          'titulo',
          'I - Instalações de Transporte e Serviços Prestados, atualizadas permanentemente',
        )
        app.save(r)
      }
    } catch (_) {}

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
        r.set('titulo', 'Contratos de Serviço de Transporte')
        app.save(r)
      }
    } catch (_) {}
  },
)
