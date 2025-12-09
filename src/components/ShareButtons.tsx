import React from 'react'
import { Facebook, Twitter, MessageCircle, Link, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShareButtonsProps {
  url: string
  title: string
  description?: string
  className?: string
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({ 
  url, 
  title, 
  description = '', 
  className 
}) => {
  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      'facebook-share-dialog',
      'width=800,height=600'
    )
  }
  
  const shareOnTwitter = () => {
    const text = `Escuchando ${title} - ${description}`
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      'twitter-share-dialog',
      'width=800,height=600'
    )
  }
  
  const shareOnWhatsApp = () => {
    const text = `Escuchando ${title} - ${description} ${url}`
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      'whatsapp-share-dialog',
      'width=800,height=600'
    )
  }
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      alert('Enlace copiado al portapapeles')
    } catch (err) {
      console.error('Error al copiar el enlace:', err)
    }
  }
  
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Compartir:</span>
      
      <button
        onClick={shareOnFacebook}
        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
        title="Compartir en Facebook"
      >
        <Facebook className="w-4 h-4" />
      </button>
      
      <button
        onClick={shareOnTwitter}
        className="p-2 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors"
        title="Compartir en Twitter"
      >
        <Twitter className="w-4 h-4" />
      </button>
      
      <button
        onClick={shareOnWhatsApp}
        className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
        title="Compartir en WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
      </button>
      
      <button
        onClick={copyToClipboard}
        className="p-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
        title="Copiar enlace"
      >
        <Link className="w-4 h-4" />
      </button>
    </div>
  )
}