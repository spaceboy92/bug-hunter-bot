import React from 'react';
import { LogEntry, GroundingChunk, WebsiteAnalysisResult } from '../constants';

const BrainIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.871 4.156a4.5 4.5 0 016.26 0L12 5.25l.87-1.094a4.5 4.5 0 016.258 0L20.25 5.25v.844c0 1.122-.396 2.193-1.094 3.043l-.001.001-.001.001L12 17.25l-7.154-8.108-.001-.001-.001-.001A4.503 4.503 0 013.75 6.094V5.25l1.121-1.094zM15.75 9.75a3 3 0 00-3-3h-1.5a3 3 0 00-3 3" />
    </svg>
);


const GroundingSources: React.FC<{ sources?: GroundingChunk[] }> = ({ sources }) => {
    if (!sources || sources.length === 0) return null;

    const validSources = sources
      .map(s => s.web || s.retrievedContext)
      .filter((s): s is { uri: string; title: string } => !!(s?.uri && s.title));

    if (validSources.length === 0) return null;

    return (
        <div className="ml-4 my-2 text-xs text-slate-400 animate-fadeIn">
            <p className="font-medium text-slate-300 mb-1">Analysis based on sources including:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
                {validSources.map((source, index) => (
                    <li key={index}>
                        <a 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sky-400 hover:text-sky-300 hover:underline transition-colors"
                            title={source.uri}
                        >
                            {source.title}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const LogLine: React.FC<{ entry: LogEntry }> = ({ entry }) => {
    const getLogClass = (type: LogEntry['type']) => {
        switch (type) {
            case 'error': return 'text-red-400';
            case 'success': return 'text-green-400';
            case 'info': return 'text-slate-400';
            case 'topic': return 'text-purple-400 font-medium';
            case 'summary': return 'text-yellow-300 whitespace-pre-wrap';
            case 'clickup': return 'text-cyan-400';
            case 'agent_thought': return 'text-indigo-300 italic';
            default: return 'text-slate-200';
        }
    };
    
    if (entry.type === 'scan_result' && entry.data) {
        return <GroundingSources sources={(entry.data as Partial<WebsiteAnalysisResult>).groundingData} />;
    }

    if (entry.type === 'agent_thought') {
        return (
            <div className="p-2 my-1 rounded-md bg-slate-900/50 border-l-2 border-indigo-500 animate-fadeIn">
                <div className="flex items-center text-sm font-medium text-indigo-300 mb-1">
                    <BrainIcon /> Agent Thought Process
                </div>
                <p className={`text-sm ${getLogClass(entry.type)} pl-7`}>
                    "{entry.message}"
                </p>
            </div>
        );
    }

    if (!entry.message) return null;

    return (
        <p className={`text-sm ${getLogClass(entry.type)} animate-fadeIn`}>
            {entry.message}
        </p>
    );
};

export const LiveLog: React.FC<{ log: LogEntry[] }> = ({ log }) => {
    return (
        <div className="space-y-1">
            {log.length === 0 && <p className="text-slate-500 text-sm">Scan log will appear here...</p>}
            {log.map((entry, index) => (
                <LogLine key={index} entry={entry} />
            ))}
        </div>
    );
};