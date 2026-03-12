import React from 'react';
import { LayoutDashboard, Briefcase, FileText, Settings, LogOut, CheckCircle, Search } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const mainNavItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewState.JOB_SEARCH, label: 'Job Search', icon: Search },
    { id: ViewState.JOBS, label: 'My Applications', icon: Briefcase },
    { id: ViewState.OFFERS, label: 'Offers Received', icon: CheckCircle },
    { id: ViewState.RESUME, label: 'Resume Builder', icon: FileText },
  ];

  return (
    <div className="w-64 bg-brand-primary h-screen border-r border-white/20 flex flex-col flex-shrink-0 no-print sticky top-0 shadow-xl shadow-brand-primary/20 z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/10">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">JobFlow</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-bold ${
                isActive
                  ? 'bg-white text-brand-deep shadow-lg shadow-black/5'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-brand-deep' : 'text-white'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/20 mt-auto">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/20 transition-colors font-bold">
          <Settings size={20} className="text-white" />
          Settings
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/20 transition-colors font-bold">
          <LogOut size={20} className="text-white" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;