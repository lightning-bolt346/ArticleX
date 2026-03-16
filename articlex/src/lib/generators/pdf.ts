import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

export const generatePDF = async (element: HTMLElement, filename: string): Promise<void> => {
  const dataUrl = await toPng(element, {
    quality: 1,
    pixelRatio: 2,
    filter: (node) => {
      if (node instanceof HTMLElement && node.dataset.exportExclude !== undefined) {
        return false
      }
      return true
    },
  })

  const img = new Image()
  img.src = dataUrl
  await new Promise<void>((resolve) => {
    img.onload = () => resolve()
  })

  const pxToMm = 0.264583
  const pdfWidth = img.naturalWidth * pxToMm / 2
  const pdfHeight = img.naturalHeight * pxToMm / 2

  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
  })

  pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight)
  pdf.save(`${filename}.pdf`)
}
