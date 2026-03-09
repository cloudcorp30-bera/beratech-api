import OpenAI from "openai";
import axios from "axios";
import FormData from "form-data";
import { uploadToCatbox } from "./catbox";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "dummy-key-to-prevent-crash",
  baseURL: "https://api.deepseek.com",
});

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "dummy-key-to-prevent-crash",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function aiChat(prompt: string, systemPrompt?: string): Promise<{
  response: string;
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null;
}> {
  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: prompt });

  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages,
    max_tokens: 8192,
  });

  return {
    response: response.choices[0]?.message?.content || "",
    model: response.model,
    usage: response.usage ? {
      prompt_tokens: response.usage.prompt_tokens,
      completion_tokens: response.usage.completion_tokens,
      total_tokens: response.usage.total_tokens,
    } : null,
  };
}

export async function aiSummarize(text: string, maxLength?: number): Promise<{
  summary: string;
  original_length: number;
  summary_length: number;
  compression_ratio: string;
  model: string;
}> {
  const lengthInstruction = maxLength ? ` Keep the summary under ${maxLength} words.` : "";
  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: `You are a precise text summarizer. Provide clear, concise summaries that capture the key points.${lengthInstruction}` },
      { role: "user", content: `Summarize the following text:\n\n${text}` },
    ],
    max_tokens: 8192,
  });

  const summary = response.choices[0]?.message?.content || "";
  return {
    summary,
    original_length: text.length,
    summary_length: summary.length,
    compression_ratio: `${((1 - summary.length / text.length) * 100).toFixed(1)}%`,
    model: response.model,
  };
}

export async function aiCodeGenerate(prompt: string, language?: string): Promise<{
  code: string;
  language: string;
  explanation: string;
  model: string;
}> {
  const langHint = language ? ` Write the code in ${language}.` : "";
  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: `You are an expert programmer. Generate clean, well-commented code.${langHint} Respond in JSON format with keys: "code" (the code), "language" (the programming language used), "explanation" (brief explanation of what the code does). Return only valid JSON.` },
      { role: "user", content: prompt },
    ],
    max_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      code: parsed.code || content,
      language: parsed.language || language || "unknown",
      explanation: parsed.explanation || "",
      model: response.model,
    };
  } catch {
    return {
      code: content,
      language: language || "unknown",
      explanation: "",
      model: response.model,
    };
  }
}

export async function aiTranslate(text: string, targetLang: string, sourceLang?: string): Promise<{
  translated_text: string;
  source_language: string;
  target_language: string;
  model: string;
}> {
  const sourceInstruction = sourceLang ? `from ${sourceLang} ` : "";
  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: `You are a professional translator. Translate the text ${sourceInstruction}to ${targetLang}. Preserve the original tone, style, and formatting. Return ONLY the translated text, nothing else.` },
      { role: "user", content: text },
    ],
    max_tokens: 8192,
  });

  return {
    translated_text: response.choices[0]?.message?.content || "",
    source_language: sourceLang || "auto-detected",
    target_language: targetLang,
    model: response.model,
  };
}

export async function aiAnalyze(text: string, analysisType?: string): Promise<{
  analysis: Record<string, any>;
  model: string;
}> {
  const type = analysisType || "general";
  const typeInstructions: Record<string, string> = {
    sentiment: "Analyze the sentiment. Return JSON with: sentiment (positive/negative/neutral/mixed), confidence (0-1), emotions (array of detected emotions with scores), tone (formal/informal/etc).",
    grammar: "Check grammar and spelling. Return JSON with: corrected_text, errors (array of {original, correction, type, position}), score (0-100), suggestions.",
    keywords: "Extract keywords and topics. Return JSON with: keywords (array of {word, relevance_score}), topics (array), language, word_count.",
    readability: "Analyze readability. Return JSON with: grade_level, reading_time_seconds, flesch_score, complexity (simple/moderate/complex), suggestions (array).",
    general: "Perform comprehensive text analysis. Return JSON with: sentiment, language, word_count, key_topics (array), readability_score, tone, summary.",
  };

  const instruction = typeInstructions[type] || typeInstructions.general;

  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: `You are a text analysis expert. ${instruction} Return only valid JSON.` },
      { role: "user", content: text },
    ],
    max_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || "{}";
  try {
    return { analysis: JSON.parse(content), model: response.model };
  } catch {
    return { analysis: { raw: content }, model: response.model };
  }
}

