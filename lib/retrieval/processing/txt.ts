import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."

export const processTxt = async (txt: Blob): Promise<FileItemChunk[]> => {
  const fileBuffer = Buffer.from(await txt.arrayBuffer())
  const textDecoder = new TextDecoder("utf-8")
  const textContent = textDecoder.decode(fileBuffer)

  const splitter = new RecursiveCharacterTextSplitter({
    separators: ["。", ". "],
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP
  })
  const splitDocs = await splitter.createDocuments([textContent])

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
