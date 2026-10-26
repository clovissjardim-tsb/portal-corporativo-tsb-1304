import { jsPDF } from 'jspdf'
import logoTsb from '@/assets/image-ee90b.png'

export type CriterioLeilaoTipo = 'parcialmente' | 'minima' | 'totalmente'

export interface DadosPropostaGarantidaPdf {
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

  // Representante Legal
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

  // Seção 2. Informações para Contato
  contatoNome: string
  contatoTelefone: string
  contatoEmail: string
  contatoEndereco: string

  // Seção 3. Dados da Proposta (Individual por produto/zona)
  produto: string
  pontoZona: string
  capacidadeSolicitada: number | string // mil m³/dia
  tarifaTransporte: number | string // R$ por MMBtu
  criterioLeilao: CriterioLeilaoTipo
  capacidadeMinima?: number | string // mil m³/dia se criterio for 'minima'

  // Garantia Financeira
  garantiaTipo?: string
  garantiaValor?: number | string
  garantiaInstituicao?: string
  garantiaArquivoNome?: string

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
 * Gera e realiza o download do PDF oficial da Proposta Garantida (vinculante),
 * espelhando com precisão o modelo oficial do Processo de Oferta e Contratação de Capacidade Anual (POC).
 */
export async function gerarPropostaGarantidaPdf(dados: DadosPropostaGarantidaPdf): Promise<Blob> {
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
  const vermelhoTsb: [number, number, number] = [220, 38, 38] // aviso vinculante
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
    'Resolução ANP nº 961/2023 · Art. 37-A, § 5º, III — Proposta Garantida Vinculante',
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
  doc.text('PROPOSTA GARANTIDA VINCULANTE (ETAPA III)', marginX + contentWidth / 2, curY + 5.3, {
    align: 'center',
  })

  curY += 11

  // Alerta de Compromisso Irrevogável & Garantia Financeira
  doc.setFillColor(254, 242, 242)
  doc.setDrawColor(254, 202, 202)
  doc.setLineWidth(0.2)
  doc.roundedRect(marginX, curY, contentWidth, 10, 1.5, 1.5, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...vermelhoTsb)
  doc.text('CARÁTER VINCULANTE & APORTE DE GARANTIA FINANCEIRA:', marginX + 3, curY + 3.8)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(15, 23, 42)
  doc.text(
    'A submissão desta Proposta constitui compromisso irrevogável e irretratável de celebrar Contrato de Transporte. A desistência ou descumprimento enseja a execução integral da Garantia Financeira.',
    marginX + 3,
    curY + 7.5,
  )

  curY += 13

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
  desenharSecao('1', 'Identificação do Carregador Habilitado e Representante Legal')

  const col2 = (contentWidth - 4) / 2
  desenharCampo('RAZÃO SOCIAL DO CARREGADOR', dados.razaoSocial, marginX, curY, col2)
  desenharCampo('CNPJ / MF', dados.cnpj, marginX + col2 + 4, curY, col2)
  curY += 9.5

  desenharCampo('SEDE / ENDEREÇO', dados.sedeEndereco, marginX, curY, col2 + 30)
  desenharCampo('INSCRIÇÃO ESTADUAL', dados.inscricaoEstadual, marginX + col2 + 34, curY, col2 - 30)
  curY += 9.5

  const col3 = (contentWidth - 6) / 3
  desenharCampo('ATIVIDADE PRINCIPAL', dados.atividadePrincipal, marginX, curY, col3)
  desenharCampo('CÓDIGO CNAE', dados.codigoCnae, marginX + col3 + 3, curY, col3)
  desenharCampo('AUTORIZAÇÃO ANP Nº', dados.autorizacaoAnp, marginX + (col3 + 3) * 2, curY, col3)
  curY += 9.5

  if (dados.atividadeSecundariaCnae) {
    desenharCampo(
      'ATIVIDADE SECUNDÁRIA E CNAE',
      dados.atividadeSecundariaCnae,
      marginX,
      curY,
      contentWidth,
    )
    curY += 9.5
  }

  desenharCampo('SÍTIO ELETRÔNICO CORPORATIVO', dados.sitioEletronico, marginX, curY, col2)
  desenharCampo('TELEFONE CORPORATIVO', dados.telefone, marginX + col2 + 4, curY, col2)
  curY += 10.5

  // Representante Legal
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...azulEscuro)
  doc.text('Dados Pessoais do Representante Legal (Signatário Vinculante):', marginX, curY - 0.5)
  curY += 3.5

