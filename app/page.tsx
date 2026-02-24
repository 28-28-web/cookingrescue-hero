import MicrowaveScroll from '@/components/MicrowaveScroll';

export default function Home() {
  return (
    <main>
      {/* ── Scrollytelling Hero ── */}
      <MicrowaveScroll />

      {/* ── CTA section ── */}
      <div className="bg-[#EBEBEB] py-20 px-6">
        <div className="max-w-md mx-auto text-center">
          {/* Eyebrow */}
          <p style={{ letterSpacing: '0.22em' }} className="text-[10px] font-semibold uppercase text-black/35 mb-8">
            Free &nbsp;·&nbsp; No sign up &nbsp;·&nbsp; Start tonight
          </p>

          {/* CTA button */}
          <a
            href="https://www.cookingrescue.com"
            style={{ background: '#111' }}
            className="group inline-flex items-center gap-3 text-white text-sm font-semibold px-8 py-4 rounded-full hover:opacity-80 transition-opacity duration-200"
          >
            Visit CookingRescue.com
            <span style={{ color: '#E8631A', fontSize: '1.1rem' }}>→</span>
          </a>

          {/* Tagline */}
          <p className="mt-7 text-[11px] text-black/25 tracking-wide">
            Simple meals for when you&apos;re far from home.
          </p>
        </div>
      </div>
    </main>
  );
}
