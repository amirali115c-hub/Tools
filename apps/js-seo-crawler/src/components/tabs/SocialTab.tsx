import {CrawlResult} from '../../types';

interface SocialTabProps {
  result: CrawlResult;
}

export function SocialTab({result}: SocialTabProps) {
  const og = result.openGraph;
  const twitter = result.twitterCard;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Open Graph (Facebook)</h3>
        {og.missing.length === 7 ? (
          <div className="p-3 bg-amber-900/20 border border-amber-800 rounded-lg text-xs text-amber-400">
            No Open Graph tags found
          </div>
        ) : (
          <div className="space-y-2">
            {[
              {key: 'title', label: 'og:title', value: og.title},
              {key: 'description', label: 'og:description', value: og.description},
              {key: 'image', label: 'og:image', value: og.image},
              {key: 'url', label: 'og:url', value: og.url},
              {key: 'type', label: 'og:type', value: og.type},
              {key: 'siteName', label: 'og:site_name', value: og.siteName},
              {key: 'locale', label: 'og:locale', value: og.locale},
            ].map(({key, label, value}) => (
              <div key={key} className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-400">{label}</span>
                  {value ? (
                    <span className="px-1.5 py-0.5 text-[10px] bg-emerald-900/30 text-emerald-400 rounded">OK</span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[10px] bg-amber-900/30 text-amber-400 rounded">Missing</span>
                  )}
                </div>
                <p className="text-sm text-white break-all">{value || 'Not set'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Twitter Card</h3>
        {twitter.missing.length === 6 ? (
          <div className="p-3 bg-amber-900/20 border border-amber-800 rounded-lg text-xs text-amber-400">
            No Twitter Card tags found
          </div>
        ) : (
          <div className="space-y-2">
            {[
              {key: 'card', label: 'twitter:card', value: twitter.card},
              {key: 'site', label: 'twitter:site', value: twitter.site},
              {key: 'creator', label: 'twitter:creator', value: twitter.creator},
              {key: 'title', label: 'twitter:title', value: twitter.title},
              {key: 'description', label: 'twitter:description', value: twitter.description},
              {key: 'image', label: 'twitter:image', value: twitter.image},
            ].map(({key, label, value}) => (
              <div key={key} className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-400">{label}</span>
                  {value ? (
                    <span className="px-1.5 py-0.5 text-[10px] bg-emerald-900/30 text-emerald-400 rounded">OK</span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[10px] bg-amber-900/30 text-amber-400 rounded">Missing</span>
                  )}
                </div>
                <p className="text-sm text-white break-all">{value || 'Not set'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