  desenharCampo('NOME COMPLETO DO REPRESENTANTE LEGAL', dados.repNome, marginX, curY, col2)
  desenharCampo('CPF / MF', dados.repCpf, marginX + col2 + 4, curY, col2)
  curY += 9.5

  desenharCampo('NACIONALIDADE', dados.repNacionalidade, marginX, curY, col3)
  desenharCampo('ESTADO CIVIL', dados.repEstadoCivil, marginX + col3 + 3, curY, col3)
  desenharCampo('DATA DE NASCIMENTO', dados.repDataNascimento, marginX + (col3 + 3) * 2, curY, col3)
  curY += 9.5

  desenharCampo('PROFISSÃO', dados.repProfissao, marginX, curY, col3)
  desenharCampo('CARGO / FUNÇÃO', dados.repCargo, marginX + col3 + 3, curY, col3)
  desenharCampo(
    'CREDENCIAMENTO PROFISSIONAL',
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

  desenharCampo('ENDEREÇO DE DOMICÍLIO', dados.repEndereco, marginX, curY, contentWidth)
  curY += 11

  // 2. Informações para Contato
  desenharSecao('2', 'Informações para Contato')
  desenharCampo('NOME DO CONTATO', dados.contatoNome, marginX, curY, col2)
  desenharCampo('TELEFONE(S)', dados.contatoTelefone, marginX + col2 + 4, curY, col2)
  curY += 9.5

  desenharCampo('E-MAIL DE CONTATO', dados.contatoEmail, marginX, curY, col2)
  desenharCampo('ENDEREÇO COMERCIAL', dados.contatoEndereco, marginX + col2 + 4, curY, col2)
  curY += 11

  // 3. Dados da Proposta (Individual por Produto e Zona)
  verificarQuebra(40)
  desenharSecao('3', 'Dados da Proposta de Contratação de Capacidade (Individual)')

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(5.8)
  doc.setTextColor(71, 85, 105)
  doc.text(
    '* A Proposta Garantida é apresentada individualmente, associada a uma única Zona de Saída ou Ponto de Entrada e a um único Produto Anual.',
    marginX,
    curY,
  )
  curY += 4

  desenharCampo('PRODUTO ANUAL ASSOCIADO', dados.produto, marginX, curY, col2)
  desenharCampo(
    'ZONA DE SAÍDA OU PONTO DE ENTRADA',
    dados.pontoZona,
    marginX + col2 + 4,
    curY,
    col2,
  )
  curY += 9.5

  const capStr = dados.capacidadeSolicitada
    ? `${Number(dados.capacidadeSolicitada).toLocaleString('pt-BR', { minimumFractionDigits: 1 })} mil m³/dia`
    : '—'
  const tarStr = dados.tarifaTransporte
    ? `R$ ${Number(dados.tarifaTransporte).toLocaleString('pt-BR', { minimumFractionDigits: 4 })} por MMBtu`
    : '—'

  desenharCampo('CAPACIDADE SOLICITADA (mil m³/dia)', capStr, marginX, curY, col2)
  desenharCampo(
    'TARIFA DE TRANSPORTE ASSOCIADA (R$ por MMBtu)',
    tarStr,
    marginX + col2 + 4,
    curY,
    col2,
  )
  curY += 9.5

  // Nota de vigência e reajuste
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(...cinzaBorda)
  doc.setLineWidth(0.2)
  doc.roundedRect(marginX, curY, contentWidth, 10, 1, 1, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.setTextColor(...azulEscuro)
  doc.text('Vigência e Reajuste da Tarifa:', marginX + 3, curY + 3.8)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.8)
  doc.setTextColor(30, 41, 59)
  doc.text(
    'A Proposta Garantida é válida da data de sua assinatura pela TSB até o cumprimento do compromisso assumido pelo Carregador (assinatura do Contrato de Transporte). A Tarifa será reajustada nos termos do Contrato Master.',
    marginX + 3,
    curY + 7.5,
  )
  curY += 12

  // Critério de validade em caso de Leilão de Preço Ascendente
  verificarQuebra(28)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.2)
  doc.setTextColor(...azulEscuro)
  doc.text(
    'Critério de Validade em caso de Leilão de Preço Ascendente (assinalada 1 das alternativas):',
    marginX,
    curY,
  )
  curY += 3.5

