import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../App';

describe('App', () => {
  it('shows login form by default', () => {
    render(<App />);
    expect(screen.getByText('Dark Chat MVP')).toBeInTheDocument();
    expect(screen.getByText('Войти')).toBeInTheDocument();
  });
});
