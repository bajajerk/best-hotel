"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

type BentoItem = {
  image: string;
  title: string;
  icon: string;
};

const ITEMS: BentoItem[] = [
  {
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
    title: "Maldivian Overwater Villas",
    icon: "🏝️",
  },
  {
    image:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80",
    title: "Tuscan Vineyard Retreats",
    icon: "🍇",
  },
  {
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80",
    title: "Alpine Chalets",
    icon: "🏔️",
  },
  {
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80",
    title: "Kyoto Ryokans",
    icon: "🌸",
  },
  {
    image:
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=80",
    title: "Santorini Cliffside Suites",
    icon: "🌅",
  },
  {
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80",
    title: "Provence Lavender Estates",
    icon: "💜",
  },
  {
    image:
      "https://images.unsplash.com/photo-1455587734955-081b22074882?w=1200&q=80",
    title: "Manhattan Sky Lofts",
    icon: "🏙️",
  },
  {
    image:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80",
    title: "Dubai Desert Camps",
    icon: "🐪",
  },
  {
    image:
      "https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=1200&q=80",
    title: "Patagonian Eco-Lodges",
    icon: "🌲",
  },
  {
    image:
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80",
    title: "Marrakech Riads",
    icon: "🕌",
  },
  {
    image:
      "https://images.unsplash.com/photo-1535827841776-24afc1e255ac?w=1200&q=80",
    title: "Iceland Glass Cabins",
    icon: "❄️",
  },
  {
    image:
      "https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=1200&q=80",
    title: "Bali Jungle Pools",
    icon: "🌴",
  },
];

export default function BentoCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 360, behavior: "smooth" });
      }
    }, 5000);

    return () => clearInterval(id);
  }, []);

  return (
    <section className="w-full py-12">
      <div className="mx-auto max-w-7xl px-6 mb-8">
        <h2 className="font-serif text-3xl lg:text-4xl tracking-tight text-neutral-900">
          A World of Curated Stays
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          Hand-selected sanctuaries, drifting endlessly to your right.
        </p>
      </div>

      <div
        ref={scrollRef}
        className="no-scrollbar grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-4"
      >
        {ITEMS.map((item, i) => {
          const isHero = i % 4 === 0 || i % 5 === 0;

          return (
            <motion.div
              key={`${item.title}-${i}`}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={
                isHero
                  ? "group relative row-span-2 w-72 lg:w-80 h-[500px] snap-center overflow-hidden rounded-2xl bg-neutral-900 shadow-md hover:shadow-2xl transition-shadow duration-500"
                  : "group relative row-span-1 w-60 lg:w-72 h-[242px] snap-center overflow-hidden rounded-2xl bg-neutral-900 shadow-md hover:shadow-2xl transition-shadow duration-500"
              }
            >
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-between p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-md text-lg ring-1 ring-white/20">
                  <span aria-hidden>{item.icon}</span>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/60 mb-1">
                    {isHero ? "Signature Collection" : "Curated"}
                  </div>
                  <h3
                    className={
                      isHero
                        ? "font-serif text-2xl lg:text-3xl leading-tight text-white"
                        : "font-serif text-lg lg:text-xl leading-tight text-white"
                    }
                  >
                    {item.title}
                  </h3>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
