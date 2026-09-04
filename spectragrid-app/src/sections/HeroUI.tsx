import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollRef } from '../store';
import { SpectraHeading } from '../components/branding';

gsap.registerPlugin(ScrollTrigger);

export default function HeroUI({ brandReady = true }: { brandReady?: boolean }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !textRef.current) return;

        ScrollTrigger.create({
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => {
                scrollRef.value = self.progress;
            }
        });

        gsap.to(textRef.current, {
            opacity: 0,
            scale: 0.95,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: containerRef.current,
                start: 'top top',
                end: '20% top',
                scrub: true,
            }
        });

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, []);

    return (
        <div ref={containerRef} id="hero" style={{ height: '600vh', width: '100%', position: 'relative' }}>
            {/* Main Title & Subtitle */}

            {/* Main Title & Subtitle */}
            <div ref={textRef} style={{
                position: 'sticky',
                top: 0,
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 20px',
            }}>
                <SpectraHeading animate={brandReady} accent="var(--brand-accent)" />
            </div>

        </div>
    );
}
