interface EmptyStateProps {
  isLoading: boolean;
}

export function EmptyState({isLoading}: EmptyStateProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
      {isLoading ? (
        <div className="space-y-3">
          <svg className="animate-spin h-8 w-8 text-indigo-500 mx-auto" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-slate-400">Analyzing page...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">No results yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Enter a URL or paste HTML source code to start the SEO audit
            </p>
          </div>
          <div className="flex gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Meta tags
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Headings
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Links
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              Issues
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
