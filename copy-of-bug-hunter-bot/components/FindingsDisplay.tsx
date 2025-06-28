import React, { useState, useEffect, useMemo } from 'react';
import { AnalyzedSite, PotentialBugArea } from '../constants';

const severityMap: { [key: string]: { class: string; border: string; order: number, iconClass: string; } } = {
  high: { class: 'bg-red-500 text-white', border: 'border-red-500', order: 4, iconClass: 'text-red-400' },
  medium: { class: 'bg-orange-400 text-white', border: 'border-orange-400', order: 3, iconClass: 'text-orange-400' },
  low: { class: 'bg-yellow-400 text-slate-900', border: 'border-yellow-400', order: 2, iconClass: 'text-yellow-400' },
  informational: { class: 'bg-sky-400 text-white', border: 'border-sky-400', order: 1, iconClass: 'text-sky-400' },
  default: { class: 'bg-slate-600 text-slate-100', border: 'border-slate-600', order: 0, iconClass: 'text-slate-400' },
};

const getSeverityDetails = (severity?: string) => {
    if (!severity) return severityMap.default;
    return severityMap[severity.toLowerCase()] || severityMap.default;
};

// --- ICONS ---
const ShieldIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.917l9 3 9-3a12.02 12.02 0 00-2.382-9.984z" /></svg>;
const BulbIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const TerminalIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>;
const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${className ?? ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const CheckIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className || 'text-green-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const DownloadIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const ClickUpIcon: React.FC = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2 fill-current"><path d="M11.232 2.2H6.415c-.91 0-1.745.421-2.288 1.134L.502 8.657a.899.899 0 0 0 .04 1.22l3.626 3.018a2.62 2.62 0 0 0 3.23.018l3.826-2.903a2.41 2.41 0 0 0 1.058-2.008V2.2zm.001 2.879v4.103a.58.58 0 0 1-.257.487L7.15 12.09c-.78.59-1.89.57-2.64-.04L.885 9.274l3.1-5.32c.13-.22.36-.353.61-.353h5.638v2.28zM21.75 8.657l-3.625-5.323c-.544-.713-1.379-1.134-2.288-1.134h-4.817v9.802c0 .86.43 1.65 1.14 2.12l3.754 2.902a2.622 2.622 0 0 0 3.231-.018l3.626-3.018a.9.9 0 0 0 .04-1.22z"/></svg>;
const EmailIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 mr-2 ${className}`}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;


const UploadStatusIndicator: React.FC<{ status?: AnalyzedSite['uploadStatus'] }> = ({ status }) => {
    if (!status || status === 'idle') return null;
    const statusMap = {
        uploading: { icon: <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-300"></div>, text: 'Uploading...', class: 'text-sky-300' },
        success: { icon: <CheckIcon className="h-5 w-5 text-green-400" />, text: 'Uploaded', class: 'text-green-400' },
        error: { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, text: 'Failed', class: 'text-red-400' }
    };
    const currentStatus = statusMap[status];
    return <div title={currentStatus.text} className={`flex items-center gap-1.5 text-xs font-medium ${currentStatus.class}`}> {currentStatus.icon} <span className="hidden xl:inline">{currentStatus.text}</span></div>;
}

const useCopyToClipboard = (): [string | null, (text: string, type: string) => void] => {
    const [copiedType, setCopiedType] = useState<string | null>(null);
    const copy = (text: string, type: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedType(type);
            setTimeout(() => setCopiedType(null), 2000);
        });
    };
    return [copiedType, copy];
};

const BugDetail: React.FC<{ area: PotentialBugArea; copyToClipboard: (text: string, type: string) => void; copiedType: string | null; }> = ({ area, copyToClipboard, copiedType }) => {
    const { class: severityClass } = getSeverityDetails(area.hypotheticalSeverity);
    return (
        <div className="py-3 px-4 bg-slate-900/50 rounded-md">
            <div className="flex justify-between items-start gap-2"><h4 className="font-bold text-slate-200 text-base">{area.area}</h4><span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${severityClass}`}>{area.hypotheticalSeverity || 'N/A'}</span></div>
            <div className="mt-3 space-y-3 text-sm text-slate-300">
                <div className="flex items-start"><ShieldIcon /><p><strong className="font-medium text-slate-400">Reasoning:</strong> {area.reasoning}</p></div>
                <div className="flex items-start"><BulbIcon /><p><strong className="font-medium text-slate-400">Suggestion:</strong> {area.suggestion}</p></div>
                 {area.hypotheticalToolOutput && (
                    <div className="flex items-start"><TerminalIcon />
                        <div><strong className="font-medium text-slate-400">Hypothetical Tool Output:</strong>
                            <div className="relative"><pre className="whitespace-pre-wrap p-2 mt-1 bg-black/50 rounded text-xs font-mono text-sky-300 pr-20">{area.hypotheticalToolOutput}</pre>
                                <button onClick={() => copyToClipboard(area.hypotheticalToolOutput!, `tool-${area.area}`)} className="absolute top-1 right-1 flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 transition-colors">
                                    {copiedType === `tool-${area.area}` ? <CheckIcon /> : <ClipboardIcon className="w-3 h-3"/>} {copiedType === `tool-${area.area}` ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface SiteFindingCardProps {
    site: AnalyzedSite;
    onGeneratePdf: (site: AnalyzedSite) => Blob;
    onGenerateMarkdown: (site: AnalyzedSite) => string;
    onGenerateEmailBody: (site: AnalyzedSite) => string;
    onClickUpUpload: (site: AnalyzedSite) => void;
    onReportViaEmail: (site: AnalyzedSite, recipient: string) => void;
}

const SiteFindingCard: React.FC<SiteFindingCardProps> = ({ site, onGeneratePdf, onGenerateMarkdown, onGenerateEmailBody, onClickUpUpload, onReportViaEmail }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [isEmailing, setIsEmailing] = useState(false);
    const [emailRecipient, setEmailRecipient] = useState('');
    const [copiedType, copyToClipboard] = useCopyToClipboard();
    const actionsRef = React.useRef<HTMLDivElement>(null);

    const maxSeverity = site.potentialBugAreas.reduce((max, area) => {
        const currentSeverity = getSeverityDetails(area.hypotheticalSeverity);
        return currentSeverity.order > max.order ? currentSeverity : max;
    }, severityMap.default);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
              setIsActionsOpen(false);
              setIsEmailing(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDownloadPdf = () => {
        const blob = onGeneratePdf(site);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BugReport-${site.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsActionsOpen(false);
    };

    const handleCopyMarkdown = () => {
        const markdown = onGenerateMarkdown(site);
        copyToClipboard(markdown, `markdown-${site.id}`);
        setIsActionsOpen(false);
    };
    
    const handlePrimaryCopy = () => {
        const markdown = onGenerateMarkdown(site);
        copyToClipboard(markdown, `primary-markdown-${site.id}`);
    };
    
    const handleCopyEmail = () => {
        const body = onGenerateEmailBody(site);
        const recipient = site.contactEmail || 'security@example.com';
        const subject = `Responsible Disclosure - Bug Report for ${site.title}`;
        const fullEmail = `To: ${recipient}\nSubject: ${subject}\n\n${body}`;
        copyToClipboard(fullEmail, `email-${site.id}`);
        setIsActionsOpen(false);
    };
    
    const handleEmailSubmit = () => {
        if (!emailRecipient) return;
        onReportViaEmail(site, emailRecipient);
        setIsEmailing(false);
        setEmailRecipient('');
        setIsActionsOpen(false);
    };

    return (
        <div className={`bg-slate-800 border border-slate-700 rounded-lg overflow-hidden animate-fadeIn border-l-4 ${maxSeverity.border}`}>
            <div className="w-full flex justify-between items-center p-4 bg-slate-700/50 text-left">
                <button onClick={() => setIsExpanded(!isExpanded)} className="flex-grow text-left pr-4">
                    <h3 className="font-bold text-lg text-purple-400">{site.title}</h3>
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-400 hover:underline break-all" onClick={e => e.stopPropagation()}>{site.url}</a>
                </button>
                <div className="flex items-center gap-3 pl-4 flex-shrink-0">
                    <UploadStatusIndicator status={site.uploadStatus} />
                    <span className="text-sm font-medium text-slate-300 hidden md:block">{site.potentialBugAreas.length} issue(s)</span>
                    
                    <button
                        onClick={handlePrimaryCopy}
                        className="flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-slate-600 hover:bg-slate-500 transition-colors text-slate-200 w-32"
                        title="Copy report as Markdown"
                    >
                        {copiedType === `primary-markdown-${site.id}` ? (
                            <>
                                <CheckIcon className="h-5 w-5 mr-1.5" />
                                <span>Copied!</span>
                            </>
                        ) : (
                            <>
                                <ClipboardIcon className="h-5 w-5 mr-1.5" />
                                <span>Copy Report</span>
                            </>
                        )}
                    </button>
                    
                    <div className="relative" ref={actionsRef}>
                        <button onClick={() => setIsActionsOpen(s => !s)} className="p-1 rounded-md hover:bg-slate-600 focus:bg-slate-600 focus:outline-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                        {isActionsOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-md shadow-lg z-10 animate-fadeIn">
                                {isEmailing ? (
                                    <form onSubmit={e => { e.preventDefault(); handleEmailSubmit(); }} className="p-2 space-y-2">
                                        <label htmlFor={`email-${site.id}`} className="block text-xs font-medium text-slate-300">Recipient Email:</label>
                                        <input
                                          type="email"
                                          id={`email-${site.id}`}
                                          value={emailRecipient}
                                          onChange={e => setEmailRecipient(e.target.value)}
                                          placeholder="security@example.com"
                                          required
                                          autoFocus
                                          className="block w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={() => setIsEmailing(false)} className="px-3 py-1 text-xs rounded bg-slate-600 hover:bg-slate-500 transition-colors">Cancel</button>
                                            <button type="submit" className="px-3 py-1 text-xs rounded bg-purple-600 hover:bg-purple-700 text-white transition-colors">Draft Email</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="py-1">
                                        {site.contactEmail ? (
                                            <button onClick={() => { onReportViaEmail(site, site.contactEmail!); setIsActionsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-700" title={`Draft an email to ${site.contactEmail}`}>
                                                <EmailIcon className="text-green-400"/>
                                                <span className="truncate">Draft Email to: {site.contactEmail}</span>
                                            </button>
                                        ) : (
                                            <button onClick={() => setIsEmailing(true)} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-700">
                                                <EmailIcon className="text-slate-400"/> Draft Email...
                                            </button>
                                        )}
                                        <div className="border-t border-slate-700 my-1"></div>
                                        <button onClick={handleCopyMarkdown} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"><ClipboardIcon /> {copiedType === `markdown-${site.id}` ? "Copied!" : "Copy Report as Markdown"}</button>
                                        <button onClick={handleCopyEmail} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"><ClipboardIcon /> {copiedType === `email-${site.id}` ? "Copied!" : "Copy Full Email"}</button>
                                        <button onClick={handleDownloadPdf} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"><DownloadIcon /> Download PDF Report</button>
                                        <div className="border-t border-slate-700 my-1"></div>
                                        <button onClick={() => { onClickUpUpload(site); setIsActionsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50" disabled={site.uploadStatus === 'uploading' || !site.uploadStatus}>
                                            <ClickUpIcon /> Send to ClickUp
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isExpanded && <div className="p-4 space-y-3"> {site.potentialBugAreas.map((area, index) => <BugDetail key={index} area={area} copyToClipboard={copyToClipboard} copiedType={copiedType} />)}</div>}
        </div>
    );
};

const IdleDisplay: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 animate-fadeIn pt-10">
        <div className="relative mb-4">
            <div className="w-24 h-24 border-2 border-purple-400/50 rounded-full" style={{ animation: 'pulse-glow 3s infinite ease-in-out' }}></div>
            <div className="absolute inset-0 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-purple-400"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg></div>
        </div>
        <h3 className="text-xl font-bold text-slate-300">Vulnerability Report Hub</h3>
        <p>Start a hunt or an agent investigation to begin populating findings.</p>
    </div>
);

const FindingSkeletons: React.FC = () => <div className="space-y-4 pt-10">{[...Array(2)].map((_, i) => <div key={i} className="bg-slate-800 border border-slate-700 rounded-lg p-4 animate-skeleton"><div className="h-6 bg-slate-700 rounded w-3/4 mb-2"></div><div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div><div className="space-y-3"><div className="h-10 bg-slate-700/50 rounded"></div><div className="h-10 bg-slate-700/50 rounded"></div></div></div>)}</div>;

const StatsBar: React.FC<{ sites: AnalyzedSite[] }> = ({ sites }) => {
    const stats = useMemo(() => {
        const totalIssues = sites.reduce((acc, site) => acc + site.potentialBugAreas.length, 0);
        const severities = { high: 0, medium: 0, low: 0, informational: 0 };
        sites.forEach(site => {
            site.potentialBugAreas.forEach(area => {
                const severity = area.hypotheticalSeverity?.toLowerCase() || 'informational';
                if (severity in severities) {
                    severities[severity as keyof typeof severities]++;
                }
            });
        });
        return { totalSites: sites.length, totalIssues, severities };
    }, [sites]);

    const statItems = [
      { label: 'High', count: stats.severities.high, color: severityMap.high.iconClass },
      { label: 'Medium', count: stats.severities.medium, color: severityMap.medium.iconClass },
      { label: 'Low', count: stats.severities.low, color: severityMap.low.iconClass },
      { label: 'Info', count: stats.severities.informational, color: severityMap.informational.iconClass },
    ];

    return (
        <div className="flex-shrink-0 mb-4 p-3 bg-slate-900/50 border border-slate-700 rounded-lg flex flex-wrap items-center justify-between gap-4 text-sm animate-fadeIn">
            <div className="flex items-center gap-4">
                <div><span className="font-bold text-slate-200 text-lg">{stats.totalSites}</span> <span className="text-slate-400">Sites</span></div>
                <div><span className="font-bold text-slate-200 text-lg">{stats.totalIssues}</span> <span className="text-slate-400">Issues</span></div>
            </div>
            <div className="flex items-center gap-3 text-xs">
                {statItems.map(item => (
                    <div key={item.label} className="flex items-center" title={`${item.count} ${item.label} severity issues`}>
                        <div className={`w-2.5 h-2.5 rounded-full mr-1.5 ${item.color.replace('text-', 'bg-')}`}></div>
                        <span className="font-bold text-slate-200">{item.count}</span>
                        <span className="text-slate-400 ml-1 hidden sm:inline">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


interface FindingsDisplayProps {
  sites: AnalyzedSite[];
  isLoading: boolean;
  scanInitiated: boolean;
  onDownloadReport: (filteredSites: AnalyzedSite[]) => void;
  onGeneratePdfForSite: (site: AnalyzedSite) => Blob;
  onGenerateMarkdownForSite: (site: AnalyzedSite) => string;
  onGenerateEmailBody: (site: AnalyzedSite) => string;
  onClickUpUpload: (site: AnalyzedSite) => void;
  onReportViaEmail: (site: AnalyzedSite, recipient: string) => void;
}

export const FindingsDisplay: React.FC<FindingsDisplayProps> = ({ sites, isLoading, scanInitiated, onDownloadReport, onGeneratePdfForSite, onGenerateMarkdownForSite, onGenerateEmailBody, onClickUpUpload, onReportViaEmail }) => {
    const [severityFilter, setSeverityFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSites = useMemo(() => {
        return sites
            .filter(site => {
                const term = searchTerm.toLowerCase();
                if (!term) return true;
                return site.title.toLowerCase().includes(term) || site.url.toLowerCase().includes(term);
            })
            .filter(site => {
                if (severityFilter === 'all') return true;
                return site.potentialBugAreas.some(area => area.hypotheticalSeverity?.toLowerCase() === severityFilter);
            })
            .sort((a, b) => { // Highest severity first
                const aMax = Math.max(0, ...a.potentialBugAreas.map(p => getSeverityDetails(p.hypotheticalSeverity).order));
                const bMax = Math.max(0, ...b.potentialBugAreas.map(p => getSeverityDetails(p.hypotheticalSeverity).order));
                return bMax - aMax;
            });
    }, [sites, severityFilter, searchTerm]);


    if (isLoading && sites.length === 0) return <FindingSkeletons />;
    if (!scanInitiated && sites.length === 0) return <IdleDisplay />;

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xl font-bold text-slate-200 mb-4 border-b border-slate-700 pb-2 flex-shrink-0">Vulnerability Report Hub</h2>
            {sites.length > 0 && <StatsBar sites={sites} />}

            {(sites.length > 0 || searchTerm || severityFilter !== 'all') && (
              <div className="flex-shrink-0 mb-4 flex flex-col sm:flex-row gap-3">
                  <input type="text" placeholder="Search by title or URL..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:flex-grow px-3 py-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-slate-200" />
                  <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                      <option value="all">All Severities</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                      <option value="informational">Informational</option>
                  </select>
                  <button onClick={() => onDownloadReport(filteredSites)} disabled={filteredSites.length === 0} className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-slate-900 bg-sky-400 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <DownloadIcon /> Download Filtered Report
                  </button>
              </div>
            )}
            
            {sites.length > 0 ? (
                filteredSites.length > 0 ? (
                    <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                        {filteredSites.map((site) => <SiteFindingCard key={site.id} site={site} onGeneratePdf={onGeneratePdfForSite} onGenerateMarkdown={onGenerateMarkdownForSite} onGenerateEmailBody={onGenerateEmailBody} onClickUpUpload={onClickUpUpload} onReportViaEmail={onReportViaEmail} />)}
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-500"><p>No findings match your current filters.</p></div>
                )
            ) : (
                 <div className="flex items-center justify-center h-full text-center py-10 text-slate-500 animate-fadeIn">
                    <div>
                        <p className="text-lg font-medium text-slate-400">Scan Complete.</p>
                        <p>No actionable vulnerabilities found during the last run.</p>
                    </div>
                </div>
            )}
        </div>
    );
};