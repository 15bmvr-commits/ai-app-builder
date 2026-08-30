import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Condominium = {
  id: string
  name: string
}

type Fraction = {
  id: string
  condominium_id: string
  fraction_code: string
  floor: string | null
  door: string | null
  typology: string | null
  permillage: number | null
  private_area: number | null
  active: boolean
}


function Fractions() {
  const [condominiums, setCondominiums] = useState<Condominium[]>([])
  const [fractions, setFractions] = useState<Fraction[]>([])

  const [selectedCondominium, setSelectedCondominium] =
    useState('')

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [fractionCode, setFractionCode] = useState('')
  const [floor, setFloor] = useState('')
  const [door, setDoor] = useState('')
  const [typology, setTypology] = useState('')
  const [permillage, setPermillage] = useState('')
  const [privateArea, setPrivateArea] = useState('')
  const [active, setActive] = useState(true)

  // =====================================================
  // CARREGAR CONDOMÍNIOS
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

    setCondominiums(data ?? [])

    if (!selectedCondominium && data?.length) {
      setSelectedCondominium(data[0].id)
    }
  }

  // =====================================================
  // CARREGAR FRAÇÕES
  // =====================================================

  async function loadFractions(condominiumId: string) {
    setLoading(true)

    const { data, error } = await supabase
      .from('fractions')
      .select(`
        id,
        condominium_id,
        fraction_code,
        floor,
        door,
        typology,
        permillage,
        private_area,
        active
      `)
      .eq('condominium_id', condominiumId)
      .order('fraction_code')

    if (error) {
      console.error(
        'Erro ao carregar frações:',
        error
      )

      setLoading(false)
      return
    }

    setFractions(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadCondominiums()
  }, [])

  useEffect(() => {
    if (selectedCondominium) {
      loadFractions(selectedCondominium)
    }
  }, [selectedCondominium])

  // =====================================================
  // FORMULÁRIO
  // =====================================================

  function resetForm() {
    setFractionCode('')
    setFloor('')
    setDoor('')
    setTypology('')
    setPermillage('')
    setPrivateArea('')
    setActive(true)
    setEditingId(null)
    setShowForm(false)
  }

  function editFraction(fraction: Fraction) {
    setEditingId(fraction.id)
    setFractionCode(fraction.fraction_code)
    setFloor(fraction.floor ?? '')
    setDoor(fraction.door ?? '')
    setTypology(fraction.typology ?? '')
    setPermillage(
      fraction.permillage?.toString() ?? ''
    )
    setPrivateArea(
      fraction.private_area?.toString() ?? ''
    )
    setActive(fraction.active)
    setShowForm(true)
  }

  // =====================================================
  // GUARDAR
  // =====================================================

  async function saveFraction(
    e: React.FormEvent
  ) {
    e.preventDefault()

    if (!selectedCondominium) {
      alert('Seleciona um condomínio.')
      return
    }

    if (!fractionCode.trim()) {
      alert('O código da fração é obrigatório.')
      return
    }

    const payload = {
      condominium_id: selectedCondominium,
      fraction_code: fractionCode.trim(),
      floor: floor.trim() || null,
      door: door.trim() || null,
      typology: typology.trim() || null,
      permillage:
        permillage.trim()
          ? Number(permillage)
          : null,
      private_area:
        privateArea.trim()
          ? Number(privateArea)
          : null,
      active,
      updated_at: new Date().toISOString(),
    }

    if (editingId) {
      const { error } = await supabase
        .from('fractions')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        console.error(
          'Erro ao atualizar fração:',
          error
        )

        alert(
          `Erro ao atualizar fração: ${error.message}`
        )

        return
      }
    } else {
      const { error } = await supabase
        .from('fractions')
        .insert(payload)

      if (error) {
        console.error(
          'Erro ao criar fração:',
          error
        )

        alert(
          `Erro ao criar fração: ${error.message}`
        )

        return
      }
    }

    resetForm()

    await loadFractions(
      selectedCondominium
    )
  }

  // =====================================================
  // ELIMINAR
  // =====================================================

  async function deleteFraction(
    fraction: Fraction
  ) {
    const confirmed = window.confirm(
      `Tens a certeza que queres eliminar a fração ${fraction.fraction_code}?`
    )

    if (!confirmed) {
      return
    }

    const { error } = await supabase
      .from('fractions')
      .delete()
      .eq('id', fraction.id)

    if (error) {
      console.error(
        'Erro ao eliminar fração:',
        error
      )

      alert(
        `Erro ao eliminar fração: ${error.message}`
      )

      return
    }

    await loadFractions(
      selectedCondominium
    )
  }

  // =====================================================
  // FILTRO
  // =====================================================

  const filteredFractions =
    fractions.filter((fraction) => {
      const text = `
        ${fraction.fraction_code}
        ${fraction.floor ?? ''}
        ${fraction.door ?? ''}
        ${fraction.typology ?? ''}
      `.toLowerCase()

      return text.includes(
        search.toLowerCase()
      )
    })

  // =====================================================
  // INTERFACE
  // =====================================================

  return (
    <section className="page">

      <div className="section-header">

        <div>
          <h2>Frações</h2>

          <p>
            Gere as frações dos teus condomínios.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => {
            setEditingId(null)
            setShowForm(true)
          }}
        >
          + Nova fração
        </button>

      </div>

      {/* CONDOMÍNIO */}

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
          placeholder="🔎 Pesquisar fração..."
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
              ? 'Editar fração'
              : 'Nova fração'}
          </h3>

          <form onSubmit={saveFraction}>

            <div className="form-grid">

              <div>
                <label>Fração *</label>

                <input
                  value={fractionCode}
                  onChange={(e) =>
                    setFractionCode(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: A"
                />
              </div>

              <div>
                <label>Andar</label>

                <input
                  value={floor}
                  onChange={(e) =>
                    setFloor(e.target.value)
                  }
                  placeholder="Ex.: 2.º"
                />
              </div>

              <div>
                <label>Porta</label>

                <input
                  value={door}
                  onChange={(e) =>
                    setDoor(e.target.value)
                  }
                  placeholder="Ex.: Esq."
                />
              </div>

              <div>
                <label>Tipologia</label>

                <input
                  value={typology}
                  onChange={(e) =>
                    setTypology(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: T3"
                />
              </div>

              <div>
                <label>Permilagem</label>

                <input
                  type="number"
                  step="0.001"
                  value={permillage}
                  onChange={(e) =>
                    setPermillage(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: 85.500"
                />
              </div>

              <div>
                <label>Área privativa (m²)</label>

                <input
                  type="number"
                  step="0.01"
                  value={privateArea}
                  onChange={(e) =>
                    setPrivateArea(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: 120.50"
                />
              </div>

            </div>

            <label className="checkbox">

              <input
                type="checkbox"
                checked={active}
                onChange={(e) =>
                  setActive(
                    e.target.checked
                  )
                }
              />

              Fração ativa

            </label>

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
                  : 'Criar fração'}
              </button>

            </div>

          </form>

        </div>

      )}

      {/* LISTA */}

      <div className="table-card">

        {loading ? (

          <div className="loading">
            A carregar frações...
          </div>

        ) : filteredFractions.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              🏠
            </div>

            <h3>
              Nenhuma fração encontrada
            </h3>

            <p>
              Cria a primeira fração deste
              condomínio.
            </p>

          </div>

        ) : (

          <table>

            <thead>

              <tr>
                <th>Fração</th>
                <th>Andar</th>
                <th>Porta</th>
                <th>Tipologia</th>
                <th>Permilagem</th>
                <th>Área</th>
                <th>Estado</th>
                <th></th>
              </tr>

            </thead>

            <tbody>

              {filteredFractions.map(
                (fraction) => (

                  <tr key={fraction.id}>

                    <td>
                      <strong>
                        {fraction.fraction_code}
                      </strong>
                    </td>

                    <td>
                      {fraction.floor ?? '—'}
                    </td>

                    <td>
                      {fraction.door ?? '—'}
                    </td>

                    <td>
                      {fraction.typology ?? '—'}
                    </td>

                    <td>
                      {fraction.permillage != null
                        ? fraction.permillage
                        : '—'}
                    </td>

                    <td>
                      {fraction.private_area != null
                        ? `${fraction.private_area} m²`
                        : '—'}
                    </td>

                    <td>
                      {fraction.active ? (
                        <span className="status-badge active">
                          Ativa
                        </span>
                      ) : (
                        <span className="status-badge inactive">
                          Inativa
                        </span>
                      )}
                    </td>

                    <td>

                      <div className="table-actions">

                        <button
                          onClick={() =>
                            editFraction(
                              fraction
                            )
                          }
                        >
                          ✏️
                        </button>

                        <button
                          onClick={() =>
                            deleteFraction(
                              fraction
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

export default Fractions