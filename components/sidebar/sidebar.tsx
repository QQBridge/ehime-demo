import { ChatbotUIContext } from "@/context/context"
import { Tables } from "@/supabase/types"
import { ContentType } from "@/types"
import { FC, useContext } from "react"
import { SIDEBAR_WIDTH } from "../ui/dashboard"
import { TabsContent } from "../ui/tabs"
import { Button } from "../ui/button"
import { IconLogout } from "@tabler/icons-react"
import { SidebarContent } from "./sidebar-content"
import { QuickSettings } from "../chat/quick-settings"
import { supabase } from "@/lib/supabase/browser-client"
import { useRouter } from "next/navigation"

interface SidebarProps {
  contentType: ContentType
  showSidebar: boolean
}

export const Sidebar: FC<SidebarProps> = ({ contentType, showSidebar }) => {
  const router = useRouter()
  const { folders, chats } = useContext(ChatbotUIContext)

  const chatFolders = folders.filter(folder => folder.type === "chats")

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
    return
  }

  const renderSidebarContent = (
    contentType: ContentType,
    data: any[],
    folders: Tables<"folders">[]
  ) => {
    return (
      <SidebarContent contentType={contentType} data={data} folders={folders} />
    )
  }

  return (
    <TabsContent
      className="m-0 w-full space-y-2"
      style={{
        // Sidebar - SidebarSwitcher
        minWidth: showSidebar ? SIDEBAR_WIDTH : "0px",
        maxWidth: showSidebar ? SIDEBAR_WIDTH : "0px",
        width: showSidebar ? SIDEBAR_WIDTH : "0px"
      }}
      value={contentType}
    >
      <div className="flex h-full flex-col p-3">
        {
          //<div className="flex items-center border-b-2 pb-2">
          //  <WorkspaceSwitcher />
          //  <WorkspaceSettings />
          //</div>
        }
        <QuickSettings />

        {(() => {
          switch (contentType) {
            case "chats":
              return renderSidebarContent("chats", chats, chatFolders)
            default:
              return null
          }
        })()}
        <Button
          tabIndex={-1}
          className="text cursor-pointer h-11 max-w-56 justify-between mb-4"
          size="sm"
          onClick={handleSignOut}
        >
          ログアウト
          <IconLogout className="mr-1" size={20} />
        </Button>
      </div>
    </TabsContent>
  )
}
