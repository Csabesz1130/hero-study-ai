import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMemoryTechniques } from '../hooks/useMemoryTechniques';
import { MemoryPalace, MemoryConcept } from '../types/memory';

// Mock a useSession hook-ot
vi.mock('next-auth/react', () => ({
    useSession: () => ({
        data: {
            user: {
                id: 'test-user-id'
            }
        }
    })
}));

// Mock a fetch hívásokat
global.fetch = vi.fn();

describe('Memóriatechnika Rendszer', () => {
    let memoryPalace: MemoryPalace;
    let memoryConcept: MemoryConcept;

    beforeEach(() => {
        // Teszt adatok inicializálása
        memoryPalace = {
            id: 'test-palace-id',
            userId: 'test-user-id',
            name: 'Otthonom',
            description: 'Az én otthonom memóriapalotája',
            locations: [
                {
                    id: 'location-1',
                    palaceId: 'test-palace-id',
                    name: 'Bejárati ajtó',
                    description: 'A ház bejárata',
                    position: { x: 0, y: 0, z: 0 },
                    associations: []
                },
                {
                    id: 'location-2',
                    palaceId: 'test-palace-id',
                    name: 'Nappali',
                    description: 'A nappali szoba',
                    position: { x: 1, y: 0, z: 0 },
                    associations: []
                }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        memoryConcept = {
            id: 'test-concept-id',
            userId: 'test-user-id',
            name: 'Fotoszintézis',
            description: 'A növények napfényből szénhidrátot állítanak elő',
            category: 'Biológia',
            difficulty: 0.7,
            relatedConcepts: [],
            mnemonicDevices: []
        };

        // Mock a fetch válaszokat
        (global.fetch as jest.Mock).mockImplementation((url) => {
            if (url.includes('generate-imagery')) {
                return Promise.resolve({
                    json: () => Promise.resolve({
                        imagery: 'Egy ragyogó nap virágot táplál, amely sugarakat bocsát ki'
                    })
                });
            }
            if (url.includes('create-associations')) {
                return Promise.resolve({
                    json: () => Promise.resolve({
                        associations: [
                            {
                                locationId: 'location-1',
                                imagery: 'A bejárati ajtón ragyogó nap virágot tart',
                                story: 'A nap sugarai áthatolnak az ajtón',
                                sensoryDetails: {
                                    visual: ['ragyogó nap', 'virág'],
                                    auditory: ['csend'],
                                    kinesthetic: ['meleg'],
                                    olfactory: ['virágillat'],
                                    gustatory: []
                                }
                            }
                        ]
                    })
                });
            }
            if (url.includes('reinforce-multimodal')) {
                return Promise.resolve({
                    json: () => Promise.resolve({
                        reinforcement: {
                            visual: ['Rajzolj egy napot és egy virágot'],
                            auditory: ['Képzeld el a nap sugarainak hangját'],
                            kinesthetic: ['Imitáld a virág mozgását'],
                            olfactory: ['Képzeld el a virág illatát'],
                            gustatory: ['Képzeld el a nap melegét']
                        }
                    })
                });
            }
            return Promise.reject(new Error('Not found'));
        });
    });

    it('memóriapalota generálása', async () => {
        const { generateMemoryPalace } = useMemoryTechniques();
        const newPalace = await generateMemoryPalace('Otthonom', 'Az én otthonom memóriapalotája');

        expect(newPalace).toBeDefined();
        expect(newPalace.name).toBe('Otthonom');
        expect(newPalace.locations).toHaveLength(0);
    });

    it('élénk képek generálása', async () => {
        const { generateVividImagery } = useMemoryTechniques();
        const mnemonic = await generateVividImagery(memoryConcept);

        expect(mnemonic).toBeDefined();
        expect(mnemonic.type).toBe('imagery');
        expect(mnemonic.content).toContain('ragyogó nap');
    });

    it('térbeli asszociációk létrehozása', async () => {
        const { createSpatialAssociations } = useMemoryTechniques();
        const associations = await createSpatialAssociations(memoryConcept, memoryPalace);

        expect(associations).toBeDefined();
        expect(associations.associations).toHaveLength(1);
        expect(associations.associations[0].imagery).toContain('bejárati ajtón');
    });

    it('térközelt ismétlés ütemezése', async () => {
        const { scheduleSpacedRepetition } = useMemoryTechniques();
        const schedule = await scheduleSpacedRepetition(memoryConcept.id);

        expect(schedule).toBeDefined();
        expect(schedule.intervals).toEqual([1, 3, 7, 14, 30]);
        expect(schedule.currentInterval).toBe(0);
    });

    it('többérzékszervi erősítés', async () => {
        const { reinforceMultimodal } = useMemoryTechniques();
        const reinforcement = await reinforceMultimodal(memoryConcept);

        expect(reinforcement).toBeDefined();
        expect(reinforcement.reinforcement.visual).toContain('Rajzolj');
        expect(reinforcement.reinforcement.auditory).toContain('hangját');
    });

    it('adatok betöltése', async () => {
        const { palaces, concepts, loading } = useMemoryTechniques();

        expect(loading).toBe(false);
        expect(palaces).toBeDefined();
        expect(concepts).toBeDefined();
    });
}); 