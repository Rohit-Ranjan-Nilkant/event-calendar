export const INTERESTS = [
  "AI & Machine Learning",
  "Web Development",
  "Data Science & Analytics",
  "Cybersecurity",
  "Cloud & DevOps",
  "Blockchain & Web3",
  "Product Management",
  "UX & Design",
  "Startup & Entrepreneurship",
  "Business & Finance",
  "Marketing & Sales",
  "Leadership & Management",
  "Healthcare & MedTech",
  "Education & Learning",
  "Sustainability & CleanTech",
  "Gaming & XR",
  "Legal & Compliance",
  "HR & People Ops",
] as const

export type Interest = (typeof INTERESTS)[number]

// Keywords per interest used for auto-tagging events on import
export const INTEREST_KEYWORDS: Record<string, string[]> = {
  "AI & Machine Learning": [
    "ai", "machine learning", "deep learning", "neural", "llm", "gpt",
    "nlp", "computer vision", "generative", "artificial intelligence", "ml",
  ],
  "Web Development": [
    "web dev", "frontend", "backend", "fullstack", "javascript", "typescript",
    "react", "next.js", "node", "api", "software developer", "engineering",
  ],
  "Data Science & Analytics": [
    "data science", "analytics", "data engineer", "python", "sql", "tableau",
    "power bi", "big data", "etl", "data platform", "databricks",
  ],
  "Cybersecurity": [
    "security", "cybersecurity", "infosec", "hacking", "pentest", "soc",
    "ransomware", "zero trust", "devsecops", "compliance", "privacy",
  ],
  "Cloud & DevOps": [
    "cloud", "aws", "azure", "gcp", "kubernetes", "docker", "devops",
    "infrastructure", "terraform", "serverless", "platform engineering",
  ],
  "Blockchain & Web3": [
    "blockchain", "web3", "nft", "defi", "crypto", "smart contract",
    "ethereum", "solana", "dao", "metaverse",
  ],
  "Product Management": [
    "product manager", "product management", "roadmap", "agile", "scrum",
    "okr", "product strategy", "product led",
  ],
  "UX & Design": [
    "ux", "ui", "design", "figma", "user experience", "user research",
    "design system", "accessibility", "prototyping",
  ],
  "Startup & Entrepreneurship": [
    "startup", "entrepreneur", "founder", "vc", "venture capital", "pitch",
    "fundraising", "seed", "series a", "bootstrapping",
  ],
  "Business & Finance": [
    "business", "finance", "investment", "fintech", "banking", "economy",
    "revenue", "growth", "strategy", "operations",
  ],
  "Marketing & Sales": [
    "marketing", "sales", "seo", "social media", "content marketing",
    "demand gen", "crm", "revenue ops", "growth hacking",
  ],
  "Leadership & Management": [
    "leadership", "management", "executive", "cto", "ceo", "cxo",
    "culture", "team building", "coaching", "mentorship",
  ],
  "Healthcare & MedTech": [
    "healthcare", "health tech", "medtech", "biotech", "clinical", "pharma",
    "digital health", "telemedicine", "life sciences",
  ],
  "Education & Learning": [
    "education", "learning", "edtech", "training", "workshop", "bootcamp",
    "curriculum", "teaching", "academic",
  ],
  "Sustainability & CleanTech": [
    "sustainability", "climate", "green tech", "clean energy", "esg",
    "net zero", "renewable", "carbon", "impact",
  ],
  "Gaming & XR": [
    "gaming", "game dev", "vr", "ar", "xr", "virtual reality",
    "augmented reality", "metaverse", "unity", "unreal",
  ],
  "Legal & Compliance": [
    "legal", "compliance", "gdpr", "regulation", "contract", "ip",
    "intellectual property", "policy", "governance",
  ],
  "HR & People Ops": [
    "hr", "human resources", "recruiting", "talent", "people ops",
    "culture", "dei", "employee experience", "workforce",
  ],
}

/** Auto-tag an event based on title + description + category keyword matching */
export function autoTagEvent(
  title: string,
  description?: string | null,
  category?: string | null
): string {
  const haystack = [title, description, category]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  const matched = INTERESTS.filter((interest) =>
    INTEREST_KEYWORDS[interest]?.some((kw) => haystack.includes(kw))
  )

  return matched.join(",")
}
