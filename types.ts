export enum JobStatus {
  APPLIED = 'Applied',
  INTERVIEW = 'Interview',
  OFFER = 'Offer',
  REJECTED = 'Rejected',
  DRAFT = 'Draft',
  ACCEPTED = 'Accepted'
}

export interface Job {
  id: string;
  company: string;
  role: string;
  location: string;
  salary: string;
  status: JobStatus;
  dateApplied: string;
  description: string;
  coverLetter: string;
  interviewGuide?: string;
  email: string;
  origin?: 'application' | 'offer'; // Track where the job was created
}

export interface ResumeSection {
  id: string;
  title: string;
  company: string;
  date: string;
  details: string;
}

export interface Project {
  id: string;
  name: string;
  technologies: string;
  link: string;
  description: string;
}

export interface Resume {
  fullName: string;
  email: string;
  phone: string;
  summary: string;
  skills: string;
  experience: ResumeSection[];
  education: ResumeSection[];
  projects: Project[];
}

export interface JobSearchResult {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  link: string;
  applicationDeadline?: string;
  matchScore: number;
  isValid?: boolean;
  matchesTimePeriod?: boolean;
  analysis: {
    interest: string;
    qualifications: string;
    locationAndType: string;
  };
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  JOBS = 'JOBS',
  JOB_SEARCH = 'JOB_SEARCH',
  OFFERS = 'OFFERS',
  RESUME = 'RESUME'
}