import { Suspense } from 'react'

export const LazyWrapper = ({ children }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b8860b]"></div>
    </div>
  }>
    {children}
  </Suspense>
)

export default LazyWrapper
