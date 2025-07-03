import React, { useState } from 'react';
import type { NarrativeSegment } from './api/narrative-generator'; // Import the interface

interface DreamAnalysis {
  skills: string[];
  knowledgeDomains: string[];
  careerPathways: string[];
}

const DreamLabPage: React.FC = () => {
  const [dream, setDream] = useState<string>('');
  const [analysis, setAnalysis] = useState<DreamAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [narrativeSegment, setNarrativeSegment] = useState<NarrativeSegment | null>(null);
  const [isLoadingNarrative, setIsLoadingNarrative] = useState<boolean>(false);
  const [narrativeError, setNarrativeError] = useState<string | null>(null);
  const [genre, setGenre] = useState<string>('Fantasy'); // Default genre

  const handleDreamSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dream.trim()) {
      setAnalysisError('Please enter your dream.');
      return;
    }
    setIsLoadingAnalysis(true);
    setAnalysisError(null);
    setAnalysis(null);
    setNarrativeSegment(null); // Clear previous narrative
    setNarrativeError(null);   // Clear previous narrative error

    try {
      const response = await fetch('/api/dream-parser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dream }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || `HTTP error! status: ${response.status}`);
      setAnalysis(data);

    } catch (err: any) {
      console.error("Error submitting dream for analysis:", err);
      setAnalysisError(err.message || 'Failed to analyze dream.');
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleNarrativeGenerate = async () => {
    if (!analysis || !dream) {
      setNarrativeError('Dream analysis must be completed first.');
      return;
    }
    setIsLoadingNarrative(true);
    setNarrativeError(null);
    setNarrativeSegment(null);

    try {
      const response = await fetch('/api/narrative-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dream: dream,
          parsedDream: analysis,
          genrePreference: genre,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP error! status: ${response.status}`);
      setNarrativeSegment(data);
    } catch (err: any) {
      console.error("Error generating narrative:", err);
      setNarrativeError(err.message || 'Failed to generate narrative segment.');
    } finally {
      setIsLoadingNarrative(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>AI Dream Weaver - Dream Lab</h1>
      <p>Enter your aspirational goal, see it analyzed, and then generate the first chapter of your epic learning quest!</p>
      
      <form onSubmit={handleDreamSubmit} style={{ marginBottom: '20px' }}>
        <textarea
          value={dream}
          onChange={(e) => setDream(e.target.value)}
          placeholder="e.g., I want to become a sustainable architect designing eco-friendly cities."
          rows={5}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          disabled={isLoadingAnalysis || isLoadingNarrative}
        />
        <button 
          type="submit" 
          disabled={isLoadingAnalysis || isLoadingNarrative}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {isLoadingAnalysis ? 'Analyzing Dream...' : '1. Analyze Dream'}
        </button>
      </form>

      {analysisError && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>
          <strong>Analysis Error:</strong> {analysisError}
        </div>
      )}

      {analysis && (
        <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '4px', backgroundColor: '#f9f9f9', marginBottom: '20px' }}>
          <h2>Dream Analysis Results:</h2>
          <h3>Identified Skills:</h3>
          <ul>{analysis.skills.map((skill, index) => <li key={`skill-${index}`}>{skill}</li>)}</ul>
          <h3>Knowledge Domains:</h3>
          <ul>{analysis.knowledgeDomains.map((domain, index) => <li key={`domain-${index}`}>{domain}</li>)}</ul>
          <h3>Potential Career Pathways:</h3>
          <ul>{analysis.careerPathways.map((pathway, index) => <li key={`pathway-${index}`}>{pathway}</li>)}</ul>

          <div style={{ marginTop: '20px' }}>
            <label htmlFor="genre" style={{ marginRight: '10px' }}>Choose Quest Genre:</label>
            <select 
              id="genre" 
              value={genre} 
              onChange={(e) => setGenre(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              disabled={isLoadingNarrative}
            >
              <option value="Fantasy">Fantasy</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Historical Adventure">Historical Adventure</option>
              <option value="Modern Mystery">Modern Mystery</option>
              <option value="Cyberpunk">Cyberpunk</option>
            </select>
            <button 
              onClick={handleNarrativeGenerate} 
              disabled={isLoadingNarrative || isLoadingAnalysis}
              style={{ marginLeft: '10px', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              {isLoadingNarrative ? 'Generating Quest...' : '2. Generate First Quest Segment'}
            </button>
          </div>
        </div>
      )}

      {narrativeError && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>
          <strong>Narrative Error:</strong> {narrativeError}
        </div>
      )}

      {narrativeSegment && (
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#eef7ff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h2>Your Quest Begins: {narrativeSegment.segmentTitle}</h2>
          <p><strong>Focus:</strong> <em>{narrativeSegment.skillFocus}</em></p>
          <hr style={{ margin: '15px 0', borderColor: '#ccc' }} />
          <p style={{ fontStyle: 'italic', color: '#333' }}>{narrativeSegment.introductionText}</p>
          
          {narrativeSegment.mentorFigure && (
            <div style={{ margin: '15px 0', padding: '10px', backgroundColor: '#f0f8ff', borderLeft: '3px solid #007bff', borderRadius: '4px' }}>
              <p><strong>{narrativeSegment.mentorFigure.name} says:</strong> "{narrativeSegment.mentorFigure.dialogue}"</p>
            </div>
          )}
          
          <p><strong>Your Challenge:</strong> {narrativeSegment.challengeDescription}</p>
          
          {narrativeSegment.milestoneAchieved && (
            <p style={{ color: 'green', fontWeight: 'bold' }}><em>Milestone: {narrativeSegment.milestoneAchieved}</em></p>
          )}
          <hr style={{ margin: '15px 0', borderColor: '#ccc' }} />
          <p style={{ fontWeight: 'bold', color: '#555' }}>{narrativeSegment.nextStepPrompt}</p>
        </div>
      )}
    </div>
  );
};

export default DreamLabPage;
