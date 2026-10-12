import React from 'react'

export const ArticleCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-4 shadow-sm border border-gray-100 animate-pulse">
      <div className="w-full h-48 bg-gray-200 rounded-xl mb-4" />
      <div className="flex items-center gap-2 mb-3">
        <div className="w-20 h-5 bg-gray-200 rounded-full" />
        <div className="w-16 h-4 bg-gray-200 rounded" />
      </div>
      <div className="w-3/4 h-6 bg-gray-200 rounded mb-2" />
      <div className="w-full h-4 bg-gray-200 rounded mb-1" />
      <div className="w-2/3 h-4 bg-gray-200 rounded mb-4" />
      <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-200 rounded-full" />
          <div className="w-20 h-4 bg-gray-200 rounded" />
        </div>
        <div className="w-16 h-4 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

export const FeaturedArticleSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 animate-pulse items-center">
      <div className="md:col-span-5 h-52 sm:h-56 md:h-60 bg-gray-200 rounded-2xl" />
      <div className="md:col-span-7 flex flex-col justify-between h-full py-1 min-h-[200px]">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-24 h-5 bg-gray-200 rounded-full" />
            <div className="w-16 h-4 bg-gray-200 rounded" />
          </div>
          <div className="w-full h-7 bg-gray-200 rounded mb-2" />
          <div className="w-4/5 h-7 bg-gray-200 rounded mb-3" />
          <div className="w-full h-4 bg-gray-200 rounded mb-1.5" />
          <div className="w-3/4 h-4 bg-gray-200 rounded" />
        </div>
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gray-200 rounded-full" />
            <div className="flex flex-col gap-1">
              <div className="w-24 h-4 bg-gray-200 rounded" />
              <div className="w-32 h-3 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="w-28 h-8 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export const ArticleDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-pulse">
      <div className="w-32 h-5 bg-gray-200 rounded mb-4" />
      <div className="w-24 h-6 bg-gray-200 rounded-full mb-3" />
      <div className="w-full h-10 bg-gray-200 rounded mb-3" />
      <div className="w-4/5 h-10 bg-gray-200 rounded mb-6" />
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="flex flex-col gap-2">
          <div className="w-32 h-4 bg-gray-200 rounded" />
          <div className="w-48 h-3 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="w-full h-96 bg-gray-200 rounded-2xl mb-8" />
      <div className="space-y-4">
        <div className="w-full h-4 bg-gray-200 rounded" />
        <div className="w-full h-4 bg-gray-200 rounded" />
        <div className="w-3/4 h-4 bg-gray-200 rounded" />
        <div className="w-full h-32 bg-gray-100 rounded-xl my-6" />
        <div className="w-full h-4 bg-gray-200 rounded" />
        <div className="w-5/6 h-4 bg-gray-200 rounded" />
      </div>
    </div>
  )
}
