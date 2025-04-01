"use client";

import { ApiTester } from "@/components/testing/ApiTester";

export default function TestingPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold text-white mb-8">API Tesztelő</h1>
            <ApiTester />
        </div>
    );
} 