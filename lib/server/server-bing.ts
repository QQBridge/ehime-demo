import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import axios from "axios"
// APIキーとエンドポイントを環境変数から取得
const BING_SUBSCRIPTION_KEY = process.env.BING_SUBSCRIPTION_KEY
const BING_ENDPOINT = "https://api.bing.microsoft.com/v7.0/search"
const BING_HOSTNAME = "api.bing.microsoft.com"
const BING_PATH = "/v7.0/search"

interface SearchResult {
  snippet: string
  url: string
  siteName: string
}

interface BingSearchResponse {
  webPages: {
    value: SearchResult[]
  }
}

// Azure Bing Web Search APIを使用してウェブ検索を行う関数
const webSearch = async (query: string) => {
  try {
    const response = await axios.get<BingSearchResponse>(BING_ENDPOINT, {
      params: {
        q: query,
        count: 15
      },
      headers: {
        "Ocp-Apim-Subscription-Key": BING_SUBSCRIPTION_KEY
      }
    })

    const results = response.data.webPages.value
    return results.map(
      result =>
        `
      ページ名: ${result.siteName}
      URL: ${result.url}
      内容: ${result.snippet}
      `
    )
  } catch (error) {
    console.error("Error searching Bing:", error)
    return []
  }
}

// メイン関数
export const getSearchByBing = async (
  query: string
): Promise<FileItemChunk[]> => {
  // ウェブ検索を実行
  const searchResults = await webSearch(query)

  let chunks: FileItemChunk[] = []

  for (let i = 0; i < searchResults.length; i++) {
    const result = searchResults[i]

    chunks.push({
      content: result,
      tokens: encode(result).length
    })
  }

  return chunks
}
