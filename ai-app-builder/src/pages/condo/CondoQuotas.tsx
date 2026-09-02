import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type CondoQuotasProps = {
  fractionId: string
}

type Quota = {
  id: string
  reference_year: number
  reference_month: number | null
  description: string | null
  due_date: string
  amount: number
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled'
}

const statusLabels: Record<Quota['status'], string> = {
  pending: 'Pendente',
  paid: 'Pago',
  partial: 'Parcial',
  overdue: 'Em atraso',
  cancelled: 'Cancelado',
}

const statusColors: Record<Quota['status'], { bg: string; text: string }> = {
  pending: { bg: '#dbeafe', text: '#1e40af' },
  paid: { bg: '#dcfce7', text: '#166534' },
  partial: { bg: '#fef3c7', text: '#92400e' },
  overdue: { bg: '#fee2e2', text: '#991b1b' },
  cancelled: { bg: '#e5e7eb', text: '#374151' },
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-PT').format(new Date(`${value}T00:00:00`))
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function CondoQuotas({ fractionId }: CondoQuotasProps) {
  const [quotas, setQuotas] = useState<Quota[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadQuotas() {
      setLoading(true)

      const { data, error } = await supabase
        .from('quotas')
        .select('*')
        .eq('fraction_id', fractionId)
        .order('due_date', { ascending: false })

      if (error) {
        console.error('Erro ao carregar quotas:', error)
        setQuotas([])
        setLoading(false)
        return
      }

      setQuotas(data ?? [])
      setLoading(false)
    }

    loadQuotas()
  }, [fractionId])

  return (
    <div className="table-card">
      {loading ? (
        <div className="loading">A carregar...</div>
      ) : quotas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💶</div>
          <h3>Sem quotas registadas</h3>
          <p>Ainda não há quotas emitidas para a tua fração.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Vencimento</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {quotas.map((quota) => (
              <tr key={quota.id}>
                <td>{formatDate(quota.due_date)}</td>

                <td>
                  {quota.description ??
                    `Quota ${quota.reference_month ? `${quota.reference_month}/` : ''}${quota.reference_year}`}
                </td>

                <td>{formatCurrency(Number(quota.amount))}</td>

                <td>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '5px 9px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: statusColors[quota.status].bg,
                      color: statusColors[quota.status].text,
                    }}
                  >
                    {statusLabels[quota.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default CondoQuotas
