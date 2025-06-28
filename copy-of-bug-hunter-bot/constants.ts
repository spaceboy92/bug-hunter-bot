export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

export interface PotentialBugArea {
  area: string; 
  reasoning: string;
  suggestion: string; 
  hypotheticalToolOutput?: string;
  hypotheticalSeverity?: string;
}

export interface AnalyzedSite {
  id: string;
  searchQuery: string;
  title: string;
  url: string;
  contactEmail?: string;
  potentialBugAreas: PotentialBugArea[];
  uploadStatus?: 'idle' | 'uploading' | 'success' | 'error';
}

export interface WebsiteAnalysisResult {
  searchQuery: string;
  analyzedSites: AnalyzedSite[];
  groundingData?: GroundingChunk[];
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  retrievedContext?: {
    uri?: string;
    title?: string;
  };
}

export interface LogEntry {
  type: 'info' | 'success' | 'error' | 'summary' | 'topic' | 'scan_result' | 'clickup' | 'agent_thought';
  message: string;
  data?: Partial<WebsiteAnalysisResult>;
}

export interface QueryGenerationResponse {
  queries: string[];
}

export interface AgentReasoningResponse {
  reasoning: string;
  nextQuery: string;
}

export const getAgentNextQueryPrompt = (topic: string, history: { query: string, findingsSummary: string }[]): string => {
  const historyString = history.map((h, i) => 
    `Step ${i + 1}:
Query: "${h.query}"
Findings: ${h.findingsSummary}`
  ).join('\n\n');

  return `You are an autonomous security research agent. Your goal is to iteratively discover web vulnerabilities based on an initial topic.

Initial Topic: "${topic}"

You have already performed the following steps:
${historyString}

Based on this history, your task is to devise the next single, most logical Google dork query to continue the investigation. You must also explain your reasoning. The new query must be different from the previous ones.

CRITICAL: Your entire response must be a single, valid JSON object with two keys: "reasoning" and "nextQuery".
- "reasoning": A brief explanation for why you chose the next query. What are you hoping to find or validate?
- "nextQuery": The new Google dork query string.

Example JSON response:
{
  "reasoning": "The previous query found several sites using an old version of 'SomeCMS'. This next query narrows the search to find configuration files that might be publicly exposed for that specific CMS.",
  "nextQuery": "inurl:somecms filetype:xml config"
}
`;
};

export const getQueryGenerationPrompt = (): string => {
  return `You are a creative security researcher specializing in open-source intelligence (OSINT). Your task is to generate a list of 5 diverse and interesting Google Dork queries. These queries should be designed to uncover potentially misconfigured or vulnerable public web assets.

Focus on variety. Include dorks for:
- Exposed admin panels
- Publicly accessible sensitive files (e.g., logs, configs)
- Specific technologies with known vulnerability patterns
- Error messages that reveal internal information

CRITICAL: Your entire response must be a single, valid JSON object containing a single key "queries" which is an array of strings. Do not include any other text, explanation, or markdown.

Example format:
{
  "queries": [
    "inurl:admin.php intitle:\"login\"",
    "filetype:log inurl:app.log \"error\"",
    "site:*.com intitle:\"index of\" \"/docker-compose.yml\"",
    "intext:\"jira service desk\" \"forgot password\"",
    "\"Powered by vBulletin\" intitle:\"admin control panel\""
  ]
}`;
}

