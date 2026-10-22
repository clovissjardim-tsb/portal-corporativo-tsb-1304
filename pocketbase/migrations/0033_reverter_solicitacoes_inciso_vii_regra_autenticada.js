migrate(
  (app) => {
    // Reverter o fluxo público do Inciso VII (Solicitação de Acesso) na /transparencia
    // para o modelo exclusivo por e-mail (padrão NTS/TAG/TBG).
    // O createRule da coleção solicitacoes_inciso_vii volta a ser restrito a autenticados,
    // pois a criação agora é realizada exclusivamente pelos operadores internos autenticados
    // a partir do formulário PDF oficial recebido assinado por e-mail.
    const col = app.findCollectionByNameOrId('solicitacoes_inciso_vii')
    col.createRule = "@request.auth.id != ''"
    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
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
