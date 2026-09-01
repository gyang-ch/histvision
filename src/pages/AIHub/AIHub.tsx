import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { bookData } from '../../data/books'
import { BookReader } from '../../components/BookReader'

export function AIHubPage() {
  const { bookId } = useParams()
  const navigate = useNavigate()

  const selectedBook = useMemo(() => {
    if (!bookId) return null
    return bookData.find((b) => b.id === bookId) ?? null
  }, [bookId])

  if (!bookId) {
    return (
      <section className="ai-hub-empty">
        <h2 className="ai-hub-title">AI Hub</h2>
        <p className="ai-hub-body">
          The AI Hub opens from a selected book. Choose an item in the Library to begin.
        </p>
        <div className="ai-hub-actions">
          <Link className="ai-hub-link" to="/library">
            Go to Library
          </Link>
        </div>
      </section>
    )
  }

  if (!selectedBook) {
    return (
      <section className="ai-hub-empty">
        <h2 className="ai-hub-title">AI Hub</h2>
        <p className="ai-hub-body">
          This manuscript could not be found. It may have been renamed or removed.
        </p>
        <div className="ai-hub-actions">
          <Link className="ai-hub-link" to="/library">
            Browse Library
          </Link>
        </div>
      </section>
    )
  }

  return (
    <BookReader
      book={selectedBook}
      onBack={() => {
        navigate('/library')
      }}
    />
  )
}
