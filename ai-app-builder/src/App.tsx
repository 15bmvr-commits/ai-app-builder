import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Condominiums from './pages/Condominiums'
import './App.css'
import Fractions from './pages/Fractions'
import Dashboard from './pages/Dashboard'
import People from './pages/People'
import PersonDetails from './pages/PersonDetails'
import Quotas from './pages/Quotas'
//import Fees from './pages/Quotas'
import CurrentAccounts from './pages/CurrentAccounts'

function App() {
 // const [prompt, setPrompt] = useState('')
  const [connectionStatus, setConnectionStatus] =
    useState('A testar ligação...')

  const [session, setSession] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  const [currentPage, setCurrentPage] =
    useState('dashboard')
const [selectedPersonId, setSelectedPersonId] =
  useState<string | null>(null)
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
  <Dashboard
    connectionStatus={connectionStatus}
    setCurrentPage={setCurrentPage}
  />
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
{currentPage === 'fractions' && (
  <>
    <Header
      title="Frações"
      description="Gere as frações dos teus condomínios."
      connectionStatus={connectionStatus}
    />

    <Fractions />
  </>
)}

{currentPage === 'people' && (
  <People />
)}

{currentPage === 'person-details' &&
  selectedPersonId && (
    <PersonDetails
      personId={selectedPersonId}
      onBack={() => {
        setSelectedPersonId(null)
        setCurrentPage('people')
      }}
    />
)}

{currentPage === 'fees' && (
  <>
    <Header
      title="Quotas"
      description="Gere as quotas e pagamentos dos teus condomínios."
      connectionStatus={connectionStatus}
    />

    <Quotas />
  </>
)}

{currentPage === 'current-accounts' && (
  <>
    <Header
      title="Conta Corrente"
      description="Consulte a situação financeira das frações."
      connectionStatus={connectionStatus}
    />

    <CurrentAccounts />
  </>
)}
      </main>

    </div>
  )
}

export default App