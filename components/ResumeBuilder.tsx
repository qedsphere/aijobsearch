import React, { useState, useRef } from 'react';
import { Resume, ResumeSection, Project } from '../types';
import { Printer, Plus, Trash2, ChevronDown, ChevronUp, Image as ImageIcon, Upload, Loader2, Sparkles } from 'lucide-react';
import { parseAndImproveResume } from '../services/geminiService';

interface ResumeBuilderProps {
  resume: Resume;
  setResume: React.Dispatch<React.SetStateAction<Resume>>;
}

const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ resume, setResume }) => {
  const [editMode, setEditMode] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resume, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "resume.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setResume(json);
      } catch (error) {
        console.error("Failed to parse JSON", error);
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) {
      jsonInputRef.current.value = '';
    }
  };

  const updateField = (field: keyof Resume, value: string) => {
    setResume(prev => ({ ...prev, [field]: value }));
  };

  const addItem = (section: 'experience' | 'education' | 'projects') => {
    const newId = Date.now().toString();
    if (section === 'projects') {
      setResume(prev => ({
        ...prev,
        projects: [...prev.projects, { id: newId, name: '', technologies: '', link: '', description: '' }]
      }));
    } else {
      setResume(prev => ({
        ...prev,
        [section]: [...prev[section], { id: newId, title: '', company: '', date: '', details: '' }]
      }));
    }
  };

  const removeItem = (section: 'experience' | 'education' | 'projects', id: string) => {
    setResume(prev => ({
      ...prev,
      [section]: (prev[section] as any[]).filter((item: any) => item.id !== id)
    }));
  };

  const updateItem = (section: 'experience' | 'education' | 'projects', id: string, field: string, value: string) => {
    setResume(prev => ({
      ...prev,
      [section]: (prev[section] as any[]).map((item: any) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        const mimeType = file.type; // e.g. application/pdf, image/png
        
        try {
          const parsedData = await parseAndImproveResume(result, mimeType);
          
          if (parsedData) {
            setResume(prev => ({
              ...prev,
              ...parsedData,
              // Generate unique IDs for arrays if missing
              experience: parsedData.experience?.map((item: any, idx: number) => ({
                ...item, 
                id: Date.now().toString() + 'exp' + idx 
              })) || [],
              education: parsedData.education?.map((item: any, idx: number) => ({
                ...item, 
                id: Date.now().toString() + 'edu' + idx 
              })) || [],
              projects: parsedData.projects?.map((item: any, idx: number) => ({
                ...item, 
                id: Date.now().toString() + 'proj' + idx 
              })) || []
            }));
          }
        } catch (err) {
          console.error("Gemini processing error", err);
          alert("Could not process the resume. Please ensure the file is readable.");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex h-full">
      {/* Editor Panel */}
      <div className={`w-1/3 bg-white border-r border-brand-mint overflow-y-auto p-6 no-print custom-scrollbar ${!editMode ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-xl font-bold text-emerald-800">Editor</h2>
           <button onClick={() => setEditMode(false)} className="text-sm text-brand-primary hover:underline md:hidden">Preview</button>
        </div>

        {/* Upload CV Button */}
        <div className="mb-6 space-y-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,image/*" 
            onChange={handleFileUpload} 
          />
          <input 
            type="file" 
            ref={jsonInputRef} 
            className="hidden" 
            accept=".json" 
            onChange={handleJsonUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-emerald-400 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="animate-spin text-emerald-600 mb-2" size={24} />
                <span className="text-sm font-medium text-emerald-800">Analyzing CV with AI...</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Upload className="text-emerald-600" size={20} />
                  <span className="font-bold text-emerald-800">Upload CV to Auto-Fill</span>
                </div>
                <p className="text-xs text-emerald-700/70 text-center">
                  AI will analyze & professionalize your existing resume
                </p>
              </>
            )}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => jsonInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              <Upload size={18} />
              Upload JSON
            </button>
            <button
              onClick={handleDownloadJson}
              disabled={isUploading}
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-brand-deep text-white rounded-xl hover:bg-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              <Printer size={18} />
              Download JSON
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-3">Personal Info</h3>
            <div className="space-y-3">
              <input 
                type="text" 
                value={resume.fullName} 
                onChange={(e) => updateField('fullName', e.target.value)}
                className="w-full p-2 border border-brand-mint rounded text-sm focus:border-brand-primary outline-none text-slate-800 placeholder-slate-400" placeholder="Full Name"
              />
              <input 
                type="text" 
                value={resume.email} 
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full p-2 border border-brand-mint rounded text-sm focus:border-brand-primary outline-none text-slate-800 placeholder-slate-400" placeholder="Email"
              />
              <input 
                type="text" 
                value={resume.phone} 
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full p-2 border border-brand-mint rounded text-sm focus:border-brand-primary outline-none text-slate-800 placeholder-slate-400" placeholder="Phone"
              />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">Professional Summary</h3>
              <Sparkles size={14} className="text-emerald-500" />
            </div>
            <textarea 
              value={resume.summary} 
              onChange={(e) => updateField('summary', e.target.value)}
              className="w-full p-2 border border-brand-mint rounded text-sm h-32 focus:border-brand-primary outline-none text-slate-800 placeholder-slate-400" placeholder="Summary"
            />
          </section>

          {/* Experience Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">Experience</h3>
              <button onClick={() => addItem('experience')} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded" title="Add Experience">
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-4">
              {resume.experience.map(exp => (
                <div key={exp.id} className="p-4 bg-emerald-50 rounded-lg border border-brand-mint space-y-2 relative group">
                  <button onClick={() => removeItem('experience', exp.id)} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 transition-colors" title="Remove">
                    <Trash2 size={14} />
                  </button>
                  <input className="w-full p-2 border border-brand-mint rounded text-sm focus:border-brand-primary outline-none" placeholder="Job Title" value={exp.title} onChange={e => updateItem('experience', exp.id, 'title', e.target.value)} />
                  <input className="w-full p-2 border border-brand-mint rounded text-sm focus:border-brand-primary outline-none" placeholder="Company" value={exp.company} onChange={e => updateItem('experience', exp.id, 'company', e.target.value)} />
                  <input className="w-full p-2 border border-brand-mint rounded text-sm focus:border-brand-primary outline-none" placeholder="Date Range" value={exp.date} onChange={e => updateItem('experience', exp.id, 'date', e.target.value)} />
                  <textarea className="w-full p-2 border border-brand-mint rounded text-sm h-20 resize-y focus:border-brand-primary outline-none" placeholder="Description" value={exp.details} onChange={e => updateItem('experience', exp.id, 'details', e.target.value)} />
                </div>
              ))}
            </div>
          </section>

          {/* Education Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">Education</h3>
              <button onClick={() => addItem('education')} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded" title="Add Education">
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-4">
              {resume.education.map(edu => (
                <div key={edu.id} className="p-4 bg-emerald-50 rounded-lg border border-brand-mint space-y-2 relative group">
                  <button onClick={() => removeItem('education', edu.id)} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 transition-colors" title="Remove">
                    <Trash2 size={14} />
                  </button>
                  <input className="w-full p-2 border border-brand-mint rounded text-sm focus:border-brand-primary outline-none" placeholder="Degree / Certificate" value={edu.title} onChange={e => updateItem('education', edu.id, 'title', e.target.value)} />
                  <input className="w-full p-2 border border-brand-mint rounded text-sm focus:border-brand-primary outline-none" placeholder="Institution" value={edu.company} onChange={e => updateItem('education', edu.id, 'company', e.target.value)} />
                  <input className="w-full p-2 border border-brand-mint rounded text-sm focus:border-brand-primary outline-none" placeholder="Date Range" value={edu.date} onChange={e => updateItem('education', edu.id, 'date', e.target.value)} />
                  <textarea className="w-full p-2 border border-brand-mint rounded text-sm h-20 resize-y focus:border-brand-primary outline-none" placeholder="Details" value={edu.details} onChange={e => updateItem('education', edu.id, 'details', e.target.value)} />
                </div>
              ))}
            </div>
          </section>

          {/* Skills Section (Moved Down) */}
          <section>
            <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-3">Skills</h3>
            <textarea 
              value={resume.skills} 
              onChange={(e) => updateField('skills', e.target.value)}
              className="w-full p-2 border border-brand-mint rounded text-sm h-20 focus:border-brand-primary outline-none text-slate-800 placeholder-slate-400" placeholder="Skills (comma separated)"
            />
          </section>

          {/* Projects Section (New) */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">Projects</h3>
              <button onClick={() => addItem('projects')} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded" title="Add Project">
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-4">
              {resume.projects.map(proj => (
                <div key={proj.id} className="p-4 bg-emerald-50 rounded-lg border border-brand-mint space-y-2 relative group">
                  <button onClick={() => removeItem('projects', proj.id)} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 transition-colors" title="Remove">
                    <Trash2 size={14} />
                  </button>
                  <input className="w-full p-2 border border-brand-mint rounded text-sm focus:border-brand-primary outline-none" placeholder="Project Name" value={proj.name} onChange={e => updateItem('projects', proj.id, 'name', e.target.value)} />
                  <input className="w-full p-2 border border-brand-mint rounded text-sm focus:border-brand-primary outline-none" placeholder="Technologies" value={proj.technologies} onChange={e => updateItem('projects', proj.id, 'technologies', e.target.value)} />
                  <input className="w-full p-2 border border-brand-mint rounded text-sm focus:border-brand-primary outline-none" placeholder="Link (Optional)" value={proj.link} onChange={e => updateItem('projects', proj.id, 'link', e.target.value)} />
                  <textarea className="w-full p-2 border border-brand-mint rounded text-sm h-20 resize-y focus:border-brand-primary outline-none" placeholder="Description" value={proj.description} onChange={e => updateItem('projects', proj.id, 'description', e.target.value)} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 bg-brand-rose p-8 overflow-y-auto print:bg-white print:p-0 print:overflow-visible custom-scrollbar">
        <div className="max-w-[210mm] mx-auto mb-4 flex justify-end no-print gap-2">
           <button 
             onClick={() => setEditMode(!editMode)} 
             className="px-4 py-2 bg-white border border-brand-mint rounded-lg text-brand-deep text-sm font-medium hover:bg-brand-mint/20 md:hidden"
           >
             {editMode ? 'Full Preview' : 'Edit'}
           </button>
           <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-brand-deep text-white rounded-lg text-sm font-medium hover:bg-brand-primary shadow-md"
          >
            <Printer size={16} />
            Print / Save PDF
          </button>
        </div>

        {/* Resume A4 Page */}
        <div className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-xl shadow-brand-primary/10 print:shadow-none p-[20mm]">
          <header className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-tight mb-2">{resume.fullName}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <span>{resume.email}</span>
                <span className="w-1 h-1 bg-slate-400 rounded-full self-center"></span>
                <span>{resume.phone}</span>
              </div>
            </div>
          </header>

          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">Summary</h2>
              <p className="text-slate-700 leading-relaxed text-sm text-justify">
                {resume.summary}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">Experience</h2>
              <div className="space-y-6">
                {resume.experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-slate-800">{exp.title}</h3>
                      <span className="text-sm text-slate-500">{exp.date}</span>
                    </div>
                    <div className="text-sm font-medium text-brand-deep mb-2">{exp.company}</div>
                    <p className="text-sm text-slate-700 leading-relaxed text-justify">{exp.details}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">Education</h2>
              <div className="space-y-6">
                {resume.education.map((edu) => (
                  <div key={edu.id}>
                     <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-slate-800">{edu.title}</h3>
                      <span className="text-sm text-slate-500">{edu.date}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-600 mb-1">{edu.company}</div>
                    <p className="text-sm text-slate-600 text-justify">{edu.details}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
               <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">Skills</h2>
               <p className="text-sm text-slate-700 leading-relaxed">
                 {resume.skills}
               </p>
            </section>

            {/* Projects Section in Preview */}
            {resume.projects.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">Projects</h2>
                <div className="space-y-6">
                  {resume.projects.map((proj) => (
                    <div key={proj.id}>
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-bold text-slate-800">{proj.name}</h3>
                        <span className="text-sm text-slate-500">{proj.technologies}</span>
                      </div>
                      {proj.link && (
                        <div className="text-xs text-brand-primary mb-1">{proj.link}</div>
                      )}
                      <p className="text-sm text-slate-700 leading-relaxed text-justify">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;