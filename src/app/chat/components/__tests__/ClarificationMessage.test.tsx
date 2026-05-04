import { render, screen, fireEvent } from '@testing-library/react';
import { ClarificationMessage } from '../ClarificationMessage';
import { ClarificationRequest } from '../../types/clarification';

describe('ClarificationMessage', () => {
  const mockClarification: ClarificationRequest = {
    clarificationId: 'clar_test1234',
    candidateId: 'cand_xyz12345',
    question: 'Which venue is "The Rigger"?',
    questionType: 'entity_match',
    options: [
      { optionId: 'opt_venue001', label: 'The Rigger, Newcastle', entityId: 'vnue_ncl12345' },
      { optionId: 'opt_venue002', label: 'The Rigger, Sheffield', entityId: 'vnue_shf67890' },
    ],
    status: 'open',
    createdAt: '2026-05-04T12:00:00.000Z',
  };

  const mockOnResolve = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the clarification question', () => {
    render(
      <ClarificationMessage
        clarification={mockClarification}
        onResolve={mockOnResolve}
        onDismiss={mockOnDismiss}
        isResolving={false}
      />
    );

    expect(screen.getByText('Which venue is "The Rigger"?')).toBeInTheDocument();
  });

  it('renders option buttons', () => {
    render(
      <ClarificationMessage
        clarification={mockClarification}
        onResolve={mockOnResolve}
        onDismiss={mockOnDismiss}
        isResolving={false}
      />
    );

    expect(screen.getByRole('button', { name: 'The Rigger, Newcastle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'The Rigger, Sheffield' })).toBeInTheDocument();
  });

  it('renders skip button', () => {
    render(
      <ClarificationMessage
        clarification={mockClarification}
        onResolve={mockOnResolve}
        onDismiss={mockOnDismiss}
        isResolving={false}
      />
    );

    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
  });

  it('calls onResolve when option is clicked', () => {
    render(
      <ClarificationMessage
        clarification={mockClarification}
        onResolve={mockOnResolve}
        onDismiss={mockOnDismiss}
        isResolving={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'The Rigger, Newcastle' }));

    expect(mockOnResolve).toHaveBeenCalledWith('clar_test1234', 'opt_venue001');
  });

  it('calls onDismiss when skip is clicked', () => {
    render(
      <ClarificationMessage
        clarification={mockClarification}
        onResolve={mockOnResolve}
        onDismiss={mockOnDismiss}
        isResolving={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /skip/i }));

    expect(mockOnDismiss).toHaveBeenCalledWith('clar_test1234');
  });

  it('disables buttons when isResolving is true', () => {
    render(
      <ClarificationMessage
        clarification={mockClarification}
        onResolve={mockOnResolve}
        onDismiss={mockOnDismiss}
        isResolving={true}
      />
    );

    const optionButtons = screen.getAllByRole('button');
    optionButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('shows bndy as the sender', () => {
    render(
      <ClarificationMessage
        clarification={mockClarification}
        onResolve={mockOnResolve}
        onDismiss={mockOnDismiss}
        isResolving={false}
      />
    );

    expect(screen.getByText('bndy')).toBeInTheDocument();
  });

  it('handles clarification with no options', () => {
    const noOptionsClarification: ClarificationRequest = {
      ...mockClarification,
      options: [],
    };

    render(
      <ClarificationMessage
        clarification={noOptionsClarification}
        onResolve={mockOnResolve}
        onDismiss={mockOnDismiss}
        isResolving={false}
      />
    );

    expect(screen.getByText('Which venue is "The Rigger"?')).toBeInTheDocument();
    // Should still have skip button
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
  });
});
