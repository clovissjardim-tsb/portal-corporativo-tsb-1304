/**
 * Hook para envio de e-mails corporativos TSB via PocketBase / Skip Cloud.
 * NOTA: No JSVM do PocketBase os callbacks rodam em VM isolada, portanto todas as
 * funções auxiliares devem ficar inline dentro de cada handler.
 * Conforme Arts. 9º e 10 da Resolução ANP nº 11/2016.
 */

// 1. Hook automático após criação de solicitação do Inciso VII (e-mail de confirmação ao solicitante)
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
    const pontoRecebimento = record.getString('ponto_recebimento') || '-'
    const pontoEntrega = record.getString('ponto_entrega') || '-'
    const garantiasSwap = record.getString('garantias_seguranca_swap') || ''
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

    const swapRowHtml =
      modalidade === 'Troca Operacional' && garantiasSwap
        ? `<tr>
            <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;vertical-align:top;">Garantias Operacionais (Swap - Art. 10, §1º):</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;line-height:18px;">${garantiasSwap}</td>
          </tr>`
        : ''

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
              <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Protocolo Formal ANP (Art. 10)</p>
              <h2 style="margin:6px 0 0 0;font-size:26px;color:#0284c7;font-family:'Courier New',Courier,monospace;letter-spacing:1px;font-weight:bold;">${protocolo}</h2>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#334155;">
                Prezados representantes da <strong>${razaoSocial}</strong>,
              </p>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:22px;color:#334155;">
                Confirmamos o recebimento e a autuação formal da sua <strong>Solicitação de Acesso à Capacidade de Transporte Dutoviário</strong> (Art. 9º, Inciso VII e Art. 10 da Resolução ANP nº 11/2016) no Portal Corporativo TSB.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background-color:#f0fdf4;border-left:4px solid #059669;border-radius:0 6px 6px 0;padding:16px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;color:#166534;font-weight:bold;">Status Atual do Processo</p>
                    <p style="margin:4px 0 12px 0;font-size:15px;color:#0f172a;font-weight:600;">${status}</p>
                    <p style="margin:0;font-size:13px;color:#166534;font-weight:bold;">Prazo Regulatório de Resposta (SLA)</p>
                    <p style="margin:4px 0 0 0;font-size:14px;color:#0f172a;">
                      <strong>${slaDias} dias úteis</strong> a contar desta data, conforme preconiza o Art. 10 da Resolução ANP nº 11/2016 e a Lei nº 14.134/2021.
                    </p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
                <tr style="background-color:#f8fafc;">
                  <td colspan="2" style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:bold;color:#475569;text-transform:uppercase;">
                    Resumo Técnico da Solicitação (Art. 10, IV)
                  </td>
                </tr>
                <tr>
                  <td width="42%" style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Modalidade:</td>
                  <td width="58%" style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${modalidade}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Ponto de Recebimento (Injeção):</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${pontoRecebimento}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Ponto de Entrega (Retirada):</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${pontoEntrega}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Instalação / Trecho de Transporte:</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${trecho}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Capacidade Requisitada:</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${capacidade} m³/dia</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;${swapRowHtml ? 'border-bottom:1px solid #e2e8f0;' : ''}font-size:13px;color:#64748b;">Período Desejado:</td>
                  <td style="padding:10px 14px;${swapRowHtml ? 'border-bottom:1px solid #e2e8f0;' : ''}font-size:13px;color:#0f172a;font-weight:600;">${periodo}</td>
                </tr>
                ${swapRowHtml}
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

