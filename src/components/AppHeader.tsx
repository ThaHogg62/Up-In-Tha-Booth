import React from 'react';
import { MicIcon } from '@/components/Icons';

interface AppHeaderProps {
    isPaid: boolean;
}

const AppHeader = React.memo(({ isPaid }: AppHeaderProps) => (
    <header className="text-center mb-4 flex flex-col items-center space-y-2">
        <div className="flex items-center space-x-2">
            <MicIcon className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white tracking-tight">Tha Booth</h1>
            {isPaid && (
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-0.5 rounded-full self-center mt-1">Premium</span>
            )}
        </div>
        <p className="text-md text-gray-400">Real-time AI audio enhancement.</p>
    </header>
));

export default AppHeader;
