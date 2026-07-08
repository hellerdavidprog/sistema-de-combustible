import { NextResponse } from "next/server"

// This endpoint is no longer needed with Better Auth
export async function POST(request: Request) {
  try {
    return NextResponse.json({ error: "Deprecated endpoint" }, { status: 410 })
  } catch (error) {
    console.error("[v0] Error in deprecated endpoint:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
