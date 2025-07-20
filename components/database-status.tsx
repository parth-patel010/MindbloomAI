"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database, RefreshCw, CheckCircle, XCircle } from "lucide-react"

interface HealthStatus {
  status: string
  database: string
  timestamp: string
  error?: string
}

export default function DatabaseStatus() {
  const [status, setStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const checkHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/health")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({
        status: "error",
        database: "error",
        timestamp: new Date().toISOString(),
        error: "Failed to connect to health endpoint",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  const getStatusColor = (dbStatus: string) => {
    switch (dbStatus) {
      case "connected":
        return "bg-green-100 text-green-800"
      case "disconnected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (dbStatus: string) => {
    switch (dbStatus) {
      case "connected":
        return <CheckCircle className="h-4 w-4" />
      case "disconnected":
        return <XCircle className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="h-5 w-5 mr-2" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database:</span>
              <Badge className={getStatusColor(status.database)}>
                {getStatusIcon(status.database)}
                <span className="ml-1 capitalize">{status.database}</span>
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Status:</span>
              <Badge className={status.status === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {status.status === "ok" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <span className="ml-1 capitalize">{status.status}</span>
              </Badge>
            </div>

            {status.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{status.error}</p>
              </div>
            )}

            <div className="text-xs text-gray-500">Last checked: {new Date(status.timestamp).toLocaleString()}</div>
          </>
        )}

        <Button onClick={checkHealth} disabled={loading} variant="outline" className="w-full bg-transparent">
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Status
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
