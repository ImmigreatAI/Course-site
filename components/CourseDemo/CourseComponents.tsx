'use client'

import React from 'react'
import { Filter, ShoppingCart, Users, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
interface NavTab {
  id: string
  label: string
  categoryId: string
}

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

type Selection = Record<string, Set<string>>

// Helper function
function getCategoryById(categories: Category[], id: string): Category | undefined {
  return categories.find(c => c.id === id)
}

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
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </button>
    </div>
  )
}

// Filter Panel Component
interface FilterPanelProps {
  activeCategoryId: string
  selection: Selection
  setSelection: React.Dispatch<React.SetStateAction<Selection>>
  categories: Category[]
  isMobile?: boolean
  onClose?: () => void
}

export function FilterPanel({
  activeCategoryId,
  selection,
  setSelection,
  categories,
  isMobile = false,
  onClose
}: FilterPanelProps) {
  const category = getCategoryById(categories, activeCategoryId)

  if (!category) {
    return (
      <div className="backdrop-blur-xl bg-white/60 border border-purple-200/30 rounded-2xl p-6 mb-6">
        <p className="text-sm text-gray-600 text-center">
          Select a category to view available course filtering options.
        </p>
      </div>
    )
  }

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

  const selectAllInSeries = (seriesId: string, tags: Tag[]) => {
    setSelection(prev => ({
      ...prev,
      [seriesId]: new Set(tags.map(t => t.id))
    }))
  }

  const content = (
    <>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Filter by {category.name} Topics
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={clearAll}
            className="text-sm text-purple-600 hover:text-purple-700 hover:underline font-medium"
          >
            Clear All
          </button>
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className={cn(
        "grid gap-6",
        isMobile ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"
      )}>
        {category.series.map(series => {
          const selectedInSeries = selection[series.id]?.size || 0
          const totalInSeries = series.tagSet.tags.length

          return (
            <div key={series.id} className="backdrop-blur-sm bg-white/50 border border-purple-200/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">{series.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {selectedInSeries}/{totalInSeries}
                  </span>
                  <button
                    onClick={() => selectAllInSeries(series.id, series.tagSet.tags)}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    All
                  </button>
                </div>
              </div>

              <div className={cn(
                "space-y-2",
                !isMobile && series.tagSet.tags.length > 6 ? "max-h-48 overflow-y-auto pr-2" : ""
              )}>
                {series.tagSet.tags.map(tag => {
                  const checked = selection[series.id]?.has(tag.id) ?? false
                  return (
                    <label 
                      key={tag.id} 
                      className="flex items-center gap-3 cursor-pointer group hover:bg-purple-50/50 rounded-lg p-2 transition-colors duration-200"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500 focus:ring-2"
                        checked={checked}
                        onChange={() => toggle(series.id, tag.id)}
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">
                        {tag.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )

  if (isMobile) {
    return content
  }

  return (
    <div className="backdrop-blur-xl bg-white/60 border border-purple-200/30 rounded-2xl p-6 mb-6">
      {content}
    </div>
  )
}

// Mobile Filter Modal Component
interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  activeCategoryId: string
  selection: Selection
  setSelection: React.Dispatch<React.SetStateAction<Selection>>
  categories: Category[]
}

export function FilterModal({
  isOpen,
  onClose,
  activeCategoryId,
  selection,
  setSelection,
  categories
}: FilterModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-24 bottom-4 bg-white/95 backdrop-blur-xl border border-purple-200/60 rounded-2xl shadow-2xl shadow-purple-100/50 overflow-hidden animate-in slide-in-from-top-4 fade-in-0 zoom-in-95 duration-300">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <FilterPanel
              activeCategoryId={activeCategoryId}
              selection={selection}
              setSelection={setSelection}
              categories={categories}
              isMobile={true}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Course Card Component
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
      {/* Thumbnail */}
      {course.thumbnailUrl && (
        <div className="aspect-video w-full bg-gray-100">
          <img 
            src={course.thumbnailUrl} 
            alt={course.title} 
            className="w-full h-full object-cover" 
          />
        </div>
      )}

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-tight text-gray-900">
            {course.title}
          </h3>
          <div className="text-sm font-medium text-purple-600 whitespace-nowrap">
            ${course.price.amount}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 text-xs text-gray-700">
          {category && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
              {category.name}
            </span>
          )}
          {series && (
            <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full font-medium">
              {series.name}
            </span>
          )}
          {tag && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              {tag.label}
            </span>
          )}
        </div>

        {/* Description */}
        {course.description && (
          <p className="text-sm text-gray-700 line-clamp-4 flex-1">
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

// Series Card Component
interface SeriesCardProps {
  seriesId: string
  title: string
  description?: string
  onClick?: () => void
}

export function SeriesCard({ seriesId, title, description, onClick }: SeriesCardProps) {
  // Define background colors for different series matching the thumbnail colors
  const getSeriesBg = (id: string): string => {
    const colors: Record<string, string> = {
      's-eb1a-criteria': 'bg-sky-50',    // f0f9ff
      's-eb1a-rfe': 'bg-rose-50',        // fef2f2
      's-eb1a-final': 'bg-violet-50',    // f5f3ff
      's-eb2-prongs': 'bg-green-50',     // f0fdf4
      's-eb2-rfe': 'bg-amber-50',        // fefce8
      's-o1-criteria': 'bg-pink-50',     // fdf2f8
      's-o1-rfe': 'bg-orange-50',        // fff7ed
      's-eb5-capital': 'bg-cyan-50',     // ecfeff
      's-eb5-jobs': 'bg-blue-50'         // eff6ff
    }
    return colors[id] || 'bg-purple-50'
  }

  return (
    <div
      role="button"
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-2xl p-6 border border-purple-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] h-40 flex flex-col justify-between",
        getSeriesBg(seriesId)
      )}
    >
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors duration-200">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="w-3 h-3" />
            <span>Multiple courses</span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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