import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { PDFLoader } from "langchain/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."

export const processPdf = async (pdf: Blob): Promise<FileItemChunk[]> => {
  const loader = new PDFLoader(pdf)
  const docs = await loader.load()
  let completeText = docs.map(doc => doc.pageContent).join(" ")

  if (!docs.some(doc => doc.pageContent !== "")) {
    completeText = "物件情報"
  }

  const splitter = new RecursiveCharacterTextSplitter({
    separators: ["。", ". "],
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP
  })
  const splitDocs = await splitter.createDocuments([completeText])

  let chunks: FileItemChunk[] = []

  for (let i = 0; i < splitDocs.length; i++) {
    const doc = splitDocs[i]

    let content = doc.pageContent

    // 先頭の「。」を取り除く
    if (content.startsWith("。")) {
      content = content.substring(1)
    } else if (content.startsWith(". ")) {
      content = content.substring(2)
    }

    chunks.push({
      content: content,
      tokens: encode(content).length
    })
  }

  return chunks
}