export async function aiImageGenerate(prompt: string, size?: string): Promise<{
  image_url: string;
  prompt: string;
  size: string;
  model: string;
}> {
  const form = new FormData();
  form.append("text", prompt);

  const response = await axios.post("https://api.deepai.org/api/text2img", form, {
    headers: {
      "api-key": process.env.DEEPAI_API_KEY || "",
      ...form.getHeaders(),
    },
  });

  const outputUrl: string = response.data?.output_url;
  if (!outputUrl) throw new Error("No image returned from DeepAI");

  const imgRes = await axios.get(outputUrl, { responseType: "arraybuffer" });
  const imageBuffer = Buffer.from(imgRes.data);
  const imageUrl = await uploadToCatbox(imageBuffer, "image.png");

  return {
    image_url: imageUrl,
    prompt,
    size: size || "1024x1024",
    model: "deepai/text2img",
  };
}

export async function aiExplainCode(code: string, language?: string): Promise<{
  explanation: string;
  language: string;
  complexity: string;
  line_by_line: Array<{ line: number; code: string; explanation: string }>;
  model: string;
}> {
  const langHint = language ? ` The code is written in ${language}.` : "";
  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: `You are an expert code explainer.${langHint} Return a JSON object with: "explanation" (overview), "language" (detected language), "complexity" (simple/moderate/complex), "line_by_line" (array of {line, code, explanation} for key lines). Return only valid JSON.` },
      { role: "user", content: `Explain this code:\n\n${code}` },
    ],
    max_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      explanation: parsed.explanation || "",
      language: parsed.language || language || "unknown",
      complexity: parsed.complexity || "unknown",
      line_by_line: parsed.line_by_line || [],
      model: response.model,
    };
  } catch {
    return {
      explanation: content,
      language: language || "unknown",
      complexity: "unknown",
      line_by_line: [],
      model: response.model,
    };
  }
}

export async function aiDebugCode(code: string, error?: string, language?: string): Promise<{
  bugs: Array<{ line: number; issue: string; severity: string; fix: string }>;
  fixed_code: string;
  summary: string;
  model: string;
}> {
  const langHint = language ? ` The code is written in ${language}.` : "";
  const errorHint = error ? ` The following error was reported: "${error}".` : "";
  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: `You are an expert code debugger.${langHint}${errorHint} Analyze the code for bugs and issues. Return a JSON object with: "bugs" (array of {line, issue, severity, fix}), "fixed_code" (the corrected code), "summary" (brief summary of issues found). Return only valid JSON.` },
      { role: "user", content: `Debug this code:\n\n${code}` },
    ],
    max_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      bugs: parsed.bugs || [],
      fixed_code: parsed.fixed_code || code,
      summary: parsed.summary || "",
      model: response.model,
    };
  } catch {
    return {
      bugs: [],
      fixed_code: code,
      summary: content,
      model: response.model,
    };
  }
}

export async function aiReviewCode(code: string, language?: string): Promise<{
  score: number;
  grade: string;
  issues: Array<{ type: string; severity: string; description: string; suggestion: string }>;
  strengths: string[];
  improvements: string[];
  model: string;
}> {
  const langHint = language ? ` The code is written in ${language}.` : "";
  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: `You are a senior code reviewer.${langHint} Review the code for quality, best practices, and potential issues. Return a JSON object with: "score" (0-100), "grade" (A/B/C/D/F), "issues" (array of {type, severity, description, suggestion}), "strengths" (array of strings), "improvements" (array of strings). Return only valid JSON.` },
      { role: "user", content: `Review this code:\n\n${code}` },
    ],
    max_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      score: parsed.score || 0,
      grade: parsed.grade || "N/A",
      issues: parsed.issues || [],
      strengths: parsed.strengths || [],
      improvements: parsed.improvements || [],
      model: response.model,
    };
  } catch {
    return {
      score: 0,
      grade: "N/A",
      issues: [],
      strengths: [],
      improvements: [],
      model: response.model,
    };
  }
}

export async function aiCommitMessage(diff: string, style?: string): Promise<{
  message: string;
  type: string;
  scope: string;
  description: string;
  body: string;
  model: string;
}> {
  const commitStyle = style || "conventional";
  const styleInstructions: Record<string, string> = {
    conventional: "Use Conventional Commits format: type(scope): description. Types include feat, fix, docs, style, refactor, test, chore.",
    simple: "Write a simple, clear one-line commit message describing the change.",
    detailed: "Write a detailed commit message with a subject line, blank line, then a body explaining what changed and why.",
  };
  const instruction = styleInstructions[commitStyle] || styleInstructions.conventional;

  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: `You are a git commit message generator. ${instruction} Return a JSON object with: "message" (the full commit message), "type" (commit type like feat/fix/etc), "scope" (affected scope), "description" (short description), "body" (detailed body if applicable). Return only valid JSON.` },
      { role: "user", content: `Generate a commit message for this diff:\n\n${diff}` },
    ],
    max_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      message: parsed.message || "",
      type: parsed.type || "",
      scope: parsed.scope || "",
      description: parsed.description || "",
      body: parsed.body || "",
      model: response.model,
    };
  } catch {
    return {
      message: content,
      type: "",
      scope: "",
      description: content,
      body: "",
      model: response.model,
    };
  }
}

