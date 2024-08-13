import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { getAssistantImageFromStorage } from "@/db/storage/assistant-images"
import { Tables } from "@/supabase/types"
import { FC, useContext, useState, useEffect } from "react"
import { Message } from "../messages/message"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"

interface ChatMessagesProps {}

export const ChatMessages: FC<ChatMessagesProps> = ({}) => {
  const { chatMessages, chatFileItems, selectedAssistant } =
    useContext(ChatbotUIContext)

  const { handleSendEdit } = useChatHandler()

  const [editingMessage, setEditingMessage] = useState<Tables<"messages">>()
  const [imageBase, setImageBase] = useState("")
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
      } else {
        setImageBase("")
      }
    } else {
      setImageBase("")
    }
  }

  return chatMessages
    .sort((a, b) => a.message.sequence_number - b.message.sequence_number)
    .map((chatMessage, index, array) => {
      const messageFileItems = chatFileItems.filter(
        (chatFileItem, _, self) =>
          chatMessage.fileItems.includes(chatFileItem.id) &&
          self.findIndex(item => item.id === chatFileItem.id) === _
      )

      return (
        <Message
          key={chatMessage.message.sequence_number}
          message={chatMessage.message}
          fileItems={messageFileItems}
          isEditing={editingMessage?.id === chatMessage.message.id}
          isLast={index === array.length - 1}
          onStartEdit={setEditingMessage}
          onCancelEdit={() => setEditingMessage(undefined)}
          onSubmitEdit={handleSendEdit}
          image={imageBase}
        />
      )
    })
}
