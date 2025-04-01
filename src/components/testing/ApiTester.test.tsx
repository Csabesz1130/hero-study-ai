import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ApiTester } from './ApiTester'
import { api } from '@/lib/api'

// Mock az API hívásokat
jest.mock('@/lib/api', () => ({
    api: {
        objectives: {
            getAll: jest.fn(),
            create: jest.fn(),
        },
        progress: {
            getAll: jest.fn(),
            update: jest.fn(),
        },
        analytics: {
            getByTimeRange: jest.fn(),
            update: jest.fn(),
        },
    },
}))

describe('ApiTester', () => {
    beforeEach(() => {
        // Reset minden mock függvényt
        jest.clearAllMocks()
    })

    it('megjeleníti a tesztelő felületet', () => {
        render(<ApiTester />)

        expect(screen.getByText('API Tesztelő')).toBeInTheDocument()
        expect(screen.getByText('GET Végpontok Tesztelése')).toBeInTheDocument()
        expect(screen.getByText('POST Végpontok Tesztelése')).toBeInTheDocument()
    })

    it('teszteli a GET végpontokat', async () => {
        // Mock a válaszokat
        const mockObjectives = [{ id: 1, title: 'Test Objective' }]
        const mockProgress = [{ id: 1, progress: 50 }]
        const mockAnalytics = { learningTime: 3600, completionRate: 85 }

            ; (api.objectives.getAll as jest.Mock).mockResolvedValue(mockObjectives)
            ; (api.progress.getAll as jest.Mock).mockResolvedValue(mockProgress)
            ; (api.analytics.getByTimeRange as jest.Mock).mockResolvedValue(mockAnalytics)

        render(<ApiTester />)

        // Kattints a GET tesztelő gombra
        fireEvent.click(screen.getByText('GET Végpontok Tesztelése'))

        // Várjuk meg az eredmények megjelenését
        await waitFor(() => {
            expect(screen.getByText('objectives')).toBeInTheDocument()
            expect(screen.getByText('progress')).toBeInTheDocument()
            expect(screen.getByText('analytics')).toBeInTheDocument()
        })
    })

    it('kezeli a hiba eseteket', async () => {
        // Mock egy hibát
        const error = new Error('API Error')
            ; (api.objectives.getAll as jest.Mock).mockRejectedValue(error)

        render(<ApiTester />)

        // Kattints a GET tesztelő gombra
        fireEvent.click(screen.getByText('GET Végpontok Tesztelése'))

        // Várjuk meg a hiba megjelenését
        await waitFor(() => {
            expect(screen.getByText('API Error')).toBeInTheDocument()
        })
    })
}) 