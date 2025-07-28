export interface CoursePlan {
  id: string;
  name: string;
  duration: number;
  durationType: 'days' | 'weeks' | 'months';
  price: number;
  stripePriceId: string;
  popular?: boolean;
  isDefault?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  instructor: string;
  originalPrice: number;
  plans: CoursePlan[];
}

export interface CheckoutSessionData {
  planId: string;
  courseId: string;
  userId: string;
  userEmail: string;
  userName: string;
}

export interface LearnWorldEnrollmentData {
  productId: string;
  productType: 'course' | 'bundle' | 'subscription';
  justification?: string | null;
  price: number;
  duration_type?: 'days' | 'weeks' | 'months';
  duration?: number;
  send_enrollment_email?: boolean | null;
}

export interface LearnWorldEnrollmentResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface StripeMetadata {
  userId: string;
  userEmail: string;
  userName: string;
  courseId: string;
  planId: string;
  planName: string;
  planDuration: string;
  planDurationType: string;
  [key: string]: string; // Index signature for Stripe compatibility
}