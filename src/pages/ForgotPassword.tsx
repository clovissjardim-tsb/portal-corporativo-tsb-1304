import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      await pb.collection('users').requestPasswordReset(email.trim())
      setSent(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao solicitar recuperação.'
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
            Recuperação de Senha
          </CardTitle>
          <CardDescription className="text-slate-600">
            Informe seu e-mail cadastrado para receber instruções de redefinição
          </CardDescription>
        </CardHeader>

        {sent ? (
          <CardContent className="space-y-4 pt-6 text-center">
            <div className="flex justify-center text-green-600 mb-2">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <p className="text-sm text-slate-700">
              Se o e-mail informado estiver cadastrado, um link de redefinição de senha foi enviado
              para <strong className="text-slate-900">{email}</strong>.
            </p>
            <p className="text-xs text-slate-500">
              Verifique sua caixa de entrada e a pasta de spam.
            </p>
            <div className="pt-4">
              <Link to="/login">
                <Button className="w-full bg-[#0a2540] hover:bg-[#13395e] text-white">
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail Cadastrado</Label>
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
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full bg-[#0a2540] hover:bg-[#13395e] text-white font-semibold py-2.5"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
              </Button>

              <div className="flex items-center justify-between w-full text-xs text-slate-600 pt-2 border-t">
                <Link
                  to="/login"
                  className="text-[#0284c7] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Voltar ao Login
                </Link>
                <Link to="/" className="hover:text-[#0a2540]">
                  Início
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
