import type { CSSProperties } from "react";

type ArtProps = {
  className?: string;
  style?: CSSProperties;
};

export function AnjoAcolhendoIllustration({ className = "", style }: ArtProps) {
  return (
    <svg className={"pi-art pi-art--hero " + className} style={style} viewBox="0 0 360 260" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="pi-gA-anjo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C4B5FD"/><stop offset="1" stopColor="#7C3AED"/></linearGradient>
        <linearGradient id="pi-gB-anjo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FDE68A"/><stop offset="1" stopColor="#F59E0B"/></linearGradient>
        <linearGradient id="pi-gC-anjo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#99F6E4"/><stop offset="1" stopColor="#14B8A6"/></linearGradient>
      </defs>
      <circle cx="190" cy="130" r="112" fill="#fff" fillOpacity=".07"/>
      <circle cx="190" cy="130" r="80" fill="#fff" fillOpacity=".06"/>
      <ellipse cx="180" cy="238" rx="150" ry="13" fill="#000" fillOpacity=".18"/>
      <path d="M40 232 C 120 212, 150 168, 222 158 S 300 118, 318 74" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="3" strokeDasharray="1 11" strokeLinecap="round"/>
      <g className="pi-float-b"><line x1="318" y1="76" x2="318" y2="34" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
        <path d="M319 34h30l-8 9 8 9h-30z" fill="url(#pi-gB-anjo)"/></g>
      <g className="pi-float-a">
        <ellipse cx="96" cy="160" rx="20" ry="36" fill="#fff" fillOpacity=".9" transform="rotate(-24 96 160)"/>
        <ellipse cx="144" cy="160" rx="20" ry="36" fill="#fff" fillOpacity=".9" transform="rotate(24 144 160)"/>
        <path d="M94 236v-52a26 26 0 0 1 52 0v52z" fill="url(#pi-gA-anjo)"/>
        <path d="M140 182q22-6 40-30" fill="none" stroke="#7C3AED" strokeWidth="11" strokeLinecap="round"/>
        <circle cx="182" cy="149" r="6.5" fill="var(--pi-skin-1)"/>
        <circle cx="120" cy="134" r="19" fill="var(--pi-skin-1)"/>
        <path d="M101 132a19 19 0 0 1 38 0q-9-11-19-9q-10-2-19 9z" fill="var(--pi-hair)"/>
        <circle cx="114" cy="137" r="2" fill="#2B1B12"/><circle cx="126" cy="137" r="2" fill="#2B1B12"/>
        <path d="M115 143q5 4 10 0" fill="none" stroke="#2B1B12" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="120" cy="106" rx="15" ry="4.5" fill="none" stroke="#FDE68A" strokeWidth="3.5"/>
      </g>
      <g className="pi-float-b">
        <path d="M200 236v-46a25 25 0 0 1 50 0v46z" fill="url(#pi-gC-anjo)"/>
        <circle cx="225" cy="148" r="18" fill="var(--pi-skin-2)"/>
        <path d="M207 146a18 18 0 0 1 36 0q-4-14-18-14t-18 14z" fill="#111"/>
        <circle cx="219" cy="151" r="2" fill="#111"/><circle cx="231" cy="151" r="2" fill="#111"/>
        <path d="M220 157q5 4 10 0" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round"/>
        <rect x="206" y="192" width="26" height="32" rx="5" fill="#fff"/>
        <rect x="211" y="199" width="16" height="3" rx="1.5" fill="#C4B5FD"/><rect x="211" y="206" width="12" height="3" rx="1.5" fill="#E9D5FF"/><rect x="211" y="213" width="14" height="3" rx="1.5" fill="#E9D5FF"/>
      </g>
      <path className="pi-twinkle" d="M172 98c-4-6-13-3-11 4 1 4 11 11 11 11s10-7 11-11c2-7-7-10-11-4z" fill="#F9A8D4"/>
      <path className="pi-twinkle d2" d="M60 70l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#FDE68A"/>
      <path className="pi-twinkle d3" d="M268 200l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#fff"/>
      <path className="pi-twinkle" d="M286 48l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#E9D5FF"/>
    </svg>
  );
}

