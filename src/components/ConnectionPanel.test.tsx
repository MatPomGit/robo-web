import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectionPanel } from './ConnectionPanel';

describe('ConnectionPanel', () => {
  const defaultProps = {
    rosStatus: 'disconnected' as const,
    rosUrl: 'ws://localhost:9090',
    setRosUrl: vi.fn(),
    connectROS: vi.fn(),
    rosConfirmAction: null,
    setRosConfirmAction: vi.fn(),
    demoMode: false,
  };

  it('shows Connect button when disconnected', () => {
    render(<ConnectionPanel {...defaultProps} />);
    expect(screen.getByText(/Connect/i)).toBeTruthy();
  });

  it('shows Disconnect button when connected', () => {
    render(<ConnectionPanel {...defaultProps} rosStatus="connected" />);
    expect(screen.getByText(/Disconnect/i)).toBeTruthy();
  });

  it('calls connectROS when Connect button clicked', () => {
    render(<ConnectionPanel {...defaultProps} />);
    const connectBtn = screen.getAllByRole('button').find(
      btn => btn.textContent?.includes('Connect') && !btn.textContent?.includes('Disconnect')
    );
    fireEvent.click(connectBtn!);
    expect(defaultProps.connectROS).toHaveBeenCalled();
  });

  it('shows confirm dialog when rosConfirmAction is set', () => {
    render(<ConnectionPanel {...defaultProps} rosConfirmAction="connect" />);
    expect(screen.getByText(/Confirm connect/i)).toBeTruthy();
    expect(screen.getByText('YES')).toBeTruthy();
    expect(screen.getByText('NO')).toBeTruthy();
  });

  it('has reduced opacity in demo mode', () => {
    const { container } = render(<ConnectionPanel {...defaultProps} demoMode={true} />);
    expect(container.firstElementChild?.className).toContain('opacity-40');
  });
});
