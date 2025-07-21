import { useState, useRef, FormEvent, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, BookOpen, Sparkles, Send, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { usePlan } from "@/lib/plan-context"
// @ts-ignore: jsPDF may not have types
import jsPDF from "jspdf"

interface StudyBuddyProps {
    onBack: () => void
}

interface ChatMessage {
    role: "user" | "assistant"
    content: string
}

function parseAnswer(answer: string) {
    let text = answer.replace(/<br\s*\/?\s*>/gi, '\n')
    const lines = text.split(/\n+/)
    return lines.map((line, idx) => {
        if (!line.trim()) return null;
        const parts = []
        let lastIndex = 0
        const boldRegex = /\*\*([^*]+)\*\*|\*([^*]+)\*|<b>(.*?)<\/b>/g
        let match
        let key = 0
        while ((match = boldRegex.exec(line)) !== null) {
            if (match.index > lastIndex) {
                parts.push(line.slice(lastIndex, match.index))
            }
            parts.push(<strong key={key++}>{match[1] || match[2] || match[3]}</strong>)
            lastIndex = match.index + match[0].length
        }
        if (lastIndex < line.length) {
            parts.push(line.slice(lastIndex))
        }
        return <span key={idx} style={{ display: "block", marginBottom: 4 }}>{parts}</span>
    })
}

export default function StudyBuddy({ onBack }: StudyBuddyProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [aiTyping, setAiTyping] = useState("")
    const [thinkingTime, setThinkingTime] = useState(0)
    const { user } = useAuth()
    const { refreshPlan } = usePlan()
    const inputRef = useRef<HTMLInputElement>(null)
    const thinkingInterval = useRef<NodeJS.Timeout | null>(null)
    // Add ref for last AI message
    const lastAiRef = useRef<HTMLDivElement>(null)

    // Typing animation effect
    useEffect(() => {
        if (!loading || !aiTyping) return;
        let i = 0;
        let current = "";
        const full = aiTyping;
        setMessages(prev => {
            if (prev[prev.length - 1]?.role === "assistant") {
                return prev.slice(0, -1).concat({ role: "assistant", content: "" });
            }
            return prev;
        });
        const type = () => {
            if (i <= full.length) {
                setMessages(prev => {
                    if (prev[prev.length - 1]?.role === "assistant") {
                        return prev.slice(0, -1).concat({ role: "assistant", content: full.slice(0, i) });
                    } else {
                        return prev.concat({ role: "assistant", content: full.slice(0, i) });
                    }
                });
                i++;
                setTimeout(type, 12 + Math.random() * 30);
            }
        };
        type();
    }, [aiTyping, loading]);

    // Thinking timer
    useEffect(() => {
        if (loading) {
            setThinkingTime(0);
            thinkingInterval.current = setInterval(() => {
                setThinkingTime(t => t + 1);
            }, 1000);
        } else {
            if (thinkingInterval.current) clearInterval(thinkingInterval.current);
        }
        return () => {
            if (thinkingInterval.current) clearInterval(thinkingInterval.current);
        };
    }, [loading]);

    const handleSend = async (e: FormEvent) => {
        e.preventDefault()
        setError("")
        if (!input.trim() || !user) return
        const prompt = input.trim()
        setMessages((prev) => [...prev, { role: "user", content: prompt }])
        setInput("")
        setLoading(true)
        setAiTyping("")
        try {
            const response = await fetch("/api/study-buddy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    messages: [...messages, { role: "user", content: prompt }],
                }),
            })
            if (response.ok) {
                const data = await response.json()
                setAiTyping(data.answer)
                await refreshPlan()
            } else {
                const data = await response.json()
                setError(data.message || "Something went wrong. Please try again.")
            }
        } catch (err) {
            setError("Network error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    // Helper: Get all AI responses as plain text (markdown bold as **word**)
    const getAllAiText = () =>
        messages.filter(m => m.role === "assistant").map(m => m.content).join("\n\n")

    // Helper: Get all AI responses as formatted lines (for PDF)
    const getAllAiLines = () =>
        messages.filter(m => m.role === "assistant").map(m => m.content.replace(/<br\s*\/?\s*>/gi, '\n')).join("\n\n").split(/\n+/)

    // Copy to clipboard
    const handleCopy = () => {
        navigator.clipboard.writeText(getAllAiText())
    }

    // Download as PDF (improved: wrap long lines)
    const handleDownload = () => {
        if (typeof window === "undefined") return;
        // @ts-ignore: jsPDF may not have types
        const jsPDF = require("jspdf").jsPDF || require("jspdf");
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const aiMessages = messages.filter(m => m.role === "assistant");
        // MindBloom header/logo on first page
        doc.setFontSize(24);
        doc.setTextColor("#ea580c");
        doc.text("MindBloom", 40, 60);
        doc.setFontSize(12);
        doc.setTextColor("#000");
        let y = 100;
        const maxWidth = 500;
        aiMessages.forEach((m, i) => {
            // Convert <br> to \n, split into lines
            const lines = m.content.replace(/<br\s*\/?\s*>/gi, "\n").split("\n").map(line => line.trim()).filter(Boolean);
            lines.forEach(line => {
                if (y > 750) {
                    doc.addPage();
                    y = 60;
                    if (i === 0) {
                        doc.setFontSize(12);
                        doc.setTextColor("#000");
                    }
                }
                // Bold: **word** or <b>word</b> as bold
                const boldRegex = /\*\*([^*]+)\*\*|<b>(.*?)<\/b>/g;
                let lastIndex = 0;
                let x = 40;
                let match;
                let normalParts = [];
                let boldParts = [];
                while ((match = boldRegex.exec(line)) !== null) {
                    if (match.index > lastIndex) {
                        normalParts.push(line.slice(lastIndex, match.index));
                    }
                    boldParts.push(match[1] || match[2]);
                    lastIndex = match.index + (match[0].length);
                }
                if (lastIndex < line.length) {
                    normalParts.push(line.slice(lastIndex));
                }
                // Combine and wrap
                const allParts = [];
                for (let j = 0; j < Math.max(normalParts.length, boldParts.length); j++) {
                    if (normalParts[j]) allParts.push({ text: normalParts[j], bold: false });
                    if (boldParts[j]) allParts.push({ text: boldParts[j], bold: true });
                }
                let currentLine = "";
                allParts.forEach(part => {
                    if (part.bold) {
                        if (currentLine) {
                            doc.setFont(undefined, "normal");
                            const wrapped = doc.splitTextToSize(currentLine, maxWidth);
                            wrapped.forEach((wl: string) => {
                                doc.text(wl, x, y, { baseline: "top" });
                                y += 20;
                            });
                            currentLine = "";
                        }
                        doc.setFont(undefined, "bold");
                        const wrapped = doc.splitTextToSize(part.text, maxWidth);
                        wrapped.forEach((wl: string) => {
                            doc.text(wl, x, y, { baseline: "top" });
                            y += 20;
                        });
                        doc.setFont(undefined, "normal");
                    } else {
                        currentLine += part.text;
                    }
                });
                if (currentLine) {
                    doc.setFont(undefined, "normal");
                    const wrapped = doc.splitTextToSize(currentLine, maxWidth);
                    wrapped.forEach((wl: string) => {
                        doc.text(wl, x, y, { baseline: "top" });
                        y += 20;
                    });
                }
            });
            y += 20;
        });
        doc.save("mindbloom-study-buddy.pdf");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 p-4 sm:p-6 flex items-center justify-center">
            <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-t-lg">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <CardTitle className="ml-2 flex items-center text-lg sm:text-xl">
                            <BookOpen className="h-5 w-5 mr-2 animate-pulse" />
                            Study Buddy
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-6 flex flex-col h-[70vh]">
                    <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100 shadow-inner text-gray-700 text-base">
                                <Sparkles className="h-5 w-5 text-orange-500 mr-2 animate-pulse inline" />
                                Ask any question to your Study Buddy!<br />
                                Get real-world explanations, perfect answers, and quiz yourself with an AI-powered study companion.<br />
                                <span className="text-xs text-orange-600">Each prompt uses 2 credits.</span>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end`}>
                                <div
                                    ref={msg.role === "assistant" && idx === messages.length - 1 ? lastAiRef : undefined}
                                    className={`rounded-xl px-4 py-2 max-w-[80%] shadow ${msg.role === "user" ? "bg-yellow-100 text-right" : "bg-orange-100 border-2 border-orange-400 text-left"}`}
                                >
                                    {msg.role === "assistant" ? (
                                        <Card className="bg-orange-50 border-orange-200 shadow-md mb-4">
                                            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                                                <Sparkles className="text-orange-500 w-5 h-5" />
                                                <span className="font-bold text-orange-600 text-base">MindBloom</span>
                                            </CardHeader>
                                            <CardContent className="text-base text-gray-900 space-y-2">
                                                {/* Render AI message content here */}
                                                {parseAnswer(msg.content)}
                                                <div className="flex gap-2 mt-4">
                                                    <Button variant="outline" size="sm" onClick={handleCopy}>
                                                        Copy
                                                    </Button>
                                                    <Button variant="default" size="sm" onClick={handleDownload}>
                                                        Download PDF
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <span className="flex flex-col items-end">
                                            <span className="text-xs text-yellow-700 font-semibold mb-1">You</span>
                                            {msg.content}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex items-start">
                                <div className="flex flex-col items-start mr-2">
                                    <span className="flex items-center gap-1 text-xs text-orange-700 font-semibold mb-1">
                                        <Sparkles className="h-4 w-4 text-orange-500" /> MindBloom
                                    </span>
                                </div>
                                <div className="rounded-xl px-4 py-2 max-w-[80%] bg-orange-100 border-2 border-orange-400 flex items-center">
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin text-orange-500" />
                                    Thinking{thinkingTime > 0 && <span className="ml-1">({thinkingTime}s)</span>}...
                                </div>
                            </div>
                        )}
                    </div>
                    {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
                    <form onSubmit={handleSend} className="flex gap-2 mt-auto">
                        <Input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Type your question or say 'quiz me'..."
                            disabled={loading}
                            className="flex-1 bg-white/80 border-yellow-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl"
                        />
                        <Button type="submit" disabled={loading || !input.trim()} className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg">
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </form>
                    <Button
                        onClick={onBack}
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mt-4"
                    >
                        Back to Dashboard
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
} 