import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

type InviteInfo = {
  email: string
  person_id: string
}

type ActivateProps = {
  token: string
}

function Activate({ token }: ActivateProps) {
  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [checking, setChecking] = useState(true)
  const [invalidReason, setInvalidReason] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function checkInvite() {
      setChecking(true)

      const { data, error } = await supabase
        .from('invites')
        .select('email, person_id, used_at, expires_at')
        .eq('token', token)
        .single()

      if (error || !data) {
        setInvalidReason('Este convite não é válido.')
        setChecking(false)
        return
      }

      if (data.used_at) {
        setInvalidReason('Este convite já foi utilizado.')
        setChecking(false)
        return
      }

      if (new Date(data.expires_at) < new Date()) {
        setInvalidReason('Este convite expirou. Pede um novo ao gestor do condomínio.')
        setChecking(false)
        return
      }

      setInvite({ email: data.email, person_id: data.person_id })
      setChecking(false)
    }

    checkInvite()
  }, [token])

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault()

    if (!invite) {
      return
    }

    if (password.length < 6) {
      setError('A password deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As passwords não coincidem.')
      return
    }

    setSubmitting(true)
    setError('')

    const { error: signUpError } = await supabase.auth.signUp({
      email: invite.email,
      password,
    })

    if (signUpError) {
      setError(`Erro ao criar conta: ${signUpError.message}`)
      setSubmitting(false)
      return
    }

    // Depois do signUp, o utilizador já está autenticado (sessão
    // criada automaticamente). Resgata o convite: liga a conta ao
    // registo de "people" e cria o perfil de condómino.
    const { error: acceptError } = await supabase.rpc('accept_invite', {
      p_token: token,
    })

    if (acceptError) {
      setError(`Erro ao ativar acesso: ${acceptError.message}`)
      setSubmitting(false)
      return
    }

    setDone(true)
    setSubmitting(false)

    setTimeout(() => {
      window.location.href = window.location.origin
    }, 1500)
  }

  if (checking) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">🏢</div>
          <p>A verificar convite...</p>
        </div>
      </div>
    )
  }

  if (invalidReason) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">🏢</div>
          <h1>Convite inválido</h1>
          <p className="login-subtitle">{invalidReason}</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">✅</div>
          <h1>Conta ativada</h1>
          <p className="login-subtitle">A entrar na tua área de condómino...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🏢</div>

        <h1>Ativar acesso</h1>

        <p className="login-subtitle">
          Cria a tua password de acesso à área do condómino.
        </p>

        <form onSubmit={handleActivate}>
          <label>Email</label>
          <input type="email" value={invite?.email ?? ''} disabled />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
          />

          <label>Confirmar password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repete a password"
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'A ativar...' : 'Ativar acesso'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Activate
