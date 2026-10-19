migrate(
  (app) => {
    const collection = new Collection({
      name: 'solicitacoes_inciso_vii',
      type: 'base',
      listRule: '',
      viewRule: null,
      createRule: '',
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'razao_social', type: 'text', required: true },
        { name: 'cnpj', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        {
          name: 'modalidade',
          type: 'select',
          required: true,
          values: ['Firme Ordinário', 'Interruptível'],
          maxSelect: 1,
        },
        { name: 'capacidade', type: 'number', required: true, min: 1 },
        { name: 'trecho', type: 'text', required: true },
        { name: 'protocolo', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: false,
          values: [
            'Solicitação Recebida - Em Análise Técnica',
            'Em Análise Técnica',
            'Aguardando Documentação',
            'Aprovada',
            'Rejeitada',
          ],
          maxSelect: 1,
        },
        { name: 'sla_dias', type: 'number', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_solicitacoes_protocolo ON solicitacoes_inciso_vii (protocolo)',
        'CREATE INDEX idx_solicitacoes_status_created ON solicitacoes_inciso_vii (status, created DESC)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('solicitacoes_inciso_vii')
      app.delete(collection)
    } catch (_) {}
  },
)
