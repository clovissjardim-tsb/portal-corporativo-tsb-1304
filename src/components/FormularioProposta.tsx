import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  Download,
  Upload,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  FileText,
  ShieldAlert,
} from 'lucide-react'
import { pocService, gerarProtocoloPOC, PropostaVinculantePOC, GarantiaTipo } from '@/services/poc'
import {
  gerarPropostaGarantidaPdf,
  DadosPropostaGarantidaPdf,
  CriterioLeilaoTipo,
} from '@/services/formularioPropostaGarantidaPdf'
import { toast } from '@/hooks/use-toast'

interface FormularioPropostaProps {
  onVoltar: () => void
  onSucesso: (registro: PropostaVinculantePOC) => void
  dadosPadrao?: {
    razaoSocial?: string
    cnpj?: string
    responsavel?: string
    email?: string
    telefone?: string
    autorizacaoAnp?: string
  }
}

export function FormularioProposta({ onVoltar, onSucesso, dadosPadrao }: FormularioPropostaProps) {
  // Protocolo reservado para o documento
  const [protocolo] = useState<string>(() => gerarProtocoloPOC('POC-PG'))

  // Seção 1. Identificação do Carregador Habilitado
  const [razaoSocial, setRazaoSocial] = useState(dadosPadrao?.razaoSocial || '')
  const [sedeEndereco, setSedeEndereco] = useState('')
  const [inscricaoEstadual, setInscricaoEstadual] = useState('')
  const [cnpj, setCnpj] = useState(dadosPadrao?.cnpj || '')
  const [atividadePrincipal, setAtividadePrincipal] = useState('Comercialização de Gás Natural')
  const [codigoCnae, setCodigoCnae] = useState('35.20-4-02')
  const [atividadeSecundariaCnae, setAtividadeSecundariaCnae] = useState('')
  const [autorizacaoAnp, setAutorizacaoAnp] = useState(dadosPadrao?.autorizacaoAnp || '')
  const [sitioEletronico, setSitioEletronico] = useState('')
  const [telefone, setTelefone] = useState(dadosPadrao?.telefone || '')

  // Representante Legal (vinculante)
  const [repNome, setRepNome] = useState(dadosPadrao?.responsavel || '')
  const [repNacionalidade, setRepNacionalidade] = useState('Brasileira')
  const [repEstadoCivil, setRepEstadoCivil] = useState('Casado(a)')
  const [repDataNascimento, setRepDataNascimento] = useState('')
  const [repProfissao, setRepProfissao] = useState('Diretor Executivo')
  const [repCargo, setRepCargo] = useState('Diretor-Presidente')
  const [repCredenciamento, setRepCredenciamento] = useState('OAB/RS ou CRA/RS')
  const [repRg, setRepRg] = useState('')
  const [repOrgaoEmissor, setRepOrgaoEmissor] = useState('SSP/RS')
  const [repCpf, setRepCpf] = useState('')
  const [repEmail, setRepEmail] = useState(dadosPadrao?.email || '')
  const [repEndereco, setRepEndereco] = useState('')

  // Seção 2. Informações para Contato
  const [contatoNome, setContatoNome] = useState(dadosPadrao?.responsavel || '')
  const [contatoTelefone, setContatoTelefone] = useState(dadosPadrao?.telefone || '')
  const [contatoEmail, setContatoEmail] = useState(dadosPadrao?.email || '')
  const [contatoEndereco, setContatoEndereco] = useState('')

  // Seção 3. Dados da Proposta (Individual: 1 produto e 1 zona/ponto)
  const [produto, setProduto] = useState('Produto Anual 2026/2027 (Firme)')
  const [pontoZona, setPontoZona] = useState('Zona de Saída Triunfo (Polo Petroquímico)')
  const [capacidadeSolicitada, setCapacidadeSolicitada] = useState<number | string>(150.0)
  const [tarifaTransporte, setTarifaTransporte] = useState<number | string>(4.8521)
  const [criterioLeilao, setCriterioLeilao] = useState<CriterioLeilaoTipo>('parcialmente')
  const [capacidadeMinima, setCapacidadeMinima] = useState<number | string>(100.0)

  // Garantia Financeira
  const [garantiaTipo, setGarantiaTipo] = useState<GarantiaTipo>('Fiança Bancária')
  const [garantiaValor, setGarantiaValor] = useState<number | string>(500000.0)
  const [garantiaInstituicao, setGarantiaInstituicao] = useState(
    'Banco do Brasil S.A. / Carta de Fiança',
  )
  const [arquivoGarantia, setArquivoGarantia] = useState<File | null>(null)

  // Seção 4. Declarações Vinculantes
  const [decCelebrarContrato, setDecCelebrarContrato] = useState(false)
  const [decExecucaoDesistencia, setDecExecucaoDesistencia] = useState(false)
  const [decExecucaoNaoAssinatura, setDecExecucaoNaoAssinatura] = useState(false)
  const [decRegrasMaster, setDecRegrasMaster] = useState(false)

  // Controle de arquivo assinado e submissão
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [arquivoAssinado, setArquivoAssinado] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const obterDadosPreenchidos = (): DadosPropostaGarantidaPdf => {
    return {
      protocolo,
      razaoSocial: razaoSocial.trim(),
      sedeEndereco: sedeEndereco.trim(),
      inscricaoEstadual: inscricaoEstadual.trim(),
      cnpj: cnpj.trim(),
      atividadePrincipal: atividadePrincipal.trim(),
      codigoCnae: codigoCnae.trim(),
      atividadeSecundariaCnae: atividadeSecundariaCnae.trim(),
      autorizacaoAnp: autorizacaoAnp.trim(),
      sitioEletronico: sitioEletronico.trim(),
      telefone: telefone.trim(),
      repNome: repNome.trim(),
      repNacionalidade: repNacionalidade.trim(),
      repEstadoCivil: repEstadoCivil.trim(),
      repDataNascimento: repDataNascimento.trim(),
      repProfissao: repProfissao.trim(),
      repCargo: repCargo.trim(),
      repCredenciamento: repCredenciamento.trim(),
      repRg: repRg.trim(),
      repOrgaoEmissor: repOrgaoEmissor.trim(),
      repCpf: repCpf.trim(),
      repEmail: repEmail.trim(),
      repEndereco: repEndereco.trim(),
      contatoNome: contatoNome.trim(),
      contatoTelefone: contatoTelefone.trim(),
      contatoEmail: contatoEmail.trim(),
      contatoEndereco: contatoEndereco.trim(),
      produto: produto.trim(),
      pontoZona: pontoZona.trim(),
      capacidadeSolicitada,
      tarifaTransporte,
      criterioLeilao,
      capacidadeMinima: criterioLeilao === 'minima' ? capacidadeMinima : undefined,
      garantiaTipo,
      garantiaValor,
      garantiaInstituicao: garantiaInstituicao.trim(),
      garantiaArquivoNome: arquivoGarantia?.name || 'Comprovante anexo',
      dataDocumento: new Date().toLocaleDateString('pt-BR'),
      local: 'Porto Alegre / RS',
    }
  }

  const validarCampos = (): string | null => {
    if (!razaoSocial.trim()) return 'Preencha a Razão Social do Carregador.'
    if (!cnpj.trim()) return 'Preencha o CNPJ do Carregador.'
    if (!repNome.trim()) return 'Preencha o nome do Representante Legal.'
    if (!repCpf.trim()) return 'Preencha o CPF do Representante Legal.'
    if (!contatoEmail.trim()) return 'Preencha o e-mail de contato.'
    if (!produto.trim()) return 'Informe o Produto da Proposta.'
    if (!pontoZona.trim()) return 'Informe a Zona de Saída ou Ponto de Entrada.'

    const cap = Number(capacidadeSolicitada)
    if (isNaN(cap) || cap <= 0) {
      return 'A Capacidade Solicitada deve ser um valor numérico superior a zero.'
    }

    const tar = Number(tarifaTransporte)
    if (isNaN(tar) || tar <= 0) {
      return 'A Tarifa de Transporte associada deve ser superior a zero (R$ por MMBtu).'
    }

    if (criterioLeilao === 'minima') {
      const minCap = Number(capacidadeMinima)
      if (isNaN(minCap) || minCap <= 0) {
        return 'Informe a Capacidade Mínima para o critério de leilão ascendente.'
      }
    }

    return null
  }

  // 1. Gerar e baixar PDF preenchido da Proposta
  const handleBaixarPdf = async () => {
    setErro(null)
    const valid = validarCampos()
    if (valid) {
      setErro(valid)
      toast({
        title: 'Campos pendentes',
        description: valid,
        variant: 'destructive',
      })
      return
    }

    try {
      setGerandoPdf(true)
      const dadosPdf = obterDadosPreenchidos()
      await gerarPropostaGarantidaPdf(dadosPdf)
      toast({
        title: 'PDF Oficial da Proposta Gerado',
        description: `O arquivo Proposta-Garantida-POC-${protocolo}.pdf foi baixado. Assine eletronicamente e anexe abaixo.`,
      })
    } catch (err: any) {
      console.error('Erro ao gerar PDF da proposta:', err)
      setErro('Falha na geração do PDF: ' + (err.message || 'tente novamente.'))
    } finally {
      setGerandoPdf(false)
    }
  }

  // 2. Submeter proposta com PDF assinado e Comprovante de Garantia
  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    const valid = validarCampos()
    if (valid) {
      setErro(valid)
      return
    }

    if (
      !decCelebrarContrato ||
      !decExecucaoDesistencia ||
      !decExecucaoNaoAssinatura ||
      !decRegrasMaster
    ) {
      setErro(
        'É obrigatório assinalar todas as declarações de compromisso vinculante e garantia financeira.',
      )
      return
    }

    if (!arquivoGarantia) {
      setErro('É obrigatório anexar o Comprovante de Emissão da Garantia Financeira da Proposta.')
      return
    }

    if (!arquivoAssinado) {
      setErro('É obrigatório anexar o PDF da Proposta Garantida assinado pelo Representante Legal.')
      return
    }

    if (!arquivoAssinado.name.toLowerCase().endsWith('.pdf')) {
      setErro('O documento da proposta assinado deve ser um arquivo PDF.')
      return
    }

    setEnviando(true)
    try {
      const dadosCompletos = obterDadosPreenchidos()

      const res = await pocService.criarPropostaVinculante({
        protocolo,
        ciclo: '2026/2027',
        razao_social: razaoSocial.trim(),
        cnpj: cnpj.trim(),
        rep_legal_nome: repNome.trim(),
        rep_legal_cpf: repCpf.trim(),
        rep_legal_rg: repRg.trim(),
        rep_legal_endereco: repEndereco.trim() || sedeEndereco.trim(),
        rep_legal_cargo: repCargo.trim(),
        garantia_tipo: garantiaTipo,
        garantia_valor: Number(garantiaValor) || 0,
        garantia_instituicao: garantiaInstituicao.trim(),
        garantia_arquivo: arquivoGarantia,
        arquivo_proposta_assinada: arquivoAssinado,
        documento_proposta: arquivoAssinado,
        capacidade_proposta: Number(capacidadeSolicitada) || 0,
        tarifa_aceita: Number(tarifaTransporte) || 0,
        trecho: pontoZona.trim(),
        ponto_recebimento: pontoZona.includes('Ponto de Entrada')
          ? pontoZona
          : 'Paso de Los Libres',
        ponto_entrega: pontoZona.includes('Zona de Saída') ? pontoZona : 'Triunfo',
        criterio_leilao: criterioLeilao,
        capacidade_minima_leilao:
          criterioLeilao === 'minima' ? Number(capacidadeMinima) : undefined,
        dados_formulario: dadosCompletos,
        status: 'Submetida',
        origem: 'area_carregador',
      })

      toast({
        title: 'Proposta Garantida Submetida!',
        description: `Protocolo gerado: ${protocolo}`,
      })

      onSucesso(res)
    } catch (err: any) {
      console.error('Erro ao submeter proposta:', err)
      setErro(
        'Falha ao encaminhar proposta garantida: ' +
          (err?.message || 'Verifique sua conexão e tente novamente.'),
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Botão de retorno e Identificação do Documento */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onVoltar}
          className="w-fit text-xs text-slate-600 hover:text-[#0a2540] border-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Voltar para Área Restrita
        </Button>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#0a2540] text-white text-[11px] font-mono px-2.5 py-1">
            Protocolo Provisório: {protocolo}
          </Badge>
          <span className="text-[11px] px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 font-bold uppercase tracking-wider">
            Vinculante com Garantia
          </span>
        </div>
      </div>

      {/* Cabeçalho do Formulário */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0a2540] text-white font-mono">
            ETAPA III · ART. 37-A, § 5º, III
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            Resolução ANP nº 961/2023 · Art. 38-A, II
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0a2540] font-display">
          Proposta Garantida (Vinculante)
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Apresentação de proposta firme com compromisso irrevogável de celebração de contrato de
          transporte e aporte de garantia financeira. Cada proposta é individual por produto e
          ponto/zona.
        </p>

        {/* Nota de Vigência */}
        <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 space-y-1">
          <strong className="text-slate-800 font-semibold block">Vigência da Proposta:</strong>
          <span className="text-[11px] text-slate-600 leading-relaxed block">
            A Proposta Garantida é válida da data de sua assinatura pela TSB até o cumprimento do
            compromisso assumido pelo Carregador, qual seja, a assinatura do Contrato de Transporte.
          </span>
        </div>
      </div>

      {erro && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-start gap-2.5 animate-shake">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-semibold block">Atenção ao preenchimento:</strong>
            <span>{erro}</span>
          </div>
        </div>
      )}

      {/* FORMULÁRIO PRINCIPAL */}
      <form onSubmit={handleSubmeter} className="space-y-6">
        {/* SEÇÃO 1: IDENTIFICAÇÃO DO CARREGADOR E REPRESENTANTE LEGAL */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
            <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
              1. Identificação do Carregador Habilitado e Representante Legal
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Sociedade habilitada e signatário com poderes societários para assumir compromissos
              vinculantes
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Razão Social *</Label>
                <Input
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Nome empresarial completo"
                  className="text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">CNPJ / MF *</Label>
                <Input
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Sede / Endereço *</Label>
                <Input
                  value={sedeEndereco}
                  onChange={(e) => setSedeEndereco(e.target.value)}
                  placeholder="Logradouro, nº, bairro, cidade, UF, CEP"
                  className="text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Inscrição Estadual</Label>
                <Input
                  value={inscricaoEstadual}
                  onChange={(e) => setInscricaoEstadual(e.target.value)}
                  placeholder="Nº ou Isento"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Atividade Principal *
                </Label>
                <Input
                  value={atividadePrincipal}
                  onChange={(e) => setAtividadePrincipal(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Código CNAE *</Label>
                <Input
                  value={codigoCnae}
                  onChange={(e) => setCodigoCnae(e.target.value)}
                  className="text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Autorização ANP nº *</Label>
                <Input
                  value={autorizacaoAnp}
                  onChange={(e) => setAutorizacaoAnp(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Atividade Secundária e CNAE (se houver)
              </Label>
              <Input
                value={atividadeSecundariaCnae}
                onChange={(e) => setAtividadeSecundariaCnae(e.target.value)}
                placeholder="Descrever atividade secundária"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Sítio Eletrônico</Label>
                <Input
                  value={sitioEletronico}
                  onChange={(e) => setSitioEletronico(e.target.value)}
                  placeholder="https://www.empresa.com.br"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Telefone Corporativo *
                </Label>
                <Input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 0000-0000"
                  className="text-xs"
                  required
                />
              </div>
            </div>

            {/* DADOS DO REPRESENTANTE LEGAL */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0a2540]">
                  Representante Legal (Signatário Vinculante)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">LGPD Compliance</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Nome Completo *</Label>
                  <Input
                    value={repNome}
                    onChange={(e) => setRepNome(e.target.value)}
                    placeholder="Nome completo do signatário"
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">CPF / MF *</Label>
                  <Input
                    value={repCpf}
                    onChange={(e) => setRepCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Nacionalidade</Label>
                  <Input
                    value={repNacionalidade}
                    onChange={(e) => setRepNacionalidade(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Estado Civil</Label>
                  <Input
                    value={repEstadoCivil}
                    onChange={(e) => setRepEstadoCivil(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={repDataNascimento}
                    onChange={(e) => setRepDataNascimento(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Profissão</Label>
                  <Input
                    value={repProfissao}
                    onChange={(e) => setRepProfissao(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Cargo Estatutário *
                  </Label>
                  <Input
                    value={repCargo}
                    onChange={(e) => setRepCargo(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Credenciamento</Label>
                  <Input
                    value={repCredenciamento}
                    onChange={(e) => setRepCredenciamento(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">RG nº *</Label>
                  <Input
                    value={repRg}
                    onChange={(e) => setRepRg(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Órgão Emissor *</Label>
                  <Input
                    value={repOrgaoEmissor}
                    onChange={(e) => setRepOrgaoEmissor(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">E-mail *</Label>
                  <Input
                    type="email"
                    value={repEmail}
                    onChange={(e) => setRepEmail(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Endereço de Domicílio *
                </Label>
                <Input
                  value={repEndereco}
                  onChange={(e) => setRepEndereco(e.target.value)}
                  placeholder="Endereço residencial do representante legal"
                  className="text-xs"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 2: INFORMAÇÕES PARA CONTATO */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
            <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
              2. Informações para Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Nome *</Label>
                <Input
                  value={contatoNome}
                  onChange={(e) => setContatoNome(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Telefone(s) *</Label>
                <Input
                  value={contatoTelefone}
                  onChange={(e) => setContatoTelefone(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">E-mail *</Label>
                <Input
                  type="email"
                  value={contatoEmail}
                  onChange={(e) => setContatoEmail(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Endereço</Label>
                <Input
                  value={contatoEndereco}
                  onChange={(e) => setContatoEndereco(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 3: DADOS DA PROPOSTA */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
            <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
              3. Dados da Proposta (Individual por Produto e Zona)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              O modelo exige Propostas distintas para cada produto e zona de interesse
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Produto Anual *</Label>
                <Input
                  value={produto}
                  onChange={(e) => setProduto(e.target.value)}
                  placeholder="Ex: Produto Anual 2026/2027 (Firme)"
                  className="text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Zona de Saída ou Ponto de Entrada *
                </Label>
                <Input
                  value={pontoZona}
                  onChange={(e) => setPontoZona(e.target.value)}
                  placeholder="Ex: Zona de Saída Triunfo ou PE Paso de Los Libres"
                  className="text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Capacidade Solicitada (mil m³/dia) *
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={capacidadeSolicitada}
                  onChange={(e) => setCapacidadeSolicitada(e.target.value)}
                  placeholder="Ex: 150.0"
                  className="text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Tarifa de Transporte Associada (R$ por MMBtu) *
                </Label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={tarifaTransporte}
                  onChange={(e) => setTarifaTransporte(e.target.value)}
                  placeholder="Ex: 4.8521"
                  className="text-xs font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400">
                  A tarifa será reajustada nos termos do Contrato Master
                </span>
              </div>
            </div>

            {/* CRITÉRIO EM CASO DE LEILÃO DE PREÇO ASCENDENTE */}
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg space-y-3">
              <Label className="text-xs font-bold text-[#0a2540] block">
                Critério de Validade em caso de Leilão de Preço Ascendente (assinalar uma opção) *
              </Label>
              <RadioGroup
                value={criterioLeilao}
                onValueChange={(v) => setCriterioLeilao(v as CriterioLeilaoTipo)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="parcialmente" id="crit-parcial" />
                  <label htmlFor="crit-parcial" className="text-xs text-slate-700 cursor-pointer">
                    É válida caso a Capacidade Solicitada seja atendida parcialmente.
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="minima" id="crit-minima" />
                    <label htmlFor="crit-minima" className="text-xs text-slate-700 cursor-pointer">
                      É válida apenas se houver o atendimento à Capacidade Solicitada mínima.
                    </label>
                  </div>
                  {criterioLeilao === 'minima' && (
                    <div className="pl-6 pt-1 flex items-center gap-2">
                      <Label className="text-[11px] font-semibold text-slate-700">
                        Capacidade Mínima (mil m³/dia):
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={capacidadeMinima}
                        onChange={(e) => setCapacidadeMinima(e.target.value)}
                        className="text-xs w-36 font-mono bg-white"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="totalmente" id="crit-total" />
                  <label htmlFor="crit-total" className="text-xs text-slate-700 cursor-pointer">
                    É válida apenas caso a Capacidade Solicitada seja totalmente atendida.
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* GARANTIA FINANCEIRA */}
            <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0a2540]">
                  Garantia Financeira da Proposta (item 3.3 do Anexo 1-B)
                </span>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                  Aporte Obrigatório
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Modalidade</Label>
                  <select
                    value={garantiaTipo}
                    onChange={(e) => setGarantiaTipo(e.target.value as GarantiaTipo)}
                    className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                  >
                    <option value="Fiança Bancária">Fiança Bancária</option>
                    <option value="Seguro Garantia">Seguro Garantia</option>
                    <option value="Depósito Caução">Depósito Caução</option>
                    <option value="Carta de Crédito">Carta de Crédito</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Valor (R$) *</Label>
                  <Input
                    type="number"
                    step="1000"
                    value={garantiaValor}
                    onChange={(e) => setGarantiaValor(e.target.value)}
                    className="text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    Instituição Emissora
                  </Label>
                  <Input
                    value={garantiaInstituicao}
                    onChange={(e) => setGarantiaInstituicao(e.target.value)}
                    placeholder="Banco ou Seguradora"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <Label className="text-[11px] font-semibold text-slate-700">
                  Comprovante de Emissão da Garantia Financeira (Upload do arquivo) *
                </Label>
                <Input
                  type="file"
                  accept="application/pdf,application/zip"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setArquivoGarantia(f)
                  }}
                  className="text-xs cursor-pointer bg-slate-50"
                  required
                />
                {arquivoGarantia && (
                  <span className="text-[11px] text-emerald-700 font-mono block">
                    Comprovante: {arquivoGarantia.name} ({(arquivoGarantia.size / 1024).toFixed(1)}{' '}
                    KB)
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 4: DECLARAÇÕES VINCULANTES */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
            <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
              4. Declarações e Compromisso Irrevogável
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Assinale todos os itens vinculantes para prosseguir
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {[
              {
                id: 'decP1',
                state: decCelebrarContrato,
                setter: setDecCelebrarContrato,
                text: 'Caso a presente Proposta Garantida seja a vencedora, o Carregador Habilitado compromete-se, de forma irrevogável e irretratável, a celebrar Contrato de Serviço de Transporte com a TSB nas condições do POC Anual.',
              },
              {
                id: 'decP2',
                state: decExecucaoDesistencia,
                setter: setDecExecucaoDesistencia,
                text: 'Declara plena ciência de que a desistência do POC após a submissão desta Proposta ou o seu descumprimento implicará a execução integral da Garantia Financeira.',
              },
              {
                id: 'decP3',
                state: decExecucaoNaoAssinatura,
                setter: setDecExecucaoNaoAssinatura,
                text: 'Declara plena ciência de que a não assinatura do Contrato de Transporte no prazo estipulado no Cronograma Oficial implicará a imediata execução da Garantia Financeira.',
              },
              {
                id: 'decP4',
                state: decRegrasMaster,
                setter: setDecRegrasMaster,
                text: 'Declara estar ciente e de acordo com todas as regras do Contrato Master e da Resolução ANP nº 961/2023.',
              },
            ].map((dec) => (
              <div key={dec.id} className="flex items-start gap-2.5">
                <Checkbox
                  id={dec.id}
                  checked={dec.state}
                  onCheckedChange={(v) => dec.setter(Boolean(v))}
                  className="mt-0.5"
                />
                <label
                  htmlFor={dec.id}
                  className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none"
                >
                  {dec.text}
                </label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* BLOCO DE GERAÇÃO E REANEXAÇÃO DO PDF ASSINADO */}
        <Card className="border-2 border-red-200 bg-red-50/20 shadow-xs">
          <CardHeader className="pb-3 border-b border-red-100 bg-white">
            <CardTitle className="text-sm font-bold text-[#0a2540] font-display flex items-center gap-2">
              <FileText className="h-4 w-4 text-red-600" />
              Geração, Assinatura e Reanexação da Proposta Garantida
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Gere o documento oficial com os dados da proposta, realize a assinatura eletrônica do
              Representante Legal fora do sistema e reanexe o PDF assinado juntamente com o
              comprovante de garantia.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-5">
            {/* ETAPA A: BAIXAR PDF */}
            <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <strong className="text-xs font-bold text-[#0a2540] block">
                  1º Passo: Baixar o Formulário da Proposta Preenchido
                </strong>
                <span className="text-[11px] text-slate-500">
                  Gera o documento no formato padrão TSB com o protocolo provisório {protocolo}
                </span>
              </div>
              <Button
                type="button"
                onClick={handleBaixarPdf}
                disabled={gerandoPdf}
                className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                {gerandoPdf ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5 mr-1.5 text-sky-300" />
                    Baixar Proposta em PDF
                  </>
                )}
              </Button>
            </div>

            {/* ETAPA B: REANEXAR PDF ASSINADO */}
            <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold text-[#0a2540] block">
                  2º Passo: Reanexar a Proposta Assinada *
                </strong>
                {arquivoAssinado && (
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Proposta anexada
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Anexe o arquivo PDF assinado pelo Representante Legal (ICP-Brasil, Gov.br ou
                assinatura eletrônica qualificada).
              </p>

              <div className="pt-1">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setArquivoAssinado(f)
                  }}
                  className="text-xs cursor-pointer bg-slate-50"
                  required
                />
                {arquivoAssinado && (
                  <div className="text-[11px] text-slate-600 mt-1 font-mono">
                    Selecionado: {arquivoAssinado.name} ({(arquivoAssinado.size / 1024).toFixed(1)}{' '}
                    KB)
                  </div>
                )}
              </div>
            </div>

            {/* ETAPA C: SUBMISSÃO FINAL */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-red-100">
              <span className="text-[11px] text-slate-500">
                Ao encaminhar, o sistema registrará a proposta vinculante e gerará o protocolo
                imediato na tela.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onVoltar}
                  disabled={enviando}
                  className="text-xs text-slate-600"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={enviando || !arquivoAssinado || !arquivoGarantia}
                  className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-semibold px-6 cursor-pointer shadow-xs"
                >
                  {enviando ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Encaminhando Proposta...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-1.5 text-sky-300" />
                      Encaminhar Proposta Vinculante
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
