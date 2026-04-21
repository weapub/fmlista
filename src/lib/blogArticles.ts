export type BlogCategory = 'all' | 'user' | 'radio_admin' | 'super_admin'

export type BlogArticle = {
  id: string
  category: Exclude<BlogCategory, 'all'>
  title: string
  description: string
  steps: BlogStep[]
  publishedAt: string
  updatedAt?: string
  readingMinutes: number
}

export type BlogStep = {
  text: string
  screenshot?: {
    src: string
    alt: string
    caption?: string
  }
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: 'user-overview',
    category: 'user',
    title: 'Desde la vista del usuario',
    description: 'Como descubrir radios y moverse por el sitio principal.',
    steps: [
      { text: 'Usa el buscador del inicio para encontrar radios por nombre o ciudad.' },
      { text: 'Toca una etiqueta de localidad para filtrar automaticamente por esa ciudad.' },
      { text: 'Entra a cada tarjeta para abrir el micrositio con player, noticias y programacion.' },
      { text: 'Guarda favoritas para recuperarlas rapido desde Mi Biblioteca.' },
    ],
    publishedAt: '2026-04-21',
    readingMinutes: 3,
  },
  {
    id: 'microsites',
    category: 'user',
    title: 'Micrositios por radio',
    description: 'Cada emisora puede tener su propia experiencia publica.',
    steps: [
      { text: 'Accede por ruta tipo /ladocta o por subdominio cuando este configurado.' },
      { text: 'Comparte el link del micrositio para difusion en WhatsApp y redes.' },
      { text: 'Manten la portada, logos y datos clave actualizados para mejor conversion.' },
      { text: 'Publica contenido local para mejorar alcance y retencion de audiencia.' },
    ],
    publishedAt: '2026-04-21',
    readingMinutes: 3,
  },
  {
    id: 'radio-admin-flow',
    category: 'radio_admin',
    title: 'Administrador de radio',
    description: 'Flujo recomendado para dejar una emisora lista y operativa.',
    steps: [
      { text: 'Ingresa al panel y completa perfil, identidad visual y stream URL.' },
      { text: 'Configura programacion, noticias y anuncios desde el menu lateral.' },
      { text: 'Revisa estado del plan y vencimientos en el modulo de pagos.' },
      { text: 'Valida el micrositio final en movil, desktop y TV antes de promocionar.' },
    ],
    publishedAt: '2026-04-21',
    readingMinutes: 4,
  },
  {
    id: 'super-admin-flow',
    category: 'super_admin',
    title: 'Super administrador',
    description: 'Control global de catalogo, usuarios y monetizacion.',
    steps: [
      { text: 'Gestiona altas y bajas de radios desde Catalogo.' },
      { text: 'Asigna o degrada planes segun el estado comercial de cada emisora.' },
      { text: 'Controla facturacion y eventos de pago para resolver incidencias rapido.' },
      { text: 'Supervisa calidad de datos y politicas para mantener estabilidad del sistema.' },
    ],
    publishedAt: '2026-04-21',
    readingMinutes: 4,
  },
]

export const CATEGORY_LABELS: Record<BlogCategory, string> = {
  all: 'Todos',
  user: 'Usuario',
  radio_admin: 'Radio Admin',
  super_admin: 'Super Admin',
}

export const getBlogArticleById = (id?: string) => BLOG_ARTICLES.find((article) => article.id === id)

export const formatBlogDate = (dateValue: string) =>
  new Date(`${dateValue}T00:00:00`).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
