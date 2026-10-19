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
    const tlsEnv = $os.getenv('SMTP_TLS')
    settings.smtp.tls = tlsEnv === 'true'

    app.save(settings)

    // Disparo de validação de envio real para verificação nos logs
    const testEmail = 'clovissjardim@gmail.com'
    try {
      const msg = new MailerMessage({
        from: {
          address: senderAddress,
          name: senderName,
        },
        to: [{ address: testEmail }],
        subject: '[TSB] Teste de Ativação SMTP - Servidor Outlook (Migração 0006)',
        html: '<p>Validação de configuração SMTP corporativo no PocketBase/Skip Cloud para o Portal TSB.</p>',
      })
      app.newMailClient().send(msg)
      console.log('[SMTP MIGRATION 0006] E-mail de teste enviado com sucesso para ' + testEmail)
    } catch (err) {
      const errMsg = err && err.message ? err.message : String(err)
      console.error('[SMTP MIGRATION 0006] Falha no teste de envio SMTP: ' + errMsg)
    }
  },
  (app) => {
    // no-op
  },
)
