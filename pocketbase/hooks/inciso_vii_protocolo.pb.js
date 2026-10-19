/**
 * Hook para envio de e-mails corporativos TSB via PocketBase / Skip Cloud.
 * NOTA: No JSVM do PocketBase os callbacks rodam em VM isolada, portanto todas as
 * funções auxiliares devem ficar inline dentro de cada handler.
 */

// 1. Hook automático após criação de solicitação do Inciso VII
onRecordCreate((e) => {
  e.next()

  try {
    const record = e.record
    const destinatario = record.getString('email')
    const protocolo = record.getString('protocolo')
    const razaoSocial = record.getString('razao_social') || 'Prezado(a) Solicitante'
    const status = record.getString('status') || 'Solicitação Recebida - Em Análise Técnica'
    const slaDias = record.getInt('sla_dias') || 20
    const modalidade = record.getString('modalidade') || '-'
    const trecho = record.getString('trecho') || '-'
    const capacidade = record.getFloat('capacidade') ? String(record.getFloat('capacidade')) : '-'
    const periodo = record.getString('periodo') || '-'

    if (!destinatario || !protocolo) {
      console.warn(
        '[SMTP TSB] E-mail não enviado: destinatário ou protocolo ausente no registro ' + record.id,
      )
      return
    }

    const senderAddress =
      $os.getenv('SMTP_FROM_ADDRESS') ||
      $os.getenv('SMTP_SENDER') ||
      e.app.settings().meta.senderAddress ||
      'site@tsb.com.br'
    const senderName =
      $os.getenv('SMTP_FROM_NAME') ||
      e.app.settings().meta.senderName ||
      'TSB - Transportadora Sulbrasileira de Gás'

    const htmlBody = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Comprovante de Protocolo de Solicitação de Acesso - TSB</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);border:1px solid #e2e8f0;">
          <tr>
            <td style="background-color:#0a2540;padding:24px 32px;color:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <h1 style="margin:0;font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;">TSB</h1>
                    <p style="margin:4px 0 0 0;font-size:12px;color:#93c5fd;">Transportadora Sulbrasileira de Gás S.A.</p>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:4px 10px;background-color:#0284c7;color:#ffffff;font-size:11px;font-weight:bold;border-radius:4px;text-transform:uppercase;">
                      Res. ANP nº 11/2016
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:20px 32px;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Protocolo Formal ANP</p>
              <h2 style="margin:6px 0 0 0;font-size:26px;color:#0284c7;font-family:'Courier New',Courier,monospace;letter-spacing:1px;font-weight:bold;">${protocolo}</h2>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#334155;">
                Prezados representantes da <strong>${razaoSocial}</strong>,
              </p>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:22px;color:#334155;">
                Confirmamos o recebimento e a autuação formal da sua <strong>Solicitação de Acesso à Capacidade de Transporte Dutoviário</strong> (Art. 9º, Inciso VII da Resolução ANP nº 11/2016) no Portal Corporativo TSB.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background-color:#f0fdf4;border-left:4px solid #059669;border-radius:0 6px 6px 0;padding:16px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;color:#166534;font-weight:bold;">Status Atual do Processo</p>
                    <p style="margin:4px 0 12px 0;font-size:15px;color:#0f172a;font-weight:600;">${status}</p>
                    <p style="margin:0;font-size:13px;color:#166534;font-weight:bold;">Prazo Regulatório de Resposta (SLA)</p>
                    <p style="margin:4px 0 0 0;font-size:14px;color:#0f172a;">
                      <strong>${slaDias} dias úteis</strong> a contar desta data, conforme preconiza a Resolução ANP nº 11/2016 e a Lei nº 14.134/2021 (Nova Lei do Gás).
                    </p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
                <tr style="background-color:#f8fafc;">
                  <td colspan="2" style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:bold;color:#475569;text-transform:uppercase;">
                    Resumo Técnico da Solicitação
                  </td>
                </tr>
                <tr>
                  <td width="40%" style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Modalidade:</td>
                  <td width="60%" style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${modalidade}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Trecho Solicitado:</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${trecho}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Capacidade Requisitada:</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${capacidade} m³/dia</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;font-size:13px;color:#64748b;">Período Desejado:</td>
                  <td style="padding:10px 14px;font-size:13px;color:#0f172a;font-weight:600;">${periodo}</td>
                </tr>
              </table>
              <p style="margin:20px 0 0 0;font-size:13px;line-height:20px;color:#64748b;">
                A qualquer momento, o andamento da análise de viabilidade técnico-operacional pode ser consultado no Portal de Transparência da TSB utilizando o número deste protocolo.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0a2540;padding:20px 32px;color:#94a3b8;font-size:11px;line-height:16px;">
              <p style="margin:0 0 6px 0;color:#e2e8f0;font-weight:600;">Transportadora Sulbrasileira de Gás S.A. - TSB</p>
              <p style="margin:0 0 6px 0;">Contato institucional: <a href="mailto:${senderAddress}" style="color:#38bdf8;text-decoration:none;">${senderAddress}</a> | Portal Corporativo</p>
              <p style="margin:0;color:#64748b;">Este é um e-mail automático gerado pelo sistema de acesso público dutoviário em conformidade com a regulamentação setorial da ANP.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    const message = new MailerMessage({
      from: {
        address: senderAddress,
        name: senderName,
      },
      to: [{ address: destinatario }],
      subject: `[TSB] Protocolo ${protocolo} - Solicitação de Acesso (Inciso VII - Res. ANP nº 11/2016)`,
      html: htmlBody,
    })

    e.app.newMailClient().send(message)
    console.log(
      `[SMTP TSB] E-mail de protocolo ${protocolo} enviado com sucesso para ${destinatario}`,
    )
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err)
    console.error(`[SMTP TSB] Falha ao enviar e-mail de protocolo do Inciso VII: ${errMsg}`)
  }
}, 'solicitacoes_inciso_vii')

