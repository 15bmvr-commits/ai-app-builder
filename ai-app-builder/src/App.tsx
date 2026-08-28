import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Condominiums from './pages/Condominiums'
import './App.css'

function App() {
  const [prompt, setPrompt] = useState('')
  const [connectionStatus, setConnectionStatus] =
    useState('A testar ligação...')

  const [session, setSession] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  const [currentPage, setCurrentPage] =
    useState('dashboard')

  // =====================================================
  // AUTENTICAÇÃO
  // =====================================================

  useEffect(() => {
    async function getSession() {
      const { data } = await supabase.auth.getSession()

      setSession(data.session)
      setCheckingAuth(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // =====================================================
  // PERFIL DO UTILIZADOR
  // =====================================================

  useEffect(() => {
    async function getProfile() {
      if (!session?.user?.id) {
        setProfile(null)
        return
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, role')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error(
          'Erro ao carregar perfil:',
          error
        )

        setProfile(null)
        return
      }

      console.log('Perfil carregado:', data)

      setProfile(data)
    }

    getProfile()
  }, [session])

  // =====================================================
  // TESTAR SUPABASE
  // =====================================================

  useEffect(() => {
    async function testSupabase() {
      const { error } = await supabase
        .from('condominiums')
        .select('id')
        .limit(1)

      if (error) {
        console.error(
          'Erro Supabase:',
          error
        )

        setConnectionStatus(
          'Erro na ligação ao Supabase'
        )

        return
      }

      setConnectionStatus(
        'Supabase ligado ✓'
      )
    }

    testSupabase()
  }, [])

  // =====================================================
  // LOADING
  // =====================================================

  if (checkingAuth) {
    return <div>A carregar...</div>
  }

  // =====================================================
  // LOGIN
  // =====================================================

  if (!session) {
    return <Login />
  }

  // =====================================================
  // APLICAÇÃO
  // =====================================================

  return (
    <div className="app">

      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        profile={profile}
      />

      <main className="main">

        {currentPage === 'dashboard' && (
          <>
            <Header
              title="Dashboard"
              description="Gestão dos teus condomínios."
              connectionStatus={connectionStatus}
            />

            <section className="hero">

              <div className="hero-content">

                <span className="badge">
                  🏢 Gestão de Condomínios
                </span>

                <h2>
                  Bem-vindo ao
                  <span> teu sistema</span>
                </h2>

                <p>
                  Gere condomínios, frações,
                  condóminos, quotas, despesas
                  e documentos num único local.
                </p>

                <div className="prompt-box">

                  <textarea
                    value={prompt}
                    onChange={(e) =>
                      setPrompt(e.target.value)
                    }
                    placeholder="Escreve aqui uma instrução para a IA..."
                  />

                  <div className="prompt-footer">

                    <span>
                      {prompt.length} caracteres
                    </span>

                    <button className="create-button">
                      ✨ Criar
                    </button>

                  </div>

                </div>

              </div>

            </section>

            <section className="projects">

              <div className="section-header">

                <div>
                  <h3>Resumo</h3>

                  <p>
                    Informação geral dos teus
                    condomínios.
                  </p>
                </div>

                <button
                  className="secondary-button"
                  onClick={() =>
                    setCurrentPage('condominiums')
                  }
                >
                  + Novo condomínio
                </button>

              </div>

              <div className="empty-state">

                <div className="empty-icon">
                  🏢
                </div>

                <h3>
                  Ainda não tens condomínios
                </h3>

                <p>
                  Cria o teu primeiro condomínio
                  para começar a gerir a aplicação.
                </p>

              </div>

            </section>
          </>
        )}

        {currentPage === 'condominiums' && (
          <>
            <Header
              title="Condomínios"
              description="Gere os teus condomínios."
              connectionStatus={connectionStatus}
            />

            <Condominiums />
          </>
        )}

      </main>

    </div>
  )
}

export default App