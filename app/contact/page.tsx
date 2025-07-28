// app/contact/page.tsx
export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Contact Us
        </h1>
        
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-purple-100/30">
          <p className="text-gray-600 mb-8 text-center">
            Have questions about our courses or need assistance? We&apos;re here to help!
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Get in Touch</h2>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-gray-700">Email</p>
                  <p className="text-gray-600">support@immigreat.ai</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Response Time</p>
                  <p className="text-gray-600">We typically respond within 24-48 hours</p>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Office Hours</h2>
              <div className="space-y-2 text-gray-600">
                <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                <p>Saturday: 10:00 AM - 4:00 PM EST</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-purple-50/50 rounded-2xl">
            <p className="text-center text-gray-700">
              For technical support or billing inquiries, please include your order number in your message.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}