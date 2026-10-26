import { jsPDF } from 'jspdf'
import logoTsb from '@/assets/image-ee90b.png'

export interface ItemTabelaInteresse {
  pontoZona: string
  produto: string
  capacidade: number | string
}

export interface DadosManifestacaoInteressePdf {
  protocolo?: string
  // Seção 1. Identificação do Interessado
  razaoSocial: string
  sedeEndereco: string
  inscricaoEstadual: string
  cnpj: string
  atividadePrincipal: string
  codigoCnae: string
  atividadeSecundariaCnae?: string
  autorizacaoAnp: string
  sitioEletronico: string
  telefone: string

  // Seção 2. Representante Autorizado
  repNome: string
  repNacionalidade: string
  repEstadoCivil: string
  repDataNascimento: string
  repProfissao: string
  repCargo: string
  repCredenciamento: string
  repRg: string
  repOrgaoEmissor: string
  repCpf: string
  repEmail: string
  repEndereco: string

  // Seção 3. Informações para Contato
  contatoNome: string
  contatoTelefone: string
  contatoEmail: string
  contatoEndereco: string

  // Seção 4. Tabela de Interesse
  itensInteresse: ItemTabelaInteresse[]

  // Declarações e Data
  dataDocumento?: string
  local?: string
}

async function obterLogoBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.warn('Não foi possível carregar a logo TSB:', err)
    return null
  }
}

/**
 * Gera e realiza o download do PDF oficial da Manifestação de Interesse (não vinculante),
 * espelhando o modelo oficial do Processo de Oferta e Contratação de Capacidade Anual (POC).
 */
