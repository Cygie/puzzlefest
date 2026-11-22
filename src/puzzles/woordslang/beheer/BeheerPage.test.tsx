import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BeheerPage } from './BeheerPage';

function setup() {
  const user = userEvent.setup();
  render(<BeheerPage />);
  return { user };
}

async function fillFruit(
  user: ReturnType<typeof userEvent.setup>,
  words = 'banaan, appel, peer, druif, citroen, kiwi, vijg, kers',
) {
  await user.type(screen.getByLabelText('Thema'), 'Fruit');
  await user.type(screen.getByLabelText('Hint voor de speler'), 'Gezond');
  await user.type(screen.getByLabelText('Sleutelwoord'), 'fruitmand');
  await user.type(screen.getByLabelText(/Andere woorden/), words);
}

const generateButton = () => screen.getByRole('button', { name: /Genereer|Opnieuw/ });

describe('BeheerPage', () => {
  it('shows a live letter count against the grid', async () => {
    const { user } = setup();
    expect(screen.getByTestId('letter-count')).toHaveTextContent('0 van 48 letters — nog 48 nodig');
    await fillFruit(user, 'banaan, appel');
    expect(screen.getByTestId('letter-count')).toHaveTextContent(
      '20 van 48 letters — nog 28 nodig',
    );
    await user.type(
      screen.getByLabelText(/Andere woorden/),
      ', peer, druif, citroen, kiwi, vijg, kers',
    );
    expect(screen.getByTestId('letter-count')).toHaveTextContent('✓ Precies 48 letters');
  });

  it('derives the id from the theme and lets it be edited', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Thema'), 'Op de boerderij');
    expect(screen.getByLabelText('Id (bestandsnaam)')).toHaveValue('op-de-boerderij');
    await user.clear(screen.getByLabelText('Id (bestandsnaam)'));
    await user.type(screen.getByLabelText('Id (bestandsnaam)'), 'boerderij');
    expect(screen.getByLabelText('Id (bestandsnaam)')).toHaveValue('boerderij');
  });

  it('generates a preview with coloured paths and the JSON', async () => {
    const { user } = setup();
    expect(generateButton()).toBeDisabled();
    await fillFruit(user);
    await user.click(generateButton());
    expect(await screen.findByRole('heading', { name: /Resultaat/ })).toHaveTextContent(/seed \d+/);
    const preview = screen.getByTestId('beheer-preview');
    expect(within(preview).getAllByTestId('word-stroke')).toHaveLength(9);
    expect(
      within(screen.getByRole('list', { name: 'Woorden' })).getByText('(sleutelwoord)'),
    ).toBeInTheDocument();
    const json = JSON.parse(
      (screen.getByLabelText('Puzzel-JSON') as HTMLTextAreaElement).value,
    ) as { id: string; words: { key?: boolean; letters: string }[] };
    expect(json.id).toBe('fruit');
    expect(json.words.find((w) => w.key)?.letters).toBe('FRUITMAND');
    expect(screen.getByText('fruit.json')).toBeInTheDocument();
  });

  it('generates again with another seed', async () => {
    const { user } = setup();
    await fillFruit(user);
    await user.click(generateButton());
    const heading = await screen.findByRole('heading', { name: /Resultaat/ });
    const first = heading.textContent;
    await user.click(screen.getByRole('button', { name: 'Opnieuw' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Resultaat/ }).textContent).not.toBe(first),
    );
  });

  it('shows a Dutch error for impossible input', async () => {
    const { user } = setup();
    await fillFruit(user, 'banaan');
    await user.click(generateButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'De woorden hebben samen 15 letters',
    );
  });

  it('copies and downloads the JSON', async () => {
    const { user } = setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    await fillFruit(user);
    await user.click(generateButton());
    await screen.findByRole('heading', { name: /Resultaat/ });
    await user.click(screen.getByRole('button', { name: 'Kopiëren' }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('"id": "fruit"'));
    expect(await screen.findByText('Gekopieerd.')).toBeInTheDocument();

    const createObjectURL = vi.fn(() => 'blob:x');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await user.click(screen.getByRole('button', { name: 'Downloaden' }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:x');
  });
});
