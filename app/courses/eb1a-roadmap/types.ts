// app/courses/eb1a-roadmap/types.ts
// ============================================
// Type definitions for EB-1A course components

import React from 'react'

export interface Lesson {
  type: 'video' | 'template' | 'attachment'
  title: string
  duration: string
}

export interface Module {
  module: string
  description: string
  lessons: Lesson[]
}

export interface CourseInclude {
  icon: React.ComponentType<{ className?: string }>
  text: string
}

export interface CourseContent {
  highlights: string[]
  includes: CourseInclude[]
  curriculum: Module[]
}

export interface CoursePlan {
  label: "6mo" | "7day"
  price: number
  category: "course"
  type: "paid"
  enrollment_id: string
  stripe_price_id: string
  url: string
}

export interface Course {
  Unique_id: string
  name: string
  description: string
  category: string
}

export interface CourseData {
  course: Course
  plans: CoursePlan[]
}

export interface RelatedCourse {
  id: string
  title: string
  description: string
  price: number
  rating: number
  students: number
}