  const opcoesLeilao = [
    {
      tipo: 'parcialmente',
      texto: 'É válida caso a Capacidade Solicitada seja atendida parcialmente.',
    },
    {
      tipo: 'minima',
      texto: `É válida apenas se houver atendimento à Capacidade Solicitada mínima de ${dados.capacidadeMinima || '___'} mil m³/dia.`,
    },
    {
      tipo: 'totalmente',
      texto: 'É válida apenas caso a Capacidade Solicitada seja totalmente atendida.',
    },
  ]

  opcoesLeilao.forEach((op) => {
    const selecionado = dados.criterioLeilao === op.tipo
    doc.setDrawColor(...cinzaBorda)
    doc.setFillColor(selecionado ? 2 : 255, selecionado ? 132 : 255, selecionado ? 199 : 255)
    doc.circle(marginX + 3, curY + 1.8, 1.8, selecionado ? 'FD' : 'D')

    doc.setFont('helvetica', selecionado ? 'bold' : 'normal')
    doc.setFontSize(6)
    doc.setTextColor(selecionado ? 10 : 71, selecionado ? 37 : 85, selecionado ? 64 : 105)
    doc.text(op.texto, marginX + 8, curY + 2.5)
    curY += 4.5
  })

  curY += 2

  // 4. Garantia Financeira
  verificarQuebra(22)
  desenharSecao('4', 'Comprovante da Garantia Financeira da Proposta')

  const valGarStr = dados.garantiaValor
    ? `R$ ${Number(dados.garantiaValor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : '—'

  desenharCampo(
    'MODALIDADE DA GARANTIA',
    dados.garantiaTipo || 'Fiança Bancária / Seguro Garantia',
    marginX,
    curY,
    col3,
  )
  desenharCampo('VALOR DA GARANTIA', valGarStr, marginX + col3 + 3, curY, col3)
  desenharCampo(
    'INSTITUIÇÃO EMISSORA',
    dados.garantiaInstituicao || 'Banco / Seguradora',
    marginX + (col3 + 3) * 2,
    curY,
    col3,
  )
  curY += 9.5

  desenharCampo(
    'ARQUIVO DO COMPROVANTE ANEXADO',
    dados.garantiaArquivoNome || 'Comprovante emitido nos termos do item 3.3 do Anexo 1-B',
    marginX,
    curY,
    contentWidth,
  )
  curY += 11

  // 5. Declarações Vinculantes
  verificarQuebra(40)
  desenharSecao('5', 'Declarações e Obrigações Irrevogáveis do Carregador Vencedor')

  const declaracoes = [
    '1. Caso a presente Proposta Garantida seja a vencedora, o Carregador compromete-se, de forma irrevogável e irretratável, a celebrar Contrato de Transporte com a TSB nas condições do POC Anual.',
    '2. Caso o Carregador desista do POC Anual após a submissão desta Proposta ou descumpra o disposto neste documento, a Garantia Financeira será executada integralmente.',
    '3. Caso o Carregador Vencedor não assine o Contrato de Transporte no prazo estipulado no Cronograma, a Garantia Financeira será executada.',
    '4. Declara estar plenamente ciente e de acordo com todas as regras do Contrato Master e da Resolução ANP nº 961/2023.',
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
  doc.text(dados.repNome || 'Representante Legal do Carregador', assinaX + 40, curY + 12, {
    align: 'center',
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.8)
  doc.setTextColor(...cinzaTexto)
  doc.text('Assinatura Eletrônica do Representante Legal', assinaX + 40, curY + 15, {
    align: 'center',
  })
  doc.text(
    '(Certificado Digital ICP-Brasil, Gov.br ou Assinatura Qualificada)',
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
      `TSB — Processo de Oferta e Contratação de Capacidade Anual (POC) • Proposta Garantida • ${dataHoje}`,
      marginX,
      pageHeight - 7,
    )
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, pageHeight - 7, {
      align: 'right',
    })
  }

  const blob = doc.output('blob')
  const nomeArquivo = `Proposta-Garantida-POC-${dados.protocolo || '2025-0001'}.pdf`
  doc.save(nomeArquivo)

  return blob
}
