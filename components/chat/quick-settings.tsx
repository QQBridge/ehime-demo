import { AssistantImageContext, ChatbotUIContext } from "@/context/context"
import { getAssistantFilesByAssistantId } from "@/db/assistant-files"
import { getAssistantToolsByAssistantId } from "@/db/assistant-tools"
import { getCollectionFilesByCollectionId } from "@/db/collection-files"
import { getAssistantImageFromStorage } from "@/db/storage/assistant-images"
import useHotkey from "@/lib/hooks/use-hotkey"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import { Tables } from "@/supabase/types"
import { AssistantImage, LLMID } from "@/types"
import { IconChevronDown, IconRobotFace } from "@tabler/icons-react"
import Image from "next/image"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ModelIcon } from "../models/model-icon"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "../ui/dropdown-menu"
import { Input } from "../ui/input"
import { QuickSettingOption } from "./quick-setting-option"
import { useRouter } from "next/navigation"
import { useChatHandler } from "./chat-hooks/use-chat-handler"

interface QuickSettingsProps {}

export const QuickSettings: FC<QuickSettingsProps> = ({}) => {
  const { t } = useTranslation()

  useHotkey("p", () => setIsOpen(prevState => !prevState))

  const {
    chats,
    presets,
    assistants,
    selectedAssistant,
    selectedPreset,
    chatSettings,
    setSelectedPreset,
    setSelectedAssistant,
    setChatSettings,
    setChatFiles,
    setSelectedTools,
    setShowFilesDisplay,
    selectedWorkspace
  } = useContext(ChatbotUIContext)

  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [imageBase, setImageBase] = useState("")

  const { handleNewChat } = useChatHandler()

  useEffect(() => {
    fetchAssistantImage()
  }, [selectedAssistant])

  const fetchAssistantImage = async () => {
    if (selectedAssistant) {
      const url =
        (await getAssistantImageFromStorage(selectedAssistant.image_path)) || ""
      if (url) {
        const response = await fetch(url)
        const blob = await response.blob()
        const base64 = await convertBlobToBase64(blob)
        setImageBase(base64)
      }
    }
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100) // FIX: hacky
    }
  }, [isOpen])

  const handleSelectQuickSetting = async (
    item: Tables<"presets"> | Tables<"assistants"> | null,
    contentType: "presets" | "assistants" | "remove"
  ) => {
    if (contentType === "assistants" && item) {
      const assistant = item as Tables<"assistants">
      setSelectedAssistant(assistant)
      setLoading(true)
      const assistantTools = (
        await getAssistantToolsByAssistantId(assistant.id)
      ).tools
      setSelectedTools(assistantTools)
      setLoading(false)
      setSelectedPreset(null)
      setChatSettings({
        model: assistant.model as LLMID,
        prompt: assistant.prompt,
        temperature: assistant.temperature,
        contextLength: assistant.context_length,
        includeProfileContext: assistant.include_profile_context,
        includeWorkspaceInstructions: assistant.include_workspace_instructions,
        embeddingsProvider: assistant.embeddings_provider as "openai" | "local",
        enabledFiles: assistant.enabled_files
      })

      const assistantChats = chats.filter(
        chat => chat.assistant_id == assistant.id
      )
      if (assistantChats.length === 0) {
        console.log(assistant)
        await handleNewChat(assistant)
      } else {
        return router.push(
          `/${selectedWorkspace!.id}/chat/${assistantChats[0].id}`
        )
      }
    } else if (contentType === "presets" && item) {
      setSelectedPreset(item as Tables<"presets">)
      setSelectedAssistant(null)
      setChatFiles([])
      setSelectedTools([])
      setChatSettings({
        model: item.model as LLMID,
        prompt: item.prompt,
        temperature: item.temperature,
        contextLength: item.context_length,
        includeProfileContext: item.include_profile_context,
        includeWorkspaceInstructions: item.include_workspace_instructions,
        embeddingsProvider: item.embeddings_provider as "openai" | "local",
        enabledFiles: false
      })
    } else {
      setSelectedPreset(null)
      setSelectedAssistant(null)
      setChatFiles([])
      setSelectedTools([])
      if (selectedWorkspace) {
        setChatSettings({
          model: selectedWorkspace.default_model as LLMID,
          prompt: selectedWorkspace.default_prompt,
          temperature: selectedWorkspace.default_temperature,
          contextLength: selectedWorkspace.default_context_length,
          includeProfileContext: selectedWorkspace.include_profile_context,
          includeWorkspaceInstructions:
            selectedWorkspace.include_workspace_instructions,
          embeddingsProvider: selectedWorkspace.embeddings_provider as
            | "openai"
            | "local",
          enabledFiles: true
        })
      }
      return
    }
  }

  const checkIfModified = () => {
    if (!chatSettings) return false

    if (selectedPreset) {
      return (
        selectedPreset.include_profile_context !==
          chatSettings?.includeProfileContext ||
        selectedPreset.include_workspace_instructions !==
          chatSettings.includeWorkspaceInstructions ||
        selectedPreset.context_length !== chatSettings.contextLength ||
        selectedPreset.model !== chatSettings.model ||
        selectedPreset.prompt !== chatSettings.prompt ||
        selectedPreset.temperature !== chatSettings.temperature
      )
    } else if (selectedAssistant) {
      return (
        selectedAssistant.include_profile_context !==
          chatSettings.includeProfileContext ||
        selectedAssistant.include_workspace_instructions !==
          chatSettings.includeWorkspaceInstructions ||
        selectedAssistant.context_length !== chatSettings.contextLength ||
        selectedAssistant.model !== chatSettings.model ||
        selectedAssistant.prompt !== chatSettings.prompt ||
        selectedAssistant.temperature !== chatSettings.temperature
      )
    }

    return false
  }

  const isModified = checkIfModified()

  const items = [
    ...presets.map(preset => ({ ...preset, contentType: "presets" })),
    ...assistants.map(assistant => ({
      ...assistant,
      contentType: "assistants"
    }))
  ]
  const uniqueItems = Array.from(new Set(items.map(item => item.id))).map(
    id => {
      return items.find(item => item.id === id)!
    }
  )

  const modelDetails = LLM_LIST.find(
    model => model.modelId === selectedPreset?.model
  )

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={isOpen => {
        setIsOpen(isOpen)
        setSearch("")
      }}
    >
      <DropdownMenuTrigger asChild className="max-w-[400px]" disabled={loading}>
        <Button
          variant="ghost"
          className="text-md flex justify-start space-x-3 border border-black"
        >
          {selectedAssistant &&
            (imageBase ? (
              <Image
                className="rounded"
                src={imageBase}
                alt="Assistant"
                width={28}
                height={28}
                loading="lazy"
              />
            ) : (
              <IconRobotFace
                className="bg-primary text-secondary border-primary rounded border-DEFAULT p-1"
                size={28}
              />
            ))}
          {loading ? (
            <div className="animate-pulse">カスタムAIをロード中...</div>
          ) : (
            <div className="flex justify-between w-10/12 max-w-48">
              <div className="overflow-hidden text-ellipsis">
                {selectedPreset?.name ||
                  selectedAssistant?.name ||
                  t("カスタムAIを選択する")}
              </div>

              <IconChevronDown className="ml-1" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="min-w-[300px] max-w-[500px] space-y-4"
        align="start"
      >
        {presets.length === 0 && assistants.length === 0 ? (
          <div className="p-8 text-center">AIが登録されていません。</div>
        ) : (
          <>
            <Input
              ref={inputRef}
              className="w-full"
              placeholder="AIを検索"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.stopPropagation()}
            />

            {!!(selectedPreset || selectedAssistant) && (
              <QuickSettingOption
                contentType={selectedPreset ? "presets" : "assistants"}
                isSelected={true}
                item={
                  selectedPreset ||
                  (selectedAssistant as
                    | Tables<"presets">
                    | Tables<"assistants">)
                }
                onSelect={() => {
                  handleSelectQuickSetting(null, "remove")
                }}
              />
            )}

            {uniqueItems
              .filter(
                item =>
                  item.name.toLowerCase().includes(search.toLowerCase()) &&
                  item.id !== selectedPreset?.id &&
                  item.id !== selectedAssistant?.id
              )
              .map(({ contentType, ...item }) => (
                <QuickSettingOption
                  key={item.id}
                  contentType={contentType as "presets" | "assistants"}
                  isSelected={false}
                  item={item}
                  onSelect={() =>
                    handleSelectQuickSetting(
                      item,
                      contentType as "presets" | "assistants"
                    )
                  }
                />
              ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
