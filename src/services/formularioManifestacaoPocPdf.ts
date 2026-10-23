import { jsPDF } from 'jspdf'
import logoTsb from '@/assets/image-ee90b.png'

export interface GerarManifestacaoPocPdfOpcoes {
  emailDestino?: string
  dadosPreenchidos: {
    razaoSocial: string
    cnpj: string
    representanteLegal: string
    emailCorporativo: string
    telefoneCorporativo?: string
    capacidade: number | string
    modalidade: string
    trecho: string
    pontoRecebimento?: string
    pontoEntrega?: string
    periodoInicio?: string
    periodoFim?: string
    periodoTexto?: string
    observacoes?: string
    ciclo?: string
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
    console.warn('Não foi possível carregar a logo para o PDF de Manifestação POCC:', err)
    return null
  }
}

/**
 * Gera e realiza o download da Manifestação de Interesse — POCC (Art. 37-A, §5º, I — Resolução ANP nº 961/2023).
 * Modelo oficial padronizado no mesmo estilo corporativo TSB (#0a1d37, #1b4d96, #e30613).
 */
export async function gerarManifestacaoPocPdf(
  opcoes: GerarManifestacaoPocPdfOpcoes,
): Promise<void> {
  const { emailDestino = 'regulacao@tsb.com.br', dadosPreenchidos } = opcoes

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
  doc.text(
    'PROCESSO DE OFERTA E CONTRATAÇÃO DE CAPACIDADE • POCC 2026/2027',
    marginX + 44,
    curY + 12,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...cinzaTexto)
  doc.text(
    'Manifestação de Interesse Não Vinculante — Art. 37-A, §5º, I da Resolução ANP nº 961/2023',
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
    'MANIFESTAÇÃO DE INTERESSE — POCC (ART. 37-A, §5º, I — RESOLUÇÃO ANP Nº 961/2023)',
    marginX + contentWidth / 2,
    curY + 5.7,
    { align: 'center' },
  )

  curY += 11.5

  // 3. QUADRO EXPLICATIVO / DECLARAÇÃO DE NÃO VINCULAÇÃO E FINALIDADE REGULATÓRIA
  doc.setFillColor(239, 246, 255) // azul bem claro
  doc.setDrawColor(186, 230, 253)
  doc.setLineWidth(0.2)
  doc.roundedRect(marginX, curY, contentWidth, 14, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(...azulMedio)
  doc.text(
    'TERMO DE NÃO VINCULAÇÃO & AMPARO REGULATÓRIO (ART. 37-A, §5º, I):',
    marginX + 3,
    curY + 3.8,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.1)
  doc.setTextColor(30, 41, 59)
  const amparoTexto =
    'A presente Manifestação de Interesse é de caráter NÃO VINCULANTE e destina-se exclusivamente ao levantamento de demanda preliminar junto ao mercado, servindo de subsídio técnico para a homologação das Tarifas de Referência pela ANP e eventual redistribuição de capacidade no âmbito do POCC (Art. 37-A, §5º, II). A submissão desta manifestação habilita o Carregador para apresentação posterior de Propostas Garantidas Vinculantes na Etapa III (§5º, III).'
  const splitAmparo = doc.splitTextToSize(amparoTexto, contentWidth - 6)
  doc.text(splitAmparo, marginX + 3, curY + 7.2)

  curY += 16.5

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

  // 4. SEÇÃO 1: IDENTIFICAÇÃO DO CARREGADOR INTERESSADO
  desenharCabecalhoSecao('1', 'Identificação do Carregador Interessado (Autenticado no Portal POC)')

  const colW2 = (contentWidth - 4) / 2
  desenharCampo(
    'RAZÃO SOCIAL DO CARREGADOR INTERESSADO *',
    marginX,
    curY,
    colW2,
    6.8,
    dadosPreenchidos.razaoSocial,
    'Nome empresarial completo da sociedade solicitante',
  )
  desenharCampo(
    'CNPJ DO CARREGADOR INTERESSADO *',
    marginX + colW2 + 4,
    curY,
    colW2,
    6.8,
    dadosPreenchidos.cnpj,
    '00.000.000/0000-00',
  )
  curY += 11.2

  desenharCampo(
    'REPRESENTANTE LEGAL OU PROCURADOR CONSTITUÍDO *',
    marginX,
    curY,
    colW2,
    6.8,
    dadosPreenchidos.representanteLegal,
    'Nome completo do signatário legal',
  )
  desenharCampo(
    'E-MAIL CORPORATIVO CADASTRADO NO PORTAL *',
    marginX + colW2 + 4,
    curY,
    colW2,
    6.8,
    dadosPreenchidos.emailCorporativo,
    'contato@comercializadora.com.br',
  )
  curY += 11.2

  const colW3 = (contentWidth - 6) / 3
  desenharCampo(
    'TELEFONE CORPORATIVO',
    marginX,
    curY,
    colW3,
    6.8,
    dadosPreenchidos.telefoneCorporativo || 'Não informado',
    '(00) 0000-0000',
  )
  desenharCampo(
    'CICLO POCC / EXERCÍCIO REGULATÓRIO',
    marginX + colW3 + 3,
    curY,
    colW3,
    6.8,
    dadosPreenchidos.ciclo || 'Ciclo 2026/2027',
    '2026/2027',
  )
  desenharCampo(
    'ORIGEM DO REGISTRO',
    marginX + (colW3 + 3) * 2,
    curY,
    colW3,
    6.8,
    'Área do Carregador (Autenticado)',
    'Portal POC TSB',
  )
  curY += 12

  // 5. SEÇÃO 2: ESPECIFICAÇÕES DA DEMANDA DE TRANSPORTE
  desenharCabecalhoSecao('2', 'Especificações da Demanda Pretendida no POCC (Art. 37-A, §5º, I)')

  const capacidadeFormatada =
    typeof dadosPreenchidos.capacidade === 'number'
      ? `${dadosPreenchidos.capacidade.toLocaleString('pt-BR')} m³/dia`
      : `${dadosPreenchidos.capacidade} m³/dia`

  desenharCampo(
    'CAPACIDADE PRETENDIDA (m³/dia) *',
    marginX,
    curY,
    colW3,
    6.8,
    capacidadeFormatada,
    'Ex: 150.000 m³/dia',
  )
  desenharCampo(
    'MODALIDADE DE SERVIÇO *',
    marginX + colW3 + 3,
    curY,
    colW3,
    6.8,
    dadosPreenchidos.modalidade,
    'Firme Ordinário ou Interruptível',
  )
  desenharCampo(
    'TRECHO / INSTALAÇÃO OBJETO *',
    marginX + (colW3 + 3) * 2,
    curY,
    colW3,
    6.8,
    dadosPreenchidos.trecho,
    'Trecho 1 ou Trecho 3',
  )
  curY += 11.2

  desenharCampo(
    'PONTO DE ENTRADA / RECEBIMENTO *',
    marginX,
    curY,
    colW2,
    6.8,
    dadosPreenchidos.pontoRecebimento || 'EMED Paso de Los Libres (Fronteira)',
    'Ponto de Entrada homologado',
  )
  desenharCampo(
    'PONTO DE SAÍDA / ENTREGA *',
    marginX + colW2 + 4,
    curY,
    colW2,
    6.8,
    dadosPreenchidos.pontoEntrega || 'Triunfo (Polo Petroquímico)',
    'Ponto de Saída homologado',
  )
  curY += 11.2

  const periodoExibicao =
    dadosPreenchidos.periodoTexto ||
    (dadosPreenchidos.periodoInicio && dadosPreenchidos.periodoFim
      ? `${dadosPreenchidos.periodoInicio} a ${dadosPreenchidos.periodoFim}`
      : 'Ciclo POCC 2026/2027')

  desenharCampo(
    'PERÍODO DE INTERESSE DE CONTRATAÇÃO *',
    marginX,
    curY,
    colW2,
    6.8,
    periodoExibicao,
    'Datas de início e fim da contratação pretendida',
  )
  desenharCampo(
    'STATUS INTERMEDIÁRIO DO REGISTRO',
    marginX + colW2 + 4,
    curY,
    colW2,
    6.8,
    'Rascunho Oficial — Aguardando Assinatura e Reanexo',
    'Etapa de Validação Cadastral',
  )
  curY += 11.2

  if (dadosPreenchidos.observacoes && dadosPreenchidos.observacoes.trim()) {
    desenharCampo(
      'OBSERVAÇÕES TÉCNICAS E CONDICIONANTES DO CARREGADOR (OPCIONAL)',
      marginX,
      curY,
      contentWidth,
      8.5,
      dadosPreenchidos.observacoes.trim(),
      'Condicionantes adicionais...',
    )
    curY += 12.8
  } else {
    curY += 1.5
  }

  // 6. SEÇÃO 3: TERMO DE DECLARAÇÃO, RESPONSABILIDADE E ASSINATURA
  desenharCabecalhoSecao('3', 'Declaração de Não Vinculação, Assinatura e Responsabilidade')

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...cinzaBorda)
  doc.setLineWidth(0.2)
  doc.roundedRect(marginX, curY, contentWidth, 34, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.2)
  doc.setTextColor(51, 65, 85)
  const termoTexto =
    'O Carregador Interessado, devidamente qualificado e representado pelo signatário legal abaixo subscrito, formaliza perante a Transportadora Sulbrasileira de Gás S.A. (TSB) a sua Manifestação de Interesse Não Vinculante no âmbito da Etapa I do POCC, nos termos do Art. 37-A, §5º, I da Resolução ANP nº 961/2023. Declara plena ciência de que este instrumento destina-se exclusivamente ao dimensionamento da demanda setorial e à instrução das Tarifas de Referência pela ANP, não constituindo obrigação de contratação nem direito de preferência. Declara ainda que, para a celebração definitiva de Contrato de Serviço de Transporte Firme, submeterá oportunamente na Etapa III a correspondente Proposta Garantida Vinculante.'
  const splitTermo = doc.splitTextToSize(termoTexto, contentWidth - 8)
  doc.text(splitTermo, marginX + 4, curY + 4.8)

  // Espaço para data e assinatura
  const dataLinhaY = curY + 22
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(...cinzaTexto)
  doc.text(
    `Local e Data: ________________________, _____ de _______________ de 20____`,
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
  doc.text(
    dadosPreenchidos.representanteLegal || 'Assinatura do Representante Legal',
    assinaX + 40,
    dataLinhaY + 7.8,
    { align: 'center' },
  )
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.8)
  doc.setTextColor(...cinzaTexto)
  doc.text(
    '(Assinatura digital com certificado ICP-Brasil / Gov.br ou física com carimbo)',
    assinaX + 40,
    dataLinhaY + 10.6,
    { align: 'center' },
  )

  curY += 38

  // 7. SEÇÃO 4: INSTRUÇÕES DO RITO HÍBRIDO (PORTAL TSB)
  doc.setFillColor(240, 253, 250) // fundo verde água / neutro
  doc.setDrawColor(153, 246, 228)
  doc.setLineWidth(0.3)
  doc.roundedRect(marginX, curY, contentWidth, 23, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.3)
  doc.setTextColor(15, 118, 110)
  doc.text(
    'RITO HÍBRIDO DO POCC • INSTRUÇÕES PARA REANEXO E GERAÇÃO DE PROTOCOLO',
    marginX + 4,
    curY + 4.5,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.6)
  doc.setTextColor(30, 41, 59)

  const instrucoes = [
    `1. Verifique os dados deste documento gerado automaticamente a partir da sua sessão autenticada no Portal POC.`,
    `2. Colete a assinatura do representante legal da sociedade (assinatura digital padrão ICP-Brasil / Gov.br ou física com carimbo).`,
    `3. Retorne à Área do Carregador (/poc) e REANEXE o PDF assinado na etapa 2 do formulário para emitir o protocolo definitivo.`,
    `4. VALIDAÇÃO REGULATÓRIA: o protocolo TSB-AAAA-XXXX somente nasce após o upload do PDF assinado no portal.`,
  ]

  let instY = curY + 8.5
  instrucoes.forEach((inst) => {
    doc.text(inst, marginX + 4, instY)
    instY += 4
  })

  // 8. RODAPÉ INFERIOR
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(148, 163, 184)
  doc.text(
    `TSB — Transportadora Sulbrasileira de Gás S.A. • POCC Art. 37-A §5º, I • Documento Oficial • Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
    marginX,
    pageHeight - 8,
  )
  doc.text(`Página 1 de 1`, pageWidth - marginX, pageHeight - 8, { align: 'right' })

  // Baixa o arquivo para o usuário
  const dataHojeStr = new Date().toISOString().split('T')[0]
  const cnpjLimpo = dadosPreenchidos.cnpj.replace(/\D/g, '') || 'CARREGADOR'
  doc.save(`TSB-Manifestacao-Interesse-POCC_${cnpjLimpo}_${dataHojeStr}.pdf`)
}
