import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TEST_PUZZLE } from '../logic/testPuzzle';
import { BeheerPage } from './BeheerPage';
import {
  type BatchHandlers,
  type BatchRequest,
  inProcessFactory,
  type PuzzleFactory,
} from './puzzleFactory';

/** A factory the test drives by hand, to check progress and stopping. */
function manualFactory() {
  const runs: { request: BatchRequest; handlers: BatchHandlers; cancel: () => void }[] = [];
  const factory: PuzzleFactory = {
    start: (request, handlers) => {
      const cancel = vi.fn();
      runs.push({ request, handlers, cancel });
      return cancel;
    },
  };
  return { factory, runs };
}

async function setSize(user: ReturnType<typeof userEvent.setup>, size: number) {
  for (let i = 7; i > size; i--) {
    await user.click(screen.getByRole('button', { name: 'Breedte verlagen' }));
    await user.click(screen.getByRole('button', { name: 'Hoogte verlagen' }));
  }
}

const generateButton = () => screen.getByRole('button', { name: /Genereer|Bezig/ });

describe('getallenpad BeheerPage', () => {
  it('generates, previews and exports a puzzle', async () => {
    const user = userEvent.setup();
    render(<BeheerPage factory={inProcessFactory} />);
    await setSize(user, 4);
    await user.click(screen.getByRole('radio', { name: 'Moeilijk' }));
    await user.type(screen.getByLabelText('Seed (leeg = willekeurig)'), '42');
    await user.click(generateButton());

    expect(
      await screen.findByRole('heading', { name: 'Voorbeeld: 4x4-moeilijk-42' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('progress')).toHaveTextContent('1 van 1 klaar');
    expect(screen.getByTestId('metric')).toHaveTextContent(/Moeilijk · 4×4 · \d+% gegeven/);
    const givens = screen.getByTestId('beheer-givens');
    const solution = screen.getByTestId('beheer-solution');
    expect(within(solution).getByText('16')).toBeInTheDocument();
    expect(within(givens).getByText('1')).toBeInTheDocument();

    const json = JSON.parse((screen.getByLabelText('Puzzel-JSON') as HTMLTextAreaElement).value);
    expect(json).toMatchObject({ id: '4x4-moeilijk-42', level: 'moeilijk', seed: 42 });
    expect(screen.getByText('4x4-moeilijk-42.json')).toBeInTheDocument();

    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(screen.getByRole('button', { name: 'Kopiëren' }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('"id": "4x4-moeilijk-42"'));
    expect(await screen.findByText('Gekopieerd.')).toBeInTheDocument();

    const createObjectURL = vi.fn(() => 'blob:x');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await user.click(screen.getByRole('button', { name: 'Downloaden' }));
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:x');
    click.mockRestore();
  });

  it('shows batch progress, lets you pick a result and download all', async () => {
    const user = userEvent.setup();
    const { factory, runs } = manualFactory();
    render(<BeheerPage factory={factory} />);
    for (let i = 0; i < 2; i++)
      await user.click(screen.getByRole('button', { name: 'Aantal verhogen' }));
    await user.click(generateButton());
    expect(runs[0]!.request).toMatchObject({
      width: 7,
      height: 7,
      level: 'normaal',
      seed: null,
      count: 3,
    });
    expect(generateButton()).toBeDisabled();

    const { onPuzzle, onDone } = runs[0]!.handlers;
    const second = { ...TEST_PUZZLE, id: 'tweede' };
    await vi.waitFor(() => {});
    onPuzzle({ seed: 1, result: { ok: true, value: TEST_PUZZLE } });
    expect(await screen.findByTestId('progress')).toHaveTextContent('1 van 3 klaar');
    onPuzzle({
      seed: 2,
      result: {
        ok: false,
        error: { code: 'timeout', message: 'Het maken van de puzzel duurde te lang.' },
      },
    });
    onPuzzle({ seed: 3, result: { ok: true, value: second } });
    onDone();
    expect(await screen.findByText('3 van 3 klaar')).toBeInTheDocument();
    expect(generateButton()).toBeEnabled();

    const list = screen.getByRole('list', { name: 'Gemaakte puzzels' });
    await user.click(within(list).getByText(/seed 2/));
    expect(screen.getByRole('alert')).toHaveTextContent('duurde te lang');
    await user.click(within(list).getByText('tweede'));
    expect(screen.getByRole('heading', { name: 'Voorbeeld: tweede' })).toBeInTheDocument();

    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await user.click(screen.getByRole('button', { name: 'Download alle (2)' }));
    expect(click).toHaveBeenCalledTimes(2);
    click.mockRestore();
  });

  it('stops a running batch and keeps what is done', async () => {
    const user = userEvent.setup();
    const { factory, runs } = manualFactory();
    render(<BeheerPage factory={factory} />);
    for (let i = 0; i < 4; i++)
      await user.click(screen.getByRole('button', { name: 'Aantal verhogen' }));
    await user.click(generateButton());
    runs[0]!.handlers.onPuzzle({ seed: 1, result: { ok: true, value: TEST_PUZZLE } });
    await user.click(await screen.findByRole('button', { name: 'Stop' }));
    expect(runs[0]!.cancel).toHaveBeenCalled();
    expect(screen.getByTestId('progress')).toHaveTextContent('1 van 5 klaar (gestopt)');
    expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: `Voorbeeld: ${TEST_PUZZLE.id}` }),
    ).toBeInTheDocument();
  });

  it('rejects a seed that is too large', async () => {
    const user = userEvent.setup();
    render(<BeheerPage factory={manualFactory().factory} />);
    await user.type(screen.getByLabelText('Seed (leeg = willekeurig)'), '99999999999');
    expect(screen.getByRole('alert')).toHaveTextContent('kleiner zijn dan 4294967296');
    expect(generateButton()).toBeDisabled();
  });
});
