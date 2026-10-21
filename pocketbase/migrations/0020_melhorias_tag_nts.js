migrate(
  (app) => {
    // 1. Atualizar select field 'secao' da coleção 'transparencia_conteudo' para incluir 'monitoramento_congestionamento'
    const col = app.findCollectionByNameOrId('transparencia_conteudo')
    const secaoField = col.fields.getByName('secao')

    if (secaoField) {
      const valoresAtuais = secaoField.values || []
      if (!valoresAtuais.includes('monitoramento_congestionamento')) {
        secaoField.values = [...valoresAtuais, 'monitoramento_congestionamento']
        secaoField.maxSelect = 1
        app.save(col)
      }
    }

    // 2. Seeds canônicos de referência TAG/NTS em 'transparencia_conteudo'
    const seedCol = app.findCollectionByNameOrId('transparencia_conteudo')

    const novosItens = [
      // -------------------------------------------------------------------------
      // ITEM 1: TEXTO EXPLICATIVO DE CAPACIDADE FIRME (PADRÃO NTS) JUNTO AO ITEM g)
      // -------------------------------------------------------------------------
      {
        secao: 'cabecalho',
        chave: 'boletim_explicativo_capacidade_g',
        rotulo: 'Boletim • Explicativo Item g)',
        titulo:
          'Entendimento Conceitual sobre Capacidade Firme e Simulação Termo-Hidráulica (Padrão NTS)',
        descricao:
          'A Capacidade Técnica Máxima (CTM) resulta da simulação termo-hidráulica do gasoduto considerando pressões, vazões nominais e o perfil operacional de entrada e saída. A Capacidade Comercial (CC) é obtida deduzindo-se da capacidade técnica o consumo operacional/gás combustível e as margens prudenciais de segurança do sistema dutoviário. Os percentuais de capacidade firme, interrompível e de curto prazo (contratos com vigência inferior a um ano) devem ser informados aos agentes e à ANP, em conformidade com a Portaria ANP nº 1/2003 (Art. 2º, I, "g") e a Resolução ANP nº 11/2016.',
        ordem: 8,
        url_externa: '',
        nome_arquivo_custom: '',
        ativo: true,
      },

      // -------------------------------------------------------------------------
      // ITEM 2: AVISO DE FAIXAS DE SERVIDÃO (RES. ANP Nº 42/2012, ART. 46 — PADRÃO NTS)
      // -------------------------------------------------------------------------
      {
        secao: 'cabecalho',
        chave: 'aviso_faixas_servidao',
        rotulo: 'Institucional / Boletim • Faixas de Servidão',
        titulo:
          'Aviso Regulatório: Segurança e Integridade das Faixas de Servidão de Gasodutos (Resolução ANP nº 42/2012, Art. 46)',
        descricao:
          'As faixas de servidão administrativas dos gasodutos pertencem a terceiros ou ao poder público, constituindo áreas de utilidade pública legalmente gravadas para a segurança da população, do meio ambiente e da infraestrutura de transporte de gás natural. Conforme o Art. 46 da Resolução ANP nº 42/2012, qualquer interferência física nas faixas de dutos — incluindo obras de construção civil, plantio de árvores de porte, escavações, aterros, trânsito de máquinas pesadas ou instalação de cruzamentos de outras concessionárias — é estritamente condicionada à consulta, análise técnica e autorização formal prévia da Transportadora Sulbrasileira de Gás (TSB). Em caso de planejamento de intervenção, entre em contato imediatamente com a engenharia e segurança operacional da TSB através de regulacao@tsb.com.br.',
        ordem: 9,
        url_externa: '',
        nome_arquivo_custom: 'Ver Resolução ANP nº 42/2012',
        ativo: true,
      },

      // -------------------------------------------------------------------------
      // ITEM 3: CABEÇALHO DO MONITORAMENTO DE CONGESTIONAMENTO (RES. ANP 11/2016, ART. 12)
      // -------------------------------------------------------------------------
      {
        secao: 'cabecalho',
        chave: 'monitoramento_congestionamento_header',
        rotulo: 'Boletim • Monitoramento Congestionamento',
        titulo: 'Monitoramento de Utilização da Capacidade e Congestionamento Físico e Contratual',
        descricao:
          'Em cumprimento ao Art. 12 da Resolução ANP nº 11/2016, a TSB submete mensalmente à ANP e disponibiliza publicamente os relatórios de monitoramento de utilização de capacidade do sistema dutoviário (Art. 12, caput e §1º). Os relatórios retratam a consolidação do fluxo operacional e a verificação de eventuais congestionamentos físicos ou contratuais nos pontos de recepção e entrega dos Trechos 1 e 3 da malha dutoviária, assegurando ampla transparência ao mercado.',
        ordem: 10,
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
          "secao = '" + item.secao + "' && chave = '" + item.chave + "'",
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
        console.log('Erro ao inserir seed de cabeçalho ' + item.chave + ':', e)
      }
    }
  },
  (app) => {
    // Reverter seeds inseridos
    try {
      const recs = app.findRecordsByFilter(
        'transparencia_conteudo',
        "chave IN ('boletim_explicativo_capacidade_g', 'aviso_faixas_servidao', 'monitoramento_congestionamento_header')",
      )
      for (let i = 0; i < recs.length; i++) {
        app.delete(recs[i])
      }
    } catch (_) {}
  },
)
