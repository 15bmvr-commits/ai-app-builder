import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Condominium = {
  id: string
  name: string
}

type Fraction = {
  id: string
  fraction_code: string
  condominium_id: string
}

type Owner = {
  id: string
  condominium_id: string
  name: string
  nif: string | null
  email: string | null
  phone: string | null
  address: string | null
  postal_code: string | null
  city: string | null
  iban: string | null
  active: boolean
}

type FractionOwner = {
  id: string
  fraction_id: string
  owner_id: string
  ownership_percentage: number | null
  is_primary: boolean
}

function Owners() {
  const [condominiums, setCondominiums] = useState<Condominium[]>([])
  const [fractions, setFractions] = useState<Fraction[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [fractionOwners, setFractionOwners] = useState<FractionOwner[]>([])

  const [selectedCondominium, setSelectedCondominium] = useState('')

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [nif, setNif] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [iban, setIban] = useState('')
  const [active, setActive] = useState(true)

  const [selectedFractionIds, setSelectedFractionIds] = useState<string[]>([])
  const [primaryFractionId, setPrimaryFractionId] = useState('')
  const [ownershipPercentages, setOwnershipPercentages] =
    useState<Record<string, string>>({})

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
      console.error('Erro ao carregar condomínios:', error)
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
      .select('id, fraction_code, condominium_id')
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

  // =====================================================
  // PROPRIETÁRIOS
  // =====================================================

  async function loadOwners(condominiumId: string) {
    setLoading(true)

    const { data, error } = await supabase
      .from('owners')
      .select(`
        id,
        condominium_id,
        name,
        nif,
        email,
        phone,
        address,
        postal_code,
        city,
        iban,
        active
      `)
      .eq('condominium_id', condominiumId)
      .order('name')

    if (error) {
      console.error('Erro ao carregar proprietários:', error)
      setOwners([])
      setLoading(false)
      return
    }

    setOwners(data ?? [])
    setLoading(false)
  }

  // =====================================================
  // RELAÇÕES FRAÇÃO / PROPRIETÁRIO
  // =====================================================

  async function loadFractionOwners(condominiumId: string) {
    const { data, error } = await supabase
      .from('fraction_owners')
      .select(`
        id,
        fraction_id,
        owner_id,
        ownership_percentage,
        is_primary,
        fractions!inner (
          condominium_id
        )
      `)
      .eq('fractions.condominium_id', condominiumId)

    if (error) {
      console.error(
        'Erro ao carregar associações proprietário/fração:',
        error
      )

      setFractionOwners([])
      return
    }

    const result: FractionOwner[] = (data ?? []).map(
      (item: any) => ({
        id: item.id,
        fraction_id: item.fraction_id,
        owner_id: item.owner_id,
        ownership_percentage:
          item.ownership_percentage !== null
            ? Number(item.ownership_percentage)
            : null,
        is_primary: item.is_primary,
      })
    )

    setFractionOwners(result)
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
    loadOwners(selectedCondominium)
    loadFractionOwners(selectedCondominium)
  }, [selectedCondominium])

  // =====================================================
  // FORM
  // =====================================================

  function resetForm() {
    setEditingId(null)

    setName('')
    setNif('')
    setEmail('')
    setPhone('')
    setAddress('')
    setPostalCode('')
    setCity('')
    setIban('')
    setActive(true)

    setSelectedFractionIds([])
    setPrimaryFractionId('')
    setOwnershipPercentages({})

    setShowForm(false)
  }

  function openNewOwnerForm() {
    setEditingId(null)

    setName('')
    setNif('')
    setEmail('')
    setPhone('')
    setAddress('')
    setPostalCode('')
    setCity('')
    setIban('')
    setActive(true)

    setSelectedFractionIds([])
    setPrimaryFractionId('')
    setOwnershipPercentages({})

    setShowForm(true)
  }

  function editOwner(owner: Owner) {
    setEditingId(owner.id)

    setName(owner.name)
    setNif(owner.nif ?? '')
    setEmail(owner.email ?? '')
    setPhone(owner.phone ?? '')
    setAddress(owner.address ?? '')
    setPostalCode(owner.postal_code ?? '')
    setCity(owner.city ?? '')
    setIban(owner.iban ?? '')
    setActive(owner.active)

    const relations = fractionOwners.filter(
      (relation) => relation.owner_id === owner.id
    )

    const fractionIds = relations.map(
      (relation) => relation.fraction_id
    )

    setSelectedFractionIds(fractionIds)

    const primary = relations.find(
      (relation) => relation.is_primary
    )

    setPrimaryFractionId(
      primary?.fraction_id ?? ''
    )

    const percentages: Record<string, string> = {}

    relations.forEach((relation) => {
      if (relation.ownership_percentage !== null) {
        percentages[relation.fraction_id] =
          relation.ownership_percentage.toString()
      }
    })

    setOwnershipPercentages(percentages)

    setShowForm(true)
  }

  // =====================================================
  // FRAÇÕES SELECIONADAS
  // =====================================================

  function toggleFraction(fractionId: string) {
    setSelectedFractionIds((current) => {
      if (current.includes(fractionId)) {
        if (primaryFractionId === fractionId) {
          setPrimaryFractionId('')
        }

        const updated = { ...ownershipPercentages }
        delete updated[fractionId]
        setOwnershipPercentages(updated)

        return current.filter(
          (id) => id !== fractionId
        )
      }

      return [...current, fractionId]
    })
  }

  function updatePercentage(
    fractionId: string,
    value: string
  ) {
    setOwnershipPercentages((current) => ({
      ...current,
      [fractionId]: value,
    }))
  }

  // =====================================================
  // GUARDAR
  // =====================================================

  async function saveOwner(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    if (!selectedCondominium) {
      alert('Seleciona um condomínio.')
      return
    }

    if (!name.trim()) {
      alert('O nome do proprietário é obrigatório.')
      return
    }

    // ---------------------------------------------------
    // VALIDAÇÃO DAS PERCENTAGENS
    // ---------------------------------------------------

    for (const fractionId of selectedFractionIds) {
      const value = ownershipPercentages[fractionId]

      if (value !== undefined && value !== '') {
        const percentage = Number(value)

        if (
          Number.isNaN(percentage) ||
          percentage < 0 ||
          percentage > 100
        ) {
          alert(
            'A percentagem de propriedade deve estar entre 0 e 100.'
          )
          return
        }
      }
    }

    // ---------------------------------------------------
    // PROPRIETÁRIO
    // ---------------------------------------------------

    const payload = {
      condominium_id: selectedCondominium,
      name: name.trim(),
      nif: nif.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      postal_code: postalCode.trim() || null,
      city: city.trim() || null,
      iban: iban.trim() || null,
      active,
      updated_at: new Date().toISOString(),
    }

    let ownerId = editingId

    if (editingId) {
      const { error } = await supabase
        .from('owners')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        console.error(
          'Erro ao atualizar proprietário:',
          error
        )

        alert(
          `Erro ao atualizar proprietário: ${error.message}`
        )

        return
      }
    } else {
      const { data, error } = await supabase
        .from('owners')
        .insert(payload)
        .select('id')
        .single()

      if (error) {
        console.error(
          'Erro ao criar proprietário:',
          error
        )

        alert(
          `Erro ao criar proprietário: ${error.message}`
        )

        return
      }

      ownerId = data.id
    }

    // ---------------------------------------------------
    // RELAÇÕES
    // ---------------------------------------------------

    if (!ownerId) {
      alert('Não foi possível identificar o proprietário.')
      return
    }

    // Apagar relações existentes
    const { error: deleteRelationsError } = await supabase
      .from('fraction_owners')
      .delete()
      .eq('owner_id', ownerId)

    if (deleteRelationsError) {
      console.error(
        'Erro ao atualizar associações:',
        deleteRelationsError
      )

      alert(
        `Erro ao atualizar associações: ${deleteRelationsError.message}`
      )

      return
    }

    // Criar novas relações
    if (selectedFractionIds.length > 0) {
      const relations = selectedFractionIds.map(
        (fractionId) => ({
          fraction_id: fractionId,
          owner_id: ownerId,
          ownership_percentage:
            ownershipPercentages[fractionId]
              ? Number(
                  ownershipPercentages[fractionId]
                )
              : null,
          is_primary:
            primaryFractionId === fractionId,
        })
      )

      const { error: relationError } =
        await supabase
          .from('fraction_owners')
          .insert(relations)

      if (relationError) {
        console.error(
          'Erro ao associar proprietário às frações:',
          relationError
        )

        alert(
          `Erro ao associar proprietário às frações: ${relationError.message}`
        )

        return
      }
    }

    resetForm()

    await loadOwners(selectedCondominium)
    await loadFractionOwners(selectedCondominium)
  }

  // =====================================================
  // ELIMINAR
  // =====================================================

  async function deleteOwner(owner: Owner) {
    const confirmed = window.confirm(
      `Tens a certeza que queres eliminar o proprietário "${owner.name}"?`
    )

    if (!confirmed) {
      return
    }

    const { data: relations } = await supabase
      .from('fraction_owners')
      .select('id')
      .eq('owner_id', owner.id)
      .limit(1)

    if (relations && relations.length > 0) {
      alert(
        'Este proprietário está associado a uma ou mais frações. Remove primeiro essas associações.'
      )
      return
    }

    const { error } = await supabase
      .from('owners')
      .delete()
      .eq('id', owner.id)

    if (error) {
      console.error(
        'Erro ao eliminar proprietário:',
        error
      )

      alert(
        `Erro ao eliminar proprietário: ${error.message}`
      )

      return
    }

    await loadOwners(selectedCondominium)
  }

  // =====================================================
  // FRAÇÕES DO PROPRIETÁRIO
  // =====================================================

  function getOwnerFractions(ownerId: string) {
    return fractionOwners
      .filter(
        (relation) =>
          relation.owner_id === ownerId
      )
      .map((relation) => {
        const fraction = fractions.find(
          (item) =>
            item.id === relation.fraction_id
        )

        return {
          ...relation,
          fractionCode:
            fraction?.fraction_code ?? '—',
        }
      })
  }

  // =====================================================
  // FILTRO
  // =====================================================

  const filteredOwners = owners.filter(
    (owner) => {
      const text = `
        ${owner.name}
        ${owner.nif ?? ''}
        ${owner.email ?? ''}
        ${owner.phone ?? ''}
        ${owner.city ?? ''}
      `.toLowerCase()

      return text.includes(
        search.toLowerCase()
      )
    }
  )

  // =====================================================
  // INTERFACE
  // =====================================================

  return (
    <section className="page">

      <div className="section-header">

        <div>
          <h2>Proprietários</h2>

          <p>
            Gere os proprietários e as suas
            associações às frações.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={openNewOwnerForm}
        >
          + Novo proprietário
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
          placeholder="🔎 Pesquisar proprietário..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </div>

      {/* FORMULÁRIO */}

      {showForm && (

        <div className="form-card">

          <h3>
            {editingId
              ? 'Editar proprietário'
              : 'Novo proprietário'}
          </h3>

          <form onSubmit={saveOwner}>

            <div className="form-grid">

              <div>
                <label>
                  Nome completo *
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Ex.: João Silva"
                />
              </div>

              <div>
                <label>
                  NIF
                </label>

                <input
                  value={nif}
                  onChange={(e) =>
                    setNif(e.target.value)
                  }
                  placeholder="Ex.: 123456789"
                />
              </div>

              <div>
                <label>
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Ex.: joao@email.pt"
                />
              </div>

              <div>
                <label>
                  Telefone
                </label>

                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="Ex.: 912345678"
                />
              </div>

              <div
                style={{
                  gridColumn: '1 / -1',
                }}
              >
                <label>
                  Morada
                </label>

                <input
                  value={address}
                  onChange={(e) =>
                    setAddress(e.target.value)
                  }
                  placeholder="Ex.: Rua Principal, 123"
                />
              </div>

              <div>
                <label>
                  Código postal
                </label>

                <input
                  value={postalCode}
                  onChange={(e) =>
                    setPostalCode(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: 4480-000"
                />
              </div>

              <div>
                <label>
                  Localidade
                </label>

                <input
                  value={city}
                  onChange={(e) =>
                    setCity(e.target.value)
                  }
                  placeholder="Ex.: Vila do Conde"
                />
              </div>

              <div
                style={{
                  gridColumn: '1 / -1',
                }}
              >
                <label>
                  IBAN
                </label>

                <input
                  value={iban}
                  onChange={(e) =>
                    setIban(e.target.value)
                  }
                  placeholder="Ex.: PT50 0000 0000 0000 0000 0000 0"
                />
              </div>

            </div>

            {/* FRAÇÕES */}

            <div
              style={{
                marginTop: '24px',
              }}
            >

              <h4>
                Frações
              </h4>

              {fractions.length === 0 ? (

                <p>
                  Este condomínio ainda não tem
                  frações ativas.
                </p>

              ) : (

                <div
                  style={{
                    display: 'grid',
                    gap: '10px',
                  }}
                >

                  {fractions.map(
                    (fraction) => {

                      const selected =
                        selectedFractionIds.includes(
                          fraction.id
                        )

                      return (
                        <div
                          key={fraction.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              '30px 1fr 160px 180px',
                            gap: '12px',
                            alignItems:
                              'center',
                            padding:
                              '10px',
                            border:
                              '1px solid #ddd',
                            borderRadius:
                              '8px',
                          }}
                        >

                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              toggleFraction(
                                fraction.id
                              )
                            }
                          />

                          <strong>
                            Fração{' '}
                            {
                              fraction.fraction_code
                            }
                          </strong>

                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            disabled={!selected}
                            placeholder="% propriedade"
                            value={
                              ownershipPercentages[
                                fraction.id
                              ] ?? ''
                            }
                            onChange={(e) =>
                              updatePercentage(
                                fraction.id,
                                e.target.value
                              )
                            }
                          />

                          <label
                            style={{
                              display:
                                'flex',
                              alignItems:
                                'center',
                              gap: '8px',
                            }}
                          >

                            <input
                              type="radio"
                              name="primaryFraction"
                              disabled={!selected}
                              checked={
                                primaryFractionId ===
                                fraction.id
                              }
                              onChange={() =>
                                setPrimaryFractionId(
                                  fraction.id
                                )
                              }
                            />

                            Principal

                          </label>

                        </div>
                      )
                    }
                  )}

                </div>

              )}

            </div>

            {/* ESTADO */}

            <label
              className="checkbox"
              style={{
                marginTop: '20px',
              }}
            >

              <input
                type="checkbox"
                checked={active}
                onChange={(e) =>
                  setActive(
                    e.target.checked
                  )
                }
              />

              Proprietário ativo

            </label>

            {/* AÇÕES */}

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
                  : 'Criar proprietário'}
              </button>

            </div>

          </form>

        </div>

      )}

      {/* LISTA */}

      <div className="table-card">

        {loading ? (

          <div className="loading">
            A carregar proprietários...
          </div>

        ) : filteredOwners.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              👤
            </div>

            <h3>
              Nenhum proprietário encontrado
            </h3>

            <p>
              Cria o primeiro proprietário
              deste condomínio.
            </p>

          </div>

        ) : (

          <table>

            <thead>

              <tr>
                <th>Nome</th>
                <th>NIF</th>
                <th>Contacto</th>
                <th>Frações</th>
                <th>Estado</th>
                <th></th>
              </tr>

            </thead>

            <tbody>

              {filteredOwners.map(
                (owner) => {

                  const ownerFractions =
                    getOwnerFractions(
                      owner.id
                    )

                  return (

                    <tr key={owner.id}>

                      <td>
                        <strong>
                          {owner.name}
                        </strong>
                      </td>

                      <td>
                        {owner.nif ?? '—'}
                      </td>

                      <td>
                        <div>
                          {owner.email ?? '—'}
                        </div>

                        {owner.phone && (
                          <small>
                            {owner.phone}
                          </small>
                        )}
                      </td>

                      <td>

                        {ownerFractions.length ===
                        0 ? (

                          <span>
                            —
                          </span>

                        ) : (

                          <div
                            style={{
                              display:
                                'flex',
                              gap: '6px',
                              flexWrap:
                                'wrap',
                            }}
                          >

                            {ownerFractions.map(
                              (
                                relation
                              ) => (

                                <span
                                  key={
                                    relation.id
                                  }
                                  className="status-badge active"
                                  title={
                                    relation.ownership_percentage !==
                                    null
                                      ? `${relation.ownership_percentage}%`
                                      : undefined
                                  }
                                >
                                  {
                                    relation.fractionCode
                                  }

                                  {relation.is_primary &&
                                    ' ★'}
                                </span>

                              )
                            )}

                          </div>

                        )}

                      </td>

                      <td>

                        {owner.active ? (

                          <span className="status-badge active">
                            Ativo
                          </span>

                        ) : (

                          <span className="status-badge inactive">
                            Inativo
                          </span>

                        )}

                      </td>

                      <td>

                        <div className="table-actions">

                          <button
                            title="Editar"
                            onClick={() =>
                              editOwner(
                                owner
                              )
                            }
                          >
                            ✏️
                          </button>

                          <button
                            title="Eliminar"
                            onClick={() =>
                              deleteOwner(
                                owner
                              )
                            }
                          >
                            🗑️
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

    </section>
  )
}

export default Owners
