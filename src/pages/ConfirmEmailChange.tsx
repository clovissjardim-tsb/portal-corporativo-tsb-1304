import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
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
import { CheckCircle2, AlertCircle, Lock } from 'lucide-react'

export default function ConfirmEmailChange() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!token) {
      setErrorMsg('Token de confirmação não informado ou inválido na URL.')
      return
    }

    if (!password) {
      setErrorMsg('Informe sua senha para confirmar a alteração de e-mail.')
      return
    }

    setLoading(true)

    try {
      await pb.collection('users').confirmEmailChange(token, password)
      pb.authStore.clear()
      setSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao confirmar troca de e-mail.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-280px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-1 text-center bg-slate-50/50 rounded-t-lg border-b pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight text-[#0a2540]">
            Alteração de E-mail
          </CardTitle>
          <CardDescription className="text-slate-600">
            Confirmação de alteração de endereço corporativo
          </CardDescription>
        </CardHeader>

        {success ? (
          <CardContent className="space-y-4 pt-6 text-center">
            <div className="flex justify-center text-green-600">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <p className="text-base font-semibold text-slate-800">E-mail atualizado com sucesso!</p>
            <p className="text-sm text-slate-600">
              Sua sessão anterior foi encerrada por motivos de segurança. Por favor, acesse
              novamente com seu novo e-mail.
            </p>
            <div className="pt-4">
              <Link to="/login">
                <Button className="w-full bg-[#0a2540] hover:bg-[#13395e] text-white">
                  Acessar com o Novo E-mail
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
                  <span>Token de confirmação ausente. Verifique o link recebido por e-mail.</span>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <p className="text-xs text-slate-600">
                Por exigência de segurança, confirme a senha da sua conta para validar a troca de
                e-mail.
              </p>

              <div className="space-y-2">
                <Label htmlFor="password">Sua Senha Atual</Label>
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
                    disabled={loading || !token}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full bg-[#0a2540] hover:bg-[#13395e] text-white font-semibold py-2.5"
                disabled={loading || !token}
              >
                {loading ? 'Confirmando...' : 'Confirmar Alteração de E-mail'}
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
