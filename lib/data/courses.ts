// lib/data/courses.ts
export interface CourseData {
  course: {
    id: string
    name: string
    description: string
    url: string
    category: "course" | "bundle"
    type: "paid" | "free"
    package?: string[]
  }
  plan: {
    label: string
    price: number
    school_id: string
  }
  stripe_price_id: string | null
}

export const coursesData: CourseData[] = [
  {
    course: {
      id: "ultimate-green-card-roadmap",
      name: "Ultimate Green Card Roadmap",
      description: "A guide for individuals for exploring right green card for them and its roadmap",
      url: "https://gcpathways.learnworlds.com/course/ultimate-green-card-roadmap",
      category: "course",
      type: "paid"
    },
    plan: {
      label: "6mo",
      price: 199,
      school_id: "school_ugc_6mo"
    },
    stripe_price_id: "price_ugc_6mo"
  },
  {
    course: {
      id: "ultimate-green-card-roadmap",
      name: "Ultimate Green Card Roadmap",
      description: "A guide for individuals for exploring right green card for them and its roadmap",
      url: "https://gcpathways.learnworlds.com/course/ultimate-green-card-roadmap",
      category: "course",
      type: "paid"
    },
    plan: {
      label: "7day",
      price: 79,
      school_id: "school_ugc_7day"
    },
    stripe_price_id: "price_ugc_7day"
  },
  {
    course: {
      id: "ultimate-eb1a-roadmap",
      name: "Ultimate EB1A Roadmap",
      description: "Guide to build resume & petition for EB1A self‑petitioners",
      url: "https://gcpathways.learnworlds.com/course/ultimate-eb1a-roadmap",
      category: "course",
      type: "paid"
    },
    plan: {
      label: "6mo",
      price: 199,
      school_id: "school_eb1a_6mo"
    },
    stripe_price_id: "price_eb1a_6mo"
  },
  {
    course: {
      id: "ultimate-eb1a-roadmap",
      name: "Ultimate EB1A Roadmap",
      description: "Guide to build resume & petition for EB1A self‑petitioners",
      url: "https://gcpathways.learnworlds.com/course/ultimate-eb1a-roadmap",
      category: "course",
      type: "paid"
    },
    plan: {
      label: "7day",
      price: 79,
      school_id: "school_eb1a_7day"
    },
    stripe_price_id: "price_eb1a_7day"
  },
  {
    course: {
      id: "ultimate-eb2-niw-roadmap",
      name: "Ultimate EB2-NIW Roadmap",
      description: "Guide to build resume & petition for EB2‑NIW self‑petitioners",
      url: "https://gcpathways.learnworlds.com/course/ultimate-eb2-niw-roadmap",
      category: "course",
      type: "free"
    },
    plan: {
      label: "6mo",
      price: 0,
      school_id: "school_eb2_6mo"
    },
    stripe_price_id: "price_eb2_6mo"
  },
  {
    course: {
      id: "ultimate-eb2-niw-roadmap",
      name: "Ultimate EB2-NIW Roadmap",
      description: "Guide to build resume & petition for EB2‑NIW self‑petitioners",
      url: "https://gcpathways.learnworlds.com/course/ultimate-eb2-niw-roadmap",
      category: "course",
      type: "free"
    },
    plan: {
      label: "7day",
      price: 0,
      school_id: "school_eb2_7day"
    },
    stripe_price_id: "price_eb2_7day"
  },
  {
    course: {
      id: "eb1a-bundle",
      name: "EB1A Bundle",
      description: "Perfect bundle covering basics to petition filing",
      url: "https://gcpathways.learnworlds.com/program/eb1a-bundle",
      category: "bundle",
      type: "paid",
      package: [
        "school_eb1a_6mo",
        "school_eb2_6mo"
      ]
    },
    plan: {
      label: "6mo",
      price: 299,
      school_id: "school_bundle_6mo"
    },
    stripe_price_id: "price_bundle_6mo"
  }
]

// Helper function to get grouped courses
export function getGroupedCourses() {
  const grouped = new Map<string, CourseData[]>()
  
  coursesData.forEach(item => {
    const courseId = item.course.id
    if (!grouped.has(courseId)) {
      grouped.set(courseId, [])
    }
    grouped.get(courseId)!.push(item)
  })
  
  return Array.from(grouped.values())
}