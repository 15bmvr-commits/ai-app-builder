
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

type Payment = {
  id: string
  quota_id: string
  payment_date: string
  amount: number
  payment_method: string | null
  reference: string | null
  notes: string | null
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  partial: 'Pago parcialmente',
  overdue: 'Em atraso',
  cancelled: 'Anulado',
}

const statusClasses: Record<string, string> = {
  pending: 'pending',
  paid: 'active',
  partial: 'partial',
  overdue: 'inactive',
  cancelled: 'inactive',
}

const monthLabels = [
  '',
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function Quotas() {
  const [condominiums, setCondominiums] = useState<Condominium[]>([])
  const [fractions, setFractions] = useState<Fraction[]>([])
  const [quotaTypes, setQuotaTypes] = useState<QuotaType[]>([])
  const [quotas, setQuotas] = useState<Quota[]>([])

  const [selectedCondominium, setSelectedCondominium] =
    useState('')

  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState(
    new Date().getFullYear().toString()
  )

  const [statusFilter, setStatusFilter] =
    useState('')

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

  const [showPaymentForm, setShowPaymentForm] =
    useState(false)

  const [selectedQuota, setSelectedQuota] =
    useState<Quota | null>(null)

  const [payments, setPayments] =
    useState<Payment[]>([])

  const [paymentDate, setPaymentDate] =
    useState(new Date().toISOString().split('T')[0])

  const [paymentAmount, setPaymentAmount] =
    useState('')

  const [paymentMethod, setPaymentMethod] =
    useState('')

  const [paymentReference, setPaymentReference] =
    useState('')

  const [paymentNotes, setPaymentNotes] =
    useState('')

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

    const dataResult = data ?? []

    setCondominiums(dataResult)

    if (
      !selectedCondominium &&
      dataResult.length > 0
    ) {
      setSelectedCondominium(dataResult[0].id)
    }
  }

  // =====================================================
  // FRAÇÕES
  // =====================================================

  async function loadFractions(
    condominiumId: string
  ) {
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
      .select(
        'id, name, description, recurring'
      )
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
          recurring
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
        reference_year: item.reference_year,
        reference_month:
          item.reference_month,
        description: item.description,
        due_date: item.due_date,
        amount: Number(item.amount),
        status: item.status,
        fraction: item.fractions,
        quota_type:
          item.quota_types ?? null,
      }))

    setQuotas(result)
    setLoading(false)
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

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
  // FORM
  // =====================================================

  function resetForm() {
    setEditingId(null)
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
    setShowForm(false)
  }

  function openNewQuotaForm() {
    setEditingId(null)
    setFractionId(
      fractions.length > 0
        ? fractions[0].id
        : ''
    )
    setQuotaTypeId('')
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
    setAmount(quota.amount.toString())
    setStatus(quota.status)

    setShowForm(true)
  }

  // =====================================================
  // GUARDAR QUOTA
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

    if (!referenceYear.trim()) {
      alert('Indica o ano de referência.')
      return
    }

    if (!dueDate) {
      alert(
        'Indica a data de vencimento.'
      )
      return
    }

    if (!amount.trim()) {
      alert('Indica o valor da quota.')
      return
    }

    const numericAmount = Number(amount)

    if (
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      alert('Indica um valor válido.')
      return
    }

    const payload = {
      fraction_id: fractionId,
      quota_type_id:
        quotaTypeId || null,
      reference_year:
        Number(referenceYear),
      reference_month:
        referenceMonth
          ? Number(referenceMonth)
          : null,
      description:
        description.trim() || null,
      due_date: dueDate,
      amount: numericAmount,
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
  // ELIMINAR QUOTA
  // =====================================================

  async function deleteQuota(
    quota: Quota
  ) {
    const confirmed =
      window.confirm(
        `Tens a certeza que queres eliminar a quota da fração ${quota.fraction.fraction_code}?`
      )

    if (!confirmed) {
      return
    }

    const { data: quotaPayments } =
      await supabase
        .from('payments')
        .select('id')
        .eq('quota_id', quota.id)
        .limit(1)

    if (
      quotaPayments &&
      quotaPayments.length > 0
    ) {
      alert(
        'Não é possível eliminar esta quota porque existem pagamentos associados.'
      )
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
  // PAGAMENTOS
  // =====================================================

  async function loadPayments(
    quotaId: string
  ) {
    const { data, error } =
      await supabase
        .from('payments')
        .select(`
          id,
          quota_id,
          payment_date,
          amount,
          payment_method,
          reference,
          notes
        `)
        .eq('quota_id', quotaId)
        .order('payment_date', {
          ascending: false,
        })

    if (error) {
      console.error(
        'Erro ao carregar pagamentos:',
        error
      )

      setPayments([])
      return
    }

    setPayments(data ?? [])
  }

  function openPaymentForm(
    quota: Quota
  ) {
    setSelectedQuota(quota)
    setPaymentDate(
      new Date()
        .toISOString()
        .split('T')[0]
    )
    setPaymentAmount(
      quota.amount.toString()
    )
    setPaymentMethod('')
    setPaymentReference('')
    setPaymentNotes('')
    setShowPaymentForm(true)

    loadPayments(quota.id)
  }

  function closePaymentForm() {
    setShowPaymentForm(false)
    setSelectedQuota(null)
    setPayments([])
  }

  async function savePayment(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    if (!selectedQuota) {
      return
    }

    if (!paymentDate) {
      alert(
        'Indica a data do pagamento.'
      )
      return
    }

    const numericAmount =
      Number(paymentAmount)

    if (
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      alert(
        'Indica um valor de pagamento válido.'
      )
      return
    }

    const { error } =
      await supabase
        .from('payments')
        .insert({
          quota_id:
            selectedQuota.id,
          payment_date:
            paymentDate,
          amount:
            numericAmount,
          payment_method:
            paymentMethod.trim() ||
            null,
          reference:
            paymentReference.trim() ||
            null,
          notes:
            paymentNotes.trim() ||
            null,
        })

    if (error) {
      console.error(
        'Erro ao registar pagamento:',
        error
      )

      alert(
        `Erro ao registar pagamento: ${error.message}`
      )

      return
    }

    await updateQuotaStatus(
      selectedQuota
    )

    await loadPayments(
      selectedQuota.id
    )

    await loadQuotas(
      selectedCondominium
    )

    setPaymentAmount('')
    setPaymentReference('')
    setPaymentNotes('')
  }

  async function updateQuotaStatus(
    quota: Quota
  ) {
    const { data, error } =
      await supabase
        .from('payments')
        .select('amount')
        .eq('quota_id', quota.id)

    if (error) {
      console.error(
        'Erro ao calcular pagamentos:',
        error
      )
      return
    }

    const totalPaid =
      (data ?? []).reduce(
        (
          total: number,
          payment: any
        ) =>
          total +
          Number(payment.amount),
        0
      )

    let newStatus = 'pending'

    if (
      totalPaid >=
      Number(quota.amount)
    ) {
      newStatus = 'paid'
    } else if (
      totalPaid > 0
    ) {
      newStatus = 'partial'
    } else {
      const today =
        new Date()
          .toISOString()
          .split('T')[0]

      if (
        quota.due_date < today
      ) {
        newStatus = 'overdue'
      }
    }

    await supabase
      .from('quotas')
      .update({
        status: newStatus,
      })
      .eq('id', quota.id)
  }

  async function deletePayment(
    payment: Payment
  ) {
    const confirmed =
      window.confirm(
        'Tens a certeza que queres eliminar este pagamento?'
      )

    if (!confirmed) {
      return
    }

    const { error } =
      await supabase
        .from('payments')
        .delete()
        .eq('id', payment.id)

    if (error) {
      alert(
        `Erro ao eliminar pagamento: ${error.message}`
      )
      return
    }

    if (selectedQuota) {
      await updateQuotaStatus(
        selectedQuota
      )

      await loadPayments(
        selectedQuota.id
      )

      await loadQuotas(
        selectedCondominium
      )
    }
  }

  // =====================================================
  // FILTRO
  // =====================================================

  const filteredQuotas =
    quotas.filter((quota) => {
      if (
        yearFilter &&
        quota.reference_year !==
          Number(yearFilter)
      ) {
        return false
      }

      if (
        statusFilter &&
        quota.status !== statusFilter
      ) {
        return false
      }

      const text = `
        ${quota.fraction.fraction_code}
        ${quota.quota_type?.name ?? ''}
        ${quota.description ?? ''}
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
        total + Number(quota.amount),
      0
    )

  const pendingAmount =
    filteredQuotas
      .filter(
        (quota) =>
          quota.status !== 'paid' &&
          quota.status !== 'cancelled'
      )
      .reduce(
        (total, quota) =>
          total + Number(quota.amount),
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
          total + Number(quota.amount),
        0
      )

  // =====================================================
  // FORMATAÇÃO
  // =====================================================

  function formatCurrency(
    value: number
  ) {
    return new Intl.NumberFormat(
      'pt-PT',
      {
        style: 'currency',
        currency: 'EUR',
      }
    ).format(value)
  }

  function formatDate(
    value: string
  ) {
    if (!value) {
      return '—'
    }

    return new Intl.DateTimeFormat(
      'pt-PT'
    ).format(
      new Date(
        `${value}T00:00:00`
      )
    )
  }

  // =====================================================
  // INTERFACE
  // =====================================================

  return (
    <section className="page">

      <div className="section-header">

        <div>
          <h2>Quotas</h2>

          <p>
            Gere as quotas dos teus
            condomínios e os respetivos
            pagamentos.
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
          value={
            selectedCondominium
          }
          onChange={(e) =>
            setSelectedCondominium(
              e.target.value
            )
          }
        >
          {condominiums.map(
            (condominium) => (
              <option
                key={
                  condominium.id
                }
                value={
                  condominium.id
                }
              >
                {condominium.name}
              </option>
            )
          )}
        </select>

        <select
          value={yearFilter}
          onChange={(e) =>
            setYearFilter(
              e.target.value
            )
          }
        >
          <option value="">
            Todos os anos
          </option>

          {[
            new Date().getFullYear() - 1,
            new Date().getFullYear(),
            new Date().getFullYear() + 1,
          ].map((year) => (
            <option
              key={year}
              value={year}
            >
              {year}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
        >
          <option value="">
            Todos os estados
          </option>

          <option value="pending">
            Pendentes
          </option>

          <option value="partial">
            Pagamento parcial
          </option>

          <option value="paid">
            Pagas
          </option>

          <option value="overdue">
            Em atraso
          </option>

          <option value="cancelled">
            Anuladas
          </option>
        </select>

        <input
          type="text"
          placeholder="🔎 Pesquisar..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
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
            Total de quotas
          </small>

          <h3>
            {formatCurrency(
              totalAmount
            )}
          </h3>
        </div>

        <div className="form-card">
          <small>
            Pagas
          </small>

          <h3>
            {formatCurrency(
              paidAmount
            )}
          </h3>
        </div>

        <div className="form-card">
          <small>
            Por receber
          </small>

          <h3>
            {formatCurrency(
              pendingAmount
            )}
          </h3>
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
            onSubmit={
              saveQuota
            }
          >

            <div className="form-grid">

              <div>
                <label>
                  Fração *
                </label>

                <select
                  value={
                    fractionId
                  }
                  onChange={(e) =>
                    setFractionId(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Selecionar fração
                  </option>

                  {fractions.map(
                    (fraction) => (
                      <option
                        key={
                          fraction.id
                        }
                        value={
                          fraction.id
                        }
                      >
                        Fração{' '}
                        {
                          fraction.fraction_code
                        }
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
                  value={
                    quotaTypeId
                  }
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
                  value={
                    referenceYear
                  }
                  onChange={(e) =>
                    setReferenceYear(
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label>
                  Mês
                </label>

                <select
                  value={
                    referenceMonth
                  }
                  onChange={(e) =>
                    setReferenceMonth(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Sem mês
                  </option>

                  {monthLabels
                    .slice(1)
                    .map(
                      (
                        month,
                        index
                      ) => (
                        <option
                          key={
                            index + 1
                          }
                          value={
                            index + 1
                          }
                        >
                          {month}
                        </option>
                      )
                    )}
                </select>
              </div>

              <div>
                <label>
                  Data de vencimento *
                </label>

                <input
                  type="date"
                  value={
                    dueDate
                  }
                  onChange={(e) =>
                    setDueDate(
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label>
                  Valor (€) *
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={
                    amount
                  }
                  onChange={(e) =>
                    setAmount(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: 50.00"
                />
              </div>

              <div>
                <label>
                  Estado
                </label>

                <select
                  value={
                    status
                  }
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

                  <option value="partial">
                    Pago parcialmente
                  </option>

                  <option value="overdue">
                    Em atraso
                  </option>

                  <option value="cancelled">
                    Anulado
                  </option>
                </select>
              </div>

              <div>
                <label>
                  Descrição
                </label>

                <input
                  value={
                    description
                  }
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
                onClick={
                  resetForm
                }
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

        ) : filteredQuotas.length ===
          0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              💰
            </div>

            <h3>
              Nenhuma quota encontrada
            </h3>

            <p>
              Cria a primeira quota
              deste condomínio.
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
                    key={
                      quota.id
                    }
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
                        ? `${monthLabels[quota.reference_month]} ${quota.reference_year}`
                        : quota.reference_year}
                    </td>

                    <td>
                      {
                        formatDate(
                          quota.due_date
                        )
                      }
                    </td>

                    <td>
                      <strong>
                        {
                          formatCurrency(
                            Number(
                              quota.amount
                            )
                          )
                        }
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          statusClasses[
                            quota.status
                          ] ??
                          'pending'
                        }`}
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
                          title="Pagamento"
                          onClick={() =>
                            openPaymentForm(
                              quota
                            )
                          }
                        >
                          💳
                        </button>

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

      {/* PAGAMENTOS */}

      {showPaymentForm &&
        selectedQuota && (

          <div
            className="form-card"
            style={{
              marginTop: '24px',
            }}
          >

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
              }}
            >

              <div>

                <h3>
                  Pagamentos —
                  Fração{' '}
                  {
                    selectedQuota
                      .fraction
                      .fraction_code
                  }
                </h3>

                <p>
                  Quota:{' '}
                  {
                    formatCurrency(
                      Number(
                        selectedQuota.amount
                      )
                    )
                  }
                </p>

              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={
                  closePaymentForm
                }
              >
                Fechar
              </button>

            </div>

            <form
              onSubmit={
                savePayment
              }
            >

              <div className="form-grid">

                <div>
                  <label>
                    Data do pagamento *
                  </label>

                  <input
                    type="date"
                    value={
                      paymentDate
                    }
                    onChange={(e) =>
                      setPaymentDate(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <label>
                    Valor pago *
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      paymentAmount
                    }
                    onChange={(e) =>
                      setPaymentAmount(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <label>
                    Método de pagamento
                  </label>

                  <select
                    value={
                      paymentMethod
                    }
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Selecionar
                    </option>

                    <option value="transfer">
                      Transferência
                    </option>

                    <option value="debit">
                      Débito direto
                    </option>

                    <option value="cash">
                      Numerário
                    </option>

                    <option value="check">
                      Cheque
                    </option>

                    <option value="other">
                      Outro
                    </option>
                  </select>
                </div>

                <div>
                  <label>
                    Referência
                  </label>

                  <input
                    value={
                      paymentReference
                    }
                    onChange={(e) =>
                      setPaymentReference(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div
                  style={{
                    gridColumn:
                      '1 / -1',
                  }}
                >
                  <label>
                    Observações
                  </label>

                  <input
                    value={
                      paymentNotes
                    }
                    onChange={(e) =>
                      setPaymentNotes(
                        e.target.value
                      )
                    }
                  />
                </div>

              </div>

              <div className="form-actions">

                <button
                  type="submit"
                  className="create-button"
                >
                  + Registar pagamento
                </button>

              </div>

            </form>

            <div
              style={{
                marginTop: '24px',
              }}
            >

              <h4>
                Histórico de pagamentos
              </h4>

              {payments.length ===
              0 ? (

                <p>
                  Ainda não existem
                  pagamentos.
                </p>

              ) : (

                <table>

                  <thead>

                    <tr>
                      <th>Data</th>
                      <th>Valor</th>
                      <th>Método</th>
                      <th>Referência</th>
                      <th></th>
                    </tr>

                  </thead>

                  <tbody>

                    {payments.map(
                      (payment) => (

                        <tr
                          key={
                            payment.id
                          }
                        >

                          <td>
                            {
                              formatDate(
                                payment.payment_date
                              )
                            }
                          </td>

                          <td>
                            <strong>
                              {
                                formatCurrency(
                                  Number(
                                    payment.amount
                                  )
                                )
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              payment.payment_method ??
                              '—'
                            }
                          </td>

                          <td>
                            {
                              payment.reference ??
                              '—'
                            }
                          </td>

                          <td>

                            <button
                              title="Eliminar pagamento"
                              onClick={() =>
                                deletePayment(
                                  payment
                                )
                              }
                            >
                              🗑️
                            </button>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              )}

            </div>

          </div>

        )}

    </section>
  )
}

export default Quotas
