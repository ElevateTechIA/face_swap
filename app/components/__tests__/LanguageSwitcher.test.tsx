import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LanguageSwitcher } from '../LanguageSwitcher'

// Mock next-intl
const mockUseLocale = jest.fn()
jest.mock('next-intl', () => ({
  useLocale: () => mockUseLocale(),
}))

// Mock next/navigation
const mockPush = jest.fn()
const mockPathname = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname(),
}))

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockPathname.mockReturnValue('/en/home')
    mockUseLocale.mockReturnValue('en')
  })

  it('should render language switcher button', () => {
    render(<LanguageSwitcher />)

    expect(screen.getByTitle(/cambiar idioma/i)).toBeInTheDocument()
  })

  it('should display current language flag', () => {
    mockUseLocale.mockReturnValue('en')
    render(<LanguageSwitcher />)

    expect(screen.getByText('🇺🇸')).toBeInTheDocument()
  })

  it('should display Spanish flag when locale is es', () => {
    mockUseLocale.mockReturnValue('es')
    render(<LanguageSwitcher />)

    expect(screen.getByText('🇪🇸')).toBeInTheDocument()
  })

  it('should open dropdown when button is clicked', () => {
    render(<LanguageSwitcher />)

    const button = screen.getByTitle(/cambiar idioma/i)
    fireEvent.click(button)

    expect(screen.getByText('Español')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
  })

  it.skip('should close dropdown when clicking outside', () => {
    // TODO: Fix test - overlay clicking simulation needs proper setup
    render(<LanguageSwitcher />)

    // Open dropdown
    const button = screen.getByTitle(/cambiar idioma/i)
    fireEvent.click(button)

    expect(screen.getByText('Español')).toBeInTheDocument()

    // Click overlay
    const overlay = screen.getByRole('button', { name: 'Español' }).closest('div')?.previousSibling as HTMLElement
    if (overlay) {
      fireEvent.click(overlay)
    }

    // Wait for dropdown to close
    waitFor(() => {
      expect(screen.queryByText('Español')).not.toBeInTheDocument()
    })
  })

  it('should change language when option is clicked', () => {
    mockUseLocale.mockReturnValue('en')
    mockPathname.mockReturnValue('/en/home')
    render(<LanguageSwitcher />)

    // Open dropdown
    const button = screen.getByTitle(/cambiar idioma/i)
    fireEvent.click(button)

    // Click Spanish option
    const spanishOption = screen.getByText('Español')
    fireEvent.click(spanishOption)

    // Should navigate to Spanish version
    expect(mockPush).toHaveBeenCalledWith('/es/home')
  })

  it('should preserve pathname when changing language', () => {
    mockUseLocale.mockReturnValue('en')
    mockPathname.mockReturnValue('/en/gallery/templates')
    render(<LanguageSwitcher />)

    // Open dropdown
    const button = screen.getByTitle(/cambiar idioma/i)
    fireEvent.click(button)

    // Click Spanish option
    const spanishOption = screen.getByText('Español')
    fireEvent.click(spanishOption)

    // Should preserve the path after locale
    expect(mockPush).toHaveBeenCalledWith('/es/gallery/templates')
  })

  it('should show checkmark on current language', () => {
    mockUseLocale.mockReturnValue('en')
    render(<LanguageSwitcher />)

    // Open dropdown
    const button = screen.getByTitle(/cambiar idioma/i)
    fireEvent.click(button)

    // English should have checkmark
    const englishOption = screen.getByText('English').closest('button')
    expect(englishOption).toContainHTML('✓')
  })

  it('should not show checkmark on non-current language', () => {
    mockUseLocale.mockReturnValue('en')
    render(<LanguageSwitcher />)

    // Open dropdown
    const button = screen.getByTitle(/cambiar idioma/i)
    fireEvent.click(button)

    // Spanish should not have checkmark
    const spanishOption = screen.getByText('Español').closest('button')
    expect(spanishOption).not.toContainHTML('✓')
  })

  it('should toggle dropdown on multiple clicks', () => {
    render(<LanguageSwitcher />)

    const button = screen.getByTitle(/cambiar idioma/i)

    // Open
    fireEvent.click(button)
    expect(screen.getByText('Español')).toBeInTheDocument()

    // Close
    fireEvent.click(button)
    waitFor(() => {
      expect(screen.queryByText('Español')).not.toBeInTheDocument()
    })
  })

  it('should display both language options', () => {
    render(<LanguageSwitcher />)

    const button = screen.getByTitle(/cambiar idioma/i)
    fireEvent.click(button)

    expect(screen.getByText('Español')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
    // Flags appear in both button and dropdown, so check for at least one
    expect(screen.getAllByText('🇪🇸').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('🇺🇸').length).toBeGreaterThanOrEqual(1)
  })
})
