migrate(
  (app) => {
    const host = $os.getenv('SMTP_HOST') || 'smtp-mail.outlook.com'
    const port = parseInt($os.getenv('SMTP_PORT') || '587', 10)
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
    const tlsEnv = $os.getenv('SMTP_TLS')
    settings.smtp.tls = tlsEnv === 'true'

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
        subject: '[TSB] Teste Conexao SMTP',
        html: '<p>Teste de envio SMTP</p>',
      })
      app.newMailClient().send(msg)
      diagResult = 'SUCCESS: E-mail aceito e enviado pelo servidor Outlook para ' + testEmail
    } catch (err) {
      const msg = err && err.message ? err.message : String(err)
      diagResult = 'ERROR: ' + msg
    }

    // Atualiza parecer_fundamentado do primeiro registro de teste para guardar o diagnóstico
    try {
      const record = app.findFirstRecordByData(
        'solicitacoes_inciso_vii',
        'protocolo',
        'TSB-2026-8942',
      )
      record.set('parecer_fundamentado', 'DIAGNOSTICO_SMTP: ' + diagResult)
      app.save(record)
    } catch (_) {}
  },
  (app) => {},
)
