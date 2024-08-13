import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { Tables } from "@/supabase/types"
import { IconCircleCheckFilled, IconRobotFace } from "@tabler/icons-react"
import Image from "next/image"
import { FC, useState, useEffect } from "react"
import { ModelIcon } from "../models/model-icon"
import { DropdownMenuItem } from "../ui/dropdown-menu"
import { getAssistantImageFromStorage } from "@/db/storage/assistant-images"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"

interface QuickSettingOptionProps {
  contentType: "presets" | "assistants"
  isSelected: boolean
  item: Tables<"presets"> | Tables<"assistants">
  onSelect: () => void
}

export const QuickSettingOption: FC<QuickSettingOptionProps> = ({
  contentType,
  isSelected,
  item,
  onSelect
}) => {
  const [imageBase, setImageBase] = useState("")

  const fetchAssistantImage = async () => {
    if (contentType === "assistants") {
      const assistant = item as Tables<"assistants">
      const url =
        (await getAssistantImageFromStorage(assistant.image_path)) || ""
      if (url) {
        const response = await fetch(url)
        const blob = await response.blob()
        const base64 = await convertBlobToBase64(blob)
        setImageBase(base64)
      }
    } else {
      setImageBase("")
    }
  }

  useEffect(() => {
    fetchAssistantImage()
  }, [])
  const modelDetails = LLM_LIST.find(model => model.modelId === item.model)

  return (
    <DropdownMenuItem
      tabIndex={0}
      className="cursor-pointer items-center"
      onSelect={onSelect}
    >
      <div className="w-[32px]">
        {contentType === "presets" ? (
          <ModelIcon
            provider={modelDetails?.provider || "custom"}
            width={32}
            height={32}
          />
        ) : imageBase ? (
          <Image
            style={{ width: "32px", height: "32px" }}
            className="rounded"
            src={imageBase}
            alt="Assistant"
            width={32}
            height={32}
            loading="lazy"
          />
        ) : (
          <IconRobotFace
            className="bg-primary text-secondary border-primary rounded border-DEFAULT p-1"
            size={32}
          />
        )}
      </div>

      <div className="ml-4 flex grow flex-col space-y-1">
        <div className="text-md font-bold">{item.name}</div>

        {item.description && (
          <div className="text-sm font-light">{item.description}</div>
        )}
      </div>

      <div className="min-w-[40px]">
        {isSelected ? (
          <IconCircleCheckFilled className="ml-4" size={20} />
        ) : null}
      </div>
    </DropdownMenuItem>
  )
}
