import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Condominium = {
  id: string
  name: string
}

type Fraction = {
  id: string
  fraction_code: string
}

type QuotaType = {
  id: string
  name: string
  description: string | null
  recurring: boolean
  active: boolean
}

type Quota = {
  id: string
  fraction_id: string
  quota_type_id: string | null
  reference_year: number
  reference_month: number | null
  description: string | null
  due_date: string
  amount: number
  status: string
  fraction: Fraction
  quota_type: QuotaType | null
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Em atraso',
  cancelled: 'Anulada',
}

function Fees() {
  const [condominiums, setCondominiums] = useState<Condominium[]>([])
  const [fractions, setFractions] = useState<Fraction[]>([])
  const [quotaTypes, setQuotaTypes] = useState<QuotaType[]>([])
  const [quotas, setQuotas] = useState<Quota[]>([])

  const [selectedCondominium, setSelectedCondominium] =
    useState('')

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [fractionId, setFractionId] = useState('')
  const [quotaTypeId, setQuotaTypeId] = useState('')
  const [referenceYear, setReferenceYear] =
    useState(new Date().getFullYear().toString())
  const [referenceMonth, setReferenceMonth] =
    useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState('pending')

  // =====================================================
  // CONDOMÍNIOS
  // =====================================================

  async function loadCondominiums() {
    const { data, error } = await supabase
      .from('condominiums')
      .select('id, name')
      .eq('active', true)
      .order('name')

    if (error) {
      console.error(
        'Erro ao carregar condomínios:',
        error
      )
      return
    }

    const result = data ?? []

    setCondominiums(result)

    if (!selectedCondominium && result.length > 0) {
      setSelectedCondominium(result[0].id)
    }
  }

  // =====================================================
  // FRAÇÕES
  // =====================================================

  async function loadFractions(condominiumId: string) {
    const { data, error } = await supabase
      .from('fractions')
      .select('id, fraction_code')
      .eq('condominium_id', condominiumId)
      .eq('active', true)
      .order('fraction_code')

    if (error) {
      console.error(
        'Erro ao carregar frações:',
        error
      )

      setFractions([])
      return
    }

    setFractions(data ?? [])
  }

  // =====================================================
  // TIPOS DE QUOTA
  // =====================================================

  async function loadQuotaTypes(
    condominiumId: string
  ) {
    const { data, error } = await supabase
      .from('quota_types')
      .select(`
        id,
        name,
        description,
        recurring,
        active
      `)
      .eq('condominium_id', condominiumId)
      .eq('active', true)
      .order('name')

    if (error) {
      console.error(
        'Erro ao carregar tipos de quota:',
        error
      )

      setQuotaTypes([])
      return
    }

    setQuotaTypes(data ?? [])
  }

  // =====================================================
  // QUOTAS
  // =====================================================

  async function loadQuotas(
    condominiumId: string
  ) {
    setLoading(true)

    const { data, error } = await supabase
      .from('quotas')
      .select(`
        id,
        fraction_id,
        quota_type_id,
        reference_year,
        reference_month,
        description,
        due_date,
        amount,
        status,
        fractions (
          id,
          fraction_code,
          condominium_id
        ),
        quota_types (
          id,
          name,
          description,
          recurring,
          active
        )
      `)
      .eq(
        'fractions.condominium_id',
        condominiumId
      )
      .order('due_date', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Erro ao carregar quotas:',
        error
      )

      setQuotas([])
      setLoading(false)
      return
    }

    const result: Quota[] = (data ?? [])
      .filter(
        (item: any) =>
          item.fractions
      )
      .map((item: any) => ({
        id: item.id,
        fraction_id: item.fraction_id,
        quota_type_id: item.quota_type_id,
        reference_year:
          item.reference_year,
        reference_month:
          item.reference_month,
        description:
          item.description,
        due_date:
          item.due_date,
        amount:
          Number(item.amount),
        status:
          item.status,
        fraction:
          item.fractions,
        quota_type:
          item.quota_types ?? null,
      }))

    setQuotas(result)
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
    loadQuotaTypes(selectedCondominium)
    loadQuotas(selectedCondominium)
  }, [selectedCondominium])

  // =====================================================
  // FORMULÁRIO
  // =====================================================

  function resetForm() {
    setFractionId('')
    setQuotaTypeId('')
    setReferenceYear(
      new Date().getFullYear().toString()
    )
    setReferenceMonth('')
    setDescription('')
    setDueDate('')
    setAmount('')
    setStatus('pending')

    setEditingId(null)
    setShowForm(false)
  }

  function openNewQuotaForm() {
    setEditingId(null)

    setFractionId(
      fractions.length > 0
        ? fractions[0].id
        : ''
    )

    setQuotaTypeId(
      quotaTypes.length > 0
        ? quotaTypes[0].id
        : ''
    )

    setReferenceYear(
      new Date().getFullYear().toString()
    )

    setReferenceMonth('')
    setDescription('')
    setDueDate('')
    setAmount('')
    setStatus('pending')

    setShowForm(true)
  }

  function editQuota(quota: Quota) {
    setEditingId(quota.id)

    setFractionId(quota.fraction_id)
    setQuotaTypeId(
      quota.quota_type_id ?? ''
    )

    setReferenceYear(
      quota.reference_year.toString()
    )

    setReferenceMonth(
      quota.reference_month?.toString() ?? ''
    )

    setDescription(
      quota.description ?? ''
    )

    setDueDate(quota.due_date)

    setAmount(
      quota.amount.toString()
    )

    setStatus(quota.status)

    setShowForm(true)
  }

  // =====================================================
  // GUARDAR
  // =====================================================

  async function saveQuota(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    if (!selectedCondominium) {
      alert('Seleciona um condomínio.')
      return
    }

    if (!fractionId) {
      alert('Seleciona uma fração.')
      return
    }

    if (!dueDate) {
      alert('A data de vencimento é obrigatória.')
      return
    }

    if (!amount || Number(amount) <= 0) {
      alert('Indica um valor válido.')
      return
    }

    const year = Number(referenceYear)

    if (!year || year < 2000) {
      alert('Indica um ano válido.')
      return
    }

    const month = referenceMonth
      ? Number(referenceMonth)
      : null

    if (
      month !== null &&
      (month < 1 || month > 12)
    ) {
      alert('Indica um mês válido.')
      return
    }

    const payload = {
      fraction_id: fractionId,
      quota_type_id:
        quotaTypeId || null,
      reference_year: year,
      reference_month: month,
      description:
        description.trim() || null,
      due_date: dueDate,
      amount: Number(amount),
      status,
    }

    if (editingId) {
      const { error } = await supabase
        .from('quotas')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        console.error(
          'Erro ao atualizar quota:',
          error
        )

        alert(
          `Erro ao atualizar quota: ${error.message}`
        )

        return
      }
    } else {
      const { error } = await supabase
        .from('quotas')
        .insert(payload)

      if (error) {
        console.error(
          'Erro ao criar quota:',
          error
        )

        alert(
          `Erro ao criar quota: ${error.message}`
        )

        return
      }
    }

    resetForm()

    await loadQuotas(
      selectedCondominium
    )
  }

  // =====================================================
  // ELIMINAR
  // =====================================================

  async function deleteQuota(
    quota: Quota
  ) {
    const confirmed = window.confirm(
      `Tens a certeza que queres eliminar a quota da fração ${quota.fraction.fraction_code} no valor de ${quota.amount.toFixed(2)} €?`
    )

    if (!confirmed) {
      return
    }

    const { error } = await supabase
      .from('quotas')
      .delete()
      .eq('id', quota.id)

    if (error) {
      console.error(
        'Erro ao eliminar quota:',
        error
      )

      alert(
        `Erro ao eliminar quota: ${error.message}`
      )

      return
    }

    await loadQuotas(
      selectedCondominium
    )
  }

  // =====================================================
  // FILTRO
  // =====================================================

  const filteredQuotas =
    quotas.filter((quota) => {
      const text = `
        ${quota.fraction.fraction_code}
        ${quota.quota_type?.name ?? ''}
        ${quota.description ?? ''}
        ${quota.status}
        ${quota.reference_year}
        ${quota.reference_month ?? ''}
      `.toLowerCase()

      return text.includes(
        search.toLowerCase()
      )
    })

  // =====================================================
  // TOTAIS
  // =====================================================

  const totalAmount =
    filteredQuotas.reduce(
      (total, quota) =>
        total + quota.amount,
      0
    )

  const pendingAmount =
    filteredQuotas
      .filter(
        (quota) =>
          quota.status === 'pending' ||
          quota.status === 'overdue'
      )
      .reduce(
        (total, quota) =>
          total + quota.amount,
        0
      )

  const paidAmount =
    filteredQuotas
      .filter(
        (quota) =>
          quota.status === 'paid'
      )
      .reduce(
        (total, quota) =>
          total + quota.amount,
        0
      )

  function formatDate(
    date: string
  ) {
    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString(
      'pt-PT'
    )
  }

  function getStatusClass(
    quotaStatus: string
  ) {
    if (quotaStatus === 'paid') {
      return 'active'
    }

    if (
      quotaStatus === 'overdue'
    ) {
      return 'inactive'
    }

    return ''
  }

  // =====================================================
  // INTERFACE
  // =====================================================

  return (
    <section className="page">

      <div className="section-header">

        <div>
          <h2></h2>

          <p>
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={
            openNewQuotaForm
          }
        >
          + Nova quota
        </button>

      </div>

      {/* FILTROS */}

      <div className="filter-bar">

        <label>
          Condomínio
        </label>

        <select
          value={selectedCondominium}
          onChange={(e) =>
            setSelectedCondominium(
              e.target.value
            )
          }
        >
          {condominiums.map(
            (condominium) => (
              <option
                key={condominium.id}
                value={condominium.id}
              >
                {condominium.name}
              </option>
            )
          )}
        </select>

        <input
          type="text"
          placeholder="🔎 Pesquisar quotas..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </div>

      {/* RESUMO */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >

        <div className="form-card">
          <small>
            Total
          </small>

          <h2>
            {totalAmount.toFixed(2)} €
          </h2>
        </div>

        <div className="form-card">
          <small>
            Em aberto
          </small>

          <h2>
            {pendingAmount.toFixed(2)} €
          </h2>
        </div>

        <div className="form-card">
          <small>
            Pago
          </small>

          <h2>
            {paidAmount.toFixed(2)} €
          </h2>
        </div>

      </div>

      {/* FORMULÁRIO */}

      {showForm && (

        <div className="form-card">

          <h3>
            {editingId
              ? 'Editar quota'
              : 'Nova quota'}
          </h3>

          <form
            onSubmit={saveQuota}
          >

            <div className="form-grid">

              <div>
                <label>
                  Fração *
                </label>

                <select
                  value={fractionId}
                  onChange={(e) =>
                    setFractionId(
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Selecionar fração
                  </option>

                  {fractions.map(
                    (fraction) => (
                      <option
                        key={fraction.id}
                        value={fraction.id}
                      >
                        {fraction.fraction_code}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label>
                  Tipo de quota
                </label>

                <select
                  value={quotaTypeId}
                  onChange={(e) =>
                    setQuotaTypeId(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Sem tipo
                  </option>

                  {quotaTypes.map(
                    (type) => (
                      <option
                        key={type.id}
                        value={type.id}
                      >
                        {type.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label>
                  Ano *
                </label>

                <input
                  type="number"
                  min="2000"
                  value={referenceYear}
                  onChange={(e) =>
                    setReferenceYear(
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div>
                <label>
                  Mês
                </label>

                <select
                  value={referenceMonth}
                  onChange={(e) =>
                    setReferenceMonth(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Sem mês
                  </option>

                  <option value="1">
                    Janeiro
                  </option>

                  <option value="2">
                    Fevereiro
                  </option>

                  <option value="3">
                    Março
                  </option>

                  <option value="4">
                    Abril
                  </option>

                  <option value="5">
                    Maio
                  </option>

                  <option value="6">
                    Junho
                  </option>

                  <option value="7">
                    Julho
                  </option>

                  <option value="8">
                    Agosto
                  </option>

                  <option value="9">
                    Setembro
                  </option>

                  <option value="10">
                    Outubro
                  </option>

                  <option value="11">
                    Novembro
                  </option>

                  <option value="12">
                    Dezembro
                  </option>
                </select>
              </div>

              <div>
                <label>
                  Data de vencimento *
                </label>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) =>
                    setDueDate(
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div>
                <label>
                  Valor (€) *
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div>
                <label>
                  Estado
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value
                    )
                  }
                >
                  <option value="pending">
                    Pendente
                  </option>

                  <option value="paid">
                    Pago
                  </option>

                  <option value="overdue">
                    Em atraso
                  </option>

                  <option value="cancelled">
                    Anulada
                  </option>
                </select>
              </div>

              <div>
                <label>
                  Descrição
                </label>

                <input
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: Quota ordinária"
                />
              </div>

            </div>

            <div className="form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="create-button"
              >
                {editingId
                  ? 'Guardar alterações'
                  : 'Criar quota'}
              </button>

            </div>

          </form>

        </div>

      )}

      {/* LISTA */}

      <div className="table-card">

        {loading ? (

          <div className="loading">
            A carregar quotas...
          </div>

        ) : filteredQuotas.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              💰
            </div>

            <h3>
              Ainda não existem quotas
            </h3>

            <p>
              Cria a primeira quota deste
              condomínio.
            </p>

          </div>

        ) : (

          <table>

            <thead>

              <tr>
                <th>Fração</th>
                <th>Tipo</th>
                <th>Referência</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Estado</th>
                <th></th>
              </tr>

            </thead>

            <tbody>

              {filteredQuotas.map(
                (quota) => (

                  <tr
                    key={quota.id}
                  >

                    <td>
                      <strong>
                        {
                          quota
                            .fraction
                            .fraction_code
                        }
                      </strong>
                    </td>

                    <td>
                      {
                        quota
                          .quota_type
                          ?.name ??
                        '—'
                      }
                    </td>

                    <td>
                      {quota.reference_month
                        ? `${quota.reference_month.toString().padStart(2, '0')}/${quota.reference_year}`
                        : quota.reference_year}
                    </td>

                    <td>
                      {formatDate(
                        quota.due_date
                      )}
                    </td>

                    <td>
                      <strong>
                        {quota.amount.toFixed(2)} €
                      </strong>
                    </td>

                    <td>

                      <span
                        className={`status-badge ${getStatusClass(quota.status)}`}
                      >
                        {
                          statusLabels[
                            quota.status
                          ] ??
                          quota.status
                        }
                      </span>

                    </td>

                    <td>

                      <div className="table-actions">

                        <button
                          title="Editar"
                          onClick={() =>
                            editQuota(
                              quota
                            )
                          }
                        >
                          ✏️
                        </button>

                        <button
                          title="Eliminar"
                          onClick={() =>
                            deleteQuota(
                              quota
                            )
                          }
                        >
                          🗑️
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </div>

    </section>
  )
}

export default Fees