export async function aiUnitTest(code: string, language?: string, framework?: string): Promise<{
  tests: string;
  language: string;
  framework: string;
  test_count: number;
  model: string;
}> {
  const langHint = language ? ` The code is written in ${language}.` : "";
  const frameworkHint = framework ? ` Use the ${framework} testing framework.` : "";
  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: `You are a test engineer.${langHint}${frameworkHint} Generate comprehensive unit tests for the given code. Return a JSON object with: "tests" (the test code as a string), "language" (programming language), "framework" (testing framework used), "test_count" (number of test cases). Return only valid JSON.` },
      { role: "user", content: `Generate unit tests for this code:\n\n${code}` },
    ],
    max_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      tests: parsed.tests || content,
      language: parsed.language || language || "unknown",
      framework: parsed.framework || framework || "unknown",
      test_count: parsed.test_count || 0,
      model: response.model,
    };
  } catch {
    return {
      tests: content,
      language: language || "unknown",
      framework: framework || "unknown",
      test_count: 0,
      model: response.model,
    };
  }
}

export async function aiSqlGenerate(prompt: string, dialect?: string, schema?: string): Promise<{
  sql: string;
  dialect: string;
  explanation: string;
  tables_referenced: string[];
  model: string;
}> {
  const dialectHint = dialect ? ` Use ${dialect} SQL dialect.` : "";
  const schemaHint = schema ? ` The database schema is:\n${schema}` : "";
  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: `You are an SQL expert.${dialectHint}${schemaHint} Convert natural language to SQL queries. Return a JSON object with: "sql" (the SQL query), "dialect" (SQL dialect used), "explanation" (what the query does), "tables_referenced" (array of table names used). Return only valid JSON.` },
      { role: "user", content: prompt },
    ],
    max_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      sql: parsed.sql || content,
      dialect: parsed.dialect || dialect || "standard",
      explanation: parsed.explanation || "",
      tables_referenced: parsed.tables_referenced || [],
      model: response.model,
    };
  } catch {
    return {
      sql: content,
      dialect: dialect || "standard",
      explanation: "",
      tables_referenced: [],
      model: response.model,
    };
  }
}

export async function aiRegexGenerate(description: string, flavor?: string): Promise<{
  regex: string;
  flags: string;
  explanation: string;
  examples: { match: string[]; no_match: string[] };
  model: string;
}> {
  const flavorHint = flavor ? ` Use ${flavor} regex flavor.` : "";
  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: `You are a regex expert.${flavorHint} Convert natural language descriptions to regular expressions. Return a JSON object with: "regex" (the regular expression pattern), "flags" (regex flags like g, i, m), "explanation" (step-by-step breakdown of the regex), "examples" (object with "match" array of strings that should match and "no_match" array of strings that should not match). Return only valid JSON.` },
      { role: "user", content: description },
    ],
    max_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      regex: parsed.regex || "",
      flags: parsed.flags || "",
      explanation: parsed.explanation || "",
      examples: parsed.examples || { match: [], no_match: [] },
      model: response.model,
    };
  } catch {
    return {
      regex: content,
      flags: "",
      explanation: "",
      examples: { match: [], no_match: [] },
      model: response.model,
    };
  }
}

export async function aiDocstring(code: string, language?: string, style?: string): Promise<{
  documented_code: string;
  docstrings: Array<{ function_name: string; docstring: string }>;
  model: string;
}> {
  const langHint = language ? ` The code is written in ${language}.` : "";
  const styleHint = style ? ` Use ${style} documentation style.` : "";
  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: `You are a documentation expert.${langHint}${styleHint} Generate comprehensive docstrings and documentation for the given code. Return a JSON object with: "documented_code" (the full code with docstrings added), "docstrings" (array of {function_name, docstring} for each function/method). Return only valid JSON.` },
      { role: "user", content: `Add documentation to this code:\n\n${code}` },
    ],
    max_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      documented_code: parsed.documented_code || code,
      docstrings: parsed.docstrings || [],
      model: response.model,
    };
  } catch {
    return {
      documented_code: code,
      docstrings: [],
      model: response.model,
    };
  }
}

