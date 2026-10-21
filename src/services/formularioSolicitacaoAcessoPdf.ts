import { jsPDF } from 'jspdf'
import logoTsb from '@/assets/image-ee90b.png'

export interface GerarFormularioAcessoPdfOpcoes {
  emailDestino?: string
  dadosPreenchidos?: {
    razaoSocial?: string
    cnpj?: string
    representanteLegal?: string
    emailCorporativo?: string
    telefoneCorporativo?: string
    modalidade?: string
    pontoRecebimento?: string
    pontoEntrega?: string
    capacidade?: string | number
    trecho?: string
    periodo?: string
    garantiasSwap?: string
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
    console.warn('Não foi possível carregar a logo para o PDF de Solicitação de Acesso:', err)
    return null
  }
}

/**
 * Gera e realiza o download do Formulário-Padrão Oficial de Solicitação de Acesso da TSB (Art. 9º, VII e Art. 10 da Res. ANP 11/2016).
 * Layout profissional em conformidade com as cores institucionais TSB (#0a1d37, #1b4d96, #e30613).
 */
export async function gerarFormularioAcessoPdf(
  opcoes: GerarFormularioAcessoPdfOpcoes = {},
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

  let curY = 11

  // 1. CABEÇALHO CORPORATIVO COM LOGO TSB
  doc.setFillColor(...cinzaFundo)
  doc.roundedRect(marginX, curY, contentWidth, 23, 2, 2, 'F')
  doc.setDrawColor(...cinzaBorda)
  doc.setLineWidth(0.3)
  doc.roundedRect(marginX, curY, contentWidth, 23, 2, 2, 'D')

  // Logo TSB à esquerda
  const logoData = await obterLogoBase64(logoTsb)
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', marginX + 4, curY + 3.2, 35, 16)
    } catch {
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
  doc.setFontSize(10.5)
  doc.setTextColor(...azulEscuro)
  doc.text('TRANSPORTADORA SULBRASILEIRA DE GÁS S.A. — TSB', marginX + 44, curY + 6.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...vermelhoTsb)
  doc.text('PLATAFORMA ELETRÔNICA DE ACESSO • RESOLUÇÃO ANP Nº 11/2016', marginX + 44, curY + 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...cinzaTexto)
  doc.text(
    'Formulário-Padrão de Solicitação de Acesso à Capacidade de Transporte (Art. 9º, VII e Art. 10)',
    marginX + 44,
    curY + 17.5,
  )

  curY += 26

  // 2. FAIXA DE TÍTULO PRINCIPAL DO DOCUMENTO
  doc.setFillColor(...azulEscuro)
  doc.rect(marginX, curY, contentWidth, 8.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(255, 255, 255)
  doc.text(
    'SOLICITAÇÃO DE ACESSO FIRME, INTERRUPTÍVEL OU TROCA OPERACIONAL (SWAP)',
    marginX + contentWidth / 2,
    curY + 5.7,
    { align: 'center' },
  )

  curY += 11.5

  // 3. QUADRO EXPLICATIVO / AMPARO LEGAL E LGPD
  doc.setFillColor(239, 246, 255) // azul bem claro
  doc.setDrawColor(186, 230, 253)
  doc.setLineWidth(0.2)
  doc.roundedRect(marginX, curY, contentWidth, 13, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(...azulMedio)
  doc.text('AMPARO LEGAL & CONFORMIDADE REGULATÓRIA / LGPD:', marginX + 3, curY + 3.8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.2)
  doc.setTextColor(30, 41, 59)
  const amparoTexto =
    'Formalização da solicitação de acesso para análise de viabilidade técnico-operacional pela TSB (Art. 10 da Resolução ANP nº 11/2016). Prazo regulatório de resposta: 20 dias úteis. Em conformidade estrita com a LGPD, os dados cadastrais e de representantes legais são de uso estrito e exclusivo da transportadora, sendo o resumo público (Art. 9º, VII) publicado sem informações pessoais.'
  const splitAmparo = doc.splitTextToSize(amparoTexto, contentWidth - 6)
  doc.text(splitAmparo, marginX + 3, curY + 7.2)

  curY += 15.5

  // Helper para desenhar títulos de seções
  const desenharCabecalhoSecao = (num: string, titulo: string) => {
    doc.setFillColor(...azulMedio)
    doc.rect(marginX, curY, contentWidth, 5.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.2)
    doc.setTextColor(255, 255, 255)
    doc.text(`${num}. ${titulo.toUpperCase()}`, marginX + 3, curY + 3.9)
    curY += 7.5
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
    doc.setFontSize(6.2)
    doc.setTextColor(...azulEscuro)
    doc.text(label, x, y - 1)

    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(...cinzaBorda)
    doc.setLineWidth(0.2)
    doc.roundedRect(x, y, w, h, 1, 1, 'FD')

    if (valor) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(15, 23, 42)
      doc.text(valor, x + 2, y + h / 2 + 1)
    } else if (dica) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(6)
      doc.setTextColor(148, 163, 184)
      doc.text(dica, x + 2, y + h / 2 + 1)
    }
  }

  // 4. SEÇÃO 1: IDENTIFICAÇÃO DO CARREGADOR / SOLICITANTE
  desenharCabecalhoSecao('1', 'Identificação do Carregador Solicitante (Art. 10)')

  const colW2 = (contentWidth - 4) / 2
  desenharCampo(
    'RAZÃO SOCIAL DO SOLICITANTE *',
    marginX,
    curY,
    colW2,
    6.8,
    dadosPreenchidos?.razaoSocial,
    'Nome empresarial completo da sociedade solicitante',
  )
  desenharCampo(
    'CNPJ DO SOLICITANTE *',
    marginX + colW2 + 4,
    curY,
    colW2,
    6.8,
    dadosPreenchidos?.cnpj,
    '00.000.000/0000-00',
  )
  curY += 11.2

  desenharCampo(
    'REPRESENTANTE LEGAL OU PROCURADOR CONSTITUÍDO *',
    marginX,
    curY,
    colW2,
    6.8,
    dadosPreenchidos?.representanteLegal,
    'Nome completo do signatário legal',
  )
  desenharCampo(
    'E-MAIL CORPORATIVO PARA ENVIO DE PROTOCOLO E PARECER *',
    marginX + colW2 + 4,
    curY,
    colW2,
    6.8,
    dadosPreenchidos?.emailCorporativo,
    'regulacao@comercializadora.com.br (uso exclusivo sob sigilo)',
  )
  curY += 11.2

  const colW3 = (contentWidth - 6) / 3
  desenharCampo(
    'TELEFONE CORPORATIVO / OPERACIONAL *',
    marginX,
    curY,
    colW3,
    6.8,
    dadosPreenchidos?.telefoneCorporativo,
    '(00) 0000-0000',
  )
  desenharCampo(
    'REGISTRO / AUTORIZAÇÃO DE CARREGADOR NA ANP *',
    marginX + colW3 + 3,
    curY,
    colW3,
    6.8,
    '',
    'Nº da Autorização de Carregamento ANP',
  )
  desenharCampo(
    'INSCRIÇÃO ESTADUAL / MUNICIPAL',
    marginX + (colW3 + 3) * 2,
    curY,
    colW3,
    6.8,
    '',
    'Inscrição Estadual ou Isento',
  )
  curY += 12

  // 5. SEÇÃO 2: DADOS TÉCNICOS DA SOLICITAÇÃO DE ACESSO (ART. 10, II E IV)
  desenharCabecalhoSecao(
    '2',
    'Especificações Técnicas da Demanda de Transporte (Art. 10 da Res. ANP 11/2016)',
  )

  desenharCampo(
    'MODALIDADE DE SERVIÇO SOLICITADA *',
    marginX,
    curY,
    colW3,
    6.8,
    dadosPreenchidos?.modalidade,
    '[  ] Firme Ordinário   [  ] Interruptível   [  ] Troca Operacional',
  )
  desenharCampo(
    'CAPACIDADE REQUISITADA (m³/dia) *',
    marginX + colW3 + 3,
    curY,
    colW3,
    6.8,
    dadosPreenchidos?.capacidade ? String(dadosPreenchidos.capacidade) : undefined,
    'Ex: 150.000 m³/dia',
  )
  desenharCampo(
    'INSTALAÇÃO / TRECHO DE TRANSPORTE *',
    marginX + (colW3 + 3) * 2,
    curY,
    colW3,
    6.8,
    dadosPreenchidos?.trecho,
    'Trecho 1 (Uruguaiana) ou Trecho 3 (Triunfo)',
  )
  curY += 11.2

  desenharCampo(
    'PONTO(S) DE RECEBIMENTO / INTERCONEXÃO (INJEÇÃO) *',
    marginX,
    curY,
    colW2,
    6.8,
    dadosPreenchidos?.pontoRecebimento,
    'Ex: Paso de Los Libres (Fronteira) ou Canoas (Interconexão TBG)',
  )
  desenharCampo(
    'PONTO(S) DE ENTREGA / INTERCONEXÃO (RETIRADA) *',
    marginX + colW2 + 4,
    curY,
    colW2,
    6.8,
    dadosPreenchidos?.pontoEntrega,
    'Ex: Triunfo (Polo Petroquímico) ou Uruguaiana (UTE Uruguaiana)',
  )
  curY += 11.2

  desenharCampo(
    'PERÍODO(S) EM QUE O SERVIÇO SERÁ REQUISITADO (EXIGÊNCIA LEGAL: ART. 10, II) *',
    marginX,
    curY,
    contentWidth,
    6.8,
    dadosPreenchidos?.periodo,
    'Ex: 01/01/2027 a 31/12/2027 ou Período Safra Out/2026 a Mar/2027 (especificar datas)',
  )
  curY += 11.2

  // Seção de Troca Operacional / Swap (Art. 10, §1º)
  desenharCampo(
    'GARANTIAS DE SEGURANÇA E CONFIABILIDADE OPERACIONAL (OBRIGATÓRIO PARA TROCA OPERACIONAL / SWAP - ART. 10, §1º)',
    marginX,
    curY,
    contentWidth,
    11,
    dadosPreenchidos?.garantiasSwap,
    'Descreva as garantias deLastro Físico, disponibilidade nos pontos de injeção, salvaguardas contratuais e planos de contingência técnica.',
  )
  curY += 15.5

  // 6. SEÇÃO 3: TERMO DE DECLARAÇÃO, RESPONSABILIDADE E ASSINATURA
  desenharCabecalhoSecao('3', 'Declaração, Assinatura e Responsabilidade do Representante Legal')

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...cinzaBorda)
  doc.setLineWidth(0.2)
  doc.roundedRect(marginX, curY, contentWidth, 34, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.2)
  doc.setTextColor(51, 65, 85)
  const termoTexto =
    'O Carregador Solicitante declara que as informações aqui prestadas são verídicas e refletem sua efetiva demanda de transporte de gás natural. Declara ciência de que o prazo de resposta do transportador é de 20 (vinte) dias úteis contados a partir da formalização do protocolo (Art. 10 da Res. ANP 11/2016), admitindo-se os 3 desfechos regulamentares: I - Confirmação do Atendimento; II - Aprofundamento da Análise (com escopo e custos preliminares); ou III - Negativa Fundamentada (com cópia à ANP). Autoriza a publicação do resumo agregado no Portal de Transparência (Art. 9º, VII), preservado o sigilo sobre dados societários e cadastrais pela LGPD.'
  const splitTermo = doc.splitTextToSize(termoTexto, contentWidth - 8)
  doc.text(splitTermo, marginX + 4, curY + 4.8)

  // Espaço para data e assinatura
  const dataLinhaY = curY + 22
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
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
  doc.line(assinaX, dataLinhaY + 4, assinaX + 80, dataLinhaY + 4)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(...azulEscuro)
  doc.text('Assinatura e Carimbo do Representante Legal', assinaX + 40, dataLinhaY + 7.8, {
    align: 'center',
  })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.8)
  doc.setTextColor(...cinzaTexto)
  doc.text(
    '(Assinatura física com carimbo ou certificado digital ICP-Brasil / Gov.br)',
    assinaX + 40,
    dataLinhaY + 10.6,
    { align: 'center' },
  )

  curY += 38

  // 7. SEÇÃO 4: INSTRUÇÕES DE ENVIO E FLUXO OPERACIONAL TSB
  doc.setFillColor(254, 242, 242) // fundo levemente avermelhado institucional TSB
  doc.setDrawColor(254, 202, 202)
  doc.setLineWidth(0.3)
  doc.roundedRect(marginX, curY, contentWidth, 23, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.3)
  doc.setTextColor(...vermelhoTsb)
  doc.text(
    'INSTRUÇÕES DE ENVIO • MODELO MISTO DA TSB (PADRÃO SEGURO & REGULATÓRIO)',
    marginX + 4,
    curY + 4.5,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.6)
  doc.setTextColor(30, 41, 59)

  const instrucoes = [
    `1. Preencha todos os campos do formulário com as informações técnicas da demanda (pontos, capacidade e período).`,
    `2. Colete a assinatura do representante legal (assinatura física com carimbo ou digital ICP-Brasil / Gov.br).`,
    `3. Digitalize/salve o arquivo em PDF e envie exclusivamente ao canal oficial da TSB:`,
    `4. A equipe TSB recepcionará o formulário, gerará o número de Protocolo com envio de comprovante e SLA de 20 dias úteis.`,
  ]

  let instY = curY + 8.5
  instrucoes.forEach((inst, idx) => {
    if (idx === 2) {
      doc.text(inst, marginX + 4, instY)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...azulMedio)
      doc.text(` ${emailDestino}`, marginX + 80, instY)
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
  doc.save(`TSB-Formulario-Solicitacao-Acesso-Inciso-VII_${dataHojeStr}.pdf`)
}
