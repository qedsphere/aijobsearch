import React, { useState, useEffect } from 'react';
import { Search, Loader2, Briefcase, MapPin, Star, ExternalLink, PlusCircle, CheckCircle2, AlertTriangle, Calendar, Target, Sparkles } from 'lucide-react';
import { Resume, JobSearchResult, Job, JobStatus } from '../types';
import { searchJobs, recommendRoles } from '../services/geminiService';

interface JobSearchProps {
  resume: Resume;
  onAddJob: (job: Job) => void;
  existingJobIds: string[]; // To check if a job is already added
  searchParams: { role: string; location: string; type: string; interests: string; timePeriod: string };
  setSearchParams: React.Dispatch<React.SetStateAction<{ role: string; location: string; type: string; interests: string; timePeriod: string }>>;
  isSearching: boolean;
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
  results: JobSearchResult[];
  setResults: React.Dispatch<React.SetStateAction<JobSearchResult[]>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

const JobSearch: React.FC<JobSearchProps> = ({ 
  resume, onAddJob, existingJobIds,
  searchParams, setSearchParams,
  isSearching, setIsSearching,
  results, setResults,
  error, setError
}) => {
  const hasResume = resume && (resume.experience.length > 0 || resume.skills.length > 0 || resume.summary.length > 0);
  const [jobsParsed, setJobsParsed] = useState(0);
  
  const [activeTab, setActiveTab] = useState<'search' | 'recommend'>('search');
  const [longTermGoals, setLongTermGoals] = useState('');
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendedRoles, setRecommendedRoles] = useState<any[]>([]);

