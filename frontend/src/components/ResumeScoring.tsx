import { useState } from 'react';
import type { ChangeEvent } from 'react';
import api from '../services/api';
import './ResumeScoring.css';

interface ResumeScoringProps {
  onClose: () => void;
  variant?: 'modal' | 'page';
}

interface ScoringItem {
  title: string;
  description: string;
}

interface ResumeScoringResult {
  score: number;
  strengths: ScoringItem[];
  gaps: ScoringItem[];
  suggestions: string[];
}

const ResumeScoring = ({ onClose, variant = 'modal' }: ResumeScoringProps) => {
  const [cvText, setCvText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<ResumeScoringResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For now, support text-based resumes (e.g., .txt). This can be
    // extended later to parse PDFs or DOCX on the backend.
    if (!file.type.startsWith('text/')) {
      setError('Please upload a plain text (.txt) resume for now.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setCvText(text);
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read the resume file. Please try again.');
    };
    reader.readAsText(file);
  };

  const handleScoreResume = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await api.post('/api/resume-scoring', {
        cvText,
        jobDescription,
      });
      setResult(response.data);
    } catch (err: any) {
      const details = err.response?.data?.details;
      const msg = err.response?.data?.error;
      setError(
        typeof details === 'string' ? details : msg || 'Something went wrong while scoring your resume.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const isPage = variant === 'page';
  const wrapperClass = isPage ? 'resume-scoring-page' : 'resume-scoring-modal-overlay';
  const contentClass = isPage ? 'resume-scoring-page-content' : 'resume-scoring-modal-content';
  const contentProps = isPage ? {} : { onClick: (e: React.MouseEvent) => e.stopPropagation() };

  return (
    <div className={wrapperClass} onClick={isPage ? undefined : onClose}>
      <div className={contentClass} {...contentProps}>
        <section className="resume-scoring-section">
          <div className="resume-scoring-box">
            <div className="resume-scoring-header">
              <div className="resume-scoring-header-content">
                <h3 className="ai-widget-title">AI · Resume Scoring</h3>
                <button
                  className="resume-scoring-close-button"
                  onClick={onClose}
                  aria-label={isPage ? 'Back' : 'Close'}
                >
                  {isPage ? '← Back' : '×'}
                </button>
              </div>
              <p className="resume-scoring-subtitle">
                AI-powered analysis of how well your resume matches a specific job description.
                No fake experience is ever added.
              </p>
            </div>

            <div className="resume-scoring-inputs">
              <div className="input-group">
                <label htmlFor="cvText">
                  Your CV
                  <span className="input-helper">
                    &nbsp;– paste your resume text or upload a .txt file
                  </span>
                </label>
                <div className="cv-upload-row">
                  <input
                    id="cvFile"
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                    className="cv-file-input"
                  />
                  <span className="cv-file-hint">Supported: plain text (.txt)</span>
                </div>
                <textarea
                  id="cvText"
                  placeholder="Paste your CV here... (resume, work experience, skills, education)"
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  rows={12}
                  className="resume-scoring-textarea resume-scoring-textarea--cv"
                />
              </div>

              <div className="input-group input-group--job-desc">
                <label htmlFor="jobDescription">Job Description</label>
                <textarea
                  id="jobDescription"
                  placeholder="Paste the job description here... (requirements, responsibilities, company info)"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                  className="resume-scoring-textarea resume-scoring-textarea--job-desc"
                />
              </div>
            </div>

            <div className="resume-scoring-actions">
              <button
                onClick={handleScoreResume}
                disabled={loading || !cvText.trim() || !jobDescription.trim()}
                className="score-button"
              >
                {loading ? 'Scoring...' : 'Score Resume'}
              </button>
            </div>

            {error && (
              <div className="resume-scoring-error">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="resume-scoring-result">
                <div className="score-summary">
                  <div className="score-circle" style={{ borderColor: getScoreColor(result.score) }}>
                    <span className="score-value">{result.score}</span>
                    <span className="score-label">Match</span>
                  </div>
                  <div className="score-legend">
                    <p>
                      <strong>How to read this:</strong> 0–100 score based only on what is actually
                      written in your CV compared to the job description.
                    </p>
                  </div>
                </div>

                <div className="analysis-columns">
                  <div className="analysis-column">
                    <h4>Strengths (Top 3)</h4>
                    <ul>
                      {result.strengths.map((item, index) => (
                        <li key={index}>
                          <strong>{item.title}</strong>
                          <p>{item.description}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="analysis-column">
                    <h4>Gaps (Top 3)</h4>
                    <ul>
                      {result.gaps.map((item, index) => (
                        <li key={index}>
                          <strong>{item.title}</strong>
                          <p>{item.description}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {result.suggestions.length > 0 && (
                  <div className="suggestions-section">
                    <h4>Suggestions</h4>
                    <ul>
                      {result.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResumeScoring;

