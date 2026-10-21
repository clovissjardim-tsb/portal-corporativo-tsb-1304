migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('solicitacoes_inciso_vii')

    // 1. Arquivo PDF assinado do formulário recebido por e-mail (até 50 MB, restrito a autenticados)
    if (!col.fields.getByName('arquivo_formulario')) {
      col.fields.add(
        new FileField({
          name: 'arquivo_formulario',
          maxSelect: 1,
          maxSize: 52428800, // 50 MB
          mimeTypes: ['application/pdf'],
          protected: true, // Visível apenas para usuários autenticados
        }),
      )
    }

    // 2. Campo Representante Legal / Procurador (Art. 10)
    if (!col.fields.getByName('representante_legal')) {
      col.fields.add(new TextField({ name: 'representante_legal', required: false }))
    }

    // 3. Campo Telefone do solicitante (para registro da equipe operacional)
    if (!col.fields.getByName('telefone')) {
      col.fields.add(new TextField({ name: 'telefone', required: false }))
    }

    // 4. Campo Identificação do Operador que cadastrou o PDF recebido
    if (!col.fields.getByName('operador_cadastro')) {
      col.fields.add(new TextField({ name: 'operador_cadastro', required: false }))
    }

    // 5. Ajustar regras de acesso RLS para replicar o modelo do Inciso VIII:
    // Fechar criação pública para @request.auth.id != '' (o formulário anônimo web sai de cena)
    // list, view, update, delete permanecem restritas a usuários autenticados
    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id != ''"

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('solicitacoes_inciso_vii')
      col.createRule = ''
      app.save(col)
    } catch (_) {}
  },
)
