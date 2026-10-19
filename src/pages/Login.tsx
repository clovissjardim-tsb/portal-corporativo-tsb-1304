import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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
import { Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/poc'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      await pb.collection('users').authWithPassword(email.trim(), password)
      toast({
        title: 'Autenticado com sucesso',
        description: 'Bem-vindo ao Portal TSB.',
      })
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Credenciais inválidas ou erro no servidor.'
      setErrorMsg(msg.includes('Failed to authenticate') ? 'E-mail ou senha incorretos.' : msg)
    } finally {
      setLoading(false)
    }
  }

  // Preenchimento rápido para o operador de teste
  const handlePreencherOperador = () => {
    setEmail('clovissjardim@gmail.com')
    setPassword('Skip@Pass')
  }

  return (
    <div className="flex min-h-[calc(100vh-280px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-1 text-center bg-slate-50/50 rounded-t-lg border-b pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0a2540]/10 text-[#0a2540] mb-2">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-[#0a2540]">
            Área Restrita TSB
          </CardTitle>
          <CardDescription className="text-slate-600">
            Acesso para Carregadores de Gás e Operadores TSB
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
              <Label htmlFor="email">E-mail Corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="usuario@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#0284c7] hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handlePreencherOperador}
                className="text-xs text-slate-500 hover:text-[#0284c7] underline block w-full text-left"
              >
                Preencher com credenciais de demonstração (Operador TSB)
              </button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button
              type="submit"
              className="w-full bg-[#0a2540] hover:bg-[#13395e] text-white font-semibold py-2.5"
              disabled={loading}
            >
              {loading ? 'Acessando...' : 'Acessar Portal'}
            </Button>

            <div className="flex items-center justify-between w-full text-xs text-slate-600 pt-2 border-t">
              <Link to="/signup" className="text-[#0284c7] font-semibold hover:underline">
                Não tem cadastro? Crie sua conta
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
