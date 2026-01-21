import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsSection from '../StatsSection';

describe('StatsSection', () => {
  const mockStats = {
    totalApplications: 10,
    interviews: 5,
    offers: 2,
    rejections: 3,
  };

  it('renders all stat cards with correct values', () => {
    render(<StatsSection stats={mockStats} />);
    
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders correct labels', () => {
    render(<StatsSection stats={mockStats} />);
    
    expect(screen.getByText('Applications Sent')).toBeInTheDocument();
    expect(screen.getByText('Interviews')).toBeInTheDocument();
    expect(screen.getByText('Offers')).toBeInTheDocument();
    expect(screen.getByText('Rejections')).toBeInTheDocument();
  });

  it('handles null stats', () => {
    render(<StatsSection stats={null} />);
    
    const zeroValues = screen.getAllByText('0');
    expect(zeroValues).toHaveLength(4);
    zeroValues.forEach(value => {
      expect(value).toBeInTheDocument();
    });
  });

  it('renders section title', () => {
    render(<StatsSection stats={mockStats} />);
    expect(screen.getByText('Statistics')).toBeInTheDocument();
  });
});
