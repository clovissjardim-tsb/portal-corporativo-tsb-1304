import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
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
import { KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!token) {
      setErrorMsg('Token de recuperação não encontrado ou inválido.')
      return
    }

    if (password.length < 8) {
      setErrorMsg('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setErrorMsg('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)
      setSuccess(true)
      toast({
        title: 'Senha redefinida com sucesso!',
        description: 'Você já pode fazer login com a sua nova senha.',
      })
      setTimeout(() => {
        navigate('/login')
      }, 2500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao redefinir a senha.'
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
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-[#0a2540]">
            Redefinição de Senha
          </CardTitle>
          <CardDescription className="text-slate-600">
            Defina uma nova senha para sua conta corporativa
          </CardDescription>
        </CardHeader>

        {success ? (
          <CardContent className="space-y-4 pt-6 text-center">
            <div className="flex justify-center text-green-600 mb-2">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <p className="text-sm text-slate-700">
              Sua senha foi redefinida com sucesso! Redirecionando para o login...
            </p>
            <div className="pt-2">
              <Link to="/login">
                <Button className="w-full bg-[#0a2540] hover:bg-[#13395e] text-white">
                  Ir para Login
                </Button>
              </Link>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              {!token && (
                <div className="flex items-center gap-2 p-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Token de recuperação ausente. Verifique o link recebido por e-mail.</span>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha (mínimo 8 dígitos)</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || !token}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Confirmar Nova Senha</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  disabled={loading || !token}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full bg-[#0a2540] hover:bg-[#13395e] text-white font-semibold py-2.5"
                disabled={loading || !token}
              >
                {loading ? 'Salvando...' : 'Salvar Nova Senha'}
              </Button>

              <div className="text-center w-full text-xs text-slate-600 pt-2 border-t">
                <Link to="/login" className="text-[#0284c7] font-semibold hover:underline">
                  Voltar ao Login
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
