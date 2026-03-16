import { toPng } from 'html-to-image'

export const generatePNG = async (element: HTMLElement, filename: string): Promise<void> => {
  const dataUrl = await toPng(element, {
    quality: 1,
    pixelRatio: 3,
    filter: (node) => {
      if (node instanceof HTMLElement && node.dataset.exportExclude !== undefined) {
        return false
      }
      return true
    },
  })

  const anchor = document.createElement('a')
  anchor.href = dataUrl
  anchor.download = `${filename}.png`
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}
