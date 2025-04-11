import React, { useEffect, useState } from 'react';
import { ExternalResource, ResourceType } from '@/types/content-enrichment';
import { contentEnrichmentService } from '@/services/content-enrichment';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface ContentEnrichmentProps {
    content: string;
    context: string;
    onResourceSelect?: (resource: ExternalResource) => void;
}

export const ContentEnrichment: React.FC<ContentEnrichmentProps> = ({
    content,
    context,
    onResourceSelect
}) => {
    const [resources, setResources] = useState<ExternalResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all');
    const [expandedResource, setExpandedResource] = useState<string | null>(null);

    useEffect(() => {
        const loadResources = async () => {
            try {
                setLoading(true);
                const enrichedResources = await contentEnrichmentService.enrichContent(content, context);
                setResources(enrichedResources);
            } catch (error) {
                console.error('Error loading resources:', error);
                toast.error('Hiba történt a tartalom betöltése során');
            } finally {
                setLoading(false);
            }
        };

        loadResources();
    }, [content, context]);

    const filteredResources = selectedType === 'all'
        ? resources
        : resources.filter(resource => resource.type === selectedType);

    const handleResourceClick = (resource: ExternalResource) => {
        if (onResourceSelect) {
            onResourceSelect(resource);
        }
        setExpandedResource(expandedResource === resource.id ? null : resource.id);
    };

    const handleContribution = async (resourceId: string, rating: number) => {
        try {
            await contentEnrichmentService.addUserContribution({
                resourceId,
                rating,
                userId: 'current-user-id', // Ezt a valós felhasználó azonosítóval kell helyettesíteni
                createdAt: new Date()
            });
            toast.success('Köszönjük a visszajelzést!');
        } catch (error) {
            console.error('Error adding contribution:', error);
            toast.error('Hiba történt a visszajelzés küldése során');
        }
    };

    return (
        <div className="content-enrichment">
            <div className="resource-filters">
                <button
                    className={`filter-button ${selectedType === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedType('all')}
                >
                    Összes
                </button>
                {Object.values(ResourceType).map(type => (
                    <button
                        key={type}
                        className={`filter-button ${selectedType === type ? 'active' : ''}`}
                        onClick={() => setSelectedType(type)}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-spinner">
                    <div className="spinner" />
                    <p>Tartalom betöltése...</p>
                </div>
            ) : (
                <div className="resource-list">
                    <AnimatePresence>
                        {filteredResources.map(resource => (
                            <motion.div
                                key={resource.id}
                                className={`resource-card ${expandedResource === resource.id ? 'expanded' : ''}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div
                                    className="resource-header"
                                    onClick={() => handleResourceClick(resource)}
                                >
                                    <h3>{resource.title}</h3>
                                    <span className="resource-type">{resource.type}</span>
                                </div>

                                <AnimatePresence>
                                    {expandedResource === resource.id && (
                                        <motion.div
                                            className="resource-details"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                        >
                                            <p>{resource.description}</p>
                                            <div className="resource-meta">
                                                <span>Szerző: {resource.metadata.author}</span>
                                                <span>Közzétéve: {resource.metadata.publicationDate?.toLocaleDateString()}</span>
                                                {resource.metadata.duration && (
                                                    <span>Hossz: {Math.floor(resource.metadata.duration / 60)} perc</span>
                                                )}
                                            </div>
                                            <div className="resource-actions">
                                                <a
                                                    href={resource.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="view-button"
                                                >
                                                    Megtekintés
                                                </a>
                                                <div className="rating-section">
                                                    <p>Értékelés:</p>
                                                    <div className="rating-buttons">
                                                        {[1, 2, 3, 4, 5].map(rating => (
                                                            <button
                                                                key={rating}
                                                                onClick={() => handleContribution(resource.id, rating)}
                                                                className="rating-button"
                                                            >
                                                                {rating}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="license-info">
                                                <p>{resource.license.attributionText}</p>
                                                <a
                                                    href={resource.license.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Licenc részletek
                                                </a>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}; 