//app/courses/page.tsx
import { CourseCard } from '@/components/CourseCard'
import { getAllCourses } from '@/lib/data/courses'

export default function CoursesPage() {
  const courses = getAllCourses()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Courses
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose from our comprehensive selection of immigration courses designed to guide you through your green card journey
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {courses.map((course) => (
            <CourseCard 
              key={course.course.Unique_id} 
              course={course} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}