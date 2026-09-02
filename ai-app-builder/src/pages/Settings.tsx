import { useState } from 'react'
import { supabase } from '../lib/supabase'

type SettingsProps = {
  email?: string | null
  profile: {
    full_name?: string | null
    role?: string | null
  } | null
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  owner: 'Proprietário',
  condomino: 'Condómino',
}

function Settings({ email, profile }: SettingsProps) {
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Erro ao terminar sessão:', error)
      setSigningOut(false)
      return
    }

    // O App.tsx já ouve onAuthStateChange e trata
    // a mudança de sessão automaticamente.
  }

  return (
    <div className="page">
      <div className="form-card">
        <h3>O meu perfil</h3>

        <div className="form-grid">
          <div>
            <label>Nome</label>
            <input value={profile?.full_name ?? '—'} disabled />
          </div>

          <div>
            <label>Email</label>
            <input value={email ?? '—'} disabled />
          </div>

          <div>
            <label>Perfil</label>
            <input
              value={
                profile?.role
                  ? (roleLabels[profile.role] ?? profile.role)
                  : '—'
              }
              disabled
            />
          </div>
        </div>
      </div>

      <div className="form-card">
        <h3>Sessão</h3>

        <p>Termina a sessão para saíres da tua conta neste dispositivo.</p>

        <div className="form-actions">
          <button
            className="secondary-button"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'A terminar sessão...' : '🚪 Terminar sessão'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
