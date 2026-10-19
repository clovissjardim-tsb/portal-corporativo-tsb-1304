import { useEffect, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setErrorMsg('Token de verificação não informado.')
      return
    }

    const verify = async () => {
      try {
        await pb.collection('users').confirmVerification(token)
        setSuccess(true)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Falha ao confirmar verificação de e-mail.'
        setErrorMsg(msg)
      } finally {
        setLoading(false)
      }
    }

    verify()
  }, [token])

  return (
    <div className="flex min-h-[calc(100vh-280px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-1 text-center bg-slate-50/50 rounded-t-lg border-b pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight text-[#0a2540]">
            Verificação de E-mail
          </CardTitle>
          <CardDescription className="text-slate-600">
            Validação cadastral para o Portal Corporativo TSB
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-6 text-center">
          {loading && (
            <div className="py-8 flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#0284c7]" />
              <p className="text-sm text-slate-600">Validando seu endereço de e-mail...</p>
            </div>
          )}

          {!loading && success && (
            <div className="py-4 space-y-3">
              <div className="flex justify-center text-green-600">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <p className="text-base font-semibold text-slate-800">
                E-mail verificado com sucesso!
              </p>
              <p className="text-sm text-slate-600">
                Sua conta está ativa e pronta para acesso a todas as funcionalidades do Portal TSB.
              </p>
            </div>
          )}

          {!loading && !success && (
            <div className="py-4 space-y-3">
              <div className="flex justify-center text-red-600">
                <AlertCircle className="h-12 w-12" />
              </div>
              <p className="text-base font-semibold text-slate-800">
                Não foi possível verificar o e-mail
              </p>
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {errorMsg}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-2">
          <Link to="/login" className="w-full">
            <Button className="w-full bg-[#0a2540] hover:bg-[#13395e] text-white">
              Ir para o Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
