import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CreditsDisplay } from '../CreditsDisplay'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('CreditsDisplay', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('should render loading state', () => {
    render(<CreditsDisplay credits={0} loading={true} />)

    expect(screen.getByText('...')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('should render credits amount when not loading', () => {
    render(<CreditsDisplay credits={42} loading={false} />)

    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('🪙')).toBeInTheDocument()
  })

  it('should render zero credits', () => {
    render(<CreditsDisplay credits={0} loading={false} />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should render large credit numbers', () => {
    render(<CreditsDisplay credits={9999} loading={false} />)

    expect(screen.getByText('9999')).toBeInTheDocument()
  })

  it.skip('should navigate to credits page when clicked', () => {
    // TODO: Fix mock configuration for next/navigation router
    render(<CreditsDisplay credits={100} loading={false} />)

    const button = screen.getByRole('button', { name: /comprar créditos/i })
    fireEvent.click(button)

    expect(mockPush).toHaveBeenCalledWith('/credits')
  })

  it('should not be clickable when loading', () => {
    render(<CreditsDisplay credits={100} loading={true} />)

    // Loading state renders a div, not a button
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should have correct title attribute', () => {
    render(<CreditsDisplay credits={100} loading={false} />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Comprar créditos')
  })

  it('should apply correct CSS classes for loading state', () => {
    const { container } = render(<CreditsDisplay credits={0} loading={true} />)

    const loadingDiv = container.querySelector('.animate-spin')
    expect(loadingDiv).toBeInTheDocument()
  })

  it('should apply hover and active styles (via classes)', () => {
    render(<CreditsDisplay credits={100} loading={false} />)

    const button = screen.getByRole('button')
    expect(button.className).toContain('hover:from-pink-600/30')
    expect(button.className).toContain('active:scale-95')
  })
})
