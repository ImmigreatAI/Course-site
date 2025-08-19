// app/course-demo/CourseDemoComponents/CourseDemoUtils.ts
// ============================================
// Utility functions and custom hooks for the course demo

import { useMemo } from 'react'
import { 
  Course, 
  Category, 
  Series, 
  Selection, 
  NavTab, 
  SERIES_THUMB_COLORS, 
  EB1A_CRITERIA_TAGS,
  catalogConfig 
} from './CourseDemoData'

// Thumbnail generator with colored backgrounds
export function makeThumb(text: string, seriesId?: string): string {
  const label = encodeURIComponent(text)
  const bg = (seriesId && SERIES_THUMB_COLORS[seriesId]) || 'ede9fe' // fallback: lavender
  const fg = '0f172a' // slate-900 for legible text
  return `https://dummyimage.com/640x360/${bg}/${fg}&text=${label}`
}

// Generate EB1A courses for all 4 series
export function generateEB1ACourses(categoryId: string, price = 199): Course[] {
  const seriesDefs = [
    { id: 's-eb1a-criteria', name: 'Criterion Series', slug: 'criteria' },
    { id: 's-eb1a-rfe', name: 'RFE Series', slug: 'rfe' },
    { id: 's-eb1a-final', name: 'Final Merits', slug: 'final-merits' },
    { id: 's-eb1a-comparable', name: 'Comparable Evidence', slug: 'comparable-evidence' }
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

// Helper functions
export const getCategoryById = (categories: Category[], id: string): Category | undefined => 
  categories.find(c => c.id === id)

export const getSeriesById = (categories: Category[], catId: string, seriesId: string): Series | undefined => 
  getCategoryById(categories, catId)?.series.find(s => s.id === seriesId)

// Create full catalog with all courses
export function createFullCatalog() {
  const courses: Course[] = []
  
  // Generate all EB1A courses (4 series × 10 criteria = 40 courses)
  courses.push(...generateEB1ACourses('cat-eb1a', 199))

  // Add sample courses for other categories
  courses.push(
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

  return {
    ...catalogConfig,
    generatedAt: new Date().toISOString(),
    courses
  }
}

// Custom hook for filtered courses with criterion-based grouping
export function useFilteredCourses(activeTabId: string, selection: Selection, courses: Course[], categories: Category[]) {
  return useMemo(() => {
    const activeTab = catalogConfig.ui.navTabs.find(t => t.id === activeTabId) ?? catalogConfig.ui.navTabs[0]
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

    const filteredCourses = courses.filter(c => matchesCategory(c) && matchesFilters(c))
    
    // Group courses by criterion (tagId) when filters are active OR when on ALL tab
    const groupedByCriterion = new Map<string, Course[]>()
    const shouldGroupByCriterion = hasAnySelections || activeCategoryId === 'all'
    
    if (shouldGroupByCriterion) {
      for (const course of filteredCourses) {
        const key = course.tagId
        if (!groupedByCriterion.has(key)) {
          groupedByCriterion.set(key, [])
        }
        groupedByCriterion.get(key)!.push(course)
      }
    }

    return { 
      list: filteredCourses, 
      activeCategoryId,
      hasAnySelections,
      groupedByCriterion,
      shouldGroupByCriterion
    }
  }, [activeTabId, selection, courses, categories])
}

// Get criterion label by tagId for a specific category
export function getCriterionLabel(tagId: string, categoryId: string, categories: Category[]): string {
  const category = getCategoryById(categories, categoryId)
  if (!category) return tagId

  // Look through all series in the category to find the tag
  for (const series of category.series) {
    const tag = series.tagSet.tags.find(t => t.id === tagId)
    if (tag) return tag.label
  }
  
  return tagId
}

// Get all unique criteria from the catalog in priority order
export function getAllCriteriaInOrder(categories: Category[]): string[] {
  // Define the priority order for EB1A criteria (most common ones first)
  const priorityOrder = [
    'awards', 'membership', 'press', 'judging', 'original', 
    'authorship', 'display', 'leading-role', 'salary', 'commercial'
  ]
  
  const allCriteria = new Set<string>()
  
  // Collect all unique criteria from all categories
  categories.forEach(category => {
    category.series.forEach(series => {
      series.tagSet.tags.forEach(tag => {
        allCriteria.add(tag.id)
      })
    })
  })
  
  // Sort by priority order, then alphabetically for any not in priority list
  const criteriaArray = Array.from(allCriteria)
  return criteriaArray.sort((a, b) => {
    const priorityA = priorityOrder.indexOf(a)
    const priorityB = priorityOrder.indexOf(b)
    
    // If both are in priority list, sort by priority
    if (priorityA !== -1 && priorityB !== -1) {
      return priorityA - priorityB
    }
    
    // If only one is in priority list, prioritize it
    if (priorityA !== -1) return -1
    if (priorityB !== -1) return 1
    
    // If neither is in priority list, sort alphabetically
    return a.localeCompare(b)
  })
}

// Get criterion label for ALL tab (looks across all categories for the best match)
export function getCriterionLabelForAll(tagId: string, categories: Category[]): string {
  // Try to find the label from EB1A first (most comprehensive)
  const eb1aCategory = categories.find(c => c.id === 'cat-eb1a')
  if (eb1aCategory) {
    for (const series of eb1aCategory.series) {
      const tag = series.tagSet.tags.find(t => t.id === tagId)
      if (tag) return tag.label
    }
  }
  
  // Fallback to any category that has this tag
  for (const category of categories) {
    for (const series of category.series) {
      const tag = series.tagSet.tags.find(t => t.id === tagId)
      if (tag) return tag.label
    }
  }
  
  return tagId
}

// Sort courses within a criterion group by series order
export function sortCoursesBySeries(courses: Course[], categories: Category[]): Course[] {
  const seriesOrder = new Map<string, number>()
  
  // Create series order map
  categories.forEach(category => {
    category.series.forEach((series, index) => {
      seriesOrder.set(series.id, index)
    })
  })
  
  return courses.sort((a, b) => {
    const orderA = seriesOrder.get(a.seriesId) ?? 999
    const orderB = seriesOrder.get(b.seriesId) ?? 999
    return orderA - orderB
  })
}