migrate(
  (app) => {
    const host = $os.getenv('SMTP_HOST') || 'smtp-mail.outlook.com'
    const port = parseInt($os.getenv('SMTP_PORT') || '587', 10)
    const username = $os.getenv('SMTP_USERNAME') || $os.getenv('SMTP_USER') || 'site@tsb.com.br'
    const password = $os.getenv('SMTP_PASSWORD') || 'Madu071428$'
    const senderAddress =
      $os.getenv('SMTP_FROM_ADDRESS') || $os.getenv('SMTP_SENDER') || 'site@tsb.com.br'
    const senderName = $os.getenv('SMTP_FROM_NAME') || 'TSB - Transportadora Sulbrasileira de Gás'

    const settings = app.settings()

    settings.meta.senderName = senderName
    settings.meta.senderAddress = senderAddress

    settings.smtp.enabled = true
    settings.smtp.host = host
    settings.smtp.port = port
    settings.smtp.username = username
    settings.smtp.password = password
    // authMethod LOGIN para Microsoft Outlook / Office 365
    settings.smtp.authMethod = 'LOGIN'
    // tls = false no PocketBase ativa STARTTLS na porta 587
    const tlsEnv = $os.getenv('SMTP_TLS')
    settings.smtp.tls = tlsEnv === 'true'

    app.save(settings)

    // Teste de envio real imediato para clovissjardim@gmail.com
    const testEmail = 'clovissjardim@gmail.com'
    let diagResult = 'PENDING'
    try {
      const msg = new MailerMessage({
        from: {
          address: senderAddress,
          name: senderName,
        },
        to: [{ address: testEmail }],
        subject: '[TSB] Teste de Conexão SMTP - site@tsb.com.br (v0.0.4)',
        html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Teste SMTP TSB</title></head>
<body style="font-family:Arial,sans-serif;background-color:#f1f5f9;padding:24px;">
  <div style="max-width:550px;margin:0 auto;background:#fff;padding:24px;border-radius:8px;border:1px solid #e2e8f0;">
    <h2 style="color:#0a2540;margin-top:0;">TSB - Transportadora Sulbrasileira de Gás</h2>
    <h3 style="color:#0284c7;margin-top:0;">Validação de Conectividade SMTP</h3>
    <p style="color:#334155;">Este é um e-mail de teste disparado pelo Portal Corporativo TSB para validar o envio com as novas credenciais corporativas:</p>
    <ul style="color:#334155;line-height:1.6;">
      <li><strong>Servidor:</strong> ${host}:${port} (STARTTLS)</li>
      <li><strong>Remetente / Conta:</strong> ${senderAddress}</li>
      <li><strong>Destinatário de Teste:</strong> ${testEmail}</li>
    </ul>
    <p style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px;color:#166534;font-weight:bold;">
      Conexão e Autenticação SMTP Corporativa Ativas!
    </p>
    <p style="color:#64748b;font-size:12px;margin-bottom:0;">Portal Corporativo TSB - Resoluções ANP nº 11/2016 e nº 961/2023</p>
  </div>
</body>
</html>`,
      })
      app.newMailClient().send(msg)
      diagResult = 'SUCCESS: E-mail aceito e enviado para ' + testEmail
      console.log('[SMTP MIGRATION 0012] ' + diagResult)
    } catch (err) {
      const msg = err && err.message ? err.message : String(err)
      diagResult = 'ERROR: ' + msg
      console.error('[SMTP MIGRATION 0012] ' + diagResult)
    }

    // Registra o resultado na coluna de auditoria do registro modelo para leitura programática
    try {
      const record = app.findFirstRecordByData(
        'solicitacoes_inciso_vii',
        'protocolo',
        'TSB-2026-8942',
      )
      record.set('parecer_fundamentado', 'DIAGNOSTICO_SMTP_0012: ' + diagResult)
      app.save(record)
    } catch (_) {}
  },
  (app) => {
    // Reversão restaura o parecer original
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
)
