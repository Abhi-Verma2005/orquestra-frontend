// File processing types removed - using simple chunking only
export interface CSVRow {
  [key: string]: string | number | boolean
}

export interface DocumentChunk {
  text: string
  index: number
  metadata: {
    documentId: string
    documentName: string
    userId: string
    chunkIndex: number
    chunkType: string
    totalChunks: number
    [key: string]: any
  }
}

export class DocumentChunking {
  chunkDocument(
    content: string,
    documentId: string,
    documentName: string,
    userId: string,
    chunkSize: number = 1000,
    overlap: number = 200
  ): DocumentChunk[] {
    // Default paragraph-based chunking for all documents
    return this.chunkDefault(content, documentId, documentName, userId, chunkSize, overlap)
  }

  private chunkDefault(
    content: string,
    documentId: string,
    documentName: string,
    userId: string,
    chunkSize: number,
    overlap: number
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    let chunkIndex = 0
    
    // Split by paragraphs (double newlines)
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim())
    let currentChunk = ''
    
    for (const paragraph of paragraphs) {
      const trimmedPara = paragraph.trim()
      
      // Check if adding this paragraph would exceed chunk size
      if ((currentChunk + '\n\n' + trimmedPara).length > chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          text: currentChunk.trim(),
          index: chunkIndex,
          metadata: {
            documentId,
            documentName,
            userId,
            chunkIndex,
            chunkType: 'paragraph',
            totalChunks: 0
          }
        })
        
        // Create overlap: take last ~200 chars from current chunk
        const overlapText = currentChunk.slice(-overlap).trim()
        currentChunk = overlapText + '\n\n' + trimmedPara
        chunkIndex++
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara
      }
    }
    
    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex,
        metadata: {
          documentId,
          documentName,
          userId,
          chunkIndex,
          chunkType: 'paragraph',
          totalChunks: 0
        }
      })
    }
    
    // Update total chunks count
    const totalChunks = chunks.length
    chunks.forEach(chunk => chunk.metadata.totalChunks = totalChunks)
    
    return chunks
  }
}

export const documentChunking = new DocumentChunking()
