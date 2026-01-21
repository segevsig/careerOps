import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardHeader from '../DashboardHeader';

describe('DashboardHeader', () => {
  it('renders the CareerOps title', () => {
    render(<DashboardHeader displayName="John Doe" onLogout={() => {}} />);
    expect(screen.getByText('CareerOps')).toBeInTheDocument();
  });

  it('displays the user name', () => {
    render(<DashboardHeader displayName="John Doe" onLogout={() => {}} />);
    expect(screen.getByText(/Hello, John Doe/)).toBeInTheDocument();
  });

  it('calls onLogout when logout button is clicked', async () => {
    const onLogout = vi.fn();
    const user = userEvent.setup();
    
    render(<DashboardHeader displayName="John Doe" onLogout={onLogout} />);
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);
    
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('renders logout button', () => {
    render(<DashboardHeader displayName="Test User" onLogout={() => {}} />);
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });
});
