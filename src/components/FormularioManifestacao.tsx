import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  Download,
  Upload,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowLeft,
  RefreshCw,
  FileText,
  ShieldAlert,
} from 'lucide-react'
import { pocService, gerarProtocoloPOC, ManifestacaoInteressePOC } from '@/services/poc'
import {
  gerarManifestacaoInteressePdf,
  DadosManifestacaoInteressePdf,
  ItemTabelaInteresse,
} from '@/services/formularioManifestacaoPdf'
import { toast } from '@/hooks/use-toast'

interface FormularioManifestacaoProps {
  onVoltar: () => void
  onSucesso: (registro: ManifestacaoInteressePOC) => void
  dadosPadrao?: {
    razaoSocial?: string
    cnpj?: string
    responsavel?: string
    email?: string
    telefone?: string
    autorizacaoAnp?: string
  }
}

export function FormularioManifestacao({
  onVoltar,
  onSucesso,
  dadosPadrao,
}: FormularioManifestacaoProps) {
  // Protocolo já reservado para o documento
  const [protocolo] = useState<string>(() => gerarProtocoloPOC('POC-MI'))

  // Seção 1. Identificação do Interessado
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

  // Seção 2. Representante Autorizado
  const [repNome, setRepNome] = useState(dadosPadrao?.responsavel || '')
  const [repNacionalidade, setRepNacionalidade] = useState('Brasileira')
  const [repEstadoCivil, setRepEstadoCivil] = useState('Casado(a)')
  const [repDataNascimento, setRepDataNascimento] = useState('')
  const [repProfissao, setRepProfissao] = useState('Diretor de Regulação')
  const [repCargo, setRepCargo] = useState('Diretor Estatutário')
  const [repCredenciamento, setRepCredenciamento] = useState('OAB/RS ou CRA/RS')
  const [repRg, setRepRg] = useState('')
  const [repOrgaoEmissor, setRepOrgaoEmissor] = useState('SSP/RS')
  const [repCpf, setRepCpf] = useState('')
  const [repEmail, setRepEmail] = useState(dadosPadrao?.email || '')
  const [repEndereco, setRepEndereco] = useState('')

  // Seção 3. Informações para Contato
  const [contatoNome, setContatoNome] = useState(dadosPadrao?.responsavel || '')
  const [contatoTelefone, setContatoTelefone] = useState(dadosPadrao?.telefone || '')
  const [contatoEmail, setContatoEmail] = useState(dadosPadrao?.email || '')
  const [contatoEndereco, setContatoEndereco] = useState('')

  // Seção 4. Tabela de Interesse (repetível)
  const [itensInteresse, setItensInteresse] = useState<ItemTabelaInteresse[]>([
    {
      pontoZona: 'Ponto de Entrada Paso de Los Libres (Fronteira)',
      produto: 'Produto Anual 2026/2027 (Firme)',
      capacidade: 150.0,
    },
  ])

  // Seção 5. Declarações
  const [decRegrasMaster, setDecRegrasMaster] = useState(false)
  const [decCamposObrigatorios, setDecCamposObrigatorios] = useState(false)
  const [decCapacidadeMaiorZero, setDecCapacidadeMaiorZero] = useState(false)
  const [decCronograma, setDecCronograma] = useState(false)
  const [decAssinaturaRep, setDecAssinaturaRep] = useState(false)

  // Controle de arquivo assinado e submissão
  const [pdfGerado, setPdfGerado] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [arquivoAssinado, setArquivoAssinado] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

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

  const atualizarItem = (index: number, campo: keyof ItemTabelaInteresse, valor: any) => {
    setItensInteresse((prev) => prev.map((it, i) => (i === index ? { ...it, [campo]: valor } : it)))
  }

  // Monta objeto com todos os dados preenchidos
  const obterDadosPreenchidos = (): DadosManifestacaoInteressePdf => {
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
      itensInteresse,
      dataDocumento: new Date().toLocaleDateString('pt-BR'),
      local: 'Porto Alegre / RS',
    }
  }

  // Validação preliminar dos campos
  const validarCampos = (): string | null => {
    if (!razaoSocial.trim()) return 'Preencha a Razão Social do Carregador.'
    if (!cnpj.trim()) return 'Preencha o CNPJ do Carregador.'
    if (!repNome.trim()) return 'Preencha o nome do Representante Autorizado.'
    if (!repCpf.trim()) return 'Preencha o CPF do Representante Autorizado.'
    if (!contatoEmail.trim()) return 'Preencha o e-mail de contato.'
    if (itensInteresse.length === 0)
      return 'Inclua pelo menos um ponto ou zona na tabela de interesse.'

    for (let i = 0; i < itensInteresse.length; i++) {
      const it = itensInteresse[i]
      const cap = Number(it.capacidade)
      if (isNaN(cap) || cap <= 0) {
        return `A capacidade na linha ${i + 1} deve ser superior a zero (mil m³/dia).`
      }
    }

    return null
  }

  // 1. Gerar e baixar PDF preenchido
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
      await gerarManifestacaoInteressePdf(dadosPdf)
      setPdfGerado(true)
      toast({
        title: 'PDF Oficial Gerado',
        description: `O arquivo Manifestacao-Interesse-POC-${protocolo}.pdf foi baixado. Assine eletronicamente e anexe abaixo.`,
      })
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err)
      setErro('Falha na geração do PDF: ' + (err.message || 'tente novamente.'))
    } finally {
      setGerandoPdf(false)
    }
  }

  // 2. Submeter formulário + PDF assinado
  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    const valid = validarCampos()
    if (valid) {
      setErro(valid)
      return
    }

    if (
      !decRegrasMaster ||
      !decCamposObrigatorios ||
      !decCapacidadeMaiorZero ||
      !decCronograma ||
      !decAssinaturaRep
    ) {
      setErro('É obrigatório assinalar todas as declarações de ciência e conformidade regulatória.')
      return
    }

    if (!arquivoAssinado) {
      setErro(
        'É obrigatório anexar o PDF da Manifestação de Interesse assinado pelo Representante Autorizado.',
      )
      return
    }

    if (!arquivoAssinado.name.toLowerCase().endsWith('.pdf')) {
      setErro('O arquivo anexado deve estar em formato PDF.')
      return
    }

    setEnviando(true)
    try {
      const capacidadeTotal = itensInteresse.reduce(
        (acc, it) => acc + (Number(it.capacidade) || 0),
        0,
      )
      const trechoDesc = itensInteresse.map((it) => it.pontoZona).join('; ')

      const dadosCompletos = obterDadosPreenchidos()

      const res = await pocService.criarManifestacao({
        protocolo,
        ciclo: '2026/2027',
        razao_social: razaoSocial.trim(),
        cnpj: cnpj.trim(),
        email: contatoEmail.trim(),
        telefone: contatoTelefone.trim(),
        responsavel_nome: repNome.trim(),
        autorizacao_anp: autorizacaoAnp.trim(),
        capacidade_solicitada: capacidadeTotal,
        modalidade: 'Firme Ordinário',
        trecho: trechoDesc || 'Gasoduto Uruguaiana - Triunfo',
        ponto_recebimento: itensInteresse[0]?.pontoZona || 'Paso de Los Libres',
        ponto_entrega: itensInteresse[itensInteresse.length - 1]?.pontoZona || 'Triunfo',
        periodo_vigencia: '2026/2027',
        declaracao_anp_aceita: true,
        arquivo_formulario: arquivoAssinado,
        dados_formulario: dadosCompletos,
        rep_autorizado_nome: repNome.trim(),
        rep_autorizado_cpf: repCpf.trim(),
        origem: 'area_carregador',
        status: 'Submetida',
      })

      toast({
        title: 'Manifestação Submetida com Sucesso!',
        description: `Protocolo gerado: ${protocolo}`,
      })

      onSucesso(res)
    } catch (err: any) {
      console.error('Erro ao submeter manifestação:', err)
      setErro(
        'Falha ao encaminhar manifestação: ' +
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
          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            Não Vinculante
          </span>
        </div>
      </div>

      {/* Cabeçalho do Formulário */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0a2540] text-white font-mono">
            ETAPA I · ART. 37-A, § 5º, I
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            Resolução ANP nº 961/2023
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0a2540] font-display">
          Manifestação de Interesse (Não Vinculante)
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Preencha todos os campos do modelo oficial, clique em{' '}
          <strong>"Baixar PDF Preenchido"</strong>, assine o arquivo eletronicamente (fora do
          sistema) e, em seguida, anexe o documento assinado para encaminhamento e obtenção do
          protocolo definitivo.
        </p>
      </div>

      {/* Roteiro de 5 passos */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
        {[
          { n: '1', t: 'Preenchimento Web', d: 'Dados completos da empresa e representante' },
          { n: '2', t: 'Gerar PDF', d: 'Baixar modelo preenchido oficial' },
          { n: '3', t: 'Assinatura', d: 'Assinatura eletrônica (ICP-Brasil/Gov.br)' },
          { n: '4', t: 'Reanexar', d: 'Upload do documento assinado' },
          { n: '5', t: 'Protocolo', d: 'Confirmação e registro imediato' },
        ].map((etp, idx) => (
          <div
            key={idx}
            className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-2.5 shadow-2xs"
          >
            <div className="h-6 w-6 rounded-full bg-[#0a2540] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {etp.n}
            </div>
            <div>
              <strong className="block text-[#0a2540] font-semibold text-[11px]">{etp.t}</strong>
              <span className="text-[10px] text-slate-500 leading-tight block">{etp.d}</span>
            </div>
          </div>
        ))}
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
        {/* SEÇÃO 1: IDENTIFICAÇÃO DO INTERESSADO */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
            <CardTitle className="text-sm font-bold text-[#0a2540] font-display flex items-center justify-between">
              <span>1. Identificação do Interessado (Carregador Habilitado)</span>
              <span className="text-[11px] font-normal text-slate-500">
                Campos obrigatórios (*)
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Sociedade ou consórcio habilitado pela ANP para o exercício da atividade de
              Carregamento
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
                  Sede / Endereço Completo *
                </Label>
                <Input
                  value={sedeEndereco}
                  onChange={(e) => setSedeEndereco(e.target.value)}
                  placeholder="Logradouro, nº, complemento, bairro, cidade, UF, CEP"
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
                  Atividade Principal (Segmento) *
                </Label>
                <Input
                  value={atividadePrincipal}
                  onChange={(e) => setAtividadePrincipal(e.target.value)}
                  placeholder="Ex: Comercialização / Distribuição de Gás"
                  className="text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Código CNAE Principal *
                </Label>
                <Input
                  value={codigoCnae}
                  onChange={(e) => setCodigoCnae(e.target.value)}
                  placeholder="Ex: 35.20-4-02"
                  className="text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Autorização ANP nº *</Label>
                <Input
                  value={autorizacaoAnp}
                  onChange={(e) => setAutorizacaoAnp(e.target.value)}
                  placeholder="Nº da Autorização de Carregamento"
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
                placeholder="Descrever atividade secundária exercida e respectivo código CNAE"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Sítio Eletrônico Corporativo (Website)
                </Label>
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
          </CardContent>
        </Card>

        {/* SEÇÃO 2: REPRESENTANTE AUTORIZADO */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
            <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
              2. Representante Autorizado
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Dados do representante qualificado para subscrição dos atos do POC (protegido pela
              LGPD)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Nome Completo *</Label>
                <Input
                  value={repNome}
                  onChange={(e) => setRepNome(e.target.value)}
                  placeholder="Nome civil do representante"
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
                  placeholder="Ex: Advogado, Engenheiro"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Cargo / Função *</Label>
                <Input
                  value={repCargo}
                  onChange={(e) => setRepCargo(e.target.value)}
                  placeholder="Ex: Diretor de Relações Institucionais"
                  className="text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Credenciamento Profissional
                </Label>
                <Input
                  value={repCredenciamento}
                  onChange={(e) => setRepCredenciamento(e.target.value)}
                  placeholder="Ex: OAB/RS 00.000 ou CRA/CREA"
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
                  placeholder="0000000000"
                  className="text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Órgão Emissor / UF *</Label>
                <Input
                  value={repOrgaoEmissor}
                  onChange={(e) => setRepOrgaoEmissor(e.target.value)}
                  placeholder="Ex: SSP/RS"
                  className="text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">E-mail Corporativo *</Label>
                <Input
                  type="email"
                  value={repEmail}
                  onChange={(e) => setRepEmail(e.target.value)}
                  placeholder="representante@empresa.com.br"
                  className="text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Endereço de Domicílio do Representante *
              </Label>
              <Input
                value={repEndereco}
                onChange={(e) => setRepEndereco(e.target.value)}
                placeholder="Endereço residencial completo do signatário"
                className="text-xs"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 3: INFORMAÇÕES PARA CONTATO */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
            <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
              3. Informações para Contato
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Ponto focal técnico/comercial para recebimento de comunicações do POC
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Nome do Contato *</Label>
                <Input
                  value={contatoNome}
                  onChange={(e) => setContatoNome(e.target.value)}
                  placeholder="Nome do interlocutor"
                  className="text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Telefone(s) de Contato *
                </Label>
                <Input
                  value={contatoTelefone}
                  onChange={(e) => setContatoTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  E-mail para Notificações *
                </Label>
                <Input
                  type="email"
                  value={contatoEmail}
                  onChange={(e) => setContatoEmail(e.target.value)}
                  placeholder="comercial@empresa.com.br"
                  className="text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Endereço Comercial</Label>
                <Input
                  value={contatoEndereco}
                  onChange={(e) => setContatoEndereco(e.target.value)}
                  placeholder="Endereço de correspondência"
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 4: TABELA DE INTERESSE */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
                  4. Demanda Solicitada — Ponto(s) de Entrada ou Zona(s) de Saída
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  O modelo prevê múltiplas zonas/produtos em uma única manifestação de interesse
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarLinhaInteresse}
                className="text-xs text-[#0a2540] border-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1 text-[#0284c7]" />
                Adicionar Ponto/Zona
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-3">
              {itensInteresse.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0a2540] font-mono">
                      Item #{idx + 1}
                    </span>
                    {itensInteresse.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerLinhaInteresse(idx)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2 text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1 sm:col-span-1">
                      <Label className="text-[11px] font-semibold text-slate-700">
                        Ponto de Entrada ou Zona de Saída *
                      </Label>
                      <Input
                        value={it.pontoZona}
                        onChange={(e) => atualizarItem(idx, 'pontoZona', e.target.value)}
                        placeholder="Ex: PE Paso de Los Libres ou ZS Triunfo"
                        className="text-xs bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-1">
                      <Label className="text-[11px] font-semibold text-slate-700">Produto *</Label>
                      <Input
                        value={it.produto}
                        onChange={(e) => atualizarItem(idx, 'produto', e.target.value)}
                        placeholder="Ex: Produto Anual 2026/2027"
                        className="text-xs bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-1">
                      <Label className="text-[11px] font-semibold text-slate-700">
                        Capacidade Solicitada (mil m³/dia) *
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={it.capacidade}
                        onChange={(e) =>
                          atualizarItem(idx, 'capacidade', parseFloat(e.target.value) || 0)
                        }
                        placeholder="Ex: 150.0"
                        className="text-xs font-mono bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 text-xs font-medium text-slate-700">
              Total solicitado:{' '}
              <strong className="text-[#0a2540] ml-1.5 font-mono">
                {itensInteresse
                  .reduce((acc, it) => acc + (Number(it.capacidade) || 0), 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 1 })}{' '}
                mil m³/dia
              </strong>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 5: DECLARAÇÕES OBRIGATÓRIAS */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
            <CardTitle className="text-sm font-bold text-[#0a2540] font-display">
              5. Declarações e Condições Regulatórias
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Assinale todos os itens para habilitar a geração e submissão
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {[
              {
                id: 'dec1',
                state: decRegrasMaster,
                setter: setDecRegrasMaster,
                text: 'Declara estar ciente e de pleno acordo com as regras apresentadas no Contrato Master e no edital/regulamento do POC.',
              },
              {
                id: 'dec2',
                state: decCamposObrigatorios,
                setter: setDecCamposObrigatorios,
                text: 'Declara que preencherá os campos obrigatórios de Solicitação de Capacidade no POC, inclusive quanto aos diferentes níveis tarifários.',
              },
              {
                id: 'dec3',
                state: decCapacidadeMaiorZero,
                setter: setDecCapacidadeMaiorZero,
                text: 'Declara que a Capacidade Solicitada é estritamente superior a zero e reflete a demanda estimada da sociedade.',
              },
              {
                id: 'dec4',
                state: decCronograma,
                setter: setDecCronograma,
                text: 'Declara compromisso com o cumprimento integral das datas e prazos estabelecidos no Cronograma Oficial homologado pela ANP.',
              },
              {
                id: 'dec5',
                state: decAssinaturaRep,
                setter: setDecAssinaturaRep,
                text: 'Declara que o documento será subscrito pelo Representante Autorizado com poderes societários válidos e vigentes.',
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
        <Card className="border-2 border-[#0284c7]/30 bg-sky-50/30 shadow-xs">
          <CardHeader className="pb-3 border-b border-sky-100 bg-white">
            <CardTitle className="text-sm font-bold text-[#0a2540] font-display flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#0284c7]" />
              Geração, Assinatura e Reanexação do Documento Oficial
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Fluxo formal de validação: gere o PDF, colete a assinatura eletrônica do representante
              fora do sistema e anexe o arquivo assinado antes de encaminhar.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-5">
            {/* ETAPA A: BAIXAR PDF */}
            <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <strong className="text-xs font-bold text-[#0a2540] block">
                  1º Passo: Baixar o Formulário Oficial Preenchido
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
                    Baixar PDF Preenchido
                  </>
                )}
              </Button>
            </div>

            {/* ETAPA B: REANEXAR PDF ASSINADO */}
            <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold text-[#0a2540] block">
                  2º Passo: Reanexar o PDF Assinado *
                </strong>
                {arquivoAssinado && (
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Arquivo anexado
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Anexe o arquivo PDF assinado pelo Representante Autorizado (ICP-Brasil, Gov.br ou
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
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-sky-100">
              <span className="text-[11px] text-slate-500">
                Ao encaminhar, o sistema registrará a submissão e gerará o protocolo imediato na
                tela.
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
                  disabled={enviando || !arquivoAssinado}
                  className="bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold px-6 cursor-pointer shadow-xs"
                >
                  {enviando ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Encaminhando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Encaminhar Manifestação
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
