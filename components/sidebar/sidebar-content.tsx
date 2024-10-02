import { Tables } from "@/supabase/types"
import { ContentType, DataListType } from "@/types"
import {
  FC
  //useState
} from "react"
import { SidebarCreateButtons } from "./sidebar-create-buttons"
import { SidebarDataList } from "./sidebar-data-list"

interface SidebarContentProps {
  contentType: ContentType
  data: DataListType
  folders: Tables<"folders">[]
}

export const SidebarContent: FC<SidebarContentProps> = ({
  contentType,
  data,
  folders
}) => {
  return (
    // Subtract 50px for the height of the workspace settings
    <div className="flex max-h-[calc(100%-50px)] grow flex-col">
      <div className="mt-2 flex items-center">
        <SidebarCreateButtons
          contentType={contentType}
          hasData={data.length > 0}
        />
      </div>
      <SidebarDataList
        contentType={contentType}
        data={data}
        folders={folders}
      />
    </div>
  )
}
