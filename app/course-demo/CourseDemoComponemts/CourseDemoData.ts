// app/course-demo/CourseDemoComponents/CourseDemoData.ts
// ============================================
// Data definitions and constants for the course demo

// Types
export interface Tag {
  id: string
  label: string
}

export interface TagSet {
  id: string
  name: string
  tags: Tag[]
}

export interface Series {
  id: string
  name: string
  slug: string
  tagSet: TagSet
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  series: Series[]
}

export interface Course {
  id: string
  title: string
  categoryId: string
  seriesId: string
  tagId: string
  description: string
  thumbnailUrl: string
  price: {
    amount: number
    currency: string
  }
}

export interface NavTab {
  id: string
  label: string
  categoryId: string
}

export type Selection = Record<string, Set<string>>

// EB1A Criteria tags (used across all series)
export const EB1A_CRITERIA_TAGS: Tag[] = [
  { id: 'awards', label: 'Awards' },
  { id: 'membership', label: 'Membership' },
  { id: 'press', label: 'Published Material' },
  { id: 'judging', label: 'Judging' },
  { id: 'original', label: 'Original Contributions' },
  { id: 'authorship', label: 'Authorship' },
  { id: 'display', label: 'Display of Work' },
  { id: 'leading-role', label: 'Leading/Critical Role' },
  { id: 'salary', label: 'High Salary' },
  { id: 'commercial', label: 'Commercial Success' }
] as const

// Series-based color palette for thumbnails
export const SERIES_THUMB_COLORS: Record<string, string> = {
  // EB1A
  's-eb1a-criteria': 'f0f9ff',     // sky-50
  's-eb1a-rfe': 'fef2f2',          // rose-50
  's-eb1a-final': 'f5f3ff',        // violet-50
  's-eb1a-comparable': 'f0fdf4',   // green-50
  // EB2NIW
  's-eb2-prongs': 'f0fdf4',        // green-50
  's-eb2-rfe': 'fefce8',           // amber-50
  // O-1
  's-o1-criteria': 'fdf2f8',       // pink-50
  's-o1-rfe': 'fff7ed',            // orange-50
  // EB-5
  's-eb5-capital': 'ecfeff',       // cyan-50
  's-eb5-jobs': 'eff6ff'           // blue-50
}

// Series background colors for series cards
export const SERIES_BG_COLORS: Record<string, string> = {
  's-eb1a-criteria': 'bg-sky-50',
  's-eb1a-rfe': 'bg-rose-50',
  's-eb1a-final': 'bg-violet-50',
  's-eb1a-comparable': 'bg-green-50',
  's-eb2-prongs': 'bg-green-50',
  's-eb2-rfe': 'bg-amber-50',
  's-o1-criteria': 'bg-pink-50',
  's-o1-rfe': 'bg-orange-50',
  's-eb5-capital': 'bg-cyan-50',
  's-eb5-jobs': 'bg-blue-50'
}

