migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('ofertas_cessao_inciso_viii')

    // 1. Campo booleano 'publicada' (default false, opcional para não falhar em bool)
    if (!col.fields.getByName('publicada')) {
      col.fields.add(
        new BoolField({
          name: 'publicada',
          required: false,
        }),
      )
    }

    // 2. Arquivo PDF assinado recebido pelo canal oficial (até 50 MB, só autenticado)
    if (!col.fields.getByName('arquivo_formulario')) {
      col.fields.add(
        new FileField({
          name: 'arquivo_formulario',
          maxSelect: 1,
          maxSize: 52428800, // 50 MB
          mimeTypes: ['application/pdf'],
          protected: true, // Visível apenas autenticado
        }),
      )
    }

    // 3. Campos adicionais do Art. 10 para espelhar integralmente o formulário TSB
    if (!col.fields.getByName('cnpj')) {
      col.fields.add(new TextField({ name: 'cnpj', required: false }))
    }
    if (!col.fields.getByName('representante_legal')) {
      col.fields.add(new TextField({ name: 'representante_legal', required: false }))
    }
    if (!col.fields.getByName('modalidade')) {
      col.fields.add(new TextField({ name: 'modalidade', required: false }))
    }
    if (!col.fields.getByName('ponto_recebimento')) {
      col.fields.add(new TextField({ name: 'ponto_recebimento', required: false }))
    }
    if (!col.fields.getByName('ponto_entrega')) {
      col.fields.add(new TextField({ name: 'ponto_entrega', required: false }))
    }
    if (!col.fields.getByName('operador_cadastro')) {
      col.fields.add(new TextField({ name: 'operador_cadastro', required: false }))
    }

    // 4. Regras de acesso RLS:
    // Remover createRule público — criação APENAS por usuário autenticado na Gestão Interna!
    // Leitura, atualização e exclusão permanecem apenas autenticadas.
    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id != ''"

    app.save(col)

    // 5. Backfill idempotente: marcar ofertas pré-existentes como publicada = true
    // para que não sumam da tabela pública
    try {
      app
        .db()
        .newQuery(
          'UPDATE ofertas_cessao_inciso_viii SET publicada = 1 WHERE publicada IS NULL OR publicada = 0',
        )
        .execute()
    } catch (_) {}
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('ofertas_cessao_inciso_viii')
      col.createRule = ''
      app.save(col)
    } catch (_) {}
  },
)
