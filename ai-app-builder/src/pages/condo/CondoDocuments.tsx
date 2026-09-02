import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const STORAGE_BUCKET = 'documents'

type CondoDocumentsProps = {
  fractionId: string
  condominiumId: string
}

type DocumentCategory = 'minutes' | 'regulation' | 'invoice' | 'contract' | 'other'

type DocumentRecord = {
  id: string
  name: string
  category: DocumentCategory
  file_path: string
  visibility: 'common' | 'private'
  uploaded_at: string
}

const categoryLabels: Record<DocumentCategory, string> = {
  minutes: 'Ata',
  regulation: 'Regulamento',
  invoice: 'Fatura',
  contract: 'Contrato',
  other: 'Outro',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium' }).format(new Date(value))
}

function CondoDocuments({ fractionId, condominiumId }: CondoDocumentsProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDocuments() {
      setLoading(true)

      // A RLS já garante que só vêm documentos comuns do condomínio
      // ou privados da fração do condómino — este filtro no cliente
      // é só para desenhar a etiqueta "Comum"/"A tua fração".
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

    loadDocuments()
  }, [fractionId, condominiumId])

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

  return (
    <div className="table-card">
      {loading ? (
        <div className="loading">A carregar...</div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>Sem documentos disponíveis</h3>
          <p>Ainda não há documentos partilhados contigo.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Âmbito</th>
              <th>Data</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <strong>{doc.name}</strong>
                </td>

                <td>{categoryLabels[doc.category]}</td>

                <td>{doc.visibility === 'common' ? 'Comum' : 'A tua fração'}</td>

                <td>{formatDate(doc.uploaded_at)}</td>

                <td>
                  <div className="table-actions">
                    <button title="Transferir" onClick={() => downloadDocument(doc)}>
                      ⬇️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default CondoDocuments
