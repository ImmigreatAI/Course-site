// app/about/page.tsx
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          About immigreat.ai
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 leading-relaxed mb-6">
            Welcome to immigreat.ai, your trusted partner in navigating the complex journey of immigration to the United States.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            We&apos;re dedicated to democratizing access to immigration knowledge and empowering individuals to pursue their American Dream through education and guidance.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">What We Offer</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li>Comprehensive courses on various green card pathways</li>
            <li>Expert-curated content from immigration professionals</li>
            <li>Step-by-step guidance for self-petitioners</li>
            <li>Up-to-date information on immigration policies and procedures</li>
          </ul>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Why Choose Us</h2>
          <p className="text-gray-600 leading-relaxed">
            With years of experience in immigration education, we&apos;ve helped thousands of individuals understand their options and successfully navigate their immigration journey. Our courses are designed to be accessible, comprehensive, and practical.
          </p>
        </div>
      </div>
    </div>
  )
}