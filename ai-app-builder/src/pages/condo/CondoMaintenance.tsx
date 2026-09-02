import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type CondoMaintenanceProps = {
  fractionId: string
}

type MaintenanceRequest = {
  id: string
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  reported_date: string
}

const priorityLabels: Record<MaintenanceRequest['priority'], string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
}

const statusLabels: Record<MaintenanceRequest['status'], string> = {
  open: 'Aberto',
  in_progress: 'Em curso',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const statusColors: Record<MaintenanceRequest['status'], { bg: string; text: string }> = {
  open: { bg: '#dbeafe', text: '#1e40af' },
  in_progress: { bg: '#fef3c7', text: '#92400e' },
  completed: { bg: '#dcfce7', text: '#166534' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-PT').format(new Date(`${value}T00:00:00`))
}

function CondoMaintenance({ fractionId }: CondoMaintenanceProps) {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<MaintenanceRequest['priority']>('medium')

  async function loadRequests() {
    setLoading(true)

    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('id, title, description, priority, status, reported_date')
      .or(`fraction_id.eq.${fractionId},fraction_id.is.null`)
      .order('reported_date', { ascending: false })

    if (error) {
      console.error('Erro ao carregar pedidos de manutenção:', error)
      setRequests([])
      setLoading(false)
      return
    }

    setRequests(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadRequests()
  }, [fractionId])

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) {
      alert('O título é obrigatório.')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('maintenance_requests').insert({
      fraction_id: fractionId,
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status: 'open',
      reported_date: new Date().toISOString().split('T')[0],
    })

    if (error) {
      console.error('Erro ao criar pedido de manutenção:', error)
      alert(`Erro ao criar pedido: ${error.message}`)
      setSaving(false)
      return
    }

    setTitle('')
    setDescription('')
    setPriority('medium')
    setShowForm(false)
    setSaving(false)

    await loadRequests()
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: '18px' }}>Manutenção</h2>
          <p>Consulta e reporta problemas na tua fração.</p>
        </div>

        <button className="secondary-button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Novo pedido'}
        </button>
      </div>

      {showForm && (
        <form className="form-card" onSubmit={submitRequest} style={{ marginBottom: '16px' }}>
          <div className="form-grid">
            <div>
              <label>Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Fuga de água na casa de banho"
                required
              />
            </div>

            <div>
              <label>Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as MaintenanceRequest['priority'])}
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '14px' }}>
            <label>Descrição</label>
            <textarea
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '10px 12px',
                minHeight: '70px',
                fontFamily: 'inherit',
              }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreve o problema..."
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="create-button" disabled={saving}>
              {saving ? 'A enviar...' : 'Enviar pedido'}
            </button>
          </div>
        </form>
      )}

      <div className="table-card">
        {loading ? (
          <div className="loading">A carregar...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔧</div>
            <h3>Sem pedidos de manutenção</h3>
            <p>Reporta o primeiro problema da tua fração.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Título</th>
                <th>Prioridade</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{formatDate(request.reported_date)}</td>
                  <td>{request.title}</td>
                  <td>{priorityLabels[request.priority]}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '5px 9px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: statusColors[request.status].bg,
                        color: statusColors[request.status].text,
                      }}
                    >
                      {statusLabels[request.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default CondoMaintenance
