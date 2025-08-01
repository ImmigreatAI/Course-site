// lib/data/courses.ts
export interface CourseData {
  course: {
    Unique_id: string
    name: string
    description: string
    package?: string[] // unique course ids for bundles
  }
  plans: {
    url: string
    category: "course" | "bundle"
    type: "paid" | "free"
    label: string        // "6mo" or "7day"
    price: number
    enrollment_id: string
    stripe_price_id: string // Made non-nullable - always required
  }[]
}

export const coursesData: CourseData[] = [
  {
    course: {
      Unique_id: "ultimate-green-card-roadmap",//prod_Sm9Y8yDI6jFLh2 , prod_Sm9aOp7MHDNLMZ
      name: "Ultimate Green Card Roadmap",
      description: "A guide for individuals for exploring right green card for them and its roadmap",
      package: []
    },
    plans: [
      {
        url: "https://gcpathways.learnworlds.com/course/ultimate-green-card-roadmap",
        category: "course",
        type: "paid",
        label: "6mo",
        price: 199,
        enrollment_id: "ultimate-green-card-roadmap",
        stripe_price_id: "price_1RqbGV4ZCTDn2SPMfidm2G38" // Placeholder - replace with actual
      },
      {
        url: "https://gcpathways.learnworlds.com/course/green-card-duplicate-course",
        category: "course",
        type: "paid",
        label: "7day",
        price: 79,
        enrollment_id: "green-card-duplicate-course",
        stripe_price_id: "price_1RqbIS4ZCTDn2SPMgJSj5pev" // Placeholder - replace with actual
      }
    ]
  },
  {
    course: {
      Unique_id: "ultimate-eb1a-roadmap",//prod_Sm9cBlk5PRsdiL ,prod_Sm9eZ9b3dekvdE
      name: "Ultimate EB1A Roadmap",
      description: "Guide to build resume & petition for EB1A self‑petitioners",
      package: []
    },
    plans: [
      {
        url: "https://gcpathways.learnworlds.com/course/ultimate-eb1a-roadmap",
        category: "course",
        type: "paid",
        label: "6mo",
        price: 199,
        enrollment_id: "ultimate-eb1a-roadmap",
        stripe_price_id: "price_1RqbKR4ZCTDn2SPMMOawPzi2" // Placeholder - replace with actual
      },
      {
        url: "https://gcpathways.learnworlds.com/course/utmimate-eb1a-duplicate",
        category: "course",
        type: "paid",
        label: "7day",
        price: 79,
        enrollment_id: "utmimate-eb1a-duplicate",
        stripe_price_id: "price_1RqbLl4ZCTDn2SPMjPIPiyA7" // Placeholder - replace with actual
      }
    ]
  },
  {
    course: {
      Unique_id: "ultimate-eb2-niw-roadmap",//prod_Sm9i3Mgn1mTdOl , prod_Sm9jYnjQz65FRK
      name: "Ultimate EB2-NIW Roadmap",
      description: "Guide to build resume & petition for EB2‑NIW self‑petitioners",
      package: []
    },
    plans: [
      {
        url: "https://gcpathways.learnworlds.com/course/ultimate-eb2-niw-roadmap",
        category: "course",
        type: "free",
        label: "6mo",
        price: 0,
        enrollment_id: "ultimate-eb2-niw-roadmap",
        stripe_price_id: "price_1RqbPY4ZCTDn2SPMJ2afpOWq" // Placeholder for free course
      },
      {
        url: "https://gcpathways.learnworlds.com/course/ultimate-eb2-niw-roadmap",
        category: "course",
        type: "free",
        label: "7day",
        price: 0,
        enrollment_id: "ultimate-eb2-niw-roadmap",
        stripe_price_id: "price_1RqbRB4ZCTDn2SPMRAEU3OsA" // Placeholder for free course
      }
    ]
  },
  {
    course: {
      Unique_id: "eb1a-bundle",//prod_Sm9geojXNAJ5aY
      name: "EB1A Bundle",
      description: "Perfect bundle covering basics to petition filing",
      package: [
        "ultimate-eb1a-roadmap",
        "ultimate-green-card-roadmap"
      ]
    },
    plans: [
      {
        url: "https://gcpathways.learnworlds.com/program/eb1a-bundle",
        category: "bundle",
        type: "paid",
        label: "6mo",
        price: 299,
        enrollment_id: "eb1a-bundle",
        stripe_price_id: "price_1RqbNd4ZCTDn2SPMQMAmbskP" // Placeholder - replace with actual
      }
    ]
  }
]

// Helper function - no longer needed since we don't group
export function getAllCourses() {
  return coursesData
}