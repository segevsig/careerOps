import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import api from '../services/api';
import './CoverLetterGenerator.css';

interface CoverLetterGeneratorProps {
  onClose: () => void;
}

const CoverLetterGenerator = ({ onClose }: CoverLetterGeneratorProps) => {
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [tone, setTone] = useState<"professional" | "friendly" | "concise">("professional");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

  // Poll for job status
  useEffect(() => {
    if (!jobId) return;

    const pollStatus = async () => {
      try {
        const response = await api.get(`/api/cover-letter/status/${jobId}`);
        const jobStatus = response.data.status;
        setStatus(jobStatus);

        if (jobStatus === 'completed') {
          setCoverLetter(response.data.coverLetter || '');
          setLoading(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (jobStatus === 'failed') {
          setError(response.data.errorMessage || 'Cover letter generation failed');
          setLoading(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } catch (err: any) {
        console.error('Error polling status:', err);
        // Don't stop polling on network errors, but show error after a few failures
        if (err.response?.status === 404) {
          setError('Job not found');
          setLoading(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      }
    };

    // Poll immediately, then every 2 seconds
    pollStatus();
    pollingIntervalRef.current = setInterval(pollStatus, 2000);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [jobId]);

  const generateCoverLetter = async () => {
    setLoading(true);
    setError('');
    setCoverLetter('');
    setJobId(null);
    setStatus(null);

    try {
      const response = await api.post('/api/cover-letter', {
        cvText,
        jobDescription,
        tone
      });

      // Store the jobId to start polling
      setJobId(response.data.jobId);
      setStatus(response.data.status || 'pending');
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="cover-letter-modal-overlay" onClick={onClose}>
      <div className="cover-letter-modal-content" onClick={(e) => e.stopPropagation()}>
        <section className="cover-letter-section">
          <div className="cover-letter-box">
            <div className="cover-letter-header">
              <div className="cover-letter-header-content">
                <h3 className="ai-widget-title">AI · Generate Cover Letter</h3>
                <button className="cover-letter-close-button" onClick={onClose} aria-label="Close">
                  ×
                </button>
              </div>
              <p className="cover-letter-subtitle">AI-powered cover letter generator tailored to your CV and job description</p>
            </div>

        <div className="cover-letter-inputs">
          <div className="input-group">
            <label htmlFor="cvText">Your CV</label>
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
              className="cover-letter-textarea cover-letter-textarea--cv"
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
              className="cover-letter-textarea cover-letter-textarea--job-desc"
            />
          </div>
        </div>

        <div className="tone-selector-group">
          <label htmlFor="tone">Tone</label>
          <select
            id="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value as "professional" | "friendly" | "concise")}
            className="tone-select"
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="concise">Concise</option>
          </select>
        </div>

        <div className="cover-letter-actions">
          <button 
            onClick={generateCoverLetter} 
            disabled={loading || !cvText.trim() || !jobDescription.trim()}
            className="generate-button"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                {status === 'processing' ? 'Processing...' : status === 'pending' ? 'Queued...' : 'Generating...'}
              </>
            ) : (
              <>
                <span className="button-icon">✨</span>
                Generate Cover Letter
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="cover-letter-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {coverLetter && (
          <div className="cover-letter-result">
            <div className="result-header">
              <h4>Your Generated Cover Letter</h4>
              <button 
                onClick={() => navigator.clipboard.writeText(coverLetter)}
                className="copy-button"
                title="Copy to clipboard"
              >
                📋 Copy
              </button>
            </div>
            <div className="result-content">
              <pre>{coverLetter}</pre>
            </div>
          </div>
        )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CoverLetterGenerator;
