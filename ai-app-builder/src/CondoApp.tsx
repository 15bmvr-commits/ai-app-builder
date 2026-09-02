import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import CondoDashboard from './pages/condo/CondoDashboard'
import CondoDocuments from './pages/condo/CondoDocuments'
import CondoQuotas from './pages/condo/CondoQuotas'
import CondoMaintenance from './pages/condo/CondoMaintenance'

type CondoAppProps = {
  personId: string
  fullName: string
}

type FractionSummary = {
  id: string
  fraction_code: string
  floor: string | null
  door: string | null
  condominium_id: string
  condominium_name: string
}

const tabs = [
  { id: 'dashboard', label: 'Resumo', icon: '🏠' },
  { id: 'documents', label: 'Documentos', icon: '📄' },
  { id: 'quotas', label: 'Quotas', icon: '💶' },
  { id: 'maintenance', label: 'Manutenção', icon: '🔧' },
]

function CondoApp({ personId, fullName }: CondoAppProps) {
  const [fractions, setFractions] = useState<FractionSummary[]>([])
  const [selectedFraction, setSelectedFraction] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    async function loadFractions() {
      setLoading(true)

      const { data, error } = await supabase
        .from('fraction_people')
        .select(`
          fraction_id,
          fractions (
            id,
            fraction_code,
            floor,
            door,
            condominium_id,
            condominiums ( id, name )
          )
        `)
        .eq('person_id', personId)

      if (error) {
        console.error('Erro ao carregar frações do condómino:', error)
        setLoading(false)
        return
      }

      const result: FractionSummary[] = (data ?? [])
        .map((item: any) => item.fractions)
        .filter(Boolean)
        .map((f: any) => ({
          id: f.id,
          fraction_code: f.fraction_code,
          floor: f.floor,
          door: f.door,
          condominium_id: f.condominium_id,
          condominium_name: f.condominiums?.name ?? '—',
        }))

      setFractions(result)

      if (result.length > 0) {
        setSelectedFraction(result[0].id)
      }

      setLoading(false)
    }

    loadFractions()
  }, [personId])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <div className="loading">A carregar...</div>
  }

  if (fractions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏠</div>
        <h3>Sem fração associada</h3>
        <p>
          A tua conta ainda não está associada a nenhuma fração.
          Contacta o gestor do teu condomínio.
        </p>
        <button className="secondary-button" onClick={handleSignOut}>
          🚪 Terminar sessão
        </button>
      </div>
    )
  }

  const currentFraction =
    fractions.find((f) => f.id === selectedFraction) ?? fractions[0]

  return (
    <div className="condo-app" style={{ minHeight: '100vh', background: '#f7f8fa' }}>
      <header
        style={{
          background: '#111827',
          color: 'white',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <strong>🏢 {currentFraction.condominium_name}</strong>

          <div style={{ fontSize: '13px', opacity: 0.8 }}>
            Olá, {fullName} — Fração {currentFraction.fraction_code}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {fractions.length > 1 && (
            <select
              value={selectedFraction}
              onChange={(e) => setSelectedFraction(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: '6px' }}
            >
              {fractions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.condominium_name} — {f.fraction_code}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleSignOut}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.4)',
              color: 'white',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            🚪 Sair
          </button>
        </div>
      </header>

      <nav
        style={{
          display: 'flex',
          gap: '4px',
          padding: '10px 24px',
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          flexWrap: 'wrap',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              border: 'none',
              background: activeTab === tab.id ? '#111827' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#374151',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      <main style={{ padding: '24px' }}>
        {activeTab === 'dashboard' && (
          <CondoDashboard
            fractionId={currentFraction.id}
            condominiumId={currentFraction.condominium_id}
          />
        )}

        {activeTab === 'documents' && (
          <CondoDocuments
            fractionId={currentFraction.id}
            condominiumId={currentFraction.condominium_id}
          />
        )}

        {activeTab === 'quotas' && (
          <CondoQuotas fractionId={currentFraction.id} />
        )}

        {activeTab === 'maintenance' && (
          <CondoMaintenance fractionId={currentFraction.id} />
        )}
      </main>
    </div>
  )
}

export default CondoApp
