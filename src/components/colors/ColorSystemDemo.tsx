import React, { useState } from 'react';
import { semanticColors, colorPalettes } from '../../styles/colors/palette';
import { ColorBlindnessType } from '../../styles/colors/types';
import { simulateColorBlindness } from '../../styles/colors/utils';

interface ColorSystemDemoProps {
    onColorSelect?: (color: string) => void;
}

export const ColorSystemDemo: React.FC<ColorSystemDemoProps> = ({ onColorSelect }) => {
    const [selectedPalette, setSelectedPalette] = useState<string>('primary');
    const [colorBlindness, setColorBlindness] = useState<ColorBlindnessType>('none');
    const [showContrast, setShowContrast] = useState<boolean>(false);

    const renderColorScale = (palette: string) => {
        const colors = semanticColors[palette as keyof typeof semanticColors];
        return (
            <div className="color-scale">
                {Object.entries(colors).map(([level, color]) => {
                    const simulatedColor = simulateColorBlindness(color, colorBlindness);
                    return (
                        <div
                            key={level}
                            className="color-swatch"
                            style={{ backgroundColor: simulatedColor }}
                            onClick={() => onColorSelect?.(color)}
                        >
                            <span className="color-label">{level}</span>
                            <span className="color-value">{simulatedColor}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderPaletteInfo = () => {
        const palette = colorPalettes.find(p => p.name.toLowerCase() === selectedPalette);
        if (!palette) return null;

        return (
            <div className="palette-info">
                <h3>{palette.name}</h3>
                <p>{palette.description}</p>
                <div className="usage-examples">
                    <h4>Használat:</h4>
                    <ul>
                        {palette.usage.map((use, index) => (
                            <li key={index}>{use}</li>
                        ))}
                    </ul>
                </div>
                <div className="component-examples">
                    <h4>Példák:</h4>
                    {palette.examples.map((example, index) => (
                        <div key={index} className="example">
                            <h5>{example.component}</h5>
                            <div className="example-colors">
                                {example.colors.map((color, i) => (
                                    <div
                                        key={i}
                                        className="example-color"
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="color-system-demo">
            <div className="controls">
                <select
                    value={selectedPalette}
                    onChange={(e) => setSelectedPalette(e.target.value)}
                >
                    {Object.keys(semanticColors).map((palette) => (
                        <option key={palette} value={palette}>
                            {palette.charAt(0).toUpperCase() + palette.slice(1)}
                        </option>
                    ))}
                </select>

                <select
                    value={colorBlindness}
                    onChange={(e) => setColorBlindness(e.target.value as ColorBlindnessType)}
                >
                    <option value="none">Normál látás</option>
                    <option value="protanopia">Protanopia</option>
                    <option value="deuteranopia">Deuteranopia</option>
                    <option value="tritanopia">Tritanopia</option>
                    <option value="achromatopsia">Achromatopsia</option>
                </select>

                <label>
                    <input
                        type="checkbox"
                        checked={showContrast}
                        onChange={(e) => setShowContrast(e.target.checked)}
                    />
                    Kontraszt mutatása
                </label>
            </div>

            <div className="demo-content">
                <div className="color-scales">
                    {renderColorScale(selectedPalette)}
                </div>
                {renderPaletteInfo()}
            </div>
        </div>
    );
}; 