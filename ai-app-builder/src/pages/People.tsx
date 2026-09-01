
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

type Person = {
  id: string
  full_name: string
  tax_number: string | null
  email: string | null
  phone: string | null
  address: string | null
  postal_code: string | null
  city: string | null
  country: string | null
  active: boolean
}

type PersonAssociation = {
  id: string
  person_id: string
  fraction_id: string
  relation_type: string
  is_primary: boolean
  person: Person
  fraction: Fraction
}

type FractionSelection = {
  fractionId: string
  relationType: string
  isPrimary: boolean
}

const relationLabels: Record<string, string> = {
  owner: 'Proprietário',
  co_owner: 'Comproprietário',
  tenant: 'Arrendatário',
  representative: 'Representante',
}

function People() {
  const [condominiums, setCondominiums] = useState<Condominium[]>([])
  const [fractions, setFractions] = useState<Fraction[]>([])
  const [associations, setAssociations] = useState<PersonAssociation[]>([])

  const [selectedCondominium, setSelectedCondominium] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [taxNumber, setTaxNumber] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('Portugal')

  const [selectedFractions, setSelectedFractions] = useState<
    FractionSelection[]
  >([])

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

    const condominiumsData = data ?? []

    setCondominiums(condominiumsData)

    if (!selectedCondominium && condominiumsData.length > 0) {
      setSelectedCondominium(condominiumsData[0].id)
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

  async function loadPeople(condominiumId: string) {
    setLoading(true)

    const { data, error } = await supabase
      .from('fraction_people')
      .select(`
        id,
        person_id,
        fraction_id,
        relation_type,
        is_primary,
        created_at,
        people (
          id,
          full_name,
          tax_number,
          email,
          phone,
          address,
          postal_code,
          city,
          country,
          active
        ),
        fractions (
          id,
          fraction_code,
          condominium_id
        )
      `)
      .eq('fractions.condominium_id', condominiumId)
      .order('created_at')

    if (error) {
      console.error('Erro ao carregar condóminos:', error)
      setAssociations([])
      setLoading(false)
      return
    }

    const result: PersonAssociation[] = (data ?? [])
      .filter((item: any) => item.people && item.fractions)
      .map((item: any) => ({
        id: item.id,
        person_id: item.person_id,
        fraction_id: item.fraction_id,
        relation_type: item.relation_type,
        is_primary: item.is_primary,
        person: item.people,
        fraction: {
          id: item.fractions.id,
          fraction_code: item.fractions.fraction_code,
        },
      }))

    setAssociations(result)
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
    loadPeople(selectedCondominium)
  }, [selectedCondominium])

  function resetForm() {
    setFullName('')
    setTaxNumber('')
    setEmail('')
    setPhone('')
    setAddress('')
    setPostalCode('')
    setCity('')
    setCountry('Portugal')
    setSelectedFractions([])
    setEditingPersonId(null)
    setShowForm(false)
  }

  function openNewPersonForm() {
    setEditingPersonId(null)

    setFullName('')
    setTaxNumber('')
    setEmail('')
    setPhone('')
    setAddress('')
    setPostalCode('')
    setCity('')
    setCountry('Portugal')
    setSelectedFractions([])

    setShowForm(true)
  }

  function toggleFraction(fractionId: string) {
    setSelectedFractions((current) => {
      const exists = current.some(
        (item) => item.fractionId === fractionId
      )

      if (exists) {
        return current.filter(
          (item) => item.fractionId !== fractionId
        )
      }

      return [
        ...current,
        {
          fractionId,
          relationType: 'owner',
          isPrimary: false,
        },
      ]
    })
  }

  function updateFractionRelation(
    fractionId: string,
    relationType: string
  ) {
    setSelectedFractions((current) =>
      current.map((item) =>
        item.fractionId === fractionId
          ? {
              ...item,
              relationType,
            }
          : item
      )
    )
  }

  function updateFractionPrimary(
    fractionId: string,
    isPrimary: boolean
  ) {
    setSelectedFractions((current) =>
      current.map((item) =>
        item.fractionId === fractionId
          ? {
              ...item,
              isPrimary,
            }
          : item
      )
    )
  }

  function editPerson(personId: string) {
    /*
     * As associações carregadas pertencem apenas ao
     * condomínio atualmente selecionado.
     */
    const personAssociations = associations.filter(
      (item) => item.person_id === personId
    )

    if (personAssociations.length === 0) {
      return
    }

    const person = personAssociations[0].person

    setEditingPersonId(personId)

    setFullName(person.full_name)
    setTaxNumber(person.tax_number ?? '')
    setEmail(person.email ?? '')
    setPhone(person.phone ?? '')
    setAddress(person.address ?? '')
    setPostalCode(person.postal_code ?? '')
    setCity(person.city ?? '')
    setCountry(person.country ?? 'Portugal')

    setSelectedFractions(
      personAssociations.map((item) => ({
        fractionId: item.fraction_id,
        relationType: item.relation_type,
        isPrimary: item.is_primary,
      }))
    )

    setShowForm(true)
  }

  async function savePerson(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    if (!selectedCondominium) {
      alert('Seleciona um condomínio.')
      return
    }

    if (!fullName.trim()) {
      alert('O nome completo é obrigatório.')
      return
    }

    if (selectedFractions.length === 0) {
      alert('Seleciona pelo menos uma fração.')
      return
    }

    const personPayload = {
      full_name: fullName.trim(),
      tax_number: taxNumber.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      postal_code: postalCode.trim() || null,
      city: city.trim() || null,
      country: country.trim() || 'Portugal',
      active: true,
      updated_at: new Date().toISOString(),
    }

    /*
     * =====================================================
     * EDITAR PESSOA
     * =====================================================
     */

    if (editingPersonId) {
      const { error: personError } = await supabase
        .from('people')
        .update(personPayload)
        .eq('id', editingPersonId)

      if (personError) {
        alert(
          `Erro ao atualizar pessoa: ${personError.message}`
        )
        return
      }

      /*
       * IMPORTANTE:
       *
       * "associations" contém apenas as associações da pessoa
       * no condomínio atualmente selecionado.
       *
       * As associações que eventualmente existam noutros
       * condomínios não são tocadas.
       */
      const currentAssociations = associations.filter(
        (item) => item.person_id === editingPersonId
      )

      const selectedIds = selectedFractions.map(
        (item) => item.fractionId
      )

      /*
       * Apagar associações que foram retiradas do formulário.
       */
      const associationsToDelete =
        currentAssociations.filter(
          (item) => !selectedIds.includes(item.fraction_id)
        )

      for (const association of associationsToDelete) {
        const { error } = await supabase
          .from('fraction_people')
          .delete()
          .eq('id', association.id)

        if (error) {
          alert(
            `Erro ao remover associação: ${error.message}`
          )
          return
        }
      }

      /*
       * Atualizar associações existentes ou criar novas.
       */
      for (const selection of selectedFractions) {
        const existing = currentAssociations.find(
          (item) =>
            item.fraction_id === selection.fractionId
        )

        if (existing) {
          const { error } = await supabase
            .from('fraction_people')
            .update({
              relation_type: selection.relationType,
              is_primary: selection.isPrimary,
            })
            .eq('id', existing.id)

          if (error) {
            alert(
              `Erro ao atualizar associação: ${error.message}`
            )
            return
          }
        } else {
          const { error } = await supabase
            .from('fraction_people')
            .insert({
              person_id: editingPersonId,
              fraction_id: selection.fractionId,
              relation_type: selection.relationType,
              is_primary: selection.isPrimary,
            })

          if (error) {
            alert(
              `Erro ao criar associação: ${error.message}`
            )
            return
          }
        }
      }
    }

    /*
     * =====================================================
     * CRIAR NOVA PESSOA
     * =====================================================
     */

    else {
      const personId = crypto.randomUUID()

      const { error: personError } = await supabase
        .from('people')
        .insert({
          id: personId,
          ...personPayload,
        })

      if (personError) {
        alert(
          `Erro ao criar pessoa: ${personError.message}`
        )
        return
      }

      /*
       * Uma pessoa é criada apenas uma vez.
       *
       * Depois criamos uma associação independente
       * para cada fração selecionada.
       *
       * Exemplo:
       *
       * João → Fração A → owner
       * João → Fração B → co_owner
       * João → Fração C → representative
       */
      const associationsToInsert =
        selectedFractions.map((selection) => ({
          person_id: personId,
          fraction_id: selection.fractionId,
          relation_type: selection.relationType,
          is_primary: selection.isPrimary,
        }))

      const { error: associationError } =
        await supabase
          .from('fraction_people')
          .insert(associationsToInsert)

      if (associationError) {
        /*
         * Se a associação falhar, tentamos eliminar
         * a pessoa que acabámos de criar.
         */
        await supabase
          .from('people')
          .delete()
          .eq('id', personId)

        alert(
          `Erro ao associar pessoa às frações: ${associationError.message}`
        )

        return
      }
    }

    resetForm()

    await loadPeople(selectedCondominium)
  }

  async function deletePerson(personId: string) {
    /*
     * Estas associações pertencem ao condomínio atual.
     */
    const personAssociations = associations.filter(
      (item) => item.person_id === personId
    )

    if (personAssociations.length === 0) {
      return
    }

    const person = personAssociations[0].person

    const fractionsText =
      personAssociations
        .map(
          (item) =>
            `${item.fraction.fraction_code} (${
              relationLabels[item.relation_type] ??
              item.relation_type
            })`
        )
        .join(', ')

    const confirmed = window.confirm(
      `Queres remover ${person.full_name}?\n\nFrações: ${fractionsText}`
    )

    if (!confirmed) {
      return
    }

    /*
     * Remover todas as associações da pessoa
     * no condomínio atual.
     */
    for (const association of personAssociations) {
      const { error } = await supabase
        .from('fraction_people')
        .delete()
        .eq('id', association.id)

      if (error) {
        alert(
          `Erro ao remover associação: ${error.message}`
        )
        return
      }
    }

    /*
     * Verificar se a pessoa continua associada
     * a alguma outra fração, eventualmente noutro
     * condomínio.
     */
    const {
      data: remainingAssociations,
      error: checkError,
    } = await supabase
      .from('fraction_people')
      .select('id')
      .eq('person_id', personId)
      .limit(1)

    if (checkError) {
      console.error(
        'Erro ao verificar associações:',
        checkError
      )

      await loadPeople(selectedCondominium)
      return
    }

    /*
     * Só eliminar a pessoa se já não existir
     * qualquer associação em nenhum condomínio.
     */
    if (
      !remainingAssociations ||
      remainingAssociations.length === 0
    ) {
      const { error: personError } = await supabase
        .from('people')
        .delete()
        .eq('id', personId)

      if (personError) {
        alert(
          `Erro ao eliminar pessoa: ${personError.message}`
        )
        return
      }
    }

    await loadPeople(selectedCondominium)
  }

  /*
   * Agrupar as associações para mostrar cada pessoa
   * apenas uma vez na tabela.
   */
  const groupedPeople = Array.from(
    new Map(
      associations.map((item) => [
        item.person_id,
        item.person,
      ])
    ).values()
  )

  const filteredPeople = groupedPeople.filter(
    (person) => {
      const personAssociations = associations.filter(
        (item) => item.person_id === person.id
      )

      const fractionsText = personAssociations
        .map(
          (item) =>
            `${item.fraction.fraction_code} ${
              relationLabels[item.relation_type] ??
              item.relation_type
            }`
        )
        .join(' ')

      const text = `
        ${person.full_name}
        ${person.tax_number ?? ''}
        ${person.email ?? ''}
        ${person.phone ?? ''}
        ${fractionsText}
      `.toLowerCase()

      return text.includes(search.toLowerCase())
    }
  )

  return (
    <section className="page">
      <div className="section-header">
        <div>
          <h2>Condóminos</h2>

          <p>
            Gere pessoas e as suas associações às frações.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={openNewPersonForm}
        >
          + Novo condómino
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
          placeholder="🔎 Pesquisar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <div className="form-card">
          <h3>
            {editingPersonId
              ? 'Editar condómino'
              : 'Novo condómino'}
          </h3>

          <form onSubmit={savePerson}>
            <div className="form-grid">
              <div>
                <label>Nome completo *</label>

                <input
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                />
              </div>

              <div>
                <label>NIF / Número de contribuinte</label>

                <input
                  value={taxNumber}
                  onChange={(e) =>
                    setTaxNumber(e.target.value)
                  }
                  maxLength={9}
                />
              </div>

              <div>
                <label>Email</label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />
              </div>

              <div>
                <label>Telefone</label>

                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                />
              </div>

              <div>
                <label>Morada</label>

                <input
                  value={address}
                  onChange={(e) =>
                    setAddress(e.target.value)
                  }
                />
              </div>

              <div>
                <label>Código postal</label>

                <input
                  value={postalCode}
                  onChange={(e) =>
                    setPostalCode(e.target.value)
                  }
                />
              </div>

              <div>
                <label>Localidade</label>

                <input
                  value={city}
                  onChange={(e) =>
                    setCity(e.target.value)
                  }
                />
              </div>

              <div>
                <label>País</label>

                <input
                  value={country}
                  onChange={(e) =>
                    setCountry(e.target.value)
                  }
                />
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <h4 style={{ marginBottom: '12px' }}>
                Frações e relações
              </h4>

              {fractions.length === 0 ? (
                <div className="empty-state">
                  <p>
                    Não existem frações disponíveis neste
                    condomínio.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {fractions.map((fraction) => {
                    const selection =
                      selectedFractions.find(
                        (item) =>
                          item.fractionId ===
                          fraction.id
                      )

                    const selected = Boolean(selection)

                    return (
                      <div
                        key={fraction.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            '40px 1fr 220px 150px',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          background: selected
                            ? '#f8fafc'
                            : 'white',
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
                          Fração {fraction.fraction_code}
                        </strong>

                        {selected ? (
                          <>
                            <select
                              value={
                                selection?.relationType ??
                                'owner'
                              }
                              onChange={(e) =>
                                updateFractionRelation(
                                  fraction.id,
                                  e.target.value
                                )
                              }
                            >
                              <option value="owner">
                                Proprietário
                              </option>

                              <option value="co_owner">
                                Comproprietário
                              </option>

                              <option value="tenant">
                                Arrendatário
                              </option>

                              <option value="representative">
                                Representante
                              </option>
                            </select>

                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  selection?.isPrimary ??
                                  false
                                }
                                onChange={(e) =>
                                  updateFractionPrimary(
                                    fraction.id,
                                    e.target.checked
                                  )
                                }
                              />

                              Principal
                            </label>
                          </>
                        ) : (
                          <>
                            <span
                              style={{
                                color: '#9ca3af',
                              }}
                            >
                              Não selecionada
                            </span>

                            <span></span>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div
              className="form-actions"
              style={{ marginTop: '24px' }}
            >
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
                {editingPersonId
                  ? 'Guardar alterações'
                  : 'Criar condómino'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-card">
        {loading ? (
          <div className="loading">
            A carregar condóminos...
          </div>
        ) : filteredPeople.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>

            <h3>
              Ainda não existem condóminos
            </h3>

            <p>
              Cria o primeiro condómino e associa-o
              a uma ou mais frações.
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>NIF</th>
                <th>Frações</th>
                <th>Email</th>
                <th>Telefone</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredPeople.map((person) => {
                const personAssociations =
                  associations.filter(
                    (item) =>
                      item.person_id === person.id
                  )

                return (
                  <tr key={person.id}>
                    <td>
                      <strong>
                        {person.full_name}
                      </strong>
                    </td>

                    <td>
                      {person.tax_number ?? '—'}
                    </td>

                    <td>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '5px',
                        }}
                      >
                        {personAssociations.map(
                          (item) => (
                            <div key={item.id}>
                              <strong>
                                {
                                  item.fraction
                                    .fraction_code
                                }
                              </strong>

                              <span
                                style={{
                                  marginLeft: '8px',
                                  color: '#6b7280',
                                }}
                              >
                                {relationLabels[
                                  item.relation_type
                                ] ??
                                  item.relation_type}

                                {item.is_primary &&
                                  ' • Principal'}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </td>

                    <td>
                      {person.email ?? '—'}
                    </td>

                    <td>
                      {person.phone ?? '—'}
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          title="Editar"
                          onClick={() =>
                            editPerson(person.id)
                          }
                        >
                          ✏️
                        </button>

                        <button
                          title="Eliminar"
                          onClick={() =>
                            deletePerson(person.id)
                          }
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

export default People
