import React from 'react'

interface RichContentRendererProps {
  content: string
  className?: string
}

/**
 * Render inline markdown styles: **bold**, *italic*, `code`
 */
const renderInline = (text: string): React.ReactNode => {
  const tokens: React.ReactNode[] = []
  let remaining = text
  let keyIdx = 0

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^([\s\S]*?)\*\*(.+?)\*\*([\s\S]*)$/)
    const italicMatch = remaining.match(/^([\s\S]*?)\*(.+?)\*([\s\S]*)$/)
    const codeMatch = remaining.match(/^([\s\S]*?)`(.+?)`([\s\S]*)$/)

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

    candidates.sort((a, b) => a.index - b.index)
    const best = candidates[0]

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

type RenderBlock =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string; num?: number }
  | { type: 'h3'; text: string }
  | { type: 'quote'; lines: string[] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: { num: string; text: string }[] }
  | { type: 'p'; lines: string[] }

const parseBlocks = (content: string): RenderBlock[] => {
  const rawLines = content.split('\n')
  const blocks: RenderBlock[] = []
  let currentParagraph: string[] = []
  let currentQuote: string[] = []
  let currentUl: string[] = []
  let currentOl: { num: string; text: string }[] = []

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: 'p', lines: [...currentParagraph] })
      currentParagraph = []
    }
  }

  const flushQuote = () => {
    if (currentQuote.length > 0) {
      blocks.push({ type: 'quote', lines: [...currentQuote] })
      currentQuote = []
    }
  }

  const flushUl = () => {
    if (currentUl.length > 0) {
      blocks.push({ type: 'ul', items: [...currentUl] })
      currentUl = []
    }
  }

  const flushOl = () => {
    if (currentOl.length > 0) {
      blocks.push({ type: 'ol', items: [...currentOl] })
      currentOl = []
    }
  }

  const flushAll = () => {
    flushParagraph()
    flushQuote()
    flushUl()
    flushOl()
  }

  for (const rawLine of rawLines) {
    const line = rawLine.trim()

    // Blank line
    if (!line) {
      flushAll()
      continue
    }

    // Heading 3: starts with "### " (must check before ## and #)
    if (/^###\s+/.test(line)) {
      flushAll()
      const title = line.replace(/^###\s+/, '').trim()
      blocks.push({ type: 'h3', text: title })
      continue
    }

    // Heading 2: starts with "## "
    if (/^##\s+/.test(line)) {
      flushAll()
      const rawTitle = line.replace(/^##\s+/, '').trim()
      const numMatch = rawTitle.match(/^(?:(\d+)[.)]|Phần\s+(\d+)[:.]?)\s*(.+)$/i)
      if (numMatch) {
        const num = parseInt(numMatch[1] || numMatch[2], 10)
        const cleanTitle = numMatch[3].trim()
        blocks.push({ type: 'h2', text: cleanTitle, num })
      } else {
        blocks.push({ type: 'h2', text: rawTitle })
      }
      continue
    }

    // Heading 1: starts with "# "
    if (/^#\s+/.test(line)) {
      flushAll()
      const title = line.replace(/^#\s+/, '').trim()
      blocks.push({ type: 'h1', text: title })
      continue
    }

    // Blockquote: starts with ">"
    if (/^>\s*/.test(line)) {
      flushParagraph()
      flushUl()
      flushOl()
      currentQuote.push(line.replace(/^>\s*/, ''))
      continue
    }

    // Bullet list item: starts with "• ", "- ", "* "
    if (/^[•\-*]\s+/.test(line)) {
      flushParagraph()
      flushQuote()
      flushOl()
      currentUl.push(line.replace(/^[•\-*]\s+/, ''))
      continue
    }

    // Numbered list item: starts with "1. ", "2. ", etc.
    const olMatch = line.match(/^(\d+)\.\s+(.+)$/)
    if (olMatch) {
      flushParagraph()
      flushQuote()
      flushUl()
      currentOl.push({ num: olMatch[1], text: olMatch[2] })
      continue
    }

    // Normal text line inside paragraph
    flushQuote()
    flushUl()
    flushOl()
    currentParagraph.push(line)
  }

  flushAll()
  return blocks
}

export const RichContentRenderer: React.FC<RichContentRendererProps> = ({
  content,
  className = '',
}) => {
  if (!content || !content.trim()) {
    return <p className="text-slate-400 italic text-sm">Chưa có nội dung để hiển thị...</p>
  }

  const blocks = parseBlocks(content)

  return (
    <div className={`space-y-3.5 text-slate-700 leading-relaxed break-words ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return (
              <h1
                key={idx}
                className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight pt-4 pb-2 border-b border-slate-100"
              >
                {renderInline(block.text)}
              </h1>
            )

          case 'h2':
            return (
              <div key={idx} className="flex items-start gap-3 pt-3.5 pb-1">
                {block.num ? (
                  <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center mt-0.5 shadow-sm">
                    {block.num}
                  </span>
                ) : (
                  <span className="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-emerald-600 mt-2 shadow-xs" />
                )}
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight break-words leading-snug">
                  {renderInline(block.text)}
                </h2>
              </div>
            )

          case 'h3':
            return (
              <h3
                key={idx}
                className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight pt-2 pb-0.5"
              >
                {renderInline(block.text)}
              </h3>
            )

          case 'quote':
            return (
              <blockquote
                key={idx}
                className="my-3 p-4 sm:p-5 bg-emerald-50/70 border-l-4 border-emerald-600 rounded-r-2xl italic text-slate-800 text-sm sm:text-base leading-relaxed"
              >
                “{renderInline(block.lines.join(' '))}”
              </blockquote>
            )

          case 'ul':
            return (
              <ul key={idx} className="space-y-2 my-2.5 pl-1">
                {block.items.map((item, iIdx) => (
                  <li key={iIdx} className="flex items-start gap-2.5 text-sm sm:text-base text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-2" />
                    <span className="flex-1">{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
            )

          case 'ol':
            return (
              <ol key={idx} className="space-y-2.5 my-2.5 pl-1">
                {block.items.map((item, iIdx) => (
                  <li key={iIdx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {item.num}
                    </span>
                    <span className="flex-1">{renderInline(item.text)}</span>
                  </li>
                ))}
              </ol>
            )

          case 'p':
            return (
              <p key={idx} className="text-sm sm:text-base text-slate-700 leading-relaxed my-1.5">
                {block.lines.map((line, lIdx) => (
                  <React.Fragment key={lIdx}>
                    {renderInline(line)}
                    {lIdx < block.lines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            )

          default:
            return null
        }
      })}
    </div>
  )
}
export default RichContentRenderer
