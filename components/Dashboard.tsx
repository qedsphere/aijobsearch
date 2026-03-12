import React, { useState, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { Job, JobStatus } from '../types';
import { TrendingUp, Clock, CheckCircle, XCircle, Award, Download } from 'lucide-react';

interface DashboardProps {
  jobs: Job[];
}

const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-brand-mint shadow-sm shadow-brand-primary/5 flex items-start justify-between group hover:border-brand-secondary transition-all">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-xl ${bg}`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ jobs }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  // Calculate stats
  // Fix: Exclude offers from Total Applied count
  const totalApplied = jobs.filter(j => 
    j.origin === 'application' || 
    (!j.origin && j.status !== JobStatus.OFFER && j.status !== JobStatus.ACCEPTED)
  ).length;

  const interviewing = jobs.filter(j => j.status === JobStatus.INTERVIEW).length;
  const offers = jobs.filter(j => j.status === JobStatus.OFFER).length;
  const rejected = jobs.filter(j => j.status === JobStatus.REJECTED).length;
  const accepted = jobs.filter(j => j.status === JobStatus.ACCEPTED).length;

  // Accepted Jobs List
  const acceptedJobs = jobs.filter(j => j.status === JobStatus.ACCEPTED);

  // Generate dynamic activity data based on time range
  const activityData = useMemo(() => {
    const data = [];
    const today = new Date();
    let daysToLookBack = 7;

    if (timeRange === '30d') daysToLookBack = 30;
    if (timeRange === 'all') daysToLookBack = 90; // Approximation for 'all time'

    // Create a map of dates to counts for O(1) lookup
    const appsByDate: Record<string, number> = {};
    const offersByDate: Record<string, number> = {};

    jobs.forEach(job => {
      if (job.dateApplied) {
        // Only count as 'app' if it's an application (not an unsolicited offer)
        const isApp = job.origin === 'application' || (!job.origin && job.status !== JobStatus.OFFER);
        
        if (isApp) {
          appsByDate[job.dateApplied] = (appsByDate[job.dateApplied] || 0) + 1;
        }
        
        // Track offers/accepted
        if (job.status === JobStatus.OFFER || job.status === JobStatus.ACCEPTED) {
          offersByDate[job.dateApplied] = (offersByDate[job.dateApplied] || 0) + 1;
        }
      }
    });
    
    for (let i = daysToLookBack - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      
      const dateString = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      
      let displayDay = d.toLocaleDateString('en-US', { weekday: 'short' });
      if (timeRange !== '7d') {
        displayDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      data.push({
        name: displayDay,
        apps: appsByDate[dateString] || 0,
        offers: offersByDate[dateString] || 0,
        fullDate: dateString
      });
    }
    return data;
  }, [jobs, timeRange]);

  const statusData = [
    { name: 'Applied', count: jobs.filter(j => j.status === JobStatus.APPLIED).length },
    { name: 'Interview', count: interviewing },
    { name: 'Offer', count: offers },
    { name: 'Accepted', count: accepted },
    { name: 'Rejected', count: rejected },
  ];

  const maxStatusCount = Math.max(...statusData.map(d => d.count), 1);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-deep">Dashboard Overview</h1>
          <p className="text-slate-500">Welcome back! Here's your job search progress.</p>
        </div>
        <button className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-deep transition shadow-lg shadow-brand-primary/20 flex items-center gap-2">
          <Download size={16} />
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Applied" value={totalApplied} icon={TrendingUp} color="text-brand-primary" bg="bg-brand-mint/50" />
        <StatCard title="Interviewing" value={interviewing} icon={Clock} color="text-amber-500" bg="bg-amber-50" />
        <StatCard title="Offers Received" value={offers} icon={CheckCircle} color="text-blue-500" bg="bg-blue-50" />
        <StatCard title="Rejected" value={rejected} icon={XCircle} color="text-rose-500" bg="bg-rose-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-9 flex flex-col gap-8">
          {/* Application Activity Chart */}
          <div className="bg-white p-6 rounded-2xl border border-brand-mint shadow-sm shadow-brand-primary/5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-brand-deep">Application Activity</h3>
              <div className="flex bg-brand-rose p-1 rounded-lg">
                {(['7d', '30d', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      timeRange === range
                        ? 'bg-white text-brand-deep shadow-sm'
                        : 'text-slate-400 hover:text-brand-deep'
                    }`}
                  >
                    {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2DAA9E" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2DAA9E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOffers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3D2C3" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} minTickGap={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                  />
                  
                  {/* Render Offers First (Layered Underneath) */}
                  <Area 
                    type="monotone" 
                    dataKey="offers" 
                    name="Offers Received"
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorOffers)" 
                  />

                  {/* Render Applications Second (Layered On Top) */}
                  <Area 
                    type="monotone" 
                    dataKey="apps" 
                    name="Applications"
                    stroke="#2DAA9E" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorApps)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Accepted Applications Widget */}
          <div className="bg-white p-6 rounded-2xl border border-brand-mint shadow-sm shadow-brand-primary/5 flex flex-col h-60">
            <h3 className="text-lg font-bold text-brand-deep mb-4 flex items-center gap-2">
              <Award className="text-brand-primary" size={20} />
              Accepted Jobs
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {acceptedJobs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                  <p className="text-sm">No accepted applications yet.</p>
                </div>
              ) : (
                acceptedJobs.map(job => (
                  <div key={job.id} className="p-4 bg-brand-rose rounded-xl border border-brand-mint flex justify-between items-center hover:bg-white transition-colors">
                    <div>
                      <div className="font-bold text-slate-800 text-base">{job.role}</div>
                      <div className="text-brand-deep font-medium text-sm">{job.company}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-sm text-slate-600 font-medium mb-1">{job.salary || 'Salary N/A'}</div>
                       <span className="text-xs text-brand-primary bg-white border border-brand-mint px-2 py-1 rounded-full">{job.dateApplied}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-brand-mint shadow-sm shadow-brand-primary/5">
            <h3 className="text-lg font-bold text-brand-deep mb-6">Status Breakdown</h3>
            <div className="flex flex-col gap-6">
              {statusData.map((item) => (
                <div key={item.name} className="grid grid-cols-[80px_1fr_24px] items-center gap-3 group">
                  <span className="text-sm font-medium text-slate-500 text-left truncate" title={item.name}>
                    {item.name}
                  </span>
                  <div className="h-3 bg-brand-rose rounded-r-lg rounded-bl-sm overflow-hidden relative">
                    <div 
                      className="h-full bg-brand-primary rounded-r-lg transition-all duration-500 group-hover:bg-brand-secondary"
                      style={{ width: `${(item.count / maxStatusCount) * 100}%`, minWidth: item.count > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <span className="text-xs text-brand-deep text-right font-medium">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;