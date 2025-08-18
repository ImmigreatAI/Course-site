// app/courses/eb1a-roadmap/course-sections/VideoPreview.tsx
// ============================================
// Video Preview Section Component

import { Card, CardContent } from '@/components/ui/card'

export function VideoPreview() {
  return (
    <Card className="backdrop-blur-xl bg-white/80 border border-purple-200/30 shadow-lg">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-gray-900 rounded-t-xl overflow-hidden">
          <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/TBIjgBVFjVI?si=OPgDYK8Pv6QS6F52&controls=1&rel=0&showinfo=0" 
            title="EB-1A Course Preview" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerPolicy="strict-origin-when-cross-origin" 
            allowFullScreen
            className="rounded-t-xl"
          />
        </div>
        <div className="p-4 bg-white">
          <h3 className="font-semibold text-gray-900 mb-1">Course Preview</h3>
          <p className="text-sm text-gray-600">Get a glimpse of what you&apos;ll learn in this comprehensive EB-1A course</p>
        </div>
      </CardContent>
    </Card>
  )
}