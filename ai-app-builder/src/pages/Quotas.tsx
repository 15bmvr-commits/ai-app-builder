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

type Payment = {
  id: string
  quota_id: string
  payment_date: string
  amount: number
  payment_method: string | null
  reference: string | null
  notes: string | null
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
  total_paid: number
  balance: number
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

const paymentMethodLabels: Record<string, string> = {
  transfer: 'Transferência',
  debit: 'Débito direto',
  cash: 'Numerário',
  check: 'Cheque',
  other: 'Outro',
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
    useState(
      new Date().toISOString().split('T')[0]
    )

  const [paymentAmount, setPaymentAmount] =
    useState('')

  const [paymentMethod, setPaymentMethod] =
    useState('')

  const [paymentReference, setPaymentReference] =
    useState('')

  const [paymentNotes, setPaymentNotes] =
    useState('')

  // ============================================================
  // GERAÇÃO AUTOMÁTICA DE QUOTAS
  // ============================================================

  const [showGenerateForm, setShowGenerateForm] =
    useState(false)

  const [generateYear, setGenerateYear] =
    useState(new Date().getFullYear().toString())

  const [generateQuotaTypeId, setGenerateQuotaTypeId] =
    useState('')

  const [generateAmount, setGenerateAmount] =
    useState('')

  const [generateDueDay, setGenerateDueDay] =
    useState('10')

  const [generateDescription, setGenerateDescription] =
    useState('')

  const [generateAllFractions, setGenerateAllFractions] =
    useState(true)

  const [generateFractionIds, setGenerateFractionIds] =
    useState<string[]>([])

  const [generateMonths, setGenerateMonths] =
    useState<number[]>([])

  const [generating, setGenerating] =
    useState(false)

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

  function calculateStatus(
    amount: number,
    totalPaid: number,
    dueDate: string
  ) {
    if (totalPaid >= amount) {
      return 'paid'
    }

    if (totalPaid > 0) {
      return 'partial'
    }

    const today = new Date()
      .toISOString()
      .split('T')[0]

    if (dueDate < today) {
      return 'overdue'
    }

    return 'pending'
  }

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

  async function loadQuotaTypes(
  condominiumId: string
) {
  console.log(
    'A carregar tipos de quota para condomínio:',
    condominiumId
  )

  const { data, error } = await supabase
    .from('quota_types')
    .select(
      'id, name, description, recurring, condominium_id, active'
    )
    .eq('condominium_id', condominiumId)
    .order('name')

  console.log('Tipos de quota recebidos:', data)
  console.log('Erro tipos de quota:', error)

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

    const rawQuotas = (data ?? []).filter(
      (item: any) => item.fractions
    )

    if (rawQuotas.length === 0) {
      setQuotas([])
      setLoading(false)
      return
    }

    const quotaIds = rawQuotas.map(
      (item: any) => item.id
    )

    const { data: paymentData, error: paymentError } =
      await supabase
        .from('payments')
        .select('quota_id, amount')
        .in('quota_id', quotaIds)

    if (paymentError) {
      console.error(
        'Erro ao carregar pagamentos das quotas:',
        paymentError
      )
    }

    const paidByQuota: Record<string, number> = {}

    ;(paymentData ?? []).forEach(
      (payment: any) => {
        const quotaId = payment.quota_id

        paidByQuota[quotaId] =
          (paidByQuota[quotaId] ?? 0) +
          Number(payment.amount)
      }
    )

    const result: Quota[] = rawQuotas.map(
      (item: any) => {
        const quotaAmount =
          Number(item.amount)

        const totalPaid =
          paidByQuota[item.id] ?? 0

        const balance = Math.max(
          quotaAmount - totalPaid,
          0
        )

        const calculatedStatus =
          item.status === 'cancelled'
            ? 'cancelled'
            : calculateStatus(
                quotaAmount,
                totalPaid,
                item.due_date
              )

        return {
          id: item.id,
          fraction_id: item.fraction_id,
          quota_type_id:
            item.quota_type_id,
          reference_year:
            item.reference_year,
          reference_month:
            item.reference_month,
          description:
            item.description,
          due_date:
            item.due_date,
          amount: quotaAmount,
          status: calculatedStatus,
          fraction: item.fractions,
          quota_type:
            item.quota_types ?? null,
          total_paid: totalPaid,
          balance,
        }
      }
    )

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

  // ============================================================
  // FORMULÁRIO DE QUOTA MANUAL
  // ============================================================

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

    setShowGenerateForm(false)
  }

  function editQuota(quota: Quota) {
    setEditingId(quota.id)

    setFractionId(
      quota.fraction_id
    )

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
    setShowGenerateForm(false)
  }

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
      alert(
        'Indica o ano de referência.'
      )
      return
    }

    if (!dueDate) {
      alert(
        'Indica a data de vencimento.'
      )
      return
    }

    if (!amount.trim()) {
      alert(
        'Indica o valor da quota.'
      )
      return
    }

    const numericAmount =
      Number(amount)

    if (
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      alert(
        'Indica um valor válido.'
      )
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
      status:
        status === 'cancelled'
          ? 'cancelled'
          : 'pending',
    }

    if (editingId) {
      const { error } =
        await supabase
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
      const { error } =
        await supabase
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

  // ============================================================
  // GERAR QUOTAS AUTOMATICAMENTE
  // ============================================================

  function openGenerateForm() {
    setShowGenerateForm(true)
    setShowForm(false)
    setEditingId(null)

    setGenerateYear(
      new Date().getFullYear().toString()
    )

    setGenerateQuotaTypeId(
      quotaTypes.length > 0
        ? quotaTypes[0].id
        : ''
    )

    setGenerateAmount('')
    setGenerateDueDay('10')
    setGenerateDescription('')

    setGenerateAllFractions(true)
    setGenerateFractionIds([])

    setGenerateMonths([
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
    ])
  }

  function closeGenerateForm() {
    setShowGenerateForm(false)
  }

  function toggleGenerateMonth(
    month: number
  ) {
    setGenerateMonths(
      (current) =>
        current.includes(month)
          ? current.filter(
              (item) =>
                item !== month
            )
          : [...current, month].sort(
              (a, b) => a - b
            )
    )
  }

  function toggleGenerateFraction(
    fractionId: string
  ) {
    setGenerateFractionIds(
      (current) =>
        current.includes(fractionId)
          ? current.filter(
              (item) =>
                item !== fractionId
            )
          : [...current, fractionId]
    )
  }

  function selectAllGenerateMonths() {
    setGenerateMonths([
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
    ])
  }

  function clearGenerateMonths() {
    setGenerateMonths([])
  }

  function selectAllGenerateFractions() {
    setGenerateAllFractions(true)
    setGenerateFractionIds([])
  }

  function getDueDate(
    year: number,
    month: number,
    day: number
  ) {
    // Último dia do mês.
    const lastDay =
      new Date(
        year,
        month,
        0
      ).getDate()

    const validDay =
      Math.min(
        Math.max(day, 1),
        lastDay
      )

    return `${year}-${String(month).padStart(
      2,
      '0'
    )}-${String(validDay).padStart(
      2,
      '0'
    )}`
  }

  async function generateQuotas(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    if (!selectedCondominium) {
      alert(
        'Seleciona um condomínio.'
      )
      return
    }

    if (!generateQuotaTypeId) {
      alert(
        'Seleciona o tipo de quota.'
      )
      return
    }

    const numericYear =
      Number(generateYear)

    if (
      Number.isNaN(numericYear) ||
      numericYear < 2000 ||
      numericYear > 2100
    ) {
      alert(
        'Indica um ano válido.'
      )
      return
    }

    const numericAmount =
      Number(generateAmount)

    if (
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      alert(
        'Indica um valor válido para a quota.'
      )
      return
    }

    const numericDueDay =
      Number(generateDueDay)

    if (
      Number.isNaN(numericDueDay) ||
      numericDueDay < 1 ||
      numericDueDay > 31
    ) {
      alert(
        'O dia de vencimento deve estar entre 1 e 31.'
      )
      return
    }

    if (generateMonths.length === 0) {
      alert(
        'Seleciona pelo menos um mês.'
      )
      return
    }

    const selectedFractions =
      generateAllFractions
        ? fractions
        : fractions.filter(
            (fraction) =>
              generateFractionIds.includes(
                fraction.id
              )
          )

    if (selectedFractions.length === 0) {
      alert(
        'Seleciona pelo menos uma fração.'
      )
      return
    }

    setGenerating(true)

    try {
      /*
       * Carregar as quotas existentes para este condomínio/ano.
       * Usamos as frações para garantir que apenas analisamos
       * quotas deste condomínio.
       */
      const fractionIds =
        fractions.map(
          (fraction) => fraction.id
        )

      const { data: existingQuotas, error: existingError } =
        await supabase
          .from('quotas')
          .select(`
            id,
            fraction_id,
            quota_type_id,
            reference_year,
            reference_month
          `)
          .in(
            'fraction_id',
            fractionIds
          )
          .eq(
            'reference_year',
            numericYear
          )

      if (existingError) {
        console.error(
          'Erro ao verificar quotas existentes:',
          existingError
        )

        alert(
          `Erro ao verificar quotas existentes: ${existingError.message}`
        )

        return
      }

      const existingKeys =
        new Set<string>()

      ;(existingQuotas ?? []).forEach(
        (quota: any) => {
          const key = [
            quota.fraction_id,
            quota.quota_type_id ?? 'null',
            quota.reference_year,
            quota.reference_month ?? 'null',
          ].join('|')

          existingKeys.add(key)
        }
      )

      const rowsToInsert: Array<{
        fraction_id: string
        quota_type_id: string
        reference_year: number
        reference_month: number
        description: string | null
        due_date: string
        amount: number
        status: string
      }> = []

      let skipped = 0

      /*
       * Construir todas as quotas a criar.
       * Antes de adicionar cada uma, verificamos se já existe.
       */
      for (const fraction of selectedFractions) {
        for (const month of generateMonths) {
          const key = [
            fraction.id,
            generateQuotaTypeId,
            numericYear,
            month,
          ].join('|')

          if (existingKeys.has(key)) {
            skipped++
            continue
          }

          const dueDate =
            getDueDate(
              numericYear,
              month,
              numericDueDay
            )

          rowsToInsert.push({
            fraction_id:
              fraction.id,
            quota_type_id:
              generateQuotaTypeId,
            reference_year:
              numericYear,
            reference_month:
              month,
            description:
              generateDescription.trim() ||
              null,
            due_date:
              dueDate,
            amount:
              numericAmount,
            status:
              'pending',
          })

          /*
           * Adicionamos também ao Set para impedir
           * duplicados dentro da própria operação.
           */
          existingKeys.add(key)
        }
      }

      if (rowsToInsert.length === 0) {
        alert(
          `Não foram criadas novas quotas.\n\n${skipped} quota(s) já existiam.`
        )

        return
      }

      /*
       * Inserção em lote.
       */
      const { error: insertError } =
        await supabase
          .from('quotas')
          .insert(rowsToInsert)

      if (insertError) {
        console.error(
          'Erro ao gerar quotas:',
          insertError
        )

        alert(
          `Erro ao gerar quotas: ${insertError.message}`
        )

        return
      }

      const message =
        skipped > 0
          ? `Foram criadas ${rowsToInsert.length} quota(s).\n\n${skipped} quota(s) já existiam e foram ignoradas.`
          : `Foram criadas ${rowsToInsert.length} quota(s) com sucesso.`

      alert(message)

      setShowGenerateForm(false)

      await loadQuotas(
        selectedCondominium
      )
    } finally {
      setGenerating(false)
    }
  }

  // ============================================================
  // ELIMINAR QUOTA
  // ============================================================

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

    const {
      data: quotaPayments,
      error: paymentsError,
    } = await supabase
      .from('payments')
      .select('id')
      .eq('quota_id', quota.id)
      .limit(1)

    if (paymentsError) {
      console.error(
        'Erro ao verificar pagamentos:',
        paymentsError
      )

      alert(
        `Erro ao verificar pagamentos: ${paymentsError.message}`
      )

      return
    }

    if (
      quotaPayments &&
      quotaPayments.length > 0
    ) {
      alert(
        'Não é possível eliminar esta quota porque existem pagamentos associados.'
      )

      return
    }

    const { error } =
      await supabase
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

  // ============================================================
  // PAGAMENTOS
  // ============================================================

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

    setPayments(
      (data ?? []).map(
        (payment: any) => ({
          ...payment,
          amount: Number(
            payment.amount
          ),
        })
      )
    )
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
      quota.balance > 0
        ? quota.balance.toFixed(2)
        : ''
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

    const currentBalance =
      selectedQuota.balance

    if (currentBalance <= 0) {
      alert(
        'Esta quota já está totalmente paga.'
      )
      return
    }

    if (
      numericAmount >
      currentBalance + 0.001
    ) {
      alert(
        `O valor do pagamento não pode ser superior ao valor em dívida (${formatCurrency(
          currentBalance
        )}).`
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

    await loadPayments(
      selectedQuota.id
    )

    await loadQuotas(
      selectedCondominium
    )

    const newBalance =
      Math.max(
        currentBalance -
          numericAmount,
        0
      )

    const updatedQuota: Quota = {
      ...selectedQuota,
      total_paid:
        selectedQuota.total_paid +
        numericAmount,
      balance: newBalance,
      status:
        calculateStatus(
          selectedQuota.amount,
          selectedQuota.total_paid +
            numericAmount,
          selectedQuota.due_date
        ),
    }

    setSelectedQuota(
      updatedQuota
    )

    setPaymentAmount(
      newBalance > 0
        ? newBalance.toFixed(2)
        : ''
    )

    setPaymentReference('')
    setPaymentNotes('')
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
      await loadPayments(
        selectedQuota.id
      )

      await loadQuotas(
        selectedCondominium
      )

      const { data } =
        await supabase
          .from('payments')
          .select('amount')
          .eq(
            'quota_id',
            selectedQuota.id
          )

      const totalPaid =
        (data ?? []).reduce(
          (
            total: number,
            item: any
          ) =>
            total +
            Number(item.amount),
          0
        )

      const balance =
        Math.max(
          selectedQuota.amount -
            totalPaid,
          0
        )

      setSelectedQuota({
        ...selectedQuota,
        total_paid:
          totalPaid,
        balance,
        status:
          calculateStatus(
            selectedQuota.amount,
            totalPaid,
            selectedQuota.due_date
          ),
      })

      setPaymentAmount(
        balance > 0
          ? balance.toFixed(2)
          : ''
      )
    }
  }

  // ============================================================
  // FILTROS E TOTAIS
  // ============================================================

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
        quota.status !==
          statusFilter
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

  const totalAmount =
    filteredQuotas.reduce(
      (total, quota) =>
        total +
        Number(quota.amount),
      0
    )

  const totalPaidAmount =
    filteredQuotas.reduce(
      (total, quota) =>
        total +
        Number(quota.total_paid),
      0
    )

  const pendingAmount =
    filteredQuotas
      .filter(
        (quota) =>
          quota.status !==
            'paid' &&
          quota.status !==
            'cancelled'
      )
      .reduce(
        (total, quota) =>
          total +
          Number(quota.balance),
        0
      )

  const overdueAmount =
    filteredQuotas
      .filter(
        (quota) =>
          quota.status ===
          'overdue'
      )
      .reduce(
        (total, quota) =>
          total +
          Number(quota.balance),
        0
      )

  // ============================================================
  // RENDER
  // ============================================================

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

        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >

          <button
            className="secondary-button"
            onClick={
              openGenerateForm
            }
          >
            ⚡ Gerar quotas
          </button>

          <button
            className="secondary-button"
            onClick={
              openNewQuotaForm
            }
          >
            + Nova quota
          </button>

        </div>

      </div>

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
              totalAmount
            )}
          </h3>
        </div>

        <div className="form-card">
          <small>
            Total recebido
          </small>

          <h3>
            {formatCurrency(
              totalPaidAmount
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

        <div className="form-card">
          <small>
            Em atraso
          </small>

          <h3>
            {formatCurrency(
              overdueAmount
            )}
          </h3>
        </div>

      </div>

      {/* ======================================================
          FORMULÁRIO GERAR QUOTAS
          ====================================================== */}

      {showGenerateForm && (

        <div
          className="form-card"
          style={{
            marginBottom: '24px',
          }}
        >

          <h3>
            ⚡ Gerar quotas automaticamente
          </h3>

          <p
            style={{
              marginBottom: '20px',
            }}
          >
            Cria quotas para várias frações e meses
            de uma só vez. As quotas que já existirem
            serão ignoradas.
          </p>

          <form
            onSubmit={
              generateQuotas
            }
          >

            <div className="form-grid">

              <div>
                <label>
                  Ano *
                </label>

                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={
                    generateYear
                  }
                  onChange={(e) =>
                    setGenerateYear(
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label>
                  Tipo de quota *
                </label>

                <select
                  value={
                    generateQuotaTypeId
                  }
                  onChange={(e) =>
                    setGenerateQuotaTypeId(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Selecionar tipo
                  </option>

                  {quotaTypes.map(
                    (type) => (
                      <option
                        key={type.id}
                        value={type.id}
                      >
                        {type.name}
                        {type.recurring
                          ? ' — Recorrente'
                          : ''}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label>
                  Valor da quota (€) *
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={
                    generateAmount
                  }
                  onChange={(e) =>
                    setGenerateAmount(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: 41.00"
                />
              </div>

              <div>
                <label>
                  Dia de vencimento *
                </label>

                <input
                  type="number"
                  min="1"
                  max="31"
                  value={
                    generateDueDay
                  }
                  onChange={(e) =>
                    setGenerateDueDay(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: 10"
                />

                <small
                  style={{
                    display: 'block',
                    marginTop: '5px',
                  }}
                >
                  Se o mês não tiver esse dia,
                  será utilizado o último dia do mês.
                </small>
              </div>

              <div
                style={{
                  gridColumn:
                    '1 / -1',
                }}
              >
                <label>
                  Descrição
                </label>

                <input
                  value={
                    generateDescription
                  }
                  onChange={(e) =>
                    setGenerateDescription(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: Quota ordinária"
                />
              </div>

            </div>

            {/* MESES */}

            <div
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
                  marginBottom:
                    '10px',
                }}
              >

                <label>
                  Meses *
                </label>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                  }}
                >

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      selectAllGenerateMonths
                    }
                  >
                    Todos
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      clearGenerateMonths
                    }
                  >
                    Limpar
                  </button>

                </div>

              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(4, 1fr)',
                  gap: '8px',
                }}
              >

                {monthLabels
                  .slice(1)
                  .map(
                    (
                      month,
                      index
                    ) => {

                      const monthNumber =
                        index + 1

                      const checked =
                        generateMonths.includes(
                          monthNumber
                        )

                      return (
                        <label
                          key={
                            monthNumber
                          }
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: '8px',
                            padding:
                              '8px',
                            border:
                              '1px solid #ddd',
                            borderRadius:
                              '6px',
                            cursor:
                              'pointer',
                          }}
                        >

                          <input
                            type="checkbox"
                            checked={
                              checked
                            }
                            onChange={() =>
                              toggleGenerateMonth(
                                monthNumber
                              )
                            }
                          />

                          {month}

                        </label>
                      )
                    }
                  )}

              </div>

            </div>

            {/* FRAÇÕES */}

            <div
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
                  marginBottom:
                    '10px',
                }}
              >

                <label>
                  Frações *
                </label>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    selectAllGenerateFractions
                  }
                >
                  Todas as frações
                </button>

              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: '8px',
                  marginBottom:
                    '12px',
                  cursor:
                    'pointer',
                }}
              >

                <input
                  type="checkbox"
                  checked={
                    generateAllFractions
                  }
                  onChange={(e) => {
                    setGenerateAllFractions(
                      e.target.checked
                    )

                    if (
                      e.target.checked
                    ) {
                      setGenerateFractionIds(
                        []
                      )
                    }
                  }}
                />

                Gerar para todas as frações
              </label>

              {!generateAllFractions && (

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(4, 1fr)',
                    gap: '8px',
                  }}
                >

                  {fractions.map(
                    (fraction) => {

                      const checked =
                        generateFractionIds.includes(
                          fraction.id
                        )

                      return (
                        <label
                          key={
                            fraction.id
                          }
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: '8px',
                            padding:
                              '8px',
                            border:
                              '1px solid #ddd',
                            borderRadius:
                              '6px',
                            cursor:
                              'pointer',
                          }}
                        >

                          <input
                            type="checkbox"
                            checked={
                              checked
                            }
                            onChange={() =>
                              toggleGenerateFraction(
                                fraction.id
                              )
                            }
                          />

                          Fração{' '}
                          {
                            fraction.fraction_code
                          }

                        </label>
                      )
                    }
                  )}

                </div>

              )}

            </div>

            {/* RESUMO */}

            <div
              style={{
                marginTop: '24px',
                padding: '16px',
                background:
                  '#f5f7fa',
                borderRadius:
                  '8px',
              }}
            >

              <strong>
                Resumo
              </strong>

              <p
                style={{
                  margin:
                    '8px 0 0',
                }}
              >
                {generateMonths.length}{' '}
                mês(es) ×{' '}
                {generateAllFractions
                  ? fractions.length
                  : generateFractionIds.length}{' '}
                fração(ões) ×{' '}
                {generateAmount
                  ? formatCurrency(
                      Number(
                        generateAmount
                      )
                    )
                  : '—'}
              </p>

              <p
                style={{
                  margin:
                    '4px 0 0',
                }}
              >
                Total potencial:{' '}
                <strong>
                  {generateAmount &&
                  generateMonths.length >
                    0
                    ? formatCurrency(
                        Number(
                          generateAmount
                        ) *
                          generateMonths.length *
                          (generateAllFractions
                            ? fractions.length
                            : generateFractionIds.length)
                      )
                    : '—'}
                </strong>
              </p>

            </div>

            <div className="form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={
                  closeGenerateForm
                }
                disabled={
                  generating
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="create-button"
                disabled={
                  generating
                }
              >
                {generating
                  ? 'A gerar quotas...'
                  : '⚡ Gerar quotas'}
              </button>

            </div>

          </form>

        </div>

      )}

      {/* ======================================================
          FORMULÁRIO QUOTA MANUAL
          ====================================================== */}

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

      {/* ======================================================
          TABELA DE QUOTAS
          ====================================================== */}

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
                <th>Pago</th>
                <th>Em dívida</th>
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
                            quota.amount
                          )
                        }
                      </strong>
                    </td>

                    <td>
                      {
                        formatCurrency(
                          quota.total_paid
                        )
                      }
                    </td>

                    <td>
                      <strong>
                        {
                          formatCurrency(
                            quota.balance
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

      {/* ======================================================
          PAGAMENTOS
          ====================================================== */}

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
                  Pagamentos — Fração{' '}
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
                      selectedQuota.amount
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

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3, 1fr)',
                gap: '16px',
                margin:
                  '20px 0',
              }}
            >

              <div>
                <small>
                  Valor da quota
                </small>

                <h3>
                  {
                    formatCurrency(
                      selectedQuota.amount
                    )
                  }
                </h3>
              </div>

              <div>
                <small>
                  Total pago
                </small>

                <h3>
                  {
                    formatCurrency(
                      selectedQuota.total_paid
                    )
                  }
                </h3>
              </div>

              <div>
                <small>
                  Em dívida
                </small>

                <h3>
                  {
                    formatCurrency(
                      selectedQuota.balance
                    )
                  }
                </h3>
              </div>

            </div>

            {selectedQuota.balance >
              0 ? (

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
                      min="0.01"
                      max={
                        selectedQuota.balance
                      }
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

            ) : (

              <div
                className="empty-state"
                style={{
                  margin:
                    '20px 0',
                }}
              >
                <div className="empty-icon">
                  ✅
                </div>

                <h3>
                  Quota totalmente paga
                </h3>

                <p>
                  Não existe qualquer
                  valor em dívida.
                </p>
              </div>

            )}

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
                                  payment.amount
                                )
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              payment.payment_method
                                ? paymentMethodLabels[
                                    payment.payment_method
                                  ] ??
                                  payment.payment_method
                                : '—'
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