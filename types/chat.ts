import { Tables } from "@/supabase/types"
import { ChatMessage, FileItemChunk, LLMID } from "."

export interface ChatSettings {
  model: LLMID
  prompt: string
  temperature: number
  contextLength: number
  includeProfileContext: boolean
  includeWorkspaceInstructions: boolean
  embeddingsProvider: "openai" | "local"
  enabledFiles: boolean
}

export interface ChatPayload {
  chatSettings: ChatSettings
  workspaceInstructions: string
  chatMessages: ChatMessage[]
  assistant: Tables<"assistants"> | null
  messageFileItems: Tables<"file_items">[]
  chatFileItems: Tables<"file_items">[]
  webSearchResults: FileItemChunk[]
}

export interface ChatAPIPayload {
  chatSettings: ChatSettings
  messages: Tables<"messages">[]
}
