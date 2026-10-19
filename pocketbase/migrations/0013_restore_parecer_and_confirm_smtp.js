migrate(
  (app) => {
    // Restaura o parecer_fundamentado original no registro semeado
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

    // Disparo de teste secundário para confirmar idempotência e certificar o status de envio
    const settings = app.settings()
    const senderAddress = settings.smtp.username || 'site@tsb.com.br'
    const senderName = settings.meta.senderName || 'TSB - Transportadora Sulbrasileira de Gás'
    const testEmail = 'clovissjardim@gmail.com'

    try {
      const msg = new MailerMessage({
        from: {
          address: senderAddress,
          name: senderName,
        },
        to: [{ address: testEmail }],
        subject: '[TSB] Confirmação SMTP Corporativo 0.0.4',
        html: '<p>Validação final das credenciais site@tsb.com.br executada com sucesso.</p>',
      })
      app.newMailClient().send(msg)
      console.log('[SMTP MIGRATION 0013] Confirmação de envio bem-sucedida para ' + testEmail)
    } catch (err) {
      console.error(
        '[SMTP MIGRATION 0013] Erro inesperado: ' +
          (err && err.message ? err.message : String(err)),
      )
    }
  },
  (app) => {},
)