// Main catalog structure
export const catalogConfig = {
  version: 'v1.4.0',
  ui: {
    navTabs: [
      { id: 'all', label: 'ALL', categoryId: 'all' },
      { id: 'series', label: 'SERIES', categoryId: 'series' },
      { id: 'eb1a', label: 'EB1A', categoryId: 'cat-eb1a' },
      { id: 'eb2n', label: 'EB2NIW', categoryId: 'cat-eb2niw' },
      { id: 'o1', label: 'O-1', categoryId: 'cat-o1' },
      { id: 'eb5', label: 'EB-5', categoryId: 'cat-eb5' }
    ] as NavTab[],
    defaultTab: 'all',
    price: { currency: 'USD', defaultCoursePrice: 199 }
  },

  categories: [
    {
      id: 'cat-eb1a',
      name: 'EB1A',
      slug: 'eb1a',
      description: 'Extraordinary Ability (10 criteria).',
      series: [
        {
          id: 's-eb1a-criteria',
          name: 'Criterion Series',
          slug: 'criteria',
          tagSet: { 
            id: 'ts-eb1a-criteria', 
            name: 'EB1A Criteria', 
            tags: [...EB1A_CRITERIA_TAGS] 
          }
        },
        {
          id: 's-eb1a-rfe',
          name: 'RFE Series',
          slug: 'rfe',
          tagSet: { 
            id: 'ts-eb1a-criteria-rfe', 
            name: 'EB1A Criteria (RFE)', 
            tags: [...EB1A_CRITERIA_TAGS] 
          }
        },
        {
          id: 's-eb1a-final',
          name: 'Final Merits',
          slug: 'final-merits',
          tagSet: { 
            id: 'ts-eb1a-criteria-final', 
            name: 'EB1A Criteria (Final Merits)', 
            tags: [...EB1A_CRITERIA_TAGS] 
          }
        },
        {
          id: 's-eb1a-comparable',
          name: 'Comparable Evidence',
          slug: 'comparable-evidence',
          tagSet: { 
            id: 'ts-eb1a-criteria-comparable', 
            name: 'EB1A Criteria (Comparable Evidence)', 
            tags: [...EB1A_CRITERIA_TAGS] 
          }
        }
      ]
    },
    {
      id: 'cat-eb2niw',
      name: 'EB2NIW',
      slug: 'eb2niw',
      description: 'National Interest Waiver (Dhanasar).',
      series: [
        {
          id: 's-eb2-prongs',
          name: 'NIW Prongs',
          slug: 'prongs',
          tagSet: {
            id: 'ts-eb2-prongs',
            name: 'Dhanasar Prongs',
            tags: [
              { id: 'substantial-merit', label: 'Substantial Merit' },
              { id: 'national-importance', label: 'National Importance' },
              { id: 'well-positioned', label: 'Well Positioned' },
              { id: 'balancing', label: 'Balancing Test' }
            ]
          }
        },
        {
          id: 's-eb2-rfe',
          name: 'RFE & Denials',
          slug: 'rfe',
          tagSet: {
            id: 'ts-eb2-rfe',
            name: 'NIW RFE Themes',
            tags: [
              { id: 'impact-evidence', label: 'Impact Evidence' },
              { id: 'letters', label: 'Expert Letters' },
              { id: 'plan-specificity', label: 'Plan Specificity' }
            ]
          }
        }
      ]
    },
    {
      id: 'cat-o1',
      name: 'O-1',
      slug: 'o1',
      description: 'Extraordinary Ability (O-1A/O-1B).',
      series: [
        {
          id: 's-o1-criteria',
          name: 'O-1 Criteria',
          slug: 'criteria',
          tagSet: {
            id: 'ts-o1-criteria',
            name: 'O-1 Criteria',
            tags: [
              { id: 'awards', label: 'Awards/Prizes' },
              { id: 'membership', label: 'Memberships' },
              { id: 'press', label: 'Published Material' },
              { id: 'judging', label: 'Judging' },
              { id: 'original', label: 'Original Contributions' },
              { id: 'authorship', label: 'Authorship' },
              { id: 'critical-role', label: 'Critical/Leading Role' },
              { id: 'salary', label: 'High Salary' },
              { id: 'commercial', label: 'Commercial Success (O-1B)' }
            ]
          }
        },
        {
          id: 's-o1-rfe',
          name: 'RFE & Appeals',
          slug: 'rfe',
          tagSet: {
            id: 'ts-o1-rfe',
            name: 'O-1 RFE Themes',
            tags: [
              { id: 'advisory-letters', label: 'Advisory Letters' },
              { id: 'comparator-evidence', label: 'Comparator Evidence' }
            ]
          }
        }
      ]
    },
    {
      id: 'cat-eb5',
      name: 'EB-5',
      slug: 'eb5',
      description: 'Immigrant Investor Program.',
      series: [
        {
          id: 's-eb5-capital',
          name: 'Investment & Capital',
          slug: 'capital',
          tagSet: {
            id: 'ts-eb5-capital',
            name: 'Capital Topics',
            tags: [
              { id: 'source-of-funds', label: 'Lawful Source of Funds' },
              { id: 'capital-at-risk', label: 'Capital at Risk' },
              { id: 'structure', label: 'Investment Structure' }
            ]
          }
        },
        {
          id: 's-eb5-jobs',
          name: 'Job Creation & RC',
          slug: 'jobs-rc',
          tagSet: {
            id: 'ts-eb5-jobs',
            name: 'Job Creation',
            tags: [
              { id: 'direct', label: 'Direct Jobs' },
              { id: 'indirect', label: 'Indirect Jobs (RC)' },
              { id: 'economics', label: 'Economic Modeling' }
            ]
          }
        }
      ]
    }
  ] as Category[]
}