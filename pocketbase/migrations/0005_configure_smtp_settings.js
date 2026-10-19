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

    // Configuração do remetente padrão
    settings.meta.senderName = senderName
    settings.meta.senderAddress = senderAddress

    // Configuração SMTP
    settings.smtp.enabled = true
    settings.smtp.host = host
    settings.smtp.port = port
    settings.smtp.username = username
    if (password) {
      settings.smtp.password = password
    }
    // tls = false no PocketBase ativa STARTTLS (porta 587); tls = true força SSL/TLS direto (porta 465)
    const tlsEnv = $os.getenv('SMTP_TLS')
    settings.smtp.tls = tlsEnv === 'true'

    // Salva as configurações persistidas no PocketBase
    app.save(settings)
  },
  (app) => {
    try {
      const settings = app.settings()
      settings.smtp.enabled = false
      app.save(settings)
    } catch (_) {}
  },
)
