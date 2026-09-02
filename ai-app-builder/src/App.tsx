import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'
import Activate from './Activate'
import CondoApp from './CondoApp'
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
import Owners from './pages/Owners'
import Expenses from './pages/Expenses'
import Maintenance from './pages/Maintenance'
import Meetings from './pages/Meetings'
import Documents from './pages/Documents'
import Settings from './pages/Settings'


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
  // CONVITE (ativação de conta de condómino)
  // =====================================================

  const inviteToken = new URLSearchParams(window.location.search).get(
    'invite'
  )

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

  const [condoPersonId, setCondoPersonId] = useState<string | null>(null)

  useEffect(() => {
    async function getProfile() {
      if (!session?.user?.id) {
        setProfile(null)
        setCondoPersonId(null)
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

      if (data.role === 'condomino') {
        const { data: person, error: personError } = await supabase
          .from('people')
          .select('id')
          .eq('user_id', session.user.id)
          .single()

        if (personError) {
          console.error(
            'Erro ao carregar pessoa associada ao condómino:',
            personError
          )
          setCondoPersonId(null)
          return
        }

        setCondoPersonId(person.id)
      }
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
  // ATIVAÇÃO DE CONTA (link de convite)
  // =====================================================

  if (inviteToken && !session) {
    return <Activate token={inviteToken} />
  }

  // =====================================================
  // LOGIN
  // =====================================================

  if (!session) {
    return <Login />
  }

  // =====================================================
  // PORTAL DO CONDÓMINO
  // =====================================================

  if (profile?.role === 'condomino') {
    if (!condoPersonId) {
      return <div>A carregar...</div>
    }

    return (
      <CondoApp
        personId={condoPersonId}
        fullName={profile.full_name ?? 'Condómino'}
      />
    )
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

    {currentPage === 'owners' && (
  <>
    <Header
      title="Proprietários"
      description="Gere os proprietários das frações dos teus condomínios."
      connectionStatus={connectionStatus}
    />

    <Owners />
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
{currentPage === 'expenses' && (
  <>
    <Header
      title="Despesas"
      description="Gere as despesas dos teus condomínios."
      connectionStatus={connectionStatus}
    />

    <Expenses />
  </>
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

{currentPage === 'maintenance' && (
  <>
    <Header
      title="Manutenção"
      description="Gere os pedidos de manutenção dos teus condomínios."
      connectionStatus={connectionStatus}
    />

    <Maintenance />
  </>
)}

{currentPage === 'meetings' && (
  <>
    <Header
      title="Assembleias"
      description="Gere as assembleias dos teus condomínios."
      connectionStatus={connectionStatus}
    />

    <Meetings />
  </>
)}

{currentPage === 'documents' && (
  <>
    <Header
      title="Documentos"
      description="Consulta os documentos dos teus condomínios."
      connectionStatus={connectionStatus}
    />

    <Documents />
  </>
)}

{currentPage === 'settings' && (
  <>
    <Header
      title="Definições"
      description="Gere o teu perfil e a tua sessão."
      connectionStatus={connectionStatus}
    />

    <Settings email={session?.user?.email} profile={profile} />
  </>
)}
      </main>

    </div>
  )
}

export default App