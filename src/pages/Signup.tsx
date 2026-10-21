import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { UserPlus, AlertCircle, ArrowLeft } from 'lucide-react'

export default function Signup() {
  const [name, setName] = useState('')
  const [razaoSocial, setRazaoSocial] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [telefone, setTelefone] = useState('')
  const [autorizacaoAnp, setAutorizacaoAnp] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (password.length < 8) {
      setErrorMsg('A senha deve conter no mínimo 8 caracteres.')
      return
    }
    if (password !== passwordConfirm) {
      setErrorMsg('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      await pb.collection('users').create({
        name: (responsavel || name).trim(),
        razao_social: razaoSocial.trim(),
        cnpj: cnpj.trim(),
        responsavel: (responsavel || name).trim(),
        telefone: telefone.trim(),
        autorizacao_anp: autorizacaoAnp.trim(),
        email: email.trim(),
        password,
        passwordConfirm,
      })

      try {
        await pb.collection('users').requestVerification(email.trim())
      } catch {
        // Ignora erro se envio de e-mail não estiver configurado
      }

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Verifique seu e-mail ou faça login com suas credenciais.',
      })
      navigate('/login')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar conta.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-280px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-1 text-center bg-slate-50/50 rounded-t-lg border-b pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0284c7]/10 text-[#0284c7] mb-2">
            <UserPlus className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-[#0a2540]">
            Cadastro de Carregador
          </CardTitle>
          <CardDescription className="text-slate-600">
            Cadastre sua conta para participar dos processos POCC e acessar serviços restritos
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="razaoSocial">Razão Social da Empresa *</Label>
                <Input
                  id="razaoSocial"
                  required
                  placeholder="Ex: GasBrasil Comercializadora S.A."
                  value={razaoSocial}
                  onChange={(e) => {
                    setRazaoSocial(e.target.value)
                    if (!name) setName(e.target.value)
                  }}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  required
                  placeholder="00.000.000/0001-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="responsavel">Nome do Responsável *</Label>
                <Input
                  id="responsavel"
                  required
                  placeholder="Ex: Carlos Eduardo Silveira"
                  value={responsavel}
                  onChange={(e) => {
                    setResponsavel(e.target.value)
                    setName(e.target.value)
                  }}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail Corporativo (Login) *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="responsavel@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefone">Telefone de Contato *</Label>
                <Input
                  id="telefone"
                  required
                  placeholder="(51) 3333-4444"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="autorizacaoAnp" className="flex items-center justify-between">
                  <span>Nº de Autorização ANP como Carregador</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Opcional no cadastro inicial
                  </span>
                </Label>
                <Input
                  id="autorizacaoAnp"
                  placeholder="Ex: ANP-AUT-2024-089 (se já possuir)"
                  value={autorizacaoAnp}
                  onChange={(e) => setAutorizacaoAnp(e.target.value)}
                  disabled={loading}
                />
                <span className="text-[10px] text-slate-500 block">
                  Art. 37-A, § 5º, I: O acesso ao POCC é liberado no cadastro. A condição de
                  Carregador habilitado se consolida ao longo do ciclo até a assinatura.
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha (mínimo 8 dígitos)</Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Confirmar Senha</Label>
              <Input
                id="passwordConfirm"
                type="password"
                required
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                disabled={loading}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button
              type="submit"
              className="w-full bg-[#059669] hover:bg-[#047857] text-white font-semibold py-2.5"
              disabled={loading}
            >
              {loading ? 'Cadastrando...' : 'Criar Conta'}
            </Button>

            <div className="flex items-center justify-between w-full text-xs text-slate-600 pt-2 border-t">
              <Link to="/login" className="text-[#0284c7] font-semibold hover:underline">
                Já possui conta? Faça login
              </Link>
              <Link to="/" className="inline-flex items-center gap-1 hover:text-[#0a2540]">
                <ArrowLeft className="h-3 w-3" /> Início
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
