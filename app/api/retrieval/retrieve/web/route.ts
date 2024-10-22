import { getSearchByBing } from "@/lib/server/server-bing"

export async function POST(request: Request) {
  const json = await request.json()
  const { userInput } = json as {
    userInput: string
  }

  try {
    const chunks = await getSearchByBing(userInput)
    return new Response(JSON.stringify({ results: chunks }), {
      status: 200
    })
  } catch (error: any) {
    const errorMessage = error.error?.message || "An unexpected error occurred"
    const errorCode = error.status || 500
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
