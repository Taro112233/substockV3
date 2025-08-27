// hooks/usePrintPDF.ts
import { useCallback } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

export interface UsePrintPDFOptions {
  filename?: string
  scale?: number
  quality?: number
  margin?: number
  orientation?: 'portrait' | 'landscape'
}

export function usePrintPDF() {
  const generateAndPrintPDF = useCallback(async (
    elementId: string,
    options: UsePrintPDFOptions = {}
  ) => {
    const {
      filename = 'hospital-pharmacy-document',
      scale = 2,
      quality = 0.95,
      margin = 10,
      orientation = 'portrait'
    } = options

    try {
      // ตรวจสอบ element
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error(`ไม่พบ element ที่มี ID: ${elementId}`)
      }

      // แสดง loading
      toast.loading('กำลังสร้าง PDF...', {
        id: 'pdf-generation'
      })

      // รอให้ fonts โหลดเสร็จ
      await document.fonts.ready

      // สร้าง canvas
      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 10000,
        onclone: (clonedDoc) => {
          // ปรับแต่ง styles สำหรับ print
          const clonedElement = clonedDoc.getElementById(elementId)
          if (clonedElement) {
            clonedElement.style.fontFamily = 'system-ui, -apple-system, sans-serif'
            clonedElement.style.fontSize = '14px'
            clonedElement.style.lineHeight = '1.4'
          }
        }
      })

      // คำนวณขนาด PDF
      const imgWidth = orientation === 'portrait' ? 210 : 297 // A4 dimensions in mm
      const imgHeight = orientation === 'portrait' ? 297 : 210
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      
      // คำนวณขนาดที่เหมาะสม
      const ratio = Math.min(
        (imgWidth - margin * 2) / (canvasWidth / scale),
        (imgHeight - margin * 2) / (canvasHeight / scale)
      )
      
      const scaledWidth = (canvasWidth / scale) * ratio
      const scaledHeight = (canvasHeight / scale) * ratio
      
      // สร้าง PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      // เพิ่มรูปภาพลง PDF
      const imgData = canvas.toDataURL('image/jpeg', quality)
      const x = (imgWidth - scaledWidth) / 2
      const y = margin
      
      pdf.addImage(imgData, 'JPEG', x, y, scaledWidth, scaledHeight)

      // สร้าง blob และ URL
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)

      // สร้าง hidden iframe สำหรับ print
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.top = '-9999px'
      iframe.style.left = '-9999px'
      iframe.style.width = '1px'
      iframe.style.height = '1px'
      iframe.style.border = 'none'
      iframe.src = pdfUrl
      
      document.body.appendChild(iframe)

      // รอให้โหลดเสร็จแล้วเปิด print dialog
      return new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          cleanup()
          reject(new Error('PDF print timeout'))
        }, 15000)

        const cleanup = () => {
          clearTimeout(timeoutId)
          if (iframe.parentNode) {
            document.body.removeChild(iframe)
          }
          URL.revokeObjectURL(pdfUrl)
          toast.dismiss('pdf-generation')
        }

        iframe.onload = () => {
          try {
            // เปิด print dialog
            iframe.contentWindow?.print()
            
            // แสดงข้อความสำเร็จ
            toast.success('เปิด Print Dialog สำเร็จ', {
              description: 'กรุณาเลือก Printer และดำเนินการพิมพ์',
              id: 'pdf-generation'
            })

            // ทำความสะอาดหลัง 3 วินาที
            setTimeout(() => {
              cleanup()
              resolve()
            }, 3000)

          } catch (error) {
            cleanup()
            reject(error)
          }
        }

        iframe.onerror = () => {
          cleanup()
          reject(new Error('ไม่สามารถโหลด PDF ได้'))
        }
      })

    } catch (error) {
      toast.dismiss('pdf-generation')
      toast.error('ไม่สามารถสร้าง PDF ได้', {
        description: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ'
      })
      throw error
    }
  }, [])

  const downloadPDF = useCallback(async (
    elementId: string,
    options: UsePrintPDFOptions = {}
  ) => {
    const {
      filename = 'hospital-pharmacy-document',
      scale = 2,
      quality = 0.95,
      orientation = 'portrait'
    } = options

    try {
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error(`ไม่พบ element ที่มี ID: ${elementId}`)
      }

      toast.loading('กำลังสร้าง PDF สำหรับดาวน์โหลด...', {
        id: 'pdf-download'
      })

      await document.fonts.ready

      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      })

      const imgWidth = orientation === 'portrait' ? 210 : 297
      const imgHeight = orientation === 'portrait' ? 297 : 210
      const canvasRatio = canvas.height / canvas.width
      const finalWidth = imgWidth - 20
      const finalHeight = finalWidth * canvasRatio

      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4'
      })

      pdf.addImage(
        canvas.toDataURL('image/jpeg', quality),
        'JPEG',
        10,
        10,
        finalWidth,
        Math.min(finalHeight, imgHeight - 20)
      )

      // สร้าง filename ที่มี timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const finalFilename = `${filename}_${timestamp}.pdf`

      pdf.save(finalFilename)

      toast.success('ดาวน์โหลด PDF สำเร็จ', {
        description: `ไฟล์: ${finalFilename}`,
        id: 'pdf-download'
      })

    } catch (error) {
      toast.dismiss('pdf-download')
      toast.error('ไม่สามารถดาวน์โหลด PDF ได้', {
        description: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
      })
      throw error
    }
  }, [])

  return {
    generateAndPrintPDF,
    downloadPDF
  }
}