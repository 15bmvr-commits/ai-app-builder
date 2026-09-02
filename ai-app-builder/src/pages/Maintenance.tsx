import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type Condominium = {
  id: string
  name: string
}

type Fraction = {
  id: string
  fraction_code: string
}

type MaintenanceRequest = {
  id: string
  condominium_id: string
  fraction_id: string | null
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  reported_date: string
  resolved_date: string | null
  cost: number | null
  notes: string | null
  fraction: Fraction | null
}

const priorityLabels: Record<MaintenanceRequest['priority'], string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
}

const priorityColors: Record<MaintenanceRequest['priority'], { bg: string; text: string }> = {
  low: { bg: '#e5e7eb', text: '#374151' },
  medium: { bg: '#fef3c7', text: '#92400e' },
  high: { bg: '#ffedd5', text: '#9a3412' },
  urgent: { bg: '#fee2e2', text: '#991b1b' },
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

function formatDate(value: string | null) {
  if (!value) {
    return '—'
  }

  const date = new Date(`${value}T00:00:00`)

  return new Intl.DateTimeFormat('pt-PT').format(date)
}

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return '—'
  }

  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function Maintenance() {
  const [condominiums, setCondominiums] = useState<Condominium[]>([])
  const [fractions, setFractions] = useState<Fraction[]>([])
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])

  const [selectedCondominium, setSelectedCondominium] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fractionId, setFractionId] = useState('')
  const [priority, setPriority] = useState<MaintenanceRequest['priority']>('medium')
  const [status, setStatus] = useState<MaintenanceRequest['status']>('open')
  const [reportedDate, setReportedDate] = useState('')
  const [resolvedDate, setResolvedDate] = useState('')
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')

  async function loadCondominiums() {
    const { data, error } = await supabase
      .from('condominiums')
      .select('id, name')
      .eq('active', true)
      .order('name')

    if (error) {
      console.error('Erro ao carregar condomínios:', error)
      setCondominiums([])
      return
    }

    const result = data ?? []

    setCondominiums(result)

    if (!selectedCondominium && result.length > 0) {
      setSelectedCondominium(result[0].id)
    }
  }

  async function loadFractions(condominiumId: string) {
    const { data, error } = await supabase
      .from('fractions')
      .select('id, fraction_code')
      .eq('condominium_id', condominiumId)
      .eq('active', true)
      .order('fraction_code')

    if (error) {
      console.error('Erro ao carregar frações:', error)
      setFractions([])
      return
    }

    setFractions(data ?? [])
  }

  async function loadRequests(condominiumId: string) {
    setLoading(true)

    const { data, error } = await supabase
      .from('maintenance_requests')
      .select(`
        id,
        condominium_id,
        fraction_id,
        title,
        description,
        priority,
        status,
        reported_date,
        resolved_date,
        cost,
        notes,
        fractions ( id, fraction_code )
      `)
      .eq('condominium_id', condominiumId)
      .order('reported_date', { ascending: false })

    if (error) {
      console.error('Erro ao carregar pedidos de manutenção:', error)
      setRequests([])
      setLoading(false)
      return
    }

    const result: MaintenanceRequest[] = (data ?? []).map((item: any) => ({
      id: item.id,
      condominium_id: item.condominium_id,
      fraction_id: item.fraction_id,
      title: item.title,
      description: item.description,
      priority: item.priority,
      status: item.status,
      reported_date: item.reported_date,
      resolved_date: item.resolved_date,
      cost: item.cost !== null ? Number(item.cost) : null,
      notes: item.notes,
      fraction: item.fractions ?? null,
    }))

    setRequests(result)
    setLoading(false)
  }

  useEffect(() => {
    loadCondominiums()
  }, [])

  useEffect(() => {
    if (!selectedCondominium) {
      return
    }

    loadFractions(selectedCondominium)
    loadRequests(selectedCondominium)
  }, [selectedCondominium])

  function resetForm() {
    setTitle('')
    setDescription('')
    setFractionId('')
    setPriority('medium')
    setStatus('open')
    setReportedDate('')
    setResolvedDate('')
    setCost('')
    setNotes('')
    setEditingId(null)
    setShowForm(false)
  }

  function openNewForm() {
    resetForm()

    const today = new Date().toISOString().split('T')[0]
    setReportedDate(today)

    setShowForm(true)
  }

  function editRequest(request: MaintenanceRequest) {
    setEditingId(request.id)
    setTitle(request.title)
    setDescription(request.description ?? '')
    setFractionId(request.fraction_id ?? '')
    setPriority(request.priority)
    setStatus(request.status)
    setReportedDate(request.reported_date)
    setResolvedDate(request.resolved_date ?? '')
    setCost(request.cost !== null ? request.cost.toFixed(2) : '')
    setNotes(request.notes ?? '')
    setShowForm(true)
  }

  function parseAmount(value: string) {
    const normalized = value.replace(',', '.').replace(/[^\d.-]/g, '')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  async function saveRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!selectedCondominium) {
      alert('Seleciona um condomínio.')
      return
    }

    if (!title.trim()) {
      alert('O título é obrigatório.')
      return
    }

    if (!reportedDate) {
      alert('A data de reporte é obrigatória.')
      return
    }

    setSaving(true)

    const payload = {
      condominium_id: selectedCondominium,
      fraction_id: fractionId || null,
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status,
      reported_date: reportedDate,
      resolved_date: resolvedDate || null,
      cost: cost.trim() !== '' ? parseAmount(cost) : null,
      notes: notes.trim() || null,
    }

    if (editingId) {
      const { error } = await supabase
        .from('maintenance_requests')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        console.error('Erro ao atualizar pedido de manutenção:', error)
        alert(`Erro ao atualizar: ${error.message}`)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('maintenance_requests')
        .insert(payload)

      if (error) {
        console.error('Erro ao criar pedido de manutenção:', error)
        alert(`Erro ao criar: ${error.message}`)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    resetForm()
    await loadRequests(selectedCondominium)
  }

  async function deleteRequest(request: MaintenanceRequest) {
    const confirmed = window.confirm(
      `Queres eliminar o pedido "${request.title}"?`
    )

    if (!confirmed) {
      return
    }

    const { error } = await supabase
      .from('maintenance_requests')
      .delete()
      .eq('id', request.id)

    if (error) {
      console.error('Erro ao eliminar pedido de manutenção:', error)
      alert(`Erro ao eliminar: ${error.message}`)
      return
    }

    await loadRequests(selectedCondominium)
  }

  const filteredRequests = useMemo(() => {
    const searchText = search.trim().toLowerCase()

    if (!searchText) {
      return requests
    }

    return requests.filter((request) => {
      const text = `
        ${request.title}
        ${request.description ?? ''}
        ${request.fraction?.fraction_code ?? ''}
        ${priorityLabels[request.priority]}
        ${statusLabels[request.status]}
        ${request.notes ?? ''}
      `.toLowerCase()

      return text.includes(searchText)
    })
  }, [requests, search])

  const openCount = useMemo(
    () => requests.filter((r) => r.status === 'open' || r.status === 'in_progress').length,
    [requests]
  )

  return (
    <section className="page">
      <div className="section-header">
        <div>
          <h2>Manutenção</h2>
          <p>Gere os pedidos de manutenção dos condomínios.</p>
        </div>

        <button className="secondary-button" onClick={openNewForm}>
          + Novo pedido
        </button>
      </div>

      <div className="filter-bar">
        <label>Condomínio</label>

        <select
          value={selectedCondominium}
          onChange={(e) => setSelectedCondominium(e.target.value)}
        >
          {condominiums.map((condominium) => (
            <option key={condominium.id} value={condominium.id}>
              {condominium.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="🔎 Pesquisar pedidos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="form-card" style={{ marginBottom: '20px' }}>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>
          Pedidos em aberto ou em curso
        </div>

        <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '5px' }}>
          {openCount}
        </div>
      </div>

      {showForm && (
        <form className="form-card" onSubmit={saveRequest}>
          <h3>{editingId ? 'Editar pedido' : 'Novo pedido'}</h3>

          <div className="form-grid">
            <div>
              <label>Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Reparação do elevador"
                required
              />
            </div>

            <div>
              <label>Fração (opcional)</label>
              <select value={fractionId} onChange={(e) => setFractionId(e.target.value)}>
                <option value="">Zona comum / geral</option>
                {fractions.map((fraction) => (
                  <option key={fraction.id} value={fraction.id}>
                    {fraction.fraction_code}
                  </option>
                ))}
              </select>
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

            <div>
              <label>Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MaintenanceRequest['status'])}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Data de reporte</label>
              <input
                type="date"
                value={reportedDate}
                onChange={(e) => setReportedDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label>Data de resolução</label>
              <input
                type="date"
                value={resolvedDate}
                onChange={(e) => setResolvedDate(e.target.value)}
              />
            </div>

            <div>
              <label>Custo estimado (€)</label>
              <input
                type="text"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="Ex.: 150.00"
              />
            </div>
          </div>

          <div style={{ marginTop: '18px' }}>
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
              placeholder="Descreve o problema ou o trabalho a realizar..."
            />
          </div>

          <div style={{ marginTop: '14px' }}>
            <label>Notas</label>
            <textarea
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '10px 12px',
                minHeight: '50px',
                fontFamily: 'inherit',
              }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={resetForm}>
              Cancelar
            </button>

            <button type="submit" className="create-button" disabled={saving}>
              {saving ? 'A guardar...' : editingId ? 'Guardar alterações' : 'Criar pedido'}
            </button>
          </div>
        </form>
      )}

      <div className="table-card">
        {loading ? (
          <div className="loading">A carregar...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔧</div>
            <h3>Sem pedidos de manutenção</h3>
            <p>Cria o primeiro pedido para este condomínio.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Reportado</th>
                <th>Título</th>
                <th>Fração</th>
                <th>Prioridade</th>
                <th>Estado</th>
                <th>Custo</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>{formatDate(request.reported_date)}</td>

                  <td>
                    <strong>{request.title}</strong>
                  </td>

                  <td>{request.fraction?.fraction_code ?? 'Geral'}</td>

                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '5px 9px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: priorityColors[request.priority].bg,
                        color: priorityColors[request.priority].text,
                      }}
                    >
                      {priorityLabels[request.priority]}
                    </span>
                  </td>

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

                  <td>{formatCurrency(request.cost)}</td>

                  <td>
                    <div className="table-actions">
                      <button title="Editar" onClick={() => editRequest(request)}>
                        ✏️
                      </button>

                      <button title="Eliminar" onClick={() => deleteRequest(request)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

export default Maintenance
