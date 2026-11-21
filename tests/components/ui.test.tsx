import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button, FieldLabel, TextInput, TrustBadge } from '../../src/web/components/ui';

describe('shared accessible UI', () => {
  it('associates labels with inputs and supports keyboard-triggered actions', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <>
        <FieldLabel htmlFor="display-name">Display name</FieldLabel>
        <TextInput id="display-name" />
        <Button onClick={onClick}>Save profile</Button>
      </>
    );

    expect(screen.getByLabelText('Display name')).toBeTruthy();
    await user.tab();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('uses the human-readable trust label', () => {
    render(<TrustBadge trust="ai_assisted" />);
    expect(screen.getByText('AI-assisted')).toBeTruthy();
  });
});