// 1.1 Hook automático após criação de Manifestação de Interesse no POC (POCC - Art. 37-A, §5º, I)
onRecordCreate((e) => {
  e.next()

  try {
    const record = e.record
    const destinatario = record.getString('email')
    const protocolo = record.getString('protocolo')
    const razaoSocial = record.getString('razao_social') || 'Carregador Interessado'
    const responsavel = record.getString('responsavel_nome') || ''
    const ciclo = record.getString('ciclo') || '2026/2027'
    const modalidade = record.getString('modalidade') || 'Firme Ordinário'
    const trecho = record.getString('trecho') || 'Gasoduto TSB'
    const pontoRecebimento = record.getString('ponto_recebimento') || 'Paso de Los Libres'
    const pontoEntrega = record.getString('ponto_entrega') || 'Triunfo'
    const capacidade = record.getFloat('capacidade_solicitada')
      ? String(record.getFloat('capacidade_solicitada'))
      : '-'

    if (!destinatario || !protocolo) {
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
  <title>Comprovante de Manifestação de Interesse - POCC TSB</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background-color:#0a2540;padding:24px 32px;color:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <h1 style="margin:0;font-size:20px;font-weight:bold;color:#ffffff;">TSB</h1>
                    <p style="margin:4px 0 0 0;font-size:12px;color:#93c5fd;">Transportadora Sulbrasileira de Gás S.A.</p>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:4px 10px;background-color:#059669;color:#ffffff;font-size:11px;font-weight:bold;border-radius:4px;text-transform:uppercase;">
                      POCC Ciclo ${ciclo}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:20px 32px;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;">Protocolo Eletrônico de Manifestação (Art. 37-A, §5º, I)</p>
              <h2 style="margin:6px 0 0 0;font-size:26px;color:#059669;font-family:'Courier New',Courier,monospace;letter-spacing:1px;font-weight:bold;">${protocolo}</h2>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#334155;">
                Prezado(a) <strong>${responsavel || 'Representante'}</strong> (${razaoSocial}),
              </p>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:22px;color:#334155;">
                Confirmamos com sucesso o recebimento e o registro eletrônico da sua <strong>Manifestação de Interesse Não Vinculante</strong> no âmbito do <strong>Processo de Oferta e Contratação de Capacidade (POCC) — Ciclo ${ciclo}</strong>, conforme os Arts. 37-A e 38-A da Resolução ANP nº 11/2016 (inseridos pela Resolução ANP nº 961/2023).
              </p>
              <div style="margin:20px 0;background-color:#eff6ff;border-left:4px solid #0284c7;padding:14px;border-radius:0 6px 6px 0;">
                <p style="margin:0;font-size:13px;color:#1e40af;font-weight:bold;">Próxima Etapa Regulamentar</p>
                <p style="margin:4px 0 0 0;font-size:13px;color:#0f172a;line-height:18px;">
                  Etapa II: Consulta Pública Tarifária (Art. 37-A, §3º) e Aprovação das Tarifas de Referência pela ANP combinada com eventual redistribuição de capacidade (Art. 37-A, §5º, II).
                </p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;">
                <tr style="background-color:#f8fafc;">
                  <td colspan="2" style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:bold;color:#475569;text-transform:uppercase;">
                    Resumo dos Dados da Manifestação
                  </td>
                </tr>
                <tr>
                  <td width="42%" style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Razão Social:</td>
                  <td width="58%" style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${razaoSocial}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Modalidade:</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${modalidade}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Capacidade Solicitada:</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${capacidade} m³/dia</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Trecho / Rota:</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${trecho} (${pontoRecebimento} &rarr; ${pontoEntrega})</td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0;font-size:12px;line-height:18px;color:#64748b;">
                A manifestação não vinculante atesta o interesse preliminar e habilita o agente a submeter, oportunamente na Etapa III, a sua Proposta Garantida Vinculante na plataforma eletrônica restrita da TSB.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0a2540;padding:20px 32px;color:#94a3b8;font-size:11px;">
              <p style="margin:0 0 4px 0;color:#e2e8f0;font-weight:600;">Transportadora Sulbrasileira de Gás S.A. - TSB</p>
              <p style="margin:0;color:#64748b;">Comprovante oficial emitido pelo módulo POC do Portal Corporativo TSB.</p>
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
      subject: `[TSB - POCC] Confirmação de Manifestação de Interesse - Protocolo ${protocolo}`,
      html: htmlBody,
    })

    e.app.newMailClient().send(message)
    console.log(`[SMTP TSB] E-mail de manifestação POCC ${protocolo} enviado para ${destinatario}`)
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err)
    console.error(`[SMTP TSB] Falha ao enviar e-mail de manifestação POCC: ${errMsg}`)
  }
}, 'poc_manifestacoes')

// 1.2 Hook automático após criação de Proposta Garantida Vinculante (Art. 37-A, §5º, III)
onRecordCreate((e) => {
  e.next()

  try {
    const record = e.record
    const destinatario = record.getString('email') || ''
    const protocolo = record.getString('protocolo')
    const razaoSocial = record.getString('razao_social') || 'Carregador'
    const repLegalNome = record.getString('rep_legal_nome') || ''
    const ciclo = record.getString('ciclo') || '2026/2027'
    const garantiaTipo = record.getString('garantia_tipo') || '-'
    const garantiaValor = record.getFloat('garantia_valor')
      ? String(record.getFloat('garantia_valor'))
      : '-'
    const capacidade = record.getFloat('capacidade_proposta')
      ? String(record.getFloat('capacidade_proposta'))
      : '-'

    // Busca e-mail do usuário criador se não estiver no registro
    let userEmail = destinatario
    if (!userEmail) {
      try {
        const userId = record.getString('user_id')
        if (userId) {
          const userRec = e.app.findRecordById('users', userId)
          userEmail = userRec.getString('email')
        }
      } catch (_) {}
    }

    if (!userEmail || !protocolo) {
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
<head><meta charset="UTF-8"><title>Comprovante de Proposta Vinculante - POCC TSB</title></head>
<body style="font-family:Arial,sans-serif;background-color:#f1f5f9;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <div style="background:#0a2540;color:#fff;padding:20px 24px;">
      <h2 style="margin:0;font-size:18px;">TSB - Proposta Garantida Vinculante Recebida</h2>
      <p style="margin:4px 0 0 0;font-size:12px;color:#93c5fd;">Art. 37-A, §5º, III e Art. 38-A, II da Res. ANP nº 11/2016</p>
    </div>
    <div style="padding:24px;">
      <p style="font-size:13px;color:#334155;">Prezados da <strong>${razaoSocial}</strong> (Representante: ${repLegalNome}),</p>
      <p style="font-size:13px;color:#334155;">Confirmamos a recepção formal da sua <strong>Proposta Garantida Vinculante</strong> no Ciclo POCC ${ciclo}.</p>
      <div style="background:#f8fafc;border-left:4px solid #059669;padding:12px;margin:16px 0;">
        <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;">Protocolo Vinculante</p>
        <p style="margin:2px 0 0 0;font-size:20px;font-weight:bold;color:#059669;font-family:monospace;">${protocolo}</p>
      </div>
      <table width="100%" cellpadding="6" style="font-size:12px;border-collapse:collapse;border:1px solid #e2e8f0;">
        <tr><td style="color:#64748b;border-bottom:1px solid #e2e8f0;">Capacidade Proposta:</td><td style="font-weight:bold;border-bottom:1px solid #e2e8f0;">${capacidade} m³/dia</td></tr>
        <tr><td style="color:#64748b;border-bottom:1px solid #e2e8f0;">Garantia Financeira:</td><td style="font-weight:bold;border-bottom:1px solid #e2e8f0;">${garantiaTipo} (R$ ${garantiaValor})</td></tr>
        <tr><td style="color:#64748b;">Representante Legal:</td><td style="font-weight:bold;">${repLegalNome}</td></tr>
      </table>
      <p style="margin:20px 0 0 0;font-size:12px;color:#64748b;">Sua garantia e documentos comprobatórios serão analisados pela Comissão do POCC para a Alocação Definitiva de Capacidade.</p>
    </div>
    <div style="background:#0a2540;color:#94a3b8;padding:12px 24px;font-size:11px;">
      Transportadora Sulbrasileira de Gás S.A. - TSB
    </div>
  </div>
</body>
</html>`

    const message = new MailerMessage({
      from: { address: senderAddress, name: senderName },
      to: [{ address: userEmail }],
      subject: `[TSB - POCC] Proposta Garantida Vinculante - Protocolo ${protocolo}`,
      html: htmlBody,
    })

    e.app.newMailClient().send(message)
    console.log(`[SMTP TSB] E-mail de proposta vinculante ${protocolo} enviado para ${userEmail}`)
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err)
    console.error(`[SMTP TSB] Falha ao enviar e-mail de proposta vinculante: ${errMsg}`)
  }
}, 'poc_propostas_vinculantes')

// 2. Hook de atualização: Dispara e-mail de CÓPIA À ANP quando desfecho for Aprofundamento (II) ou Negativa (III) (Art. 10, §3º)
onRecordUpdate((e) => {
  e.next()

  try {
    const record = e.record
    const desfechoTipo = record.getString('desfecho_tipo')
    const status = record.getString('status')

    // Verifica se é desfecho II (APROFUNDAMENTO) ou III (NEGATIVA)
    const ehAprofundamento = desfechoTipo === 'APROFUNDAMENTO' || status.includes('Aprofundamento')
    const ehNegativa =
      desfechoTipo === 'NEGATIVA' || status.includes('Negativa') || status === 'Rejeitada'

    if (!ehAprofundamento && !ehNegativa) {
      return
    }

    // Se já foi enviada a cópia anteriormente neste ciclo, evitar reenvio duplicado
    const jaEnviada = record.getBool('copia_anp_enviada')
    const originalDesfecho = record.original() ? record.original().getString('desfecho_tipo') : ''
    const originalStatus = record.original() ? record.original().getString('status') : ''

    // Se já estava com o mesmo desfecho e já tinha enviado, não reenviar
    if (jaEnviada && originalDesfecho === desfechoTipo && originalStatus === status) {
      return
    }

    const protocolo = record.getString('protocolo')
    const razaoSocial = record.getString('razao_social')
    const cnpj = record.getString('cnpj')
    const trecho = record.getString('trecho')
    const pontoRecebimento = record.getString('ponto_recebimento')
    const pontoEntrega = record.getString('ponto_entrega')
    const capacidade = record.getFloat('capacidade')
    const parecer = record.getString('parecer_fundamentado')
    const previsaoDisponibilidade = record.getString('previsao_disponibilidade')
    const condicoes = record.getString('aprofundamento_condicoes')
    const escopo = record.getString('aprofundamento_escopo')
    const cronograma = record.getString('aprofundamento_cronograma')
    const custos = record.getString('aprofundamento_custos')

    const anpDestinatario =
      record.getString('copia_anp_destinatario') ||
      $os.getenv('ANP_DESTINATARIO_EMAIL') ||
      'acesso.transporte@anp.gov.br'

    const senderAddress =
      $os.getenv('SMTP_FROM_ADDRESS') ||
      $os.getenv('SMTP_SENDER') ||
      e.app.settings().meta.senderAddress ||
      'site@tsb.com.br'
    const senderName =
      $os.getenv('SMTP_FROM_NAME') ||
      e.app.settings().meta.senderName ||
      'TSB - Transportadora Sulbrasileira de Gás'

    const tituloDecisao = ehAprofundamento
      ? 'Aprofundamento da Análise (Art. 10, §2º, II)'
      : 'Negativa Fundamentada (Art. 10, §2º, III)'

    let detalhesHtml = ''
    if (ehAprofundamento) {
      detalhesHtml = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;border:1px solid #cbd5e1;border-radius:6px;border-collapse:collapse;">
          <tr style="background:#f1f5f9;"><td colspan="2" style="padding:8px 12px;font-weight:bold;font-size:12px;color:#0f172a;">Elementos do Aprofundamento da Análise (§2º, II)</td></tr>
          <tr><td width="35%" style="padding:8px 12px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">Condições Necessárias:</td><td style="padding:8px 12px;border-top:1px solid #e2e8f0;font-size:12px;color:#0f172a;">${condicoes || 'A serem definidas nos estudos'}</td></tr>
          <tr><td style="padding:8px 12px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">Escopo dos Estudos:</td><td style="padding:8px 12px;border-top:1px solid #e2e8f0;font-size:12px;color:#0f172a;">${escopo || 'Avaliação hidráulica e de reforço de infraestrutura'}</td></tr>
          <tr><td style="padding:8px 12px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">Cronograma Previsto:</td><td style="padding:8px 12px;border-top:1px solid #e2e8f0;font-size:12px;color:#0f172a;">${cronograma || 'Conforme cronograma técnico TSB'}</td></tr>
          <tr><td style="padding:8px 12px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">Custos Estimados:</td><td style="padding:8px 12px;border-top:1px solid #e2e8f0;font-size:12px;color:#0f172a;">${custos || 'A apurar conforme proposta técnica'}</td></tr>
        </table>`
    } else {
      detalhesHtml = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;border:1px solid #cbd5e1;border-radius:6px;border-collapse:collapse;">
          <tr style="background:#fef2f2;"><td colspan="2" style="padding:8px 12px;font-weight:bold;font-size:12px;color:#991b1b;">Elementos da Negativa Fundamentada (§2º, III)</td></tr>
          <tr><td width="35%" style="padding:8px 12px;border-top:1px solid #fee2e2;font-size:12px;color:#64748b;">Previsão de Disponibilidade:</td><td style="padding:8px 12px;border-top:1px solid #fee2e2;font-size:12px;color:#0f172a;font-weight:bold;">${previsaoDisponibilidade || 'Indisponibilidade estrutural / Sem previsão'}</td></tr>
        </table>`
    }

    const htmlAnp = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Cópia à ANP - Decisão Inciso VII - Protocolo ${protocolo}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;background-color:#f1f5f9;margin:0;padding:24px;color:#0f172a;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;">
    <div style="background:#0a2540;color:#ffffff;padding:20px 24px;">
      <h2 style="margin:0;font-size:18px;">TSB - Cópia Regulatória à ANP</h2>
      <p style="margin:4px 0 0 0;font-size:12px;color:#93c5fd;">Art. 10, §3º da Resolução ANP nº 11/2016 - Notificação Oficial</p>
    </div>
    <div style="padding:24px;">
      <p style="font-size:13px;line-height:20px;color:#334155;">
        À <strong>Agência Nacional do Petróleo, Gás Natural e Biocombustíveis - ANP</strong> (Superintendência de Infraestrutura e Movimentação / Transporte),
      </p>
      <p style="font-size:13px;line-height:20px;color:#334155;">
        Em cumprimento ao <strong>Art. 10, §3º da Resolução ANP nº 11/2016</strong>, a Transportadora Sulbrasileira de Gás S.A. (TSB) encaminha cópia da deliberação formal relativa à solicitação de acesso à capacidade dutoviária discriminada a seguir:
      </p>

      <div style="background:#f8fafc;border-left:4px solid #0284c7;padding:12px 16px;margin:16px 0;">
        <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;">Protocolo Formal TSB</p>
        <p style="margin:2px 0 0 0;font-size:18px;font-weight:bold;color:#0284c7;font-family:monospace;">${protocolo}</p>
        <p style="margin:6px 0 0 0;font-size:13px;color:#0f172a;"><strong>Deliberação:</strong> ${tituloDecisao}</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;font-size:12px;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#64748b;width:35%;">Solicitante:</td><td style="padding:6px 0;font-weight:bold;color:#0f172a;">${razaoSocial} (CNPJ: ${cnpj})</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Instalação / Trecho:</td><td style="padding:6px 0;color:#0f172a;">${trecho}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Recebimento / Entrega:</td><td style="padding:6px 0;color:#0f172a;">${pontoRecebimento} &rarr; ${pontoEntrega}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Capacidade Requisitada:</td><td style="padding:6px 0;color:#0f172a;">${capacidade} m³/dia</td></tr>
      </table>

      ${detalhesHtml}

      <div style="margin-top:16px;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
        <span style="font-weight:bold;font-size:12px;color:#0f172a;display:block;margin-bottom:4px;">Parecer Técnico Fundamentado da TSB:</span>
        <p style="margin:0;font-size:12px;line-height:18px;color:#334155;font-style:italic;">&quot;${parecer}&quot;</p>
      </div>

      <p style="margin:20px 0 0 0;font-size:11px;color:#64748b;line-height:16px;">
        Este registro foi formalizado no Portal Corporativo TSB e registrado no histórico regulatório em conformidade com o Art. 10 da Res. ANP 11/2016.
      </p>
    </div>
    <div style="background:#0a2540;padding:12px 24px;color:#94a3b8;font-size:11px;">
      Transportadora Sulbrasileira de Gás S.A. - TSB &bull; Remetente: ${senderAddress}
    </div>
  </div>
</body>
</html>`

    const message = new MailerMessage({
      from: {
        address: senderAddress,
        name: senderName,
      },
      to: [{ address: anpDestinatario }],
      subject: `[TSB - Regulação ANP] Cópia Oficial Art. 10 §3º - Protocolo ${protocolo} (${tituloDecisao})`,
      html: htmlAnp,
    })

    e.app.newMailClient().send(message)
    console.log(
      `[SMTP TSB] Cópia à ANP enviada com sucesso para ${anpDestinatario} (Protocolo ${protocolo})`,
    )

    // Atualiza a flag na base de dados de forma silenciosa via raw query para não disparar loop de hook
    const agoraIso = new Date().toISOString()
    e.app
      .db()
      .newQuery(
        'UPDATE solicitacoes_inciso_vii SET copia_anp_enviada = 1, copia_anp_data = {:dt}, copia_anp_destinatario = {:dst} WHERE id = {:id}',
      )
      .bind({
        id: record.id,
        dt: agoraIso,
        dst: anpDestinatario,
      })
      .execute()
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err)
    console.error(`[SMTP TSB] Falha ao enviar cópia à ANP: ${errMsg}`)
  }
}, 'solicitacoes_inciso_vii')

// 3. Rota de teste SMTP corporativo
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

// 4. Rotas Públicas LGPD-compliant para o Portal de Transparência (Incisos VII e VIII)
// Estas rotas expõem exclusivamente dados operacionais agregados, SUPRIMINDO
// dados pessoais (e-mail, telefone, CPF, nome de pessoa física) em ambiente público.

// 4.1 Ofertas Ativas de Cessão de Capacidade (Inciso VIII) - Sem e-mail / sem dados pessoais
routerAdd('GET', '/backend/v1/public/ofertas-cessao', (c) => {
  try {
    const records = c.app.findRecordsByFilter('ofertas_cessao_inciso_viii', '', '-created', 200, 0)

    const sanitizadas = records.map((r) => {
      // Gerador de identificador referencial da oferta (ex: CES-2026-N7S7)
      const refId = 'CES-' + r.id.substring(0, 8).toUpperCase()
      return {
        id: r.id,
        referencia: refId,
        cedente: r.getString('cedente'),
        trecho: r.getString('trecho'),
        capacidade_ociosa: r.getFloat('capacidade_ociosa'),
        periodo_contratual: r.getString('periodo_contratual'),
        observacoes: r.getString('observacoes'),
        status: r.getString('status') || 'Disponível',
        created: r.getString('created'),
      }
    })

    return c.json(200, sanitizadas)
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err)
    return c.json(500, { error: errMsg })
  }
})

// 4.2 Resumo Agregado por Ponto Relevante (Inciso VII) - Sem Razão Social individual, sem e-mail, sem CNPJ
routerAdd('GET', '/backend/v1/public/solicitacoes-resumo', (c) => {
  try {
    const records = c.app.findRecordsByFilter('solicitacoes_inciso_vii', '', '-created', 500, 0)

    const grupos = {}
    for (const r of records) {
      const pRec = r.getString('ponto_recebimento') || 'Paso de Los Libres'
      const pEnt = r.getString('ponto_entrega') || 'Triunfo (Polo Petroquímico)'
      const mod = r.getString('modalidade') || 'Firme Ordinário'
      const chave = pRec + '__' + pEnt + '__' + mod

      if (!grupos[chave]) {
        grupos[chave] = []
      }
      grupos[chave].push(r)
    }

    const resultado = []
    for (const chave in grupos) {
      const itens = grupos[chave]
      const primeiro = itens[0]
      const pRec = primeiro.getString('ponto_recebimento') || 'Paso de Los Libres'
      const pEnt = primeiro.getString('ponto_entrega') || 'Triunfo (Polo Petroquímico)'
      const trecho = primeiro.getString('trecho')
      const modalidade = primeiro.getString('modalidade')
      const totalSolicitacoes = itens.length

      let capacidadeTotal = 0
      const periodosSet = {}
      for (const item of itens) {
        capacidadeTotal += item.getFloat('capacidade') || 0
        const p = item.getString('periodo')
        if (p) periodosSet[p] = true
      }

      const periodosDemandados = Object.keys(periodosSet)

      resultado.push({
        pontoRelevante: pRec + ' ➔ ' + pEnt,
        pontoRecebimento: pRec,
        pontoEntrega: pEnt,
        trecho: trecho,
        modalidade: modalidade,
        totalSolicitacoes: totalSolicitacoes,
        capacidadeTotalSolicitada: capacidadeTotal,
        statusPredominante: primeiro.getString('status'),
        periodosDemandados:
          periodosDemandados.length > 0 ? periodosDemandados : ['Conforme Edital/Acordo'],
      })
    }

    return c.json(200, resultado)
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err)
    return c.json(500, { error: errMsg })
  }
})

// 4.3 Resumo Agregado por Instalação de Transporte (Inciso VII) - Sem dados pessoais
routerAdd('GET', '/backend/v1/public/solicitacoes-instalacao', (c) => {
  try {
    const records = c.app.findRecordsByFilter('solicitacoes_inciso_vii', '', '-created', 500, 0)

    const mapa = {
      'Trecho 1': [],
      'Trecho 3': [],
      'Outras Instalações': [],
    }

    for (const r of records) {
      const t = (r.getString('trecho') || '').toLowerCase()
      const pRec = (r.getString('ponto_recebimento') || '').toLowerCase()
      const pEnt = (r.getString('ponto_entrega') || '').toLowerCase()

      if (
        t.indexOf('trecho 1') !== -1 ||
        t.indexOf('uruguaiana') !== -1 ||
        pRec.indexOf('libres') !== -1 ||
        pRec.indexOf('uruguaiana') !== -1 ||
        pEnt.indexOf('ute uruguaiana') !== -1
      ) {
        mapa['Trecho 1'].push(r)
      } else if (
        t.indexOf('trecho 3') !== -1 ||
        t.indexOf('triunfo') !== -1 ||
        pRec.indexOf('canoas') !== -1 ||
        pEnt.indexOf('triunfo') !== -1 ||
        pEnt.indexOf('polo') !== -1
      ) {
        mapa['Trecho 3'].push(r)
      } else {
        mapa['Outras Instalações'].push(r)
      }
    }

    const descricoes = {
      'Trecho 1':
        'Gasoduto Uruguaiana (Extensão: 25 km, Diâmetro: 24", Paso de Los Libres ⇄ UTE Uruguaiana)',
      'Trecho 3':
        'Gasoduto Triunfo (Extensão: 25 km, Diâmetro: 18", Interconexão TBG Canoas ⇄ Polo Petroquímico de Triunfo)',
      'Outras Instalações': 'Trecho 2 Planejado e Interconexões Complementares',
    }

    const keys = ['Trecho 1', 'Trecho 3', 'Outras Instalações']
    const resultado = []

    for (const key of keys) {
      const itens = mapa[key]
      if (itens.length === 0 && key === 'Outras Instalações') continue

      let capacidadeTotal = 0
      const modalidadesSet = {}
      const periodosSet = {}

      for (const item of itens) {
        capacidadeTotal += item.getFloat('capacidade') || 0
        const m = item.getString('modalidade')
        if (m) modalidadesSet[m] = true
        const p = item.getString('periodo')
        if (p) periodosSet[p] = true
      }

      const mods = Object.keys(modalidadesSet)
      const pers = Object.keys(periodosSet)

      resultado.push({
        instalacao: key,
        descricaoInstalacao: descricoes[key],
        totalSolicitacoes: itens.length,
        capacidadeTotalSolicitada: capacidadeTotal,
        modalidadesPresentes: mods.length > 0 ? mods : ['Nenhuma solicitação ativa'],
        statusPredominante:
          itens.length > 0 ? itens[0].getString('status') : 'Disponível para Solicitações',
        periodosDemandados: pers.length > 0 ? pers : ['Conforme Demanda / Planejamento'],
      })
    }

    return c.json(200, resultado)
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err)
    return c.json(500, { error: errMsg })
  }
})

// 4.4 Consulta de Parecer / SLA por Protocolo (Inciso VII) - Sem e-mail, sem dados pessoais
routerAdd('GET', '/backend/v1/public/consulta-protocolo/{protocolo}', (c) => {
  try {
    const protocolo = c.request.pathValue('protocolo')
    if (!protocolo) {
      return c.json(400, { error: 'Protocolo é obrigatório' })
    }

    const record = c.app.findFirstRecordByData('solicitacoes_inciso_vii', 'protocolo', protocolo)
    if (!record) {
      return c.json(404, { error: 'Protocolo não localizado' })
    }

    // Retorna APENAS dados técnico-operacionais regulatórios, omitindo estritamente
    // e-mail, telefone, CPF, representantes e dados pessoais (LGPD).
    return c.json(200, {
      id: record.id,
      protocolo: record.getString('protocolo'),
      modalidade: record.getString('modalidade'),
      capacidade: record.getFloat('capacidade'),
      trecho: record.getString('trecho'),
      ponto_recebimento: record.getString('ponto_recebimento'),
      ponto_entrega: record.getString('ponto_entrega'),
      periodo: record.getString('periodo'),
      status: record.getString('status'),
      sla_dias: record.getInt('sla_dias'),
      garantias_seguranca_swap: record.getString('garantias_seguranca_swap'),
      desfecho_tipo: record.getString('desfecho_tipo'),
      parecer_fundamentado: record.getString('parecer_fundamentado'),
      termos_condicoes: record.getString('termos_condicoes'),
      aprofundamento_condicoes: record.getString('aprofundamento_condicoes'),
      aprofundamento_escopo: record.getString('aprofundamento_escopo'),
      aprofundamento_cronograma: record.getString('aprofundamento_cronograma'),
      aprofundamento_custos: record.getString('aprofundamento_custos'),
      previsao_disponibilidade: record.getString('previsao_disponibilidade'),
      created: record.getString('created'),
    })
  } catch (err) {
    return c.json(404, { error: 'Protocolo não localizado' })
  }
})

// 5. Job agendado para teste de inicialização diário (cron)
cronAdd('tsb_smtp_status_check', '@daily', (c) => {
  const host = c.app.settings().smtp.host
  const enabled = c.app.settings().smtp.enabled
  const port = c.app.settings().smtp.port
  console.log(`[SMTP TSB Status] Host: ${host}:${port}, Enabled: ${enabled}`)
})
