import React from 'react';

export function Header() {
    return (
        <header className="w-full py-6 px-6 flex justify-center items-center bg-background/50 backdrop-blur-sm fixed top-0 z-10">
            <h1 className="text-2xl font-bold text-foreground tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                NeuroScribe
            </h1>
        </header>
    );
}
