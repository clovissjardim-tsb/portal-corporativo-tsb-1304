migrate(
  (app) => {
    // 1. Tabela para rastreamento de tentativas de submissão do Inciso VII (Rate Limiting)
    // Permite controlar submissões por IP e por e-mail com persistência e limpeza periódica.
    if (!app.hasTable('solicitacoes_submissao_log')) {
      const col = new Collection({
        name: 'solicitacoes_submissao_log',
        type: 'base',
        // Acesso restrito a superusuários / sistema interno (sem acesso direto de clientes)
        listRule: null,
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: 'ip_origem', type: 'text', required: true },
          { name: 'email', type: 'text', required: false },
          { name: 'protocolo', type: 'text', required: false },
          { name: 'sucesso', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_submissao_ip_created ON solicitacoes_submissao_log (ip_origem, created DESC)',
          'CREATE INDEX idx_submissao_email_created ON solicitacoes_submissao_log (email, created DESC)',
        ],
      })
      app.save(col)
    }

    // 2. Campo website_url (honeypot) na coleção solicitacoes_inciso_vii caso venha em FormData
    // Se o bot submeter diretamente para a API PB sem passar pelo helper do front, o hook pode verificar
    const colInciso = app.findCollectionByNameOrId('solicitacoes_inciso_vii')
    if (!colInciso.fields.getByName('website_url')) {
      colInciso.fields.add(
        new TextField({
          name: 'website_url',
          required: false,
        }),
      )
      app.save(colInciso)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('solicitacoes_submissao_log')
      app.delete(col)
    } catch (_) {}

    try {
      const colInciso = app.findCollectionByNameOrId('solicitacoes_inciso_vii')
      colInciso.fields.removeByName('website_url')
      app.save(colInciso)
    } catch (_) {}
  },
)
