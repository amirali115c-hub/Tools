import React, { useState } from 'react';
import { TopicCluster, ClassifiedPage, GapOpportunity } from '../types';
import { generateTopicClusters } from '../utils/topicClustering';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Layers, ShieldCheck, AlertCircle, ChevronRight, CheckCircle2, TrendingUp, Sparkles, Download, Layers3, Target } from 'lucide-react';
import Papa from 'papaparse';

interface TopicClustersViewProps {
  competitorPages: ClassifiedPage[];
  ownPages: ClassifiedPage[];
  gaps: GapOpportunity[];
}

export const TopicClustersView: React.FC<TopicClustersViewProps> = ({
  competitorPages,
  ownPages,
  gaps
}) => {
  const clusters = generateTopicClusters(competitorPages, ownPages, gaps);
  const [selectedClusterId, setSelectedClusterId] = useState<string>(clusters[0]?.id || '');

  const activeCluster = clusters.find(c => c.id === selectedClusterId) || clusters[0];

  // Prepare chart data
  const chartData = clusters.map(c => ({
    name: c.pillarName.length > 20 ? c.pillarName.substring(0, 18) + '...' : c.pillarName,
    fullName: c.pillarName,
    'Competitor Coverage': c.competitorCoverageScore,
    'Your Coverage': c.ownCoverageScore,
    'Authority Gap': c.authorityGapScore
  }));

  const exportClustersCsv = () => {
    const rows = clusters.map(c => ({
      'Pillar Cluster': c.pillarName,
      'Status': c.status,
      'Total Volume': c.totalVolume,
      'Keywords Count': c.keywordsCount,
      'Competitor Coverage %': `${c.competitorCoverageScore}%`,
      'Your Coverage %': `${c.ownCoverageScore}%`,
      'Authority Gap %': `${c.authorityGapScore}%`,
      'Competitor Pages': c.competitorPageCount,
      'Your Pages': c.ownPageCount,
      'Top Keywords': c.keywords.slice(0, 5).join('; ')
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Topical-Authority-Clusters-Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Layers3 className="w-3 h-3 text-indigo-400" /> Milestone 1 • Topical Authority Engine
            </span>
            <span className="text-xs text-slate-400">Pillar & Cluster Hub Architecture</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">
            Semantic Topic Clusters & Topical Coverage Gaps
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Google ranks websites based on Topical Authority depth. See how your site’s coverage compares to competitors across core strategic topic pillars.
          </p>
        </div>

        <button
          onClick={exportClustersCsv}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" /> Export Cluster Map (.csv)
        </button>
      </div>

      {/* Recharts Coverage Comparison Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Topical Authority Score % by Pillar Cluster
            </h3>
            <p className="text-xs text-slate-500">
              Comparing keyword coverage depth (%) across key industry topic pillars
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            {clusters.length} Strategic Clusters
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                formatter={(val: any) => [`${val}%`, 'Coverage Score']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Competitor Coverage" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Your Coverage" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main 2-Column Cluster Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 cols): Cluster List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Topic Pillar Clusters
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">
              Click to view hub & spoke
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[520px]">
            {clusters.map(cluster => {
              const isSelected = activeCluster?.id === cluster.id;

              return (
                <div
                  key={cluster.id}
                  onClick={() => setSelectedClusterId(cluster.id)}
                  className={`p-4 transition-all cursor-pointer border-l-4 ${
                    isSelected
                      ? 'bg-indigo-50/50 border-l-indigo-600'
                      : 'border-l-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        cluster.status === 'Dominating'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cluster.status === 'Competitive'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-900 font-extrabold'
                      }`}>
                        {cluster.status}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs mt-1.5">
                        {cluster.pillarName}
                      </h4>
                    </div>

                    {cluster.totalVolume > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                        {cluster.totalVolume.toLocaleString()}/mo
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-100/60 p-2 rounded-lg">
                    <div>
                      Comp Coverage: <strong className="text-slate-900">{cluster.competitorCoverageScore}%</strong> ({cluster.competitorPageCount} pgs)
                    </div>
                    <div>
                      Your Coverage: <strong className="text-slate-900">{cluster.ownCoverageScore}%</strong> ({cluster.ownPageCount} pgs)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 cols): Selected Cluster Hub & Spoke View */}
        {activeCluster && (
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold bg-indigo-600 text-white px-2.5 py-0.5 rounded uppercase tracking-wider">
                  Selected Cluster Architecture
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Gap Score: <strong className="text-amber-700 font-bold">{activeCluster.authorityGapScore}% Gap</strong>
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mt-2">
                {activeCluster.pillarName}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {activeCluster.description}
              </p>
            </div>

            {/* Cluster Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[500px]">
              
              {/* Keywords in Cluster */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Keywords In Cluster ({activeCluster.keywords.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeCluster.keywords.map((kw, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold rounded-md">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pages Assigned to Hub & Spoke */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Mapped Site Pages in Cluster Network ({activeCluster.pagesInCluster.length})
                </h4>

                <div className="space-y-2">
                  {activeCluster.pagesInCluster.length === 0 ? (
                    <div className="p-4 bg-slate-50 text-slate-500 text-xs rounded-xl border border-slate-200 italic text-center">
                      No published pages currently map to this topic cluster. Publish new pages to close this gap!
                    </div>
                  ) : (
                    activeCluster.pagesInCluster.map((p, idx) => (
                      <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 flex items-center justify-between text-xs">
                        <div className="space-y-0.5 max-w-sm">
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                            p.siteType === 'Competitor' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {p.siteType} • {p.role}
                          </span>
                          <div className="font-bold text-slate-900 truncate" title={p.title}>
                            {p.title}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            {p.url}
                          </div>
                        </div>

                        <span className="text-xs font-bold text-indigo-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shrink-0">
                          Hub Mapped
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};
