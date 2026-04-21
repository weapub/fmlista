import React from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Footer } from '@/components/Footer'
import { Navigation } from '@/components/Navigation'
import { BLOG_ARTICLES, CATEGORY_LABELS, getBlogArticleById } from '@/lib/blogArticles'
import { useSeo } from '@/hooks/useSeo'

const BlogArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const article = getBlogArticleById(slug)

  if (!article) {
    return <Navigate to="/blog" replace />
  }

  const canonicalUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/blog/${article.id}` : `https://fmlista.com/blog/${article.id}`

  const relatedArticles = BLOG_ARTICLES.filter((item) => item.id !== article.id && item.category === article.category)

  useSeo({
    title: `${article.title} | Blog FM Lista`,
    description: article.description,
    url: canonicalUrl,
    image: '/apple-touch-icon.png',
    siteName: 'FM Lista',
  })

  return (
    <div className="min-h-screen bg-[#f5f5f9] transition-colors dark:bg-slate-950">
      <Navigation />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#696cff]">
            {CATEGORY_LABELS[article.category]}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-[#566a7f] dark:text-white">{article.title}</h1>
          <p className="mt-4 text-base leading-7 text-[#697a8d] dark:text-slate-300">{article.description}</p>

          <ol className="mt-8 space-y-4">
            {article.steps.map((step, index) => (
              <li
                key={step}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-[#566a7f] dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
              >
                <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#696cff] text-xs font-black text-white">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/blog"
              className="rounded-xl border border-[#696cff]/30 bg-[#696cff]/10 px-4 py-2 text-sm font-bold text-[#696cff] transition hover:bg-[#696cff] hover:text-white"
            >
              Volver al blog
            </Link>
            <Link
              to="/admin"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-[#566a7f] transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Ir al panel
            </Link>
          </div>
        </article>

        {relatedArticles.length > 0 && (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <h2 className="text-xl font-black tracking-tight text-[#566a7f] dark:text-white">Guias relacionadas</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {relatedArticles.map((relatedArticle) => (
                <Link
                  key={relatedArticle.id}
                  to={`/blog/${relatedArticle.id}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#696cff]/40 hover:bg-[#696cff]/5 dark:border-slate-700 dark:bg-slate-800/60"
                >
                  <p className="font-bold text-[#566a7f] dark:text-white">{relatedArticle.title}</p>
                  <p className="mt-2 text-sm text-[#697a8d] dark:text-slate-300">{relatedArticle.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer className="pb-8" />
    </div>
  )
}

export default BlogArticlePage
