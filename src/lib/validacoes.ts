/**
 * Utilitários de validação e sanitização para formulários regulatórios (ANP / Inciso VII).
 */

/**
 * Valida o Cadastro Nacional da Pessoa Jurídica (CNPJ) através dos dígitos verificadores (módulo 11).
 * Rejeita sequências de dígitos repetidos (ex.: 00000000000000) e comprimentos divergentes de 14 dígitos.
 */
export function validarCNPJ(cnpj: string): boolean {
  if (!cnpj) return false

  // Remove caracteres não numéricos
  const limpo = cnpj.replace(/\D/g, '')

  // Deve ter exatamente 14 dígitos
  if (limpo.length !== 14) return false

  // Rejeita sequências repetidas (ex: 00.000.000/0000-00, 11.111.111/1111-11, etc.)
  if (/^(\d)\1{13}$/.test(limpo)) return false

  // Cálculo do 1º dígito verificador
  let tamanho = limpo.length - 2
  let numeros = limpo.substring(0, tamanho)
  const digitos = limpo.substring(tamanho)
  let soma = 0
  let pos = tamanho - 7

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--
    if (pos < 2) pos = 9
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(0), 10)) return false

  // Cálculo do 2º dígito verificador
  tamanho = tamanho + 1
  numeros = limpo.substring(0, tamanho)
  soma = 0
  pos = tamanho - 7

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--
    if (pos < 2) pos = 9
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(1), 10)) return false

  return true
}

/**
 * Valida formato de e-mail corporativo segundo padrão RFC simplificado.
 */
export function validarEmail(email: string): boolean {
  if (!email) return false
  const limpo = email.trim().toLowerCase()
  if (limpo.length > 254) return false
  const regex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  return regex.test(limpo)
}

/**
 * Valida se o arquivo anexado é estritamente PDF e respeita o tamanho máximo permitido.
 * @param arquivo Arquivo enviado pelo usuário
 * @param maxMegaBytes Tamanho máximo em Megabytes (padrão 10 MB)
 */
export function validarArquivoPdf(
  arquivo: File | null | undefined,
  maxMegaBytes: number = 10,
): { valido: boolean; erro?: string } {
  if (!arquivo) {
    return { valido: true } // Anexo é opcional, mas se existir deve ser validado
  }

  // Verifica extensão do arquivo
  const nomeLower = arquivo.name.toLowerCase()
  if (!nomeLower.endsWith('.pdf')) {
    return {
      valido: false,
      erro: 'O arquivo deve ser obrigatoriamente um documento no formato PDF (.pdf).',
    }
  }

  // Verifica mimeType se fornecido pelo browser
  if (arquivo.type && arquivo.type !== 'application/pdf' && arquivo.type !== 'application/x-pdf') {
    return {
      valido: false,
      erro: 'O tipo MIME do arquivo não é um PDF válido (esperado application/pdf).',
    }
  }

  // Verifica tamanho máximo
  const maxBytes = maxMegaBytes * 1024 * 1024
  if (arquivo.size > maxBytes) {
    const tamanhoAtualMb = (arquivo.size / (1024 * 1024)).toFixed(2)
    return {
      valido: false,
      erro: `O arquivo excede o limite máximo permitido de ${maxMegaBytes} MB (arquivo atual: ${tamanhoAtualMb} MB).`,
    }
  }

  if (arquivo.size === 0) {
    return {
      valido: false,
      erro: 'O arquivo anexado está vazio (0 bytes). Por favor selecione um PDF válido.',
    }
  }

  return { valido: true }
}
