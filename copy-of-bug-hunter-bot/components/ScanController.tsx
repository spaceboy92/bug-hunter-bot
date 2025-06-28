import React, { useState } from 'react';

interface ScanControllerProps {
  onStartHunt: () => void;
  onStartAgent: (topic: string) => void;
  onStop: () => void;
  onClear: () => void;
  isProcessRunning: boolean;
  clickUpToken: string;
  setClickUpToken: (token: string) => void;
  clickUpListId: string;
  setClickUpListId: (id: string) => void;
  reporterCredit: string;
  setReporterCredit: (credit: string) => void;
}

const HuntIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 mr-2 ${className}`}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
);
const AgentIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 mr-2 ${className}`}><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
const StopIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2"><path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" /></svg>
);
const ClearIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.691V5.25a2.25 2.25 0 00-2.25-2.25h-4.5a2.25 2.25 0 00-2.25 2.25v4.992m0 0h4.992" /></svg>
);
const CogIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
const ChevronDownIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 transition-transform ${className}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
);
const LoadingSpinner: React.FC = () => (
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
);

export const ScanController: React.FC<ScanControllerProps> = ({
  onStartHunt, onStartAgent, onStop, onClear, isProcessRunning,
  clickUpToken, setClickUpToken, clickUpListId, setClickUpListId,
  reporterCredit, setReporterCredit
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [scanMode, setScanMode] = useState<'hunt' | 'agent'>('hunt');
  const [agentTopic, setAgentTopic] = useState('');

  const handleStart = () => {
    if (scanMode === 'hunt') {
      onStartHunt();
    } else {
      if (agentTopic.trim()) {
        onStartAgent(agentTopic.trim());
      }
    }
  };
  
  return (
    <div className="bg-slate-800 shadow-2xl rounded-lg p-4 md:p-6 border border-slate-700">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-grow w-full md:w-auto">
          <div className="flex w-full bg-slate-700 rounded-lg p-1 mb-3">
              <button onClick={() => setScanMode('hunt')} className={`w-1/2 rounded-md py-2 text-sm font-medium flex items-center justify-center transition-colors ${scanMode === 'hunt' ? 'bg-purple-600 text-white shadow' : 'text-slate-300 hover:bg-slate-600'}`}><HuntIcon className="w-5 h-5 mr-2"/> Hunt Mode</button>
              <button onClick={() => setScanMode('agent')} className={`w-1/2 rounded-md py-2 text-sm font-medium flex items-center justify-center transition-colors ${scanMode === 'agent' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-600'}`}><AgentIcon className="w-5 h-5 mr-2" /> Agent Mode</button>
          </div>
          
          {scanMode === 'agent' && (
            <div className="animate-fadeIn">
              <label htmlFor="agent-topic" className="block text-sm font-medium text-slate-300 mb-1">Initial Investigation Topic</label>
              <input 
                type="text" id="agent-topic" placeholder="e.g., outdated e-commerce sites" value={agentTopic}
                onChange={e => setAgentTopic(e.target.value)} disabled={isProcessRunning}
                className="block w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-200 disabled:opacity-50"
              />
            </div>
          )}
          {scanMode === 'hunt' && (
             <div className="animate-fadeIn">
                <p className="text-sm text-slate-400 p-2 border border-dashed border-slate-600 rounded-md">Hunt mode will auto-generate a diverse set of search queries and scan them sequentially. Good for broad discovery.</p>
             </div>
          )}

        </div>
        
        <div className="flex-shrink-0 flex flex-col gap-2 w-full md:w-auto">
           <button
              onClick={handleStart}
              disabled={isProcessRunning || (scanMode === 'agent' && !agentTopic.trim())}
              className={`flex w-full items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-lg font-medium text-white transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${scanMode === 'hunt' ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'}`}
          >
              {isProcessRunning ? <LoadingSpinner/> : (scanMode === 'hunt' ? <HuntIcon/> : <AgentIcon/>)}
              {isProcessRunning ? 'Working...' : (scanMode === 'hunt' ? 'Start Hunt' : 'Start Agent')}
          </button>
          <div className="flex gap-2">
            <button
                onClick={onStop} disabled={!isProcessRunning}
                className="flex-grow flex items-center justify-center px-4 py-2 border border-red-500/50 rounded-md shadow-sm text-sm font-medium text-red-300 bg-slate-800 hover:bg-red-900/50 disabled:bg-slate-700 disabled:text-slate-500 disabled:border-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-500 transition-colors"
            ><StopIcon/> Stop</button>
            <button
              onClick={onClear} disabled={isProcessRunning}
              className="flex-grow flex items-center justify-center px-4 py-2 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            ><ClearIcon /> Clear</button>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-700/60">
        <button onClick={() => setShowSettings(s => !s)} className="flex items-center text-slate-400 hover:text-slate-200 transition-colors text-sm font-medium">
          <CogIcon />
          <span>Settings & Integrations</span>
          <ChevronDownIcon className={`ml-1 transform transition-transform ${showSettings ? 'rotate-180' : ''}`} />
        </button>
        {showSettings && (
          <div className="mt-3 space-y-4 animate-fadeIn">
            <div>
              <label htmlFor="reporter-credit" className="block text-sm font-medium text-slate-300 mb-1">Reporter Credit</label>
              <input type="text" id="reporter-credit" placeholder="Report by: Your Name (your-email@example.com)" value={reporterCredit}
                onChange={e => setReporterCredit(e.target.value)} disabled={isProcessRunning}
                className="block w-full md:w-2/3 px-3 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-slate-200 disabled:opacity-50"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="clickup-token" className="block text-sm font-medium text-slate-300 mb-1">ClickUp API Token</label>
                <input type="password" id="clickup-token" placeholder="Enter your ClickUp API token" value={clickUpToken}
                  onChange={e => setClickUpToken(e.target.value)} disabled={isProcessRunning}
                  className="block w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-slate-200 disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="clickup-list-id" className="block text-sm font-medium text-slate-300 mb-1">ClickUp List ID</label>
                <input type="text" id="clickup-list-id" placeholder="Enter the target List ID" value={clickUpListId}
                  onChange={e => setClickUpListId(e.target.value)} disabled={isProcessRunning}
                  className="block w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-slate-200 disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};