import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Footer } from '@/components/Footer'
import { Navigation } from '@/components/Navigation'
import { useSeo } from '@/hooks/useSeo'
import { BLOG_ARTICLES, CATEGORY_LABELS, BlogCategory, BlogStep, formatBlogDate } from '@/lib/blogArticles'

const GuideCard = ({
  id,
  title,
  description,
  steps,
  publishedAt,
  readingMinutes,
}: {
  id: string
  title: string
  description: string
  steps: BlogStep[]
  publishedAt: string
  readingMinutes: number
}) => (
  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 sm:p-8">
    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a1acb8] dark:text-slate-400">
      {formatBlogDate(publishedAt)} · {readingMinutes} min de lectura
    </p>
    <h2 className="text-2xl font-black tracking-tight text-[#566a7f] dark:text-white">{title}</h2>
    <p className="mt-3 text-sm leading-7 text-[#697a8d] dark:text-slate-300">{description}</p>
    <ol className="mt-5 space-y-2 text-sm text-[#697a8d] dark:text-slate-300">
      {steps.map((step, index) => (
        <li key={`${title}-step-${index}`}>
          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#696cff]/10 text-xs font-black text-[#696cff]">
            {index + 1}
          </span>
          {step.text}
        </li>
      ))}
    </ol>
    <div className="mt-6">
      <Link
        to={`/blog/${id}`}
        className="inline-flex rounded-xl border border-[#696cff]/30 bg-[#696cff]/10 px-4 py-2 text-sm font-bold text-[#696cff] transition hover:bg-[#696cff] hover:text-white"
      >
        Leer guia completa
      </Link>
    </div>
  </article>
)

const Blog: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<BlogCategory>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}/blog` : 'https://fmlista.com/blog'

  useSeo({
    title: 'Blog y Guia de Uso | FM Lista',
    description:
      'Aprende a usar FM Lista paso a paso: guia para oyentes, administradores de radio y super administradores.',
    url: canonicalUrl,
    image: '/apple-touch-icon.png',
    siteName: 'FM Lista',
  })

  const filteredArticles = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase()

    return BLOG_ARTICLES.filter((article) => {
      const categoryMatch = activeCategory === 'all' || article.category === activeCategory
      if (!categoryMatch) return false

      if (!normalizedTerm) return true

      const haystack = `${article.title} ${article.description} ${article.steps.map((step) => step.text).join(' ')}`.toLowerCase()
      return haystack.includes(normalizedTerm)
    })
  }, [activeCategory, searchTerm])

  return (
    <div className="min-h-screen bg-[#f5f5f9] transition-colors dark:bg-slate-950">
      <Navigation />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-[#696cff]/10 via-white to-[#00a3ff]/10 p-6 shadow-sm dark:border-slate-800 dark:from-[#696cff]/20 dark:via-slate-900 dark:to-[#00a3ff]/15 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#696cff]">Blog FM Lista</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-[#566a7f] dark:text-white sm:text-5xl">
            Guia practica de la plataforma
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#697a8d] dark:text-slate-300">
            Centralizamos en esta seccion como usar cada parte del sitio, desde la vista del usuario oyente hasta
            todas las herramientas de administracion para radios.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/"
              className="rounded-xl bg-[#696cff] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#5f61e6]"
            >
              Ir al inicio
            </Link>
            <Link
              to="/admin"
              className="rounded-xl border border-[#696cff]/30 bg-white px-4 py-2 text-sm font-bold text-[#696cff] transition hover:bg-[#696cff]/10 dark:bg-slate-900"
            >
              Ir al panel
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {(['all', 'user', 'radio_admin', 'super_admin'] as BlogCategory[]).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    activeCategory === category
                      ? 'bg-[#696cff] text-white'
                      : 'bg-slate-100 text-[#566a7f] hover:bg-[#696cff]/10 hover:text-[#696cff] dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar en la guia..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-[#566a7f] outline-none ring-[#696cff] transition focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 lg:max-w-sm"
            />
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredArticles.map((article) => (
            <GuideCard
              key={article.id}
              id={article.id}
              title={article.title}
              description={article.description}
              steps={article.steps}
              publishedAt={article.publishedAt}
              readingMinutes={article.readingMinutes}
            />
          ))}
          {filteredArticles.length === 0 && (
            <article className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-medium text-[#697a8d] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 lg:col-span-2">
              No encontramos articulos para esa busqueda. Prueba con otro termino o cambia la categoria.
            </article>
          )}
        </section>
      </main>

      <Footer className="pb-8" />
    </div>
  )
}

export default Blog
