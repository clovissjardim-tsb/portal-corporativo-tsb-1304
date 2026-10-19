migrate(
  (app) => {
    // 1. Seed initial user clovissjardim@gmail.com
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'clovissjardim@gmail.com')
    } catch (_) {
      const userRecord = new Record(users)
      userRecord.setEmail('clovissjardim@gmail.com')
      userRecord.setPassword('Skip@Pass')
      userRecord.setVerified(true)
      userRecord.set('name', 'Operador TSB')
      app.save(userRecord)
    }

    // 2. Seed initial solicitacao TSB-2026-8942
    const solicitacoesCol = app.findCollectionByNameOrId('solicitacoes_inciso_vii')
    try {
      app.findFirstRecordByData('solicitacoes_inciso_vii', 'protocolo', 'TSB-2026-8942')
    } catch (_) {
      const solRecord = new Record(solicitacoesCol)
      solRecord.set('protocolo', 'TSB-2026-8942')
      solRecord.set('razao_social', 'Empresa Exemplo Ltda.')
      solRecord.set('cnpj', '00.000.000/0001-00')
      solRecord.set('email', 'contato@empresaexemplo.com.br')
      solRecord.set('modalidade', 'Firme Ordinário')
      solRecord.set('capacidade', 150000)
      solRecord.set('trecho', 'Uruguaiana -> Triunfo')
      solRecord.set('status', 'Solicitação Recebida - Em Análise Técnica')
      solRecord.set('sla_dias', 20)
      app.save(solRecord)
    }
  },
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'clovissjardim@gmail.com')
      app.delete(user)
    } catch (_) {}

    try {
      const sol = app.findFirstRecordByData('solicitacoes_inciso_vii', 'protocolo', 'TSB-2026-8942')
      app.delete(sol)
    } catch (_) {}
  },
)
