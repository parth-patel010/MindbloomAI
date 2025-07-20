import { NextResponse } from "next/server"
import { testDatabaseConnection } from "@/lib/database"

export async function GET() {
  try {
    const dbConnected = await testDatabaseConnection()

    return NextResponse.json({
      status: "ok",
      database: dbConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
