export function codeSnippet(text: string): string {
  return `\`\`\`${text}\`\`\``;
}

export function wrap(str1: string, str2: string, str3: string): string {
  return `${str1}${str2}${str3}`;
}

export function escapeBacktick(text: string): string {
  return text.replace(/`/g, '\\`');
}

export function isAsciiSpinner(chunk: string): boolean {
  const asciiSpinnerStates = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  return asciiSpinnerStates.some(state => chunk.includes(state));
}