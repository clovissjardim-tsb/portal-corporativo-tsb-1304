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
        name: name.trim(),
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

            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo / Razão Social</Label>
              <Input
                id="name"
                required
                placeholder="Ex: João da Silva / Petróleo S.A."
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail Corporativo</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="usuario@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
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
