import React, { useState, useCallback, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ScanController } from './components/ScanController';
import { LiveLog } from './components/AnalysisDisplay';
import { FindingsDisplay } from './components/FindingsDisplay';
import { searchAndAnalyzeWebsites, generateInitialQueries, generateFollowUpQuery } from './services/geminiService';
import { createClickUpTask, uploadAttachmentToClickUpTask } from './services/clickupService';
import { LogEntry, AnalyzedSite, PotentialBugArea } from './constants';

export const App: React.FC = () => {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [findings, setFindings] = useState<AnalyzedSite[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scanInitiated, setScanInitiated] = useState<boolean>(false);
  
  // Modes
  const [isHunting, setIsHunting] = useState<boolean>(false); // For multi-query hunt
  const [isAgentRunning, setIsAgentRunning] = useState<boolean>(false); // For agent mode
  
  // Hunt Mode State
  const [queries, setQueries] = useState<string[]>([]);
  const [currentQueryIndex, setCurrentQueryIndex] = useState<number>(0);

  // Agent Mode State
  const [agentInitialTopic, setAgentInitialTopic] = useState<string>('');
  const [agentHistory, setAgentHistory] = useState<{ query: string, findingsSummary: string }[]>([]);
  const [agentLoopCount, setAgentLoopCount] = useState(0);
  const MAX_AGENT_LOOPS = 5;

  // Settings & Integrations State
  const [clickUpToken, setClickUpToken] = useState<string>('');
  const [clickUpListId, setClickUpListId] = useState<string>('');
  const [reporterCredit, setReporterCredit] = useState<string>('Report by: Abijeet Das (itz_spaceboy92@gmail.com)');

  const logContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [log]);
  
  const addLog = useCallback((newEntry: LogEntry) => {
    setLog(prevLog => [...prevLog, newEntry]);
  }, []);

  const setSiteUploadStatus = useCallback((siteId: string, status: AnalyzedSite['uploadStatus']) => {
    setFindings(prev => prev.map(f => f.id === siteId ? { ...f, uploadStatus: status } : f));
  }, []);

  const generatePdfForSite = useCallback((site: AnalyzedSite): Blob => {
    const doc = new jsPDF();
    // ... (rest of PDF generation logic remains the same, but uses reporterCredit)
    doc.text(reporterCredit, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, {align: 'center'});
    // ...
    return doc.output('blob');
  }, [reporterCredit]);

  const generateMarkdownForSite = useCallback((site: AnalyzedSite): string => {
    let markdown = `> ${reporterCredit}\n\n`;
    markdown += `# Bug Report for: ${site.title}\n\n`;
    markdown += `**URL:** ${site.url}\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `This report details ${site.potentialBugAreas.length} potential vulnerabilities discovered during an automated scan.\n\n`;
    
    site.potentialBugAreas.forEach((area, index) => {
        markdown += `---\n\n`;
        markdown += `### ${index + 1}. ${area.area}\n\n`;
        markdown += `*   **Severity:** ${area.hypotheticalSeverity || 'N/A'}\n`;
        markdown += `*   **Reasoning:** ${area.reasoning}\n`;
        markdown += `*   **Suggested Test:** ${area.suggestion}\n\n`;
        if (area.hypotheticalToolOutput) {
            markdown += `**Hypothetical Tool Output:**\n`;
            markdown += `\`\`\`\n${area.hypotheticalToolOutput}\n\`\`\`\n\n`;
        }
    });

    return markdown;
  }, [reporterCredit]);

  const generateEmailBody = useCallback((site: AnalyzedSite): string => {
    const reportMarkdown = generateMarkdownForSite(site);
    const creditParts = reporterCredit.split('(');
    const name = creditParts[0].replace('Report by:', '').trim();
    const email = creditParts[1] ? creditParts[1].replace(')', '').trim() : 'your-email@example.com';
    
    return `Hi Security Team,\n\nI'm a security researcher and I believe I've found some potential security vulnerabilities on your site. Please see the report I've included below.\n\nThank you for your time and consideration.\n\nKind regards,\n${name}\n${email}\n\n----------------------------------------\n\n${reportMarkdown}`;
  }, [generateMarkdownForSite, reporterCredit]);
  
  const handleUploadToClickUp = useCallback(async (site: AnalyzedSite) => {
      if (!clickUpToken || !clickUpListId) {
          addLog({ type: 'error', message: `[ClickUp] Token or List ID is missing. Cannot upload.`});
          return;
      }
      setSiteUploadStatus(site.id, 'uploading');
      addLog({ type: 'clickup', message: `[ClickUp] Preparing report for ${site.title}...` });

      try {
          const pdfBlob = generatePdfForSite(site);
          const fileName = `BugReport-${site.title.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.pdf`;
          
          addLog({ type: 'clickup', message: `[ClickUp] Creating task...` });
          const { id: taskId } = await createClickUpTask(
              clickUpToken,
              clickUpListId,
              site,
              reporterCredit
          );

          addLog({ type: 'clickup', message: `[ClickUp] Uploading PDF attachment...` });
          await uploadAttachmentToClickUpTask(clickUpToken, taskId, pdfBlob, fileName);
          
          setSiteUploadStatus(site.id, 'success');
          addLog({ type: 'success', message: `[ClickUp] Successfully created task for ${site.title}.` });
      } catch (err) {
          setSiteUploadStatus(site.id, 'error');
          addLog({ type: 'error', message: `[ClickUp] Failed to upload for ${site.title}: ${err instanceof Error ? err.message : String(err)}` });
      }
  }, [addLog, setSiteUploadStatus, clickUpToken, clickUpListId, generatePdfForSite, reporterCredit]);

  const handleReportViaEmail = useCallback((site: AnalyzedSite, recipient: string) => {
    if (!recipient) return;
    addLog({ type: 'info', message: `Attempting to open default mail client for ${recipient}...` });
    const subject = `Responsible Disclosure - Bug Report for ${site.title}`;
    const emailBody = generateEmailBody(site);
    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    if (mailtoUrl.length > 2000) {
      addLog({ type: 'error', message: 'Report is too long for a direct mail link. Copying to clipboard instead.' });
      navigator.clipboard.writeText(emailBody).then(() => {
        addLog({ type: 'success', message: `Full email body copied! Please paste it into a new email to ${recipient}.` });
      }).catch(err => {
        addLog({ type: 'error', message: `Failed to copy to clipboard: ${err}` });
      });
      return;
    }
    window.location.href = mailtoUrl;
    addLog({ type: 'success', message: `Hand-off to mail client complete. Please review and send.` });
  }, [addLog, generateEmailBody]);

  const runScan = useCallback(async (query: string) => {
    setIsLoading(true);
    setScanInitiated(true);
    addLog({ type: 'topic', message: `--- Scanning with query: "${query}" ---` });

    try {
        const analysisResult = await searchAndAnalyzeWebsites(query);
        const sites = analysisResult.analyzedSites || [];
        const bugCount = sites.reduce((acc, site) => acc + site.potentialBugAreas.length, 0);

        if (sites.length > 0) {
            addLog({ type: 'success', message: `[SUCCESS] Found ${sites.length} sites. Identified ${bugCount} potential issues.` });
            if (analysisResult.groundingData && analysisResult.groundingData.length > 0) {
              addLog({ type: 'scan_result', message: '', data: { groundingData: analysisResult.groundingData } });
            }
            const sitesToProcess = sites.filter(s => s.potentialBugAreas.length > 0).map(site => ({ 
                ...site, id: `${site.url}-${Date.now()}`, searchQuery: query, uploadStatus: 'idle' as const 
            }));
            setFindings(prev => [...prev, ...sitesToProcess]);
        } else {
             addLog({ type: 'info', message: `[INFO] No relevant sites found for this query.` });
        }
        
        if (isAgentRunning) {
            const summary = sites.length > 0 ? `${sites.length} sites found with ${bugCount} total potential issues.` : 'No relevant sites found.';
            setAgentHistory(prev => [...prev, { query, findingsSummary: summary }]);
        }
    } catch (err) {
        addLog({ type: 'error', message: `[!] Error scanning query "${query}": ${err instanceof Error ? err.message : String(err)}` });
        if(isAgentRunning) setIsAgentRunning(false);
        if(isHunting) setIsHunting(false);
    } finally {
        addLog({ type: 'summary', message: `--- Scan for "${query}" Complete ---` });
        setIsLoading(false);
    }
  }, [addLog, isAgentRunning, isHunting]);

  useEffect(() => {
    if (isLoading || (!isHunting && !isAgentRunning)) return;

    const huntLoop = () => {
        const nextIndex = currentQueryIndex + 1;
        if (nextIndex < queries.length) {
            addLog({ type: 'info', message: `--- Pausing for 3s before hunt ${nextIndex + 1}/${queries.length}... ---` });
            const timer = setTimeout(() => {
                setCurrentQueryIndex(nextIndex);
                runScan(queries[nextIndex]);
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setIsHunting(false);
            addLog({ type: 'summary', message: '--- Autonomous Hunt Complete ---' });
            if (findings.length > 0) addLog({ type: 'success', message: '[*] All findings logged in the Report Hub.' });
        }
    };
    
    const agentLoop = async () => {
        if (agentLoopCount >= MAX_AGENT_LOOPS) {
            addLog({ type: 'summary', message: `--- Agent reached max iterations (${MAX_AGENT_LOOPS}). Halting. ---` });
            setIsAgentRunning(false);
            return;
        }
        try {
            addLog({ type: 'info', message: `[AGENT] Thinking about step ${agentLoopCount + 2}/${MAX_AGENT_LOOPS + 1}...` });
            const { reasoning, nextQuery } = await generateFollowUpQuery(agentInitialTopic, agentHistory);
            addLog({ type: 'agent_thought', message: `${reasoning}`});
            setAgentLoopCount(prev => prev + 1);
            await new Promise(resolve => setTimeout(resolve, 2000));
            await runScan(nextQuery);
        } catch (err) {
            addLog({ type: 'error', message: `[!] Agent failed: ${err instanceof Error ? err.message : String(err)}` });
            setIsAgentRunning(false);
        }
    };

    if (isHunting) huntLoop();
    else if (isAgentRunning) agentLoop();

  }, [isLoading, isHunting, isAgentRunning, queries, currentQueryIndex, agentLoopCount, agentHistory, agentInitialTopic, addLog, runScan, findings.length]);

  const startHunt = useCallback(async () => {
    setIsLoading(true);
    setScanInitiated(true);
    setIsHunting(true);
    addLog({ type: 'topic', message: '--- Starting Autonomous Hunt ---' });
    addLog({ type: 'info', message: 'Generating initial scan topics...' });
    try {
      const generatedQueries = await generateInitialQueries();
      if (!generatedQueries || generatedQueries.length === 0) throw new Error("AI failed to generate scan topics.");
      addLog({ type: 'success', message: `[SUCCESS] Generated ${generatedQueries.length} topics.` });
      setQueries(generatedQueries);
      setCurrentQueryIndex(0);
      await runScan(generatedQueries[0]);
    } catch (err) {
      addLog({ type: 'error', message: `[!] Failed to start hunt: ${err instanceof Error ? err.message : String(err)}` });
      setIsHunting(false);
      setIsLoading(false);
    }
  }, [addLog, runScan]);

  const startAgent = useCallback(async (topic: string) => {
    setIsLoading(true);
    setScanInitiated(true);
    setIsAgentRunning(true);
    setAgentInitialTopic(topic);
    setAgentHistory([]);
    setAgentLoopCount(0);
    addLog({ type: 'topic', message: `--- Starting Agent Investigation ---`});
    addLog({ type: 'info', message: `Initial Topic: "${topic}"`});
    await runScan(topic);
  }, [addLog, runScan]);

  const stopProcess = useCallback(() => {
    if (isHunting) {
        setIsHunting(false);
        addLog({ type: 'summary', message: '--- Hunt Manually Stopped ---' });
    }
    if (isAgentRunning) {
        setIsAgentRunning(false);
        addLog({ type: 'summary', message: '--- Agent Manually Stopped ---' });
    }
  }, [addLog, isHunting, isAgentRunning]);
  
  const resetSession = useCallback(() => {
    setIsHunting(false);
    setIsAgentRunning(false);
    setQueries([]);
    setCurrentQueryIndex(0);
    setAgentHistory([]);
    setLog([]);
    setFindings([]);
    setScanInitiated(false);
    addLog({ type: 'info', message: 'Session cleared. Ready for a new hunt or investigation.' });
  },[addLog]);

  const handleDownloadReport = (filteredFindings: AnalyzedSite[]) => {
    if (filteredFindings.length === 0) return;
    const doc = new jsPDF();
    // ... logic is the same, but uses reporterCredit
    doc.text(reporterCredit, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, {align: 'center'});
    // ...
    doc.save(`BugHunter-ScanReport-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const anyProcessRunning = isHunting || isAgentRunning || isLoading;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col">
        <ScanController 
            onStartHunt={startHunt}
            onStartAgent={startAgent}
            onStop={stopProcess}
            onClear={resetSession}
            isProcessRunning={anyProcessRunning}
            clickUpToken={clickUpToken}
            setClickUpToken={setClickUpToken}
            clickUpListId={clickUpListId}
            setClickUpListId={setClickUpListId}
            reporterCredit={reporterCredit}
            setReporterCredit={setReporterCredit}
          />
          <div className={`mt-4 w-full bg-slate-800/80 backdrop-blur-sm shadow-2xl rounded-lg p-4 md:p-6 flex flex-col md:flex-row flex-grow gap-6 min-h-[60vh] border border-slate-700 relative ${isLoading && findings.length === 0 ? 'loading-bg' : ''}`}>
            <div className="flex-shrink-0 md:w-3/5 lg:w-2/3 flex flex-col h-full">
                <div className="overflow-y-auto pr-2 flex-grow">
                    <FindingsDisplay 
                      sites={findings}
                      isLoading={isLoading}
                      scanInitiated={scanInitiated}
                      onDownloadReport={handleDownloadReport}
                      onGeneratePdfForSite={generatePdfForSite}
                      onGenerateMarkdownForSite={generateMarkdownForSite}
                      onGenerateEmailBody={generateEmailBody}
                      onClickUpUpload={handleUploadToClickUp}
                      onReportViaEmail={handleReportViaEmail}
                    />
                </div>
            </div>

            <div 
              className="flex-shrink-0 md:w-2/5 lg:w-1/3 flex flex-col h-full bg-black/50 p-4 rounded-md border border-slate-700"
            >
              <h2 className="text-xl font-bold text-slate-200 mb-4 border-b border-slate-700 pb-2 flex-shrink-0">Live Log</h2>
              <div 
                ref={logContainerRef}
                className="overflow-y-auto flex-grow"
                aria-live="polite"
                aria-atomic="false"
              >
                  <LiveLog log={log} />
              </div>
            </div>
          </div>
      </main>
      <Footer />
    </div>
  );
};