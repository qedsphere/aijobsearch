import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import JobTracker from './components/JobTracker';
import ResumeBuilder from './components/ResumeBuilder';
import JobSearch from './components/JobSearch';
import { Job, ViewState, Resume, JobStatus } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  // Initialize state from localStorage
  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const savedJobs = localStorage.getItem('jobflow_jobs');
      return savedJobs ? JSON.parse(savedJobs) : [];
    } catch (e) {
      console.error("Failed to parse jobs from local storage", e);
      return [];
    }
  });

  // Resume State
  const [resume, setResume] = useState<Resume>({
    fullName: "Jason Dong",
    email: "jasondong1@berkeley.edu",
    phone: "(909) 967-5018",
    summary: "Mathematics and Computer Science student at UC Berkeley with extensive research experience in quantum algorithms, formal verification, and theoretical computer science. Proven track record in mathematical formalization using Lean and molecular simulation for advanced material science.",
    skills: "Quantum Algorithms, Lean Prover, QuTiP, ABINIT, Python, Machine Learning (Deep Learning, LLMs), Real Analysis, Abstract Algebra, Topology, Quantum Mechanics, Statistical Mechanics, Technical Writing.",
    experience: [
      {
        company: "Berkeley Ion Trap Group",
        date: "January 2026 – Present",
        details: "Designing Lindbladian ground-state preparation circuits for qubit–qumode trapped-ion architectures using QuTiP; managing upcoming hardware benchmarking initiatives.",
        id: "1772824849442exp0",
        title: "Quantum Algorithms Researcher"
      },
      {
        company: "TCSlib",
        date: "January 2026 – Present",
        details: "Collaborating with Venkat Guruswami’s research group to formalize Boolean algebra and foundational complexity-theoretic results.",
        id: "1772824849442exp1",
        title: "Theoretical Computer Science Formalization Researcher"
      },
      {
        company: "URAP Researcher - Mina Aganagic Lab",
        date: "January 2026 – Present",
        details: "Developing formalizations for KLRW-modules in Lean to contribute to the ainfinity-lean mathematical library.",
        id: "1772824849442exp2",
        title: "Formal Verification Researcher"
      },
      {
        company: "UC Berkeley",
        date: "August 2025 – December 2025",
        details: "Authored comprehensive research on witness encryption and NP-hardness of learning; delivered technical presentations to graduate-level peers.",
        id: "1772824849442exp3",
        title: "Graduate Complexity Theory Project Lead"
      },
      {
        company: "UC Berkeley Course Staff",
        date: "August 2025 – Present",
        details: "Serving as a Teaching Intern for CS70 and a Reader for Physics 7B, facilitating student learning in discrete mathematics and thermodynamics.",
        id: "1772824849442exp4",
        title: "Teaching Intern & Reader"
      },
      {
        company: "NGRD (Dr. Xuan Luo Lab)",
        date: "December 2022 – 2023",
        details: "Utilized ABINIT to optimize silicene dopants for SO2 adsorption by analyzing band-gap structures and charge transfer mechanisms.",
        id: "1772824849442exp5",
        title: "Molecular Simulation Researcher"
      },
      {
        company: "UCIxGATI (Siwy Research Lab)",
        date: "June 2023 – August 2023",
        details: "Fabricated and characterized nanopores for molecular identification; presented findings to 70+ scientific fellows and published a peer-reviewed paper on machine ethics.",
        id: "1772824849442exp6",
        title: "Ionic Channels and Nanopore Systems Intern"
      }
    ],
    education: [
      {
        company: "University of California, Berkeley",
        date: "September 2024 – Present",
        details: "Bachelor of Science in Math and Computer Science (sGPA: 3.85). Advanced coursework includes Complexity Theory, Proving Theorems in Lean, Quantum Algorithms, Differential Topology, and Abstract Algebra.",
        id: "1772824849442edu0",
        title: "Bachelor of Science"
      },
      {
        company: "California State University, Fullerton",
        date: "August 2023 – 2024",
        details: "Completed High School Supplementary Courses in Topology, Introduction to Quantum Mechanics, Modern Algebra, and Mathematical Probability.",
        id: "1772824849442edu1",
        title: "High School Supplementary Courses"
      }
    ],
    projects: [
      {
        description: "Developing LLM time speedup methods utilizing Grover’s algorithm to traverse tree-of-thought models; lead biweekly research discussions on quantum computing papers.",
        id: "1772824849442proj0",
        link: "https://github.com/qedsphere",
        name: "Quantum Computing @ Berkeley",
        technologies: "Quantum ML, Python, Grover's Algorithm"
      },
      {
        description: "Designed and modeled a quadcopter from scratch for the VTOL mechanical team, including 3D printing components and full vehicle assembly.",
        id: "1772824849442proj1",
        link: "",
        name: "Berkeley UAV Team",
        technologies: "CAD, 3D Printing, Mechanical Engineering"
      },
      {
        description: "Collaborated in a four-person team to engineer a hammersaw robot for the Sacramento Battlebots competition.",
        id: "1772824849442proj2",
        link: "",
        name: "Berkeley Combat Robotics",
        technologies: "Robotics, Mechanical Design"
      }
    ]
  });

  // Job Search State
  const [jobSearchParams, setJobSearchParams] = useState({ role: '', location: '', type: 'Full-time', interests: '', timePeriod: '' });
  const [isSearchingJobs, setIsSearchingJobs] = useState(false);
  const [jobSearchResults, setJobSearchResults] = useState<any[]>([]);
  const [jobSearchError, setJobSearchError] = useState<string | null>(null);

  // Save to localStorage whenever jobs change
  useEffect(() => {
    try {
      localStorage.setItem('jobflow_jobs', JSON.stringify(jobs));
    } catch (e) {
      console.error("Failed to save jobs to local storage", e);
    }
  }, [jobs]);

  const handleJobStatusChange = (job: Job, newStatus: JobStatus) => {
    // Status change logic removed as it was tied to Claire
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard jobs={jobs} />;
      case ViewState.JOB_SEARCH:
        return <JobSearch 
          resume={resume} 
          onAddJob={(job) => setJobs(prev => [...prev, job])} 
          existingJobIds={jobs.map(j => j.id)} 
          searchParams={jobSearchParams}
          setSearchParams={setJobSearchParams}
          isSearching={isSearchingJobs}
          setIsSearching={setIsSearchingJobs}
          results={jobSearchResults}
          setResults={setJobSearchResults}
          error={jobSearchError}
          setError={setJobSearchError}
        />;
      case ViewState.JOBS:
        return <JobTracker jobs={jobs} setJobs={setJobs} viewMode="applications" onStatusChange={handleJobStatusChange} />;
      case ViewState.OFFERS:
        return <JobTracker jobs={jobs} setJobs={setJobs} viewMode="offers" onStatusChange={handleJobStatusChange} />;
      case ViewState.RESUME:
        return <ResumeBuilder resume={resume} setResume={setResume} />;
      default:
        return <Dashboard jobs={jobs} />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-rose text-slate-800 font-sans">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
      />
      
      <main className="flex-1 h-screen overflow-auto relative custom-scrollbar">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;