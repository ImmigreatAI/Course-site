'use client'

import React, { useState } from 'react'
import { 
  TabBar, 
  FilterDropdown,
  CourseCard, 
  SeriesCard,
  EmptyState 
} from './CourseComponents'
import { 
  createFullCatalog,
  useFilteredCourses,
  getCategoryById,
  getCriterionLabel,
  getCriterionLabelForAll,
  getAllCriteriaInOrder,
  sortCoursesBySeries
} from './CourseDemoUtils'
import { Selection } from './CourseDemoData'

// Create the full catalog with all courses
const catalog = createFullCatalog()

// Main Component
export function CourseCatalog() {
  const [activeTab, setActiveTab] = useState(catalog.ui.defaultTab)
  const [selection, setSelection] = useState<Selection>({})
  const [showFilters, setShowFilters] = useState(false)

  const { 
    list: filtered, 
    activeCategoryId, 
    hasAnySelections, 
    groupedByCriterion,
    shouldGroupByCriterion
  } = useFilteredCourses(activeTab, selection, catalog.courses, catalog.categories)

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    setSelection({})
  }

  const handleFilterToggle = () => {
    setShowFilters(s => !s)
  }

  const handleSeriesClick = (categoryId: string, seriesId: string) => {
    const category = getCategoryById(catalog.categories, categoryId)
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

  // Rendering helpers - Updated for criterion-based grouping
  const renderCriterionGroups = () => {
    if (!shouldGroupByCriterion || groupedByCriterion.size === 0) {
      return renderCategoryGroups() // Fallback to category grouping
    }

    // For ALL tab, use ordered criteria list. For specific categories, use whatever is available
    const isAllTab = activeCategoryId === 'all'
    const criteriaToShow = isAllTab 
      ? getAllCriteriaInOrder(catalog.categories).filter(tagId => groupedByCriterion.has(tagId))
      : Array.from(groupedByCriterion.keys())

    const sections = criteriaToShow.map(tagId => {
      const courses = groupedByCriterion.get(tagId)
      if (!courses || courses.length === 0) return null

      const sortedCourses = sortCoursesBySeries(courses, catalog.categories)
      const criterionLabel = isAllTab 
        ? getCriterionLabelForAll(tagId, catalog.categories)
        : getCriterionLabel(tagId, activeCategoryId as string, catalog.categories)

      return (
        <section key={tagId} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200/30 rounded-xl px-4 py-2">
              {criterionLabel}
            </h2>
            <span className="text-sm text-gray-500">{courses.length} courses</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedCourses.map(course => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    const category = getCategoryById(catalog.categories, activeCategoryId as string)
    if (!category) return []

    // If we have criterion grouping available, use that instead
    if (shouldGroupByCriterion && groupedByCriterion.size > 0) {
      return renderCriterionGroups()
    }

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          {/* Updated grid for 2 cards per row on mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
  
  // Choose rendering method based on state
  let sections
  if (isSeriesOverview) {
    sections = renderSeriesOverview()
  } else if (isAll) {
    // ALL tab always uses criterion-based grouping
    sections = renderCriterionGroups()
  } else {
    sections = renderSeriesGroups()
  }

  return (
    <div className="backdrop-blur-xl bg-white/80 border border-purple-200/30 rounded-2xl shadow-lg p-6 md:p-8">
      <TabBar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        showFilters={showFilters}
        onToggleFilters={handleFilterToggle}
        navTabs={catalog.ui.navTabs}
      />

      {/* Filter Dropdown */}
      {!isSeriesOverview && (
        <FilterDropdown
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          activeCategoryId={activeCategoryId as string}
          selection={selection}
          setSelection={setSelection}
          categories={catalog.categories}
        />
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