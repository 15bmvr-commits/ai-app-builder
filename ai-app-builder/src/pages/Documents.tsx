import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_BUCKET = 'documents'

type Condominium = {
  id: string
  name: string
}

type DocumentCategory =
  | 'minutes'
  | 'regulation'
  | 'invoice'
  | 'contract'
  | 'other'

type Fraction = {
  id: string
  fraction_code: string
}

type DocumentRecord = {
  id: string
  condominium_id: string
  name: string
  category: DocumentCategory
  file_path: string
  file_size: number | null
  uploaded_at: string
  visibility: 'common' | 'private'
  fraction_id: string | null
}

const categoryLabels: Record<DocumentCategory, string> = {
  minutes: 'Ata',
  regulation: 'Regulamento',
  invoice: 'Fatura',
  contract: 'Contrato',
  other: 'Outro',
}

function formatDate(value: string) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'medium',
  }).format(date)
}

function formatSize(bytes: number | null) {
  if (bytes === null) {
    return '—'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Documents() {
  const [condominiums, setCondominiums] = useState<Condominium[]>([])
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [fractions, setFractions] = useState<Fraction[]>([])

  const [selectedCondominium, setSelectedCondominium] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const [category, setCategory] = useState<DocumentCategory>('other')
  const [visibility, setVisibility] = useState<'common' | 'private'>('common')
  const [fractionId, setFractionId] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

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

    const result = data ?? []

    setCondominiums(result)

    if (!selectedCondominium && result.length > 0) {
      setSelectedCondominium(result[0].id)
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

  async function loadDocuments(condominiumId: string) {
    setLoading(true)

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('condominium_id', condominiumId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar documentos:', error)
      setDocuments([])
      setLoading(false)
      return
    }

    setDocuments(data ?? [])
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
    loadDocuments(selectedCondominium)
  }, [selectedCondominium])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPendingFile(file)
  }

  async function uploadDocument() {
    if (!selectedCondominium) {
      alert('Seleciona um condomínio.')
      return
    }

    if (!pendingFile) {
      alert('Escolhe um ficheiro para carregar.')
      return
    }

    if (visibility === 'private' && !fractionId) {
      alert('Escolhe a fração para um documento privado.')
      return
    }

    setUploading(true)

    const safeName = pendingFile.name.replace(/[^\w.-]+/g, '_')
    const path = `${selectedCondominium}/${Date.now()}_${safeName}`

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, pendingFile)

    if (uploadError) {
      console.error('Erro ao carregar ficheiro:', uploadError)

      alert(
        `Erro ao carregar ficheiro: ${uploadError.message}\n\n` +
          `Confirma que o bucket "${STORAGE_BUCKET}" existe no Supabase Storage.`
      )

      setUploading(false)
      return
    }

    const { error: insertError } = await supabase.from('documents').insert({
      condominium_id: selectedCondominium,
      name: pendingFile.name,
      category,
      file_path: path,
      file_size: pendingFile.size,
      uploaded_at: new Date().toISOString(),
      visibility,
      fraction_id: visibility === 'private' ? fractionId : null,
    })

    if (insertError) {
      console.error('Erro ao guardar metadados do documento:', insertError)
      alert(`Erro ao guardar documento: ${insertError.message}`)

      // Reverte o upload para não deixar um ficheiro órfão no storage.
      await supabase.storage.from(STORAGE_BUCKET).remove([path])

      setUploading(false)
      return
    }

    setUploading(false)
    setPendingFile(null)
    setCategory('other')
    setVisibility('common')
    setFractionId('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    await loadDocuments(selectedCondominium)
  }

  async function downloadDocument(doc: DocumentRecord) {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(doc.file_path, 60)

    if (error || !data?.signedUrl) {
      console.error('Erro ao gerar link de download:', error)
      alert('Não foi possível gerar o link de download.')
      return
    }

    window.open(data.signedUrl, '_blank')
  }

  async function deleteDocument(doc: DocumentRecord) {
    const confirmed = window.confirm(
      `Queres eliminar o documento "${doc.name}"?`
    )

    if (!confirmed) {
      return
    }

    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([doc.file_path])

    if (storageError) {
      console.error('Erro ao eliminar ficheiro:', storageError)
      alert(`Erro ao eliminar ficheiro: ${storageError.message}`)
      return
    }

    const { error } = await supabase.from('documents').delete().eq('id', doc.id)

    if (error) {
      console.error('Erro ao eliminar documento:', error)
      alert(`Erro ao eliminar documento: ${error.message}`)
      return
    }

    await loadDocuments(selectedCondominium)
  }

  const filteredDocuments = useMemo(() => {
    const searchText = search.trim().toLowerCase()

    if (!searchText) {
      return documents
    }

    return documents.filter((doc) => {
      const text = `
        ${doc.name}
        ${categoryLabels[doc.category]}
      `.toLowerCase()

      return text.includes(searchText)
    })
  }, [documents, search])

  return (
    <section className="page">
      <div className="section-header">
        <div>
          <h2>Documentos</h2>
          <p>Arquiva e consulta os documentos dos condomínios.</p>
        </div>
      </div>

      <div className="filter-bar">
        <label>Condomínio</label>

        <select
          value={selectedCondominium}
          onChange={(e) => setSelectedCondominium(e.target.value)}
        >
          {condominiums.map((condominium) => (
            <option key={condominium.id} value={condominium.id}>
              {condominium.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="🔎 Pesquisar documentos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="form-card">
        <h3>Carregar documento</h3>

        <div className="form-grid">
          <div>
            <label>Ficheiro</label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
            />
          </div>

          <div>
            <label>Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Âmbito</label>
            <select
              value={visibility}
              onChange={(e) => {
                setVisibility(e.target.value as 'common' | 'private')
                setFractionId('')
              }}
            >
              <option value="common">Comum (todos os condóminos)</option>
              <option value="private">Privado (uma fração)</option>
            </select>
          </div>

          {visibility === 'private' && (
            <div>
              <label>Fração</label>
              <select value={fractionId} onChange={(e) => setFractionId(e.target.value)}>
                <option value="">Seleciona a fração</option>
                {fractions.map((fraction) => (
                  <option key={fraction.id} value={fraction.id}>
                    {fraction.fraction_code}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="create-button"
            onClick={uploadDocument}
            disabled={uploading || !pendingFile}
          >
            {uploading ? 'A carregar...' : '⬆️ Carregar documento'}
          </button>
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="loading">A carregar...</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>Sem documentos</h3>
            <p>Carrega o primeiro documento para este condomínio.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Âmbito</th>
                <th>Tamanho</th>
                <th>Carregado em</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <strong>{doc.name}</strong>
                  </td>

                  <td>{categoryLabels[doc.category]}</td>

                  <td>
                    {doc.visibility === 'common'
                      ? 'Comum'
                      : fractions.find((f) => f.id === doc.fraction_id)?.fraction_code ?? 'Privado'}
                  </td>

                  <td>{formatSize(doc.file_size)}</td>

                  <td>{formatDate(doc.uploaded_at)}</td>

                  <td>
                    <div className="table-actions">
                      <button
                        title="Transferir"
                        onClick={() => downloadDocument(doc)}
                      >
                        ⬇️
                      </button>

                      <button title="Eliminar" onClick={() => deleteDocument(doc)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

export default Documents
