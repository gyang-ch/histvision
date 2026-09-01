import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { BookRecord } from '../data/books';
import { Paginator } from './Paginator';

gsap.registerPlugin(ScrollTrigger);

interface BookDetailProps {
  books: BookRecord[];
  period: string;
  onSelectBook?: (book: BookRecord) => void;
  aiHubPathForBook?: (book: BookRecord) => string;
}

const SmartImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (hasError && retryCount < 3) {
      const timer = setTimeout(() => {
        setHasError(false);
        setRetryCount(c => c + 1);
      }, 1000 + retryCount * 1000); // Increasing backoff: 1s, 2s, 3s
      return () => clearTimeout(timer);
    }
  }, [hasError, retryCount]);

  if (hasError && retryCount >= 3) {
    return (
      <div 
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1e293b',
          color: '#94a3b8',
          fontSize: '0.8rem',
          minHeight: '200px'
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', opacity: 0.5 }}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <span>Preview Unavailable</span>
      </div>
    );
  }

  return (
    <img 
      src={`${src}${retryCount > 0 ? `?retry=${retryCount}` : ''}`} 
      alt={alt} 
      className={className}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};


const BOOKS_PER_PAGE = 18;

export const BookDetail: React.FC<BookDetailProps> = ({ books, period, onSelectBook }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  const totalPages = Math.max(1, Math.ceil(books.length / BOOKS_PER_PAGE));

  // Reset to page 1 whenever the book list changes (filter/period change)
  useEffect(() => {
    setCurrentPage(1);
    if (ctxRef.current) {
      ctxRef.current.revert();
      ctxRef.current = null;
    }
  }, [books]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const visibleBooks = books.slice((currentPage - 1) * BOOKS_PER_PAGE, currentPage * BOOKS_PER_PAGE);

  useLayoutEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    if (!ctxRef.current) {
      ctxRef.current = gsap.context(() => {}, gridRef);
    }

    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.book-card:not(.animated)');
      
      ctxRef.current.add(() => {
        cards.forEach((card) => {
          card.classList.add('animated');
          gsap.fromTo(card, 
            { 
              opacity: 0, 
              y: 50,
              scale: 0.95
            }, 
            { 
              scrollTrigger: {
                trigger: card,
                start: "top 90%", // Animate when the top of the card hits 90% of the viewport height
                once: true, // Do not repeat on scroll back and forth
              },
              opacity: 1, 
              y: 0, 
              scale: 1,
              duration: 0.8, 
              ease: 'power3.out',
              clearProps: 'all'
            }
          );
        });
      });
    }
  }, [currentPage, books]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        ctxRef.current.revert();
      }
    };
  }, []);

  if (books.length === 0) {
    return (
      <div className="no-books">
        <h3>Period: {period}</h3>
        <p>No books found for this interval.</p>
      </div>
    );
  }

  return (
    <div className="book-detail-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
        <h2 className="period-title" style={{ margin: 0 }}>Books from {period}</h2>
        <span style={{ color: '#475569', fontSize: '0.8rem' }}>
          {books.length} {books.length === 1 ? 'book' : 'books'} · page {currentPage} of {totalPages}
        </span>
      </div>
      <div className="books-grid" ref={gridRef}>
        {visibleBooks.map((book) => (
          <article
            key={book.id}
            className="book-card"
            onClick={(e) => {
              e.preventDefault();
              if (onSelectBook) onSelectBook(book);
            }}
            onKeyDown={(e) => {
              if (!onSelectBook) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectBook(book);
              }
            }}
            role={onSelectBook ? 'button' : undefined}
            tabIndex={onSelectBook ? 0 : -1}
            aria-label={onSelectBook ? `Open AI Hub for ${book.title}` : undefined}
          >
            <div className="book-image-container">
              <SmartImage src={book.thumbnailUrl} alt={book.title} className="book-thumbnail" />
            </div>
            <div className="book-info">
              <div className="book-header">
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className="institution-tag">{book.institution}</span>
                  <span className={`category-tag category-${book.category}`} style={{ 
                    fontSize: '0.7rem', 
                    padding: '2px 8px', 
                    borderRadius: '999px', 
                    background: book.category === 'astronomy' ? '#805ad5' : book.category === 'mathematics' ? '#3182ce' : '#38a169',
                    color: 'white',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>{book.category}</span>
                </div>
                <h3>{book.title}</h3>
              </div>
              
              <div className="book-meta-grid">
                <div className="meta-item" title={book.authors.join(', ')}>
                  <strong>Authors:</strong> {book.authors[0]}
                </div>
                <div className="meta-item">
                  <strong>Year:</strong> {book.year}
                </div>
                <div className="meta-item">
                  <strong>Language:</strong> {book.language[0]}
                </div>
                <div className="meta-item">
                  <strong>Images:</strong> {book.pageCount}
                </div>
              </div>
              <div className="book-subjects">
                {book.subjects.slice(0, 3).map((s) => (
                  <span key={s} className="subject-tag">{s}</span>
                ))}
              </div>
              
              <div className="spacer" style={{ flexGrow: 1 }}></div>
              
                <div className="book-footer">
                <p className="attribution-text">{book.attribution}</p>
                <div className="footer-actions">
                  <a
                    href={book.museumUrl || book.manifestUrl}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="source-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Source
                  </a>
                  {onSelectBook && (
                    <button
                      type="button"
                      className="explore-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBook(book);
                      }}
                    >
                      Explore book
                    </button>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      <Paginator currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
};
