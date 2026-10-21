import { jsPDF } from 'jspdf'
import logoTsb from '@/assets/image-ee90b.png'

export interface GerarFormularioPdfOpcoes {
  emailDestino?: string
  dadosPreenchidos?: {
    razaoSocial?: string
    cnpj?: string
    representanteLegal?: string
    emailComercial?: string
    telefoneComercial?: string
    modalidade?: string
    capacidadeOciosa?: string | number
    trecho?: string
    pontoRecebimento?: string
    pontoEntrega?: string
    periodoInicio?: string
    periodoFim?: string
    observacoes?: string
  }
}

/**
 * Converte a URL da imagem (import Vite) em Data URL base64 para uso no jsPDF.
 */
async function obterLogoBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result as string)
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.warn('Não foi possível carregar a logo para o PDF:', err)
    return null
  }
}

/**
 * Gera e realiza o download do Formulário-Padrão Oficial de Comunicação de Cessão de Capacidade da TSB.
 * Layout profissional em conformidade com o Art. 9º, VIII e Art. 10 da Resolução ANP nº 11/2016.
 */
export async function gerarFormularioCessaoPdf(
  opcoes: GerarFormularioPdfOpcoes = {},
): Promise<void> {
  const { emailDestino = 'acesso@tsb.com.br', dadosPreenchidos } = opcoes

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = 210
  const pageHeight = 297
  const marginX = 14
  const contentWidth = pageWidth - marginX * 2

  // Cores institucionais TSB
  const azulEscuro: [number, number, number] = [10, 29, 55] // #0a1d37
  const azulMedio: [number, number, number] = [27, 77, 150] // #1b4d96
  const vermelhoTsb: [number, number, number] = [227, 6, 19] // #e30613
  const cinzaBorda: [number, number, number] = [203, 213, 225] // #cbd5e1
  const cinzaFundo: [number, number, number] = [248, 250, 252] // #f8fafc
  const cinzaTexto: [number, number, number] = [71, 85, 105] // #475569

  let curY = 12

  // 1. CABEÇALHO CORPORATIVO COM LOGO TSB
  doc.setFillColor(...cinzaFundo)
  doc.roundedRect(marginX, curY, contentWidth, 24, 2, 2, 'F')
  doc.setDrawColor(...cinzaBorda)
  doc.setLineWidth(0.3)
  doc.roundedRect(marginX, curY, contentWidth, 24, 2, 2, 'D')

  // Logo TSB à esquerda
  const logoData = await obterLogoBase64(logoTsb)
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', marginX + 4, curY + 3.5, 36, 16.5)
    } catch {
      // Fallback tipográfico caso addImage falhe
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(...azulEscuro)
      doc.text('TSB', marginX + 6, curY + 14)
    }
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...azulEscuro)
    doc.text('TSB', marginX + 6, curY + 14)
  }

  // Título e identificação institucional no topo direito
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...azulEscuro)
  doc.text('TRANSPORTADORA SULBRASILEIRA DE GÁS S.A. — TSB', marginX + 46, curY + 7)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...vermelhoTsb)
  doc.text('PLATAFORMA ELETRÔNICA DE ACESSO • RESOLUÇÃO ANP Nº 11/2016', marginX + 46, curY + 13)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...cinzaTexto)
  doc.text(
    'Formulário-Padrão de Comunicação de Cessão de Capacidade Contratada (Art. 9º, VIII e Art. 10)',
    marginX + 46,
    curY + 18.5,
  )

  curY += 28

  // 2. FAIXA DE TÍTULO PRINCIPAL DO DOCUMENTO
  doc.setFillColor(...azulEscuro)
  doc.rect(marginX, curY, contentWidth, 9, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text('COMUNICAÇÃO DE CESSÃO DE CAPACIDADE CONTRATADA', marginX + contentWidth / 2, curY + 6, {
    align: 'center',
  })

  curY += 12

  // 3. QUADRO EXPLICATIVO / AMPARO LEGAL E LGPD
  doc.setFillColor(239, 246, 255) // azul bem claro
  doc.setDrawColor(186, 230, 253)
  doc.setLineWidth(0.2)
  doc.roundedRect(marginX, curY, contentWidth, 14, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...azulMedio)
  doc.text('AMPARO LEGAL & CONFORMIDADE REGULATÓRIA / LGPD:', marginX + 3, curY + 4)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(30, 41, 59)
  const amparoTexto =
    'Este documento formaliza a comunicação do carregador cedente ao transportador, conforme os termos do Art. 10 e para fins do resumo público previsto no Art. 9º, Inciso VIII da Resolução ANP nº 11/2016. Os dados pessoais e de contato são restritos à equipe operacional da TSB e protegidos pela LGPD.'
  const splitAmparo = doc.splitTextToSize(amparoTexto, contentWidth - 6)
  doc.text(splitAmparo, marginX + 3, curY + 7.5)

  curY += 17

  // Helper para desenhar títulos de seções
  const desenharCabecalhoSecao = (num: string, titulo: string) => {
    doc.setFillColor(...azulMedio)
    doc.rect(marginX, curY, contentWidth, 6, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(255, 255, 255)
    doc.text(`${num}. ${titulo.toUpperCase()}`, marginX + 3, curY + 4.2)
    curY += 8
  }

  // Helper para desenhar campo com rótulo e caixa
  const desenharCampo = (
    label: string,
    x: number,
    y: number,
    w: number,
    h: number,
    valor?: string,
    dica?: string,
  ) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...azulEscuro)
    doc.text(label, x, y - 1)

    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(...cinzaBorda)
    doc.setLineWidth(0.2)
    doc.roundedRect(x, y, w, h, 1, 1, 'FD')

    if (valor) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(15, 23, 42)
      doc.text(valor, x + 2, y + h / 2 + 1.2)
    } else if (dica) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(6.5)
      doc.setTextColor(148, 163, 184)
      doc.text(dica, x + 2, y + h / 2 + 1.2)
    }
  }

  // 4. SEÇÃO 1: IDENTIFICAÇÃO DO CARREGADOR CEDENTE
  desenharCabecalhoSecao('1', 'Identificação do Carregador Cedente (Titular da Capacidade)')

  const colW2 = (contentWidth - 4) / 2
  desenharCampo(
    'RAZÃO SOCIAL DO CEDENTE *',
    marginX,
    curY,
    colW2,
    7,
    dadosPreenchidos?.razaoSocial,
    'Nome empresarial completo da empresa carregadora',
  )
  desenharCampo(
    'CNPJ DO CEDENTE *',
    marginX + colW2 + 4,
    curY,
    colW2,
    7,
    dadosPreenchidos?.cnpj,
    '00.000.000/0000-00',
  )
  curY += 12

  desenharCampo(
    'REPRESENTANTE LEGAL OU PROCURADOR CONSTITUÍDO *',
    marginX,
    curY,
    colW2,
    7,
    dadosPreenchidos?.representanteLegal,
    'Nome completo do signatário',
  )
  desenharCampo(
    'E-MAIL DE CONTATO COMERCIAL / REGULATÓRIO *',
    marginX + colW2 + 4,
    curY,
    colW2,
    7,
    dadosPreenchidos?.emailComercial,
    'comercial@empresa.com.br (uso operacional TSB sob sigilo)',
  )
  curY += 12

  const colW3 = (contentWidth - 6) / 3
  desenharCampo(
    'TELEFONE COMERCIAL / OPERACIONAL *',
    marginX,
    curY,
    colW3,
    7,
    dadosPreenchidos?.telefoneComercial,
    '(00) 0000-0000',
  )
  desenharCampo(
    'Nº DO CONTRATO ORIGINAL COM A TSB (SE HOUVER)',
    marginX + colW3 + 3,
    curY,
    colW3,
    7,
    '',
    'Ex: CT-TSB-2024/001',
  )
  desenharCampo(
    'REGISTRO / AUTORIZAÇÃO ANP (CARREGADOR)',
    marginX + (colW3 + 3) * 2,
    curY,
    colW3,
    7,
    '',
    'Nº da Autorização de Carregamento ANP',
  )
  curY += 13

  // 5. SEÇÃO 2: CARACTERÍSTICAS DA CAPACIDADE A CEDER (ART. 10)
  desenharCabecalhoSecao(
    '2',
    'Dados Operacionais da Cessão de Capacidade (Art. 10 da Res. ANP 11/2016)',
  )

  desenharCampo(
    'MODALIDADE DE SERVIÇO *',
    marginX,
    curY,
    colW3,
    7,
    dadosPreenchidos?.modalidade,
    '[  ] Firme Ordinário   [  ] Interruptível   [  ] Outro',
  )
  desenharCampo(
    'CAPACIDADE OCIOSA A CEDER (m³/dia) *',
    marginX + colW3 + 3,
    curY,
    colW3,
    7,
    dadosPreenchidos?.capacidadeOciosa ? String(dadosPreenchidos.capacidadeOciosa) : undefined,
    'Ex: 25.000 m³/dia',
  )
  desenharCampo(
    'TRECHO / INSTALAÇÃO DE TRANSPORTE *',
    marginX + (colW3 + 3) * 2,
    curY,
    colW3,
    7,
    dadosPreenchidos?.trecho,
    'Uruguaiana -> Triunfo ou EMED Triunfo -> Polo',
  )
  curY += 12

  desenharCampo(
    'PONTO DE RECEBIMENTO (INJEÇÃO)',
    marginX,
    curY,
    colW2,
    7,
    dadosPreenchidos?.pontoRecebimento,
    'Ex: Paso de Los Libres / Uruguaiana ou Conforme Contrato',
  )
  desenharCampo(
    'PONTO DE ENTREGA (RETIRADA)',
    marginX + colW2 + 4,
    curY,
    colW2,
    7,
    dadosPreenchidos?.pontoEntrega,
    'Ex: Triunfo (Polo Petroquímico) ou Conforme Contrato',
  )
  curY += 12

  desenharCampo(
    'DATA DE INÍCIO DO PERÍODO *',
    marginX,
    curY,
    colW3,
    7,
    dadosPreenchidos?.periodoInicio,
    'DD/MM/AAAA',
  )
  desenharCampo(
    'DATA DE TÉRMINO DO PERÍODO *',
    marginX + colW3 + 3,
    curY,
    colW3,
    7,
    dadosPreenchidos?.periodoFim,
    'DD/MM/AAAA',
  )
  desenharCampo(
    'CESSÃO INTEGRAL OU PARCIAL',
    marginX + (colW3 + 3) * 2,
    curY,
    colW3,
    7,
    '',
    '[  ] Integral   [  ] Parcialmente Divisível',
  )
  curY += 12

  desenharCampo(
    'OBSERVAÇÕES E CONDIÇÕES OPERACIONAIS RELEVANTES (OPCIONAL)',
    marginX,
    curY,
    contentWidth,
    11,
    dadosPreenchidos?.observacoes,
    'Indique restrições de pressão, perfil de consumo, flexibilidade de modulação ou preferências comerciais.',
  )
  curY += 16

  // 6. SEÇÃO 3: TERMO DE DECLARAÇÃO, RESPONSABILIDADE E ASSINATURA
  desenharCabecalhoSecao('3', 'Declaração, Assinatura e Responsabilidade do Representante Legal')

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...cinzaBorda)
  doc.setLineWidth(0.2)
  doc.roundedRect(marginX, curY, contentWidth, 36, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(51, 65, 85)
  const termoTexto =
    'O Carregador Cedente acima identificado declara que detém os direitos de capacidade contratada ora ofertados, estando adimplente com suas obrigações contratuais perante a TSB. Autoriza a TSB a publicar o resumo operacional da oferta no Portal de Transparência (Art. 9º, VIII da Res. ANP 11/2016), mantendo resguardados os dados sob sigilo da LGPD. Compromete-se a informar formalmente à TSB eventuais negociações concluídas, canceladas ou alteradas.'
  const splitTermo = doc.splitTextToSize(termoTexto, contentWidth - 8)
  doc.text(splitTermo, marginX + 4, curY + 5)

  // Espaço para data e assinatura
  const dataLinhaY = curY + 23
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...cinzaTexto)
  doc.text(
    'Local e Data: ________________________, _____ de _______________ de 20____',
    marginX + 4,
    dataLinhaY,
  )

  // Linha de assinatura
  const assinaX = marginX + contentWidth - 85
  doc.setDrawColor(100, 116, 139)
  doc.setLineWidth(0.3)
  doc.line(assinaX, dataLinhaY + 5, assinaX + 80, dataLinhaY + 5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...azulEscuro)
  doc.text('Assinatura e Carimbo do Representante Legal', assinaX + 40, dataLinhaY + 9, {
    align: 'center',
  })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(...cinzaTexto)
  doc.text(
    '(Assinatura física com carimbo ou certificado digital ICP-Brasil / Gov.br)',
    assinaX + 40,
    dataLinhaY + 12,
    {
      align: 'center',
    },
  )

  curY += 41

  // 7. SEÇÃO 4: INSTRUÇÕES DE ENVIO E FLUXO OPERACIONAL TSB
  doc.setFillColor(254, 242, 242) // fundo levemente avermelhado institucional TSB
  doc.setDrawColor(254, 202, 202)
  doc.setLineWidth(0.3)
  doc.roundedRect(marginX, curY, contentWidth, 23, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...vermelhoTsb)
  doc.text(
    'INSTRUÇÕES DE ENVIO • NOVO MODELO MISTO DA TSB (MAIS SEGURO & REGULATÓRIO)',
    marginX + 4,
    curY + 4.5,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(30, 41, 59)

  const instrucoes = [
    `1. Preencha todos os campos do formulário com as informações técnicas e cadastrais.`,
    `2. Colete a assinatura do representante legal (aceita-se assinatura física com carimbo ou digital via ICP-Brasil/Gov.br).`,
    `3. Digitalize/salve o arquivo em PDF e envie exclusivamente ao e-mail oficial:`,
    `4. A equipe operacional da TSB analisará a conformidade, cadastrará e publicará a oferta no painel público do Inciso VIII.`,
  ]

  let instY = curY + 8.5
  instrucoes.forEach((inst, idx) => {
    if (idx === 2) {
      doc.text(inst, marginX + 4, instY)
      // Destaque para o e-mail oficial
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...azulMedio)
      doc.text(` ${emailDestino}`, marginX + 76, instY)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 41, 59)
    } else {
      doc.text(inst, marginX + 4, instY)
    }
    instY += 4
  })

  // 8. RODAPÉ INFERIOR
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(148, 163, 184)
  doc.text(
    `TSB — Transportadora Sulbrasileira de Gás S.A. • Formulário Oficial v1.0 • Impresso/Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
    marginX,
    pageHeight - 8,
  )
  doc.text(`Página 1 de 1`, pageWidth - marginX, pageHeight - 8, { align: 'right' })

  // Baixa o arquivo para o usuário
  const dataHojeStr = new Date().toISOString().split('T')[0]
  doc.save(`TSB-Formulario-Cessao-Inciso-VIII_${dataHojeStr}.pdf`)
}
