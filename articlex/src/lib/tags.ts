export interface TagDefinition {
  id: string
  label: string
  color: string
}

export const COLLECTION_TAGS: TagDefinition[] = [
  { id: 'ai', label: 'AI & Machine Learning', color: '#7c3aed' },
  { id: 'webdev', label: 'Web Development', color: '#06b6d4' },
  { id: 'startups', label: 'Startups & Business', color: '#f59e0b' },
  { id: 'design', label: 'Design & UX', color: '#ec4899' },
  { id: 'crypto', label: 'Crypto & Web3', color: '#8b5cf6' },
  { id: 'science', label: 'Science & Research', color: '#10b981' },
  { id: 'philosophy', label: 'Philosophy & Thinking', color: '#6366f1' },
  { id: 'productivity', label: 'Productivity', color: '#14b8a6' },
  { id: 'career', label: 'Career & Growth', color: '#f97316' },
  { id: 'finance', label: 'Finance & Investing', color: '#22c55e' },
  { id: 'health', label: 'Health & Wellness', color: '#ef4444' },
  { id: 'marketing', label: 'Marketing', color: '#a855f7' },
  { id: 'data', label: 'Data Science', color: '#3b82f6' },
  { id: 'opensource', label: 'Open Source', color: '#84cc16' },
  { id: 'writing', label: 'Writing & Content', color: '#e879f9' },
  { id: 'leadership', label: 'Leadership', color: '#f43f5e' },
  { id: 'psychology', label: 'Psychology', color: '#fb923c' },
  { id: 'education', label: 'Education', color: '#2dd4bf' },
  { id: 'devops', label: 'DevOps & Cloud', color: '#0ea5e9' },
  { id: 'mobile', label: 'Mobile Development', color: '#d946ef' },
  { id: 'security', label: 'Security & Privacy', color: '#64748b' },
  { id: 'product', label: 'Product Management', color: '#c084fc' },
  { id: 'social', label: 'Social Media', color: '#38bdf8' },
  { id: 'politics', label: 'Politics & Policy', color: '#fbbf24' },
  { id: 'culture', label: 'Culture & Society', color: '#fb7185' },
]

export function getTagById(id: string): TagDefinition | undefined {
  return COLLECTION_TAGS.find((t) => t.id === id)
}

export function getTagsByIds(ids: string[]): TagDefinition[] {
  return ids.map(getTagById).filter(Boolean) as TagDefinition[]
}
