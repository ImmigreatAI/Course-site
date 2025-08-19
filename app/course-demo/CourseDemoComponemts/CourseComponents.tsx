'use client'

import React from 'react'
import { Filter, Users, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  NavTab, 
  Category, 
  Course, 
  Selection,
  SERIES_BG_COLORS 
} from './CourseDemoData'

// Helper function (moved here to avoid circular import)
const getCategoryById = (categories: Category[], id: string): Category | undefined => 
  categories.find(c => c.id === id)

// Tab Bar Component
interface TabBarProps {
  activeTab: string
  setActiveTab: (id: string) => void
  showFilters: boolean
  onToggleFilters: () => void
  navTabs: NavTab[]
}

export function TabBar({ 
  activeTab, 
  setActiveTab, 
  showFilters, 
  onToggleFilters,
  navTabs 
}: TabBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 text-sm">
        {navTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-xl font-medium transition-all duration-300",
              activeTab === tab.id
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                : "bg-white/60 backdrop-blur-sm border border-purple-200/30 text-gray-700 hover:bg-purple-50 hover:border-purple-300 hover:scale-105"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Toggle */}
      <button
        onClick={onToggleFilters}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105",
          showFilters
            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
            : "bg-white/60 backdrop-blur-sm border border-purple-200/30 text-gray-700 hover:bg-purple-50 hover:border-purple-300"
        )}
      >
        <Filter className="w-4 h-4" />
        Filters
      </button>
    </div>
  )
}

// Filter Dropdown Component
interface FilterDropdownProps {
  isOpen: boolean
  onClose: () => void
  activeCategoryId: string
  selection: Selection
  setSelection: React.Dispatch<React.SetStateAction<Selection>>
  categories: Category[]
}

export function FilterDropdown({
  isOpen,
  onClose,
  activeCategoryId,
  selection,
  setSelection,
  categories
}: FilterDropdownProps) {
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const category = getCategoryById(categories, activeCategoryId)

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const toggle = (seriesId: string, tagId: string) => {
    setSelection(prev => {
      const next: Selection = { ...prev }
      const set = new Set(next[seriesId] ?? [])
      if (set.has(tagId)) {
        set.delete(tagId)
      } else {
        set.add(tagId)
      }
      next[seriesId] = set
      return next
    })
  }

  const clearAll = () => setSelection({})

  if (!category) {
    return (
      <div
        ref={dropdownRef}
        className={cn(
          "fixed z-50",
          "bg-white/95 backdrop-blur-xl border border-purple-200/60 rounded-2xl shadow-2xl shadow-purple-100/50",
          "animate-in slide-in-from-top-2 fade-in-0 zoom-in-95 duration-200",
          "top-24 left-4 right-4",
          "lg:left-8 lg:right-8 xl:left-16 xl:right-16",
          "max-h-[calc(100vh-8rem)] overflow-hidden"
        )}
      >
        <div className="p-6 text-center">
          <p className="text-sm text-gray-600">
            Select a category to view available filtering options.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "fixed z-50",
        "bg-white/95 backdrop-blur-xl border border-purple-200/60 rounded-2xl shadow-2xl shadow-purple-100/50",
        "animate-in slide-in-from-top-2 fade-in-0 zoom-in-95 duration-200",
        "top-24 left-4 right-4",
        "lg:left-8 lg:right-8 xl:left-16 xl:right-16",
        "max-h-[calc(100vh-8rem)] overflow-hidden"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-purple-100/60 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Filter {category.name} Courses
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={clearAll}
            className="text-sm text-purple-600 hover:text-purple-700 hover:underline font-medium"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            aria-label="Close filters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Content */}
      <div className="max-h-[60vh] lg:max-h-[500px] overflow-y-auto p-4">
        <div className="space-y-6">
          {category.series.map(series => {
            return (
              <div key={series.id} className="space-y-3">
                {/* Series Title */}
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Filter by {series.name}
                </h4>
                
                {/* Horizontal Tag Flow - Smaller buttons */}
                <div className="flex flex-wrap gap-2">
                  {series.tagSet.tags.map(tag => {
                    const checked = selection[series.id]?.has(tag.id) ?? false
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggle(series.id, tag.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
                          checked
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-md"
                            : "bg-white border-gray-300 text-gray-700 hover:border-purple-300 hover:bg-purple-50"
                        )}
                      >
                        {tag.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Enhanced Course Card Component with tags on image
interface CourseCardProps {
  course: Course
  categories: Category[]
}

export function CourseCard({ course, categories }: CourseCardProps) {
  const category = categories.find(c => c.id === course.categoryId)
  const series = category?.series.find(s => s.id === course.seriesId)
  const tag = series?.tagSet.tags.find(t => t.id === course.tagId)

  return (
    <div className="backdrop-blur-xl bg-white/80 border border-purple-200/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden flex flex-col">
      {/* Thumbnail with overlay tags */}
      {course.thumbnailUrl && (
        <div className="relative aspect-video w-full bg-gray-100">
          <img 
            src={course.thumbnailUrl} 
            alt={course.title} 
            className="w-full h-full object-cover" 
          />
          {/* Tags overlay */}
          <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2">
            {category && (
              <span className="px-2 py-1 bg-purple-600/90 backdrop-blur-sm text-white rounded-full text-xs font-medium">
                {category.name}
              </span>
            )}
            {series && (
              <span className="px-2 py-1 bg-pink-600/90 backdrop-blur-sm text-white rounded-full text-xs font-medium">
                {series.name}
              </span>
            )}
          </div>
          {/* Criterion tag at bottom */}
          {tag && (
            <div className="absolute bottom-3 left-3 right-3">
              <span className="inline-block px-3 py-1 bg-white/95 backdrop-blur-sm text-gray-800 rounded-full text-xs font-medium shadow-sm">
                {tag.label}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-tight text-gray-900 text-sm">
            {course.title}
          </h3>
          <div className="text-sm font-medium text-purple-600 whitespace-nowrap">
            ${course.price.amount}
          </div>
        </div>

        {/* Description */}
        {course.description && (
          <p className="text-sm text-gray-700 line-clamp-3 flex-1">
            {course.description}
          </p>
        )}

        <div className="pt-1 mt-auto">
          <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-105">
            Add to cart — ${course.price.amount}
          </button>
        </div>
      </div>
    </div>
  )
}

// Enhanced Series Card Component - 2 per row on mobile
interface SeriesCardProps {
  seriesId: string
  title: string
  description?: string
  onClick?: () => void
}

export function SeriesCard({ seriesId, title, description, onClick }: SeriesCardProps) {
  const getSeriesBg = (id: string): string => {
    return SERIES_BG_COLORS[id] || 'bg-purple-50'
  }

  return (
    <div
      role="button"
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-2xl p-4 sm:p-6 border border-purple-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] h-32 sm:h-40 flex flex-col justify-between",
        getSeriesBg(seriesId)
      )}
    >
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 group-hover:text-purple-700 transition-colors duration-200 line-clamp-2">
            {title}
          </h3>
          {description && (
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 sm:mt-4">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="w-3 h-3" />
            <span className="hidden sm:inline">Multiple courses</span>
            <span className="sm:hidden">Courses</span>
          </div>
          <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Empty State Component
export function EmptyState() {
  return (
    <div className="text-center py-16 backdrop-blur-xl bg-white/60 border border-purple-200/30 rounded-2xl">
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded-2xl blur-xl opacity-75" />
        <div className="relative">
          <BookOpen className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Try adjusting your filters or explore different categories to find the courses you&apos;re looking for.
          </p>
        </div>
      </div>
    </div>
  )
}