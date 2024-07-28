import { ChatbotUIContext } from "@/context/context"
import { getFileFromStorage } from "@/db/storage/files"
import useHotkey from "@/lib/hooks/use-hotkey"
import { cn } from "@/lib/utils"
import { ChatFile, MessageImage } from "@/types"
import {
  IconCircleFilled,
  IconFileFilled,
  IconFileTypeCsv,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFileTypeTxt,
  IconJson,
  IconLoader2,
  IconMarkdown,
  IconX,
  IconCirclePlus
} from "@tabler/icons-react"
import Image from "next/image"
import { FC, useContext, useState, useRef, useEffect } from "react"
//import {Button} from "../ui/button"
import { FilePreview } from "../ui/file-preview"
import { WithTooltip } from "../ui/with-tooltip"
//import {ChatRetrievalSettings} from "./chat-retrieval-settings"
import { useSelectFileHandler } from "./chat-hooks/use-select-file-handler"
import { Input } from "../ui/input"

interface ChatFilesDisplayProps {}

export const ChatFilesDisplay: FC<ChatFilesDisplayProps> = ({}) => {
  useHotkey("f", () => setShowFilesDisplay(prev => !prev))
  useHotkey("e", () => setUseRetrieval(prev => !prev))

  const {
    files,
    newMessageImages,
    setNewMessageImages,
    newMessageFiles,
    setNewMessageFiles,
    setShowFilesDisplay,
    showFilesDisplay,
    chatFiles,
    chatImages,
    setChatImages,
    setChatFiles,
    setUseRetrieval,
    selectedChat
  } = useContext(ChatbotUIContext)

  useEffect(() => {
    setNewMessageFiles([])
    setNewMessageImages([])
  }, [selectedChat])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { filesToAccept, handleSelectDeviceFile } = useSelectFileHandler()
  const [selectedFile, setSelectedFile] = useState<ChatFile | null>(null)
  const [selectedImage, setSelectedImage] = useState<MessageImage | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const messageImages = [
    ...newMessageImages.filter(
      image =>
        !chatImages.some(chatImage => chatImage.messageId === image.messageId)
    )
  ]

  const combinedChatFiles = [
    ...newMessageFiles.filter(
      file => !chatFiles.some(chatFile => chatFile.id === file.id)
    ),
    ...chatFiles
  ]

  const combinedMessageFiles = [...messageImages, ...combinedChatFiles]

  const getLinkAndView = async (file: ChatFile) => {
    const fileRecord = files.find(f => f.id === file.id)

    if (!fileRecord) return

    const link = await getFileFromStorage(fileRecord.file_path)
    window.open(link, "_blank")
  }

  return (
    <>
      {showPreview && selectedImage && (
        <FilePreview
          type="image"
          item={selectedImage}
          isOpen={showPreview}
          onOpenChange={(isOpen: boolean) => {
            setShowPreview(isOpen)
            setSelectedImage(null)
          }}
        />
      )}

      {showPreview && selectedFile && (
        <FilePreview
          type="file"
          item={selectedFile}
          isOpen={showPreview}
          onOpenChange={(isOpen: boolean) => {
            setShowPreview(isOpen)
            setSelectedFile(null)
          }}
        />
      )}
      <div className="relative max-w-md flex-col gap-2 pr-4 pt-4 pl-4 bg-muted">
        <h2 className="mt-2 mb-8 font-bold text-lg">参照中のファイル</h2>
        {messageImages.map((image, index) => (
          <div
            key={index}
            className="relative flex cursor-pointer items-center space-x-4 rounded-xl hover:opacity-50"
          >
            <Image
              className="rounded"
              // Force the image to be 56px by 56px
              style={{
                minWidth: "56px",
                minHeight: "56px",
                maxHeight: "56px",
                maxWidth: "56px"
              }}
              src={image.base64} // Preview images will always be base64
              alt="File image"
              width={56}
              height={56}
              onClick={() => {
                setSelectedImage(image)
                setShowPreview(true)
              }}
            />

            <IconX
              className="bg-muted-foreground border-primary absolute right-[-6px] top-[-2px] flex size-5 cursor-pointer items-center justify-center rounded-full border-DEFAULT text-[10px] hover:border-red-500 hover:bg-white hover:text-red-500"
              onClick={e => {
                e.stopPropagation()
                setNewMessageImages(
                  newMessageImages.filter(f => f.messageId !== image.messageId)
                )
                setChatImages(
                  chatImages.filter(f => f.messageId !== image.messageId)
                )
              }}
            />
          </div>
        ))}

        {combinedChatFiles.map((file, index) =>
          file.id === file.name ? (
            <div
              key={index}
              className="relative flex items-center space-x-4 rounded-xl border-2 px-3 py-2 mb-3 max-w-72"
            >
              <div className="p-1">
                <IconLoader2 className="animate-spin" />
              </div>

              <div className="truncate text-sm">
                <div className="truncate">{file.name}</div>
                <div className="truncate opacity-50">{file.type}</div>
              </div>
            </div>
          ) : (
            <div
              key={file.id}
              className="relative flex cursor-pointer items-center space-x-4 rounded-xl border-2 px-3 py-2 mb-3 hover:opacity-50 max-w-72"
              onClick={() => getLinkAndView(file)}
            >
              <div className="p-1">
                {(() => {
                  let fileExtension = file.type.includes("/")
                    ? file.type.split("/")[1]
                    : file.type

                  switch (fileExtension) {
                    case "pdf":
                      return <IconFileTypePdf />
                    case "markdown":
                      return <IconMarkdown />
                    case "txt":
                      return <IconFileTypeTxt />
                    case "json":
                      return <IconJson />
                    case "csv":
                      return <IconFileTypeCsv />
                    case "docx":
                      return <IconFileTypeDocx />
                    default:
                      return <IconFileFilled />
                  }
                })()}
              </div>

              <div className="truncate text-sm">
                <div className="truncate">{file.name}</div>
              </div>

              {/* {newMessageFiles.some(f => f.id === file.id) && ( */}
              <IconX
                className="bg-muted-foreground border-primary absolute right-[-6px] top-[-6px] flex size-5 cursor-pointer items-center justify-center rounded-full border-DEFAULT text-[10px] hover:border-red-500 hover:bg-white hover:text-red-500"
                onClick={e => {
                  e.stopPropagation()
                  setNewMessageFiles(
                    newMessageFiles.filter(f => f.id !== file.id)
                  )
                  setChatFiles(chatFiles.filter(f => f.id !== file.id))
                }}
              />
              {/* )} 一旦GPTsでファイル登録する場合までコメントアウトしとく */}
            </div>
          )
        )}
        <div
          className="bg-primary relative flex cursor-pointer items-center space-x-4 rounded-xl border-2 px-4 py-3 hover:opacity-50 max-w-72"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="rounded p-1 text-white">
            <IconCirclePlus />
            {/* Hidden input to select files from device */}
            <Input
              ref={fileInputRef}
              className="hidden"
              type="file"
              onChange={e => {
                if (!e.target.files) return
                handleSelectDeviceFile(e.target.files[0])
              }}
              accept={filesToAccept.join(",")}
            />
          </div>
          <div className="truncate text-sm font-bold text-white">
            <div className="truncate">新しいファイルを追加する</div>
          </div>
        </div>
      </div>
    </>
  )
}

const RetrievalToggle = ({}) => {
  const { useRetrieval, setUseRetrieval } = useContext(ChatbotUIContext)

  return (
    <div className="flex items-center">
      <WithTooltip
        delayDuration={0}
        side="top"
        display={
          <div>
            {useRetrieval
              ? "File retrieval is enabled on the selected files for this message. Click the indicator to disable."
              : "Click the indicator to enable file retrieval for this message."}
          </div>
        }
        trigger={
          <IconCircleFilled
            className={cn(
              "p-1",
              useRetrieval ? "text-green-500" : "text-red-500",
              useRetrieval ? "hover:text-green-200" : "hover:text-red-200"
            )}
            size={24}
            onClick={e => {
              e.stopPropagation()
              setUseRetrieval(prev => !prev)
            }}
          />
        }
      />
    </div>
  )
}
