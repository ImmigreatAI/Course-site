import { 
  CoursePlan, 
  LearnWorldEnrollmentData, 
  LearnWorldEnrollmentResponse 
} from '@/types';

export async function enrollUserInCourse(
  userId: string, 
  userEmail: string, 
  productId: string, 
  plan: CoursePlan
): Promise<LearnWorldEnrollmentResponse> {
  console.log('🎓 Starting LearnWorld enrollment process...');
  console.log('📋 Enrollment details:', {
    userId,
    userEmail,
    productId,
    plan: {
      name: plan.name,
      duration: plan.duration,
      durationType: plan.durationType,
      price: plan.price
    }
  });

  try {
    const enrollmentData: LearnWorldEnrollmentData = {
      productId: plan.id,
      productType: 'course',
      justification: `Enrollment via course purchase - ${plan.name}`,
      price: plan.price,
      // duration_type: plan.durationType,
      // duration: plan.duration,
      send_enrollment_email: true
    };

    console.log('📤 Sending enrollment data to LearnWorld:', enrollmentData);
    console.log('🔗 LearnWorld API URL:', `${process.env.LEARNWORLD_API_URL}/v2/users/${userEmail}/enrollment`);

    const response = await fetch(`${process.env.LEARNWORLD_API_URL}/v2/users/${userEmail}/enrollment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LEARNWORLD_BEARER_TOKEN}`,
        'Lw-Client': process.env.LEARNWORLD_CLIENT_ID || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(enrollmentData)
    });

    console.log('📥 LearnWorld API response status:', response.status);
    console.log('📥 LearnWorld API response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ LearnWorld API error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Unknown error' };
      }
      
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ LearnWorld enrollment successful:', data);
    
    return {
      success: data.success,
      data: data
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ LearnWorld enrollment error:', errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }
}