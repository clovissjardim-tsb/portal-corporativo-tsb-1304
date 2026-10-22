migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('solicitacoes_inciso_vii')

    // 1. Campo origem: 'portal_web' | 'manual_interno'
    if (!col.fields.getByName('origem')) {
      col.fields.add(
        new SelectField({
          name: 'origem',
          values: ['portal_web', 'manual_interno'],
          maxSelect: 1,
          required: false,
        }),
      )
    }

    // 2. Campo observacoes: anotações livres do solicitante web ou operador
    if (!col.fields.getByName('observacoes')) {
      col.fields.add(
        new TextField({
          name: 'observacoes',
          required: false,
        }),
      )
    }

    // 3. Campo endereco: endereço da sede da solicitante (Art. 10 Res. 11/2016)
    if (!col.fields.getByName('endereco')) {
      col.fields.add(
        new TextField({
          name: 'endereco',
          required: false,
        }),
      )
    }

    // 4. Campo prazo_vigencia: prazo pretendido de vigência contratual
    if (!col.fields.getByName('prazo_vigencia')) {
      col.fields.add(
        new TextField({
          name: 'prazo_vigencia',
          required: false,
        }),
      )
    }

    // 5. Ajustar regras de acesso RLS:
    // createRule: "" (pública para permitir submissão direta do carregador pelo portal web sem login)
    // list, view, update, delete: "@request.auth.id != ''" (LGPD: dados de pessoas, CNPJ e contato ficam estritamente restritos à Gestão Interna autenticada)
    col.createRule = ''
    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id != ''"

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('solicitacoes_inciso_vii')
      col.createRule = "@request.auth.id != ''"
      app.save(col)
    } catch (_) {}
  },
)
