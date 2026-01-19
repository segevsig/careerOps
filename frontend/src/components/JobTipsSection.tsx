import { useState } from 'react';
import './JobTipsSection.css';

const JobTipsSection = () => {
  const tips = [
    {
      icon: '🎯',
      title: 'Target Your Applications',
      description: 'Focus on roles that match your skills and experience. Quality over quantity increases your chances of success.'
    },
    {
      icon: '📝',
      title: 'Customize Your Resume',
      description: 'Tailor your resume and cover letter for each position. Highlight relevant skills and experiences that match the job description.'
    },
    {
      icon: '🔍',
      title: 'Research Companies',
      description: 'Learn about the company culture, values, and recent news before applying. This helps you stand out in interviews.'
    },
    {
      icon: '💼',
      title: 'Network Actively',
      description: 'Connect with professionals in your field on LinkedIn. Attend industry events and engage with relevant content.'
    },
    {
      icon: '⏰',
      title: 'Stay Organized',
      description: 'Track all your applications, follow-ups, and interview dates. Use tools like CareerOps to manage your job search efficiently.'
    },
    {
      icon: '📚',
      title: 'Keep Learning',
      description: 'Continuously improve your skills through online courses, certifications, or side projects. Show employers you\'re committed to growth.'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % tips.length);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + tips.length) % tips.length);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  // Get circular indices for previous, current, and next
  const getPrevIndex = () => (currentIndex - 1 + tips.length) % tips.length;
  const getNextIndex = () => (currentIndex + 1) % tips.length;

  return (
    <section className="job-tips-section">
      <div className="job-tips-header">
        <h3>💡 Tips for Finding a Job</h3>
        <p>Expert advice to help you land your dream job</p>
      </div>
      
      <div className="job-tips-slider-container">
        <button 
          className="slider-button slider-button-prev" 
          onClick={prevSlide}
          aria-label="Previous tip"
          disabled={isTransitioning}
        >
          ‹
        </button>
        
        <div className="job-tips-slider">
          <div className="job-tips-slider-track">
            {[
              { index: getPrevIndex(), position: 'left' },
              { index: currentIndex, position: 'center' },
              { index: getNextIndex(), position: 'right' }
            ].map(({ index, position }) => {
              const tip = tips[index];
              return (
                <div
                  key={`${index}-${currentIndex}`}
                  className={`job-tip-card ${position === 'center' ? 'center-card' : ''} ${position === 'left' ? 'left-card' : ''} ${position === 'right' ? 'right-card' : ''}`}
                >
                  <div className="tip-icon">{tip.icon}</div>
                  <h4 className="tip-title">{tip.title}</h4>
                  <p className="tip-description">{tip.description}</p>
                </div>
              );
            })}
          </div>
        </div>
        
        <button 
          className="slider-button slider-button-next" 
          onClick={nextSlide}
          aria-label="Next tip"
          disabled={isTransitioning}
        >
          ›
        </button>
      </div>

      <div className="slider-dots">
        {tips.map((_, index) => (
          <button
            key={index}
            className={`slider-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to tip ${index + 1}`}
            disabled={isTransitioning}
          />
        ))}
      </div>
    </section>
  );
};

export default JobTipsSection;
