import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WelcomeSection from '../WelcomeSection';

describe('WelcomeSection', () => {
  const mockUser = {
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: '2024-01-15T10:00:00Z',
  };

  it('renders welcome message', () => {
    render(<WelcomeSection user={mockUser} displayName="John Doe" />);
    expect(screen.getByText('Welcome to Your Dashboard!')).toBeInTheDocument();
  });

  it('displays user email', () => {
    render(<WelcomeSection user={mockUser} displayName="John Doe" />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('displays user name when firstName exists', () => {
    render(<WelcomeSection user={mockUser} displayName="John Doe" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('does not display name row when firstName is null', () => {
    const userWithoutName = {
      ...mockUser,
      firstName: null,
    };
    render(<WelcomeSection user={userWithoutName} displayName="test@example.com" />);
    expect(screen.queryByText(/Name:/)).not.toBeInTheDocument();
  });

  it('formats date correctly in dd/mm/yyyy format', () => {
    render(<WelcomeSection user={mockUser} displayName="John Doe" />);
    expect(screen.getByText('15/01/2024')).toBeInTheDocument();
  });

  it('handles null user gracefully', () => {
    render(<WelcomeSection user={null} displayName="Guest" />);
    expect(screen.getByText('Welcome to Your Dashboard!')).toBeInTheDocument();
  });
});
