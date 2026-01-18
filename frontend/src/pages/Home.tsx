import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {

  const { login } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="home-page">

      {/* HEADER */}
      <header className="home-header">
        <div className="logo">CareerOps</div>

        <nav className="nav-actions">
          <Link to="/login" className="login-link">Log In</Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="home-hero">
        <h1>Take Control of Your Job Search</h1>
        <p>
          CareerOps helps you stay organized, track applications,
          analyze your progress, and create tailored cover letters
          using AI — all in one powerful dashboard.
        </p>

        <Link to="/login" className="primary-cta">
          Get Started
        </Link>
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <h2>What You Can Do With CareerOps</h2>

        <div className="features-grid">
          <div className="feature-card">
            <h3>Track Job Applications</h3>
            <p>
              Save every job you apply to in one place. Track company
              details, application status, interview dates, and next steps.
            </p>
          </div>

          <div className="feature-card">
            <h3>Visualize Your Progress</h3>
            <p>
              Understand how effective your job search is with clear
              statistics: applications sent, responses received, and offers.
            </p>
          </div>

          <div className="feature-card">
            <h3>AI Cover Letter Generator</h3>
            <p>
              Generate professional, customized cover letters in seconds
              using AI — tailored to each job description.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="steps-section">
        <h2>How It Works</h2>

        <div className="steps-grid">
          <div className="step">
            <span className="step-number">1</span>
            <h4>Log In</h4>
            <p>Create your secure account and access your personal dashboard.</p>
          </div>

          <div className="step">
            <span className="step-number">2</span>
            <h4>Add Applications</h4>
            <p>Start tracking every job opportunity you apply for.</p>
          </div>

          <div className="step">
            <span className="step-number">3</span>
            <h4>Analyze & Improve</h4>
            <p>Use statistics and AI tools to improve your success rate.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <p>© 2026 CareerOps. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;

