"use client"

import { Tables } from "@/supabase/types"
import { Dashboard } from "@/components/ui/dashboard"
import { ChatbotUIContext } from "@/context/context"
import {
  getAssistantWorkspacesByWorkspaceId,
  getPublicAssistants
} from "@/db/assistants"
import { getAssistantFilesByAssistantId } from "@/db/assistant-files"
import { getCollectionFilesByCollectionId } from "@/db/collection-files"
import { getChatsByWorkspaceId } from "@/db/chats"
import { getFileWorkspacesByWorkspaceId } from "@/db/files"
import { getAssistantImageFromStorage } from "@/db/storage/assistant-images"
import { getWorkspaceById } from "@/db/workspaces"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import { supabase } from "@/lib/supabase/browser-client"
import { LLMID } from "@/types"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ReactNode, useContext, useEffect, useState } from "react"
import Loading from "../loading"

interface WorkspaceLayoutProps {
  children: ReactNode
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const router = useRouter()

  const params = useParams()
  const searchParams = useSearchParams()
  const workspaceId = params.workspaceid as string

  const {
    setChatSettings,
    setAssistants,
    setChats,
    setCollections,
    setFolders,
    setFiles,
    setPresets,
    setPrompts,
    setTools,
    setModels,
    setSelectedAssistant,
    setSelectedWorkspace,
    setSelectedChat,
    setChatMessages,
    setUserInput,
    setIsGenerating,
    setFirstTokenReceived,
    setChatFiles,
    setChatImages,
    setNewMessageFiles,
    setNewMessageImages,
    setShowFilesDisplay
  } = useContext(ChatbotUIContext)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const session = (await supabase.auth.getSession()).data.session

      if (!session) {
        return router.push("/login")
      } else {
        const assistants = await fetchWorkspaceData(workspaceId)
        const defaultAssistant = assistants.find(
          a => a.name === "デフォルトチャット"
        )
        if (defaultAssistant) {
          setSelectedAssistant(defaultAssistant)
        } else {
          setSelectedAssistant(null)
        }
        // fetchAssistantImages(assistants)
      }
    })()
  }, [])

  // useEffect(() => {
  //   ;(async () => await fetchWorkspaceData(workspaceId))()

  //   setUserInput("")
  //   setChatMessages([])
  //   setSelectedChat(null)

  //   setIsGenerating(false)
  //   setFirstTokenReceived(false)

  //   setChatFiles([])
  //   setChatImages([])
  //   setNewMessageFiles([])
  //   setNewMessageImages([])
  //   setShowFilesDisplay(false)
  // }, [workspaceId])

  const fetchWorkspaceData = async (workspaceId: string) => {
    setLoading(true)

    const workspace = await getWorkspaceById(workspaceId)
    setSelectedWorkspace(workspace)

    const [assistantData, publicAssistants, chats] = await Promise.all([
      getAssistantWorkspacesByWorkspaceId(workspaceId),
      getPublicAssistants(),
      getChatsByWorkspaceId(workspaceId)
    ])
    setAssistants([...assistantData.assistants, ...publicAssistants])
    setChats(chats)
    setCollections([])
    setFolders([])
    setFiles([])
    setPresets([])
    setPrompts([])
    setTools([])
    setModels([])

    setChatSettings({
      model: (searchParams.get("model") ||
        workspace?.default_model ||
        "gpt-4o") as LLMID,
      prompt:
        workspace?.default_prompt ||
        "あなたは多様な分野に詳しいアシスタントです。力の限りでユーザーをサポートしてください。",
      temperature: workspace?.default_temperature || 1.0,
      contextLength: workspace?.default_context_length || 128000,
      includeProfileContext: workspace?.include_profile_context || false,
      includeWorkspaceInstructions:
        workspace?.include_workspace_instructions || false,
      embeddingsProvider:
        (workspace?.embeddings_provider as "openai" | "local") || "openai",
      enabledFiles: false
    })

    setLoading(false)

    return [...assistantData.assistants, ...publicAssistants]
  }

  // const fetchAssistantImages = async (assistants: Tables<"assistants">[]) => {
  //   for (const assistant of assistants) {
  //     let url = ""

  //     if (assistant.image_path) {
  //       url = (await getAssistantImageFromStorage(assistant.image_path)) || ""
  //     }

  //     if (url) {
  //       const response = await fetch(url)
  //       const blob = await response.blob()
  //       const base64 = await convertBlobToBase64(blob)

  //       setAssistantImages(prev => [
  //         ...prev,
  //         {
  //           assistantId: assistant.id,
  //           path: assistant.image_path,
  //           base64,
  //           url
  //         }
  //       ])
  //     } else {
  //       setAssistantImages(prev => [
  //         ...prev,
  //         {
  //           assistantId: assistant.id,
  //           path: assistant.image_path,
  //           base64: "",
  //           url
  //         }
  //       ])
  //     }
  //   }
  // }

  if (loading) {
    return <Loading />
  }

  return <Dashboard>{children}</Dashboard>
}
