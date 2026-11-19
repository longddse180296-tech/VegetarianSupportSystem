import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react'

// Giãn theo chữ khi nhập, dán hoặc đổi chiều rộng của form.
export function AutoGrowTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    let width = 0
    const resize = () => { element.style.height = 'auto'; element.style.height = `${element.scrollHeight + 2}px` }
    resize()
    const observer = new ResizeObserver(entries => {
      const nextWidth = entries[0]?.contentRect.width
      if (nextWidth !== width) { width = nextWidth; resize() }
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [props.value])
  return <textarea {...props} ref={ref} rows={props.rows ?? 3}
    style={{ ...props.style, overflow: 'hidden', overflowWrap: 'anywhere', resize: 'none' }} />
}
