import React, { useState, useEffect } from 'react';
import { Job, JobStatus } from '../types';
import { generateCoverLetter, generateInterviewGuide } from '../services/geminiService';
import { Plus, Search, MapPin, DollarSign, Calendar, ChevronRight, X, Loader2, Sparkles, Download, Trash2, CheckCircle2, FileText, BookOpen } from 'lucide-react';

interface JobTrackerProps {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  viewMode?: 'applications' | 'offers';
  onStatusChange?: (job: Job, newStatus: JobStatus) => void;
}

// Helper to parse bold text
const parseBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

// Component to render formatted AI text
const FormattedDisplay = ({ text }: { text: string | undefined }) => {
  if (!text) return <div className="h-full flex items-center justify-center text-slate-400 italic">No content generated yet.</div>;
  
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
         const trimmed = line.trim();
         if (!trimmed) return <div key={i} className="h-3" />;
         
         // Headings (lines that are fully bold or start with #)
         if ((trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 80) || trimmed.startsWith('##')) {
            const content = trimmed.replace(/\*\*/g, '').replace(/^#+\s/, '');
            return <h3 key={i} className="text-brand-deep font-bold text-base mt-4 mb-2">{content}</h3>;
         }

         // Lists
         if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
           return (
             <div key={i} className="flex items-start gap-2 pl-2 mb-2">
               <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-2 flex-shrink-0" />
               <span className="text-slate-700 text-sm leading-relaxed">{parseBold(trimmed.replace(/^[\*\-\•]\s/, ''))}</span>
             </div>
           );
         }
         
         // Numbered Lists
         if (/^\d+\./.test(trimmed)) {
            const number = trimmed.match(/^\d+\./)?.[0];
            const content = trimmed.replace(/^\d+\.\s/, '');
            return (
              <div key={i} className="flex items-start gap-2 pl-2 mb-2">
                <span className="font-bold text-brand-primary text-sm min-w-[20px] mt-0.5">{number}</span>
                <span className="text-slate-700 text-sm leading-relaxed">{parseBold(content)}</span>
              </div>
            );
         }

         return <p key={i} className="text-slate-700 text-sm leading-relaxed mb-1">{parseBold(line)}</p>;
      })}
    </div>
  );
};

