/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook disparado após a criação de uma submissão completa do POC (Área do Carregador)
 * Coleção: poc_submissoes_completas
 *
 * Envia notificação por e-mail via SMTP corporativo TSB para o usuário interessado
 * com o protocolo formal e o resumo da Manifestação e da Proposta Garantida.
 */
onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const protocolo = record.getString('protocolo')
  const emailDestino = record.getString('email')
  const razaoSocial = record.getString('razao_social')
  const cnpj = record.getString('cnpj')
  const responsavel = record.getString('responsavel_nome')
  const capManif = record.getFloat('capacidade_solicitada_manif')
  const capProp = record.getFloat('capacidade_proposta')
  const produto = record.getString('produto_proposta')
  const pontoZona = record.getString('ponto_zona_proposta')
  const garantiaTipo = record.getString('garantia_tipo')
  const garantiaValor = record.getFloat('garantia_valor')
  const garantiaInst = record.getString('garantia_instituicao')
  const createdDate = record.getDateTime('created')

  console.log('[POC Hook] Nova submissão completa criada: ' + protocolo + ' para ' + emailDestino)

  if (!emailDestino || emailDestino.indexOf('@') === -1) {
    console.log(
      '[POC Hook] E-mail de destino ausente ou inválido (' +
        emailDestino +
        '). Pulando envio de notificação.',
    )
    e.next()
    return
  }

  try {
    const dataFormatada = createdDate ? createdDate.format('02/01/2006 às 15:04:05 MST') : 'Hoje'

    const htmlBody =
      '<!DOCTYPE html>' +
      '<html><head><meta charset="utf-8">' +
      '<style>' +
      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }' +
      '.container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }' +
      '.header { background: #0a2540; color: #ffffff; padding: 24px; text-align: left; }' +
      '.header h1 { margin: 0 0 6px 0; font-size: 18px; letter-spacing: 0.5px; }' +
      '.header p { margin: 0; font-size: 12px; color: #bae6fd; }' +
      '.body { padding: 24px; }' +
      '.protocol-badge { display: inline-block; background: #0a2540; color: #ffffff; font-family: monospace; font-size: 16px; font-weight: bold; padding: 8px 16px; border-radius: 4px; letter-spacing: 1px; margin: 12px 0 16px 0; }' +
      '.section { margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 16px; }' +
      '.section-title { font-size: 13px; font-weight: bold; color: #0a2540; text-transform: uppercase; margin-bottom: 8px; }' +
      '.info-table { width: 100%; border-collapse: collapse; font-size: 12px; }' +
      '.info-table td { padding: 6px 4px; vertical-align: top; }' +
      '.info-table td.label { width: 40%; color: #64748b; font-weight: 600; }' +
      '.info-table td.value { color: #0f172a; }' +
      '.callout { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; margin-top: 20px; font-size: 12px; color: #166534; }' +
      '.footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; font-size: 11px; color: #64748b; text-align: center; }' +
      '</style>' +
      '</head><body>' +
      '<div class="container">' +
      '<div class="header">' +
      '<h1>TRANSPORTADORA SULBRASILEIRA DE GÁS S.A. — TSB</h1>' +
      '<p>Processo de Oferta e Contratação de Capacidade Anual (POC) · Resolução ANP nº 961/2023</p>' +
      '</div>' +
      '<div class="body">' +
      '<p style="font-size: 14px; margin-top: 0;">Prezado(a) <strong>' +
      (responsavel || razaoSocial) +
      '</strong>,</p>' +
      '<p style="font-size: 13px; line-height: 1.5;">Confirmamos o recebimento da submissão do processo do POC no portal corporativo TSB. A Manifestação de Interesse, a Proposta Garantida e o Comprovante de Garantia Financeira foram registrados sob o protocolo definitivo:</p>' +
      '<div style="text-align: center;">' +
      '<div class="protocol-badge">' +
      protocolo +
      '</div>' +
      '</div>' +
      '<div class="section">' +
      '<div class="section-title">Dados do Carregador Habilitado</div>' +
      '<table class="info-table">' +
      '<tr><td class="label">Razão Social:</td><td class="value"><strong>' +
      razaoSocial +
      '</strong></td></tr>' +
      '<tr><td class="label">CNPJ:</td><td class="value">' +
      cnpj +
      '</td></tr>' +
      '<tr><td class="label">Data de Registro:</td><td class="value">' +
      dataFormatada +
      '</td></tr>' +
      '</table>' +
      '</div>' +
      '<div class="section">' +
      '<div class="section-title">Resumo da Demanda e Proposta Garantida</div>' +
      '<table class="info-table">' +
      '<tr><td class="label">Capacidade Manifestada (Etapa 1):</td><td class="value">' +
      capManif +
      ' mil m³/dia</td></tr>' +
      '<tr><td class="label">Produto / Ponto Proposto (Etapa 2):</td><td class="value">' +
      produto +
      ' &bull; ' +
      pontoZona +
      '</td></tr>' +
      '<tr><td class="label">Capacidade Proposta Firme:</td><td class="value"><strong>' +
      capProp +
      ' mil m³/dia</strong></td></tr>' +
      '<tr><td class="label">Garantia Financeira Aportada:</td><td class="value">' +
      garantiaTipo +
      ' &bull; R$ ' +
      garantiaValor +
      ' (' +
      garantiaInst +
      ')</td></tr>' +
      '</table>' +
      '</div>' +
      '<div class="callout">' +
      '<strong>Próximos Passos Regulatórios:</strong><br>' +
      'A documentação submetida e o instrumento de garantia financeira serão analisados pela TSB conforme os critérios do Edital e da Resolução ANP nº 961/2023. Você pode acompanhar a evolução e pareceres através da área autenticada do Carregador na seção "Meus Protocolos".' +
      '</div>' +
      '</div>' +
      '<div class="footer">' +
      '<p style="margin: 0 0 4px 0;">Este é um e-mail automático gerado pelo sistema corporativo da TSB.</p>' +
      '<p style="margin: 0;">Transportadora Sulbrasileira de Gás S.A. · Porto Alegre / RS</p>' +
      '</div>' +
      '</div>' +
      '</body></html>'

    const mail = new MailerMessage({
      to: [{ address: emailDestino, name: responsavel || razaoSocial }],
      subject: '[TSB POC] Confirmação de Submissão · Protocolo ' + protocolo,
      html: htmlBody,
    })

    $app.newMailClient().send(mail)
    console.log(
      '[POC Hook] E-mail com protocolo ' + protocolo + ' enviado com sucesso para ' + emailDestino,
    )
  } catch (err) {
    console.error('[POC Hook] Falha ao enviar e-mail para ' + emailDestino + ': ' + err)
  }

  e.next()
}, 'poc_submissoes_completas')
