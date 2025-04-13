import React from 'react';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle2, Download, Trash2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const PrivacySettings: React.FC = () => {
    const { settings, loading, error, success, updateSettings, exportUserData, deleteUserData } = usePrivacySettings();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Hiba</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Siker</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Adatvédelmi beállítások</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Adatok anonimizálása</h3>
                                <p className="text-sm text-gray-500">
                                    Az adatok anonimizálása biztosítja, hogy a személyes adataid ne legyenek azonosíthatóak.
                                </p>
                            </div>
                            <Switch
                                checked={settings.anonymizeData}
                                onCheckedChange={(checked) => updateSettings({ anonymizeData: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Analitika engedélyezése</h3>
                                <p className="text-sm text-gray-500">
                                    Az analitika segít a szolgáltatás fejlesztésében és a felhasználói élmény javításában.
                                </p>
                            </div>
                            <Switch
                                checked={settings.allowAnalytics}
                                onCheckedChange={(checked) => updateSettings({ allowAnalytics: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Személyre szabás engedélyezése</h3>
                                <p className="text-sm text-gray-500">
                                    A személyre szabás lehetővé teszi, hogy a szolgáltatás a te igényeidhez igazodjon.
                                </p>
                            </div>
                            <Switch
                                checked={settings.allowPersonalization}
                                onCheckedChange={(checked) => updateSettings({ allowPersonalization: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Sütik engedélyezése</h3>
                                <p className="text-sm text-gray-500">
                                    A sütik segítenek a bejelentkezésben és a preferenciák mentésében.
                                </p>
                            </div>
                            <Switch
                                checked={settings.allowCookies}
                                onCheckedChange={(checked) => updateSettings({ allowCookies: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Helymeghatározás engedélyezése</h3>
                                <p className="text-sm text-gray-500">
                                    A helymeghatározás segít a tartalom lokalizálásában és a helyi szolgáltatások megjelenítésében.
                                </p>
                            </div>
                            <Switch
                                checked={settings.allowLocationTracking}
                                onCheckedChange={(checked) => updateSettings({ allowLocationTracking: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">E-mail értesítések engedélyezése</h3>
                                <p className="text-sm text-gray-500">
                                    Kapj értesítéseket a tanulási folyamatodról és a frissítésekről.
                                </p>
                            </div>
                            <Switch
                                checked={settings.allowEmailNotifications}
                                onCheckedChange={(checked) => updateSettings({ allowEmailNotifications: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Push értesítések engedélyezése</h3>
                                <p className="text-sm text-gray-500">
                                    Kapj azonnali értesítéseket a tanulási folyamatodról.
                                </p>
                            </div>
                            <Switch
                                checked={settings.allowPushNotifications}
                                onCheckedChange={(checked) => updateSettings({ allowPushNotifications: checked })}
                            />
                        </div>

                        <div className="space-y-2">
                            <div>
                                <h3 className="font-medium">Adatmegtartási időszak</h3>
                                <p className="text-sm text-gray-500">
                                    Válaszd ki, hogy mennyi ideig szeretnéd tárolni az adataidat.
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Slider
                                    value={[settings.dataRetentionPeriod]}
                                    onValueChange={([value]) => updateSettings({ dataRetentionPeriod: value })}
                                    min={30}
                                    max={730}
                                    step={30}
                                />
                                <span className="text-sm text-gray-500">
                                    {settings.dataRetentionPeriod} nap
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <Button
                            variant="outline"
                            onClick={exportUserData}
                            className="flex items-center space-x-2"
                        >
                            <Download className="h-4 w-4" />
                            <span>Adatok exportálása</span>
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={deleteUserData}
                            className="flex items-center space-x-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span>Adatok törlése</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}; 