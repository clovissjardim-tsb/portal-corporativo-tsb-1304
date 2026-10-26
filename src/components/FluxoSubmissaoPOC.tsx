import React, { useState, useEffect } from 'react'
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
  Info,
  HelpCircle,
  FileSignature,
  Send,
  Building2,
  Award,
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

const STORAGE_KEY_FORM_POC = 'tsb_poc_form_draft_v2'

export function FluxoSubmissaoPOC({ onVoltar, onSucesso, dadosPadrao }: FluxoSubmissaoPOCProps) {
  // Protocolo Único da Submissão Completa (ex: POC-2026-XXXX)
  const [protocolo] = useState<string>(() => {
    const saved = sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_protocolo`)
    if (saved) return saved
    const novo = gerarProtocoloPOC('POC')
    sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_protocolo`, novo)
    return novo
  })

  // Etapa aberta (1, 2 ou 3) - O usuário pode alternar livremente entre elas
  const [etapa, setEtapa] = useState<EtapaFluxo>(1)

  // Status de conclusão/download das etapas independentes
  const [etapa1Concluida, setEtapa1Concluida] = useState<boolean>(() => {
    return sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_etapa1_ok`) === 'true'
  })
  const [etapa2Concluida, setEtapa2Concluida] = useState<boolean>(() => {
    return sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_etapa2_ok`) === 'true'
  })

  // -------------------------------------------------------------
  // DADOS GERAIS DO CARREGADOR
  // -------------------------------------------------------------
  const [razaoSocial, setRazaoSocial] = useState(
    () =>
      sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_razaoSocial`) ||
      dadosPadrao?.razaoSocial ||
      '',
  )
  const [sedeEndereco, setSedeEndereco] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_sedeEndereco`) || '',
  )
  const [inscricaoEstadual, setInscricaoEstadual] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_inscricaoEstadual`) || '',
  )
  const [cnpj, setCnpj] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_cnpj`) || dadosPadrao?.cnpj || '',
  )
  const [atividadePrincipal, setAtividadePrincipal] = useState(
    () =>
      sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_atividadePrincipal`) ||
      'Comercialização de Gás Natural',
  )
  const [codigoCnae, setCodigoCnae] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_codigoCnae`) || '35.20-4-02',
  )
  const [atividadeSecundariaCnae, setAtividadeSecundariaCnae] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_atividadeSecundariaCnae`) || '',
  )
  const [autorizacaoAnp, setAutorizacaoAnp] = useState(
    () =>
      sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_autorizacaoAnp`) ||
      dadosPadrao?.autorizacaoAnp ||
      '',
  )
  const [sitioEletronico, setSitioEletronico] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_sitioEletronico`) || '',
  )
  const [telefone, setTelefone] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_telefone`) || dadosPadrao?.telefone || '',
  )

  // Contato geral
  const [contatoNome, setContatoNome] = useState(
    () =>
      sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_contatoNome`) ||
      dadosPadrao?.responsavel ||
      '',
  )
  const [contatoTelefone, setContatoTelefone] = useState(
    () =>
      sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_contatoTelefone`) ||
      dadosPadrao?.telefone ||
      '',
  )
  const [contatoEmail, setContatoEmail] = useState(
    () =>
      sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_contatoEmail`) || dadosPadrao?.email || '',
  )
  const [contatoEndereco, setContatoEndereco] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_contatoEndereco`) || '',
  )

  // -------------------------------------------------------------
  // ETAPA 1: MANIFESTAÇÃO DE INTERESSE
  // -------------------------------------------------------------
  const [repNomeManif, setRepNomeManif] = useState(
    () =>
      sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repNomeManif`) ||
      dadosPadrao?.responsavel ||
      '',
  )
  const [repNacionalidadeManif, setRepNacionalidadeManif] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repNacionalidadeManif`) || 'Brasileira',
  )
  const [repEstadoCivilManif, setRepEstadoCivilManif] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repEstadoCivilManif`) || 'Casado(a)',
  )
  const [repDataNascimentoManif, setRepDataNascimentoManif] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repDataNascimentoManif`) || '',
  )
  const [repProfissaoManif, setRepProfissaoManif] = useState(
    () =>
      sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repProfissaoManif`) || 'Diretor de Regulação',
  )
  const [repCargoManif, setRepCargoManif] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repCargoManif`) || 'Diretor Estatutário',
  )
  const [repCredenciamentoManif, setRepCredenciamentoManif] = useState(
    () =>
      sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repCredenciamentoManif`) ||
      'OAB/RS ou CRA/RS',
  )
  const [repRgManif, setRepRgManif] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repRgManif`) || '',
  )
  const [repOrgaoEmissorManif, setRepOrgaoEmissorManif] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repOrgaoEmissorManif`) || 'SSP/RS',
  )
  const [repCpfManif, setRepCpfManif] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repCpfManif`) || '',
  )
  const [repEmailManif, setRepEmailManif] = useState(
    () =>
      sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repEmailManif`) || dadosPadrao?.email || '',
  )
  const [repEnderecoManif, setRepEnderecoManif] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repEnderecoManif`) || '',
  )

  const [itensInteresse, setItensInteresse] = useState<ItemTabelaInteresse[]>(() => {
    const salvo = sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_itensInteresse`)
    if (salvo) {
      try {
        return JSON.parse(salvo)
      } catch {
        /* fallback */
      }
    }
    return [
      {
        pontoZona: 'Ponto de Entrada Paso de Los Libres (Fronteira)',
        produto: 'Produto Anual 2026/2027 (Firme)',
        capacidade: 150.0,
      },
    ]
  })

  const [decRegrasMasterManif, setDecRegrasMasterManif] = useState(true)
  const [decCamposObrigatoriosManif, setDecCamposObrigatoriosManif] = useState(true)
  const [decCapacidadeMaiorZeroManif, setDecCapacidadeMaiorZeroManif] = useState(true)
  const [decCronogramaManif, setDecCronogramaManif] = useState(true)
  const [decAssinaturaRepManif, setDecAssinaturaRepManif] = useState(true)

  const [gerandoPdfManif, setGerandoPdfManif] = useState(false)

  // -------------------------------------------------------------
  // ETAPA 2: PROPOSTA GARANTIDA VINCULANTE
  // -------------------------------------------------------------
  const [repNomeProp, setRepNomeProp] = useState(
    () =>
      sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repNomeProp`) ||
      dadosPadrao?.responsavel ||
      '',
  )
  const [repNacionalidadeProp, setRepNacionalidadeProp] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repNacionalidadeProp`) || 'Brasileira',
  )
  const [repEstadoCivilProp, setRepEstadoCivilProp] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repEstadoCivilProp`) || 'Casado(a)',
  )
  const [repDataNascimentoProp, setRepDataNascimentoProp] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repDataNascimentoProp`) || '',
  )
  const [repProfissaoProp, setRepProfissaoProp] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repProfissaoProp`) || 'Diretor Executivo',
  )
  const [repCargoProp, setRepCargoProp] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repCargoProp`) || 'Diretor-Presidente',
  )
  const [repCredenciamentoProp, setRepCredenciamentoProp] = useState(
    () =>
      sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repCredenciamentoProp`) || 'OAB/RS ou CRA/RS',
  )
  const [repRgProp, setRepRgProp] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repRgProp`) || '',
  )
  const [repOrgaoEmissorProp, setRepOrgaoEmissorProp] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repOrgaoEmissorProp`) || 'SSP/RS',
  )
  const [repCpfProp, setRepCpfProp] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repCpfProp`) || '',
  )
  const [repEmailProp, setRepEmailProp] = useState(
    () =>
      sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repEmailProp`) || dadosPadrao?.email || '',
  )
  const [repEnderecoProp, setRepEnderecoProp] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_repEnderecoProp`) || '',
  )

  const [produtoProp, setProdutoProp] = useState(
    () =>
      sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_produtoProp`) ||
      'Produto Anual 2026/2027 (Firme)',
  )
  const [pontoZonaProp, setPontoZonaProp] = useState(
    () =>
      sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_pontoZonaProp`) ||
      'Zona de Saída Triunfo (Polo Petroquímico)',
  )
  const [capacidadeProp, setCapacidadeProp] = useState<number | string>(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_capacidadeProp`) || 150.0,
  )
  const [tarifaTransporteProp, setTarifaTransporteProp] = useState<number | string>(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_tarifaTransporteProp`) || 4.8521,
  )
  const [criterioLeilaoProp, setCriterioLeilaoProp] = useState<CriterioLeilaoTipo>(
    () =>
      (sessionStorage.getItem(
        `${STORAGE_KEY_FORM_POC}_criterioLeilaoProp`,
      ) as CriterioLeilaoTipo) || 'parcialmente',
  )
  const [capacidadeMinimaProp, setCapacidadeMinimaProp] = useState<number | string>(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_capacidadeMinimaProp`) || 100.0,
  )

  const [garantiaTipo, setGarantiaTipo] = useState<GarantiaTipo>(
    () =>
      (sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_garantiaTipo`) as GarantiaTipo) ||
      'Fiança Bancária',
  )
  const [garantiaValor, setGarantiaValor] = useState<number | string>(
    () => sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_garantiaValor`) || 500000.0,
  )
  const [garantiaInstituicao, setGarantiaInstituicao] = useState(
    () =>
      sessionStorage.getItem(`${STORAGE_KEY_FORM_POC}_garantiaInstituicao`) ||
      'Banco do Brasil S.A. / Carta de Fiança',
  )

  const [decCelebrarContrato, setDecCelebrarContrato] = useState(true)
  const [decExecucaoDesistencia, setDecExecucaoDesistencia] = useState(true)
  const [decExecucaoNaoAssinatura, setDecExecucaoNaoAssinatura] = useState(true)
  const [decRegrasMasterProp, setDecRegrasMasterProp] = useState(true)

  const [gerandoPdfProp, setGerandoPdfProp] = useState(false)

  // -------------------------------------------------------------
  // ETAPA 3: ANEXOS E ENVIO DEFINITIVO (3 ARQUIVOS)
  // -------------------------------------------------------------
  const [arquivoManifAssinado, setArquivoManifAssinado] = useState<File | null>(null)
  const [arquivoPropAssinado, setArquivoPropAssinado] = useState<File | null>(null)
  const [arquivoGarantia, setArquivoGarantia] = useState<File | null>(null)

  // -------------------------------------------------------------
  // CONTROLE DE ERROS E SUBMISSÃO FINAL
  // -------------------------------------------------------------
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Salvar no sessionStorage para preservar o rascunho durante a navegação
  useEffect(() => {
    try {
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_razaoSocial`, razaoSocial)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_sedeEndereco`, sedeEndereco)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_inscricaoEstadual`, inscricaoEstadual)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_cnpj`, cnpj)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_atividadePrincipal`, atividadePrincipal)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_codigoCnae`, codigoCnae)
      sessionStorage.setItem(
        `${STORAGE_KEY_FORM_POC}_atividadeSecundariaCnae`,
        atividadeSecundariaCnae,
      )
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_autorizacaoAnp`, autorizacaoAnp)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_sitioEletronico`, sitioEletronico)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_telefone`, telefone)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_contatoNome`, contatoNome)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_contatoTelefone`, contatoTelefone)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_contatoEmail`, contatoEmail)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_contatoEndereco`, contatoEndereco)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_repNomeManif`, repNomeManif)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_repCpfManif`, repCpfManif)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_repCargoManif`, repCargoManif)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_repEmailManif`, repEmailManif)
      sessionStorage.setItem(
        `${STORAGE_KEY_FORM_POC}_itensInteresse`,
        JSON.stringify(itensInteresse),
      )
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_repNomeProp`, repNomeProp)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_repCpfProp`, repCpfProp)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_repCargoProp`, repCargoProp)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_repEmailProp`, repEmailProp)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_produtoProp`, produtoProp)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_pontoZonaProp`, pontoZonaProp)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_capacidadeProp`, String(capacidadeProp))
      sessionStorage.setItem(
        `${STORAGE_KEY_FORM_POC}_tarifaTransporteProp`,
        String(tarifaTransporteProp),
      )
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_criterioLeilaoProp`, criterioLeilaoProp)
      sessionStorage.setItem(
        `${STORAGE_KEY_FORM_POC}_capacidadeMinimaProp`,
        String(capacidadeMinimaProp),
      )
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_garantiaTipo`, garantiaTipo)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_garantiaValor`, String(garantiaValor))
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_garantiaInstituicao`, garantiaInstituicao)
    } catch {
      /* ignore */
    }
  }, [
    razaoSocial,
    sedeEndereco,
    inscricaoEstadual,
    cnpj,
    atividadePrincipal,
    codigoCnae,
    atividadeSecundariaCnae,
    autorizacaoAnp,
    sitioEletronico,
    telefone,
    contatoNome,
    contatoTelefone,
    contatoEmail,
    contatoEndereco,
    repNomeManif,
    repCpfManif,
    repCargoManif,
    repEmailManif,
    itensInteresse,
    repNomeProp,
    repCpfProp,
    repCargoProp,
    repEmailProp,
    produtoProp,
    pontoZonaProp,
    capacidadeProp,
    tarifaTransporteProp,
    criterioLeilaoProp,
    capacidadeMinimaProp,
    garantiaTipo,
    garantiaValor,
    garantiaInstituicao,
  ])

  // Handlers para Tabela de Interesse da Etapa 1
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

  const validarFormularioEtapa1 = (): string | null => {
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
      return 'É obrigatório declarar a concordância regulatória na Manifestação de Interesse.'
    }

    return null
  }

  const handleDownloadPdfEtapa1 = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErro(null)

    const val = validarFormularioEtapa1()
    if (val) {
      setErro(val)
      toast({
        title: 'Formulário da Etapa 1 Incompleto',
        description: val,
        variant: 'destructive',
      })
      return
    }

    try {
      setGerandoPdfManif(true)
      const dados = obterDadosManifestacaoPdf()
      await gerarManifestacaoInteressePdf(dados)
      setEtapa1Concluida(true)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_etapa1_ok`, 'true')

      // Sincroniza representante na etapa 2 se ainda estiver em branco
      if (!repNomeProp.trim()) setRepNomeProp(repNomeManif)
      if (!repCpfProp.trim()) setRepCpfProp(repCpfManif)
      if (!repEmailProp.trim()) setRepEmailProp(repEmailManif)
      if (!repCargoProp.trim()) setRepCargoProp(repCargoManif)

      toast({
        title: 'Etapa 1 Concluída! PDF baixado',
        description: `O arquivo Manifestacao-Interesse-POC-${protocolo}.pdf foi baixado com sucesso. Assine digitalmente e anexe-o na Etapa 3.`,
      })
    } catch (err: any) {
      console.error('Erro ao gerar PDF da manifestação:', err)
      setErro('Falha na geração do PDF: ' + (err.message || 'tente novamente.'))
    } finally {
      setGerandoPdfManif(false)
    }
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
      repNome: repNomeProp.trim() || repNomeManif.trim(),
      repNacionalidade: repNacionalidadeProp.trim(),
      repEstadoCivil: repEstadoCivilProp.trim(),
      repDataNascimento: repDataNascimentoProp.trim(),
      repProfissao: repProfissaoProp.trim(),
      repCargo: repCargoProp.trim(),
      repCredenciamento: repCredenciamentoProp.trim(),
      repRg: repRgProp.trim(),
      repOrgaoEmissor: repOrgaoEmissorProp.trim(),
      repCpf: repCpfProp.trim() || repCpfManif.trim(),
      repEmail: repEmailProp.trim() || repEmailManif.trim(),
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
      garantiaArquivoNome: arquivoGarantia?.name || 'Comprovante a anexar na Etapa 3',
      dataDocumento: new Date().toLocaleDateString('pt-BR'),
      local: 'Porto Alegre / RS',
    }
  }

  const validarFormularioEtapa2 = (): string | null => {
    if (!razaoSocial.trim()) return 'Preencha a Razão Social do Carregador (na Etapa 1 ou 2).'
    if (!cnpj.trim()) return 'Preencha o CNPJ do Carregador (na Etapa 1 ou 2).'
    if (!repNomeProp.trim() && !repNomeManif.trim())
      return 'Preencha o nome do Representante Legal da Proposta.'
    if (!repCpfProp.trim() && !repCpfManif.trim())
      return 'Preencha o CPF do Representante Legal da Proposta.'
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
      return 'É obrigatório assinalar todas as declarações de compromisso vinculante.'
    }

    return null
  }

  const handleDownloadPdfEtapa2 = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErro(null)

    const val = validarFormularioEtapa2()
    if (val) {
      setErro(val)
      toast({
        title: 'Formulário da Etapa 2 Incompleto',
        description: val,
        variant: 'destructive',
      })
      return
    }

    try {
      setGerandoPdfProp(true)
      const dados = obterDadosPropostaPdf()
      await gerarPropostaGarantidaPdf(dados)
      setEtapa2Concluida(true)
      sessionStorage.setItem(`${STORAGE_KEY_FORM_POC}_etapa2_ok`, 'true')

      toast({
        title: 'Etapa 2 Concluída! PDF baixado',
        description: `O arquivo Proposta-Garantida-POC-${protocolo}.pdf foi baixado com sucesso. Assine digitalmente e anexe-o na Etapa 3.`,
      })
    } catch (err: any) {
      console.error('Erro ao gerar PDF da proposta:', err)
      setErro('Falha na geração do PDF: ' + (err.message || 'tente novamente.'))
    } finally {
      setGerandoPdfProp(false)
    }
  }

  // -------------------------------------------------------------
  // ETAPA 3: ANEXOS E ENVIO DEFINITIVO
  // -------------------------------------------------------------
  const handleSubmeterDefinitivo = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    // Validações básicas de dados dos formulários
    const val1 = validarFormularioEtapa1()
    if (val1) {
      setErro(`Formulário da Etapa 1 pendente: ${val1}`)
      toast({ title: 'Atenção', description: `Dados da Etapa 1: ${val1}`, variant: 'destructive' })
      return
    }

    const val2 = validarFormularioEtapa2()
    if (val2) {
      setErro(`Formulário da Etapa 2 pendente: ${val2}`)
      toast({ title: 'Atenção', description: `Dados da Etapa 2: ${val2}`, variant: 'destructive' })
      return
    }

    // Validação estrita dos 3 anexos na Etapa 3
    if (!arquivoManifAssinado) {
      const msg =
        'Anexo Obrigatório (a): Faça o upload do PDF da Manifestação de Interesse assinado digitalmente.'
      setErro(msg)
      toast({ title: 'Anexo Pendente', description: msg, variant: 'destructive' })
      return
    }

    if (!arquivoPropAssinado) {
      const msg =
        'Anexo Obrigatório (b): Faça o upload do PDF da Proposta Garantida assinado digitalmente.'
      setErro(msg)
      toast({ title: 'Anexo Pendente', description: msg, variant: 'destructive' })
      return
    }

    if (!arquivoGarantia) {
      const msg = `Anexo Obrigatório (c): Faça o upload do Comprovante da Garantia Financeira (${garantiaTipo}).`
      setErro(msg)
      toast({ title: 'Comprovante Pendente', description: msg, variant: 'destructive' })
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
        rep_legal_nome: repNomeProp.trim() || repNomeManif.trim(),
        rep_legal_cpf: repCpfProp.trim() || repCpfManif.trim(),
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

      // Limpar rascunho da sessão
      try {
        sessionStorage.removeItem(`${STORAGE_KEY_FORM_POC}_protocolo`)
        sessionStorage.removeItem(`${STORAGE_KEY_FORM_POC}_etapa1_ok`)
        sessionStorage.removeItem(`${STORAGE_KEY_FORM_POC}_etapa2_ok`)
      } catch {
        /* intentionally ignored */
      }

      toast({
        title: 'Processo Concluído com Sucesso!',
        description: `Protocolo único gerado: ${novaSubmissao.protocolo}. O comprovante foi enviado ao seu e-mail corporativo.`,
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
          Voltar para Visão Geral e Meus Protocolos
        </Button>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#0a2540] text-white text-xs font-mono px-3 py-1 tracking-wide">
            Protocolo do Processo: {protocolo}
          </Badge>
          <span className="text-[11px] px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold uppercase">
            3 Etapas Independentes
          </span>
        </div>
      </div>

      {/* 1. BLOCO DO TOPO: EXPLICAÇÃO DO FLUXO DO PROCESSO (CLARO E SUCINTO) */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2 text-[#0a2540]">
            <HelpCircle className="h-4 w-4 text-[#0284c7]" />
            <CardTitle className="text-sm font-bold font-display uppercase tracking-wider text-[#0a2540]">
              Explicação do Fluxo do Processo (POC · Res. ANP nº 961/2023)
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-600">
            Cada etapa é independente para seu preenchimento e download. O envio definitivo acontece
            apenas na Etapa 3.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0a2540] flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-[#0a2540] text-white text-[10px] flex items-center justify-center font-bold">
                    1
                  </span>
                  Etapa 1: Manifestação
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] border-sky-300 text-sky-800 bg-sky-50"
                >
                  Preencher + Baixar PDF
                </Badge>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Preencha os dados do Carregador e a Tabela de Interesse em Capacidade Firme. Faça o
                download do PDF oficial preenchido. <strong>A etapa se encerra no download</strong>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0a2540] flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-[#0a2540] text-white text-[10px] flex items-center justify-center font-bold">
                    2
                  </span>
                  Etapa 2: Proposta Garantida
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] border-amber-300 text-amber-800 bg-amber-50"
                >
                  Preencher + Baixar PDF
                </Badge>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Preencha a proposta com critério de leilão ascendente e dados da Garantia
                Financeira. Faça o download do PDF preenchido. <strong>Também independente</strong>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0a2540] flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-emerald-700 text-white text-[10px] flex items-center justify-center font-bold">
                    3
                  </span>
                  Etapa 3: Anexos e Envio
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] border-emerald-300 text-emerald-800 bg-emerald-50"
                >
                  Envio e Protocolo
                </Badge>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Anexe os dois PDFs assinados digitalmente e o comprovante da Garantia (fiança,
                seguro ou caução).{' '}
                <strong>O processo encerra aqui e você recebe o protocolo por e-mail</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SELETOR DAS 3 ETAPAS INDEPENDENTES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* ETAPA 1 */}
        <button
          type="button"
          onClick={() => setEtapa(1)}
          className={`text-left p-3.5 rounded-lg border transition-all flex items-start gap-3 cursor-pointer ${
            etapa === 1
              ? 'bg-sky-50/80 border-[#0284c7] ring-1 ring-[#0284c7]'
              : 'bg-white hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div
            className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
              etapa1Concluida
                ? 'bg-emerald-600 text-white'
                : etapa === 1
                  ? 'bg-[#0284c7] text-white'
                  : 'bg-slate-200 text-slate-700'
            }`}
          >
            {etapa1Concluida ? <Check className="h-4 w-4" /> : '1'}
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              Etapa 1 (Independente)
            </span>
            <strong className="text-xs text-[#0a2540] block truncate">
              Manifestação de Interesse
            </strong>
            <span className="text-[10px] text-slate-500 block">
              {etapa1Concluida ? '✓ PDF preenchido e baixado' : 'Formulário + Download PDF'}
            </span>
          </div>
        </button>

        {/* ETAPA 2 */}
        <button
          type="button"
          onClick={() => setEtapa(2)}
          className={`text-left p-3.5 rounded-lg border transition-all flex items-start gap-3 cursor-pointer ${
            etapa === 2
              ? 'bg-sky-50/80 border-[#0284c7] ring-1 ring-[#0284c7]'
              : 'bg-white hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div
            className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
              etapa2Concluida
                ? 'bg-emerald-600 text-white'
                : etapa === 2
                  ? 'bg-[#0284c7] text-white'
                  : 'bg-slate-200 text-slate-700'
            }`}
          >
            {etapa2Concluida ? <Check className="h-4 w-4" /> : '2'}
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              Etapa 2 (Independente)
            </span>
            <strong className="text-xs text-[#0a2540] block truncate">Proposta Garantida</strong>
            <span className="text-[10px] text-slate-500 block">
              {etapa2Concluida ? '✓ PDF preenchido e baixado' : 'Formulário + Download PDF'}
            </span>
          </div>
        </button>

        {/* ETAPA 3 */}
        <button
          type="button"
          onClick={() => setEtapa(3)}
          className={`text-left p-3.5 rounded-lg border transition-all flex items-start gap-3 cursor-pointer ${
            etapa === 3
              ? 'bg-sky-50/80 border-[#0284c7] ring-1 ring-[#0284c7]'
              : 'bg-white hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div
            className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
              etapa === 3 ? 'bg-[#0a2540] text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            3
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              Etapa 3 (Final)
            </span>
            <strong className="text-xs text-[#0a2540] block truncate">
              Anexos e Envio Definitivo
            </strong>
            <span className="text-[10px] text-slate-500 block">PDFs assinados + Comprovante</span>
          </div>
        </button>
      </div>

      {erro && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-start gap-2.5 animate-shake">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-semibold block">Pendência identificada:</strong>
            <span>{erro}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 1 — MANIFESTAÇÃO DE INTERESSE (INDEPENDENTE) */}
      {/* ========================================================================= */}
      {etapa === 1 && (
        <div className="space-y-6">
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-slate-900 block">
                  Etapa 1: Preencha o Formulário e Baixe o PDF
                </strong>
                <span className="text-slate-600">
                  Preencha os campos abaixo com os dados cadastrais da empresa e a estimativa de
                  demanda por capacidade firme. Ao clicar em "Baixar PDF da Manifestação de
                  Interesse", o arquivo preenchido será baixado e esta etapa se encerra. Não é
                  necessário anexar nada aqui.
                </span>
              </div>
            </div>
            {etapa1Concluida && (
              <Badge className="bg-emerald-600 text-white shrink-0 text-[10px]">PDF Baixado</Badge>
            )}
          </div>

          <form onSubmit={handleDownloadPdfEtapa1} className="space-y-6">
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
                    1.1 Identificação do Carregador Habilitado
                  </CardTitle>
                  <span className="text-[11px] text-slate-500">Campos obrigatórios (*)</span>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Dados societários e cadastrais do agente requerente
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
                    <Label className="text-xs font-semibold text-slate-700">
                      Sede / Endereço *
                    </Label>
                    <Input
                      value={sedeEndereco}
                      onChange={(e) => setSedeEndereco(e.target.value)}
                      placeholder="Logradouro, número, complemento, bairro, cidade - UF, CEP"
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Inscrição Estadual
                    </Label>
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
                    <Label className="text-xs font-semibold text-slate-700">
                      Telefone Corporativo
                    </Label>
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
                      E-mail Corporativo *
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
              </CardContent>
            </Card>

            {/* CONTATO GERAL */}
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
                <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
                  1.3 Canal de Notificações Oficiais
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Endereço corporativo que receberá o protocolo oficial da submissão
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
                    1.4 Tabela de Demanda por Capacidade Firme
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
                  Adicionar Linha
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
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-700">
                            Ponto / Zona *
                          </Label>
                          <Input
                            value={it.pontoZona}
                            onChange={(e) =>
                              atualizarItemInteresse(idx, 'pontoZona', e.target.value)
                            }
                            className="text-xs bg-white"
                            required
                          />
                        </div>
                        <div className="space-y-1">
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
                        <div className="space-y-1">
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
                    {capacidadeTotalManifestada.toLocaleString('pt-BR', {
                      minimumFractionDigits: 1,
                    })}{' '}
                    mil m³/dia
                  </strong>
                </div>
              </CardContent>
            </Card>

            {/* DECLARAÇÕES */}
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
                <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
                  1.5 Declarações Regulatórias
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
                    text: 'Declara que a capacidade solicitada é estritamente superior a zero e reflete a demanda estimada.',
                  },
                  {
                    id: 'decM4',
                    state: decCronogramaManif,
                    setter: setDecCronogramaManif,
                    text: 'Declara compromisso com o cumprimento dos prazos estabelecidos no cronograma oficial do POC.',
                  },
                  {
                    id: 'decM5',
                    state: decAssinaturaRepManif,
                    setter: setDecAssinaturaRepManif,
                    text: 'Declara que o documento será subscrito por representante com poderes societários válidos.',
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

            {/* BOTÃO DE CONCLUSÃO DA ETAPA 1 (DOWNLOAD EM PDF) */}
            <div className="p-5 bg-sky-50 border-2 border-sky-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <strong className="text-sm font-bold text-[#0a2540] block">
                  Conclusão da Etapa 1: Download do PDF Oficial
                </strong>
                <p className="text-xs text-slate-600">
                  A Etapa 1 encerra com o download do documento gerado. Você deverá assiná-lo
                  digitalmente e anexá-lo na Etapa 3.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={gerandoPdfManif}
                  className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-semibold px-6 py-2.5 h-auto shrink-0 shadow-sm cursor-pointer"
                >
                  {gerandoPdfManif ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2 text-sky-300" />
                      Baixar PDF da Manifestação de Interesse
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEtapa(2)}
                  className="text-xs h-auto py-2.5 border-slate-300"
                >
                  Ir para Etapa 2
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 2 — PROPOSTA GARANTIDA (INDEPENDENTE) */}
      {/* ========================================================================= */}
      {etapa === 2 && (
        <div className="space-y-6">
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-slate-900 block">
                  Etapa 2: Preencha a Proposta Garantida e Baixe o PDF
                </strong>
                <span className="text-slate-600">
                  Defina os parâmetros de capacidade, regra de leilão ascendente e modalidade de
                  garantia financeira. Ao clicar em "Baixar PDF da Proposta Garantida", o documento
                  oficial será gerado e esta etapa se encerra. O comprovante e os PDFs serão
                  anexados juntos na Etapa 3.
                </span>
              </div>
            </div>
            {etapa2Concluida && (
              <Badge className="bg-emerald-600 text-white shrink-0 text-[10px]">PDF Baixado</Badge>
            )}
          </div>

          <form onSubmit={handleDownloadPdfEtapa2} className="space-y-6">
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
                    2.1 Representante Legal para Obrigações Vinculantes
                  </CardTitle>
                  <span className="text-[11px] text-red-800 bg-red-50 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-red-200">
                    Compromisso Vinculante
                  </span>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Representante com poderes societários ou procuração expressa para aporte de
                  garantias
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
                    <Label className="text-xs font-semibold text-slate-700">
                      RG / Órgão Emissor
                    </Label>
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
                  2.2 Parâmetros da Proposta e Critério de Leilão Ascendente
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Produto, capacidade diária solicitada e regra em caso de leilão ascendente (Art.
                  37-A, §5º, III)
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
                      <RadioGroupItem value="totalmente" id="crit3" />
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

            {/* DADOS DA GARANTIA FINANCEIRA */}
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
                <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
                  2.3 Definição da Garantia Financeira da Proposta
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Selecione a modalidade e informe o valor caucionado da garantia (o upload do
                  comprovante será feito na Etapa 3)
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
                      Instituição Emissora / Apólice *
                    </Label>
                    <Input
                      value={garantiaInstituicao}
                      onChange={(e) => setGarantiaInstituicao(e.target.value)}
                      placeholder="Ex: Banco do Brasil / Carta de Fiança"
                      className="text-xs"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DECLARAÇÕES VINCULANTES */}
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
                <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
                  2.4 Declarações e Compromisso Irrevogável
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
                    text: 'Declara plena ciência de que a não assinatura do Contrato de Transporte no prazo do cronograma implicará a execução da Garantia Financeira.',
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

            {/* BOTÃO DE CONCLUSÃO DA ETAPA 2 (DOWNLOAD EM PDF) */}
            <div className="p-5 bg-sky-50 border-2 border-sky-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <strong className="text-sm font-bold text-[#0a2540] block">
                  Conclusão da Etapa 2: Download do PDF Oficial
                </strong>
                <p className="text-xs text-slate-600">
                  A Etapa 2 encerra com o download da proposta preenchida. Você deverá assiná-la e
                  anexá-la na Etapa 3 juntamente com a garantia.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEtapa(1)}
                  className="text-xs h-auto py-2.5 border-slate-300"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Voltar à Etapa 1
                </Button>
                <Button
                  type="submit"
                  disabled={gerandoPdfProp}
                  className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-semibold px-6 py-2.5 h-auto shrink-0 shadow-sm cursor-pointer"
                >
                  {gerandoPdfProp ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2 text-sky-300" />
                      Baixar PDF da Proposta Garantida
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEtapa(3)}
                  className="text-xs h-auto py-2.5 border-slate-300 bg-white"
                >
                  Ir para Etapa 3
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 3 — ANEXOS E ENVIO DEFINITIVO (PROCESSO ENCERRA AQUI) */}
      {/* ========================================================================= */}
      {etapa === 3 && (
        <form onSubmit={handleSubmeterDefinitivo} className="space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-emerald-950 block">
                Etapa 3: Upload dos Arquivos e Envio Definitivo
              </strong>
              <span className="text-emerald-900 leading-relaxed">
                Aqui você anexa: (a) o PDF da Manifestação de Interesse assinado digitalmente, (b) o
                PDF da Proposta Garantida assinado digitalmente e (c) o comprovante da Garantia
                Financeira (fiança bancária, seguro garantia ou depósito caução). Após o envio, o
                processo se encerra definitivamente e você receberá o protocolo por e-mail.
              </span>
            </div>
          </div>

          {/* CARD DE UPLOADS DOS 3 ARQUIVOS */}
          <Card className="border-2 border-[#0a2540]/30 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-[#0a2540] font-display flex items-center gap-2">
                  <Upload className="h-4 w-4 text-[#0284c7]" />
                  Upload dos 3 Arquivos Obrigatórios
                </CardTitle>
                <Badge className="bg-[#0a2540] text-white text-xs font-mono">
                  Protocolo: {protocolo}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Os arquivos serão validados e armazenados de forma unificada no banco corporativo da
                TSB
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              {/* ARQUIVO 1: MANIFESTAÇÃO ASSINADA */}
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <Label className="text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                    <span className="h-4 w-4 rounded-full bg-[#0a2540] text-white text-[10px] flex items-center justify-center font-bold">
                      a
                    </span>
                    PDF da Manifestação de Interesse (Assinado Digitalmente) *
                  </Label>
                  {arquivoManifAssinado && (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="h-3 w-3" />
                      Anexado: {arquivoManifAssinado.name} (
                      {(arquivoManifAssinado.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Upload do PDF obtido na Etapa 1, devidamente assinado eletronicamente pelo
                  Representante Autorizado (Gov.br, ICP-Brasil ou equivalente).
                </p>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setArquivoManifAssinado(f)
                  }}
                  className="text-xs cursor-pointer bg-white"
                  required
                />
              </div>

              {/* ARQUIVO 2: PROPOSTA GARANTIDA ASSINADA */}
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <Label className="text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                    <span className="h-4 w-4 rounded-full bg-[#0a2540] text-white text-[10px] flex items-center justify-center font-bold">
                      b
                    </span>
                    PDF da Proposta Garantida (Assinado Digitalmente) *
                  </Label>
                  {arquivoPropAssinado && (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="h-3 w-3" />
                      Anexado: {arquivoPropAssinado.name} (
                      {(arquivoPropAssinado.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Upload do PDF obtido na Etapa 2, assinado eletronicamente pelo Representante
                  Legal.
                </p>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setArquivoPropAssinado(f)
                  }}
                  className="text-xs cursor-pointer bg-white"
                  required
                />
              </div>

              {/* ARQUIVO 3: COMPROVANTE DA GARANTIA FINANCEIRA */}
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <Label className="text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                    <span className="h-4 w-4 rounded-full bg-[#0a2540] text-white text-[10px] flex items-center justify-center font-bold">
                      c
                    </span>
                    Comprovante da Garantia Financeira ({garantiaTipo}) *
                  </Label>
                  {arquivoGarantia && (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="h-3 w-3" />
                      Anexado: {arquivoGarantia.name} ({(arquivoGarantia.size / 1024).toFixed(1)}{' '}
                      KB)
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[11px] text-slate-500">Tipo de Garantia:</span>
                  <select
                    value={garantiaTipo}
                    onChange={(e) => setGarantiaTipo(e.target.value as GarantiaTipo)}
                    className="h-7 text-xs rounded border border-slate-300 bg-white px-2 text-slate-800"
                  >
                    <option value="Fiança Bancária">Fiança Bancária</option>
                    <option value="Seguro Garantia">Seguro Garantia</option>
                    <option value="Depósito Caução">Depósito Caução</option>
                    <option value="Carta de Crédito">Carta de Crédito</option>
                  </select>
                  <span className="text-[11px] text-slate-500">
                    Valor: <strong>R$ {Number(garantiaValor || 0).toLocaleString('pt-BR')}</strong>{' '}
                    ({garantiaInstituicao})
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Anexe o documento probatório do instrumento financeiro (fiança bancária, apólice
                  de seguro garantia ou comprovante de depósito caução). Formatos aceitos: PDF, ZIP,
                  JPG ou PNG.
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

          {/* RESUMO DOS DADOS GERAIS ANTES DO ENVIO */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
                Resumo Consolidado dos Dados Cadastrais e Técnicos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Carregador:</span>
                  <strong className="text-slate-900">{razaoSocial || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">CNPJ:</span>
                  <strong className="text-slate-900 font-mono">{cnpj || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">E-mail para Protocolo:</span>
                  <strong className="text-slate-900 font-mono text-[#0284c7]">
                    {contatoEmail || '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Representante:</span>
                  <strong className="text-slate-900">{repNomeProp || repNomeManif || '—'}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Manifestação (Etapa 1):</span>
                  <strong className="text-slate-900 font-mono">
                    {capacidadeTotalManifestada.toLocaleString('pt-BR')} mil m³/dia
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">
                    Proposta Firme (Etapa 2):
                  </span>
                  <strong className="text-slate-900 font-mono">
                    {Number(capacidadeProp || 0).toLocaleString('pt-BR')} mil m³/dia (R${' '}
                    {Number(tarifaTransporteProp || 0).toFixed(4)}/MMBtu)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Garantia Financeira:</span>
                  <strong className="text-slate-900">
                    {garantiaTipo} &bull; R$ {Number(garantiaValor || 0).toLocaleString('pt-BR')}
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AVISO DO DISPARO DE E-MAIL E PROTOCOLO */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs text-emerald-950 space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <strong className="font-semibold text-emerald-950">
                Expedição Imediata do Protocolo por E-mail Corporativo:
              </strong>
            </div>
            <p className="text-emerald-900 leading-relaxed text-[11px]">
              Ao clicar em <strong>"Confirmar e Enviar Submissão Completa"</strong>, o processo se
              encerra definitivamente. O número de protocolo <strong>{protocolo}</strong> e os
              arquivos serão persistidos na base oficial da TSB e o e-mail formal com o protocolo e
              o resumo será disparado via SMTP oficial para <strong>{contatoEmail}</strong>.
            </p>
          </div>

          {/* BOTÕES DE NAVEGAÇÃO E ENVIO */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200">
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
              type="submit"
              disabled={
                enviando || !arquivoManifAssinado || !arquivoPropAssinado || !arquivoGarantia
              }
              className="bg-[#0a2540] hover:bg-[#143b73] text-white text-xs font-semibold px-8 py-2.5 h-auto cursor-pointer shadow-sm"
            >
              {enviando ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Persistindo dados e enviando protocolo por e-mail...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2 text-sky-300" />
                  Confirmar e Enviar Submissão Completa (Encerra o Processo)
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
