interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
}

export default function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <section className="mb-12 max-w-4xl">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#56642b]">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-sans text-3xl font-semibold leading-tight tracking-tight text-[#1a1c1b] md:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl font-sans text-sm leading-7 text-[#747878]">
        {description}
      </p>
    </section>
  );
}
