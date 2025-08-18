'use client'

import React, { useMemo, useState } from 'react'
import { 
  TabBar, 
  FilterPanel, 
  FilterModal,
  CourseCard, 
  SeriesCard,
  EmptyState 
} from './CourseComponents'

// --- DEMO DATA ---

// Thumbnail helper with colored backgrounds
function makeThumb(text: string, seriesId?: string): string {
  // Series-based color palette matching the series cards
  const SERIES_THUMB_COLORS: Record<string, string> = {
    // EB1A
    's-eb1a-criteria': 'f0f9ff', // sky-50
    's-eb1a-rfe': 'fef2f2',      // rose-50
    's-eb1a-final': 'f5f3ff',    // violet-50
    // EB2NIW
    's-eb2-prongs': 'f0fdf4',    // green-50
    's-eb2-rfe': 'fefce8',       // amber-50
    // O-1
    's-o1-criteria': 'fdf2f8',   // pink-50
    's-o1-rfe': 'fff7ed',        // orange-50
    // EB-5
    's-eb5-capital': 'ecfeff',   // cyan-50
    's-eb5-jobs': 'eff6ff'       // blue-50
  }

  const label = encodeURIComponent(text)
  const bg = (seriesId && SERIES_THUMB_COLORS[seriesId]) || 'ede9fe' // fallback: lavender
  const fg = '0f172a' // slate-900 for legible text
  return `https://dummyimage.com/640x360/${bg}/${fg}&text=${label}`
}

