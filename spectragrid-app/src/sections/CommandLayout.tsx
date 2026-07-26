import React from 'react';

type CommandLayoutProps = {
    children: React.ReactNode;
};

export default function CommandLayout({ children }: CommandLayoutProps) {
    return (
        <div style={{
            width: '100%',
            position: 'relative',
            zIndex: 10,
            background: 'transparent'
        }}>
            {children}
        </div>
    );
}
