import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Scale,
  ExternalLink,
  Info,
} from 'lucide-react'

export default function Poc() {
  const etapas = [
    {
      numero: 'I',
      titulo:
        'Identificação dos potenciais Carregadores e manifestação de interesse não vinculante',
      descricao:
        'Etapa inicial destinada ao mapeamento da demanda do mercado e à manifestação prévia de interesse por parte dos potenciais carregadores, em caráter não vinculante.',
      baseLegal: 'Art. 37-A, § 5º, I',
    },
    {
      numero: 'II',
      titulo:
        'Aprovação pela ANP das Tarifas de Referência e da eventual redistribuição da Capacidade Disponível',
      descricao:
        'Aprovação pela Agência Nacional do Petróleo, Gás Natural e Biocombustíveis (ANP) dos valores das Tarifas de Referência e da eventual redistribuição da Capacidade Disponível resultantes da etapa de manifestação de interesse.',
      baseLegal: 'Art. 37-A, § 5º, II',
    },
    {
      numero: 'III',
      titulo: 'Análise das propostas garantidas vinculantes e alocação de capacidade',
      descricao:
        'Recebimento e análise das propostas firmes apresentadas pelos carregadores interessados acompanhadas das devidas garantias, procedendo-se aos mecanismos de alocação de capacidade conforme regulamento aprovado.',
      baseLegal: 'Art. 37-A, § 5º, III',
    },
    {
      numero: 'IV',
      titulo: 'Celebração dos instrumentos contratuais e apresentação das respectivas garantias',
      descricao:
        'Formalização dos Contratos de Serviço de Transporte padronizados entre o Transportador e os carregadores contemplados na alocação, com o aporte das garantias contratuais cabíveis.',
      baseLegal: 'Art. 37-A, § 5º, IV',
    },
    {
      numero: 'V',
      titulo: 'Envio dos contratos celebrados para registro na ANP (Art. 26)',
      descricao:
        'Encaminhamento formal de todos os instrumentos contratuais devidamente celebrados para arquivamento e registro na ANP, em estrito cumprimento ao art. 26 da regulamentação aplicável.',
      baseLegal: 'Art. 37-A, § 5º, V c/c Art. 26',
    },
  ]

  const instrumentos = [
    {
      inciso: 'I',
      nome: 'Minuta do regulamento para oferta e contratação de capacidade',
      detalhe:
        'Documento norteador do processo contendo o cronograma das etapas, exigências de garantias, critérios de alocação de capacidade e regras operacionais.',
      referencia: 'Art. 37-A, § 1º, I e Art. 38-A',
    },
    {
      inciso: 'II',
      nome: 'Minuta do Contrato de Serviço de Transporte de gás natural',
      detalhe:
        'Instrumento contratual padronizado que regerá os direitos e obrigações entre o Transportador e o Carregador na prestação dos serviços de transporte.',
      referencia: 'Art. 37-A, § 1º, II',
    },
    {
      inciso: 'III',
      nome: 'Proposta tarifária',
      detalhe:
        'Valores das Tarifas de Referência e metodologia aplicável, submetidos à ANP nos termos da regulamentação tarifária.',
      referencia: 'Art. 37-A, § 1º, III',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50/70 text-[#0a2540] text-[10px] font-bold tracking-wider uppercase font-display"
          >
            Resolução ANP nº 961/2023 · Art. 37-A
          </Badge>
          <Badge
            variant="outline"
            className="border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-medium"
          >
            Acesso Público
          </Badge>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0a2540] font-display">
          POC — Programa de Oferta de Capacidade
        </h1>

        <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-4xl">
          Procedimento conduzido pela{' '}
          <strong>Transportadora Sulbrasileira de Gás S.A. (TSB)</strong> sob a supervisão da{' '}
          <strong>Agência Nacional do Petróleo, Gás Natural e Biocombustíveis (ANP)</strong>, por
          meio de utilização de plataforma eletrônica dos transportadores e observância estrita dos
          procedimentos estabelecidos na Resolução ANP nº 961/2023 (Art. 37-A).
        </p>
      </div>

      {/* SEÇÃO A: O QUE É */}
      <Card className="border border-slate-200 shadow-xs bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-sky-50 text-[#0284c7]">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-[#0a2540] font-display">
                O que é o Processo de Oferta e Contratação de Capacidade
              </CardTitle>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Definição regulatória conforme a Resolução ANP nº 961/2023 (alteração da Resolução
                ANP nº 11/2016)
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 text-sm text-slate-700 leading-relaxed space-y-3">
          <p>
            Conforme o <strong>Art. 2º, inciso XXXIV-C</strong> da regulamentação (acrescentado pela
            Resolução ANP nº 961/2023), o <em>Processo de Oferta e Contratação de Capacidade</em> é
            o:
          </p>
          <div className="p-4 bg-slate-50 rounded-lg border-l-4 border-l-[#0284c7] border border-slate-200 text-slate-800 text-sm italic font-medium">
            &ldquo;procedimento, com garantia de acesso a todos os interessados, que tem por
            finalidade contratar capacidade de transporte firme em gasodutos existentes.&rdquo;
          </div>
          <p className="text-xs text-slate-600">
            O procedimento assegura os princípios de publicidade, transparência, isonomia e livre
            acesso não discriminatório a todos os Carregadores interessados na utilização da
            infraestrutura dutoviária da TSB.
          </p>
        </CardContent>
      </Card>

      {/* SEÇÃO B: ETAPAS DO PROCESSO (ART. 37-A, § 5º) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-xl font-bold text-[#0a2540] font-display flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#0284c7]" />
              Etapas do Processo (Art. 37-A, § 5º)
            </h2>
            <p className="text-xs text-slate-500">
              Procedimento sequencial determinado pela Resolução ANP nº 961/2023 para a contratação
              firme
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded self-start sm:self-auto">
            5 Etapas Regulatórias
          </span>
        </div>

        <div className="space-y-3">
          {etapas.map((etapa) => (
            <div
              key={etapa.numero}
              className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0a2540] text-white flex items-center justify-center font-bold text-xs sm:text-sm font-display shadow-2xs">
                  {etapa.numero}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="text-sm sm:text-base font-semibold text-[#0a2540]">
                      {etapa.titulo}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded shrink-0 self-start sm:self-auto">
                      {etapa.baseLegal}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">{etapa.descricao}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO C: INSTRUMENTOS SUBMETIDOS À ANP (ART. 37-A, § 1º) */}
      <Card className="border border-slate-200 shadow-xs bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-blue-50 text-[#0a2540]">
              <Scale className="h-5 w-5 text-[#0284c7]" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-[#0a2540] font-display">
                Instrumentos submetidos à ANP (Art. 37-A, § 1º)
              </CardTitle>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Documentos obrigatórios submetidos previamente pelo Transportador à aprovação da
                Agência
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          {/* Grid dos 3 instrumentos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {instrumentos.map((item) => (
              <div
                key={item.inciso}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#0a2540] text-white font-mono">
                      Inciso {item.inciso}
                    </span>
                    <FileText className="h-4 w-4 text-[#0284c7]" />
                  </div>
                  <h4 className="text-xs font-bold text-[#0a2540] leading-snug">{item.nome}</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{item.detalhe}</p>
                </div>
                <div className="pt-2 border-t border-slate-200/80 text-[10px] font-mono text-slate-500">
                  Ref.: {item.referencia}
                </div>
              </div>
            ))}
          </div>

          {/* Destaques dos §§ 2º, 3º e 4º */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 rounded-lg border border-sky-100 bg-sky-50/50 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#0a2540]">
                <CheckCircle2 className="h-4 w-4 text-[#0284c7] shrink-0" />
                <span>Publicação e Disponibilização (§ 2º e § 4º)</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                O Transportador disponibilizará no seu sítio eletrônico e em plataforma eletrônica,
                após aprovação da ANP, todos os instrumentos referidos no § 1º (Art. 37-A, § 2º).
                Após aprovados, não poderão ser alterados sem prévia e expressa anuência da ANP (§
                4º).
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#0a2540]">
                <AlertCircle className="h-4 w-4 text-[#0284c7] shrink-0" />
                <span>Consulta Pública Tarifária (§ 3º)</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                A proposta tarifária será posta em <strong>Consulta Pública Tarifária</strong>, em
                conformidade com o disposto no inciso I do art. 44-A da Resolução ANP nº 11/2016 e
                na Resolução ANP nº 15/2014, assegurando ampla participação e escuta dos
                interessados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AVISO DISCRETO NO RODAPÉ DA PÁGINA */}
      <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 flex items-start sm:items-center gap-3">
        <Info className="h-4 w-4 text-[#0284c7] shrink-0 mt-0.5 sm:mt-0" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-800">Acompanhamento regulatório: </span>
          As etapas e publicações do processo serão divulgadas nesta página conforme avançarem.
        </div>
      </div>
    </div>
  )
}
