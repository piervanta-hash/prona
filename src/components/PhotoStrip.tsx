import { photoUrl, parsePhotos } from "@/lib/photoUrl";
import { fingerprint } from "@/lib/sitephoto";
import { dateShort } from "@/lib/format";

export default function PhotoStrip({
  json,
  stage,
  code,
  registry,
  labels,
}: {
  json: string | null | undefined;
  stage: string;
  code: string;
  registry: string;
  labels: Record<string, string>;
}) {
  const photos = parsePhotos(json);
  if (photos.length === 0) return <p className="text-slate-500 px-6 py-5">{labels.none}</p>;

  return (
    <div className="px-6 py-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {photos.map((p) => {
          const caption = labels[p.captionKey] ?? p.captionKey;
          return (
          <figure key={p.seed} className="border border-[#dbe4e7] bg-white">
            <a href={photoUrl(p, { stage, code, registry }, undefined, caption)} target="_blank" rel="noreferrer">
              <img
                src={photoUrl(p, { stage, code, registry }, { w: 720, h: 480 }, caption)}
                alt={caption}
                className="w-full block"
              />
            </a>
            <figcaption className="px-3 py-2.5 text-[0.82rem] text-slate-600 leading-relaxed">
              <span className="block font-semibold text-petrol-800 text-[0.92rem]">{caption}</span>
              <span className="font-mono text-[0.74rem] text-slate-500">{fingerprint(p.seed)}</span>
            </figcaption>
          </figure>
          );
        })}
      </div>
    </div>
  );
}
