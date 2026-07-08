import { NextResponse } from "next/server"

// This endpoint is deprecated - use Better Auth instead
export async function POST(request: Request) {
  try {
    return NextResponse.json({ error: "Deprecated endpoint - use Better Auth" }, { status: 410 })
  } catch (error) {
    console.error("[v0] Error in deprecated bootstrap endpoint:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
