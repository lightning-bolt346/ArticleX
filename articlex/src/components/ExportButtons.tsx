import { motion } from 'framer-motion'
import { FileDown, FileCode2, FileText } from 'lucide-react'
import { useState } from 'react'
import { generateDocxBlob } from '../lib/generators/docx'
import { generateHtmlDocument } from '../lib/generators/html'
import { generateMarkdownDocument } from '../lib/generators/markdown'
import type { ArticleObject } from '../types/article'

interface ExportButtonsProps {
  article: ArticleObject
}

type ExportType = 'html' | 'markdown' | 'docx'

const triggerFileDownload = (filename: string, blob: Blob) => {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(objectUrl)
}

export const ExportButtons = ({ article }: ExportButtonsProps) => {
  const [isExporting, setIsExporting] = useState<ExportType | null>(null)
  const baseName = `articlex-${article.tweetId}`

  const handleExport = async (type: ExportType) => {
    setIsExporting(type)
    try {
      if (type === 'html') {
        const html = generateHtmlDocument(article)
        triggerFileDownload(`${baseName}.html`, new Blob([html], { type: 'text/html' }))
        return
      }

      if (type === 'markdown') {
        const markdown = generateMarkdownDocument(article)
        triggerFileDownload(
          `${baseName}.md`,
          new Blob([markdown], { type: 'text/markdown' }),
        )
        return
      }

      const docxBlob = await generateDocxBlob(article)
      triggerFileDownload(`${baseName}.docx`, docxBlob)
    } finally {
      setIsExporting(null)
    }
  }

  const buttonBaseClass =
    'inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-inter text-sm text-text-primary transition-colors hover:bg-white/10'

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <motion.button
        type="button"
        className={buttonBaseClass}
        onClick={() => handleExport('html')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        disabled={isExporting !== null}
      >
        <FileCode2 className="h-4 w-4" /> HTML
      </motion.button>

      <motion.button
        type="button"
        className={buttonBaseClass}
        onClick={() => handleExport('markdown')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        disabled={isExporting !== null}
      >
        <FileText className="h-4 w-4" /> Markdown
      </motion.button>

      <motion.button
        type="button"
        className={buttonBaseClass}
        onClick={() => handleExport('docx')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        disabled={isExporting !== null}
      >
        <FileDown className="h-4 w-4" /> {isExporting === 'docx' ? 'Generating…' : 'DOCX'}
      </motion.button>
    </div>
  )
}
