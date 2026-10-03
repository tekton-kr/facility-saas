import type { PhotoSheet } from './photoSheet.ts'
import { sheetDateLabel } from './photoSheet.ts'

const THIN = { style: 'thin' as const, color: { argb: 'FF121820' } }
const BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN }

async function jpegBase64(src: string): Promise<string> {
  const image = new Image()
  image.decoding = 'async'
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('사진을 엑셀에 넣지 못했습니다.'))
    image.src = src
  })
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth || 1
  canvas.height = image.naturalHeight || 1
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('사진을 엑셀에 넣지 못했습니다.')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(image, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1] ?? ''
}

export async function downloadPhotoSheet(rows: PhotoSheet[], siteName: string) {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('사진대지', {
    pageSetup: {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.6, header: 0.2, footer: 0.3 },
    },
    headerFooter: {
      oddFooter: '&C&P 페이지',
    },
  })
  sheet.columns = [
    { width: 16 },
    { width: 28 },
    { width: 16 },
    { width: 24 },
  ]
  sheet.pageSetup.printTitlesRow = undefined

  let row = 1
  for (const [index, item] of rows.entries()) {
    const title = sheet.getRow(row)
    title.height = 28
    sheet.mergeCells(row, 1, row, 4)
    const titleCell = sheet.getCell(row, 1)
    titleCell.value = item.sample ? '사진대지  예시' : '사진대지'
    titleCell.font = { name: 'Malgun Gothic', size: 18, bold: true }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    for (let col = 1; col <= 4; col += 1) sheet.getCell(row, col).border = BORDER
    row += 1

    const imageStart = row
    const imageRows = 16
    sheet.mergeCells(imageStart, 1, imageStart + imageRows - 1, 4)
    for (let offset = 0; offset < imageRows; offset += 1) {
      const line = sheet.getRow(imageStart + offset)
      line.height = 18
      for (let col = 1; col <= 4; col += 1) sheet.getCell(imageStart + offset, col).border = BORDER
    }
    const base64 = await jpegBase64(item.image)
    const imageId = workbook.addImage({ base64, extension: 'jpeg' })
    sheet.addImage(imageId, {
      tl: { col: 0.15, row: imageStart - 1 + 0.2 },
      ext: { width: 620, height: 300 },
      editAs: 'oneCell',
    })
    row = imageStart + imageRows

    const trade = sheet.getRow(row)
    trade.height = 24
    trade.getCell(1).value = '공종명'
    trade.getCell(2).value = item.trade
    trade.getCell(3).value = '촬영일자'
    trade.getCell(4).value = sheetDateLabel(item.takenOn)
    row += 1

    const caption = sheet.getRow(row)
    caption.height = 24
    caption.getCell(1).value = '사진설명'
    sheet.mergeCells(row, 2, row, 4)
    caption.getCell(2).value = item.caption
    for (const line of [trade, caption]) {
      line.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = BORDER
        cell.font = { name: 'Malgun Gothic', size: 12, bold: colNumber === 1 || colNumber === 3 }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      })
    }
    row += 1

    const page = sheet.getRow(row)
    page.height = 22
    sheet.mergeCells(row, 1, row, 4)
    page.getCell(1).value = `${index + 1} 페이지`
    page.getCell(1).font = { name: 'Malgun Gothic', size: 11, color: { argb: 'FF8AA0B4' } }
    page.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
    if (index < rows.length - 1) page.addPageBreak()
    row += 2
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `사진대지-${siteName}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}
