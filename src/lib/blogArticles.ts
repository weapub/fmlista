export type BlogCategory = 'all' | 'user' | 'radio_admin' | 'super_admin'

export type BlogArticle = {
  id: string
  category: Exclude<BlogCategory, 'all'>
  title: string
  description: string
  steps: string[]
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: 'user-overview',
    category: 'user',
    title: 'Desde la vista del usuario',
    description: 'Como descubrir radios y moverse por el sitio principal.',
    steps: [
      'Usa el buscador del inicio para encontrar radios por nombre o ciudad.',
      'Toca una etiqueta de localidad para filtrar automaticamente por esa ciudad.',
      'Entra a cada tarjeta para abrir el micrositio con player, noticias y programacion.',
      'Guarda favoritas para recuperarlas rapido desde Mi Biblioteca.',
    ],
  },
  {
    id: 'microsites',
    category: 'user',
    title: 'Micrositios por radio',
    description: 'Cada emisora puede tener su propia experiencia publica.',
    steps: [
      'Accede por ruta tipo /ladocta o por subdominio cuando este configurado.',
      'Comparte el link del micrositio para difusion en WhatsApp y redes.',
      'Manten la portada, logos y datos clave actualizados para mejor conversion.',
      'Publica contenido local para mejorar alcance y retencion de audiencia.',
    ],
  },
  {
    id: 'radio-admin-flow',
    category: 'radio_admin',
    title: 'Administrador de radio',
    description: 'Flujo recomendado para dejar una emisora lista y operativa.',
    steps: [
      'Ingresa al panel y completa perfil, identidad visual y stream URL.',
      'Configura programacion, noticias y anuncios desde el menu lateral.',
      'Revisa estado del plan y vencimientos en el modulo de pagos.',
      'Valida el micrositio final en movil, desktop y TV antes de promocionar.',
    ],
  },
  {
    id: 'super-admin-flow',
    category: 'super_admin',
    title: 'Super administrador',
    description: 'Control global de catalogo, usuarios y monetizacion.',
    steps: [
      'Gestiona altas y bajas de radios desde Catalogo.',
      'Asigna o degrada planes segun el estado comercial de cada emisora.',
      'Controla facturacion y eventos de pago para resolver incidencias rapido.',
      'Supervisa calidad de datos y politicas para mantener estabilidad del sistema.',
    ],
  },
]

export const CATEGORY_LABELS: Record<BlogCategory, string> = {
  all: 'Todos',
  user: 'Usuario',
  radio_admin: 'Radio Admin',
  super_admin: 'Super Admin',
}

export const getBlogArticleById = (id?: string) => BLOG_ARTICLES.find((article) => article.id === id)
