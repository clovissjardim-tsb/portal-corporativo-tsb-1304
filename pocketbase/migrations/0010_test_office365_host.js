migrate(
  (app) => {
    const host = 'smtp.office365.com'
    const port = 587
    const username = $os.getenv('SMTP_USERNAME') || $os.getenv('SMTP_USER') || 'tsb@tsb.com.br'
    const password = $os.getenv('SMTP_PASSWORD') || ''
    const senderAddress =
      $os.getenv('SMTP_FROM_ADDRESS') || $os.getenv('SMTP_SENDER') || 'tsb@tsb.com.br'
    const senderName = $os.getenv('SMTP_FROM_NAME') || 'TSB - Transportadora Sulbrasileira de Gás'

    const settings = app.settings()

    settings.meta.senderName = senderName
    settings.meta.senderAddress = senderAddress

    settings.smtp.enabled = true
    settings.smtp.host = host
    settings.smtp.port = port
    settings.smtp.username = username
    if (password) {
      settings.smtp.password = password
    }
    settings.smtp.authMethod = 'LOGIN'
    settings.smtp.tls = false

    app.save(settings)

    let diagResult = 'PENDING'
    const testEmail = 'clovissjardim@gmail.com'
    try {
      const msg = new MailerMessage({
        from: {
          address: senderAddress,
          name: senderName,
        },
        to: [{ address: testEmail }],
        subject: '[TSB] Teste Conexao SMTP office365',
        html: '<p>Teste de envio SMTP via smtp.office365.com</p>',
      })
      app.newMailClient().send(msg)
      diagResult =
        'SUCCESS: E-mail aceito e enviado pelo servidor smtp.office365.com para ' + testEmail
    } catch (err) {
      const msg = err && err.message ? err.message : String(err)
      diagResult = 'ERROR: ' + msg
    }

    try {
      const record = app.findFirstRecordByData(
        'solicitacoes_inciso_vii',
        'protocolo',
        'TSB-2026-8942',
      )
      record.set('parecer_fundamentado', 'DIAGNOSTICO_SMTP_OFFICE365: ' + diagResult)
      app.save(record)
    } catch (_) {}
  },
  (app) => {},
)
