migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('transparencia_conteudo')

    const novosSlotsPOCC = [
      {
        chave: 'pocc_capacidade_ofertada',
        rotulo: 'Capacidade Ofertada',
        titulo: 'Capacidade Ofertada e Disponível por Ponto de Entrada e Zona de Saída',
        descricao:
          'Demonstrativo consolidado da capacidade de transporte ofertada (m³/dia) e capacidade disponível por Ponto de Entrada (Canoas) e Zona de Saída (Triunfo / Uruguaiana) nos Trechos 1 e 3 da malha TSB.',
        ordem: 23,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2024/11/1.7.7-CAPACIDADES_DISPONIVEIS-PE-E-ZS-5.pdf',
        nome_arquivo_custom: 'Capacidades Disponíveis PE e ZS (PDF)',
        ativo: true,
      },
      {
        chave: 'pocc_modelo_manifestacao_interesse',
        rotulo: 'Modelo Carregador',
        titulo: 'Modelo de Manifestação de Interesse (POCC — Art. 37-A, §5º, I)',
        descricao:
          'Formulário-padrão de manifestação de interesse não vinculante para download pelo Carregador, com identificação cadastral, indicação de demanda estimada e declarações regulatórias.',
        ordem: 24,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2023/11/MODELO-MANIFESTAC%CC%A7A%CC%83O-DE-INTERESSE.pdf',
        nome_arquivo_custom: 'Modelo de Manifestação de Interesse (PDF)',
        ativo: true,
      },
      {
        chave: 'pocc_modelo_proposta_garantida',
        rotulo: 'Modelo Carregador',
        titulo: 'Modelo de Proposta Garantida Vinculante (POCC — Art. 37-A, §5º, III)',
        descricao:
          'Minuta-padrão de proposta vinculante para apresentação de garantia financeira, indicação de capacidade, tarifa de transporte de referência e ponto de entrada/zona de saída.',
        ordem: 25,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2023/11/Modelo-Proposta-Garantida.pdf',
        nome_arquivo_custom: 'Modelo de Proposta Garantida (PDF)',
        ativo: true,
      },
      {
        chave: 'pocc_requisitos_habilitacao',
        rotulo: 'Habilitação',
        titulo: 'Requisitos de Habilitação do Carregador (Documentos e Condições Cadastrais)',
        descricao:
          'Relação documental e requisitos técnicos, societários, fiscais, regulatórios (Autorização ANP) e de classificação de crédito exigidos para habilitação prévia do Carregador junto à TSB.',
        ordem: 26,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2023/11/1.7.9-REQUISITOS-DE-HABILITAC%CC%A7A%CC%83O-DO-CARREGADOR.pdf',
        nome_arquivo_custom: 'Requisitos de Habilitação do Carregador (PDF)',
        ativo: true,
      },
      {
        chave: 'pocc_resultados_ciclo',
        rotulo: 'Resultados do Ciclo',
        titulo: 'Resultados e Publicações das Etapas do Ciclo (Manifestações, Propostas e ANP)',
        descricao:
          'Publicação oficial das manifestações de interesse recebidas, propostas garantidas homologadas, alocações de capacidade e atos de aprovação da ANP (Despachos e Notas Técnicas no DOU).',
        ordem: 27,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2024/11/1.7.11-DESPACHO-SIM-ANP-No-1.328-11-2024-DOU.pdf',
        nome_arquivo_custom: 'Aprovação ANP Proposta Tarifária e POCC (DOU)',
        ativo: true,
      },
    ]

    for (const item of novosSlotsPOCC) {
      let rec
      try {
        rec = app.findFirstRecordByFilter(
          'transparencia_conteudo',
          `secao = 'plataforma_inciso' && chave = '${item.chave}'`,
        )
      } catch (_) {
        rec = null
      }

      if (!rec) {
        rec = new Record(col)
        rec.set('secao', 'plataforma_inciso')
        rec.set('chave', item.chave)
        rec.set('rotulo', item.rotulo)
        rec.set('titulo', item.titulo)
        rec.set('descricao', item.descricao)
        rec.set('ordem', item.ordem)
        rec.set('url_externa', item.url_externa)
        rec.set('nome_arquivo_custom', item.nome_arquivo_custom)
        rec.set('ativo', item.ativo)
        app.save(rec)
      }
    }
  },
  (app) => {
    const chaves = [
      'pocc_capacidade_ofertada',
      'pocc_modelo_manifestacao_interesse',
      'pocc_modelo_proposta_garantida',
      'pocc_requisitos_habilitacao',
      'pocc_resultados_ciclo',
    ]
    for (const ch of chaves) {
      try {
        const rec = app.findFirstRecordByFilter(
          'transparencia_conteudo',
          `secao = 'plataforma_inciso' && chave = '${ch}'`,
        )
        if (rec) app.delete(rec)
      } catch (_) {}
    }
  },
)