export function EnvelopeRelogioIllustration({ className = "", style }: ArtProps) {
  return (
    <svg className={"pi-art pi-art--hero " + className} style={style} viewBox="0 0 220 160" aria-hidden="true" focusable="false">
      <circle cx="110" cy="80" r="70" fill="#fff" fillOpacity=".08"/>
      <g className="pi-float-a">
        <rect x="40" y="46" width="130" height="88" rx="14" fill="#fff"/>
        <path d="M40 60l65 42a10 10 0 0 0 10 0l55-42" fill="none" stroke="#DDD6FE" strokeWidth="5" strokeLinejoin="round"/>
        <path d="M105 66c-6-9-20-5-17 6 2 6 17 16 17 16s15-10 17-16c3-11-11-15-17-6z" fill="#C026D3"/>
      </g>
      <g className="pi-float-b">
        <circle cx="170" cy="46" r="22" fill="#FDE68A"/><circle cx="170" cy="46" r="16" fill="#F59E0B"/>
        <path d="M170 37v9l6 4" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"/>
      </g>
      <path className="pi-twinkle" d="M30 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#FDE68A"/>
      <path className="pi-twinkle d2" d="M196 120l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fff"/>
    </svg>
  );
}

export function TudoEmDiaIllustration({ className = "", style }: ArtProps) {
  return (
    <svg className={"pi-art pi-art--empty " + className} style={style} viewBox="0 0 220 170" aria-hidden="true" focusable="false">
      <circle cx="110" cy="92" r="72" className="pi-f-soft"/>
      <g className="pi-float-a">
        <rect x="62" y="34" width="96" height="122" rx="14" className="pi-f-surface pi-s-border" strokeWidth="2"/>
        <rect x="88" y="26" width="44" height="18" rx="7" className="pi-f-brand"/>
        <rect x="78" y="62" width="64" height="7" rx="3.5" className="pi-f-line"/>
        <rect x="78" y="76" width="44" height="7" rx="3.5" className="pi-f-line"/>
        <circle cx="110" cy="116" r="22" className="pi-f-ok"/>
        <path d="M99 116l8 8 15-15" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <g className="pi-float-b">
        <path d="M176 152c0-14 3-24 10-32" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round"/>
        <path d="M186 120c8-2 14-8 14-16-9 0-15 6-14 16z" className="pi-f-ok"/>
        <path d="M180 134c-7-3-12-9-11-16 8 1 13 8 11 16z" className="pi-f-ok" opacity=".7"/>
        <rect x="166" y="148" width="22" height="16" rx="4" className="pi-f-warn"/>
      </g>
      <path className="pi-twinkle pi-f-warn" d="M40 48l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>
      <path className="pi-twinkle d2 pi-f-brand3" d="M176 40l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
      <path className="pi-twinkle d3 pi-f-brand" d="M30 120l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
    </svg>
  );
}

export function CalendarioCheckIllustration({ className = "", style }: ArtProps) {
  return (
    <svg className={"pi-art pi-art--filter " + className} style={style} viewBox="0 0 200 150" aria-hidden="true" focusable="false">
      <circle cx="100" cy="80" r="62" className="pi-f-soft"/>
      <g className="pi-float-a">
        <rect x="50" y="34" width="100" height="92" rx="14" className="pi-f-surface pi-s-border" strokeWidth="2"/>
        <path d="M50 48a14 14 0 0 1 14-14h72a14 14 0 0 1 14 14v8H50z" className="pi-f-brand"/>
        <rect x="70" y="24" width="8" height="20" rx="4" className="pi-f-brand3"/><rect x="122" y="24" width="8" height="20" rx="4" className="pi-f-brand3"/>
        <g className="pi-f-line"><rect x="64" y="68" width="14" height="10" rx="3"/><rect x="84" y="68" width="14" height="10" rx="3"/><rect x="104" y="68" width="14" height="10" rx="3"/><rect x="124" y="68" width="14" height="10" rx="3"/>
          <rect x="64" y="86" width="14" height="10" rx="3"/><rect x="84" y="86" width="14" height="10" rx="3"/></g>
        <circle cx="124" cy="100" r="18" className="pi-f-ok"/>
        <path d="M115 100l6 6 12-12" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <path className="pi-twinkle pi-f-warn" d="M34 40l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>
      <path className="pi-twinkle d2 pi-f-brand" d="M168 116l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
    </svg>
  );
}

export function SuccessCheckIllustration({ className = "", style }: ArtProps) {
  return (
    <svg className={"pi-art pi-art--success " + className} style={style} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <circle cx="60" cy="60" r="54" className="pi-f-soft"/>
      <circle className="pi-ring-draw" cx="60" cy="60" r="46" fill="none" stroke="var(--pi-ok)" strokeWidth="6" strokeLinecap="round" transform="rotate(-90 60 60)"/>
      <path className="pi-check-draw" d="M40 61l14 14 28-28" fill="none" stroke="var(--pi-ok)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function SparkShape({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z" fill="currentColor"/>
    </svg>
  );
}