// 2. Rota de teste SMTP corporativo
routerAdd('POST', '/backend/v1/test-smtp', (c) => {
  let to = 'clovissjardim@gmail.com'
  try {
    const body = c.requestInfo().body
    if (body && body.to) {
      to = String(body.to).trim()
    }
  } catch (_) {}

  const senderAddress =
    $os.getenv('SMTP_FROM_ADDRESS') ||
    $os.getenv('SMTP_SENDER') ||
    c.app.settings().meta.senderAddress ||
    'site@tsb.com.br'
  const senderName =
    $os.getenv('SMTP_FROM_NAME') ||
    c.app.settings().meta.senderName ||
    'TSB - Transportadora Sulbrasileira de Gás'

  const testHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Teste SMTP TSB</title></head>
<body style="font-family:Arial,sans-serif;background-color:#f1f5f9;padding:24px;">
  <div style="max-width:550px;margin:0 auto;background:#fff;padding:24px;border-radius:8px;border:1px solid #e2e8f0;">
    <h2 style="color:#0a2540;margin-top:0;">TSB - Teste de Validação SMTP</h2>
    <p style="color:#334155;">Este é um e-mail de teste disparado pelo Portal Corporativo TSB para validar o envio via Outlook SMTP (<code>smtp-mail.outlook.com:587</code>).</p>
    <p style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px;color:#166534;font-weight:bold;">
      Conexão e Autenticação SMTP Corporativa Ativas!
    </p>
    <p style="color:#64748b;font-size:12px;margin-bottom:0;">Remetente: ${senderAddress} | Destinatário: ${to}</p>
  </div>
</body>
</html>`

  try {
    const message = new MailerMessage({
      from: {
        address: senderAddress,
        name: senderName,
      },
      to: [{ address: to }],
      subject: `[TSB] Teste de Conexão SMTP Outlook - Portal TSB`,
      html: testHtml,
    })

    c.app.newMailClient().send(message)
    console.log(`[SMTP TSB] Teste de envio concluído com sucesso para ${to}`)

    return c.json(200, {
      success: true,
      message: `E-mail de teste aceito pelo servidor SMTP e enviado para ${to}`,
      sender: senderAddress,
      recipient: to,
      host: c.app.settings().smtp.host,
      port: c.app.settings().smtp.port,
    })
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err)
    console.error(`[SMTP TSB] Erro no teste de envio SMTP para ${to}: ${errMsg}`)
    return c.json(500, {
      success: false,
      error: errMsg,
      host: c.app.settings().smtp.host,
      port: c.app.settings().smtp.port,
    })
  }
})

// 3. Job agendado para teste de inicialização único (opcional/cron)
// Registra nos logs no boot se o SMTP está habilitado
cronAdd('tsb_smtp_status_check', '@daily', (c) => {
  const host = c.app.settings().smtp.host
  const enabled = c.app.settings().smtp.enabled
  const port = c.app.settings().smtp.port
  console.log(`[SMTP TSB Status] Host: ${host}:${port}, Enabled: ${enabled}`)
})
