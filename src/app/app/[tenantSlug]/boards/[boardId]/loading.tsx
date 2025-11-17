export default function BoardDetailLoading() {
  return (
    <div className="p-6">
      {/* Header skeleton */}
      <div className="mb-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-96 bg-gray-200 rounded"></div>
      </div>

      {/* Kanban columns skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(col => (
          <div key={col} className="bg-gray-50 rounded-lg p-4">
            {/* Column header */}
            <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>

            {/* Todo cards skeleton */}
            <div className="space-y-3">
              {[1, 2, 3].map(card => (
                <div key={card} className="bg-white p-4 rounded shadow animate-pulse">
                  <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
