migrate(
  (app) => {
    // 1. Proteger ofertas_cessao_inciso_viii contra vazamento de e-mail / contato pessoal via REST API
    // Conforme LGPD e Decisão de Escopo do Projeto TSB:
    // Leitura irrestrita de dados brutos fica apenas em ambiente autenticado (@request.auth.id != '')
    // Criação de oferta permanece pública (createRule: '')
    try {
      const colCessoes = app.findCollectionByNameOrId('ofertas_cessao_inciso_viii')
      colCessoes.listRule = "@request.auth.id != ''"
      colCessoes.viewRule = "@request.auth.id != ''"
      colCessoes.createRule = ''
      colCessoes.updateRule = "@request.auth.id != ''"
      colCessoes.deleteRule = "@request.auth.id != ''"
      app.save(colCessoes)
    } catch (_) {}

    // 2. Proteger solicitacoes_inciso_vii contra leitura pública de e-mails, CNPJ e dados pessoais via REST API
    // Leitura irrestrita de dados cadastrais fica apenas em ambiente autenticado (@request.auth.id != '')
    // Criação permanece pública para que solicitantes submetam seus pedidos (createRule: '')
    try {
      const colSol = app.findCollectionByNameOrId('solicitacoes_inciso_vii')
      colSol.listRule = "@request.auth.id != ''"
      colSol.viewRule = "@request.auth.id != ''"
      colSol.createRule = ''
      colSol.updateRule = "@request.auth.id != ''"
      colSol.deleteRule = "@request.auth.id != ''"
      app.save(colSol)
    } catch (_) {}
  },
  (app) => {
    try {
      const colCessoes = app.findCollectionByNameOrId('ofertas_cessao_inciso_viii')
      colCessoes.listRule = ''
      colCessoes.viewRule = ''
      app.save(colCessoes)
    } catch (_) {}

    try {
      const colSol = app.findCollectionByNameOrId('solicitacoes_inciso_vii')
      colSol.listRule = ''
      colSol.viewRule = ''
      app.save(colSol)
    } catch (_) {}
  },
)
