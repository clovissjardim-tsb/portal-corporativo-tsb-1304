migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('transparencia_conteudo')

    const instrumentos = [
      {
        chave: 'pocc_regulamento',
        rotulo: 'Art. 37-A, §2º',
        titulo: 'Minuta do Regulamento para Oferta e Contratação de Capacidade',
        descricao:
          'Regras operacionais, requisitos de habilitação, metodologia de alocação e garantias exigidas dos Carregadores (Art. 37-A, §1º, I e §2º da Resolução ANP nº 11/2016).',
        ordem: 20,
        url_externa: '',
        nome_arquivo_custom: 'Regulamento do POCC (PDF)',
        ativo: true,
      },
      {
        chave: 'pocc_minuta_contrato',
        rotulo: 'Art. 37-A, §2º',
        titulo: 'Minuta do Contrato de Serviço de Transporte de Gás Natural',
        descricao:
          'Minuta padronizada do Contrato de Serviço de Transporte Firme exigida pela Resolução ANP nº 961/2023 (Art. 37-A, §1º, II e §2º).',
        ordem: 21,
        url_externa:
          'https://www.tsb.com.br/wp-content/uploads/2025/03/CONTRATO-MASTER-TSB-2025-2029.pdf',
        nome_arquivo_custom: 'Minuta Contrato de Transporte (PDF)',
        ativo: true,
      },
      {
        chave: 'pocc_proposta_tarifaria',
        rotulo: 'Art. 37-A, §2º',
        titulo: 'Proposta Tarifária e Tarifas de Referência',
        descricao:
          'Proposta tarifária submetida à Consulta Pública Tarifária e homologada pela ANP para o ciclo (Art. 37-A, §1º, III e §2º).',
        ordem: 22,
        url_externa: '',
        nome_arquivo_custom: 'Proposta Tarifária (PDF)',
        ativo: true,
      },
    ]

    for (const item of instrumentos) {
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
    const chaves = ['pocc_regulamento', 'pocc_minuta_contrato', 'pocc_proposta_tarifaria']
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
