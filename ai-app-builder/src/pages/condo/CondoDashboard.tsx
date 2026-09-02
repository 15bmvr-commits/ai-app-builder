import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type CondoDashboardProps = {
  fractionId: string
  condominiumId: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function CondoDashboard({ fractionId }: CondoDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingTotal, setPendingTotal] = useState(0)
  const [openMaintenance, setOpenMaintenance] = useState(0)

  useEffect(() => {
    async function loadSummary() {
      setLoading(true)

      const { data: quotas } = await supabase
        .from('quotas')
        .select('amount, status')
        .eq('fraction_id', fractionId)
        .in('status', ['pending', 'overdue', 'partial'])

      const { data: maintenance } = await supabase
        .from('maintenance_requests')
        .select('id, status')
        .eq('fraction_id', fractionId)
        .in('status', ['open', 'in_progress'])

      setPendingCount(quotas?.length ?? 0)
      setPendingTotal(
        (quotas ?? []).reduce((sum, q: any) => sum + Number(q.amount), 0)
      )
      setOpenMaintenance(maintenance?.length ?? 0)

      setLoading(false)
    }

    loadSummary()
  }, [fractionId])

  if (loading) {
    return <div className="loading">A carregar...</div>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
      <div className="form-card">
        <div style={{ color: '#6b7280', fontSize: '14px' }}>Quotas pendentes</div>
        <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '6px' }}>{pendingCount}</div>
      </div>

      <div className="form-card">
        <div style={{ color: '#6b7280', fontSize: '14px' }}>Valor em dívida</div>
        <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '6px' }}>
          {formatCurrency(pendingTotal)}
        </div>
      </div>

      <div className="form-card">
        <div style={{ color: '#6b7280', fontSize: '14px' }}>Pedidos de manutenção em aberto</div>
        <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '6px' }}>{openMaintenance}</div>
      </div>
    </div>
  )
}

export default CondoDashboard
