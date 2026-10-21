migrate(
  (app) => {
    // 1. Atualizar select field 'secao' da coleção 'transparencia_conteudo' caso necessário (já possui boletim_master, boletim_secao1, boletim_secao2, plataforma_inciso, cabecalho, monitoramento_congestionamento)
    const col = app.findCollectionByNameOrId('transparencia_conteudo')
    const secaoField = col.fields.getByName('secao')
    if (secaoField) {
      const valoresAtuais = secaoField.values || []
      let mudou = false
      if (!valoresAtuais.includes('boletim_contratos')) {
        valoresAtuais.push('boletim_contratos')
        mudou = true
      }
      if (mudou) {
        secaoField.values = valoresAtuais
        secaoField.maxSelect = 1
        app.save(col)
      }
    }

    const seedCol = app.findCollectionByNameOrId('transparencia_conteudo')

    // 2. Novos slots estruturados no padrão TBG (PDFs estáticos para Contratos e Resumos VII / VIII)
    const novosItens = [
      // -------------------------------------------------------------------------
      // ITEM 1: SEÇÃO CONTRATOS DE SERVIÇO DE TRANSPORTE (Item II, Portaria ANP 1/2003 + Art. 2º Lei 14.134/2021)
      // -------------------------------------------------------------------------
      {
        secao: 'boletim_secao1',
        chave: 'contratos_transporte_documento',
        rotulo: 'Contratos • Item II',
        titulo: 'Contratos de Serviço de Transporte Celebrados',
        descricao:
          'Histórico e dados consolidados dos contratos de transporte: carregador, tipo de serviço, prazos contratuais, evolução de capacidades contratadas, tarifas/descontos aplicados e relação societária entre transportador e carregador, em cumprimento ao Item II da Portaria ANP nº 1/2003 e ao Art. 2º da Lei nº 14.134/2021.',
        ordem: 11,
        url_externa: '',
        nome_arquivo_custom: '',
        ativo: true,
      },

      // -------------------------------------------------------------------------
      // ITEM 2: CABEÇALHO DA SEÇÃO DE CONTRATOS DO BOLETIM
      // -------------------------------------------------------------------------
      {
        secao: 'cabecalho',
        chave: 'boletim_contratos_header',
        rotulo: 'Boletim • Contratos',
        titulo: 'Contratos de Serviço de Transporte',
        descricao:
          'Em cumprimento ao Item II da Portaria ANP nº 1/2003 e ao Art. 2º da Lei nº 14.134/2021, a TSB disponibiliza o documento consolidado contendo as informações históricas de contratos celebrados, partes, vigências, capacidades contratadas e condições tarifárias.',
        ordem: 11,
        url_externa: '',
        nome_arquivo_custom: '',
        ativo: true,
      },

      // -------------------------------------------------------------------------
      // ITEM 3: RESUMO PÚBLICO DAS SOLICITAÇÕES POR PONTO RELEVANTE EM PDF (Art. 9º, VII)
      // -------------------------------------------------------------------------
      {
        secao: 'plataforma_inciso',
        chave: 'resumo_solicitacoes_vii_pdf',
        rotulo: 'Inciso VII • PDF',
        titulo: 'Resumo das Solicitações por Ponto Relevante (Documento Oficial)',
        descricao:
          'Documento consolidado com a relação anônima e agregada das solicitações de acesso por ponto relevante de recebimento e entrega, em conformidade com o Art. 9º, VII da Resolução ANP nº 11/2016 e as diretrizes da LGPD.',
        ordem: 9,
        url_externa: '',
        nome_arquivo_custom: '',
        ativo: true,
      },

      // -------------------------------------------------------------------------
      // ITEM 4: RESUMO DA DEMANDA POR INSTALAÇÃO DE TRANSPORTE EM PDF (Trechos 1 e 3)
      // -------------------------------------------------------------------------
      {
        secao: 'plataforma_inciso',
        chave: 'resumo_demandas_trechos_vii_pdf',
        rotulo: 'Inciso VII • Trechos',
        titulo:
          'Resumo da Demanda por Instalação de Transporte — Trechos 1 e 3 (Documento Oficial)',
        descricao:
          'Demonstrativo consolidado em PDF da capacidade demandada por instalação dutoviária (Trecho 1: Uruguaiana-Triunfo e Trecho 3: Polo Petroquímico), atualizado pela equipe técnica da TSB.',
        ordem: 10,
        url_externa: '',
        nome_arquivo_custom: '',
        ativo: true,
      },

      // -------------------------------------------------------------------------
      // ITEM 5: RESUMO PÚBLICO DAS OFERTAS DE CESSÃO DE CAPACIDADE EM PDF (Art. 9º, VIII)
      // -------------------------------------------------------------------------
      {
        secao: 'plataforma_inciso',
        chave: 'resumo_cessoes_viii_pdf',
        rotulo: 'Inciso VIII • PDF',
        titulo: 'Resumo Público das Ofertas Ativas de Cessão de Capacidade (Documento Oficial)',
        descricao:
          'Publicação oficial das ofertas ativas de capacidade ociosa informadas por carregadores à TSB, elaborada e atualizada manualmente após verificação de conformidade regulatória (Art. 9º, VIII da Resolução ANP nº 11/2016).',
        ordem: 11,
        url_externa: '',
        nome_arquivo_custom: '',
        ativo: true,
      },
    ]

    for (let i = 0; i < novosItens.length; i++) {
      const item = novosItens[i]
      try {
        const existentes = app.findRecordsByFilter(
          'transparencia_conteudo',
          "chave = '" + item.chave + "'",
          '-created',
          1,
          0,
        )
        if (existentes.length === 0) {
          const rec = new Record(seedCol)
          rec.set('secao', item.secao)
          rec.set('chave', item.chave)
          rec.set('rotulo', item.rotulo || '')
          rec.set('titulo', item.titulo)
          rec.set('descricao', item.descricao || '')
          rec.set('ordem', item.ordem || 1)
          rec.set('url_externa', item.url_externa || '')
          rec.set('nome_arquivo_custom', item.nome_arquivo_custom || '')
          rec.set('ativo', item.ativo !== false)
          app.save(rec)
        }
      } catch (e) {
        console.log('Erro ao inserir seed ' + item.chave + ':', e)
      }
    }

    // 3. Atualizar a descrição do cabeçalho de monitoramento de congestionamento (Art. 12)
    // Conforme especificado: onde diz "logo após o envio", passar a dizer que são publicados "após homologação pela ANP"
    try {
      const recsMonitoramento = app.findRecordsByFilter(
        'transparencia_conteudo',
        "chave = 'monitoramento_congestionamento_header'",
        '-created',
        5,
        0,
      )
      for (let i = 0; i < recsMonitoramento.length; i++) {
        const r = recsMonitoramento[i]
        r.set(
          'descricao',
          'Em cumprimento ao Art. 12 da Resolução ANP nº 11/2016, a TSB submete mensalmente à ANP e disponibiliza publicamente os relatórios de monitoramento de utilização de capacidade do sistema dutoviário (Art. 12, caput e §1º) após homologação pela ANP. Os relatórios retratam a consolidação do fluxo operacional e a verificação de eventuais congestionamentos físicos ou contratuais nos pontos de recepção e entrega dos Trechos 1 e 3 da malha dutoviária, assegurando ampla transparência ao mercado.',
        )
        app.save(r)
      }
    } catch (e) {
      console.log('Erro ao atualizar cabeçalho monitoramento_congestionamento_header:', e)
    }

    // 4. Atualizar a nota e descrição do Inciso III da Plataforma Eletrônica para contemplar a previsão de 7 anos (firme) e 2 anos (não-firme)
    try {
      const recsIncisoIII = app.findRecordsByFilter(
        'transparencia_conteudo',
        "chave = 'inciso_iii'",
        '-created',
        5,
        0,
      )
      for (let i = 0; i < recsIncisoIII.length; i++) {
        const r = recsIncisoIII[i]
        r.set(
          'descricao',
          'Demonstrativo de capacidade disponível, capacidade em fluxo oposto ao fluxo físico e capacidade ociosa por ponto relevante. A previsão rolante de 7 anos (firme) e 2 anos (não-firme) é publicada neste documento oficial e atualizada pela área técnica da TSB conforme diretrizes da Resolução ANP nº 11/2016.',
        )
        app.save(r)
      }
    } catch (e) {
      console.log('Erro ao atualizar descrição do inciso_iii:', e)
    }
  },
  (app) => {
    try {
      const chaves = [
        'contratos_transporte_documento',
        'boletim_contratos_header',
        'resumo_solicitacoes_vii_pdf',
        'resumo_demandas_trechos_vii_pdf',
        'resumo_cessoes_viii_pdf',
      ]
      for (let i = 0; i < chaves.length; i++) {
        const recs = app.findRecordsByFilter(
          'transparencia_conteudo',
          "chave = '" + chaves[i] + "'",
        )
        for (let j = 0; j < recs.length; j++) {
          app.delete(recs[j])
        }
      }
    } catch (_) {}
  },
)
