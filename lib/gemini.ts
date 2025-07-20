import { GoogleGenerativeAI } from "@google/generative-ai"

function looksLikeApiKey(value: string | undefined) {
  return !!value && value.startsWith("AIza") && value.length > 30
}

const DEFAULT_MODEL = !looksLikeApiKey(process.env.GEMINI_MODEL)
  ? process.env.GEMINI_MODEL || "gemini-1.5-flash"
  : (() => {
      console.warn(
        "[Gemini] GEMINI_MODEL env-var appears to be an API key, ignoring it. " +
          "Set GEMINI_MODEL to a valid model name like 'gemini-1.5-pro-latest'.",
      )
      return "gemini-1.5-flash"
    })()

if (!process.env.GEMINI_API_KEY || looksLikeApiKey(DEFAULT_MODEL)) {
  throw new Error("GEMINI_API_KEY is missing or GEMINI_MODEL is misconfigured. " + "Verify your environment variables.")
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

async function safeGenerate(modelPrompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL })
    const result = await model.generateContent(modelPrompt)
    return result.response.text()
  } catch (err) {
    console.error("Gemini generateContent failed:", err)
    throw new Error(err instanceof Error ? err.message : "Unknown Gemini error")
  }
}

export async function generateMoodAdvice(mood: number, notes: string) {
  const prompt = `As a supportive AI counselor, provide encouraging advice for a student with mood level ${mood}/5 (1=very sad, 5=very happy) who shared: "${notes}". 

Format your response with:
- Start with a warm, empathetic acknowledgment using appropriate emojis
- Provide 3 specific, actionable coping strategies with emojis
- End with encouraging words and supportive emojis
- Use emojis throughout to make it visually appealing and friendly
- Keep response under 200 words and be very empathetic and supportive

Example format:
💙 I hear you, and what you're feeling is completely valid...

🌟 Here are some strategies that might help:
1. 🧘‍♀️ [strategy with emoji]
2. 💪 [strategy with emoji] 
3. 🌈 [strategy with emoji]

Remember, you're stronger than you know! 🌱✨`

  return safeGenerate(prompt)
}

export async function translateParentMessage(message: string, emotions: string[]) {
  const prompt = `Help a student communicate with their parents. Original message: "${message}". Student feels: ${emotions.join(", ")}. 

Rewrite this message to be calm, respectful, and clear while maintaining the student's authentic voice. 

Format the response with:
- Use gentle, respectful language
- Include appropriate emojis to soften the tone (💙, 🙏, 💭, etc.)
- Make it feel authentic but more mature
- Keep it under 150 words
- Start with a caring greeting if appropriate

The goal is to help bridge communication gaps between student and parent with empathy and understanding.`

  return safeGenerate(prompt)
}

export async function generateFocusAdvice(situation: string, distractions: string[]) {
  const prompt = `A student is struggling with focus and shared: "${situation}". Their main distractions are: ${distractions.join(", ")}.

Provide supportive advice formatted with:
- Start with understanding and validation using emojis like 🧠💙
- Give 4-5 specific, actionable focus strategies with relevant emojis
- Include both immediate techniques and longer-term habits
- Use encouraging language and supportive emojis throughout
- End with motivation and belief in their ability
- Keep under 250 words

Focus on practical, student-friendly techniques that actually work for young people.`

  return safeGenerate(prompt)
}

export async function generateOverwhelmAdvice(stressors: string[], intensity: number) {
  const prompt = `A student is feeling overwhelmed (intensity: ${intensity}/10) with these stressors: ${stressors.join(", ")}.

Provide compassionate support formatted with:
- Begin with immediate validation and calming emojis like 🫂💙🌸
- Offer 3-4 immediate relief techniques with calming emojis
- Suggest 2-3 longer-term coping strategies with growth emojis
- Include a gentle reminder about self-compassion
- Use soothing, supportive language throughout
- End with hope and encouragement using uplifting emojis
- Keep under 250 words

Focus on helping them feel less alone and more capable of managing their stress.`

  return safeGenerate(prompt)
}

export async function generateRolePlayResponse(scenario: string, userMessage: string, context: string) {
  const prompt = `You are helping a student practice ${scenario}. Context: ${context}. The student said: "${userMessage}". Respond naturally as the other person in this scenario. Be encouraging but realistic. Keep response conversational and under 100 words.`
  return safeGenerate(prompt)
}

export async function generateCareerAdvice(interests: string[], skills: string[]) {
  const prompt = `Based on interests: ${interests.join(", ")} and skills: ${skills.join(", ")}, suggest 3 specific career paths with brief descriptions and next steps for a student. Include stress-relief tips for career planning anxiety.`
  return safeGenerate(prompt)
}

export async function generateQuizQuestions(subject: string, difficulty: string) {
  const prompt = `Generate 5 multiple choice questions for ${subject} at ${difficulty} level. Format as JSON with question, options (A-D), and correct answer. Make questions engaging and educational.`
  return safeGenerate(prompt)
}

export async function generateStudyPlan(subjects: string[], availableHours: number, preferences: string) {
  const prompt = `Create a balanced study plan for subjects: ${subjects.join(", ")} with ${availableHours} hours available. Student preferences: ${preferences}. Include break times and variety. Format as a structured daily schedule.`
  return safeGenerate(prompt)
}
