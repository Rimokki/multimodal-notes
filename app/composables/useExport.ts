import JSZip from 'jszip'

let editorInstance: any = null

export function useExport() {
  const noteTitle = useState<string>('noteTitle', () => '无标题笔记')
  const noteContent = useState<string>('noteContent', () => '')

  function setEditor(editor: any) {
    editorInstance = editor
  }

  function getSafeFileName(title: string, ext: string): string {
    const safe = title.replace(/[<>:"/\\|?*]/g, '').trim() || '无标题笔记'
    return `${safe}.${ext}`
  }

  function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function exportMarkdown() {
    try {
      if (!editorInstance) {
        ElMessage.error('编辑器尚未初始化')
        return
      }
      const markdown = editorInstance.getMarkdown()
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
      downloadBlob(blob, getSafeFileName(noteTitle.value, 'md'))
      ElMessage.success('Markdown导出成功')
    } catch {
      ElMessage.error('Markdown导出失败')
    }
  }

  async function exportPdf() {
    try {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = noteContent.value
      tempDiv.querySelectorAll('ul[data-type="taskList"] li').forEach((li) => {
        const input = li.querySelector('input[type="checkbox"]')
        if (!input) return
        const isChecked = li.getAttribute('data-checked') === 'true'
        const span = document.createElement('span')
        span.textContent = isChecked ? '☑' : '☐'
        span.style.cssText = 'font-size:0.9em;margin-right:0.35em;'
        input.replaceWith(span)
        const label = li.querySelector('label')
        if (label) label.remove()
      })

      const html = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="utf-8">
          <title>${noteTitle.value}</title>
          <style>
            @page { size: A4; margin: 20mm 18mm; }
            * { box-sizing: border-box; }
            html { font-size: 16px; }
            body {
              font-family: "Microsoft YaHei", "SimSun", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              font-size: 1rem; line-height: 1.7; color: #1f2937;
              padding: 0; margin: 0 auto; max-width: 100%;
            }
            h1 { font-size: 2rem; font-weight: 700; margin: 0 0 1.5rem; line-height: 1.2; }
            p { margin: 0 0 0.5em 0; }
            h2 { font-size: 1.6rem; font-weight: 700; margin: 2.5rem 0 1rem; line-height: 1.1; }
            h3 { font-size: 1.3rem; font-weight: 700; margin: 2rem 0 0.75rem; line-height: 1.1; }
            h4, h5, h6 { font-size: 1rem; font-weight: 700; margin: 2rem 0 0.75rem; line-height: 1.1; }
            table { border-collapse: collapse; width: 100%; margin: 1.5rem 0; }
            td, th { border: 1px solid #d1d5db; padding: 6px 10px; vertical-align: top; }
            th { background: #f3f4f6; font-weight: 600; text-align: left; }
            blockquote { border-left: 3px solid #cfd8e3; color: #475569; margin: 0.75rem 0; padding: 0.35rem 0 0.35rem 0.85rem; }
            img { max-width: 100%; height: auto; margin: 0.75rem 0; display: block; }
            pre { background: #f3f4f6; border-radius: 12px; padding: 0.9rem 1rem; overflow-x: auto; white-space: pre-wrap; margin: 0.9rem 0; }
            code { background: #f3f4f6; border-radius: 6px; padding: 0.18em 0.38em; font-size: 0.86em; font-family: "JetBrains Mono", "Fira Code", monospace; }
            pre code { background: transparent; padding: 0; font-size: 0.9rem; }
            mark { background-color: #fef9c3; border-radius: 2px; padding: 0.1em 0.15em; }
            s { text-decoration: line-through; }
            u { text-decoration: underline; }
            hr { border: none; border-top: 2px solid #dbe5ef; margin: 1.25rem 0; }
            a { color: #059669; text-decoration: underline; }
            ul, ol { padding-left: 1.5rem; margin: 0.75rem 0; }
            ul { list-style: disc; }
            ol { list-style: decimal; }
            li { margin: 0.25rem 0; }
            ul[data-type="taskList"] { list-style: none; padding-left: 0; margin-left: 0; }
            ul[data-type="taskList"] li { display: flex; align-items: baseline; }
            .details { border: 1px solid #dbe5ef; border-radius: 0.5rem; padding: 0.5rem; margin: 1.5rem 0; }
            .details > button { display: none; }
            .details summary { font-weight: 700; }
            .file-card a[data-kind="FILE"] {
              display: block; padding: 12px 14px; margin: 10px 0;
              border: 1px solid #dbe5ef; border-radius: 12px; color: #1f2937; text-decoration: none;
            }
            .file-card a[data-kind="FILE"] strong { display: inline-block; margin-bottom: 2px; font-size: 0.88rem; color: #4b5563; }
            h1, h2, h3, h4, h5, h6, blockquote, pre, table, img, .details { page-break-inside: avoid; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1>${noteTitle.value}</h1>
          ${tempDiv.innerHTML}
        </body>
        </html>`

      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;left:-9999px;width:0;height:0;border:0;'
      iframe.srcdoc = html
      document.body.appendChild(iframe)

      iframe.addEventListener('load', () => {
        iframe.contentWindow!.addEventListener('afterprint', () => iframe.remove())
        iframe.contentWindow!.print()
      })
    } catch {
      ElMessage.error('PDF导出失败')
    }
  }

  async function exportDocx() {
    try {
      const zip = new JSZip()

      // [Content_Types].xml
      zip.file(
        '[Content_Types].xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="html" ContentType="text/html"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
      )

      // _rels/.rels
      zip.folder('_rels')!.file(
        '.rels',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
      )

      // word/_rels/document.xml.rels
      zip
        .folder('word')!
        .folder('_rels')!
        .file(
          'document.xml.rels',
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="htmlChunk" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk" Target="chunk.html"/>
</Relationships>`,
        )

      // word/document.xml
      zip.folder('word')!.file(
        'document.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
            xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
            xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:w10="urn:schemas-microsoft-com:office:word"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:body>
    <w:altChunk r:id="htmlChunk"/>
  </w:body>
</w:document>`,
      )

      // word/chunk.html
      const chunkHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${noteTitle.value}</title>
  <style>
    html { font-size: 16px; }
    body {
      font-family: 'Microsoft YaHei', 'SimSun', sans-serif;
      font-size: 1rem; line-height: 1; color: #1f2937;
      padding: 20px; max-width: 100%;
    }
    p { margin: 0 0 0.5em 0; line-height: 1; }
    h1 { font-size: 2rem; font-weight: 700; margin: 3rem 0 1.5rem; line-height: 1; }
    h2 { font-size: 1.6rem; font-weight: 700; margin: 3rem 0 1rem; line-height: 1; }
    h3 { font-size: 1.3rem; font-weight: 500; margin: 2.5rem 0 1rem; line-height: 1; }
    h4, h5, h6 { font-size: 1rem; margin: 2.5rem 0 1rem; line-height: 1; }
    table { border-collapse: collapse; width: 100%; margin: 1.5rem 0; }
    td, th { border: 1px solid #d1d5db; padding: 6px 10px; vertical-align: top; font-size: 1rem; line-height: 1; }
    th { background: #f3f4f6; font-weight: 600; text-align: left; }
    blockquote { border-left: 3px solid #d1d5db; color: #6b7280; margin: 0.75rem 0; padding: 0.35rem 0 0.35rem 0.85rem; line-height: 1; }
    img { max-width: 100%; height: auto; margin: 0.75rem 0; display: block; }
    pre { background: #f3f4f6; border-radius: 12px; padding: 0.9rem 1rem; overflow-x: auto; white-space: pre-wrap; margin: 0.9rem 0; line-height: 1; }
    code { background: #f3f4f6; border-radius: 6px; padding: 0.18em 0.38em; font-size: 0.86em; font-family: 'JetBrains Mono', 'Fira Code', monospace; }
    pre code { background: transparent; padding: 0; font-size: 0.9rem; }
    ul, ol { padding-left: 1.5rem; margin: 0.75rem 0; line-height: 1; }
    li { margin: 0.25rem 0; }
    hr { border: none; border-top: 2px solid #dbe5ef; margin: 1.25rem 0; }
    a { color: #059669; }
  </style>
</head>
<body>
  <h1>${noteTitle.value}</h1>
  ${noteContent.value}
</body>
</html>`

      zip.folder('word')!.file('chunk.html', chunkHtml)

      const blob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(blob, getSafeFileName(noteTitle.value, 'docx'))
      ElMessage.success('DOCX导出成功')
    } catch {
      ElMessage.error('DOCX导出失败')
    }
  }

  return { exportMarkdown, exportPdf, exportDocx, setEditor }
}
