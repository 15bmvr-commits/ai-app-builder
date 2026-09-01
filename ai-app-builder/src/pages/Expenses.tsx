import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type Condominium = {
  id: string
  name: string
}

type Supplier = {
  id: string
  name: string
  tax_number: string | null
}

type ExpenseCategory = {
  id: string
  condominium_id: string
  name: string
  description: string | null
}

type Expense = {
  id: string
  condominium_id: string
  supplier_id: string | null
  category_id: string | null
  invoice_number: string | null
  description: string
  expense_date: string
  net_amount: number | null
  vat_amount: number | null
  total_amount: number
  payment_status: 'pending' | 'paid' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
  supplier: Supplier | null
  category: ExpenseCategory | null
}

const paymentStatusLabels: Record<
  Expense['payment_status'],
  string
> = {
  pending: 'Pendente',
  paid: 'Pago',
  cancelled: 'Cancelada',
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

function formatDate(value: string) {
  if (!value) {
    return '—'
  }

  const date = new Date(`${value}T00:00:00`)

  return new Intl.DateTimeFormat('pt-PT').format(date)
}

function Expenses() {
  const [condominiums, setCondominiums] = useState<
    Condominium[]
  >([])

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<
    ExpenseCategory[]
  >([])

  const [expenses, setExpenses] = useState<Expense[]>([])

  const [selectedCondominium, setSelectedCondominium] =
    useState('')

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingExpenseId, setEditingExpenseId] =
    useState<string | null>(null)

  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [description, setDescription] = useState('')
  const [expenseDate, setExpenseDate] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [netAmount, setNetAmount] = useState('')
  const [vatAmount, setVatAmount] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [paymentStatus, setPaymentStatus] =
    useState<Expense['payment_status']>('pending')
  const [notes, setNotes] = useState('')

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
      setCondominiums([])
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

  async function loadSuppliers() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name, tax_number')
      .eq('active', true)
      .order('name')

    if (error) {
      console.error(
        'Erro ao carregar fornecedores:',
        error
      )
      setSuppliers([])
      return
    }

    setSuppliers(data ?? [])
  }

  async function loadCategories(condominiumId: string) {
    const { data, error } = await supabase
      .from('expense_categories')
      .select(
        'id, condominium_id, name, description'
      )
      .eq('condominium_id', condominiumId)
      .eq('active', true)
      .order('name')

    if (error) {
      console.error(
        'Erro ao carregar categorias:',
        error
      )
      setCategories([])
      return
    }

    setCategories(data ?? [])
  }

  async function loadExpenses(condominiumId: string) {
    setLoading(true)

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        id,
        condominium_id,
        supplier_id,
        category_id,
        invoice_number,
        description,
        expense_date,
        net_amount,
        vat_amount,
        total_amount,
        payment_status,
        notes,
        created_at,
        updated_at,
        suppliers (
          id,
          name,
          tax_number
        ),
        expense_categories (
          id,
          condominium_id,
          name,
          description
        )
      `)
      .eq('condominium_id', condominiumId)
      .order('expense_date', {
        ascending: false,
      })
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Erro ao carregar despesas:',
        error
      )
      setExpenses([])
      setLoading(false)
      return
    }

    const result: Expense[] = (data ?? []).map(
      (item: any) => ({
        id: item.id,
        condominium_id: item.condominium_id,
        supplier_id: item.supplier_id,
        category_id: item.category_id,
        invoice_number: item.invoice_number,
        description: item.description,
        expense_date: item.expense_date,
        net_amount:
          item.net_amount !== null
            ? Number(item.net_amount)
            : null,
        vat_amount:
          item.vat_amount !== null
            ? Number(item.vat_amount)
            : null,
        total_amount: Number(item.total_amount),
        payment_status: item.payment_status,
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        supplier: item.suppliers ?? null,
        category: item.expense_categories ?? null,
      })
    )

    setExpenses(result)
    setLoading(false)
  }

  useEffect(() => {
    loadCondominiums()
    loadSuppliers()
  }, [])

  useEffect(() => {
    if (!selectedCondominium) {
      return
    }

    loadCategories(selectedCondominium)
    loadExpenses(selectedCondominium)
  }, [selectedCondominium])

  function resetForm() {
    setInvoiceNumber('')
    setDescription('')
    setExpenseDate('')
    setSupplierId('')
    setCategoryId('')
    setNetAmount('')
    setVatAmount('')
    setTotalAmount('')
    setPaymentStatus('pending')
    setNotes('')
    setEditingExpenseId(null)
    setShowForm(false)
  }

  function openNewExpenseForm() {
    setEditingExpenseId(null)

    setInvoiceNumber('')
    setDescription('')

    const today = new Date()
      .toISOString()
      .split('T')[0]

    setExpenseDate(today)
    setSupplierId('')
    setCategoryId('')
    setNetAmount('')
    setVatAmount('')
    setTotalAmount('')
    setPaymentStatus('pending')
    setNotes('')

    setShowForm(true)
  }

  function editExpense(expense: Expense) {
    setEditingExpenseId(expense.id)

    setInvoiceNumber(
      expense.invoice_number ?? ''
    )

    setDescription(expense.description)
    setExpenseDate(expense.expense_date)

    setSupplierId(expense.supplier_id ?? '')
    setCategoryId(expense.category_id ?? '')

    setNetAmount(
      expense.net_amount !== null
        ? expense.net_amount.toFixed(2)
        : ''
    )

    setVatAmount(
      expense.vat_amount !== null
        ? expense.vat_amount.toFixed(2)
        : ''
    )

    setTotalAmount(
      expense.total_amount.toFixed(2)
    )

    setPaymentStatus(expense.payment_status)
    setNotes(expense.notes ?? '')

    setShowForm(true)
  }

  function parseAmount(value: string) {
    const normalized = value
      .replace(',', '.')
      .replace(/[^\d.-]/g, '')

    const parsed = Number(normalized)

    return Number.isFinite(parsed) ? parsed : 0
  }

  function calculateTotal(
    netValue: string,
    vatValue: string
  ) {
    const net = parseAmount(netValue)
    const vat = parseAmount(vatValue)

    const total = net + vat

    if (total === 0 && !netValue && !vatValue) {
      return ''
    }

    return total.toFixed(2)
  }

  function handleNetAmountChange(value: string) {
    setNetAmount(value)

    setTotalAmount(
      calculateTotal(value, vatAmount)
    )
  }

  function handleVatAmountChange(value: string) {
    setVatAmount(value)

    setTotalAmount(
      calculateTotal(netAmount, value)
    )
  }

  async function saveExpense(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    if (!selectedCondominium) {
      alert('Seleciona um condomínio.')
      return
    }

    if (!description.trim()) {
      alert('A descrição é obrigatória.')
      return
    }

    if (!expenseDate) {
      alert('A data da despesa é obrigatória.')
      return
    }

    const total = parseAmount(totalAmount)

    if (total <= 0) {
      alert('O total da despesa deve ser superior a zero.')
      return
    }

    setSaving(true)

    const expensePayload = {
      condominium_id: selectedCondominium,
      supplier_id: supplierId || null,
      category_id: categoryId || null,
      invoice_number:
        invoiceNumber.trim() || null,
      description: description.trim(),
      expense_date: expenseDate,
      net_amount:
        netAmount.trim() !== ''
          ? parseAmount(netAmount)
          : null,
      vat_amount:
        vatAmount.trim() !== ''
          ? parseAmount(vatAmount)
          : null,
      total_amount: total,
      payment_status: paymentStatus,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }

    if (editingExpenseId) {
      const { error } = await supabase
        .from('expenses')
        .update(expensePayload)
        .eq('id', editingExpenseId)

      if (error) {
        console.error(
          'Erro ao atualizar despesa:',
          error
        )

        alert(
          `Erro ao atualizar despesa: ${error.message}`
        )

        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('expenses')
        .insert(expensePayload)

      if (error) {
        console.error(
          'Erro ao criar despesa:',
          error
        )

        alert(
          `Erro ao criar despesa: ${error.message}`
        )

        setSaving(false)
        return
      }
    }

    setSaving(false)

    resetForm()

    await loadExpenses(selectedCondominium)
  }

  async function deleteExpense(expense: Expense) {
    const confirmed = window.confirm(
      `Queres eliminar a despesa "${expense.description}"?\n\nValor: ${formatCurrency(
        expense.total_amount
      )}`
    )

    if (!confirmed) {
      return
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expense.id)

    if (error) {
      console.error(
        'Erro ao eliminar despesa:',
        error
      )

      alert(
        `Erro ao eliminar despesa: ${error.message}`
      )

      return
    }

    await loadExpenses(selectedCondominium)
  }

  const filteredExpenses = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase()

    if (!searchText) {
      return expenses
    }

    return expenses.filter((expense) => {
      const text = `
        ${expense.description}
        ${expense.invoice_number ?? ''}
        ${expense.supplier?.name ?? ''}
        ${expense.supplier?.tax_number ?? ''}
        ${expense.category?.name ?? ''}
        ${paymentStatusLabels[expense.payment_status]}
        ${expense.notes ?? ''}
      `.toLowerCase()

      return text.includes(searchText)
    })
  }, [expenses, search])

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce(
      (sum, expense) =>
        sum + Number(expense.total_amount),
      0
    )
  }, [filteredExpenses])

  const pendingExpenses = useMemo(() => {
    return filteredExpenses
      .filter(
        (expense) =>
          expense.payment_status === 'pending'
      )
      .reduce(
        (sum, expense) =>
          sum + Number(expense.total_amount),
        0
      )
  }, [filteredExpenses])

  const paidExpenses = useMemo(() => {
    return filteredExpenses
      .filter(
        (expense) =>
          expense.payment_status === 'paid'
      )
      .reduce(
        (sum, expense) =>
          sum + Number(expense.total_amount),
        0
      )
  }, [filteredExpenses])

  return (
    <section className="page">
      <div className="section-header">
        <div>
          <h2>Despesas</h2>
          <p>
            Gere as despesas e os pagamentos dos
            condomínios.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={openNewExpenseForm}
        >
          + Nova despesa
        </button>
      </div>

      <div className="filter-bar">
        <label>Condomínio</label>

        <select
          value={selectedCondominium}
          onChange={(e) =>
            setSelectedCondominium(e.target.value)
          }
        >
          {condominiums.map((condominium) => (
            <option
              key={condominium.id}
              value={condominium.id}
            >
              {condominium.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="🔎 Pesquisar despesas..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(3, minmax(0, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div className="form-card">
          <div
            style={{
              color: '#6b7280',
              fontSize: '14px',
            }}
          >
            Total
          </div>

          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              marginTop: '5px',
            }}
          >
            {formatCurrency(totalExpenses)}
          </div>
        </div>

        <div className="form-card">
          <div
            style={{
              color: '#6b7280',
              fontSize: '14px',
            }}
          >
            Pendente
          </div>

          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              marginTop: '5px',
            }}
          >
            {formatCurrency(pendingExpenses)}
          </div>
        </div>

        <div className="form-card">
          <div
            style={{
              color: '#6b7280',
              fontSize: '14px',
            }}
          >
            Pago
          </div>

          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              marginTop: '5px',
            }}
          >
            {formatCurrency(paidExpenses)}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>
            {editingExpenseId
              ? 'Editar despesa'
              : 'Nova despesa'}
          </h3>

          <form onSubmit={saveExpense}>
            <div className="form-grid">
              <div>
                <label>Data *</label>

                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) =>
                    setExpenseDate(e.target.value)
                  }
                  required
                />
              </div>

              <div>
                <label>N.º fatura / documento</label>

                <input
                  value={invoiceNumber}
                  onChange={(e) =>
                    setInvoiceNumber(e.target.value)
                  }
                  placeholder="Ex.: FT 2026/123"
                />
              </div>

              <div>
                <label>Fornecedor</label>

                <select
                  value={supplierId}
                  onChange={(e) =>
                    setSupplierId(e.target.value)
                  }
                >
                  <option value="">
                    — Selecionar fornecedor —
                  </option>

                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.id}
                      value={supplier.id}
                    >
                      {supplier.name}
                      {supplier.tax_number
                        ? ` — ${supplier.tax_number}`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Categoria</label>

                <select
                  value={categoryId}
                  onChange={(e) =>
                    setCategoryId(e.target.value)
                  }
                >
                  <option value="">
                    — Selecionar categoria —
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  gridColumn: '1 / -1',
                }}
              >
                <label>Descrição *</label>

                <input
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Descrição da despesa"
                  required
                />
              </div>

              <div>
                <label>Valor sem IVA</label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={netAmount}
                  onChange={(e) =>
                    handleNetAmountChange(
                      e.target.value
                    )
                  }
                  placeholder="0,00"
                />
              </div>

              <div>
                <label>IVA</label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={vatAmount}
                  onChange={(e) =>
                    handleVatAmountChange(
                      e.target.value
                    )
                  }
                  placeholder="0,00"
                />
              </div>

              <div>
                <label>Total *</label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalAmount}
                  onChange={(e) =>
                    setTotalAmount(
                      e.target.value
                    )
                  }
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <label>Estado</label>

                <select
                  value={paymentStatus}
                  onChange={(e) =>
                    setPaymentStatus(
                      e.target.value as Expense['payment_status']
                    )
                  }
                >
                  <option value="pending">
                    Pendente
                  </option>

                  <option value="paid">
                    Pago
                  </option>

                  <option value="cancelled">
                    Cancelada
                  </option>
                </select>
              </div>

              <div
                style={{
                  gridColumn: '1 / -1',
                }}
              >
                <label>Observações</label>

                <textarea
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value)
                  }
                  rows={4}
                  placeholder="Observações adicionais..."
                  style={{
                    width: '100%',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>

            <div
              className="form-actions"
              style={{ marginTop: '24px' }}
            >
              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="create-button"
                disabled={saving}
              >
                {saving
                  ? 'A guardar...'
                  : editingExpenseId
                    ? 'Guardar alterações'
                    : 'Criar despesa'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-card">
        {loading ? (
          <div className="loading">
            A carregar despesas...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💶</div>

            <h3>Ainda não existem despesas</h3>

            <p>
              Cria a primeira despesa para este
              condomínio.
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Fatura</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Fornecedor</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td>
                    {formatDate(
                      expense.expense_date
                    )}
                  </td>

                  <td>
                    {expense.invoice_number ?? '—'}
                  </td>

                  <td>
                    <strong>
                      {expense.description}
                    </strong>
                  </td>

                  <td>
                    {expense.category?.name ?? '—'}
                  </td>

                  <td>
                    {expense.supplier?.name ?? '—'}
                  </td>

                  <td>
                    <strong>
                      {formatCurrency(
                        expense.total_amount
                      )}
                    </strong>
                  </td>

                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '5px 9px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background:
                          expense.payment_status ===
                          'paid'
                            ? '#dcfce7'
                            : expense.payment_status ===
                                'cancelled'
                              ? '#fee2e2'
                              : '#fef3c7',
                        color:
                          expense.payment_status ===
                          'paid'
                            ? '#166534'
                            : expense.payment_status ===
                                'cancelled'
                              ? '#991b1b'
                              : '#92400e',
                      }}
                    >
                      {
                        paymentStatusLabels[
                          expense.payment_status
                        ]
                      }
                    </span>
                  </td>

                  <td>
                    <div className="table-actions">
                      <button
                        title="Editar"
                        onClick={() =>
                          editExpense(expense)
                        }
                      >
                        ✏️
                      </button>

                      <button
                        title="Eliminar"
                        onClick={() =>
                          deleteExpense(expense)
                        }
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: 'right',
                    fontWeight: 700,
                  }}
                >
                  Total:
                </td>

                <td
                  style={{
                    fontWeight: 700,
                  }}
                >
                  {formatCurrency(totalExpenses)}
                </td>

                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </section>
  )
}

export default Expenses