export async function gerarManifestacaoInteressePdf(
  dados: DadosManifestacaoInteressePdf,
): Promise<Blob> {
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
  const azulEscuro: [number, number, number] = [10, 37, 64] // #0a2540
  const azulMedio: [number, number, number] = [2, 132, 199] // #0284c7
  const cinzaBorda: [number, number, number] = [203, 213, 225]
  const cinzaFundo: [number, number, number] = [248, 250, 252]
  const cinzaTexto: [number, number, number] = [71, 85, 105]

  let curY = 12

  const verificarQuebra = (alturaNecessaria: number) => {
    if (curY + alturaNecessaria > pageHeight - 16) {
      doc.addPage()
      curY = 14
    }
  }

  // 1. Cabeçalho Corporativo
  doc.setFillColor(...cinzaFundo)
  doc.roundedRect(marginX, curY, contentWidth, 22, 2, 2, 'F')
  doc.setDrawColor(...cinzaBorda)
  doc.setLineWidth(0.3)
  doc.roundedRect(marginX, curY, contentWidth, 22, 2, 2, 'D')

  const logoData = await obterLogoBase64(logoTsb)
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', marginX + 4, curY + 3, 32, 15)
    } catch {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(...azulEscuro)
      doc.text('TSB', marginX + 6, curY + 13)
    }
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...azulEscuro)
    doc.text('TSB', marginX + 6, curY + 13)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...azulEscuro)
  doc.text('TRANSPORTADORA SULBRASILEIRA DE GÁS S.A. — TSB', marginX + 40, curY + 6.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...azulMedio)
  doc.text('PROCESSO DE OFERTA E CONTRATAÇÃO DE CAPACIDADE ANUAL', marginX + 40, curY + 11.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...cinzaTexto)
  doc.text(
    'Resolução ANP nº 961/2023 · Art. 37-A, § 5º, I — Documento Oficial de Manifestação de Interesse',
    marginX + 40,
    curY + 16.5,
  )

  if (dados.protocolo) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...azulEscuro)
    doc.text(`Protocolo: ${dados.protocolo}`, pageWidth - marginX - 4, curY + 6.5, {
      align: 'right',
    })
  }

  curY += 26

  // 2. Faixa do Documento
  doc.setFillColor(...azulEscuro)
  doc.rect(marginX, curY, contentWidth, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(255, 255, 255)
  doc.text(
    'MANIFESTAÇÃO DE INTERESSE NÃO VINCULANTE (ETAPA I)',
    marginX + contentWidth / 2,
    curY + 5.3,
    { align: 'center' },
  )

  curY += 11

  // Nota de caráter não vinculante
  doc.setFillColor(240, 249, 255)
  doc.setDrawColor(186, 230, 253)
  doc.setLineWidth(0.2)
  doc.roundedRect(marginX, curY, contentWidth, 9, 1.5, 1.5, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(3, 105, 161)
  doc.text('CARÁTER NÃO VINCULANTE:', marginX + 3, curY + 3.8)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(15, 23, 42)
  doc.text(
    'A presente Manifestação tem por finalidade mapear a demanda por capacidade de transporte firme, sem exigência de garantia financeira e sem vínculo contratual imediato.',
    marginX + 3,
    curY + 7,
  )

  curY += 12

  const desenharSecao = (num: string, titulo: string) => {
    verificarQuebra(14)
    doc.setFillColor(241, 245, 249)
    doc.setDrawColor(...cinzaBorda)
    doc.rect(marginX, curY, contentWidth, 5.2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.2)
    doc.setTextColor(...azulEscuro)
    doc.text(`${num}. ${titulo.toUpperCase()}`, marginX + 3, curY + 3.7)
    curY += 7
  }

  const desenharCampo = (
    label: string,
    valor: string | undefined,
    x: number,
    y: number,
    w: number,
    h: number = 6,
  ) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(5.8)
    doc.setTextColor(...cinzaTexto)
    doc.text(label, x, y - 0.8)

    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(...cinzaBorda)
    doc.setLineWidth(0.2)
    doc.roundedRect(x, y, w, h, 1, 1, 'FD')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(15, 23, 42)
    const valStr = valor && valor.trim() ? valor.trim() : '—'
    const textoCortado = doc.splitTextToSize(valStr, w - 3)[0] || '—'
    doc.text(textoCortado, x + 2, y + h / 2 + 1)
  }

  // 1. Identificação do Interessado
  desenharSecao('1', 'Identificação do Interessado (Carregador Habilitado)')

  const col2 = (contentWidth - 4) / 2
  desenharCampo('RAZÃO SOCIAL', dados.razaoSocial, marginX, curY, col2)
  desenharCampo('CNPJ / MF', dados.cnpj, marginX + col2 + 4, curY, col2)
  curY += 9.5

  desenharCampo('SEDE / ENDEREÇO', dados.sedeEndereco, marginX, curY, col2 + 30)
  desenharCampo('INSCRIÇÃO ESTADUAL', dados.inscricaoEstadual, marginX + col2 + 34, curY, col2 - 30)
  curY += 9.5

  const col3 = (contentWidth - 6) / 3
  desenharCampo('ATIVIDADE PRINCIPAL (SEGMENTO)', dados.atividadePrincipal, marginX, curY, col3)
  desenharCampo('CÓDIGO CNAE', dados.codigoCnae, marginX + col3 + 3, curY, col3)
  desenharCampo('AUTORIZAÇÃO ANP Nº', dados.autorizacaoAnp, marginX + (col3 + 3) * 2, curY, col3)
  curY += 9.5

  if (dados.atividadeSecundariaCnae) {
    desenharCampo(
      'ATIVIDADE SECUNDÁRIA E RESPECTIVO CNAE',
      dados.atividadeSecundariaCnae,
      marginX,
      curY,
      contentWidth,
    )
    curY += 9.5
  }

  desenharCampo('SÍTIO ELETRÔNICO CORPORATIVO', dados.sitioEletronico, marginX, curY, col2)
  desenharCampo('TELEFONE CORPORATIVO', dados.telefone, marginX + col2 + 4, curY, col2)
  curY += 11

  // 2. Representante Autorizado
  desenharSecao('2', 'Representante Autorizado')
  desenharCampo('NOME COMPLETO', dados.repNome, marginX, curY, col2)
  desenharCampo('CPF / MF', dados.repCpf, marginX + col2 + 4, curY, col2)
  curY += 9.5

  desenharCampo('NACIONALIDADE', dados.repNacionalidade, marginX, curY, col3)
  desenharCampo('ESTADO CIVIL', dados.repEstadoCivil, marginX + col3 + 3, curY, col3)
  desenharCampo('DATA DE NASCIMENTO', dados.repDataNascimento, marginX + (col3 + 3) * 2, curY, col3)
  curY += 9.5

  desenharCampo('PROFISSÃO', dados.repProfissao, marginX, curY, col3)
  desenharCampo('CARGO', dados.repCargo, marginX + col3 + 3, curY, col3)
  desenharCampo(
    'CREDENCIAMENTO PROFISSIONAL (OAB/CREA/OUTRO)',
    dados.repCredenciamento,
    marginX + (col3 + 3) * 2,
    curY,
    col3,
  )
  curY += 9.5

  desenharCampo('CARTEIRA DE IDENTIDADE (RG)', dados.repRg, marginX, curY, col3)
  desenharCampo('ÓRGÃO EMISSOR / UF', dados.repOrgaoEmissor, marginX + col3 + 3, curY, col3)
  desenharCampo('E-MAIL CORPORATIVO', dados.repEmail, marginX + (col3 + 3) * 2, curY, col3)
  curY += 9.5

  desenharCampo(
    'ENDEREÇO DE DOMICÍLIO DO REPRESENTANTE',
    dados.repEndereco,
    marginX,
    curY,
    contentWidth,
  )
  curY += 11

  // 3. Informações para Contato
  desenharSecao('3', 'Informações para Contato')
  desenharCampo('NOME DO CONTATO', dados.contatoNome, marginX, curY, col2)
  desenharCampo('TELEFONE(S) DE CONTATO', dados.contatoTelefone, marginX + col2 + 4, curY, col2)
  curY += 9.5

  desenharCampo('E-MAIL DE CONTATO', dados.contatoEmail, marginX, curY, col2)
  desenharCampo('ENDEREÇO COMERCIAL', dados.contatoEndereco, marginX + col2 + 4, curY, col2)
  curY += 11

  // 4. Tabela de Interesse
  verificarQuebra(35)
  desenharSecao('4', 'Demanda Solicitada — Ponto(s) de Entrada e Zona(s) de Saída')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(51, 65, 85)
  doc.text(
    'O Carregador manifesta interesse na contratação de Capacidade de Transporte na modalidade Firme para os pontos/zonas e produtos abaixo:',
    marginX,
    curY,
  )
  curY += 3.5

  // Cabeçalho da tabela
  doc.setFillColor(...azulEscuro)
  doc.rect(marginX, curY, contentWidth, 5.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.2)
  doc.setTextColor(255, 255, 255)
  doc.text('PONTO DE ENTRADA OU ZONA DE SAÍDA', marginX + 3, curY + 3.8)
  doc.text('PRODUTO ANUAL', marginX + 95, curY + 3.8)
  doc.text('CAPACIDADE SOLICITADA (mil m³/d)', marginX + 140, curY + 3.8)
  curY += 5.5

  const itens =
    dados.itensInteresse && dados.itensInteresse.length > 0
      ? dados.itensInteresse
      : [{ pontoZona: 'Ponto de Entrada ou Zona de Saída', produto: 'Anual Firme', capacidade: 0 }]

  itens.forEach((it, idx) => {
    verificarQuebra(8)
    const bg: [number, number, number] = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
    doc.setFillColor(...bg)
    doc.setDrawColor(...cinzaBorda)
    doc.rect(marginX, curY, contentWidth, 6, 'FD')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(15, 23, 42)
    doc.text(String(it.pontoZona || '—'), marginX + 3, curY + 4.2)
    doc.text(String(it.produto || 'Anual Firme'), marginX + 95, curY + 4.2)
    doc.setFont('helvetica', 'bold')
    doc.text(
      `${Number(it.capacidade || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1 })} mil m³/dia`,
      marginX + 140,
      curY + 4.2,
    )
    curY += 6
  })

  curY += 4

  // 5. Declarações e Validade
  verificarQuebra(45)
  desenharSecao('5', 'Declarações e Condições Regulatórias')

  const declaracoes = [
    '1. Declara que a presente Manifestação de Interesse é feita por Carregador Habilitado nos termos da regulamentação ANP.',
    '2. Declara que preencherá os campos obrigatórios de Solicitação de Capacidade no POC da TSB.',
    '3. Declara estar ciente e de acordo com as regras do Contrato Master e cronograma do Processo de Oferta de Capacidade Anual.',
    '4. Declara que a Capacidade Solicitada é superior a zero e que o signatário possui poderes de representação formal.',
  ]

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...cinzaBorda)
  doc.setLineWidth(0.2)
  doc.roundedRect(marginX, curY, contentWidth, 22, 1.5, 1.5, 'FD')

  let decY = curY + 3.8
  declaracoes.forEach((dec) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.8)
    doc.setTextColor(30, 41, 59)
    doc.text(dec, marginX + 3, decY)
    decY += 4.5
  })

  curY += 26

  // Espaço de Data e Assinatura
  verificarQuebra(32)
  const dataHoje = dados.dataDocumento || new Date().toLocaleDateString('pt-BR')
  const localStr = dados.local || 'Porto Alegre / RS'

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...cinzaTexto)
  doc.text(`Local e Data: ${localStr}, ${dataHoje}`, marginX + 2, curY + 8)

  const assinaX = marginX + contentWidth - 85
  doc.setDrawColor(100, 116, 139)
  doc.setLineWidth(0.3)
  doc.line(assinaX, curY + 8, assinaX + 80, curY + 8)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(...azulEscuro)
  doc.text(dados.repNome || 'Representante Autorizado', assinaX + 40, curY + 12, {
    align: 'center',
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.8)
  doc.setTextColor(...cinzaTexto)
  doc.text('Assinatura Eletrônica do Representante Autorizado', assinaX + 40, curY + 15, {
    align: 'center',
  })
  doc.text(
    '(Certificado Digital ICP-Brasil, Gov.br ou Assinatura Eletrônica Qualificada)',
    assinaX + 40,
    curY + 18,
    { align: 'center' },
  )

  // Rodapé em todas as páginas
  const totalPages = (doc.internal.pages?.length || 2) - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.8)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `TSB — Processo de Oferta e Contratação de Capacidade Anual (POC) • Manifestação de Interesse • ${dataHoje}`,
      marginX,
      pageHeight - 7,
    )
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, pageHeight - 7, {
      align: 'right',
    })
  }

  const blob = doc.output('blob')
  const nomeArquivo = `Manifestacao-Interesse-POC-${dados.protocolo || '2025-0001'}.pdf`
  doc.save(nomeArquivo)

  return blob
}
