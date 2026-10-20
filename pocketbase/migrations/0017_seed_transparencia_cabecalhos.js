migrate(
  (app) => {
    // 1. Atualizar select field 'secao' da coleção 'transparencia_conteudo' para incluir 'cabecalho'
    const col = app.findCollectionByNameOrId('transparencia_conteudo')
    const secaoField = col.fields.getByName('secao')

    if (secaoField) {
      // Garantir que 'cabecalho' faça parte dos valores aceitos
      const valoresAtuais = secaoField.values || []
      if (!valoresAtuais.includes('cabecalho')) {
        secaoField.values = [...valoresAtuais, 'cabecalho']
        secaoField.maxSelect = 1
        app.save(col)
      }
    }

    // 2. Seeds idempotentes dos novos itens de cabeçalho
    const seedCol = app.findCollectionByNameOrId('transparencia_conteudo')

    const cabecalhosIniciais = [
      // -------------------------------------------------------------------------
      // BOLETIM ELETRÔNICO - CABEÇALHOS
      // -------------------------------------------------------------------------
      {
        secao: 'cabecalho',
        chave: 'boletim_topo',
        rotulo: 'Boletim • Abertura',
        titulo: 'Boletim Eletrônico',
        descricao:
          'Estabelece os procedimentos para o envio das informações referentes às atividades de transporte e de compra e venda de gás natural ao mercado, aos Carregadores e à Agência Nacional do Petróleo - ANP.',
        ordem: 1,
        url_externa: '',
        nome_arquivo_custom: 'Baixar Arquivo / Portaria ANP',
        ativo: true,
      },
      {
        secao: 'cabecalho',
        chave: 'boletim_master_header',
        rotulo: 'Boletim • Bloco Master',
        titulo:
          'Modelo de Contrato Master de Transporte Firme para períodos de curto prazo e anuais',
        descricao:
          'Estabelece os procedimentos para o envio das informações referentes às atividades de transporte e de compra e venda de gás natural ao mercado, aos Carregadores e à Agência Nacional do Petróleo - ANP.',
        ordem: 2,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2025/03/CONTRATO-MASTER-TSB-2025-2029.pdf',
        nome_arquivo_custom: 'Baixar Arquivo',
        ativo: true,
      },
      {
        secao: 'cabecalho',
        chave: 'boletim_secao1_header',
        rotulo: 'Boletim • Bloco I',
        titulo: 'I - Instalações de Transporte e Serviços Prestados, atualizadas permanentemente',
        descricao:
          'Informações sobre instalações de transporte dutoviário, modelos contratuais, mapas e termos gerais de serviço.',
        ordem: 3,
        url_externa: '',
        nome_arquivo_custom: 'Baixar Documento',
        ativo: true,
      },
      {
        secao: 'cabecalho',
        chave: 'boletim_secao2_header',
        rotulo: 'Boletim • Bloco II',
        titulo: 'II - Quantidades Programadas e realizadas nos Trechos 1 e 3',
        descricao:
          'Série histórica e demonstrativos mensais de quantidades programadas e realizadas de gás natural nos pontos de recepção e entrega.',
        ordem: 4,
        url_externa: 'https://www.tsb.com.br/boletim-eletronico/',
        nome_arquivo_custom: 'Consultar no Site Oficial',
        ativo: true,
      },

      // -------------------------------------------------------------------------
      // PLATAFORMA ELETRÔNICA - CABEÇALHOS
      // -------------------------------------------------------------------------
      {
        secao: 'cabecalho',
        chave: 'plataforma_topo',
        rotulo: 'Plataforma • Abertura',
        titulo: 'Plataforma Eletrônica',
        descricao:
          'Conforme estabelecido pelo Art. 9º da Resolução ANP nº 11 de 16/03/2016, publicado no DOU em 18/03/2016.',
        ordem: 5,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2023/08/Artigo-9o-RESOLUCAO-11-2016docx.pdf',
        nome_arquivo_custom: 'Ver Resolução ANP nº 11/2016',
        ativo: true,
      },
      {
        secao: 'cabecalho',
        chave: 'plataforma_incisos_i_vi_header',
        rotulo: 'Plataforma • Bloco I a VI',
        titulo: 'Exigências Legais do Art. 9º da Resolução ANP nº 11/2016',
        descricao:
          'Documentação oficial e estudos técnicos disponibilizados pela Transportadora Sulbrasileira de Gás - TSB em atendimento aos incisos I a VI do Art. 9º da Resolução ANP nº 11/2016. Clique nos botões correspondentes para baixar os arquivos ou consultar os estudos oficiais.',
        ordem: 6,
        url_externa: '',
        nome_arquivo_custom: 'Baixar Documento',
        ativo: true,
      },
      {
        secao: 'cabecalho',
        chave: 'plataforma_inciso_vii_header',
        rotulo: 'Plataforma • Bloco VII',
        titulo: 'Amparo Legal: Art. 9º, Inciso VII e Art. 10 da Resolução ANP nº 11/2016',
        descricao:
          'Envio público e direto sem necessidade de login prévio. Gera protocolo regulatório automático com confirmação via e-mail corporativo (SMTP TSB) e prazo legal de resposta de até 20 dias úteis para manifestação técnica e comercial fundamentada por escrito da transportadora.',
        ordem: 7,
        url_externa: 'http://tsb.com.br:8443/Home/Solicitacao',
        nome_arquivo_custom: 'Acessar sistema oficial alternativo TSB (:8443)',
        ativo: true,
      },
    ]

    for (let i = 0; i < cabecalhosIniciais.length; i++) {
      const item = cabecalhosIniciais[i]
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
        console.log('Erro ao inserir seed de cabecalho ' + item.chave + ':', e)
      }
    }
  },
  (app) => {
    // Reverter seeds de cabeçalhos
    try {
      const recs = app.findRecordsByFilter('transparencia_conteudo', "secao = 'cabecalho'")
      for (let i = 0; i < recs.length; i++) {
        app.delete(recs[i])
      }
    } catch (_) {}
  },
)
