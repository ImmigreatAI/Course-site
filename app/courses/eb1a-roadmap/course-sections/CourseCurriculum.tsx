// app/courses/eb1a-roadmap/course-sections/CourseCurriculum.tsx
// ============================================
// Course Curriculum Section Component

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Video, 
  FileText, 
  Paperclip, 
  Play 
} from 'lucide-react'
import { Module } from '../types'

interface CourseCurriculumProps {
  curriculum: Module[]
}

export function CourseCurriculum({ curriculum }: CourseCurriculumProps) {
  const [expandedModules, setExpandedModules] = useState<{[key: number]: boolean}>({})

  const toggleModule = (moduleIndex: number) => {
    setExpandedModules((prev: {[key: number]: boolean}) => ({
      ...prev,
      [moduleIndex]: !prev[moduleIndex]
    }))
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video
      case 'template': return FileText
      case 'attachment': return Paperclip
      default: return Play
    }
  }

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'text-blue-600'
      case 'template': return 'text-green-600'
      case 'attachment': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Card className="backdrop-blur-xl bg-white/80 border border-purple-200/30 shadow-lg">
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <BookOpen className="w-5 sm:w-6 h-5 sm:h-6 mr-3 text-purple-600" />
          Course Curriculum
        </h2>
        <div className="space-y-4">
          {curriculum.map((module, index) => (
            <div key={index} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleModule(index)}
                className="w-full p-3 sm:p-4 text-left hover:bg-gray-50 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{module.module}</h4>
                    <p className="text-xs sm:text-sm text-gray-600">{module.description}</p>
                  </div>
                  {expandedModules[index] ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </div>
              </button>
              
              {expandedModules[index] && (
                <div className="border-t border-gray-200 p-3 sm:p-4">
                  <div className="space-y-3">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const IconComponent = getContentTypeIcon(lesson.type)
                      return (
                        <div key={lessonIndex} className="flex items-center justify-between py-2">
                          <div className="flex items-center flex-1 pr-4">
                            <IconComponent className={`w-4 h-4 mr-3 flex-shrink-0 ${getContentTypeColor(lesson.type)}`} />
                            <span className="text-gray-700 font-medium text-sm sm:text-base">{lesson.title}</span>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                            {lesson.duration}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}