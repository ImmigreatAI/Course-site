// app/page.tsx
// ============================================
// Improved home page with shadcn/ui carousel for testimonials
// Consistent card sizes, smooth animations, and better responsiveness

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { ArrowRight, BookOpen, Clock, BarChart3, DollarSign, Star, ChevronLeft, ChevronRight } from 'lucide-react'

// Rating Stars Component (unchanged)
function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="relative w-4 h-4 mr-0.5">
          <Star
            className={`absolute inset-0 w-4 h-4 ${i < full ? 'text-yellow-400' : 'text-gray-300'}`}
            aria-hidden
            fill={i < full ? 'currentColor' : 'none'}
          />
          {half && i === full && (
            <Star
              className="absolute inset-0 w-4 h-4 text-yellow-400"
              aria-hidden
              fill="currentColor"
              style={{ clipPath: 'inset(0 50% 0 0)' }}
            />
          )}
        </div>
      ))}
      <span className="ml-2 text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
    </div>
  )
}

// Testimonial data
const testimonials = [
  {
    id: 1,
    name: 'Sarah Chen',
    location: 'San Francisco, CA',
    rating: 4.5,
    content:
      'The EB-1A course was incredibly detailed and helped me understand exactly what I needed for my petition. The step-by-step guidance made the complex process manageable.',
  },
  {
    id: 2,
    name: 'Ahmed Hassan',
    location: 'Austin, TX',
    rating: 5.0,
    content:
      'immigreat.ai provided the clarity I needed for my green card journey. The courses are well-structured and the content is always up-to-date with current policies.',
  },
  {
    id: 3,
    name: 'Maria Rodriguez',
    location: 'Miami, FL',
    rating: 4.5,
    content:
      'As someone who was completely new to the immigration process, these courses gave me the confidence to navigate my application successfully. Highly recommended!',
  },
  {
    id: 4,
    name: 'David Kim',
    location: 'Seattle, WA',
    rating: 5.0,
    content:
      'The comprehensive coverage and practical examples helped me prepare my documents efficiently. The course structure is excellent and worth every penny.',
  },
  {
    id: 5,
    name: 'Lisa Wang',
    location: 'New York, NY',
    rating: 4.5,
    content:
      'Expert guidance throughout my entire journey. The instructors are knowledgeable and the community support is invaluable for navigating complex requirements.',
  },
  {
    id: 6,
    name: 'John Martinez',
    location: 'Chicago, IL',
    rating: 5.0,
    content:
      'Best investment I made for my immigration journey. The detailed walkthroughs and real-world examples made everything clear and achievable.',
  },
]

// Improved Testimonial Carousel Component
function TestimonialCarousel() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  return (
    <section
      className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-20 overflow-hidden"
      role="region"
      aria-labelledby="testimonials-heading"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 blur-3xl -translate-x-48 -translate-y-48 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-400 to-indigo-400 blur-3xl translate-x-48 translate-y-48 animate-pulse" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-br from-indigo-400 to-purple-400 blur-2xl -translate-y-32 opacity-60" />
        <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-gradient-to-br from-pink-400 to-purple-400 blur-2xl translate-y-16 opacity-40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-bold text-white mb-2">
            Trusted by Thousands of
          </h2>
          <h3 className="text-2xl md:text-3xl font-semibold text-purple-200">Happy Customers</h3>
        </div>

        {/* Carousel - removed built-in navigation buttons */}
        <Carousel
          setApi={setApi}
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {testimonials.map((testimonial) => (
              <CarouselItem key={testimonial.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                <div className="h-full">
                  <Card className="h-full bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
                    <CardContent className="p-6 h-full flex flex-col">
                      {/* Avatar and Info */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg flex-shrink-0">
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {testimonial.name}
                          </h4>
                          <p className="text-gray-500 text-sm">
                            {testimonial.location}
                          </p>
                          <div className="mt-2">
                            <RatingStars rating={testimonial.rating} />
                          </div>
                        </div>
                      </div>
                      
                      {/* Testimonial Content */}
                      <blockquote className="flex-1">
                        <p className="text-gray-700 leading-relaxed italic">
                          &quot;{testimonial.content}&quot;
                        </p>
                      </blockquote>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Bottom Navigation Container */}
        <div className="flex justify-between items-center mt-8 px-4 lg:px-0">
          {/* Dot Indicators - Bottom Left */}
          <div className="flex gap-2">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                aria-label={`Go to testimonial ${index + 1}`}
                aria-current={current === index + 1}
                className={`rounded-full transition-all duration-300 ${
                  current === index + 1
                    ? 'w-8 h-2 bg-white shadow-lg'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          {/* Navigation Arrows - Bottom Right */}
          <div className="flex gap-2">
            <button
              onClick={() => api?.scrollPrev()}
              aria-label="Previous testimonials"
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 hover:border-white transition-all duration-300 hover:scale-110 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => api?.scrollNext()}
              aria-label="Next testimonials"
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 hover:border-white transition-all duration-300 hover:scale-110 flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Your Path to
            <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Immigration Success
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Expert-curated courses designed to guide you through your green card journey with confidence and clarity.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/courses">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl px-8 py-4 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <BookOpen className="w-5 h-5 mr-2" />
                Browse Courses
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 rounded-xl px-8 py-4 text-lg font-medium transition-all duration-300 hover:scale-105"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose immigreat.ai?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We make immigration education accessible, practical, and effective for your self-paced journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature Cards */}
          <Card className="backdrop-blur-xl bg-white/60 border border-purple-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mx-auto mb-4 shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Self-Paced</h3>
              <p className="text-gray-600 leading-relaxed">Learn at your own pace with flexible scheduling that fits your busy lifestyle.</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/60 border border-purple-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mx-auto mb-4 shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">In-Depth & Detailed</h3>
              <p className="text-gray-600 leading-relaxed">Comprehensive coverage of every aspect with detailed explanations and practical examples.</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/60 border border-purple-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mx-auto mb-4 shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Data-Backed</h3>
              <p className="text-gray-600 leading-relaxed">Content based on real success stories and current immigration data and trends.</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/60 border border-purple-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mx-auto mb-4 shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Affordable Plans</h3>
              <p className="text-gray-600 leading-relaxed">Cost-effective pricing options to support your immigration journey without breaking the bank.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonial Carousel */}
      <TestimonialCarousel />

      {/* Final CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="backdrop-blur-xl bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-200/40 shadow-2xl">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ready to Start Your Journey?</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of successful applicants who have achieved their immigration goals with our comprehensive courses.
            </p>
            <Link href="/courses">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl px-10 py-4 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <BookOpen className="w-5 h-5 mr-2" />
                Explore Courses
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}