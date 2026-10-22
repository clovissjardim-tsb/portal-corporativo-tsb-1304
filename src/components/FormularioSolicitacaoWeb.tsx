import React, { useState } from 'react'
import {
  Send,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  AlertCircle,
  HelpCircle,
  Search,
  UploadCloud,
  FileCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  solicitacoesService,
  type ModalidadeSolicitacao,
  type NovaSolicitacaoWebInput,
} from '@/services/solicitacoes'
import { validarCNPJ, validarEmail, validarArquivoPdf } from '@/lib/validacoes'

interface FormularioSolicitacaoWebProps {
  onSucessoProtocolo?: (protocolo: string) => void
  onIrParaConsulta?: (protocolo: string) => void
}

export function FormularioSolicitacaoWeb({
  onSucessoProtocolo,
  onIrParaConsulta,
}: FormularioSolicitacaoWebProps) {
  // Estado do formulário
  const [razaoSocial, setRazaoSocial] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [endereco, setEndereco] = useState('')
  const [representanteLegal, setRepresentanteLegal] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [modalidade, setModalidade] = useState<ModalidadeSolicitacao>('Firme Ordinário')
  const [trecho, setTrecho] = useState('Trecho 1 (Gasoduto Uruguaiana)')
  const [pontoRecebimento, setPontoRecebimento] = useState(
    'Paso de Los Libres (Fronteira Brasil/Argentina)',
  )
  const [pontoEntrega, setPontoEntrega] = useState('Triunfo (Polo Petroquímico)')
  const [capacidade, setCapacidade] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [prazoVigencia, setPrazoVigencia] = useState('')

  // Campos específicos de Swap / Troca Operacional (Art. 10, §1º)
  const [swapCedenteNome, setSwapCedenteNome] = useState('')
  const [swapReceptorNome, setSwapReceptorNome] = useState('')
  const [swapOrigem, setSwapOrigem] = useState('')
  const [swapDestino, setSwapDestino] = useState('')
  const [swapVolumeCedente, setSwapVolumeCedente] = useState('')
  const [swapVolumeReceptor, setSwapVolumeReceptor] = useState('')
  const [garantiasSwap, setGarantiasSwap] = useState('')

  // Anexo e observações
  const [arquivoPdf, setArquivoPdf] = useState<File | null>(null)
  const [observacoes, setObservacoes] = useState('')

  // Honeypot anti-bot (campo invisível via CSS para humanos, atraente para robôs de spam)
  const [websiteUrlHoneypot, setWebsiteUrlHoneypot] = useState('')

  // Estados de submissão e feedback
  const [submetendo, setSubmetendo] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [protocoloGerado, setProtocoloGerado] = useState<string | null>(null)
  const [emailConfirmado, setEmailConfirmado] = useState<string>('')
  const [copiado, setCopiado] = useState(false)

  // Máscara amigável de CNPJ
  const aplicarMascaraCnpj = (valor: string) => {
    const apenasDigitos = valor.replace(/\D/g, '').slice(0, 14)
    if (apenasDigitos.length <= 2) return apenasDigitos
    if (apenasDigitos.length <= 5) return `${apenasDigitos.slice(0, 2)}.${apenasDigitos.slice(2)}`
    if (apenasDigitos.length <= 8)
      return `${apenasDigitos.slice(0, 2)}.${apenasDigitos.slice(2, 5)}.${apenasDigitos.slice(5)}`
    if (apenasDigitos.length <= 12)
      return `${apenasDigitos.slice(0, 2)}.${apenasDigitos.slice(2, 5)}.${apenasDigitos.slice(5, 8)}/${apenasDigitos.slice(8)}`
    return `${apenasDigitos.slice(0, 2)}.${apenasDigitos.slice(2, 5)}.${apenasDigitos.slice(5, 8)}/${apenasDigitos.slice(8, 12)}-${apenasDigitos.slice(12)}`
  }

  const validarCampos = (): boolean => {
    const novosErros: Record<string, string> = {}

    if (!razaoSocial.trim() || razaoSocial.trim().length < 2) {
      novosErros.razaoSocial = 'A Razão Social da empresa solicitante é obrigatória (Art. 10, I).'
    }

    const cnpjLimpo = cnpj.replace(/\D/g, '')
    if (!cnpjLimpo || cnpjLimpo.length !== 14) {
      novosErros.cnpj = 'Informe um CNPJ válido com 14 dígitos.'
    } else if (!validarCNPJ(cnpj)) {
      novosErros.cnpj =
        'CNPJ inválido (dígitos verificadores incorretos). Verifique a numeração oficial.'
    }

    if (!representanteLegal.trim() || representanteLegal.trim().length < 2) {
      novosErros.representanteLegal =
        'Nome do representante legal ou procurador é obrigatório (Art. 10, I).'
    }

    const emailLimpo = email.trim()
    if (!emailLimpo || !validarEmail(emailLimpo)) {
      novosErros.email =
        'Informe um endereço de e-mail corporativo válido para recebimento do protocolo.'
    }

    if (!telefone.trim() || telefone.trim().length < 8) {
      novosErros.telefone = 'Informe um telefone de contato com DDD.'
    }

    const capNum = parseFloat(capacidade.replace(',', '.'))
    if (!capacidade || isNaN(capNum) || capNum <= 0) {
      novosErros.capacidade = 'Informe a quantidade diária pretendida (maior que zero).'
    }

    if (!dataInicio.trim()) {
      novosErros.dataInicio = 'Data pretendida de início é obrigatória.'
    }

    if (!prazoVigencia.trim()) {
      novosErros.prazoVigencia = 'Prazo de vigência pretendido é obrigatório.'
    }

    if (modalidade === 'Troca Operacional') {
      if (!swapCedenteNome.trim() && !swapReceptorNome.trim()) {
        novosErros.swapPartes = 'Informe os agentes participantes da troca (cedente e receptor).'
      }
      if (!garantiasSwap.trim() || garantiasSwap.trim().length < 5) {
        novosErros.garantiasSwap =
          'Para Swap, informe as garantias de segurança e confiabilidade operacional (Art. 10, §1º).'
      }
    }

    // Validação do arquivo PDF (se anexado: apenas PDF e no máximo 10 MB)
    if (arquivoPdf) {
      const validacaoPdf = validarArquivoPdf(arquivoPdf, 10)
      if (!validacaoPdf.valido) {
        novosErros.arquivoPdf = validacaoPdf.erro || 'Arquivo de anexo inválido.'
      }
    }

    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroGeral(null)

    if (!validarCampos()) {
      setErroGeral('Por favor, preencha os campos obrigatórios destacados abaixo.')
      return
    }

    setSubmetendo(true)

    const capNum = parseFloat(capacidade.replace(',', '.'))
    const volCedNum = swapVolumeCedente
      ? parseFloat(swapVolumeCedente.replace(',', '.'))
      : undefined
    const volRecNum = swapVolumeReceptor
      ? parseFloat(swapVolumeReceptor.replace(',', '.'))
      : undefined

    const payload: NovaSolicitacaoWebInput = {
      razao_social: razaoSocial.trim(),
      cnpj: cnpj.trim(),
      endereco: endereco.trim() || undefined,
      representante_legal: representanteLegal.trim(),
      email: email.trim().toLowerCase(),
      telefone: telefone.trim(),
      modalidade,
      trecho: trecho.trim(),
      ponto_recebimento: pontoRecebimento.trim(),
      ponto_entrega: pontoEntrega.trim(),
      capacidade: capNum,
      data_inicio: dataInicio.trim(),
      prazo_vigencia: prazoVigencia.trim(),
      swap_cedente_nome: swapCedenteNome.trim() || undefined,
      swap_receptor_nome: swapReceptorNome.trim() || undefined,
      swap_origem: swapOrigem.trim() || undefined,
      swap_destino: swapDestino.trim() || undefined,
      swap_volume_cedente: volCedNum,
      swap_volume_receptor: volRecNum,
      garantias_seguranca_swap: garantiasSwap.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
      arquivo_formulario: arquivoPdf,
      website_url: websiteUrlHoneypot,
    }

    try {
      const { protocolo } = await solicitacoesService.submeterWeb(payload)
      setProtocoloGerado(protocolo)
      setEmailConfirmado(payload.email)
      if (onSucessoProtocolo) {
        onSucessoProtocolo(protocolo)
      }
    } catch (err: unknown) {
      console.error('[Inciso VII Web] Erro ao submeter solicitação:', err)
      const msg =
        err instanceof Error
          ? err.message
          : 'Não foi possível registrar sua solicitação no momento. Tente novamente ou use a via alternativa por e-mail.'
      setErroGeral(msg)
    } finally {
      setSubmetendo(false)
    }
  }

  const handleCopiarProtocolo = async () => {
    if (!protocoloGerado) return
    try {
      await navigator.clipboard.writeText(protocoloGerado)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      // Fallback
    }
  }

  const handleNovaSolicitacao = () => {
    setProtocoloGerado(null)
    setRazaoSocial('')
    setCnpj('')
    setEndereco('')
    setRepresentanteLegal('')
    setEmail('')
    setTelefone('')
    setCapacidade('')
    setDataInicio('')
    setPrazoVigencia('')
    setSwapCedenteNome('')
    setSwapReceptorNome('')
    setSwapOrigem('')
    setSwapDestino('')
    setSwapVolumeCedente('')
    setSwapVolumeReceptor('')
    setGarantiasSwap('')
    setArquivoPdf(null)
    setWebsiteUrlHoneypot('')
    setObservacoes('')
    setErros({})
    setErroGeral(null)
  }

  // TELA DE PROTOCOLO IMEDIATO APÓS SUBMISSÃO COM SUCESSO
  if (protocoloGerado) {
    return (
      <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-xl shadow-xs space-y-6 animate-fade-in">
        <div className="flex items-start gap-3 pb-5 border-b border-slate-200">
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider font-display">
              Submissão Formal Concluída • Art. 10 da Res. ANP nº 11/2016
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#0a2540] font-display">
              Solicitação de Acesso Protocolada com Sucesso
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Sua manifestação foi autuada eletronicamente nos sistemas da TSB e o prazo legal de{' '}
              <strong>20 dias úteis</strong> para emissão do parecer técnico-regulatório
              fundamentado já está em contagem.
            </p>
          </div>
        </div>

        {/* CARD COM NÚMERO DE PROTOCOLO EM DESTAQUE */}
        <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-display block">
                Número do Protocolo Oficial TSB
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-bold text-[#0a2540] tracking-wide">
                {protocoloGerado}
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopiarProtocolo}
              className="border-slate-300 text-slate-700 hover:bg-white text-xs font-semibold h-9 px-4 shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copiado ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Protocolo Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-600" />
                  <span>Copiar Protocolo</span>
                </>
              )}
            </Button>
          </div>

          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Comprovante de envio:</span>
              <span className="font-semibold text-slate-800 break-all font-mono">
                {emailConfirmado}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Status inicial:</span>
              <span className="font-semibold text-emerald-800">
                Solicitação Recebida - Em Análise Técnica
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Prazo regulatório (SLA):</span>
              <span className="font-semibold text-slate-800">
                20 dias úteis (Art. 10, Res. 11/2016)
              </span>
            </div>
          </div>
        </div>

        {/* INSTRUÇÕES E PRÓXIMOS PASSOS */}
        <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-lg text-xs space-y-2 text-slate-700">
          <div className="flex items-center gap-2 font-bold text-[#0a2540]">
            <FileText className="h-4 w-4 text-[#0284c7]" />
            <span>Comprovante Formal Enviado por E-mail</span>
          </div>
          <p className="leading-relaxed">
            Uma cópia completa com o resumo técnico da solicitação, número do protocolo e cronograma
            de análise foi disparada para <strong>{emailConfirmado}</strong> via servidor
            corporativo TSB. Caso não localize na caixa principal em alguns minutos, verifique sua
            pasta de spam.
          </p>
          <p className="leading-relaxed text-slate-600">
            Acompanhe o andamento regulatório a qualquer momento informando o número do protocolo na
            seção <strong>&quot;Consulta Pública de Protocolo e SLA&quot;</strong> logo abaixo nesta
            mesma página.
          </p>
        </div>

        {/* AÇÕES */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {onIrParaConsulta && (
            <Button
              type="button"
              onClick={() => onIrParaConsulta(protocoloGerado)}
              className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-semibold px-4 py-2 cursor-pointer flex items-center gap-2"
            >
              <Search className="h-3.5 w-3.5 text-slate-300" />
              <span>Consultar Andamento do Protocolo</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={handleNovaSolicitacao}
            className="text-xs text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            Submeter Outra Solicitação
          </Button>
        </div>
      </div>
    )
  }

  // FORMULÁRIO ONLINE DO INCISO VII (ESTILO SÓBRIO DO PORTAL)
  return (
    <div className="p-6 sm:p-7 bg-white border border-slate-200 rounded-xl shadow-xs space-y-6">
      {/* CABEÇALHO DO BLOCO */}
      <div className="pb-5 border-b border-slate-200 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0a2540] text-white uppercase tracking-wider font-display">
            Inciso VII • Submissão Online
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            Resolução ANP nº 11/2016 • Art. 9º, VII • Art. 10
          </span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-[#0a2540] font-display">
          Solicitação de Acesso à Capacidade de Transporte Online
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
          Preencha o formulário eletrônico abaixo com os dados cadastrais da empresa e as
          especificações técnicas do serviço requisitado (serviço firme, interruptível ou troca
          operacional swap). Ao enviar, você receberá <strong>imediatamente na tela</strong> e por
          e-mail o seu número oficial de protocolo com contagem do SLA de 20 dias úteis.
        </p>
      </div>

      {erroGeral && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800 animate-fade-in">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <span>{erroGeral}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* HONEYPOT ANTI-BOT: Campo oculto visualmente via CSS absoluto (não type="hidden") */}
        {/* Bots automatizados preenchem este campo, fazendo a requisição ser descartada com simulação de sucesso */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            opacity: 0,
            pointerEvents: 'none',
          }}
          tabIndex={-1}
        >
          <label htmlFor="website_url_hp">Por favor, deixe este campo em branco</label>
          <input
            id="website_url_hp"
            type="text"
            name="website_url"
            value={websiteUrlHoneypot}
            onChange={(e) => setWebsiteUrlHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* SEÇÃO 1: DADOS CADASTRAIS DA SOLICITANTE */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-[#0a2540] uppercase tracking-wider font-display">
              1. Identificação da Empresa Solicitante (Art. 10, I)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="webRazaoSocial" className="text-xs font-semibold text-slate-700">
                Razão Social *
              </Label>
              <Input
                id="webRazaoSocial"
                placeholder="Nome empresarial conforme cartão CNPJ"
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                className={`text-xs bg-white ${erros.razaoSocial ? 'border-red-400 focus:ring-red-400' : ''}`}
                disabled={submetendo}
              />
              {erros.razaoSocial && (
                <span className="text-[11px] text-red-600 block">{erros.razaoSocial}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="webCnpj" className="text-xs font-semibold text-slate-700">
                CNPJ *
              </Label>
              <Input
                id="webCnpj"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(e) => setCnpj(aplicarMascaraCnpj(e.target.value))}
                className={`text-xs font-mono bg-white ${erros.cnpj ? 'border-red-400 focus:ring-red-400' : ''}`}
                disabled={submetendo}
              />
              {erros.cnpj && <span className="text-[11px] text-red-600 block">{erros.cnpj}</span>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="webEndereco" className="text-xs font-semibold text-slate-700">
              Endereço da Sede / Município / UF
            </Label>
            <Input
              id="webEndereco"
              placeholder="Logradouro, número, complemento, bairro, cidade - UF, CEP"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="text-xs bg-white"
              disabled={submetendo}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="webRepresentanteLegal"
                className="text-xs font-semibold text-slate-700"
              >
                Representante Legal / Procurador *
              </Label>
              <Input
                id="webRepresentanteLegal"
                placeholder="Nome completo do signatário"
                value={representanteLegal}
                onChange={(e) => setRepresentanteLegal(e.target.value)}
                className={`text-xs bg-white ${erros.representanteLegal ? 'border-red-400' : ''}`}
                disabled={submetendo}
              />
              {erros.representanteLegal && (
                <span className="text-[11px] text-red-600 block">{erros.representanteLegal}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="webEmail" className="text-xs font-semibold text-slate-700">
                E-mail de Contato *
              </Label>
              <Input
                id="webEmail"
                type="email"
                placeholder="contato@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`text-xs bg-white font-mono ${erros.email ? 'border-red-400' : ''}`}
                disabled={submetendo}
              />
              {erros.email && <span className="text-[11px] text-red-600 block">{erros.email}</span>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="webTelefone" className="text-xs font-semibold text-slate-700">
                Telefone Corporativo *
              </Label>
              <Input
                id="webTelefone"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className={`text-xs bg-white ${erros.telefone ? 'border-red-400' : ''}`}
                disabled={submetendo}
              />
              {erros.telefone && (
                <span className="text-[11px] text-red-600 block">{erros.telefone}</span>
              )}
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: DADOS TÉCNICOS DA SOLICITAÇÃO */}
        <div className="space-y-4 pt-2">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-[#0a2540] uppercase tracking-wider font-display">
              2. Especificações do Serviço Requisitado (Art. 10, II e IV)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="webModalidade" className="text-xs font-semibold text-slate-700">
                Tipo / Modalidade de Serviço *
              </Label>
              <select
                id="webModalidade"
                value={modalidade}
                onChange={(e) => setModalidade(e.target.value as ModalidadeSolicitacao)}
                className="w-full h-9 px-3 rounded-md border border-slate-300 text-xs bg-white text-slate-800 font-medium focus:border-[#0284c7] focus:outline-hidden"
                disabled={submetendo}
              >
                <option value="Firme Ordinário">Firme Ordinário</option>
                <option value="Interruptível">Interruptível</option>
                <option value="Troca Operacional">Troca Operacional (Swap)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="webTrecho" className="text-xs font-semibold text-slate-700">
                Instalação / Trecho da Malha Dutoviária *
              </Label>
              <select
                id="webTrecho"
                value={trecho}
                onChange={(e) => setTrecho(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-slate-300 text-xs bg-white text-slate-800 font-medium focus:border-[#0284c7] focus:outline-hidden"
                disabled={submetendo}
              >
                <option value="Trecho 1 (Gasoduto Uruguaiana)">
                  Trecho 1 (Gasoduto Uruguaiana - 24&quot;)
                </option>
                <option value="Trecho 3 (Gasoduto Triunfo)">
                  Trecho 3 (Gasoduto Triunfo - 18&quot;)
                </option>
                <option value="Uruguaiana -> Triunfo (Sistema Completo)">
                  Uruguaiana -&gt; Triunfo (Sistema Completo TSB)
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="webPontoRec" className="text-xs font-semibold text-slate-700">
                Ponto de Recebimento (Injeção) *
              </Label>
              <select
                id="webPontoRec"
                value={pontoRecebimento}
                onChange={(e) => setPontoRecebimento(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-slate-300 text-xs bg-white text-slate-800 focus:border-[#0284c7] focus:outline-hidden"
                disabled={submetendo}
              >
                <option value="Paso de Los Libres (Fronteira Brasil/Argentina)">
                  Paso de Los Libres (Fronteira Brasil/Argentina)
                </option>
                <option value="Canoas (Interconexão TBG)">Canoas (Interconexão TBG)</option>
                <option value="EMED Uruguaiana">EMED Uruguaiana</option>
                <option value="EMED Triunfo">EMED Triunfo</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="webPontoEnt" className="text-xs font-semibold text-slate-700">
                Ponto de Entrega (Retirada) *
              </Label>
              <select
                id="webPontoEnt"
                value={pontoEntrega}
                onChange={(e) => setPontoEntrega(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-slate-300 text-xs bg-white text-slate-800 focus:border-[#0284c7] focus:outline-hidden"
                disabled={submetendo}
              >
                <option value="Triunfo (Polo Petroquímico)">Triunfo (Polo Petroquímico)</option>
                <option value="Uruguaiana (UTE Uruguaiana)">Uruguaiana (UTE Uruguaiana)</option>
                <option value="Canoas (Interconexão TBG)">Canoas (Interconexão TBG)</option>
                <option value="Paso de Los Libres">Paso de Los Libres</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="webCapacidade" className="text-xs font-semibold text-slate-700">
                Quantidade Diária (MM³/d ou m³/d) *
              </Label>
              <Input
                id="webCapacidade"
                type="number"
                step="any"
                min="0"
                placeholder="Ex: 150000 m³/dia ou 0.15 MM³/d"
                value={capacidade}
                onChange={(e) => setCapacidade(e.target.value)}
                className={`text-xs bg-white ${erros.capacidade ? 'border-red-400' : ''}`}
                disabled={submetendo}
              />
              {erros.capacidade && (
                <span className="text-[11px] text-red-600 block">{erros.capacidade}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="webDataInicio" className="text-xs font-semibold text-slate-700">
                Data Pretendida de Início *
              </Label>
              <Input
                id="webDataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className={`text-xs bg-white ${erros.dataInicio ? 'border-red-400' : ''}`}
                disabled={submetendo}
              />
              {erros.dataInicio && (
                <span className="text-[11px] text-red-600 block">{erros.dataInicio}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="webPrazoVigencia" className="text-xs font-semibold text-slate-700">
                Prazo de Vigência Pretendido *
              </Label>
              <Input
                id="webPrazoVigencia"
                placeholder="Ex: 12 meses, 5 anos ou até 31/12/2028"
                value={prazoVigencia}
                onChange={(e) => setPrazoVigencia(e.target.value)}
                className={`text-xs bg-white ${erros.prazoVigencia ? 'border-red-400' : ''}`}
                disabled={submetendo}
              />
              {erros.prazoVigencia && (
                <span className="text-[11px] text-red-600 block">{erros.prazoVigencia}</span>
              )}
            </div>
          </div>
        </div>

        {/* SEÇÃO ESPECÍFICA DE SWAP / TROCA OPERACIONAL */}
        {modalidade === 'Troca Operacional' && (
          <div className="p-4 sm:p-5 bg-purple-50/60 border border-purple-200 rounded-lg space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-purple-200/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-700 text-white uppercase tracking-wider font-display">
                  Troca Operacional (Swap)
                </span>
                <h4 className="text-xs font-bold text-purple-950 font-display">
                  Pares Cedente/Receptor e Garantias Operacionais (Art. 10, §1º)
                </h4>
              </div>
              <span className="text-[10px] text-purple-700">Exigência Regulatória ANP</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="swapCedente" className="text-[11px] font-semibold text-purple-950">
                  Carregador Cedente
                </Label>
                <Input
                  id="swapCedente"
                  placeholder="Razão Social do Carregador Cedente"
                  value={swapCedenteNome}
                  onChange={(e) => setSwapCedenteNome(e.target.value)}
                  className="bg-white text-xs h-8"
                  disabled={submetendo}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="swapReceptor" className="text-[11px] font-semibold text-purple-950">
                  Carregador Receptor
                </Label>
                <Input
                  id="swapReceptor"
                  placeholder="Razão Social do Carregador Receptor"
                  value={swapReceptorNome}
                  onChange={(e) => setSwapReceptorNome(e.target.value)}
                  className="bg-white text-xs h-8"
                  disabled={submetendo}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="swapOrigem" className="text-[11px] font-semibold text-purple-950">
                  Ponto de Origem Cedido
                </Label>
                <Input
                  id="swapOrigem"
                  placeholder="Ex: Ponto de Injeção Libres / Canoas"
                  value={swapOrigem}
                  onChange={(e) => setSwapOrigem(e.target.value)}
                  className="bg-white text-xs h-8"
                  disabled={submetendo}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="swapDestino" className="text-[11px] font-semibold text-purple-950">
                  Ponto de Destino Recebido
                </Label>
                <Input
                  id="swapDestino"
                  placeholder="Ex: Polo Petroquímico Triunfo"
                  value={swapDestino}
                  onChange={(e) => setSwapDestino(e.target.value)}
                  className="bg-white text-xs h-8"
                  disabled={submetendo}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="swapVolCed" className="text-[11px] font-semibold text-purple-950">
                  Volume Cedente (MM³/d ou m³/dia)
                </Label>
                <Input
                  id="swapVolCed"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Ex: 50000"
                  value={swapVolumeCedente}
                  onChange={(e) => setSwapVolumeCedente(e.target.value)}
                  className="bg-white text-xs h-8"
                  disabled={submetendo}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="swapVolRec" className="text-[11px] font-semibold text-purple-950">
                  Volume Receptor (MM³/d ou m³/dia)
                </Label>
                <Input
                  id="swapVolRec"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Ex: 50000"
                  value={swapVolumeReceptor}
                  onChange={(e) => setSwapVolumeReceptor(e.target.value)}
                  className="bg-white text-xs h-8"
                  disabled={submetendo}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="garantiasSwap" className="text-[11px] font-bold text-purple-950">
                Garantias de Segurança e Confiabilidade Operacional (Art. 10, §1º) *
              </Label>
              <Textarea
                id="garantiasSwap"
                rows={2}
                placeholder="Descreva o lastro físico, garantias contratuais de suprimento nos pontos de injeção e procedimentos em caso de desbalanceamento..."
                value={garantiasSwap}
                onChange={(e) => setGarantiasSwap(e.target.value)}
                className={`bg-white text-xs resize-y ${erros.garantiasSwap ? 'border-red-400' : ''}`}
                disabled={submetendo}
              />
              {erros.garantiasSwap && (
                <span className="text-[11px] text-red-600 block">{erros.garantiasSwap}</span>
              )}
            </div>
          </div>
        )}

        {/* SEÇÃO 3: ANEXO DO FORMULÁRIO EM PDF E OBSERVAÇÕES */}
        <div className="space-y-4 pt-2">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-[#0a2540] uppercase tracking-wider font-display">
              3. Formulário Oficial Assinado em PDF &amp; Observações
            </h4>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="webArquivoPdf"
                className="text-xs font-semibold text-slate-800 flex items-center gap-1.5"
              >
                <UploadCloud className="h-4 w-4 text-[#0284c7]" />
                <span>Anexo do Formulário Oficial Assinado em PDF</span>
              </Label>
              <span className="text-[10px] text-slate-500 font-medium">Formato aceito: .pdf</span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Você pode anexar o formulário-padrão da TSB preenchido e assinado digitalmente
              (ICP-Brasil / Gov.br) ou digitalizado com assinatura física. O arquivo ficará
              protegido no backend sob sigilo e acessível apenas à equipe técnica interna de
              deliberação.
            </p>

            <Input
              id="webArquivoPdf"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0] || null
                setArquivoPdf(f)
                if (f) {
                  const check = validarArquivoPdf(f, 10)
                  if (!check.valido) {
                    setErros((prev) => ({ ...prev, arquivoPdf: check.erro || 'Arquivo inválido' }))
                  } else {
                    setErros((prev) => {
                      const next = { ...prev }
                      delete next.arquivoPdf
                      return next
                    })
                  }
                } else {
                  setErros((prev) => {
                    const next = { ...prev }
                    delete next.arquivoPdf
                    return next
                  })
                }
              }}
              className={`bg-white h-9 text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:bg-slate-100 file:text-slate-700 cursor-pointer ${
                erros.arquivoPdf ? 'border-red-400' : ''
              }`}
              disabled={submetendo}
            />

            {erros.arquivoPdf && (
              <span className="text-[11px] text-red-600 block">{erros.arquivoPdf}</span>
            )}

            {arquivoPdf && !erros.arquivoPdf && (
              <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-medium pt-1">
                <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Arquivo anexado: <strong>{arquivoPdf.name}</strong> (
                  {(arquivoPdf.size / 1024 / 1024).toFixed(2)} MB) — PDF verificado.
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="webObservacoes" className="text-xs font-semibold text-slate-700">
              Observações Livres Adicionais (Opcional)
            </Label>
            <Textarea
              id="webObservacoes"
              rows={2}
              placeholder="Informações complementares sobre a demanda, flexibilidade de pontos ou restrições operacionais..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="text-xs bg-white resize-y"
              disabled={submetendo}
            />
          </div>
        </div>

        {/* NOTA LGPD E SEGURANÇA */}
        <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
          <HelpCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-800 block">
              Privacidade e Sigilo Regulatório (LGPD):
            </strong>
            Os dados de contato e representação legal (nomes de pessoas físicas, CPF, e-mail e
            telefone) são de acesso estritamente restrito à equipe operacional e nunca são expostos
            em telas públicas do portal corporativo. A consulta pública por protocolo exibe apenas o
            andamento técnico e o parecer fundamentado.
          </div>
        </div>

        {/* BOTÃO DE SUBMISSÃO PRINCIPAL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            * Campos obrigatórios conforme o Art. 10 da Resolução ANP nº 11/2016.
          </div>

          <Button
            type="submit"
            disabled={submetendo}
            className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs sm:text-sm font-semibold px-6 py-2.5 shadow-xs flex items-center justify-center gap-2 cursor-pointer h-10"
          >
            {submetendo ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Autuando Solicitação &amp; Gerando Protocolo...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4 text-slate-300" />
                <span>Submeter Solicitação e Emitir Protocolo Imediato</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
