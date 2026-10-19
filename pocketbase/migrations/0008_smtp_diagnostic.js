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

    // Grava o resultado detalhado em log via console.log / console.error
    const testEmail = 'clovissjardim@gmail.com'
    try {
      const msg = new MailerMessage({
        from: {
          address: senderAddress,
          name: senderName,
        },
        to: [{ address: testEmail }],
        subject: '[TSB] Teste Conexao SMTP Microsoft 365 / Outlook',
        html: '<p>Teste de autenticacao LOGIN no SMTP corporativo TSB.</p>',
      })
      app.newMailClient().send(msg)
      // Se o send passou sem exceção, grava registro na coleção de auditoria/solicitacoes ou console
      console.log('[SMTP DIAGNOSTIC] SUCCESS: Email accepted by Outlook server for ' + testEmail)
    } catch (err) {
      const msg = err && err.message ? err.message : String(err)
      console.error('[SMTP DIAGNOSTIC] ERROR: ' + msg)
    }
  },
  (app) => {},
)
