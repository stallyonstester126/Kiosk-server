import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'

/**
 * Generates a UTF-8 encoded CSV string with BOM for correct Excel loading.
 */
export function generateCSV(headers: string[], rows: any[][]): string {
    const escape = (val: any) => {
        if (val === null || val === undefined) return ''
        const str = String(val)
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`
        }
        return str
    }
    const lines = [headers.map(escape).join(',')]
    for (const r of rows) {
        lines.push(r.map(escape).join(','))
    }
    return '\ufeff' + lines.join('\n')
}

interface ExcelColumn {
    header: string
    key: string
    width?: number
}

/**
 * Generates a styled Excel sheet buffer.
 */
export async function generateExcel(
    sheetName: string,
    columns: ExcelColumn[],
    data: any[],
    summaryData?: { label: string; value: any }[]
): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(sheetName)

    worksheet.columns = columns

    // Header row styling
    const headerRow = worksheet.getRow(1)
    headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5511E' } // Brand Orange
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'left' }
    headerRow.height = 24

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }]

    // Add data rows
    data.forEach((item) => {
        worksheet.addRow(item)
    })

    // Auto-fit column widths
    worksheet.columns.forEach((column) => {
        let maxLen = 0
        column.eachCell!({ includeEmpty: true }, (cell) => {
            const valLen = cell.value ? String(cell.value).length : 0
            if (valLen > maxLen) {
                maxLen = valLen
            }
        })
        column.width = Math.max(maxLen + 4, 12)
    })

    // Summary block
    if (summaryData && summaryData.length > 0) {
        worksheet.addRow([]) // Spacer row
        summaryData.forEach((sum) => {
            const row = worksheet.addRow({
                [columns[0].key]: sum.label,
                [columns[1].key]: sum.value
            })
            row.getCell(1).font = { bold: true }
            row.getCell(2).font = { bold: true }
        })
    }

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer
}

interface PDFColumn {
    header: string
    width: number
    align?: 'left' | 'right' | 'center'
    field: string
}

/**
 * Generates a styled PDF Document.
 */
export function generatePDF(
    title: string,
    columns: PDFColumn[],
    data: any[],
    summaryData: { label: string; value: any }[],
    filters: { label: string; value: string }[]
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 })

        doc.on('data', (chunk) => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks as Uint8Array[])))
        doc.on('error', (err) => reject(err))

        // Header Title Block
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#FFA600').text('QUICKCRAVE POS', 30, 30)
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#333333').text(title, 30, 48)
        doc.font('Helvetica').fontSize(7).fillColor('#777777').text(`Generated at: ${new Date().toLocaleString()}`, 30, 62)

        // Filters list
        let currentY = 75
        if (filters.length > 0) {
            doc.font('Helvetica-Bold').fontSize(7).fillColor('#555555').text('Applied Filters: ', 30, currentY)
            const filterStr = filters.map((f) => `${f.label}: ${f.value}`).join('  |  ')
            doc.font('Helvetica').fontSize(7).fillColor('#777777').text(filterStr, 100, currentY)
            currentY += 12
        }

        // Horizontal line separator
        doc.moveTo(30, currentY).lineTo(doc.page.width - 30, currentY).strokeColor('#e5e7eb').lineWidth(1).stroke()
        currentY += 12

        // Draw Table Header
        const startX = 30
        doc.rect(startX, currentY, doc.page.width - 60, 16).fill('#FFA600')
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5)

        let headerX = startX + 5
        columns.forEach((col) => {
            doc.text(col.header, headerX, currentY + 4.5, { width: col.width, align: col.align || 'left' })
            headerX += col.width + 5
        })
        currentY += 20

        // Draw Table Rows
        doc.font('Helvetica').fontSize(7).fillColor('#333333')
        let alternate = false
        data.forEach((row) => {
            if (currentY > doc.page.height - 70) {
                // Page overflow: add new page and repeat headers
                doc.addPage()
                currentY = 40
                doc.rect(startX, currentY, doc.page.width - 60, 16).fill('#FFA600')
                doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5)
                let tempX = startX + 5
                columns.forEach((col) => {
                    doc.text(col.header, tempX, currentY + 4.5, { width: col.width, align: col.align || 'left' })
                    tempX += col.width + 5
                })
                currentY += 20
                doc.font('Helvetica').fontSize(7).fillColor('#333333')
            }

            if (alternate) {
                doc.rect(startX, currentY - 2, doc.page.width - 60, 13).fillColor('#f9fafb').fill()
            }
            doc.fillColor('#333333')

            let itemX = startX + 5
            columns.forEach((col) => {
                const val = row[col.field] !== undefined && row[col.field] !== null ? String(row[col.field]) : ''
                doc.text(val, itemX, currentY, { width: col.width, align: col.align || 'left' })
                itemX += col.width + 5
            })

            alternate = !alternate
            currentY += 13
        })

        // Draw Summary box
        if (summaryData && summaryData.length > 0) {
            if (currentY > doc.page.height - 100) {
                doc.addPage()
                currentY = 40
            }
            currentY += 15
            doc.moveTo(startX, currentY).lineTo(doc.page.width - startX, currentY).strokeColor('#d1d5db').lineWidth(1).stroke()
            currentY += 10

            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#111827').text('SUMMARY TOTALS', startX, currentY)
            currentY += 12

            let sumX = startX
            summaryData.forEach((sum) => {
                doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#4b5563').text(sum.label, sumX, currentY)
                doc.font('Helvetica').fontSize(7.5).fillColor('#111827').text(String(sum.value), sumX, currentY + 10)
                sumX += 110
            })
        }

        // Add page numbers at the footer
        const range = doc.bufferedPageRange()
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i)
            doc.font('Helvetica').fontSize(6.5).fillColor('#9ca3af').text(
                `Page ${i + 1} of ${range.count}`,
                startX,
                doc.page.height - 20,
                { align: 'right', width: doc.page.width - 60 }
            )
        }

        doc.end()
    })
}
