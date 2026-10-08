import React from 'react'

interface RichContentRendererProps {
  content: string
  className?: string
}

/**
 * Render inline markdown styles: **bold**, *italic*, `code`
 */
const renderInline = (text: string): React.ReactNode => {
  // Regex to match **bold**, *italic*, and `code`
  const tokens: React.ReactNode[] = []
  let remaining = text
  let keyIdx = 0

  while (remaining.length > 0) {
    // Check for bold **text**
    const boldMatch = remaining.match(/^([\s\S]*?)\*\*(.+?)\*\*([\s\S]*)$/)
    // Check for italic *text*
    const italicMatch = remaining.match(/^([\s\S]*?)\*(.+?)\*([\s\S]*)$/)
    // Check for inline code `text`
    const codeMatch = remaining.match(/^([\s\S]*?)`(.+?)`([\s\S]*)$/)

    // Find whichever comes first
    type MatchCandidate = { type: 'bold' | 'italic' | 'code'; match: RegExpMatchArray; index: number }
    const candidates: MatchCandidate[] = []

    if (boldMatch && boldMatch[1] !== undefined) {
      candidates.push({ type: 'bold', match: boldMatch, index: boldMatch[1].length })
    }
    if (italicMatch && italicMatch[1] !== undefined) {
      candidates.push({ type: 'italic', match: italicMatch, index: italicMatch[1].length })
    }
    if (codeMatch && codeMatch[1] !== undefined) {
      candidates.push({ type: 'code', match: codeMatch, index: codeMatch[1].length })
    }

    if (candidates.length === 0) {
      tokens.push(<span key={keyIdx++}>{remaining}</span>)
      break
    }

    // Sort by earliest position
    candidates.sort((a, b) => a.index - b.index)
    const best = candidates[0]

    // Push preceding plain text
    if (best.match[1]) {
      tokens.push(<span key={keyIdx++}>{best.match[1]}</span>)
    }

    if (best.type === 'bold') {
      tokens.push(
        <strong key={keyIdx++} className="font-bold text-slate-900">
          {renderInline(best.match[2])}
        </strong>,
      )
      remaining = best.match[3]
    } else if (best.type === 'italic') {
      tokens.push(
        <em key={keyIdx++} className="italic text-slate-800">
          {renderInline(best.match[2])}
        </em>,
      )
      remaining = best.match[3]
    } else if (best.type === 'code') {
      tokens.push(
        <code
          key={keyIdx++}
          className="px-1.5 py-0.5 bg-slate-100 text-emerald-800 font-mono text-xs rounded border border-slate-200"
        >
          {best.match[2]}
        </code>,
      )
      remaining = best.match[3]
    }
  }

  return <>{tokens}</>
}

export const RichContentRenderer: React.FC<RichContentRendererProps> = ({
  content,
  className = '',
}) => {
  if (!content || !content.trim()) {
    return <p className="text-slate-400 italic text-sm">Chưa có nội dung để hiển thị...</p>
  }

  // Split into paragraph/section blocks by double newlines or single newlines
  const rawParagraphs = content.split(/\n\s*\n/)

  return (
    <div className={`space-y-4 text-slate-700 leading-relaxed break-words ${className}`}>
      {rawParagraphs.map((block, pIdx) => {
        const trimmed = block.trim()
        if (!trimmed) return null

        const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean)

        // Case 1: Heading 1 (# Heading)
        if (lines.length === 1 && trimmed.startsWith('# ')) {
          return (
            <h1
              key={pIdx}
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 pt-4 pb-1 border-b border-slate-100 tracking-tight"
            >
              {renderInline(trimmed.replace(/^#\s+/, ''))}
            </h1>
          )
        }

        // Case 2: Heading 2 (## Heading)
        if (lines.length === 1 && trimmed.startsWith('## ')) {
          return (
            <h2
              key={pIdx}
              className="text-xl sm:text-2xl font-bold text-slate-900 pt-3 pb-1 tracking-tight flex items-center gap-2"
            >
              <span className="w-1.5 h-6 bg-emerald-600 rounded-full shrink-0" />
              <span>{renderInline(trimmed.replace(/^##\s+/, ''))}</span>
            </h2>
          )
        }

        // Case 3: Heading 3 (### Heading)
        if (lines.length === 1 && trimmed.startsWith('### ')) {
          return (
            <h3 key={pIdx} className="text-lg sm:text-xl font-bold text-slate-800 pt-2 pb-0.5">
              {renderInline(trimmed.replace(/^###\s+/, ''))}
            </h3>
          )
        }

        // Case 4: Blockquote (> quote)
        if (lines.every((l) => l.startsWith('>'))) {
          const quoteText = lines.map((l) => l.replace(/^>\s*/, '')).join(' ')
          return (
            <blockquote
              key={pIdx}
              className="my-4 p-4 sm:p-5 bg-emerald-50/70 border-l-4 border-emerald-600 rounded-r-2xl italic text-slate-800 text-sm sm:text-base leading-relaxed"
            >
              “{renderInline(quoteText)}”
            </blockquote>
          )
        }

        // Case 5: Bullet list (lines starting with • or - or *)
        const isBulletList = lines.length > 0 && lines.every((l) => /^([•\-*]|\d+\.)\s/.test(l))
        if (isBulletList) {
          const isOrdered = /^\d+\.\s/.test(lines[0])
          if (isOrdered) {
            return (
              <ol key={pIdx} className="space-y-2.5 my-3 pl-1">
                {lines.map((line, lIdx) => {
                  const match = line.match(/^(\d+)\.\s+(.*)$/)
                  const num = match ? match[1] : `${lIdx + 1}`
                  const itemText = match ? match[2] : line
                  return (
                    <li key={lIdx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {num}
                      </span>
                      <span className="flex-1">{renderInline(itemText)}</span>
                    </li>
                  )
                })}
              </ol>
            )
          }

          return (
            <ul key={pIdx} className="space-y-2 my-3 pl-1">
              {lines.map((line, lIdx) => {
                const itemText = line.replace(/^[•\-*]\s+/, '')
                return (
                  <li key={lIdx} className="flex items-start gap-2.5 text-sm sm:text-base text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-2" />
                    <span className="flex-1">{renderInline(itemText)}</span>
                  </li>
                )
              })}
            </ul>
          )
        }

        // Case 6: Mixed lines inside a paragraph (render line breaks cleanly)
        return (
          <p key={pIdx} className="text-sm sm:text-base text-slate-700 leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderInline(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
export default RichContentRenderer
