import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Condominium = {
  id: string
  name: string
  tax_number: string | null
  address: string | null
  postal_code: string | null
  city: string | null
  country: string | null
  email: string | null
  phone: string | null
  bank_iban: string | null
  active: boolean
}

function Condominiums() {
  const [condominiums, setCondominiums] = useState<Condominium[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState('')
  const [taxNumber, setTaxNumber] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('Portugal')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bankIban, setBankIban] = useState('')

  async function loadCondominiums() {
    setLoading(true)

    const { data, error } = await supabase
      .from('condominiums')
      .select('*')
      .order('name')

    if (error) {
      console.error('Erro ao carregar condomínios:', error)
      setLoading(false)
      return
    }

    setCondominiums(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadCondominiums()
  }, [])

async function createCondominium(e: React.FormEvent) {
  e.preventDefault()

  if (!name.trim()) {
    alert('O nome do condomínio é obrigatório.')
    return
  }

  // Obter o utilizador autenticado
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    alert('Não foi possível identificar o utilizador autenticado.')
    return
  }

  // Criar condomínio
  const { data: condominium, error } = await supabase
    .from('condominiums')
    .insert({
      name: name.trim(),
      tax_number: taxNumber.trim() || null,
      address: address.trim() || null,
      postal_code: postalCode.trim() || null,
      city: city.trim() || null,
      country: country.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      bank_iban: bankIban.trim() || null,
      active: true,
    })
    .select()
    .single()

  if (error || !condominium) {
    console.error('Erro ao criar condomínio:', error)
    alert(`Erro ao criar condomínio: ${error?.message ?? 'Erro desconhecido'}`)
    return
  }

  // Associar o utilizador ao condomínio
  const { error: associationError } = await supabase
    .from('user_condominiums')
    .insert({
      user_id: user.id,
      condominium_id: condominium.id,
    })

  if (associationError) {
    console.error(
      'Erro ao associar utilizador ao condomínio:',
      associationError
    )

    // Se a associação falhar, removemos o condomínio
    // para não deixar dados incompletos.
    await supabase
      .from('condominiums')
      .delete()
      .eq('id', condominium.id)

    alert(
      `O condomínio não foi criado porque não foi possível associar o utilizador: ${associationError.message}`
    )

    return
  }

  // Atualizar lista
  setCondominiums((current) =>
    [...current, condominium].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  )

  // Limpar formulário
  setName('')
  setTaxNumber('')
  setAddress('')
  setPostalCode('')
  setCity('')
  setCountry('Portugal')
  setEmail('')
  setPhone('')
  setBankIban('')

  setShowForm(false)

  alert('Condomínio criado com sucesso!')
}

  return (
    <div className="page">

      <div className="page-header">

        <div>
          <h1>Condomínios</h1>

          <p>
            Gere os condomínios administrados pela organização.
          </p>
        </div>

        <button
          className="create-button"
          onClick={() => setShowForm(true)}
        >
          + Novo condomínio
        </button>

      </div>

      {showForm && (
        <div className="form-card">

          <div className="form-header">
            <div>
              <h2>Novo condomínio</h2>

              <p>
                Introduza os dados do condomínio.
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={createCondominium}>

            <div className="form-grid">

              <div className="form-field full">
                <label>Nome do condomínio *</label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Condomínio Jardim das Flores"
                  required
                />
              </div>

              <div className="form-field">
                <label>NIF</label>

                <input
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  placeholder="NIF"
                />
              </div>

              <div className="form-field">
                <label>Telefone</label>

                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Telefone"
                />
              </div>

              <div className="form-field full">
                <label>Morada</label>

                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número..."
                />
              </div>

              <div className="form-field">
                <label>Código postal</label>

                <input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="0000-000"
                />
              </div>

              <div className="form-field">
                <label>Localidade</label>

                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Localidade"
                />
              </div>

              <div className="form-field">
                <label>País</label>

                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Email</label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.pt"
                />
              </div>

              <div className="form-field full">
                <label>IBAN</label>

                <input
                  value={bankIban}
                  onChange={(e) => setBankIban(e.target.value)}
                  placeholder="PT50..."
                />
              </div>

            </div>

            <div className="form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="create-button"
              >
                Guardar condomínio
              </button>

            </div>

          </form>

        </div>
      )}

      <div className="table-card">

        {loading ? (
          <div className="loading">
            A carregar condomínios...
          </div>
        ) : condominiums.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              🏢
            </div>

            <h3>
              Ainda não existem condomínios
            </h3>

            <p>
              Clique em "Novo condomínio" para criar o primeiro.
            </p>

          </div>

        ) : (

          <table>

            <thead>
              <tr>
                <th>Condomínio</th>
                <th>NIF</th>
                <th>Localidade</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>

              {condominiums.map((condominium) => (

                <tr key={condominium.id}>

                  <td>
                    <strong>
                      {condominium.name}
                    </strong>
                  </td>

                  <td>
                    {condominium.tax_number || '-'}
                  </td>

                  <td>
                    {condominium.city || '-'}
                  </td>

                  <td>
                    {condominium.email || '-'}
                  </td>

                  <td>
                    {condominium.phone || '-'}
                  </td>

                  <td>
                    {condominium.active
                      ? 'Ativo'
                      : 'Inativo'}
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

export default Condominiums