const JobTracker: React.FC<JobTrackerProps> = ({ jobs, setJobs, viewMode = 'applications', onStatusChange }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const isOffersMode = viewMode === 'offers';

  // Filter jobs based on origin to ensure they stay in their respective lists
  const displayedJobs = jobs.filter(job => {
    // Legacy support: if no origin, fallback to status check
    const origin = job.origin || (job.status === JobStatus.OFFER ? 'offer' : 'application');
    
    if (isOffersMode) {
      return origin === 'offer';
    } else {
      return origin === 'application';
    }
  });

  // New Job Form State
  const [newJob, setNewJob] = useState<Partial<Job>>({
    status: isOffersMode ? JobStatus.OFFER : JobStatus.APPLIED,
    description: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Update newJob default status when viewMode changes
  useEffect(() => {
    setNewJob(prev => ({
      ...prev,
      status: isOffersMode ? JobStatus.OFFER : JobStatus.APPLIED
    }));
  }, [viewMode, isOffersMode]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.company || !newJob.role) return;

    setIsGenerating(true);
    let coverLetter = '';
    let interviewGuide = '';
    
    try {
      if (isOffersMode) {
        interviewGuide = await generateInterviewGuide(
           newJob.company,
           newJob.role,
           newJob.description || 'General Role'
        );
      } else {
         // Auto-generate cover letter for applications
         coverLetter = await generateCoverLetter(
           newJob.company, 
           newJob.role, 
           newJob.description || 'General Application'
         );
      }
    } catch (err) {
      console.error(err);
      if (isOffersMode) {
        interviewGuide = "Error generating interview guide.";
      } else {
        coverLetter = "Error generating cover letter.";
      }
    }

    const today = new Date();
    const dateString = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    const jobToAdd: Job = {
      id: Date.now().toString(),
      company: newJob.company,
      role: newJob.role,
      location: newJob.location || 'Remote',
      salary: newJob.salary || 'Negotiable',
      status: newJob.status as JobStatus,
      dateApplied: dateString,
      description: newJob.description || '',
      email: newJob.email || '',
      coverLetter: coverLetter,
      interviewGuide: interviewGuide,
      origin: isOffersMode ? 'offer' : 'application' // Set origin based on current view
    };

    setJobs(prev => [jobToAdd, ...prev]);
    setIsGenerating(false);
    setShowAddModal(false);
    setNewJob({ 
      status: isOffersMode ? JobStatus.OFFER : JobStatus.APPLIED, 
      description: '',
      company: '',
      role: '',
      location: '',
      salary: '',
      email: ''
    });
  };

  const handleDeleteJob = (jobId: string, e?: React.MouseEvent) => {
    // Stop propagation immediately to prevent opening the job detail
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // Removed window.confirm to ensure the action is executed immediately for better UX
    setJobs(prev => prev.filter(job => job.id !== jobId));
    
    // If the deleted job was selected, close the detail view
    if (selectedJob?.id === jobId) {
      setSelectedJob(null);
    }
  };

  const handleStatusChange = (jobId: string, newStatusStr: string) => {
    const newStatus = newStatusStr as JobStatus;
    
    // Notify parent about status change before updating state
    const jobToUpdate = jobs.find(j => j.id === jobId);
    if (onStatusChange && jobToUpdate && jobToUpdate.status !== newStatus) {
      onStatusChange(jobToUpdate, newStatus);
    }

    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: newStatus } : job
    ));
    
    if (selectedJob && selectedJob.id === jobId) {
      setSelectedJob(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Improved logic to check if we should treat this job as an offer (for PDF and Display)
  const isJobOfferType = (job: Job) => {
    return job.origin === 'offer' || job.status === JobStatus.OFFER;
  };

  const handleDownloadPDF = () => {
    if (!selectedJob) return;
    
    const isGuide = isJobOfferType(selectedJob) || !!selectedJob.interviewGuide;
    const title = isGuide ? `Interview Guide - ${selectedJob.company}` : `Cover Letter - ${selectedJob.company}`;
    const content = isGuide ? (selectedJob.interviewGuide || '') : (selectedJob.coverLetter || '');
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { 
                font-family: 'Helvetica', 'Arial', sans-serif; 
                padding: 40px; 
                line-height: 1.6; 
                color: #333; 
                max-width: 800px; 
                margin: 0 auto; 
              }
              .header { margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
              .role { font-size: 18px; font-weight: bold; color: #111; }
              .company { font-size: 14px; color: #666; margin-top: 4px; }
              .content { white-space: pre-wrap; font-size: 14px; }
              h1, h2, h3 { color: #008b7d; }
              ul { padding-left: 20px; }
              li { margin-bottom: 8px; }
              strong { color: #000; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="role">${isGuide ? 'Interview Prep Guide for ' : 'Application for '}${selectedJob.role}</div>
              <div class="company">${selectedJob.company}</div>
            </div>
            <div class="content">${content.replace(/\*\*/g, '')}</div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleRegenerate = async () => {
    if (!selectedJob) return;
    
    // Robust check for guide type
    const isGuide = isJobOfferType(selectedJob);
    
    try {
      let newContent = '';
      if (isGuide) {
        newContent = await generateInterviewGuide(selectedJob.company, selectedJob.role, selectedJob.description);
        setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, interviewGuide: newContent } : j));
        setSelectedJob(prev => prev ? { ...prev, interviewGuide: newContent } : null);
      } else {
        newContent = await generateCoverLetter(selectedJob.company, selectedJob.role, selectedJob.description);
        setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, coverLetter: newContent } : j));
        setSelectedJob(prev => prev ? { ...prev, coverLetter: newContent } : null);
      }
    } catch (e) {
      console.error("Regeneration failed", e);
      alert("Failed to regenerate content.");
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.APPLIED: return 'bg-blue-50 text-blue-700 border border-blue-100';
      case JobStatus.INTERVIEW: return 'bg-amber-50 text-amber-700 border border-amber-100';
      case JobStatus.OFFER: return 'bg-brand-mint text-brand-deep border border-brand-secondary';
      case JobStatus.ACCEPTED: return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case JobStatus.REJECTED: return 'bg-rose-50 text-rose-700 border border-rose-100';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  // Helper to determine what content to show using robust check
  const isInterviewGuideContent = selectedJob ? isJobOfferType(selectedJob) : false;
  const displayContent = isInterviewGuideContent ? selectedJob?.interviewGuide : selectedJob?.coverLetter;
  const contentTitle = isInterviewGuideContent ? 'AI Interview Guide' : 'AI Cover Letter';

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="p-8 pb-4 flex justify-between items-center border-b border-brand-mint bg-white/80 backdrop-blur sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-brand-deep">
            {isOffersMode ? 'Offers Received' : 'My Applications'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {displayedJobs.length} {isOffersMode ? 'Active Offers' : 'Active applications'}
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl hover:bg-brand-deep transition shadow-lg shadow-brand-primary/20"
        >
          <Plus size={18} />
          <span>{isOffersMode ? 'Log New Offer' : 'New Application'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Job List */}
        <div className={`flex-1 overflow-y-auto p-8 transition-all custom-scrollbar ${selectedJob ? 'w-1/2 hidden md:block' : 'w-full'}`}>
           <div className="relative mb-6">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary" size={20} />
             <input 
               type="text" 
               placeholder="Search by company or role..." 
               className="w-full pl-10 pr-4 py-3 bg-white border border-brand-mint rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none text-slate-700 placeholder-brand-primary/30"
             />
           </div>

           <div className="space-y-4">
             {displayedJobs.length === 0 ? (
               <div className="text-center py-12 text-slate-400">
                 <p>{isOffersMode ? 'No offers received yet. Keep going!' : 'No applications yet.'}</p>
                 <button onClick={() => setShowAddModal(true)} className="text-brand-primary hover:underline mt-2 text-sm font-medium">
                   {isOffersMode ? 'Log an offer manually' : 'Add your first one'}
                 </button>
               </div>
             ) : displayedJobs.map(job => (
               <div 
                 key={job.id}
                 onClick={() => setSelectedJob(job)}
                 className={`bg-white p-5 rounded-xl border transition cursor-pointer hover:shadow-md hover:shadow-brand-primary/5 group relative ${selectedJob?.id === job.id ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-brand-mint hover:border-brand-secondary'}`}
               >
                 <button 
                    onClick={(e) => handleDeleteJob(job.id, e)}
                    className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all z-10"
                    title="Delete Application"
                 >
                   <Trash2 size={18} />
                 </button>

                 <div className="flex justify-between items-start mb-3 pr-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-brand-deep font-bold text-lg border border-brand-mint">
                        {job.role.substring(0, 1)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{job.role}</h3>
                        <p className="text-slate-500 text-sm">{job.company}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                 </div>
                 <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1"><MapPin size={14}/> {job.location}</div>
                    <div className="flex items-center gap-1"><DollarSign size={14}/> {job.salary}</div>
                    <div className="flex items-center gap-1 ml-auto"><Calendar size={14}/> {job.dateApplied}</div>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Job Detail Panel */}
        {selectedJob && (
          <div className="w-full md:w-[600px] border-l border-brand-mint bg-white flex flex-col h-full shadow-2xl z-20 absolute md:static inset-0">
             <div className="p-6 border-b border-brand-mint flex justify-between items-start">
                <div>
                   <h2 className="text-xl font-bold text-slate-800 mb-1">{selectedJob.role}</h2>
                   <div className="text-brand-primary font-medium">{selectedJob.company}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handleDeleteJob(selectedJob.id, e)}
                    className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    title="Delete Application"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-brand-primary">
                    <X size={20} />
                  </button>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
               {/* Job Info */}
               <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-emerald-50 rounded-xl border border-brand-mint">
                    <div className="text-xs text-brand-deep uppercase font-bold mb-1">Salary</div>
                    <div className="text-slate-700 font-medium">{selectedJob.salary}</div>
                 </div>
                 <div className="p-4 bg-emerald-50 rounded-xl border border-brand-mint">
                    <div className="text-xs text-brand-deep uppercase font-bold mb-1">Contact</div>
                    <div className="text-slate-700 font-medium truncate">{selectedJob.email || 'N/A'}</div>
                 </div>
               </div>

               <div>
                 <h3 className="text-sm font-bold text-slate-700 uppercase mb-2">Description</h3>
                 <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                   {selectedJob.description || 'No description provided.'}
                 </p>
               </div>

               <div className="bg-emerald-50 p-6 rounded-2xl border border-brand-mint flex flex-col">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="flex items-center gap-2 font-bold text-brand-deep">
                     {isInterviewGuideContent ? <BookOpen size={16} /> : <FileText size={16} />}
                     {contentTitle}
                   </h3>
                   <button 
                      onClick={handleRegenerate}
                      className="text-xs bg-white text-brand-deep px-3 py-1 rounded border border-brand-mint hover:bg-brand-secondary/20 transition"
                   >
                     Regenerate
                   </button>
                 </div>
                 
                 {/* Replaced textarea with FormattedDisplay */}
                 <div className="w-full h-80 bg-white p-6 rounded-xl border border-brand-mint overflow-y-auto custom-scrollbar shadow-sm">
                    <FormattedDisplay text={displayContent || ''} />
                 </div>

                 <div className="mt-4 flex justify-end">
                   <button 
                     onClick={handleDownloadPDF}
                     className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-deep shadow-sm"
                   >
                     <Download size={16} />
                     Download PDF
                   </button>
                 </div>
               </div>

               {/* Application Status Section */}
               <div className="bg-white p-4 border border-brand-mint rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={18} className="text-brand-primary" />
                    <label className="text-sm font-bold text-slate-700">Application Status</label>
                  </div>
                  <select
                    value={selectedJob.status}
                    onChange={(e) => handleStatusChange(selectedJob.id, e.target.value)}
                    className="w-full p-3 bg-emerald-50 border border-brand-mint rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary transition-shadow cursor-pointer text-slate-700"
                  >
                    <option value={JobStatus.APPLIED}>Applied / Pending</option>
                    <option value={JobStatus.INTERVIEW}>Interviewing</option>
                    <option value={JobStatus.OFFER}>Offer Received</option>
                    <option value={JobStatus.ACCEPTED}>Accepted</option>
                    <option value={JobStatus.REJECTED}>Rejected</option>
                  </select>
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-brand-deep/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-brand-mint">
            <div className="p-6 border-b border-brand-mint flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{isOffersMode ? 'Log New Offer' : 'Add New Application'}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-brand-primary transition">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateJob} className="p-6 space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
                   <input required type="text" className="w-full p-2.5 border border-brand-mint rounded-lg text-sm focus:ring-2 focus:ring-brand-primary outline-none text-slate-800 placeholder-slate-400" 
                     value={newJob.company} onChange={e => setNewJob({...newJob, company: e.target.value})} />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Role Title *</label>
                   <input required type="text" className="w-full p-2.5 border border-brand-mint rounded-lg text-sm focus:ring-2 focus:ring-brand-primary outline-none text-slate-800 placeholder-slate-400"
                     value={newJob.role} onChange={e => setNewJob({...newJob, role: e.target.value})} />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                   <input type="text" className="w-full p-2.5 border border-brand-mint rounded-lg text-sm focus:ring-2 focus:ring-brand-primary outline-none text-slate-800 placeholder-slate-400" placeholder="e.g. New York"
                     value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Salary Range</label>
                   <input type="text" className="w-full p-2.5 border border-brand-mint rounded-lg text-sm focus:ring-2 focus:ring-brand-primary outline-none text-slate-800 placeholder-slate-400" placeholder="e.g. $120k - $150k"
                     value={newJob.salary} onChange={e => setNewJob({...newJob, salary: e.target.value})} />
                 </div>
               </div>

               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Recruiter Email</label>
                   <input type="email" className="w-full p-2.5 border border-brand-mint rounded-lg text-sm focus:ring-2 focus:ring-brand-primary outline-none text-slate-800 placeholder-slate-400"
                     value={newJob.email} onChange={e => setNewJob({...newJob, email: e.target.value})} />
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">
                   {isOffersMode ? 'Job Description / Offer Details (For AI)' : 'Job Description (For AI)'}
                 </label>
                 <textarea 
                   className="w-full p-2.5 border border-brand-mint rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-brand-primary outline-none text-slate-800 placeholder-slate-400" 
                   placeholder={isOffersMode ? "Paste the job description or a summary of the offer details here..." : "Paste the job description here..."}
                   value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})}
                 />
               </div>

               <button 
                 type="submit" 
                 disabled={isGenerating}
                 className="w-full bg-brand-primary text-white py-3 rounded-xl font-medium hover:bg-brand-deep transition flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20"
               >
                 {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className="text-white" />}
                 {isGenerating ? 'Generating Assets...' : (isOffersMode ? 'Create Interview Guide' : 'Generate Cover Letter')}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobTracker;