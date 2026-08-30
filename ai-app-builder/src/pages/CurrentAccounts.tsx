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

type Quota = {
  id: string
  fraction_id: string
  reference_year: number
  reference_month: number | null
  description: string | null
  due_date: string
  amount: number
  status: string
}

type Payment = {
  id: string
  quota_id: string
  payment_date: string
  amount: number
  payment_method: string | null
  reference: string | null
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

function CurrentAccounts() {
  const [condominiums, setCondominiums] = useState<Condominium[]>([])
  const [fractions, setFractions] = useState<Fraction[]>([])
  const [quotas, setQuotas] = useState<Quota[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  const [selectedCondominium, setSelectedCondominium] = useState('')
  const [selectedFraction, setSelectedFraction] = useState('')

  const [yearFilter, setYearFilter] = useState(
    new Date().getFullYear().toString()
  )

  const [loading, setLoading] = useState(true)
  const [loadingPayments, setLoadingPayments] = useState(false)

  const [selectedQuota, setSelectedQuota] = useState<Quota | null>(null)
  const [showPayments, setShowPayments] = useState(false)

  // =====================================================
  // FORMATAÇÃO
  // =====================================================

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  function formatDate(value: string) {
    if (!value) {
      return '—'
    }

    return new Intl.DateTimeFormat('pt-PT').format(
      new Date(`${value}T00:00:00`)
    )
  }

  function getReference(quota: Quota) {
    if (quota.reference_month) {
      return `${monthLabels[quota.reference_month]} ${quota.reference_year}`
    }

    return quota.reference_year.toString()
  }

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
    setFractions([])
    setSelectedFraction('')
    setQuotas([])
    setPayments([])

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
      return
    }

    const result = data ?? []

    setFractions(result)

    if (result.length > 0) {
      setSelectedFraction(result[0].id)
    }
  }

  // =====================================================
  // QUOTAS
  // =====================================================

  async function loadQuotas(
    condominiumId: string,
    fractionId: string
  ) {
    setLoading(true)

    const { data, error } = await supabase
      .from('quotas')
      .select(`
        id,
        fraction_id,
        reference_year,
        reference_month,
        description,
        due_date,
        amount,
        status,
        fractions!inner (
          id,
          condominium_id
        )
      `)
      .eq('fraction_id', fractionId)
      .eq(
        'fractions.condominium_id',
        condominiumId
      )
      .order('due_date', {
        ascending: true,
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

    const result: Quota[] = (data ?? []).map(
      (item: any) => ({
        id: item.id,
        fraction_id: item.fraction_id,
        reference_year: item.reference_year,
        reference_month:
          item.reference_month,
        description: item.description,
        due_date: item.due_date,
        amount: Number(item.amount),
        status: item.status,
      })
    )

    setQuotas(result)
    setLoading(false)
  }

  // =====================================================
  // PAGAMENTOS
  // =====================================================

  async function loadPaymentsForQuotas(
    quotaList: Quota[]
  ) {
    if (quotaList.length === 0) {
      setPayments([])
      return
    }

    setLoadingPayments(true)

    const quotaIds = quotaList.map(
      (quota) => quota.id
    )

    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        quota_id,
        payment_date,
        amount,
        payment_method,
        reference
      `)
      .in('quota_id', quotaIds)
      .order('payment_date', {
        ascending: true,
      })

    if (error) {
      console.error(
        'Erro ao carregar pagamentos:',
        error
      )

      setPayments([])
      setLoadingPayments(false)
      return
    }

    setPayments(data ?? [])
    setLoadingPayments(false)
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
  }, [selectedCondominium])

  useEffect(() => {
    if (
      !selectedCondominium ||
      !selectedFraction
    ) {
      setQuotas([])
      setPayments([])
      return
    }

    loadQuotas(
      selectedCondominium,
      selectedFraction
    )
  }, [
    selectedCondominium,
    selectedFraction,
  ])

  useEffect(() => {
    if (quotas.length === 0) {
      setPayments([])
      return
    }

    loadPaymentsForQuotas(quotas)
  }, [quotas])

  // =====================================================
  // PAGAMENTOS POR QUOTA
  // =====================================================

  function getQuotaPayments(quotaId: string) {
    return payments.filter(
      (payment) =>
        payment.quota_id === quotaId
    )
  }

  function getPaidAmount(quotaId: string) {
    return getQuotaPayments(quotaId).reduce(
      (total, payment) =>
        total + Number(payment.amount),
      0
    )
  }

  function getBalance(quota: Quota) {
    const paid = getPaidAmount(quota.id)

    return Math.max(
      Number(quota.amount) - paid,
      0
    )
  }

  function getEffectiveStatus(quota: Quota) {
    const paid = getPaidAmount(quota.id)
    const amount = Number(quota.amount)

    if (quota.status === 'cancelled') {
      return 'cancelled'
    }

    if (paid >= amount) {
      return 'paid'
    }

    if (paid > 0) {
      return 'partial'
    }

    const today = new Date()
      .toISOString()
      .split('T')[0]

    if (quota.due_date < today) {
      return 'overdue'
    }

    return 'pending'
  }

  // =====================================================
  // FILTRO POR ANO
  // =====================================================

  const filteredQuotas = quotas.filter(
    (quota) => {
      if (!yearFilter) {
        return true
      }

      return (
        quota.reference_year ===
        Number(yearFilter)
      )
    }
  )

  // =====================================================
  // TOTAIS
  // =====================================================

  const totalQuotas = filteredQuotas.reduce(
    (total, quota) =>
      total + Number(quota.amount),
    0
  )

  const totalPaid = filteredQuotas.reduce(
    (total, quota) =>
      total + getPaidAmount(quota.id),
    0
  )

  const totalBalance = filteredQuotas.reduce(
    (total, quota) =>
      total + getBalance(quota),
    0
  )

  const overdueBalance = filteredQuotas
    .filter(
      (quota) =>
        getEffectiveStatus(quota) ===
        'overdue'
    )
    .reduce(
      (total, quota) =>
        total + getBalance(quota),
      0
    )

  // =====================================================
  // HISTÓRICO DE PAGAMENTOS
  // =====================================================

  function openPayments(quota: Quota) {
    setSelectedQuota(quota)
    setShowPayments(true)
  }

  function closePayments() {
    setSelectedQuota(null)
    setShowPayments(false)
  }

  // =====================================================
  // INTERFACE
  // =====================================================

  const selectedFractionData =
    fractions.find(
      (fraction) =>
        fraction.id === selectedFraction
    )

  return (
    <section className="page">

      {/* CABEÇALHO */}

      <div className="section-header">

        <div>
          <h2>Conta Corrente</h2>

          <p>
            Consulte a situação financeira
            de cada fração.
          </p>
        </div>

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

        <label>
          Fração
        </label>

        <select
          value={selectedFraction}
          onChange={(e) =>
            setSelectedFraction(
              e.target.value
            )
          }
        >
          {fractions.length === 0 ? (
            <option value="">
              Nenhuma fração
            </option>
          ) : (
            fractions.map(
              (fraction) => (
                <option
                  key={fraction.id}
                  value={fraction.id}
                >
                  Fração{' '}
                  {fraction.fraction_code}
                </option>
              )
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

      </div>

      {/* IDENTIFICAÇÃO DA FRAÇÃO */}

      {selectedFractionData && (

        <div
          className="form-card"
          style={{
            marginBottom: '24px',
          }}
        >
          <small>
            Conta corrente da fração
          </small>

          <h3>
            Fração{' '}
            {
              selectedFractionData.fraction_code
            }
          </h3>
        </div>

      )}

      {/* RESUMO */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, 1fr)',
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
              totalQuotas
            )}
          </h3>
        </div>

        <div className="form-card">
          <small>
            Total pago
          </small>

          <h3>
            {formatCurrency(
              totalPaid
            )}
          </h3>
        </div>

        <div className="form-card">
          <small>
            Saldo em dívida
          </small>

          <h3>
            {formatCurrency(
              totalBalance
            )}
          </h3>
        </div>

        <div className="form-card">
          <small>
            Em atraso
          </small>

          <h3>
            {formatCurrency(
              overdueBalance
            )}
          </h3>
        </div>

      </div>

      {/* TABELA */}

      <div className="table-card">

        {loading ? (

          <div className="loading">
            A carregar conta corrente...
          </div>

        ) : filteredQuotas.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              💳
            </div>

            <h3>
              Nenhuma quota encontrada
            </h3>

            <p>
              Não existem quotas para esta
              fração no período selecionado.
            </p>

          </div>

        ) : (

          <table>

            <thead>

              <tr>
                <th>Referência</th>
                <th>Descrição</th>
                <th>Vencimento</th>
                <th>Quota</th>
                <th>Pago</th>
                <th>Saldo</th>
                <th>Estado</th>
                <th></th>
              </tr>

            </thead>

            <tbody>

              {filteredQuotas.map(
                (quota) => {

                  const paid =
                    getPaidAmount(
                      quota.id
                    )

                  const balance =
                    getBalance(
                      quota
                    )

                  const effectiveStatus =
                    getEffectiveStatus(
                      quota
                    )

                  return (

                    <tr
                      key={quota.id}
                    >

                      <td>
                        <strong>
                          {getReference(
                            quota
                          )}
                        </strong>
                      </td>

                      <td>
                        {
                          quota.description ??
                          '—'
                        }
                      </td>

                      <td>
                        {formatDate(
                          quota.due_date
                        )}
                      </td>

                      <td>
                        <strong>
                          {formatCurrency(
                            Number(
                              quota.amount
                            )
                          )}
                        </strong>
                      </td>

                      <td>
                        {formatCurrency(
                          paid
                        )}
                      </td>

                      <td>
                        <strong>
                          {formatCurrency(
                            balance
                          )}
                        </strong>
                      </td>

                      <td>

                        <span
                          className={`status-badge ${
                            statusClasses[
                              effectiveStatus
                            ] ??
                            'pending'
                          }`}
                        >
                          {
                            statusLabels[
                              effectiveStatus
                            ] ??
                            effectiveStatus
                          }
                        </span>

                      </td>

                      <td>

                        <div className="table-actions">

                          <button
                            title="Ver pagamentos"
                            onClick={() =>
                              openPayments(
                                quota
                              )
                            }
                          >
                            💳
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                }
              )}

            </tbody>

          </table>

        )}

      </div>

      {/* HISTÓRICO DE PAGAMENTOS */}

      {showPayments &&
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
                  Histórico de pagamentos
                </h3>

                <p>
                  {
                    selectedFractionData
                      ?.fraction_code
                  }{' '}
                  —{' '}
                  {getReference(
                    selectedQuota
                  )}
                </p>

              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={
                  closePayments
                }
              >
                Fechar
              </button>

            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3, 1fr)',
                gap: '16px',
                marginTop: '20px',
                marginBottom: '20px',
              }}
            >

              <div>
                <small>
                  Valor da quota
                </small>

                <h3>
                  {formatCurrency(
                    Number(
                      selectedQuota.amount
                    )
                  )}
                </h3>
              </div>

              <div>
                <small>
                  Total pago
                </small>

                <h3>
                  {formatCurrency(
                    getPaidAmount(
                      selectedQuota.id
                    )
                  )}
                </h3>
              </div>

              <div>
                <small>
                  Saldo
                </small>

                <h3>
                  {formatCurrency(
                    getBalance(
                      selectedQuota
                    )
                  )}
                </h3>
              </div>

            </div>

            {loadingPayments ? (

              <div className="loading">
                A carregar pagamentos...
              </div>

            ) : getQuotaPayments(
                selectedQuota.id
              ).length === 0 ? (

              <div className="empty-state">

                <p>
                  Ainda não existem
                  pagamentos para esta quota.
                </p>

              </div>

            ) : (

              <table>

                <thead>

                  <tr>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Método</th>
                    <th>Referência</th>
                  </tr>

                </thead>

                <tbody>

                  {getQuotaPayments(
                    selectedQuota.id
                  ).map(
                    (payment) => (

                      <tr
                        key={
                          payment.id
                        }
                      >

                        <td>
                          {formatDate(
                            payment.payment_date
                          )}
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              Number(
                                payment.amount
                              )
                            )}
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

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}

          </div>

        )}

    </section>
  )
}

export default CurrentAccounts
