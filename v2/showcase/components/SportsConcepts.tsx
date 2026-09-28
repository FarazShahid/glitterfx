import SectionHeading from './SectionHeading';
import ConceptBanner, { type ConceptData } from './ConceptBanner';

const concepts: ConceptData[] = [
  {
    kicker: 'Sports · Football',
    title: 'Velocity Football',
    desc: 'A broadcast-grade hero for live matchdays, with a star field drifting behind the headline and a restrained vignette to keep the scoreline readable.',
    tags: ['star-field', 'Hero Banner', 'V2', 'Canvas Preview'],
    img: 'https://readdy.ai/api/search-image?query=Cinematic%20night%20photograph%20of%20a%20floodlit%20football%20pitch%20with%20dramatic%20light%20beams%20and%20mist%2C%20deep%20violet%20and%20cyan%20atmosphere%2C%20empty%20stadium%2C%20premium%20sports%20broadcast%20look%2C%20no%20text%2C%20no%20logos&width=1600&height=800&seq=21&orientation=landscape',
    effect: 'star-field',
  },
  {
    kicker: 'Sports · Racing',
    title: 'Apex Motorsport',
    desc: 'Warp streaks read as pure velocity for race weekends, qualifying countdowns and lap-record moments on a rain-soaked night circuit.',
    tags: ['warp-speed', 'Hero Banner', 'V2', 'Canvas Preview'],
    img: 'https://readdy.ai/api/search-image?query=Cinematic%20photograph%20of%20a%20night%20race%20track%20with%20glowing%20curbs%20and%20light%20trails%2C%20dark%20navy%20tones%2C%20rain%20and%20reflections%2C%20premium%20motorsport%20broadcast%20aesthetic%2C%20no%20text%2C%20no%20logos&width=1600&height=800&seq=22&orientation=landscape',
    effect: 'warp-speed',
  },
  {
    kicker: 'Sports · Arena',
    title: 'Pulse Arena',
    desc: 'A galaxy field surrounds the stage while concentric floor rings pulse beneath the spotlight in a soft cyan-violet rhythm, giving tournament reveals the feel of a live energy system.',
    tags: ['galaxy', 'Pulse Rings', 'Blinking Stage', 'V2'],
    img: 'https://readdy.ai/api/search-image?query=Cinematic%20photograph%20of%20a%20packed%20futuristic%20arena%20with%20magenta%20and%20cyan%20stage%20lighting%2C%20haze%20and%20light%20beams%2C%20dynamic%20sports%20event%20atmosphere%2C%20no%20recognizable%20faces%2C%20no%20text%2C%20no%20logos&width=1600&height=800&seq=23&orientation=landscape',
    effect: 'galaxy',
    visual: 'pulse-arena',
  },
  {
    kicker: 'Sports · Events',
    title: 'Starlight League',
    desc: 'Soft glitter shimmer adds warmth to ticketing and season-launch pages without overpowering the calls to action.',
    tags: ['glitter-shimmer', 'Landing', 'V2', 'Canvas Preview'],
    img: 'https://readdy.ai/api/search-image?query=Cinematic%20photograph%20of%20a%20baseball%20stadium%20at%20night%20under%20bright%20stadium%20lights%2C%20starry%20sky%2C%20cool%20blue%20tones%2C%20misty%20atmosphere%2C%20premium%20sports%20editorial%20style%2C%20no%20text%2C%20no%20logos&width=1600&height=800&seq=24&orientation=landscape',
    effect: 'glitter-shimmer',
  },
];

export default function SportsConcepts() {
  return (
    <section className="relative border-t border-white/5 bg-[#05060f] py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_50%_100%_at_50%_0%,rgba(168,85,247,0.12),transparent_70%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Featured sports concepts"
          title="Dramatic hero banners for sports platforms"
          desc="Four concept directions showing how GlitterFX transforms a sports landing page into an atmospheric, high-energy broadcast experience."
        />
        <div className="mt-14 space-y-8">
          {concepts.map((concept, index) => (
            <ConceptBanner key={concept.title} data={concept} reverse={index % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
