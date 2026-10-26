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
  ArrowRight,
  RefreshCw,
  FileText,
  ShieldCheck,
  Check,
  Plus,
  Trash2,
  FileCheck2,
} from 'lucide-react'
import { pocService, gerarProtocoloPOC, SubmissaoCompletaPOC, GarantiaTipo } from '@/services/poc'
import {
  gerarManifestacaoInteressePdf,
  DadosManifestacaoInteressePdf,
  ItemTabelaInteresse,
} from '@/services/formularioManifestacaoPdf'
import {
  gerarPropostaGarantidaPdf,
  DadosPropostaGarantidaPdf,
  CriterioLeilaoTipo,
} from '@/services/formularioPropostaGarantidaPdf'
import { toast } from '@/hooks/use-toast'

interface FluxoSubmissaoPOCProps {
  onVoltar: () => void
  onSucesso: (registro: SubmissaoCompletaPOC) => void
  dadosPadrao?: {
    razaoSocial?: string
    cnpj?: string
    responsavel?: string
    email?: string
    telefone?: string
    autorizacaoAnp?: string
  }
}

type EtapaFluxo = 1 | 2 | 3

export function FluxoSubmissaoPOC({ onVoltar, onSucesso, dadosPadrao }: FluxoSubmissaoPOCProps) {
  // Protocolo Único da Submissão Completa (ex: POC-2026-XXXX)
  const [protocolo] = useState<string>(() => gerarProtocoloPOC('POC'))

  // Etapa corrente: 1 = Manifestação, 2 = Proposta Garantida, 3 = Revisão e Envio
  const [etapa, setEtapa] = useState<EtapaFluxo>(1)

  // -------------------------------------------------------------
  // DADOS GERAIS DO CARREGADOR
  // -------------------------------------------------------------
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

  // Contato geral
  const [contatoNome, setContatoNome] = useState(dadosPadrao?.responsavel || '')
  const [contatoTelefone, setContatoTelefone] = useState(dadosPadrao?.telefone || '')
  const [contatoEmail, setContatoEmail] = useState(dadosPadrao?.email || '')
  const [contatoEndereco, setContatoEndereco] = useState('')

  // -------------------------------------------------------------
  // ETAPA 1: MANIFESTAÇÃO DE INTERESSE
  // -------------------------------------------------------------
  const [repNomeManif, setRepNomeManif] = useState(dadosPadrao?.responsavel || '')
  const [repNacionalidadeManif, setRepNacionalidadeManif] = useState('Brasileira')
  const [repEstadoCivilManif, setRepEstadoCivilManif] = useState('Casado(a)')
  const [repDataNascimentoManif, setRepDataNascimentoManif] = useState('')
  const [repProfissaoManif, setRepProfissaoManif] = useState('Diretor de Regulação')
  const [repCargoManif, setRepCargoManif] = useState('Diretor Estatutário')
  const [repCredenciamentoManif, setRepCredenciamentoManif] = useState('OAB/RS ou CRA/RS')
  const [repRgManif, setRepRgManif] = useState('')
  const [repOrgaoEmissorManif, setRepOrgaoEmissorManif] = useState('SSP/RS')
  const [repCpfManif, setRepCpfManif] = useState('')
  const [repEmailManif, setRepEmailManif] = useState(dadosPadrao?.email || '')
  const [repEnderecoManif, setRepEnderecoManif] = useState('')

  const [itensInteresse, setItensInteresse] = useState<ItemTabelaInteresse[]>([
    {
      pontoZona: 'Ponto de Entrada Paso de Los Libres (Fronteira)',
      produto: 'Produto Anual 2026/2027 (Firme)',
      capacidade: 150.0,
    },
  ])

  const [decRegrasMasterManif, setDecRegrasMasterManif] = useState(false)
  const [decCamposObrigatoriosManif, setDecCamposObrigatoriosManif] = useState(false)
  const [decCapacidadeMaiorZeroManif, setDecCapacidadeMaiorZeroManif] = useState(false)
  const [decCronogramaManif, setDecCronogramaManif] = useState(false)
  const [decAssinaturaRepManif, setDecAssinaturaRepManif] = useState(false)

  const [gerandoPdfManif, setGerandoPdfManif] = useState(false)
  const [pdfManifGerado, setPdfManifGerado] = useState(false)
  const [arquivoManifAssinado, setArquivoManifAssinado] = useState<File | null>(null)

  // -------------------------------------------------------------
  // ETAPA 2: PROPOSTA GARANTIDA VINCULANTE
  // -------------------------------------------------------------
  const [repNomeProp, setRepNomeProp] = useState(dadosPadrao?.responsavel || '')
  const [repNacionalidadeProp, setRepNacionalidadeProp] = useState('Brasileira')
  const [repEstadoCivilProp, setRepEstadoCivilProp] = useState('Casado(a)')
  const [repDataNascimentoProp, setRepDataNascimentoProp] = useState('')
  const [repProfissaoProp, setRepProfissaoProp] = useState('Diretor Executivo')
  const [repCargoProp, setRepCargoProp] = useState('Diretor-Presidente')
  const [repCredenciamentoProp, setRepCredenciamentoProp] = useState('OAB/RS ou CRA/RS')
  const [repRgProp, setRepRgProp] = useState('')
  const [repOrgaoEmissorProp, setRepOrgaoEmissorProp] = useState('SSP/RS')
  const [repCpfProp, setRepCpfProp] = useState('')
  const [repEmailProp, setRepEmailProp] = useState(dadosPadrao?.email || '')
  const [repEnderecoProp, setRepEnderecoProp] = useState('')

  const [produtoProp, setProdutoProp] = useState('Produto Anual 2026/2027 (Firme)')
  const [pontoZonaProp, setPontoZonaProp] = useState('Zona de Saída Triunfo (Polo Petroquímico)')
  const [capacidadeProp, setCapacidadeProp] = useState<number | string>(150.0)
  const [tarifaTransporteProp, setTarifaTransporteProp] = useState<number | string>(4.8521)
  const [criterioLeilaoProp, setCriterioLeilaoProp] = useState<CriterioLeilaoTipo>('parcialmente')
  const [capacidadeMinimaProp, setCapacidadeMinimaProp] = useState<number | string>(100.0)

  const [garantiaTipo, setGarantiaTipo] = useState<GarantiaTipo>('Fiança Bancária')
  const [garantiaValor, setGarantiaValor] = useState<number | string>(500000.0)
  const [garantiaInstituicao, setGarantiaInstituicao] = useState(
    'Banco do Brasil S.A. / Carta de Fiança',
  )
  const [arquivoGarantia, setArquivoGarantia] = useState<File | null>(null)

  const [decCelebrarContrato, setDecCelebrarContrato] = useState(false)
  const [decExecucaoDesistencia, setDecExecucaoDesistencia] = useState(false)
  const [decExecucaoNaoAssinatura, setDecExecucaoNaoAssinatura] = useState(false)
  const [decRegrasMasterProp, setDecRegrasMasterProp] = useState(false)

  const [gerandoPdfProp, setGerandoPdfProp] = useState(false)
  const [pdfPropGerado, setPdfPropGerado] = useState(false)
  const [arquivoPropAssinado, setArquivoPropAssinado] = useState<File | null>(null)

  // -------------------------------------------------------------
  // CONTROLE DE ERROS E SUBMISSÃO FINAL
  // -------------------------------------------------------------
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Handlers para Tabela de Interesse
  const adicionarLinhaInteresse = () => {
    setItensInteresse((prev) => [
      ...prev,
      {
        pontoZona: 'Zona de Saída Triunfo (Polo Petroquímico)',
        produto: 'Produto Anual 2026/2027 (Firme)',
        capacidade: 50.0,
      },
    ])
  }

  const removerLinhaInteresse = (index: number) => {
    if (itensInteresse.length <= 1) {
      toast({
        title: 'Mínimo de uma linha',
        description: 'A manifestação deve conter ao menos um ponto/zona de interesse.',
        variant: 'destructive',
      })
      return
    }
    setItensInteresse((prev) => prev.filter((_, i) => i !== index))
  }

  const atualizarItemInteresse = (index: number, campo: keyof ItemTabelaInteresse, valor: any) => {
    setItensInteresse((prev) => prev.map((it, i) => (i === index ? { ...it, [campo]: valor } : it)))
  }

  // -------------------------------------------------------------
  // VALIDAÇÕES E GERAÇÃO PDF DA ETAPA 1 (MANIFESTAÇÃO)
  // -------------------------------------------------------------
  const obterDadosManifestacaoPdf = (): DadosManifestacaoInteressePdf => {
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
      repNome: repNomeManif.trim(),
      repNacionalidade: repNacionalidadeManif.trim(),
      repEstadoCivil: repEstadoCivilManif.trim(),
      repDataNascimento: repDataNascimentoManif.trim(),
      repProfissao: repProfissaoManif.trim(),
      repCargo: repCargoManif.trim(),
      repCredenciamento: repCredenciamentoManif.trim(),
      repRg: repRgManif.trim(),
      repOrgaoEmissor: repOrgaoEmissorManif.trim(),
      repCpf: repCpfManif.trim(),
      repEmail: repEmailManif.trim(),
      repEndereco: repEnderecoManif.trim() || sedeEndereco.trim(),
      contatoNome: contatoNome.trim(),
      contatoTelefone: contatoTelefone.trim(),
      contatoEmail: contatoEmail.trim(),
      contatoEndereco: contatoEndereco.trim(),
      itensInteresse,
      dataDocumento: new Date().toLocaleDateString('pt-BR'),
      local: 'Porto Alegre / RS',
    }
  }

  const validarEtapa1 = (): string | null => {
    if (!razaoSocial.trim()) return 'Preencha a Razão Social do Carregador.'
    if (!cnpj.trim()) return 'Preencha o CNPJ do Carregador.'
    if (!contatoEmail.trim()) return 'Preencha o e-mail de contato corporativo.'
    if (!repNomeManif.trim()) return 'Preencha o nome do Representante Autorizado da Manifestação.'
    if (!repCpfManif.trim()) return 'Preencha o CPF do Representante Autorizado da Manifestação.'
    if (itensInteresse.length === 0) return 'Informe ao menos um ponto/zona na tabela de interesse.'

    for (let i = 0; i < itensInteresse.length; i++) {
      const cap = Number(itensInteresse[i].capacidade)
      if (isNaN(cap) || cap <= 0) {
        return `A capacidade na linha ${i + 1} deve ser superior a zero (mil m³/dia).`
      }
    }

    if (
      !decRegrasMasterManif ||
      !decCamposObrigatoriosManif ||
      !decCapacidadeMaiorZeroManif ||
      !decCronogramaManif ||
      !decAssinaturaRepManif
    ) {
      return 'É obrigatório assinalar todas as declarações regulatórias da Manifestação de Interesse.'
    }

    if (!arquivoManifAssinado) {
      return 'Obrigatório: baixe o formulário em PDF, assine eletronicamente e anexe o PDF assinado da Manifestação de Interesse para avançar.'
    }

    return null
  }

  const handleBaixarPdfManifestacao = async () => {
    setErro(null)
    if (!razaoSocial.trim() || !cnpj.trim() || !repNomeManif.trim() || !repCpfManif.trim()) {
      setErro('Preencha ao menos Razão Social, CNPJ, Representante e CPF antes de gerar o PDF.')
      toast({
        title: 'Dados preliminares incompletos',
        description:
          'Preencha os campos da empresa e do representante para gerar o documento oficial.',
        variant: 'destructive',
      })
      return
    }

    try {
      setGerandoPdfManif(true)
      const dados = obterDadosManifestacaoPdf()
      await gerarManifestacaoInteressePdf(dados)
      setPdfManifGerado(true)
      toast({
        title: 'PDF da Manifestação Gerado',
        description: `O arquivo Manifestacao-Interesse-POC-${protocolo}.pdf foi baixado. Assine e anexe abaixo.`,
      })
    } catch (err: any) {
      console.error('Erro ao gerar PDF da manifestação:', err)
      setErro('Falha na geração do PDF: ' + (err.message || 'tente novamente.'))
    } finally {
      setGerandoPdfManif(false)
    }
  }

  const handleAvancarParaEtapa2 = (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    const val = validarEtapa1()
    if (val) {
      setErro(val)
      toast({ title: 'Atenção', description: val, variant: 'destructive' })
      return
    }

    // Se representante da etapa 2 estiver vazio, copia da etapa 1 por conveniência
    if (!repNomeProp) setRepNomeProp(repNomeManif)
    if (!repCpfProp) setRepCpfProp(repCpfManif)
    if (!repEmailProp) setRepEmailProp(repEmailManif)
    if (!repRgProp) setRepRgProp(repRgManif)
    if (!repEnderecoProp) setRepEnderecoProp(repEnderecoManif)

    setEtapa(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // -------------------------------------------------------------
  // VALIDAÇÕES E GERAÇÃO PDF DA ETAPA 2 (PROPOSTA GARANTIDA)
  // -------------------------------------------------------------
  const obterDadosPropostaPdf = (): DadosPropostaGarantidaPdf => {
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
      repNome: repNomeProp.trim(),
      repNacionalidade: repNacionalidadeProp.trim(),
      repEstadoCivil: repEstadoCivilProp.trim(),
      repDataNascimento: repDataNascimentoProp.trim(),
      repProfissao: repProfissaoProp.trim(),
      repCargo: repCargoProp.trim(),
      repCredenciamento: repCredenciamentoProp.trim(),
      repRg: repRgProp.trim(),
      repOrgaoEmissor: repOrgaoEmissorProp.trim(),
      repCpf: repCpfProp.trim(),
      repEmail: repEmailProp.trim(),
      repEndereco: repEnderecoProp.trim() || sedeEndereco.trim(),
      contatoNome: contatoNome.trim(),
      contatoTelefone: contatoTelefone.trim(),
      contatoEmail: contatoEmail.trim(),
      contatoEndereco: contatoEndereco.trim(),
      produto: produtoProp.trim(),
      pontoZona: pontoZonaProp.trim(),
      capacidadeSolicitada: capacidadeProp,
      tarifaTransporte: tarifaTransporteProp,
      criterioLeilao: criterioLeilaoProp,
      capacidadeMinima: criterioLeilaoProp === 'minima' ? capacidadeMinimaProp : undefined,
      garantiaTipo,
      garantiaValor,
      garantiaInstituicao: garantiaInstituicao.trim(),
      garantiaArquivoNome: arquivoGarantia?.name || 'Comprovante anexo',
      dataDocumento: new Date().toLocaleDateString('pt-BR'),
      local: 'Porto Alegre / RS',
    }
  }

  const validarEtapa2 = (): string | null => {
    if (!repNomeProp.trim()) return 'Preencha o nome do Representante Legal da Proposta.'
    if (!repCpfProp.trim()) return 'Preencha o CPF do Representante Legal da Proposta.'
    if (!produtoProp.trim()) return 'Informe o produto da proposta.'
    if (!pontoZonaProp.trim()) return 'Informe a Zona de Saída ou Ponto de Entrada.'

    const cap = Number(capacidadeProp)
    if (isNaN(cap) || cap <= 0) {
      return 'A Capacidade Proposta deve ser maior que zero (mil m³/dia).'
    }

    const tar = Number(tarifaTransporteProp)
    if (isNaN(tar) || tar <= 0) {
      return 'A Tarifa de Transporte deve ser superior a zero (R$ por MMBtu).'
    }

    if (criterioLeilaoProp === 'minima') {
      const minCap = Number(capacidadeMinimaProp)
      if (isNaN(minCap) || minCap <= 0) {
        return 'Informe a Capacidade Mínima para o critério de leilão ascendente.'
      }
    }

    const gValor = Number(garantiaValor)
    if (isNaN(gValor) || gValor <= 0) {
      return 'O valor da Garantia Financeira deve ser superior a zero (R$).'
    }

    if (
      !decCelebrarContrato ||
      !decExecucaoDesistencia ||
      !decExecucaoNaoAssinatura ||
      !decRegrasMasterProp
    ) {
      return 'É obrigatório assinalar todas as declarações de compromisso vinculante e garantia financeira.'
    }

    if (!arquivoGarantia) {
      return 'Obrigatório: anexe o Comprovante de Emissão da Garantia Financeira da Proposta (fiança, seguro ou caução).'
    }

    if (!arquivoPropAssinado) {
      return 'Obrigatório: baixe o formulário em PDF, assine eletronicamente e anexe o PDF assinado da Proposta Garantida para avançar.'
    }

    return null
  }

  const handleBaixarPdfProposta = async () => {
    setErro(null)
    if (!repNomeProp.trim() || !repCpfProp.trim() || !produtoProp.trim() || !pontoZonaProp.trim()) {
      setErro('Preencha os dados da proposta e do representante legal para gerar o PDF.')
      toast({
        title: 'Dados incompletos',
        description: 'Preencha os campos obrigatórios da proposta para gerar o documento.',
        variant: 'destructive',
      })
      return
    }

    try {
      setGerandoPdfProp(true)
      const dados = obterDadosPropostaPdf()
      await gerarPropostaGarantidaPdf(dados)
      setPdfPropGerado(true)
      toast({
        title: 'PDF da Proposta Gerado',
        description: `O arquivo Proposta-Garantida-POC-${protocolo}.pdf foi baixado. Assine e anexe abaixo.`,
      })
    } catch (err: any) {
      console.error('Erro ao gerar PDF da proposta:', err)
      setErro('Falha na geração do PDF: ' + (err.message || 'tente novamente.'))
    } finally {
      setGerandoPdfProp(false)
    }
  }

  const handleAvancarParaEtapa3 = (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    const val = validarEtapa2()
    if (val) {
      setErro(val)
      toast({ title: 'Atenção', description: val, variant: 'destructive' })
      return
    }

    setEtapa(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // -------------------------------------------------------------
  // ETAPA 3: REVISÃO E ENVIO DEFINITIVO (SÓ DEPOIS ENVIA)
  // -------------------------------------------------------------
  const handleSubmeterDefinitivo = async () => {
    setErro(null)

    // Validações de integridade completas antes do envio
    const val1 = validarEtapa1()
    if (val1) {
      setEtapa(1)
      setErro(`Etapa 1 pendente: ${val1}`)
      return
    }
    const val2 = validarEtapa2()
    if (val2) {
      setEtapa(2)
      setErro(`Etapa 2 pendente: ${val2}`)
      return
    }

    if (!arquivoManifAssinado || !arquivoPropAssinado || !arquivoGarantia) {
      setErro('Arquivos obrigatórios ausentes. Verifique os anexos das Etapas 1 e 2.')
      return
    }

    setEnviando(true)
    try {
      const capTotalManif = itensInteresse.reduce(
        (acc, it) => acc + (Number(it.capacidade) || 0),
        0,
      )
      const pontoZonaManifDesc = itensInteresse.map((it) => it.pontoZona).join('; ')
      const dadosManifJson = obterDadosManifestacaoPdf()
      const dadosPropJson = obterDadosPropostaPdf()

      const novaSubmissao = await pocService.criarSubmissaoCompleta({
        protocolo,
        ciclo: '2026/2027',
        razao_social: razaoSocial.trim(),
        cnpj: cnpj.trim(),
        email: contatoEmail.trim(),
        telefone: contatoTelefone.trim(),
        responsavel_nome: repNomeProp.trim() || repNomeManif.trim(),
        autorizacao_anp: autorizacaoAnp.trim(),
        // Etapa 1
        capacidade_solicitada_manif: capTotalManif,
        ponto_zona_manif: pontoZonaManifDesc || 'Gasoduto Uruguaiana - Triunfo',
        arquivo_manifestacao_assinada: arquivoManifAssinado,
        dados_manifestacao: dadosManifJson,
        // Etapa 2
        rep_legal_nome: repNomeProp.trim(),
        rep_legal_cpf: repCpfProp.trim(),
        produto_proposta: produtoProp.trim(),
        ponto_zona_proposta: pontoZonaProp.trim(),
        capacidade_proposta: Number(capacidadeProp) || 0,
        tarifa_aceita: Number(tarifaTransporteProp) || 0,
        criterio_leilao: criterioLeilaoProp,
        capacidade_minima_leilao:
          criterioLeilaoProp === 'minima' ? Number(capacidadeMinimaProp) : undefined,
        garantia_tipo: garantiaTipo,
        garantia_valor: Number(garantiaValor) || 0,
        garantia_instituicao: garantiaInstituicao.trim(),
        arquivo_garantia: arquivoGarantia,
        arquivo_proposta_assinada: arquivoPropAssinado,
        dados_proposta: dadosPropJson,
        origem: 'area_carregador',
      })

      toast({
        title: 'Submissão Concluída com Sucesso!',
        description: `Protocolo único gerado: ${novaSubmissao.protocolo}. Comprovante enviado ao seu e-mail corporativo.`,
      })

      onSucesso(novaSubmissao)
    } catch (err: any) {
      console.error('Erro ao submeter processo completo do POC:', err)
      setErro(
        'Falha no envio da submissão: ' +
          (err?.message || 'Verifique sua conexão e tente novamente.'),
      )
    } finally {
      setEnviando(false)
    }
  }

  // Capacidade total manifestada para resumo
  const capacidadeTotalManifestada = itensInteresse.reduce(
    (acc, it) => acc + (Number(it.capacidade) || 0),
    0,
  )

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* BARRA SUPERIOR: NAVEGAÇÃO E PROTOCOLO RESERVADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onVoltar}
          className="w-fit text-xs text-slate-600 hover:text-[#0a2540] border-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Voltar para Visão Geral do POC
        </Button>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#0a2540] text-white text-xs font-mono px-3 py-1 tracking-wide">
            Protocolo da Submissão: {protocolo}
          </Badge>
          <span className="text-[11px] px-2.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-semibold uppercase">
            Fluxo Único Sequencial
          </span>
        </div>
      </div>

      {/* CABEÇALHO DO PROCESSO */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0a2540] text-white font-mono">
            Processo Sequencial POC · Art. 37-A
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            Resolução ANP nº 961/2023 · Ciclo 2026/2027
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0a2540] font-display">
          Submissão Integrada de Capacidade de Transporte
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Processo guiado e unificado em 3 etapas sequenciais: primeiro preencha e anexe o PDF
          assinado de <strong>Manifestação de Interesse</strong> (Etapa 1), depois preencha e anexe
          a <strong>Proposta Garantida</strong> com o comprovante de garantia (Etapa 2), e na
          revisão final confirme o envio para geração e expedição imediata do seu{' '}
          <strong>protocolo por e-mail</strong>.
        </p>
      </div>

      {/* INDICADOR VISUAL DAS 3 ETAPAS SEQUENCIAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* ETAPA 1 */}
        <div
          onClick={() => setEtapa(1)}
          className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
            etapa === 1
              ? 'bg-sky-50/70 border-[#0284c7] ring-1 ring-[#0284c7]'
              : arquivoManifAssinado
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-white border-slate-200 opacity-80'
          }`}
        >
          <div
            className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              arquivoManifAssinado
                ? 'bg-emerald-600 text-white'
                : etapa === 1
                  ? 'bg-[#0284c7] text-white'
                  : 'bg-slate-200 text-slate-700'
            }`}
          >
            {arquivoManifAssinado ? <Check className="h-4 w-4" /> : '1'}
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              Etapa 1
            </span>
            <strong className="text-xs text-[#0a2540] block truncate">
              Manifestação de Interesse
            </strong>
            <span className="text-[10px] text-slate-500 block">
              {arquivoManifAssinado ? '✓ PDF assinado anexado' : 'Formulário + Anexo'}
            </span>
          </div>
        </div>

        {/* ETAPA 2 */}
        <div
          onClick={() => {
            const val1 = validarEtapa1()
            if (!val1) setEtapa(2)
            else {
              setErro('Conclua e anexe a Manifestação de Interesse (Etapa 1) para avançar.')
              setEtapa(1)
            }
          }}
          className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
            etapa === 2
              ? 'bg-sky-50/70 border-[#0284c7] ring-1 ring-[#0284c7]'
              : arquivoPropAssinado && arquivoGarantia
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-white border-slate-200 opacity-80'
          }`}
        >
          <div
            className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              arquivoPropAssinado && arquivoGarantia
                ? 'bg-emerald-600 text-white'
                : etapa === 2
                  ? 'bg-[#0284c7] text-white'
                  : 'bg-slate-200 text-slate-700'
            }`}
          >
            {arquivoPropAssinado && arquivoGarantia ? <Check className="h-4 w-4" /> : '2'}
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              Etapa 2
            </span>
            <strong className="text-xs text-[#0a2540] block truncate">Proposta Garantida</strong>
            <span className="text-[10px] text-slate-500 block">
              {arquivoPropAssinado && arquivoGarantia
                ? '✓ Proposta + Garantia anexadas'
                : 'Garantia + PDF assinado'}
            </span>
          </div>
        </div>

        {/* ETAPA 3 */}
        <div
          onClick={() => {
            const val1 = validarEtapa1()
            const val2 = validarEtapa2()
            if (!val1 && !val2) setEtapa(3)
            else if (val1) {
              setErro('Conclua e anexe a Manifestação de Interesse (Etapa 1).')
              setEtapa(1)
            } else {
              setErro('Conclua e anexe a Proposta e Comprovante de Garantia (Etapa 2).')
              setEtapa(2)
            }
          }}
          className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
            etapa === 3
              ? 'bg-sky-50/70 border-[#0284c7] ring-1 ring-[#0284c7]'
              : 'bg-white border-slate-200 opacity-80'
          }`}
        >
          <div
            className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              etapa === 3 ? 'bg-[#0284c7] text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            3
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              Etapa 3
            </span>
            <strong className="text-xs text-[#0a2540] block truncate">Revisão e Envio</strong>
            <span className="text-[10px] text-slate-500 block">Protocolo na tela e e-mail</span>
          </div>
        </div>
      </div>

      {erro && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-start gap-2.5 animate-shake">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-semibold block">Pendência para prosseguir:</strong>
            <span>{erro}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 1: MANIFESTAÇÃO DE INTERESSE */}
      {/* ========================================================================= */}
      {etapa === 1 && (
        <form onSubmit={handleAvancarParaEtapa2} className="space-y-6">
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
                  1.1 Identificação do Interessado (Carregador Habilitado)
                </CardTitle>
                <span className="text-[11px] text-slate-500">Campos obrigatórios (*)</span>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Dados cadastrais da pessoa jurídica requerente do ciclo POC
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
                    placeholder="Logradouro, número, complemento, bairro, cidade - UF, CEP"
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Inscrição Estadual</Label>
                  <Input
                    value={inscricaoEstadual}
                    onChange={(e) => setInscricaoEstadual(e.target.value)}
                    placeholder="Inscrição Estadual"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Atividade Principal
                  </Label>
                  <Input
                    value={atividadePrincipal}
                    onChange={(e) => setAtividadePrincipal(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">CNAE Principal</Label>
                  <Input
                    value={codigoCnae}
                    onChange={(e) => setCodigoCnae(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Registro / Aut. ANP
                  </Label>
                  <Input
                    value={autorizacaoAnp}
                    onChange={(e) => setAutorizacaoAnp(e.target.value)}
                    placeholder="Nº da Autorização ANP"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Telefone</Label>
                  <Input
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(00) 0000-0000"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Website Oficial</Label>
                  <Input
                    value={sitioEletronico}
                    onChange={(e) => setSitioEletronico(e.target.value)}
                    placeholder="https://..."
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* REPRESENTANTE AUTORIZADO - ETAPA 1 */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
                1.2 Representante Autorizado da Manifestação
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Pessoa física investida de poderes para subscrever a Manifestação de Interesse
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Nome Completo *</Label>
                  <Input
                    value={repNomeManif}
                    onChange={(e) => setRepNomeManif(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">CPF *</Label>
                  <Input
                    value={repCpfManif}
                    onChange={(e) => setRepCpfManif(e.target.value)}
                    placeholder="000.000.000-00"
                    className="text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Cargo / Função *</Label>
                  <Input
                    value={repCargoManif}
                    onChange={(e) => setRepCargoManif(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Profissão</Label>
                  <Input
                    value={repProfissaoManif}
                    onChange={(e) => setRepProfissaoManif(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    E-mail do Representante *
                  </Label>
                  <Input
                    type="email"
                    value={repEmailManif}
                    onChange={(e) => setRepEmailManif(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">RG</Label>
                  <Input
                    value={repRgManif}
                    onChange={(e) => setRepRgManif(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Órgão Emissor</Label>
                  <Input
                    value={repOrgaoEmissorManif}
                    onChange={(e) => setRepOrgaoEmissorManif(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Nacionalidade / Estado Civil
                  </Label>
                  <Input
                    value={`${repNacionalidadeManif}, ${repEstadoCivilManif}`}
                    onChange={(e) => setRepNacionalidadeManif(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Endereço Comercial do Representante
                </Label>
                <Input
                  value={repEnderecoManif}
                  onChange={(e) => setRepEnderecoManif(e.target.value)}
                  placeholder="Se diferente da sede do carregador"
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* INFORMAÇÕES DE CONTATO GERAL */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
                1.3 Canal de Notificações Oficiais da Submissão
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Endereço de e-mail corporativo para onde será expedido o protocolo formal
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Pessoa de Contato *
                  </Label>
                  <Input
                    value={contatoNome}
                    onChange={(e) => setContatoNome(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    E-mail para Protocolo *
                  </Label>
                  <Input
                    type="email"
                    value={contatoEmail}
                    onChange={(e) => setContatoEmail(e.target.value)}
                    className="text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Telefone de Contato
                  </Label>
                  <Input
                    value={contatoTelefone}
                    onChange={(e) => setContatoTelefone(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TABELA DE INTERESSE */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
                  1.4 Tabela de Interesse em Capacidade Firme
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Pontos de entrada ou zonas de saída pretendidos no gasoduto TSB
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarLinhaInteresse}
                className="text-xs h-7 border-slate-300"
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar Ponto/Zona
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-3">
                {itensInteresse.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Item #{idx + 1}</span>
                      {itensInteresse.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerLinhaInteresse(idx)}
                          className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 text-[11px]"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remover
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="space-y-1 sm:col-span-1">
                        <Label className="text-[11px] font-semibold text-slate-700">
                          Ponto / Zona de Transporte *
                        </Label>
                        <Input
                          value={it.pontoZona}
                          onChange={(e) => atualizarItemInteresse(idx, 'pontoZona', e.target.value)}
                          className="text-xs bg-white"
                          required
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-1">
                        <Label className="text-[11px] font-semibold text-slate-700">
                          Produto *
                        </Label>
                        <Input
                          value={it.produto}
                          onChange={(e) => atualizarItemInteresse(idx, 'produto', e.target.value)}
                          className="text-xs bg-white"
                          required
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-1">
                        <Label className="text-[11px] font-semibold text-slate-700">
                          Capacidade (mil m³/dia) *
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={it.capacidade}
                          onChange={(e) =>
                            atualizarItemInteresse(
                              idx,
                              'capacidade',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="text-xs font-mono bg-white"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 text-xs font-medium text-slate-700">
                Capacidade Total Manifestada:{' '}
                <strong className="text-[#0a2540] ml-1.5 font-mono">
                  {capacidadeTotalManifestada.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}{' '}
                  mil m³/dia
                </strong>
              </div>
            </CardContent>
          </Card>

          {/* DECLARAÇÕES DA MANIFESTAÇÃO */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
                1.5 Declarações Regulatórias da Manifestação
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {[
                {
                  id: 'decM1',
                  state: decRegrasMasterManif,
                  setter: setDecRegrasMasterManif,
                  text: 'Declara estar ciente e de pleno acordo com as regras apresentadas no Contrato Master e no edital do POC da TSB.',
                },
                {
                  id: 'decM2',
                  state: decCamposObrigatoriosManif,
                  setter: setDecCamposObrigatoriosManif,
                  text: 'Declara que preencherá os campos obrigatórios de solicitação de capacidade no POC, inclusive quanto aos diferentes níveis tarifários.',
                },
                {
                  id: 'decM3',
                  state: decCapacidadeMaiorZeroManif,
                  setter: setDecCapacidadeMaiorZeroManif,
                  text: 'Declara que a capacidade solicitada é estritamente superior a zero e reflete a demanda estimada da sociedade.',
                },
                {
                  id: 'decM4',
                  state: decCronogramaManif,
                  setter: setDecCronogramaManif,
                  text: 'Declara compromisso com o cumprimento integral das datas e prazos estabelecidos no cronograma oficial homologado pela ANP.',
                },
                {
                  id: 'decM5',
                  state: decAssinaturaRepManif,
                  setter: setDecAssinaturaRepManif,
                  text: 'Declara que o formulário foi subscrito por representante autorizado com poderes societários válidos e vigentes.',
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

          {/* GERAÇÃO E ANEXO DO PDF DA MANIFESTAÇÃO */}
          <Card className="border-2 border-[#0284c7]/40 bg-sky-50/30 shadow-xs">
            <CardHeader className="pb-3 border-b border-sky-100 bg-white">
              <CardTitle className="text-sm font-bold text-[#0a2540] font-display flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0284c7]" />
                1.6 Geração, Assinatura e Anexo do PDF da Manifestação
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Baixe o formulário oficial preenchido, assine eletronicamente fora do sistema e
                anexe o PDF assinado. O envio final acontecerá na Etapa 3.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <strong className="text-xs font-bold text-[#0a2540] block">
                    Passo A: Baixar o Formulário Oficial Preenchido
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    Gera o modelo oficial com protocolo provisório {protocolo}
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={handleBaixarPdfManifestacao}
                  disabled={gerandoPdfManif}
                  className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-semibold shrink-0"
                >
                  {gerandoPdfManif ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 mr-1.5 text-sky-300" />
                      Baixar PDF Preenchido
                    </>
                  )}
                </Button>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-[#0a2540] block">
                    Passo B: Anexar o PDF da Manifestação Assinado *
                  </strong>
                  {arquivoManifAssinado && (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="h-3 w-3" />
                      Anexado: {arquivoManifAssinado.name}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Faça o upload do PDF assinado pelo Representante Autorizado (Gov.br, ICP-Brasil ou
                  assinatura eletrônica qualificada).
                </p>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setArquivoManifAssinado(f)
                  }}
                  className="text-xs cursor-pointer bg-slate-50"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-sky-100">
                <span className="text-[11px] text-slate-500">
                  Após anexar o PDF assinado, avance para a Etapa 2 (Proposta Garantida).
                </span>
                <Button
                  type="submit"
                  disabled={!arquivoManifAssinado}
                  className="bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold px-6"
                >
                  Avançar para Etapa 2: Proposta Garantida
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 2: PROPOSTA GARANTIDA VINCULANTE */}
      {/* ========================================================================= */}
      {etapa === 2 && (
        <form onSubmit={handleAvancarParaEtapa3} className="space-y-6">
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
                  2.1 Representante Legal para Assunção de Obrigações Vinculantes
                </CardTitle>
                <span className="text-[11px] text-red-800 bg-red-50 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-red-200">
                  Vinculante com Garantia
                </span>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Representante com poderes societários ou procuração com cláusula expressa para
                aporte de garantias e celebração de contrato
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Nome do Representante Legal *
                  </Label>
                  <Input
                    value={repNomeProp}
                    onChange={(e) => setRepNomeProp(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">CPF *</Label>
                  <Input
                    value={repCpfProp}
                    onChange={(e) => setRepCpfProp(e.target.value)}
                    placeholder="000.000.000-00"
                    className="text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Cargo / Função *</Label>
                  <Input
                    value={repCargoProp}
                    onChange={(e) => setRepCargoProp(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">RG / Órgão Emissor</Label>
                  <Input
                    value={`${repRgProp} ${repOrgaoEmissorProp}`}
                    onChange={(e) => setRepRgProp(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    E-mail Corporativo *
                  </Label>
                  <Input
                    type="email"
                    value={repEmailProp}
                    onChange={(e) => setRepEmailProp(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DADOS DA PROPOSTA FIRME */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
                2.2 Parâmetros da Proposta Firme e Critério de Leilão
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Produto, capacidade diária solicitada e regra para leilão ascendente de capacidade
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Produto da Proposta *
                  </Label>
                  <Input
                    value={produtoProp}
                    onChange={(e) => setProdutoProp(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Ponto / Zona *</Label>
                  <Input
                    value={pontoZonaProp}
                    onChange={(e) => setPontoZonaProp(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Capacidade Firme Proposta (mil m³/dia) *
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={capacidadeProp}
                    onChange={(e) => setCapacidadeProp(e.target.value)}
                    className="text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Tarifa de Referência Aceita (R$/MMBtu) *
                  </Label>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={tarifaTransporteProp}
                    onChange={(e) => setTarifaTransporteProp(e.target.value)}
                    className="text-xs font-mono"
                    required
                  />
                </div>
              </div>

              {/* CRITÉRIO DE LEILÃO ASCENDENTE */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <Label className="text-xs font-semibold text-slate-800 block">
                  Regra em Caso de Rateio / Leilão Ascendente (Art. 37-A, § 5º, III):
                </Label>
                <RadioGroup
                  value={criterioLeilaoProp}
                  onValueChange={(v) => setCriterioLeilaoProp(v as CriterioLeilaoTipo)}
                  className="space-y-2 text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="parcialmente" id="crit1" />
                    <Label htmlFor="crit1" className="cursor-pointer text-xs font-normal">
                      Aceita alocação proporcional / parcial da capacidade proposta
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="minima" id="crit2" />
                    <Label htmlFor="crit2" className="cursor-pointer text-xs font-normal">
                      Aceita alocação parcial desde que superior à Capacidade Mínima
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="integral" id="crit3" />
                    <Label htmlFor="crit3" className="cursor-pointer text-xs font-normal">
                      Condiciona a proposta à alocação 100% integral (tudo ou nada)
                    </Label>
                  </div>
                </RadioGroup>

                {criterioLeilaoProp === 'minima' && (
                  <div className="pt-2 max-w-xs space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">
                      Capacidade Mínima Aceita (mil m³/dia) *
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={capacidadeMinimaProp}
                      onChange={(e) => setCapacidadeMinimaProp(e.target.value)}
                      className="text-xs font-mono bg-white"
                      required
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* GARANTIA FINANCEIRA DA PROPOSTA */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
                2.3 Garantia Financeira da Proposta (Obrigatória)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Instrumento financeiro idôneo que cauciona a formalização do contrato
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Modalidade de Garantia *
                  </Label>
                  <select
                    value={garantiaTipo}
                    onChange={(e) => setGarantiaTipo(e.target.value as GarantiaTipo)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0284c7]"
                    required
                  >
                    <option value="Fiança Bancária">Fiança Bancária</option>
                    <option value="Seguro Garantia">Seguro Garantia</option>
                    <option value="Depósito Caução">Depósito Caução</option>
                    <option value="Carta de Crédito">Carta de Crédito</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Valor da Garantia (R$) *
                  </Label>
                  <Input
                    type="number"
                    step="1000"
                    min="1"
                    value={garantiaValor}
                    onChange={(e) => setGarantiaValor(e.target.value)}
                    className="text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Instituição Emissora *
                  </Label>
                  <Input
                    value={garantiaInstituicao}
                    onChange={(e) => setGarantiaInstituicao(e.target.value)}
                    placeholder="Ex: Banco Santander / Apólice Porto Seguro"
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              {/* UPLOAD DO COMPROVANTE DE GARANTIA */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-800">
                    Comprovante / Instrumento de Garantia Financeira (Anexo Obrigatório) *
                  </Label>
                  {arquivoGarantia && (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                      ✓ {arquivoGarantia.name}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Anexe o documento comprobatório da emissão da garantia (fiança bancária, apólice
                  do seguro ou comprovante de caução). Formatos: PDF, ZIP, JPG ou PNG.
                </p>
                <Input
                  type="file"
                  accept="application/pdf,application/zip,image/jpeg,image/png"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setArquivoGarantia(f)
                  }}
                  className="text-xs cursor-pointer bg-white"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* DECLARAÇÕES VINCULANTES */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
                2.4 Compromisso Irrevogável e Declarações Vinculantes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {[
                {
                  id: 'decP1',
                  state: decCelebrarContrato,
                  setter: setDecCelebrarContrato,
                  text: 'Caso a presente Proposta Garantida seja vencedora, o Carregador Habilitado compromete-se, de forma irrevogável e irretratável, a celebrar Contrato de Transporte com a TSB.',
                },
                {
                  id: 'decP2',
                  state: decExecucaoDesistencia,
                  setter: setDecExecucaoDesistencia,
                  text: 'Declara plena ciência de que a desistência do POC após a submissão desta proposta implicará a execução integral da Garantia Financeira aportada.',
                },
                {
                  id: 'decP3',
                  state: decExecucaoNaoAssinatura,
                  setter: setDecExecucaoNaoAssinatura,
                  text: 'Declara plena ciência de que a não assinatura do Contrato de Transporte no prazo do cronograma oficial implicará a execução imediata da Garantia Financeira.',
                },
                {
                  id: 'decP4',
                  state: decRegrasMasterProp,
                  setter: setDecRegrasMasterProp,
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

          {/* GERAÇÃO E ANEXO DO PDF DA PROPOSTA GARANTIDA */}
          <Card className="border-2 border-red-200 bg-red-50/20 shadow-xs">
            <CardHeader className="pb-3 border-b border-red-100 bg-white">
              <CardTitle className="text-sm font-bold text-[#0a2540] font-display flex items-center gap-2">
                <FileText className="h-4 w-4 text-red-600" />
                2.5 Geração, Assinatura e Anexo do PDF da Proposta Garantida
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Baixe a Proposta em PDF com o protocolo {protocolo}, realize a assinatura fora do
                sistema e anexe o arquivo assinado.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <strong className="text-xs font-bold text-[#0a2540] block">
                    Passo A: Baixar a Proposta Garantida Preenchida
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    Documento formal de proposta com protocolo {protocolo}
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={handleBaixarPdfProposta}
                  disabled={gerandoPdfProp}
                  className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-semibold shrink-0"
                >
                  {gerandoPdfProp ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 mr-1.5 text-sky-300" />
                      Baixar Proposta em PDF
                    </>
                  )}
                </Button>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-[#0a2540] block">
                    Passo B: Anexar o PDF da Proposta Assinado *
                  </strong>
                  {arquivoPropAssinado && (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="h-3 w-3" />
                      Anexado: {arquivoPropAssinado.name}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Faça o upload do documento assinado pelo Representante Legal.
                </p>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setArquivoPropAssinado(f)
                  }}
                  className="text-xs cursor-pointer bg-slate-50"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-red-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEtapa(1)}
                  className="text-xs text-slate-600"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Voltar para Etapa 1
                </Button>
                <Button
                  type="submit"
                  disabled={!arquivoPropAssinado || !arquivoGarantia}
                  className="bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold px-6"
                >
                  Avançar para Etapa 3: Revisão e Envio
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 3: REVISÃO E ENVIO DEFINITIVO */}
      {/* ========================================================================= */}
      {etapa === 3 && (
        <div className="space-y-6">
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-[#0a2540] font-display flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#0284c7]" />
                  Revisão Integrada da Submissão (Art. 37-A, §5º)
                </CardTitle>
                <Badge className="bg-[#0a2540] text-white text-xs font-mono">
                  Protocolo: {protocolo}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Confira o resumo geral antes de efetivar o envio. Ao submeter, os dados e os 3
                arquivos serão persistidos de forma única e o comprovante será enviado ao seu
                e-mail.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-6">
              {/* DADOS DA EMPRESA */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#0a2540] block uppercase tracking-wider">
                  Carregador Habilitado e Contato
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Razão Social:</span>
                    <strong className="text-slate-900">{razaoSocial}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">CNPJ:</span>
                    <strong className="text-slate-900 font-mono">{cnpj}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">E-mail para Protocolo:</span>
                    <strong className="text-slate-900 font-mono text-[#0284c7]">
                      {contatoEmail}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Pessoa de Contato:</span>
                    <strong className="text-slate-900">{contatoNome}</strong>
                  </div>
                </div>
              </div>

              {/* RESUMO ETAPA 1 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0a2540] block uppercase tracking-wider">
                    Etapa 1 · Manifestação de Interesse
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEtapa(1)}
                    className="text-[11px] text-[#0284c7] hover:underline h-auto p-0"
                  >
                    Editar dados da Etapa 1
                  </Button>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-500 block text-[11px]">
                        Representante Autorizado:
                      </span>
                      <strong className="text-slate-900">
                        {repNomeManif} (CPF: {repCpfManif})
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">
                        Capacidade Total Manifestada:
                      </span>
                      <strong className="text-slate-900 font-mono">
                        {capacidadeTotalManifestada.toLocaleString('pt-BR')} mil m³/dia
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">
                        Pontos/Zonas Demandados:
                      </span>
                      <span className="text-slate-800">
                        {itensInteresse.map((it) => it.pontoZona).join('; ')}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
                    <FileCheck2 className="h-4 w-4 text-emerald-600" />
                    <span>
                      Anexo da Etapa 1: <strong>{arquivoManifAssinado?.name}</strong> (
                      {((arquivoManifAssinado?.size || 0) / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
              </div>

              {/* RESUMO ETAPA 2 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0a2540] block uppercase tracking-wider">
                    Etapa 2 · Proposta Garantida Vinculante
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEtapa(2)}
                    className="text-[11px] text-[#0284c7] hover:underline h-auto p-0"
                  >
                    Editar dados da Etapa 2
                  </Button>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Representante Legal:</span>
                      <strong className="text-slate-900">
                        {repNomeProp} (CPF: {repCpfProp})
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Capacidade Proposta:</span>
                      <strong className="text-slate-900 font-mono">
                        {Number(capacidadeProp).toLocaleString('pt-BR')} mil m³/dia
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Tarifa Aceita:</span>
                      <strong className="text-slate-900 font-mono">
                        R$ {Number(tarifaTransporteProp).toFixed(4)} / MMBtu
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Garantia Aportada:</span>
                      <strong className="text-slate-900">
                        {garantiaTipo} &bull; R$ {Number(garantiaValor).toLocaleString('pt-BR')}
                      </strong>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 space-y-1 text-[11px] text-emerald-800 font-medium">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-emerald-600" />
                      <span>
                        Anexo da Proposta: <strong>{arquivoPropAssinado?.name}</strong> (
                        {((arquivoPropAssinado?.size || 0) / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-emerald-600" />
                      <span>
                        Comprovante da Garantia: <strong>{arquivoGarantia?.name}</strong> (
                        {((arquivoGarantia?.size || 0) / 1024).toFixed(1)} KB) &bull;{' '}
                        {garantiaInstituicao}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AVISO DO DISPARO DE E-MAIL E PROTOCOLO */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-950 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <strong className="font-semibold text-emerald-950">
                    Expedição Automática de Protocolo por E-mail:
                  </strong>
                </div>
                <p className="text-emerald-900 leading-relaxed text-[11px]">
                  Ao clicar em <strong>"Confirmar e Enviar Submissão"</strong>, o registro formal
                  será gravado com o protocolo <strong>{protocolo}</strong> e um e-mail oficial será
                  automaticamente enviado para <strong>{contatoEmail}</strong> através do servidor
                  corporativo da TSB com o comprovante em anexo e o resumo regulatório.
                </p>
              </div>

              {/* BOTÕES FINAIS */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEtapa(2)}
                  disabled={enviando}
                  className="text-xs text-slate-600"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Voltar para Etapa 2
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmeterDefinitivo}
                  disabled={enviando}
                  className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-semibold px-8 py-2.5 h-auto cursor-pointer shadow-sm"
                >
                  {enviando ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Persistindo e Enviando E-mail...
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="h-4 w-4 mr-2 text-sky-300" />
                      Confirmar e Enviar Submissão Completa
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