export const getWebsiteAnalysisPrompt = (searchQuery: string): string => {
  return `You are an expert Bug Hunter Bot. The user wants to find websites based on a search query and then get detailed, actionable suggestions for potential bugs.
The AI should analyze any identified website for potential flaws.

User's Search Query: "${searchQuery}"

Your tasks are:
1. Perform a Google Search using the user's query.
2. Identify up to 3 relevant and publicly accessible websites from the search results.
3. For each identified website:
    a. Provide its title and URL.
    b. **CRITICAL - FIND A CONTACT EMAIL:** This is your MOST IMPORTANT task. The vulnerability analysis is only useful if the user can report it. You must find an email address.
        - **Search Methodology:**
            1. **Examine Initial Page:** Thoroughly scan the content of the initial URL provided by the search results.
            2. **Navigate to Contact Pages:** If no email is immediately visible, actively search for and analyze pages like "Contact Us", "Support", "About Us", "Privacy Policy", and "Terms of Service".
            3. **Check for security.txt:** Look for a \`security.txt\` file at the root of the domain.
            4. **Perform New Targeted Search:** If still no email is found, perform a new Google Search with queries like:
                - \`"contact email for example.com"\`
                - \`"whois lookup for example.com"\`
                - \`"example.com support email"\`
                (Replace "example.com" with the actual domain name).
        - **Email Priority:**
            1. **Security:** \`security@\`, \`abuse@\`, \`vulnerability-disclosure@\`
            2. **Support:** \`support@\`, \`help@\`, \`helpdesk@\`
            3. **General Contact:** \`contact@\`, \`info@\`, \`hello@\`, \`admin@\`
            4. **Any other plausible email** you can find associated with the domain.
        - **Final Output Rule:** Your performance is measured by your ability to find a contact email. It is ALWAYS preferable to provide a general contact email (like \`info@...\`) than to provide nothing. If you find any plausible email address, you MUST include it in the 'contactEmail' field. Only if every single one of these exhaustive steps fails should you omit the field. Be resourceful and persistent.
    
    c. After finding an email, brainstorm 3-5 potential issues. For each issue, provide:
        i.   **Area/Category:** The specific type of bug (e.g., "Security - Cross-Site Scripting (XSS) in Login Form", "Performance - Unoptimized Images"). Be specific about where on the website this might occur.
        ii.  **Reasoning/Description:** Brief explanation of the risk.
        iii. **Suggested Action/Test:** A concrete, actionable step a user could take to manually investigate.
        iv.  **Hypothetical Tool Finding:** A brief, illustrative example of what a relevant open-source tool (e.g., Nmap, OWASP ZAP, SQLMap, Lighthouse) *might report* for this kind of issue. Frame this as a simulated example.
        v.   **Hypothetical Severity:** A suggested severity level ("High", "Medium", "Low", "Informational").
    
    In your analysis, pay special attention to simulating the following common, simple-to-spot vulnerabilities:
    *   **Insecure Form Submission:** Identify if any HTML forms have an 'action' attribute pointing to an 'http://' URL instead of 'https://'.
    *   **Outdated JS Libraries:** Look for clues of old, vulnerable JavaScript libraries being used, for example, very old versions of jQuery (e.g., jQuery 1.x).
    *   **Potential Admin Panel Exposure:** Check if the URL or page title suggests it's an exposed administrative interface (e.g., contains 'admin', 'login', 'dashboard' in a revealing way).
    *   **Plaintext Password Fields:** Look for any <input> fields that seem to be for passwords but have a 'type="text"' attribute.
    
    Also consider these broader categories:
    *   **Security:** XSS, SQLi, Broken Access Control, Security Misconfiguration, IDOR, SSRF, Directory Traversal/Listing, Sensitive Data Exposure.
    *   **Performance:** Slow load, large assets, caching issues.
    *   **Functional Bugs:** Broken links, features not working.

EXTREMELY CRITICAL JSON FORMATTING RULES:
1.  Your ENTIRE response MUST be a single, valid JSON object starting with "{" and ending with "}".
2.  NO conversational text or other characters outside this JSON object.
3.  All property names (keys) and string values MUST be enclosed in double quotes.
4.  Internal special characters (like quotes or backslashes) in strings must be properly escaped (e.g., \\", \\\\).

Please structure your response as a single JSON object adhering to the following TypeScript interface:

\`\`\`json
{
  "searchQuery": "string",
  "analyzedSites": [
    {
      "title": "string",
      "url": "string",
      "contactEmail": "string (optional, but finding it is your highest priority)",
      "potentialBugAreas": [
        {
          "area": "string",
          "reasoning": "string",
          "suggestion": "string",
          "hypotheticalToolOutput": "string",
          "hypotheticalSeverity": "string"
        }
      ]
    }
  ]
}
\`\`\`

Ensure your JSON is perfectly valid and can be parsed directly. Provide the analysis for the identified websites.`;
};