  const performSearch = async (paramsToUse = searchParams) => {
    if (!paramsToUse.role || !paramsToUse.location || !hasResume) return;

    setIsSearching(true);
    setError(null);
    setJobsParsed(0);
    
    try {
      const searchResults = await searchJobs(resume, paramsToUse, (count) => {
        setJobsParsed(count);
      });

      setResults(searchResults);
    } catch (err) {
      console.error(err);
      setError("Failed to search for jobs. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const handleRecommendRoles = async () => {
    if (!longTermGoals || !hasResume) return;
    setIsRecommending(true);
    setError(null);
    try {
      const roles = await recommendRoles(resume, longTermGoals);
      setRecommendedRoles(roles);
    } catch (err) {
      console.error(err);
      setError("Failed to recommend roles. Please try again.");
    } finally {
      setIsRecommending(false);
    }
  };

  const handleSelectRole = (role: string) => {
    const newParams = { ...searchParams, role };
    setSearchParams(newParams);
    setActiveTab('search');
    // If location is already set, we can trigger search automatically
    if (newParams.location) {
      performSearch(newParams);
    }
  };

  const validResults = results.filter(r => r.isValid !== false && r.matchesTimePeriod !== false);
  const invalidResults = results.filter(r => r.isValid === false || r.matchesTimePeriod === false);

  const handleAddJob = (result: JobSearchResult) => {
    const analysisText = result.analysis 
      ? `\n\nAnalysis:\n- Interest: ${result.analysis.interest || 'N/A'}\n- Qualifications: ${result.analysis.qualifications || 'N/A'}\n- Location/Type: ${result.analysis.locationAndType || 'N/A'}`
      : '';

    const newJob: Job = {
      id: result.id,
      company: result.company,
      role: result.title,
      location: result.location,
      salary: 'Not specified',
      status: JobStatus.DRAFT,
      dateApplied: new Date().toISOString().split('T')[0],
      description: `Link: ${result.link}\n\nMatch Score: ${result.matchScore || 0}%${analysisText}`,
      coverLetter: '',
      email: '',
      origin: 'application'
    };
    
    onAddJob(newJob);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-deep mb-2">AI Job Search</h1>
        <p className="text-slate-600">Find the perfect opportunities tailored to your resume and interests.</p>
      </div>

      {!hasResume && (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl mb-6 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-bold">Resume Required</h3>
            <p className="text-sm mt-1">You need to build or upload your resume before searching for jobs. The AI uses your resume to find the best matches and evaluate your qualifications.</p>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'search' 
              ? 'bg-brand-deep text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Search size={18} />
          Job Search
        </button>
        <button
          onClick={() => setActiveTab('recommend')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'recommend' 
              ? 'bg-brand-deep text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Target size={18} />
          Recommend Roles
        </button>
      </div>

      {activeTab === 'recommend' && (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-mint/50 p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Sparkles className="text-brand-primary" size={20} />
            Discover Your Ideal Roles
          </h2>
          <p className="text-slate-600 mb-6">
            Not sure what to search for? Tell us your long-term career goals, and our AI will recommend the best roles based on your resume and aspirations.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Long-Term Goals</label>
              <textarea
                value={longTermGoals}
                onChange={(e) => setLongTermGoals(e.target.value)}
                placeholder="e.g. I want to become a CTO at a climate tech startup, or I want to lead a team of AI researchers..."
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all min-h-[120px]"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleRecommendRoles}
                disabled={isRecommending || !longTermGoals || !hasResume}
                className="flex items-center gap-2 bg-brand-deep text-white px-6 py-2.5 rounded-xl hover:bg-brand-deep/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isRecommending ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Get Recommendations
                  </>
                )}
              </button>
            </div>
          </div>

          {recommendedRoles.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="font-bold text-slate-800">Recommended Roles</h3>
              <div className="grid grid-cols-1 gap-4">
                {recommendedRoles.map((rec, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:border-brand-primary/50 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-lg text-brand-deep">{rec.role}</h4>
                        <p className="text-slate-600 text-sm mt-2 leading-relaxed">{rec.reason}</p>
                      </div>
                      <button
                        onClick={() => handleSelectRole(rec.role)}
                        className="shrink-0 flex items-center gap-1 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-deep transition-colors"
                      >
                        <Search size={14} />
                        Search This
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-mint/50 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Desired Role / Keywords</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchParams.role}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g. Frontend Developer, React"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchParams.location}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. San Francisco, CA or Remote"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type of Work</label>
              <select
                value={searchParams.type}
                onChange={(e) => setSearchParams(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all bg-white"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Interests / Desires</label>
              <div className="relative">
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchParams.interests}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, interests: e.target.value }))}
                  placeholder="e.g. Climate tech, AI, fast-paced startup"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Time Period</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchParams.timePeriod}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, timePeriod: e.target.value }))}
                  placeholder="e.g. Summer 2026, Fall 2025"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSearching || !searchParams.role || !searchParams.location || !hasResume}
              className="flex items-center gap-2 bg-brand-deep text-white px-6 py-2.5 rounded-xl hover:bg-brand-deep/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSearching ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Searching the Web...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Find Matches
                </>
              )}
            </button>
          </div>
          
          {isSearching && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-slate-600 mb-1">
                <span>Analyzing resume and searching the web...</span>
                <span>{Math.min(jobsParsed * 10, 100)}% ({jobsParsed} jobs considered)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-brand-primary h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(jobsParsed * 10, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </form>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-100">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-12">
          {validResults.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Star className="text-amber-400 fill-amber-400" size={20} />
                Top Matches for You
              </h2>
              
              <div className="grid grid-cols-1 gap-6">
                {validResults.map((result) => {
                  const isAdded = existingJobIds.includes(result.id);
                  return (
                  <div key={result.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{result.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Briefcase size={16} className="text-brand-primary" />
                            {result.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={16} className="text-slate-400" />
                            {result.location}
                          </span>
                          <span className="bg-slate-100 px-2.5 py-1 rounded-md text-xs font-medium">
                            {result.type}
                          </span>
                          {result.applicationDeadline && (
                            <span className="flex items-center gap-1 text-rose-600 font-medium bg-rose-50 px-2.5 py-1 rounded-md text-xs">
                              <Calendar size={14} />
                              Deadline: {result.applicationDeadline}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 bg-brand-mint/30 px-3 py-1.5 rounded-lg border border-brand-mint">
                          <span className="text-sm font-bold text-brand-deep">Match Score</span>
                          <span className="text-lg font-black text-brand-primary">{result.matchScore}%</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <a 
                            href={result.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-brand-primary hover:text-brand-deep transition-colors"
                          >
                            View Posting <ExternalLink size={14} />
                          </a>
                          
                          <button
                            onClick={() => handleAddJob(result)}
                            disabled={isAdded}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              isAdded
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-brand-primary text-white hover:bg-brand-deep'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <CheckCircle2 size={16} /> Added
                              </>
                            ) : (
                              <>
                                <PlusCircle size={16} /> Track Job
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Star size={14} className="text-amber-500" /> Interest Match
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed">{result.analysis?.interest || 'No analysis provided.'}</p>
                      </div>
                      
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <CheckCircle2 size={14} className="text-emerald-500" /> Qualifications
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed">{result.analysis?.qualifications || 'No analysis provided.'}</p>
                      </div>
                      
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <MapPin size={14} className="text-blue-500" /> Location & Type
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed">{result.analysis?.locationAndType || 'No analysis provided.'}</p>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}

          {invalidResults.length > 0 && (
            <div className="space-y-6 opacity-75">
              <h2 className="text-xl font-bold text-slate-500 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={20} />
                Probably Invalid or Mismatched Links
              </h2>
              <p className="text-sm text-slate-500">These job postings could not be verified, the links might be broken/expired, or they do not match your requested time period.</p>
              
              <div className="grid grid-cols-1 gap-6">
                {invalidResults.map((result) => {
                  const isAdded = existingJobIds.includes(result.id);
                  return (
                  <div key={result.id} className="bg-slate-50 rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-600">{result.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <Briefcase size={16} />
                            {result.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={16} />
                            {result.location}
                          </span>
                          <span className="bg-slate-200 px-2.5 py-1 rounded-md text-xs font-medium">
                            {result.type}
                          </span>
                          {result.applicationDeadline && (
                            <span className="flex items-center gap-1 text-slate-500 font-medium bg-slate-200 px-2.5 py-1 rounded-md text-xs">
                              <Calendar size={14} />
                              Deadline: {result.applicationDeadline}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 mt-2">
                          <a 
                            href={result.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                          >
                            Try Link Anyway <ExternalLink size={14} />
                          </a>
                          
                          <button
                            onClick={() => handleAddJob(result)}
                            disabled={isAdded}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              isAdded
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <CheckCircle2 size={16} /> Added
                              </>
                            ) : (
                              <>
                                <PlusCircle size={16} /> Track Anyway
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobSearch;
