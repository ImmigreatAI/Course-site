import { Course } from '@/types';

export const courseData: Course= {
  id: "course-001",
  title: "Complete Web Development Bootcamp",
  description: "Learn full-stack web development from scratch with hands-on projects and real-world applications.",
  image: "/course-thumbnail.jpg", // Add your course image
  instructor: "John Doe",
  originalPrice: 199,
  plans: [
    {
      id: "green-card-duplicate-course",
      name: "green card duplicate course",
      duration: 7,
      durationType: "days",
      price: 29,
      stripePriceId: "price_1RoAKO4ZCTDn2SPMaNxCQs6l", // Replace with actual Stripe price ID
      popular: false
    },
    {
      id: "ultimate-green-card-roadmap",
      name: "Ultimate Green Card Roadmap",
      duration: 6,
      durationType: "months", 
      price: 99,
      stripePriceId: "price_1RoAKQ4ZCTDn2SPMuNh9bcZ6", // Replace with actual Stripe price ID
      popular: true,
      isDefault: true
    }
  ]
};