export async function aiRefactor(code: string, language?: string, goal?: string): Promise<{
  refactored_code: string;
  changes: Array<{ description: string; before: string; after: string }>;
  improvements: string[];
  model: string;
}> {
  const langHint = language ? ` The code is written in ${language}.` : "";
  const goalHint = goal ? ` Focus on: ${goal}.` : "";
  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: `You are a code refactoring expert.${langHint}${goalHint} Refactor the given code to improve its quality, readability, and maintainability. Return a JSON object with: "refactored_code" (the improved code), "changes" (array of {description, before, after} for each change made), "improvements" (array of strings describing improvements). Return only valid JSON.` },
      { role: "user", content: `Refactor this code:\n\n${code}` },
    ],
    max_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      refactored_code: parsed.refactored_code || code,
      changes: parsed.changes || [],
      improvements: parsed.improvements || [],
      model: response.model,
    };
  } catch {
    return {
      refactored_code: code,
      changes: [],
      improvements: [],
      model: response.model,
    };
  }
}

export async function aiComplexity(code: string, language?: string): Promise<{
  overall_complexity: string;
  time_complexity: string;
  space_complexity: string;
  cyclomatic_complexity: number;
  suggestions: string[];
  hotspots: Array<{ function_name: string; complexity: string; suggestion: string }>;
  model: string;
}> {
  const langHint = language ? ` The code is written in ${language}.` : "";
  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: `You are a code complexity analyst.${langHint} Analyze the code's complexity including time and space complexity, cyclomatic complexity, and identify hotspots. Return a JSON object with: "overall_complexity" (low/medium/high), "time_complexity" (Big O notation), "space_complexity" (Big O notation), "cyclomatic_complexity" (number), "suggestions" (array of optimization suggestions), "hotspots" (array of {function_name, complexity, suggestion}). Return only valid JSON.` },
      { role: "user", content: `Analyze the complexity of this code:\n\n${code}` },
    ],
    max_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      overall_complexity: parsed.overall_complexity || "unknown",
      time_complexity: parsed.time_complexity || "unknown",
      space_complexity: parsed.space_complexity || "unknown",
      cyclomatic_complexity: parsed.cyclomatic_complexity || 0,
      suggestions: parsed.suggestions || [],
      hotspots: parsed.hotspots || [],
      model: response.model,
    };
  } catch {
    return {
      overall_complexity: "unknown",
      time_complexity: "unknown",
      space_complexity: "unknown",
      cyclomatic_complexity: 0,
      suggestions: [],
      hotspots: [],
      model: response.model,
    };
  }
}

export async function aiTTS(text: string, voice?: string, speed?: number): Promise<{
  audio_url: string;
  text: string;
  voice: string;
  speed: number;
  duration_estimate: number;
  model: string;
}> {
  const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  const selectedVoice = voice && validVoices.includes(voice) ? voice : "alloy";
  const selectedSpeed = speed && speed >= 0.25 && speed <= 4.0 ? speed : 1.0;

  const response = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: selectedVoice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
    input: text,
    response_format: "mp3",
    speed: selectedSpeed,
  });

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const audioUrl = await uploadToCatbox(buffer, "speech.mp3", "audio/mpeg");

  const wordCount = text.split(/\s+/).length;
  const durationEstimate = Math.round((wordCount / 150) * 60 / selectedSpeed);

  return {
    audio_url: audioUrl,
    text,
    voice: selectedVoice,
    speed: selectedSpeed,
    duration_estimate: durationEstimate,
    model: "gpt-4o-mini-tts",
  };
}

export async function aiVoiceTranslate(text: string, targetLang: string, voice?: string, sourceLang?: string): Promise<{
  translated_text: string;
  source_language: string;
  target_language: string;
  audio_url: string;
  voice: string;
  model: string;
}> {
  const sourceInstruction = sourceLang ? `from ${sourceLang} ` : "";
  const translationResponse = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: `You are a professional translator. Translate the text ${sourceInstruction}to ${targetLang}. Preserve the original tone, style, and formatting. Return ONLY the translated text, nothing else.` },
      { role: "user", content: text },
    ],
    max_tokens: 8192,
  });

  const translatedText = translationResponse.choices[0]?.message?.content || "";

  const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  const selectedVoice = voice && validVoices.includes(voice) ? voice : "alloy";

  const speechResponse = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: selectedVoice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
    input: translatedText,
    response_format: "mp3",
  });

  const arrayBuffer = await speechResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const audioUrl = await uploadToCatbox(buffer, "speech.mp3", "audio/mpeg");

  return {
    translated_text: translatedText,
    source_language: sourceLang || "auto-detected",
    target_language: targetLang,
    audio_url: audioUrl,
    voice: selectedVoice,
    model: "deepseek-chat",
  };
}