// EB1A Criteria tags
const EB1A_CRITERIA_TAGS = [
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

// Types
interface Tag {
  id: string
  label: string
}

interface TagSet {
  id: string
  name: string
  tags: Tag[]
}

interface Series {
  id: string
  name: string
  slug: string
  tagSet: TagSet
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
  series: Series[]
}

interface Course {
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

interface NavTab {
  id: string
  label: string
  categoryId: string
}

type Selection = Record<string, Set<string>>

// Generate EB1A courses
function generateEB1ACourses(categoryId: string, price = 199): Course[] {
  const seriesDefs = [
    { id: 's-eb1a-criteria', name: 'Criterion Series', slug: 'criteria' },
    { id: 's-eb1a-rfe', name: 'RFE Series', slug: 'rfe' },
    { id: 's-eb1a-final', name: 'Final Merits', slug: 'final-merits' }
  ]

  const courses: Course[] = []
  for (const s of seriesDefs) {
    for (const tag of EB1A_CRITERIA_TAGS) {
      const title = `EB1A — ${tag.label} (${s.name})`
      courses.push({
        id: `crs-eb1a-${s.slug}-${tag.id}`,
        title,
        categoryId,
        seriesId: s.id,
        tagId: tag.id,
        description: `Comprehensive guidance for ${tag.label} within EB1A (${s.name}). Evidence examples, pitfalls, and strategic checklists included.`,
        thumbnailUrl: makeThumb(`${tag.label} · ${s.name}`, s.id),
        price: { amount: price, currency: 'USD' }
      })
    }
  }
  return courses
}

// Main catalog data
const catalog = {
  version: 'v1.3.0',
  generatedAt: new Date().toISOString(),
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
  ] as Category[],
  courses: [] as Course[]
}

// Initialize courses
catalog.courses.push(...generateEB1ACourses('cat-eb1a', 199))

// Add sample courses for other categories
catalog.courses.push(
  {
    id: 'crs-eb2-prongs-merit',
    title: 'EB2NIW — Substantial Merit',
    categoryId: 'cat-eb2niw',
    seriesId: 's-eb2-prongs',
    tagId: 'substantial-merit',
    description: 'How to frame Substantial Merit evidence under Dhanasar, with sample proofs and drafting tips.',
    thumbnailUrl: makeThumb('NIW · Substantial Merit', 's-eb2-prongs'),
    price: { amount: 199, currency: 'USD' }
  },
  {
    id: 'crs-eb2-rfe-letters',
    title: 'EB2NIW RFE — Expert Letters',
    categoryId: 'cat-eb2niw',
    seriesId: 's-eb2-rfe',
    tagId: 'letters',
    description: 'Responding to NIW RFEs targeting expert letters: author selection, credentials, and specificity.',
    thumbnailUrl: makeThumb('NIW RFE · Letters', 's-eb2-rfe'),
    price: { amount: 199, currency: 'USD' }
  },
  {
    id: 'crs-o1-criteria-awards',
    title: 'O-1 — Awards',
    categoryId: 'cat-o1',
    seriesId: 's-o1-criteria',
    tagId: 'awards',
    description: 'Qualifying award types for O-1, evidence hierarchy, and corroboration guidance.',
    thumbnailUrl: makeThumb('O-1 · Awards', 's-o1-criteria'),
    price: { amount: 199, currency: 'USD' }
  },
  {
    id: 'crs-o1-rfe-advisory',
    title: 'O-1 RFE — Advisory Letters',
    categoryId: 'cat-o1',
    seriesId: 's-o1-rfe',
    tagId: 'advisory-letters',
    description: 'Addressing advisory letter sufficiency: peer group fit, independence, and objective analysis.',
    thumbnailUrl: makeThumb('O-1 RFE · Advisory', 's-o1-rfe'),
    price: { amount: 199, currency: 'USD' }
  },
  {
    id: 'crs-eb5-capital-sof',
    title: 'EB-5 Capital — Lawful Source of Funds',
    categoryId: 'cat-eb5',
    seriesId: 's-eb5-capital',
    tagId: 'source-of-funds',
    description: 'Documenting lawful source and path of funds with audits, affidavits, and bank trails.',
    thumbnailUrl: makeThumb('EB-5 · Source of Funds', 's-eb5-capital'),
    price: { amount: 199, currency: 'USD' }
  },
  {
    id: 'crs-eb5-jobs-direct',
    title: 'EB-5 Jobs — Direct Jobs',
    categoryId: 'cat-eb5',
    seriesId: 's-eb5-jobs',
    tagId: 'direct',
    description: 'Direct job creation calculations, payroll validation, and ongoing compliance checkpoints.',
    thumbnailUrl: makeThumb('EB-5 · Direct Jobs', 's-eb5-jobs'),
    price: { amount: 199, currency: 'USD' }
  }
)

// Helper functions
const getCategoryById = (id: string): Category | undefined => 
  catalog.categories.find(c => c.id === id)

const getSeriesById = (catId: string, seriesId: string): Series | undefined => 
  getCategoryById(catId)?.series.find(s => s.id === seriesId)

// Custom hook for filtered courses
function useFilteredCourses(activeTabId: string, selection: Selection) {
  return useMemo(() => {
    const activeTab = catalog.ui.navTabs.find(t => t.id === activeTabId) ?? catalog.ui.navTabs[0]
    const activeCategoryId = activeTab.categoryId

    const matchesCategory = (c: Course) => 
      activeCategoryId === 'all' || c.categoryId === activeCategoryId

    const hasAnySelections = Object.values(selection).some(set => set && set.size > 0)

    const matchesFilters = (c: Course) => {
      if (!hasAnySelections) return true
      const set = selection[c.seriesId]
      if (!set || set.size === 0) return false
      return set.has(c.tagId)
    }

    const list = catalog.courses.filter(c => matchesCategory(c) && matchesFilters(c))
    return { list, activeCategoryId }
  }, [activeTabId, selection])
}

// Main Component
export function CourseCatalog() {
  const [activeTab, setActiveTab] = useState(catalog.ui.defaultTab)
  const [selection, setSelection] = useState<Selection>({})
  const [showFilters, setShowFilters] = useState(false)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  const { list: filtered, activeCategoryId } = useFilteredCourses(activeTab, selection)

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    setSelection({})
  }

  const handleFilterToggle = () => {
    if (window.innerWidth < 1024) { // lg breakpoint
      setIsMobileFilterOpen(true)
    } else {
      setShowFilters(s => !s)
    }
  }

  const handleSeriesClick = (categoryId: string, seriesId: string) => {
    const category = getCategoryById(categoryId)
    const series = category?.series.find(s => s.id === seriesId)
    
    if (category && series) {
      const tab = catalog.ui.navTabs.find(t => t.categoryId === category.id)
      if (tab) {
        const tagIds = series.tagSet.tags.map(t => t.id)
        const newSelection: Selection = {}
        newSelection[seriesId] = new Set(tagIds)
        setSelection(newSelection)
        setActiveTab(tab.id)
      }
    }
  }

  // Rendering helpers
  const renderCategoryGroups = () => {
    const sections = catalog.categories.map(cat => {
      const group = filtered.filter(c => c.categoryId === cat.id)
      if (group.length === 0) return null

      return (
        <section key={cat.id} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200/30 rounded-xl px-4 py-2">
              {cat.name}
            </h2>
            <span className="text-sm text-gray-500">{group.length} courses</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {group.map(course => (
              <CourseCard 
                key={course.id} 
                course={course} 
                categories={catalog.categories}
              />
            ))}
          </div>
        </section>
      )
    })
    return sections.filter(Boolean)
  }

  const renderSeriesGroups = () => {
    const category = getCategoryById(activeCategoryId as string)
    if (!category) return []

    const sections = category.series.map(series => {
      const group = filtered.filter(c => c.seriesId === series.id)
      if (group.length === 0) return null

      return (
        <section key={series.id} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200/30 rounded-xl px-4 py-2">
              {series.name}
            </h2>
            <span className="text-sm text-gray-500">{group.length} courses</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {group.map(course => (
              <CourseCard 
                key={course.id} 
                course={course} 
                categories={catalog.categories}
              />
            ))}
          </div>
        </section>
      )
    })
    return sections.filter(Boolean)
  }

  const renderSeriesOverview = () => {
    const sections = catalog.categories.map(cat => {
      const availableSeries = cat.series.filter(series => 
        catalog.courses.some(c => c.categoryId === cat.id && c.seriesId === series.id)
      )
      if (availableSeries.length === 0) return null

      return (
        <section key={cat.id} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200/30 rounded-xl px-4 py-2">
              {cat.name}
            </h2>
            <span className="text-sm text-gray-500">{availableSeries.length} series</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {availableSeries.map(series => (
              <SeriesCard
                key={series.id}
                seriesId={series.id}
                title={series.name}
                description={series.tagSet.name}
                onClick={() => handleSeriesClick(cat.id, series.id)}
              />
            ))}
          </div>
        </section>
      )
    })
    return sections.filter(Boolean)
  }

  const isAll = activeCategoryId === 'all'
  const isSeriesOverview = activeCategoryId === 'series'
  const sections = isSeriesOverview 
    ? renderSeriesOverview() 
    : (isAll ? renderCategoryGroups() : renderSeriesGroups())

  return (
    <div className="backdrop-blur-xl bg-white/80 border border-purple-200/30 rounded-2xl shadow-lg p-6 md:p-8">
      <TabBar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        showFilters={showFilters}
        onToggleFilters={handleFilterToggle}
        navTabs={catalog.ui.navTabs}
      />

      {/* Desktop Filter Panel */}
      {showFilters && !isSeriesOverview && (
        <div className="hidden lg:block">
          <FilterPanel 
            activeCategoryId={activeCategoryId as string} 
            selection={selection} 
            setSelection={setSelection}
            categories={catalog.categories}
          />
        </div>
      )}

      {/* Mobile Filter Modal */}
      <FilterModal
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        activeCategoryId={activeCategoryId as string}
        selection={selection}
        setSelection={setSelection}
        categories={catalog.categories}
      />

      {showFilters && isSeriesOverview && (
        <div className="backdrop-blur-xl bg-white/60 border border-purple-200/30 rounded-2xl p-6 mb-6">
          <p className="text-sm text-gray-600 text-center">
            Select a specific category to view detailed course filtering options.
          </p>
        </div>
      )}

      <main>
        {sections.length > 0 ? (
          sections
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  )
}