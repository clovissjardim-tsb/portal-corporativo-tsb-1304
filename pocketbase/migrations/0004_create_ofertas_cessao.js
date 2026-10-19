migrate(
  (app) => {
    // 1. Criar coleção de ofertas de cessão (Inciso VIII da Resolução ANP nº 11/2016 e Escopo v2)
    let collection
    try {
      collection = app.findCollectionByNameOrId('ofertas_cessao_inciso_viii')
    } catch (_) {
      collection = new Collection({
        name: 'ofertas_cessao_inciso_viii',
        type: 'base',
        listRule: '', // público sem login
        viewRule: '', // público sem login
        createRule: '', // formulário público sem login conforme decisão do usuário
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'cedente', type: 'text', required: true },
          { name: 'trecho', type: 'text', required: true },
          { name: 'capacidade_ociosa', type: 'number', required: true, min: 1 },
          { name: 'periodo_contratual', type: 'text', required: true },
          { name: 'contato', type: 'text', required: true },
          { name: 'observacoes', type: 'text', required: false },
          {
            name: 'status',
            type: 'select',
            required: false,
            values: ['Disponível', 'Em Negociação', 'Concluída', 'Cancelada'],
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_cessoes_status_created ON ofertas_cessao_inciso_viii (status, created DESC)',
          'CREATE INDEX idx_cessoes_trecho ON ofertas_cessao_inciso_viii (trecho)',
        ],
      })
      app.save(collection)
    }

    // 2. Seed inicial idempotente da tabela de cessões
    try {
      const existing = app.findRecordsByFilter(
        'ofertas_cessao_inciso_viii',
        "cedente = 'Carregador Exemplo S.A.'",
        '-created',
        1,
        0,
      )
      if (existing.length === 0) {
        const seedCol = app.findCollectionByNameOrId('ofertas_cessao_inciso_viii')
        const rec = new Record(seedCol)
        rec.set('cedente', 'Carregador Exemplo S.A.')
        rec.set('trecho', 'Uruguaiana -> Triunfo')
        rec.set('capacidade_ociosa', 20000)
        rec.set('periodo_contratual', 'Out/2026 a Dez/2026')
        rec.set('contato', 'comercial@carregadorexemplo.com.br')
        rec.set('status', 'Disponível')
        rec.set(
          'observacoes',
          'Capacidade firme ordinária disponível para subcessão integral ou parcial.',
        )
        app.save(rec)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('ofertas_cessao_inciso_viii')
      app.delete(collection)
    } catch (_) {}
  },
)
