migrate(
  (app) => {
    // -------------------------------------------------------------------------
    // Restauração à ordem e redação literal do Art. 2º da Portaria ANP nº 1/2003:
    // Item I: "I – Instalações de Transporte e Serviços Prestados" (atualizadas permanentemente)
    // Item II: "II – Contratos de Serviço de Transporte" (atualizado sempre que houver...)
    // -------------------------------------------------------------------------

    // 1. Atualizar boletim_secao1_header para Item I
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
        r.set('titulo', 'I – Instalações de Transporte e Serviços Prestados')
        r.set('rotulo', 'Boletim • Item I')
        r.set(
          'descricao',
          'Instalações de transporte e serviços prestados indicando termos e condições gerais, modelos de contrato por tipo de serviço, acordos operacionais e de conexão, mapa atualizado, características físicas e capacidade máxima, capacidade disponível para transporte firme, quantidades programadas e realizadas, interrupções e ampliações planejadas.',
        )
        app.save(r)
      }
    } catch (e) {
      console.log('Erro ao atualizar boletim_secao1_header para Item I:', e)
    }

    // 2. Atualizar boletim_contratos_header para Item II
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
        r.set('titulo', 'II – Contratos de Serviço de Transporte')
        r.set('rotulo', 'Boletim • Item II')
        r.set(
          'descricao',
          'Atualizado sempre que houver assinatura de um novo contrato ou alteração de contrato vigente, indicando: nome completo do Carregador; tipo de serviço; data de início e término do contrato; evolução das capacidades contratadas; tarifas e descontos aplicados a cada carregador; relação acionária entre Transportador e Carregador.',
        )
        app.save(r)
      }
    } catch (e) {
      console.log('Erro ao atualizar boletim_contratos_header para Item II:', e)
    }

    // 3. Atualizar rótulo do documento contratos_transporte_documento para Item II
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
    } catch (e) {
      console.log('Erro ao atualizar rótulo contratos_transporte_documento:', e)
    }

    // 4. Garantir títulos das alíneas a) a j) alinhados com o texto literal da Portaria
    const alineasNorma = [
      {
        chave: 'alinea_a',
        titulo: 'Termos e condições gerais de prestação de serviço',
      },
      {
        chave: 'alinea_b',
        titulo: 'Modelo de contrato para cada tipo de serviço',
      },
      {
        chave: 'alinea_c',
        titulo: 'Modelo de Acordo de Conexão',
      },
      {
        chave: 'alinea_d',
        titulo:
          'Modelo de Acordo Operativo de Alocação das Quantidades de Gás nas Estações de Entrega',
      },
      {
        chave: 'alinea_e',
        titulo: 'Mapa atualizado das instalações de transporte',
      },
      {
        chave: 'alinea_f',
        titulo:
          'Características físicas e capacidade máxima das instalações de transporte, nas melhores condições operacionais',
      },
      {
        chave: 'alinea_g',
        titulo:
          'Capacidade disponível para prestação de novos serviços de Transporte Firme nas melhores condições operacionais',
      },
      {
        chave: 'alinea_h',
        titulo:
          'Quantidades programadas e realizadas de gás nos pontos de recepção e entrega (dados diários, referentes ao mês anterior)',
      },
      {
        chave: 'alinea_i',
        titulo: 'Interrupções e reduções de capacidade, atuais e planejadas',
      },
      {
        chave: 'alinea_j',
        titulo: 'Ampliações planejadas',
      },
    ]

    for (let i = 0; i < alineasNorma.length; i++) {
      const a = alineasNorma[i]
      try {
        const recs = app.findRecordsByFilter(
          'transparencia_conteudo',
          "chave = '" + a.chave + "'",
          '-created',
          1,
          0,
        )
        if (recs.length > 0) {
          const r = recs[0]
          r.set('titulo', a.titulo)
          app.save(r)
        }
      } catch (e) {
        console.log('Erro ao atualizar título da ' + a.chave + ':', e)
      }
    }
  },
  (app) => {
    // Reversão
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
        r.set('titulo', 'II. Instalações de Transporte e Serviços Prestados')
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
        r.set('titulo', 'I. Contratos de Serviço de Transporte')
        app.save(r)
      }
    } catch (_) {}
  },
)
