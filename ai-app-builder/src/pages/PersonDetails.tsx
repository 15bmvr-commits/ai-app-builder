import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
  user_id: string | null
}

type Fraction = {
  id: string
  fraction_code: string
  floor: string | null
  door: string | null
  typology: string | null
  permillage: number | null
}

type Association = {
  id: string
  fraction_id: string
  relation_type: string
  is_primary: boolean
  start_date: string | null
  end_date: string | null
  fraction: Fraction
}

type PersonDetailsProps = {
  personId: string
  onBack: () => void
}

const relationLabels: Record<string, string> = {
  owner: 'Proprietário',
  co_owner: 'Comproprietário',
  tenant: 'Arrendatário',
  representative: 'Representante',
}

function PersonDetails({
  personId,
  onBack,
}: PersonDetailsProps) {
  const [person, setPerson] = useState<Person | null>(null)
  const [associations, setAssociations] = useState<Association[]>([])
  const [loading, setLoading] = useState(true)

  const [invitingLoading, setInvitingLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    async function loadPerson() {
      setLoading(true)

      const { data: personData, error: personError } =
        await supabase
          .from('people')
          .select(`
            id,
            full_name,
            tax_number,
            email,
            phone,
            address,
            postal_code,
            city,
            country,
            active,
            user_id
          `)
          .eq('id', personId)
          .single()

      if (personError) {
        console.error(
          'Erro ao carregar pessoa:',
          personError
        )
        setLoading(false)
        return
      }

      setPerson(personData)

      const { data: associationData, error: associationError } =
        await supabase
          .from('fraction_people')
          .select(`
            id,
            fraction_id,
            relation_type,
            is_primary,
            start_date,
            end_date,
            fractions (
              id,
              fraction_code,
              floor,
              door,
              typology,
              permillage
            )
          `)
          .eq('person_id', personId)
          .order('created_at')

      if (associationError) {
        console.error(
          'Erro ao carregar frações:',
          associationError
        )
      } else {
        const result = (associationData ?? []).map(
          (item: any) => ({
            id: item.id,
            fraction_id: item.fraction_id,
            relation_type: item.relation_type,
            is_primary: item.is_primary,
            start_date: item.start_date,
            end_date: item.end_date,
            fraction: item.fractions,
          })
        )

        setAssociations(result)
      }

      setLoading(false)
    }

    loadPerson()
  }, [personId])

  async function sendInvite() {
    if (!person) {
      return
    }

    if (!person.email) {
      setInviteError('Este condómino não tem email preenchido. Adiciona um email primeiro.')
      return
    }

    setInvitingLoading(true)
    setInviteError('')
    setInviteLink('')

    const { data, error } = await supabase
      .from('invites')
      .insert({
        person_id: person.id,
        email: person.email,
      })
      .select('token')
      .single()

    if (error) {
      console.error('Erro ao criar convite:', error)
      setInviteError(`Erro ao criar convite: ${error.message}`)
      setInvitingLoading(false)
      return
    }

    const link = `${window.location.origin}${window.location.pathname}?invite=${data.token}`
    setInviteLink(link)
    setInvitingLoading(false)
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteLink)
      alert('Link copiado!')
    } catch {
      alert('Não foi possível copiar automaticamente. Copia o link manualmente.')
    }
  }

  if (loading) {
    return (
      <section className="page">
        <div className="loading">
          A carregar condómino...
        </div>
      </section>
    )
  }

  if (!person) {
    return (
      <section className="page">
        <button
          className="secondary-button"
          onClick={onBack}
        >
          ← Voltar
        </button>

        <div className="empty-state">
          <div className="empty-icon">👤</div>

          <h3>Condómino não encontrado</h3>

          <p>
            Não foi possível carregar os dados desta pessoa.
          </p>
        </div>
      </section>
    )
  }

  const initial =
    person.full_name.charAt(0).toUpperCase()

  return (
    <section className="page">
      <div className="detail-header">
        <button
          className="secondary-button"
          onClick={onBack}
        >
          ← Voltar
        </button>

        <div className="person-title">
          <div className="large-avatar">
            {initial}
          </div>

          <div>
            <h2>{person.full_name}</h2>

            <p>
              {person.active
                ? 'Condómino ativo'
                : 'Condómino inativo'}
            </p>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Dados pessoais</h3>

          <div className="detail-row">
            <span>NIF / Número de contribuinte</span>
            <strong>
              {person.tax_number ?? '—'}
            </strong>
          </div>

          <div className="detail-row">
            <span>Email</span>
            <strong>
              {person.email ?? '—'}
            </strong>
          </div>

          <div className="detail-row">
            <span>Telefone</span>
            <strong>
              {person.phone ?? '—'}
            </strong>
          </div>

          <div className="detail-row">
            <span>Morada</span>
            <strong>
              {person.address ?? '—'}
            </strong>
          </div>

          <div className="detail-row">
            <span>Código postal</span>
            <strong>
              {person.postal_code ?? '—'}
            </strong>
          </div>

          <div className="detail-row">
            <span>Localidade</span>
            <strong>
              {person.city ?? '—'}
            </strong>
          </div>

          <div className="detail-row">
            <span>País</span>
            <strong>
              {person.country ?? '—'}
            </strong>
          </div>
        </div>

        <div className="detail-card">
          <h3>Acesso ao portal do condómino</h3>

          {person.user_id ? (
            <p>✅ Este condómino já tem acesso ao portal.</p>
          ) : (
            <>
              <p>
                Este condómino ainda não tem conta no portal.
                Envia-lhe um convite para criar acesso à sua área
                (documentos, quotas e manutenção da sua fração).
              </p>

              <button
                className="secondary-button"
                onClick={sendInvite}
                disabled={invitingLoading}
              >
                {invitingLoading ? 'A gerar convite...' : '✉️ Gerar convite de acesso'}
              </button>

              {inviteError && (
                <div className="login-error" style={{ marginTop: '10px' }}>
                  {inviteError}
                </div>
              )}

              {inviteLink && (
                <div style={{ marginTop: '12px' }}>
                  <label>Link do convite (válido 7 dias)</label>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" value={inviteLink} readOnly />

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={copyInviteLink}
                    >
                      Copiar
                    </button>
                  </div>

                  <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>
                    Envia este link ao condómino (por email ou WhatsApp)
                    para que ele crie a sua password de acesso.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="detail-card">
          <div className="card-header">
            <div>
              <h3>Frações</h3>

              <p>
                Frações associadas a este condómino.
              </p>
            </div>

            <button className="secondary-button">
              + Adicionar fração
            </button>
          </div>

          {associations.length === 0 ? (
            <div className="empty-state compact">
              <div className="empty-icon">🏠</div>

              <h3>Sem frações associadas</h3>

              <p>
                Este condómino ainda não está associado
                a nenhuma fração.
              </p>
            </div>
          ) : (
            <div className="association-list">
              {associations.map((association) => (
                <div
                  className="association-item"
                  key={association.id}
                >
                  <div className="fraction-icon">
                    🏠
                  </div>

                  <div className="association-info">
                    <strong>
                      Fração{' '}
                      {association.fraction.fraction_code}
                    </strong>

                    <span>
                      {relationLabels[
                        association.relation_type
                      ] ??
                        association.relation_type}
                    </span>

                    {association.is_primary && (
                      <small>
                        ⭐ Contacto principal
                      </small>
                    )}
                  </div>

                  <div className="association-meta">
                    {association.fraction.floor && (
                      <span>
                        {association.fraction.floor}
                      </span>
                    )}

                    {association.fraction.door && (
                      <span>
                        {association.fraction.door}
                      </span>
                    )}

                    {association.fraction.typology && (
                      <span>
                        {association.fraction.typology}
                      </span>
                    )}

                    {association.fraction.permillage !==
                      null && (
                      <span>
                        {association.fraction.permillage}‰
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default PersonDetails
