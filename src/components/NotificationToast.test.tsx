import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationToast } from './NotificationToast';

describe('NotificationToast', () => {
  it('renders nothing when notifications array is empty', () => {
    const { container } = render(<NotificationToast notifications={[]} />);
    expect(container.firstElementChild?.children.length).toBe(0);
  });

  it('renders an info notification', () => {
    const notifications = [
      { id: '1', type: 'info' as const, message: 'Test info', timestamp: new Date() },
    ];
    render(<NotificationToast notifications={notifications} />);
    expect(screen.getByText('Test info')).toBeTruthy();
    expect(screen.getByText('info')).toBeTruthy();
  });

  it('renders an error notification', () => {
    const notifications = [
      { id: '2', type: 'error' as const, message: 'Connection failed', timestamp: new Date() },
    ];
    render(<NotificationToast notifications={notifications} />);
    expect(screen.getByText('Connection failed')).toBeTruthy();
  });

  it('renders multiple notifications', () => {
    const notifications = [
      { id: '1', type: 'info' as const, message: 'Info message', timestamp: new Date() },
      { id: '2', type: 'warning' as const, message: 'Warning message', timestamp: new Date() },
    ];
    render(<NotificationToast notifications={notifications} />);
    expect(screen.getByText('Info message')).toBeTruthy();
    expect(screen.getByText('Warning message')).toBeTruthy();
  });
});
