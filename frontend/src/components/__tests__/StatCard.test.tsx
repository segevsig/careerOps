import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '../StatCard';

describe('StatCard', () => {
  it('renders the value correctly', () => {
    render(<StatCard value={42} label="Applications" />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders the label correctly', () => {
    render(<StatCard value={10} label="Interviews" />);
    expect(screen.getByText('Interviews')).toBeInTheDocument();
  });

  it('renders zero value', () => {
    render(<StatCard value={0} label="Offers" />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders large numbers', () => {
    render(<StatCard value={999} label="Total" />);
    expect(screen.getByText('999')).toBeInTheDocument();
  });
});
