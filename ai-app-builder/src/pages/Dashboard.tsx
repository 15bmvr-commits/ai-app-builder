import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type DashboardProps = {
  connectionStatus: string
  setCurrentPage: (page: string) => void
}

function Dashboard({
  connectionStatus,
  setCurrentPage,
}: DashboardProps) {
  const [totalCondominiums, setTotalCondominiums] = useState(0)
  const [activeCondominiums, setActiveCondominiums] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)

      const { data, error } = await supabase
        .from('condominiums')
        .select('id, active')

      if (error) {
        console.error(
          'Erro ao carregar dashboard:',
          error
        )

        setLoading(false)
        return
      }

      const condominiums = data ?? []

      setTotalCondominiums(condominiums.length)

      setActiveCondominiums(
        condominiums.filter(
          (condominium) => condominium.active
        ).length
      )

      setLoading(false)
    }

    loadDashboard()
  }, [])

  return (
    <>
      <header className="header">

        <div>
          <h1>Dashboard</h1>

          <p>
            Gestão dos teus condomínios.
          </p>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          {connectionStatus}
        </div>

      </header>

      <section className="dashboard-stats">

        <div className="stat-card">

          <div className="stat-icon">
            🏢
          </div>

          <div>
            <span>Total de condomínios</span>

            <strong>
              {loading ? '...' : totalCondominiums}
            </strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            🟢
          </div>

          <div>
            <span>Condomínios ativos</span>

            <strong>
              {loading ? '...' : activeCondominiums}
            </strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            👥
          </div>

          <div>
            <span>Condóminos</span>

            <strong>0</strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            💰
          </div>

          <div>
            <span>Quotas pendentes</span>

            <strong>0</strong>
          </div>

        </div>

      </section>

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
            Gere condomínios, frações, condóminos,
            quotas, despesas e documentos num único local.
          </p>

          <div className="prompt-box">

            <textarea
              placeholder="Escreve aqui uma instrução para a IA..."
            />

            <div className="prompt-footer">

              <span>
                0 caracteres
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
            <h3>Os teus condomínios</h3>

            <p>
              Acede rapidamente aos teus condomínios.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={() =>
              setCurrentPage('condominiums')
            }
          >
            Ver condomínios
          </button>

        </div>

        {totalCondominiums === 0 ? (

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

            <button
              className="create-button"
              onClick={() =>
                setCurrentPage('condominiums')
              }
            >
              + Criar condomínio
            </button>

          </div>

        ) : (

          <div className="dashboard-message">

            <div className="empty-icon">
              ✅
            </div>

            <h3>
              Tens {totalCondominiums} condomínio
              {totalCondominiums !== 1 ? 's' : ''}
            </h3>

            <p>
              {activeCondominiums} condomínio
              {activeCondominiums !== 1 ? 's estão' : ' está'}
              ativo{activeCondominiums !== 1 ? 's' : ''}.
            </p>

          </div>

        )}

      </section>
    </>
  )
}

export default Dashboard