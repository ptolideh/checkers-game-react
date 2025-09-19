import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';

describe('App', () => {
  it('switches from mode selection to gameplay UI after choosing a mode', async () => {
    render(<App />);

    expect(screen.getByText(/choose a mode to start playing/i)).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /start single player game/i }));

    const gameStatus = await screen.findByRole('region', { name: /game status/i });
    const board = await screen.findByRole('grid', { name: /checkers board/i });

    expect(gameStatus).not.toBeNull();
    expect(screen.getByRole('heading', { name: /single player/i })).not.toBeNull();
    expect(board).not.toBeNull();
    expect(screen.getByRole('list', { name: /player statistics/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /restart/i })).not.toBeNull();
    expect(screen.queryByText(/choose a mode to start playing/i)).toBeNull();
  });
});
