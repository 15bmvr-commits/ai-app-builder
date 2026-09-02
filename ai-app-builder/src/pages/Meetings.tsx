import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type Condominium = {
  id: string
  name: string
}

type Meeting = {
  id: string
  condominium_id: string
  meeting_type: 'ordinary' | 'extraordinary'
  status: 'scheduled' | 'completed' | 'cancelled'
  scheduled_at: string
  location: string | null
  agenda: string | null
  minutes: string | null
}

const typeLabels: Record<Meeting['meeting_type'], string> = {
  ordinary: 'Ordinária',
  extraordinary: 'Extraordinária',
}

const statusLabels: Record<Meeting['status'], string> = {
  scheduled: 'Agendada',
  completed: 'Realizada',
  cancelled: 'Cancelada',
}

const statusColors: Record<Meeting['status'], { bg: string; text: string }> = {
  scheduled: { bg: '#dbeafe', text: '#1e40af' },
  completed: { bg: '#dcfce7', text: '#166534' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
}

function formatDateTime(value: string) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function toLocalInputValue(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function Meetings() {
  const [condominiums, setCondominiums] = useState<Condominium[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])

  const [selectedCondominium, setSelectedCondominium] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [meetingType, setMeetingType] = useState<Meeting['meeting_type']>('ordinary')
  const [status, setStatus] = useState<Meeting['status']>('scheduled')
  const [scheduledAt, setScheduledAt] = useState('')
  const [location, setLocation] = useState('')
  const [agenda, setAgenda] = useState('')
  const [minutes, setMinutes] = useState('')

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

  async function loadMeetings(condominiumId: string) {
    setLoading(true)

    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('condominium_id', condominiumId)
      .order('scheduled_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar assembleias:', error)
      setMeetings([])
      setLoading(false)
      return
    }

    setMeetings(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadCondominiums()
  }, [])

  useEffect(() => {
    if (!selectedCondominium) {
      return
    }

    loadMeetings(selectedCondominium)
  }, [selectedCondominium])

  function resetForm() {
    setMeetingType('ordinary')
    setStatus('scheduled')
    setScheduledAt('')
    setLocation('')
    setAgenda('')
    setMinutes('')
    setEditingId(null)
    setShowForm(false)
  }

  function openNewForm() {
    resetForm()
    setShowForm(true)
  }

  function editMeeting(meeting: Meeting) {
    setEditingId(meeting.id)
    setMeetingType(meeting.meeting_type)
    setStatus(meeting.status)
    setScheduledAt(toLocalInputValue(meeting.scheduled_at))
    setLocation(meeting.location ?? '')
    setAgenda(meeting.agenda ?? '')
    setMinutes(meeting.minutes ?? '')
    setShowForm(true)
  }

  async function saveMeeting(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!selectedCondominium) {
      alert('Seleciona um condomínio.')
      return
    }

    if (!scheduledAt) {
      alert('A data e hora da assembleia são obrigatórias.')
      return
    }

    setSaving(true)

    const payload = {
      condominium_id: selectedCondominium,
      meeting_type: meetingType,
      status,
      scheduled_at: new Date(scheduledAt).toISOString(),
      location: location.trim() || null,
      agenda: agenda.trim() || null,
      minutes: minutes.trim() || null,
    }

    if (editingId) {
      const { error } = await supabase
        .from('meetings')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        console.error('Erro ao atualizar assembleia:', error)
        alert(`Erro ao atualizar: ${error.message}`)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from('meetings').insert(payload)

      if (error) {
        console.error('Erro ao criar assembleia:', error)
        alert(`Erro ao criar: ${error.message}`)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    resetForm()
    await loadMeetings(selectedCondominium)
  }

  async function deleteMeeting(meeting: Meeting) {
    const confirmed = window.confirm(
      `Queres eliminar a assembleia de ${formatDateTime(meeting.scheduled_at)}?`
    )

    if (!confirmed) {
      return
    }

    const { error } = await supabase.from('meetings').delete().eq('id', meeting.id)

    if (error) {
      console.error('Erro ao eliminar assembleia:', error)
      alert(`Erro ao eliminar: ${error.message}`)
      return
    }

    await loadMeetings(selectedCondominium)
  }

  const filteredMeetings = useMemo(() => {
    const searchText = search.trim().toLowerCase()

    if (!searchText) {
      return meetings
    }

    return meetings.filter((meeting) => {
      const text = `
        ${typeLabels[meeting.meeting_type]}
        ${statusLabels[meeting.status]}
        ${meeting.location ?? ''}
        ${meeting.agenda ?? ''}
        ${meeting.minutes ?? ''}
      `.toLowerCase()

      return text.includes(searchText)
    })
  }, [meetings, search])

  const nextMeeting = useMemo(() => {
    const now = new Date()

    return meetings
      .filter((m) => m.status === 'scheduled' && new Date(m.scheduled_at) >= now)
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]
  }, [meetings])

  return (
    <section className="page">
      <div className="section-header">
        <div>
          <h2>Assembleias</h2>
          <p>Gere as assembleias, convocatórias e atas dos condomínios.</p>
        </div>

        <button className="secondary-button" onClick={openNewForm}>
          + Nova assembleia
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
          placeholder="🔎 Pesquisar assembleias..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="form-card" style={{ marginBottom: '20px' }}>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>Próxima assembleia</div>

        <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '5px' }}>
          {nextMeeting ? formatDateTime(nextMeeting.scheduled_at) : 'Nenhuma agendada'}
        </div>
      </div>

      {showForm && (
        <form className="form-card" onSubmit={saveMeeting}>
          <h3>{editingId ? 'Editar assembleia' : 'Nova assembleia'}</h3>

          <div className="form-grid">
            <div>
              <label>Tipo</label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as Meeting['meeting_type'])}
              >
                {Object.entries(typeLabels).map(([value, label]) => (
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
                onChange={(e) => setStatus(e.target.value as Meeting['status'])}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Data e hora</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>

            <div>
              <label>Local</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex.: Sala de condomínio"
              />
            </div>
          </div>

          <div style={{ marginTop: '18px' }}>
            <label>Ordem de trabalhos</label>
            <textarea
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '10px 12px',
                minHeight: '80px',
                fontFamily: 'inherit',
              }}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Pontos a discutir na assembleia..."
            />
          </div>

          <div style={{ marginTop: '14px' }}>
            <label>Ata</label>
            <textarea
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '10px 12px',
                minHeight: '100px',
                fontFamily: 'inherit',
              }}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="Registo do que foi decidido na assembleia (preencher após a realização)..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={resetForm}>
              Cancelar
            </button>

            <button type="submit" className="create-button" disabled={saving}>
              {saving ? 'A guardar...' : editingId ? 'Guardar alterações' : 'Criar assembleia'}
            </button>
          </div>
        </form>
      )}

      <div className="table-card">
        {loading ? (
          <div className="loading">A carregar...</div>
        ) : filteredMeetings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏛️</div>
            <h3>Sem assembleias registadas</h3>
            <p>Agenda a primeira assembleia para este condomínio.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Local</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredMeetings.map((meeting) => (
                <tr key={meeting.id}>
                  <td>
                    <strong>{formatDateTime(meeting.scheduled_at)}</strong>
                  </td>

                  <td>{typeLabels[meeting.meeting_type]}</td>

                  <td>{meeting.location ?? '—'}</td>

                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '5px 9px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: statusColors[meeting.status].bg,
                        color: statusColors[meeting.status].text,
                      }}
                    >
                      {statusLabels[meeting.status]}
                    </span>
                  </td>

                  <td>
                    <div className="table-actions">
                      <button title="Editar" onClick={() => editMeeting(meeting)}>
                        ✏️
                      </button>

                      <button title="Eliminar" onClick={() => deleteMeeting(meeting)}>
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

export default Meetings
