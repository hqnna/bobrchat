/**
 * Detects programming language from code content
 * Uses keyword patterns and syntax analysis
 */

const languagePatterns: Record<string, RegExp[]> = {
  typescript: [
    /^import(?:\s+\S.*(?:[\n\r\u2028\u2029]\s*|[\t\v\f \xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF])|\s{2,})from\s+['"].*['"];?$/m,
    /interface\s+\w+\s*[{<]/,
    /type\s+\w+\s*=/,
    /<.*>/,
    /:\s*(string|number|boolean|void|any|unknown)\s*[,;=]/,
  ],
  javascript: [
    /^import(?:\s+\S.*(?:[\n\r\u2028\u2029]\s*|[\t\v\f \xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF])|\s{2,})from\s+['"].*['"];?$/m,
    /\bconst\s+\w+\s*=\s*(async\s+)?\(.*\)\s*=>/,
    /function\s+\w+\s*\(/,
    /\bfunction\s*\*/,
    /\.then\(|\.catch\(|async\s+function/,
  ],
  jsx: [
    /<[A-Z]\w[\s\S]*>/,
    /\bfunction\s+\w+\s*\(.*\)\s*\{[\s\S]*?return\s*\(/,
    /React\.createElement/,
    /export\s+(default\s+)?function\s+\w+/,
  ],
  tsx: [
    /<[A-Z]\w[\s\S]*>/,
    /interface\s+\w+Props/,
    /type\s+\w+Props\s*=/,
    /React\.FC/,
  ],
  python: [
    /^import\s+\w+|^from\s+\w+\s+import/m,
    /^def\s+\w+\s*\(/m,
    /^class\s+\w+/m,
    /^if\s+__name__\s*==\s*['"]__main__['"]/m,
  ],
  json: [
    /^\s*\{[\s\S]*\}\s*$/,
    /^\s*\[[\s\S]*\]\s*$/,
    /":"[^,}]+[,}]/,
  ],
  yaml: [
    /^[a-z_]\w*:\s+\S+/m,
    /^\s*-\s+\w+/m,
  ],
  sql: [
    /^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s+/im,
    /\bFROM\s+\w+/i,
    /\bWHERE\s+/i,
    /\bJOIN\s+/i,
  ],
  html: [
    /^<!(DOCTYPE|doctype)/m,
    /<html[^>]*>/i,
    /<(head|body|div|span|p|a|button|form|input)[^>]*>/,
  ],
  css: [
    /^\.[\w-]+\s*\{/m,
    /#[\w-]+\s*\{/,
    /:\s*(px|em|rem|%|auto|flex|grid)/,
    /@(media|keyframes|font-face)/,
  ],
  bash: [
    /^#!/,
    /^(if|for|while|function)\s+/m,
    /\$\{?\w+\}?/,
    />>|<<|&&|\|\|/,
  ],
  ruby: [
    /^(def|class|module)\s+/m,
    /\.each\s*\{|\.map\s*\{/,
    /require\s+['"].*['"]/,
    /\bend\s*$/m,
  ],
  go: [
    /^package\s+\w+/m,
    /^import\s*\(/m,
    /func\s+\w+\s*\(/,
    /interface\s*\{/,
  ],
  rust: [
    /^fn\s+\w+\s*\(/m,
    /struct\s+\w+\s*\{/,
    /trait\s+\w+\s*\{/,
    /impl(?:\s+\S.*(?:[\n\r\u2028\u2029]\s*|[\t\v\f \xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF])|\s{2,})for\s+/,
    /let\s+\w+/,
  ],
  csharp: [
    /^namespace\s+\w+/m,
    /^\s*(?:(public|private|protected)\s*)?(class|interface|struct)\s+\w+/m,
    /using\s+\w+/,
  ],
  php: [
    /^<\?php|^<\?/m,
    /\$\w+/,
    /->|::/,
    /function\s+\w+\s*\(/,
  ],
  kotlin: [
    /^fun\s+\w+\s*\(/m,
    /^class\s+\w+/m,
    /:\s+\w+\s*[,=}]/,
  ],
  r: [
    /^library\(|^require\(/m,
    /<-|->|%>%/,
    /function\s*\(/,
  ],
  dockerfile: [
    /^FROM\s+/m,
    /^RUN\s+/m,
    /^COPY\s+/m,
    /^CMD\s+/m,
  ],
  makefile: [
    /^[a-z_]\w*:/im,
    /^\t/m,
  ],
  markdown: [
    /^#{1,6}\s+/m,
    /^\*\*.*\*\*|^__.*__/m,
    /^\[.*\]\(.*\)/m,
  ],
  nix: [
    /^let\s+/m,
    /^in\s+/m,
    /\{?\s*pkgs\s*(?:\}\s*)?:\s*/,
  ],
};

/**
 * Map language names to file extensions
 */
const languageExtensions: Record<string, string> = {
  typescript: "ts",
  javascript: "js",
  jsx: "jsx",
  tsx: "tsx",
  python: "py",
  json: "json",
  yaml: "yml",
  sql: "sql",
  html: "html",
  css: "css",
  bash: "sh",
  ruby: "rb",
  go: "go",
  rust: "rs",
  csharp: "cs",
  php: "php",
  kotlin: "kt",
  r: "r",
  dockerfile: "dockerfile",
  makefile: "makefile",
  markdown: "md",
  nix: "nix",
  plaintext: "txt",
};

export function detectLanguage(content: string): string {
  // Only check the first few lines to detect language
  // This helps with files like markdown that may have code blocks later
  // Avoid splitting the entire content - find the 15th newline instead
  let endIndex = 0;
  let newlineCount = 0;
  while (newlineCount < 15 && endIndex < content.length) {
    if (content[endIndex] === "\n") {
      newlineCount++;
    }
    endIndex++;
  }
  const headerContent = content.slice(0, endIndex);

  // Try to detect based on patterns
  const scores: Record<string, number> = {};

  for (const [lang, patterns] of Object.entries(languagePatterns)) {
    scores[lang] = patterns.filter(pattern => pattern.test(headerContent)).length;
  }

  // Find language with highest score
  const detected = Object.entries(scores).reduce((best, [lang, score]) =>
    score > (scores[best[0]] || 0) ? [lang, score] : best,
  )[0];

  // Require at least 2 pattern matches for confident language detection
  // This prevents false positives from generic text
  const minScore = 2;
  if (detected && scores[detected] >= minScore) {
    return detected;
  }

  return "plaintext";
}

/**
 * Get the file extension for a detected language
 */
export function getLanguageExtension(language: string): string {
  return languageExtensions[language] || "txt";
}

/**
 * Check if content is likely code
 */
export function isLikelyCode(content: string): boolean {
  const language = detectLanguage(content);
  return language !== "plaintext";
}
