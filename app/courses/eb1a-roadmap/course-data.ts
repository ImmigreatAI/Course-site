// app/courses/eb1a-roadmap/course-data.ts
// ============================================
// Static data for EB-1A course

import { 
  Video, 
  FileText, 
  Download, 
  MessageCircle, 
  Clock 
} from 'lucide-react'
import { CourseData, CourseContent, RelatedCourse } from './types'

// Main course data
export const courseData: CourseData = {
  course: {
    Unique_id: "ultimate-eb1a-roadmap",
    name: "EB-1A Green Card Roadmap",
    description: "Complete step-by-step guide to securing your EB-1A green card through extraordinary ability demonstration",
    category: "course"
  },
  plans: [
    {
      label: "6mo" as const,
      price: 199,
      category: "course" as const,
      type: "paid" as const,
      enrollment_id: "ultimate-eb1a-roadmap",
      stripe_price_id: "price_1RqbKR4ZCTDn2SPMMOawPzi2",
      url: "https://courses.getgreencardonyourown.com/path-player?courseid=ultimate-eb1a-roadmap"
    },
    {
      label: "7day" as const,
      price: 79,
      category: "course" as const,
      type: "paid" as const,
      enrollment_id: "utmimate-eb1a-duplicate",
      stripe_price_id: "price_1RqbLl4ZCTDn2SPMjPIPiyA7",
      url: "https://courses.getgreencardonyourown.com/path-player?courseid=utmimate-eb1a-duplicate"
    }
  ]
}

// Course content data
export const courseContent: CourseContent = {
  highlights: [
    "Step-by-step EB-1A petition preparation",
    "Evidence collection strategies",
    "Legal document templates",
    "Expert review process",
    "Community support access"
  ],
  includes: [
    { icon: Video, text: "12+ hours of video content" },
    { icon: FileText, text: "50+ document templates" },
    { icon: Download, text: "Downloadable resources" },
    { icon: Clock, text: "Access period based on plan selected" }
  ],
  curriculum: [
    {
      module: "Module 1: Understanding EB-1A",
      description: "Master the fundamentals of EB-1A eligibility and create a winning strategy for your petition.",
      lessons: [
        { type: "video", title: "EB-1A vs Other Green Card Categories", duration: "15 min" },
        { type: "video", title: "Extraordinary Ability Criteria Deep Dive", duration: "22 min" },
        { type: "template", title: "Self-Assessment Checklist", duration: "Template" },
        { type: "video", title: "Success Rate Analysis & Case Studies", duration: "18 min" },
        { type: "attachment", title: "Timeline Planning Worksheet", duration: "PDF" }
      ]
    },
    {
      module: "Module 2: Evidence Collection",
      description: "Learn proven strategies to collect and organize compelling evidence for your extraordinary ability claim.",
      lessons: [
        { type: "video", title: "The 10 Evidence Categories Explained", duration: "25 min" },
        { type: "video", title: "Building Your Case Strategy", duration: "20 min" },
        { type: "template", title: "Evidence Collection Templates", duration: "5 Templates" },
        { type: "video", title: "Documentation Best Practices", duration: "17 min" },
        { type: "attachment", title: "Common Pitfalls Guide", duration: "PDF" }
      ]
    },
    {
      module: "Module 3: Petition Preparation", 
      description: "Complete step-by-step guide to preparing and filing your I-140 petition with supporting documentation.",
      lessons: [
        { type: "video", title: "Form I-140 Complete Walkthrough", duration: "30 min" },
        { type: "template", title: "I-140 Form Templates", duration: "Template" },
        { type: "video", title: "Supporting Documentation Strategy", duration: "28 min" },
        { type: "template", title: "Recommendation Letter Templates", duration: "3 Templates" },
        { type: "video", title: "Legal Review Process", duration: "15 min" }
      ]
    },
    {
      module: "Module 4: Submission & Follow-up",
      description: "Navigate the submission process and handle USCIS communications with confidence.",
      lessons: [
        { type: "video", title: "Filing Your Petition - Step by Step", duration: "20 min" },
        { type: "template", title: "Submission Checklist", duration: "Template" },
        { type: "video", title: "Understanding USCIS Communication", duration: "18 min" },
        { type: "video", title: "RFE Response Strategies", duration: "25 min" },
        { type: "attachment", title: "Follow-up Timeline Guide", duration: "PDF" }
      ]
    }
  ],
}

// Related courses data
export const relatedCourses: RelatedCourse[] = [
  {
    id: "eb2-niw-guide",
    title: "EB-2 NIW Complete Guide",
    description: "National Interest Waiver pathway for advanced degree professionals",
    price: 247,
    rating: 4.8,
    students: 892
  },
  {
    id: "o1-visa-masterclass",
    title: "O-1 Visa Masterclass",
    description: "Extraordinary ability work visa for immediate US entry",
    price: 197,
    rating: 4.9,
    students: 634
  },
  {
    id: "ultimate-eb2-niw-roadmap",
    title: "NIW Part 2  Guide",
    description: "Complete NIW green card process",
    price: 167,
    rating: 4.7,
    students: 523
  }
]