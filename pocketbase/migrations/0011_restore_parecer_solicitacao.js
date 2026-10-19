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

    // Restaura o parecer_fundamentado do registro semeado original
    try {
      const record = app.findFirstRecordByData(
        'solicitacoes_inciso_vii',
        'protocolo',
        'TSB-2026-8942',
      )
      record.set(
        'parecer_fundamentado',
        'Solicitação preliminarmente avaliada e admitida para dimensionamento hidráulico e verificação de capacidade ociosa no trecho Uruguaiana -> Triunfo.',
      )
      app.save(record)
    } catch (_) {}
  },
  (app) => {},
)
