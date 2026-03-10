import React from 'react';

interface StepCardProps {
    title: string;
    description?: string;
    children: React.ReactNode;
}

export const StepCard: React.FC<StepCardProps> = ({ title, description, children }) => {
    return (
        <div className="w-full max-w-md mx-auto p-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                {description && <p className="text-gray-400">{description}</p>}
            </div>
            <div className="space-y-6">
                {children}
            </div>
        </div>
    );
};
