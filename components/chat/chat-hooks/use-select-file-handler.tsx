import { ChatbotUIContext } from "@/context/context"
import { createDocXFile, createFile } from "@/db/files"
import { createChatFile } from "@/db/chat-files"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import mammoth from "mammoth"
import { useContext, useEffect, useState } from "react"
import { toast } from "sonner"

export const ACCEPTED_FILE_TYPES = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/json",
  "text/markdown",
  "application/pdf",
  "text/plain"
]

export const useSelectFileHandler = () => {
  const {
    selectedWorkspace,
    profile,
    selectedChat,
    chatSettings,
    setNewMessageImages,
    setNewMessageFiles,
    setShowFilesDisplay,
    setFiles,
    setChatFiles,
    setUseRetrieval
  } = useContext(ChatbotUIContext)

  const [filesToAccept, setFilesToAccept] = useState(ACCEPTED_FILE_TYPES)

  useEffect(() => {
    handleFilesToAccept()
  }, [chatSettings?.model])

  const handleFilesToAccept = () => {
    const model = chatSettings?.model
    const FULL_MODEL = LLM_LIST.find(llm => llm.modelId === model)

    if (!FULL_MODEL) return

    setFilesToAccept(
      FULL_MODEL.imageInput
        ? [...ACCEPTED_FILE_TYPES, "image/png", "image/jpeg"]
        : ACCEPTED_FILE_TYPES
    )
  }

  const handleSelectDeviceFiles = async (filelist: FileList | File[]) => {
    const files = Array.from(filelist)
    if (!profile || !selectedWorkspace || !chatSettings) return

    setShowFilesDisplay(true)
    setUseRetrieval(true)

    if (files.length > 0) {
      files.forEach(async file => {
        let simplifiedFileType = file.type.split("/")[1]

        let reader = new FileReader()

        if (file.type.includes("image")) {
          reader.readAsDataURL(file)
        } else if (ACCEPTED_FILE_TYPES.includes(file.type)) {
          if (simplifiedFileType.includes("vnd.adobe.pdf")) {
            simplifiedFileType = "pdf"
          } else if (simplifiedFileType.includes("docx")) {
            simplifiedFileType = "docx"
          }

          setNewMessageFiles(prev => [
            ...prev,
            {
              id: file.name,
              name: file.name,
              type: simplifiedFileType,
              file: file
            }
          ])

          // Handle docx files
          if (file.type.includes("docx")) {
            const arrayBuffer = await file.arrayBuffer()
            const result = await mammoth.extractRawText({
              arrayBuffer
            })

            const createdFile = await createDocXFile(
              result.value,
              file,
              {
                user_id: profile.user_id,
                description: "",
                file_path: "",
                name: file.name,
                size: file.size,
                tokens: 0,
                type: simplifiedFileType
              },
              selectedWorkspace.id,
              chatSettings.embeddingsProvider
            )

            setFiles(prev => [...prev, createdFile])

            setNewMessageFiles(prev =>
              prev.map(item =>
                item.id === file.name
                  ? {
                      id: createdFile.id,
                      name: createdFile.name,
                      type: createdFile.type,
                      file: file
                    }
                  : item
              )
            )

            await createChatFile({
              user_id: profile.user_id,
              chat_id: selectedChat!.id,
              file_id: createdFile.id
            })

            reader.onloadend = null

            return
          } else {
            // Use readAsArrayBuffer for PDFs and readAsText for other types
            file.type.includes("pdf")
              ? reader.readAsArrayBuffer(file)
              : reader.readAsText(file)
          }
        } else {
          //throw new Error("Unsupported file type")
        }

        reader.onloadend = async function () {
          try {
            if (file.type.includes("image")) {
              // Create a temp url for the image file
              const imageUrl = URL.createObjectURL(file)

              // This is a temporary image for display purposes in the chat input
              setNewMessageImages(prev => [
                ...prev,
                {
                  messageId: "temp",
                  path: "",
                  base64: reader.result, // base64 image
                  url: imageUrl,
                  file
                }
              ])
            } else {
              const createdFile = await createFile(
                file,
                {
                  user_id: profile.user_id,
                  description: "",
                  file_path: "",
                  name: file.name,
                  size: file.size,
                  tokens: 0,
                  type: simplifiedFileType
                },
                selectedWorkspace.id,
                chatSettings.embeddingsProvider
              )

              setFiles(prev => [...prev, createdFile])

              setNewMessageFiles(prev =>
                prev.map(item =>
                  item.id === file.name
                    ? {
                        id: createdFile.id,
                        name: createdFile.name,
                        type: createdFile.type,
                        file: file
                      }
                    : item
                )
              )

              await createChatFile({
                user_id: profile.user_id,
                chat_id: selectedChat!.id,
                file_id: createdFile.id
              })
            }
          } catch (error: any) {
            toast.error("Failed to upload. " + error?.message, {
              duration: 10000
            })
            setNewMessageImages(prev =>
              prev.filter(img => img.messageId !== "temp")
            )
            setNewMessageFiles(prev =>
              prev.filter(file => file.id !== file.name)
            )
          }
        }
      })
    }
  }

  return {
    handleSelectDeviceFiles,
    filesToAccept
  }
}
