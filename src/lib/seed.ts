import { PrismaClient } from "@prisma/client";
import { MILESTONE_LADDER } from "./constants";
import { checklistFor, CITY_COORDS } from "./checklist";

const db = new PrismaClient();

/** Ripopola il database ai dati iniziali della demo. Usato dal comando e dal pulsante in app. */

// PRNG deterministico: la demo deve essere identica a ogni reset.
let _s = 20260819;
function rnd() {
  _s = (_s * 1664525 + 1013904223) % 4294967296;
  return _s / 4294967296;
}
const pick = <T>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];

/** Impronta esadecimale stabile, usata come riferimento dei documenti. */
function fp(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, "0").toUpperCase();
}
const between = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const d = (s: string) => new Date(s + "T09:00:00.000Z");

const EMRA = ["Arben","Mirela","Genci","Elona","Sokol","Anila","Besnik","Teuta","Ilir","Vjollca","Fatmir","Migena","Klodian","Ardita","Gentian","Blerta","Erion","Silvana","Altin","Marsida","Endrit","Rovena","Kujtim","Alma","Dritan","Enkeleda","Bledar","Lindita","Astrit","Nertila","Redi","Xhensila","Fatjon","Suela","Aleksander","Valbona","Erjon","Denada","Kreshnik","Etleva","Sajmir","Manjola","Ervin","Jonida","Agron","Brikena","Taulant","Diana","Renis","Alketa","Ledio","Majlinda","Olsi","Adelina","Ermal","Vera","Gerti","Fjolla","Ilirjan"];
const MBIEMRA = ["Hoxha","Dervishi","Basha","Prifti","Meta","Krasniqi","Shehu","Gjoka","Bushati","Kola","Leka","Berisha","Cela","Dushku","Frasheri","Gega","Hasani","Ismaili","Jaupi","Kadare","Lala","Mema","Nikaj","Osmani","Pashko","Qosja","Rama","Sula","Tahiri","Ujkaj","Veseli","Zeka","Bala","Cuko","Duka","Elezi","Ferra","Gjini","Hyseni","Imami"];

function fullName(i: number) {
  return `${EMRA[i % EMRA.length]} ${MBIEMRA[(i * 7 + 3) % MBIEMRA.length]}`;
}

async function wipe() {
  await db.zonePriceStat.deleteMany();
  await db.attachment.deleteMany();
  await db.auditLog.deleteMany();
  await db.report.deleteMany();
  await db.inspection.deleteMany();
  await db.releaseRequest.deleteMany();
  await db.milestone.deleteMany();
  await db.payment.deleteMany();
  await db.contract.deleteMany();
  await db.unit.deleteMany();
  await db.escrowAccount.deleteMany();
  await db.project.deleteMany();
  await db.buyer.deleteMany();
  await db.certifier.deleteMany();
  await db.developer.deleteMany();
  await db.bank.deleteMany();
  await db.demoState.deleteMany();
}

const STAGE_LABEL_SQ: Record<string, string> = {
  FOUNDATION: "Themelet", STRUCTURE: "Struktura", ROOF: "Çatia",
  ENVELOPE: "Fasada", FINISHES: "Përfundimet", HANDOVER: "Dorëzimi",
};

function seedPhotos(slug: string, type: string, at: Date, city: string) {
  const [lat, lng] = CITY_COORDS[city] ?? CITY_COORDS["Tiranë"];
  return [0, 1, 2].map((i) => ({
    seed: `${slug}-${type}-${i}`,
    lat: +(lat + i * 0.0004).toFixed(5),
    lng: +(lng + i * 0.0006).toFixed(5),
    takenAt: at.toISOString(),
    captionKey: `cap${i}`,
  }));
}

const audit: any[] = [];
function log(actorRole: string, actorName: string, action: string, entity: string, entityRef: string, detail: string, createdAt: Date) {
  audit.push({ actorRole, actorName, action, entity, entityRef, detail, createdAt });
}

export async function seedDatabase() {
  _s = 20260819;
  await wipe();

  // ---------------------------------------------------------------- BANCHE
  const bkt = await db.bank.create({ data: { id: "bank-bkt", name: "Banka Kombëtare Tregtare", swift: "NCBAALTX" } });
  const credins = await db.bank.create({ data: { id: "bank-credins", name: "Banka Credins", swift: "CDISALTR" } });

  // ----------------------------------------------------------- SVILUPPATORI
  const devData = [
    { name: "Alba Konstruksion sh.p.k.", nipt: "K61814505A", tier: "A", licenseState: "ACTIVE", netWorthEur: 14_200_000, yearsActive: 18, deliveredUnits: 940, disputesCount: 1, city: "Tiranë", contactEmail: "info@albakonstruksion.al" },
    { name: "Adriatik Ndërtim sh.a.", nipt: "L02318019C", tier: "A", licenseState: "ACTIVE", netWorthEur: 11_800_000, yearsActive: 15, deliveredUnits: 720, disputesCount: 0, city: "Durrës", contactEmail: "kontakt@adriatikndertim.al" },
    { name: "Kastrioti Group sh.p.k.", nipt: "K91422033M", tier: "B", licenseState: "ACTIVE", netWorthEur: 4_600_000, yearsActive: 9, deliveredUnits: 260, disputesCount: 3, city: "Tiranë", contactEmail: "zyra@kastriotigroup.al" },
    { name: "Vlora Rezidenca sh.p.k.", nipt: "L71905441E", tier: "B", licenseState: "ACTIVE", netWorthEur: 3_900_000, yearsActive: 7, deliveredUnits: 180, disputesCount: 2, city: "Vlorë", contactEmail: "info@vlorarezidenca.al" },
    { name: "Shkodra Invest sh.p.k.", nipt: "K82011276N", tier: "C", licenseState: "ACTIVE", netWorthEur: 1_450_000, yearsActive: 5, deliveredUnits: 74, disputesCount: 5, city: "Shkodër", contactEmail: "info@shkodrainvest.al" },
    { name: "Elbasan Prime Construction sh.p.k.", nipt: "L41708823B", tier: "C", licenseState: "SUSPENDED", netWorthEur: 820_000, yearsActive: 4, deliveredUnits: 31, disputesCount: 11, city: "Elbasan", contactEmail: "info@elbasanprime.al" },
  ];
  const devs = [];
  for (let i = 0; i < devData.length; i++) devs.push(await db.developer.create({ data: { id: `dev-${i + 1}`, ...devData[i] } }));

  // ------------------------------------------------------------ CERTIFICATORI
  const certData = [
    { name: "Ing. Arben Hoxha", registryNo: "IN-2011-0342", specialty: "Strukturë betoni", state: "ACTIVE", checksDone: 148, deviationsFound: 6 },
    { name: "Ing. Mirela Dervishi", registryNo: "IN-2013-0871", specialty: "Gjeoteknikë", state: "ACTIVE", checksDone: 96, deviationsFound: 4 },
    { name: "Ing. Genci Basha", registryNo: "IN-2009-0155", specialty: "Strukturë betoni", state: "ACTIVE", checksDone: 213, deviationsFound: 3 },
    { name: "Ing. Elona Prifti", registryNo: "IN-2016-1204", specialty: "Impiante & fasadë", state: "ACTIVE", checksDone: 61, deviationsFound: 2 },
    { name: "Ing. Sokol Meta", registryNo: "IN-2014-0930", specialty: "Strukturë betoni", state: "ACTIVE", checksDone: 87, deviationsFound: 9 },
  ];
  const certs = [];
  for (let i = 0; i < certData.length; i++) certs.push(await db.certifier.create({ data: { id: `cert-${i + 1}`, ...certData[i] } }));

  // ----------------------------------------------------------------- PROGETTI
  type P = {
    name: string; municipality: string; address: string; dev: number; permitNo: string; permitDate: string;
    slug: string; units: number; status: string; progressPct: number; expected: string; registeredAt: string | null;
    sold: number; pricePerSqm: [number, number]; bank: string; publicCode: string | null;
    rejectionReason?: string; lastSiteActivity?: string; typologyMix?: number[];
    originalExpected?: string; landZone?: string; zone?: string;
  };

  const projs: P[] = [
    { slug: "kodra-e-diellit", name: "Rezidenca Kodra e Diellit", municipality: "Tiranë", address: "Rruga e Kavajës 187", dev: 0, permitNo: "LN-TR-2026-0184", permitDate: "2026-04-12", units: 18, status: "REGISTERED", progressPct: 0, expected: "2028-09-30", registeredAt: "2026-06-02", sold: 0, pricePerSqm: [1350, 1520], bank: bkt.id, publicCode: "PRONA-TR-2026-0041", lastSiteActivity: "2026-08-11", originalExpected: "2028-09-30", landZone: "ZK 8270, Nr. pasurie 4/212", zone: "Kombinat" },
    { slug: "tirana-riverside", name: "Tirana Riverside", municipality: "Tiranë", address: "Bulevardi Zogu i Parë 44", dev: 0, permitNo: "LN-TR-2024-0921", permitDate: "2024-05-20", units: 24, status: "BUILDING", progressPct: 45, expected: "2027-06-30", registeredAt: "2024-07-01", sold: 16, pricePerSqm: [1280, 1460], bank: bkt.id, publicCode: "PRONA-TR-2024-0012", lastSiteActivity: "2026-08-14", originalExpected: "2026-12-31", landZone: "ZK 8180, Nr. pasurie 7/58", zone: "21 Dhjetori" },
    { slug: "durres-marina", name: "Durrës Marina Residence", municipality: "Durrës", address: "Rruga Taulantia 12", dev: 1, permitNo: "LN-DR-2025-0338", permitDate: "2025-03-04", units: 20, status: "BUILDING", progressPct: 25, expected: "2027-12-31", registeredAt: "2025-04-15", sold: 11, pricePerSqm: [1420, 1610], bank: credins.id, publicCode: "PRONA-DR-2025-0007", lastSiteActivity: "2026-08-16", originalExpected: "2027-12-31", landZone: "ZK 8514, Nr. pasurie 12/340", zone: "Plazh" },
    { slug: "vlora-bay-towers", name: "Vlora Bay Towers", municipality: "Vlorë", address: "Lungomare, Skelë", dev: 3, permitNo: "LN-VL-2024-0157", permitDate: "2024-02-19", units: 16, status: "BUILDING", progressPct: 60, expected: "2027-03-31", registeredAt: "2024-03-28", sold: 12, pricePerSqm: [1560, 1800], bank: credins.id, publicCode: "PRONA-VL-2024-0003", lastSiteActivity: "2026-08-12", originalExpected: "2027-03-31", landZone: "ZK 8703, Nr. pasurie 3/91", zone: "Skelë" },
    { slug: "shkodra-green-park", name: "Shkodra Green Park", municipality: "Shkodër", address: "Rruga Studenti 3", dev: 4, permitNo: "LN-SH-2024-0066", permitDate: "2024-06-11", units: 14, status: "STALLED", progressPct: 25, expected: "2026-12-31", registeredAt: "2024-08-05", sold: 9, pricePerSqm: [910, 1040], bank: bkt.id, publicCode: "PRONA-SH-2024-0002", lastSiteActivity: "2026-02-09", originalExpected: "2026-03-31", landZone: "ZK 8901, Nr. pasurie 9/17", zone: "Rus" },
    { slug: "tirana-business-court", name: "Tirana Business Court", municipality: "Tiranë", address: "Rruga e Elbasanit 9", dev: 2, permitNo: "LN-TR-2022-0455", permitDate: "2022-09-01", units: 12, status: "DELIVERED", progressPct: 95, expected: "2026-03-31", registeredAt: "2022-10-10", sold: 12, pricePerSqm: [1490, 1700], bank: bkt.id, publicCode: "PRONA-TR-2022-0031", lastSiteActivity: "2026-03-20", originalExpected: "2025-09-30", landZone: "ZK 8190, Nr. pasurie 2/104", zone: "Blloku" },
    { slug: "porto-vlore-panorama", name: "Porto Vlorë Panorama", municipality: "Vlorë", address: "Rruga Sazani 21", dev: 5, permitNo: "LN-VL-2026-0072", permitDate: "2026-01-22", units: 10, status: "REJECTED", progressPct: 0, expected: "2028-12-31", registeredAt: null, sold: 0, pricePerSqm: [1500, 1740], bank: credins.id, publicCode: null, zone: "Uji i Ftohtë", rejectionReason: "Licenca e zhvilluesit e pezulluar; mungon garancia bankare dhe plani i pagesave nuk përputhet me kronogramën." },
    { slug: "durres-hill-terraces", name: "Durrës Hill Terraces", municipality: "Durrës", address: "Rruga Currila 58", dev: 1, permitNo: "LN-DR-2026-0410", permitDate: "2026-06-30", units: 6, status: "DRAFT", progressPct: 0, expected: "2029-03-31", registeredAt: null, sold: 0, pricePerSqm: [1380, 1550], bank: credins.id, publicCode: null, zone: "Currila" },
  ];

  const TYPOLOGIES = [
    { t: "1+1", min: 48, max: 62 },
    { t: "2+1", min: 68, max: 92 },
    { t: "3+1", min: 96, max: 128 },
    { t: "Dyqan", min: 34, max: 70 },
  ];

  let buyerIdx = 0;
  let contractSeq = 1000;
  let paymentSeq = 500000;

  for (const p of projs) {
    const dev = devs[p.dev];
    const project = await db.project.create({
      data: {
        id: p.slug,
        publicCode: p.publicCode,
        name: p.name,
        municipality: p.municipality,
        zone: p.zone ?? null,
        address: p.address,
        developerId: dev.id,
        permitNo: p.permitNo,
        permitDate: d(p.permitDate),
        unitsCount: p.units,
        status: p.status,
        progressPct: p.progressPct,
        expectedDelivery: d(p.expected),
        originalDelivery: p.originalExpected ? d(p.originalExpected) : null,
        landCadastreRef: p.landZone ?? null,
        registeredAt: p.registeredAt ? d(p.registeredAt) : null,
        rejectionReason: p.rejectionReason ?? null,
        lastSiteActivity: p.lastSiteActivity ? d(p.lastSiteActivity) : null,
      },
    });

    log("DEVELOPER", dev.name, "PROJECT_SUBMITTED", "Project", project.name, `Leje ndërtimi ${p.permitNo}, ${p.units} njësi`, d(p.permitDate));
    if (p.registeredAt) log("AGENCY", "Agjencia PRONA", "PROJECT_REGISTERED", "Project", project.name, `Kod publik ${p.publicCode}`, d(p.registeredAt));
    if (p.rejectionReason) log("AGENCY", "Agjencia PRONA", "PROJECT_REJECTED", "Project", project.name, p.rejectionReason, d("2026-02-14"));

    // ------------------------------------------------------------- UNITÀ
    const units = [];
    for (let i = 0; i < p.units; i++) {
      const ty = i % 9 === 8 ? TYPOLOGIES[3] : TYPOLOGIES[i % 3];
      const area = between(ty.min, ty.max);
      const half = Math.ceil(p.units / 2);
      const blk = i < half ? "A" : "B";
      const idxInBlk = i < half ? i : i - half;
      const floor = ty.t === "Dyqan" ? 0 : 1 + Math.floor(idxInBlk / 3);
      const pos = (idxInBlk % 3) + 1;
      const perSqm = between(p.pricePerSqm[0], p.pricePerSqm[1]) + floor * 6;
      const u = await db.unit.create({
        data: {
          projectId: project.id,
          label: `${blk}-${floor}-${pos}`,
          floor,
          areaSqm: area,
          priceEur: Math.round((area * perSqm) / 100) * 100,
          typology: ty.t,
          status: "FREE",
        },
      });
      units.push(u);
    }

    // ------------------------------------------------------------ ESCROW
    const escrowActive = p.status !== "DRAFT" && p.status !== "REJECTED";
    const escrow = await db.escrowAccount.create({
      data: {
        projectId: project.id,
        bankId: p.bank,
        iban: `AL${35 + projs.indexOf(p)}208110080000${String(10000 + projs.indexOf(p) * 137).slice(0, 6)}`,
        active: escrowActive,
        frozen: false,
        collectedEur: 0,
        releasedEur: 0,
        openedAt: p.registeredAt ? d(p.registeredAt) : null,
      },
    });
    if (escrowActive) log("BANK", p.bank === bkt.id ? bkt.name : credins.name, "ESCROW_OPENED", "EscrowAccount", escrow.iban, `Llogari e kushtëzuar aktive për ${project.name}`, d(p.registeredAt!));

    // --------------------------------------------------- CONTRATTI + PAGAMENTI
    let collected = 0;
    for (let i = 0; i < p.sold; i++) {
      const unit = units[i];
      const isDemoBuyer = p.slug === "tirana-riverside" && i === 0;
      const buyer = await db.buyer.create({
        data: {
          id: isDemoBuyer ? "buyer-demo" : undefined,
          name: isDemoBuyer ? "Arta Ndreu" : fullName(buyerIdx),
          idNumber: `J${60000000 + buyerIdx * 137}${String.fromCharCode(65 + (buyerIdx % 26))}`,
          phone: `+355 6${between(6, 9)} ${between(200, 999)} ${between(1000, 9999)}`,
          email: `${fullName(buyerIdx).toLowerCase().replace(/[^a-z]/g, ".")}@example.al`,
          city: p.municipality,
        },
      });
      buyerIdx++;

      const depositPct = pick([20, 25, 30]);
      const signed = d(p.registeredAt!);
      signed.setDate(signed.getDate() + 20 + i * 11);
      const plan = [
        { key: "DEPOSIT", pct: depositPct, due: "SIGN" },
        { key: "FOUNDATION", pct: 25, due: "M25" },
        { key: "STRUCTURE", pct: 25, due: "M45" },
        { key: "HANDOVER", pct: 100 - depositPct - 50, due: "HANDOVER" },
      ];

      const contract = await db.contract.create({
        data: {
          id: isDemoBuyer ? "contract-demo" : undefined,
          code: `KTR-${++contractSeq}`,
          unitId: unit.id,
          buyerId: buyer.id,
          priceEur: unit.priceEur,
          depositPct,
          planJson: JSON.stringify(plan),
          cadastreRef: `ASHK/${p.municipality.slice(0, 2).toUpperCase()}/${signed.getFullYear()}/${8000 + contractSeq}`,
          cadastreDate: new Date(signed.getTime() + 6 * 864e5),
          status: p.status === "DELIVERED" ? "COMPLETED" : "REGISTERED",
          signedAt: signed,
        },
      });

      await db.unit.update({ where: { id: unit.id }, data: { status: p.status === "DELIVERED" ? "DELIVERED" : "SOLD" } });

      // acconto sempre versato e riconciliato
      const deposit = Math.round((unit.priceEur * depositPct) / 100);
      await db.payment.create({
        data: {
          contractId: contract.id, amountEur: deposit,
          paidAt: new Date(signed.getTime() + 3 * 864e5),
          method: "BANK_TRANSFER", reference: `TRF-${++paymentSeq}`, reconciled: true, kind: "DEPOSIT",
        },
      });
      collected += deposit;

      // rate successive in funzione dell'avanzamento certificato
      const extraTranches = p.progressPct >= 45 ? 2 : p.progressPct >= 25 ? 1 : 0;
      for (let k = 0; k < extraTranches; k++) {
        const amt = Math.round((unit.priceEur * 25) / 100);
        await db.payment.create({
          data: {
            contractId: contract.id, amountEur: amt,
            paidAt: new Date(signed.getTime() + (60 + k * 150) * 864e5),
            method: "BANK_TRANSFER", reference: `TRF-${++paymentSeq}`, reconciled: true, kind: "INSTALMENT",
          },
        });
        collected += amt;
      }
      if (p.status === "DELIVERED") {
        const bal = unit.priceEur - deposit - 2 * Math.round((unit.priceEur * 25) / 100);
        await db.payment.create({
          data: {
            contractId: contract.id, amountEur: bal,
            paidAt: new Date(signed.getTime() + 420 * 864e5),
            method: "BANK_TRANSFER", reference: `TRF-${++paymentSeq}`, reconciled: true, kind: "BALANCE",
          },
        });
        collected += bal;
      }
      await db.attachment.create({
        data: {
          projectId: project.id, contractId: contract.id, kind: "OTHER",
          title: "Kontratë paraprake e shitjes", filename: `kontrata-${contract.code}.pdf`,
          mime: "application/pdf", sizeKb: 210 + Math.floor(rnd() * 400), generated: true,
          uploadedByRole: "DEVELOPER", uploadedByName: dev.name, hash: fp(`KTR-${contract.code}`), createdAt: signed,
        },
      });
      await db.attachment.create({
        data: {
          projectId: project.id, contractId: contract.id, kind: "CADASTRE",
          title: "Vërtetim i regjistrimit kadastral", filename: `kadastra-${contract.code}.pdf`,
          mime: "application/pdf", sizeKb: 120 + Math.floor(rnd() * 200), generated: true,
          uploadedByRole: "AGENCY", uploadedByName: "ASHK — Agjencia Shtetërore e Kadastrës",
          hash: fp(`ASHK-${contract.code}`), createdAt: new Date(signed.getTime() + 6 * 864e5),
        },
      });
      log("DEVELOPER", dev.name, "CONTRACT_REGISTERED", "Contract", contract.code, `${unit.label} → ${buyer.name}, ${unit.priceEur.toLocaleString("it-IT")} €`, signed);
    }

    // ----------------------------------------------------------- ALLEGATI
    const att = async (kind: string, title: string, filename: string, by: string, byRole: string, when: Date, milestoneId?: string) => {
      await db.attachment.create({
        data: {
          projectId: project.id, milestoneId: milestoneId ?? null, kind, title, filename,
          mime: "application/pdf", sizeKb: 180 + Math.floor(rnd() * 2400),
          generated: true, uploadedByRole: byRole, uploadedByName: by,
          hash: fp(`${project.id}-${kind}-${filename}`),
          createdAt: when,
        },
      });
    };
    await att("PERMIT", `Leje ndërtimi ${p.permitNo}`, `leje-${p.permitNo}.pdf`, dev.name, "DEVELOPER", d(p.permitDate));
    await att("SCHEDULE", "Kronogramë e punimeve", `kronograma-${p.slug}.pdf`, dev.name, "DEVELOPER", d(p.permitDate));
    if (escrowActive) {
      await att("INSURANCE", "Garanci bankare e ekzekutimit", `garanci-${p.slug}.pdf`, p.bank === bkt.id ? bkt.name : credins.name, "BANK", d(p.registeredAt!));
      await att("CADASTRE", "Vërtetim i pronësisë së truallit", `kadastra-${p.slug}.pdf`, "ASHK", "AGENCY", d(p.registeredAt!));
    }

    // ------------------------------------------------------------ MILESTONE
    const released = Math.round((collected * p.progressPct) / 100);
    await db.escrowAccount.update({ where: { id: escrow.id }, data: { collectedEur: collected, releasedEur: released } });

    if (escrowActive) {
      let msSeq = 0;
      for (const m of MILESTONE_LADDER) {
        msSeq++;
        const certified = m.cumulativePct <= p.progressPct;
        const isNext = !certified && MILESTONE_LADDER.filter((x) => x.cumulativePct > p.progressPct)[0]?.type === m.type;
        const cert = certs[(projs.indexOf(p) + msSeq) % certs.length];
        const verifiedAt = certified ? new Date(d(p.registeredAt!).getTime() + msSeq * 165 * 864e5) : null;

        const ms = await db.milestone.create({
          data: {
            projectId: project.id,
            type: m.type,
            orderIndex: m.orderIndex,
            cumulativePct: m.cumulativePct,
            status: certified ? "CERTIFIED" : isNext && p.status === "BUILDING" ? "READY" : "PENDING",
            certifierId: certified ? cert.id : isNext ? (p.slug === "tirana-riverside" ? certs[2].id : cert.id) : null,
            verifiedAt,
            outcome: certified ? "PASS" : null,
            checklistJson: certified ? JSON.stringify(checklistFor(m.type, true)) : null,
            photosJson: certified ? JSON.stringify(seedPhotos(p.slug, m.type, verifiedAt!, p.municipality)) : null,
            notes: certified ? "Verifikim në terren, pa mospërputhje." : null,
          },
        });

        if (certified) {
          await att("STRUCTURAL", `Relacion verifikimi — ${STAGE_LABEL_SQ[m.type] ?? m.type}`, `relacion-${m.type.toLowerCase()}.pdf`, cert.name, "CERTIFIER", verifiedAt!, ms.id);
          if (m.type === "FOUNDATION" || m.type === "STRUCTURE") {
            await att("LAB_TEST", `Provë laboratori betoni — ${STAGE_LABEL_SQ[m.type] ?? m.type}`, `prove-betoni-${m.type.toLowerCase()}.pdf`, "Laboratori Qendror i Ndërtimit", "CERTIFIER", verifiedAt!, ms.id);
          }
          const amount = Math.round((collected * (m.cumulativePct - (MILESTONE_LADDER[msSeq - 2]?.cumulativePct ?? 0))) / 100);
          await db.releaseRequest.create({
            data: {
              code: `SHL-${projs.indexOf(p) + 1}${String(msSeq).padStart(2, "0")}`,
              milestoneId: ms.id, escrowId: escrow.id, amountEur: amount,
              status: "EXECUTED",
              requestedAt: verifiedAt!,
              approvedBy: "Agjencia PRONA — Zyra e Mbikëqyrjes",
              approvedAt: new Date(verifiedAt!.getTime() + 2 * 864e5),
              executedAt: new Date(verifiedAt!.getTime() + 3 * 864e5),
            },
          });
          log("CERTIFIER", cert.name, "MILESTONE_CERTIFIED", "Milestone", `${project.name} · ${STAGE_LABEL_SQ[m.type] ?? m.type}`, `Certifikuar ${m.cumulativePct}% — Konform`, verifiedAt!);
          log("AGENCY", "Agjencia PRONA", "RELEASE_APPROVED", "ReleaseRequest", `SHL-${projs.indexOf(p) + 1}${String(msSeq).padStart(2, "0")}`, `${amount.toLocaleString("it-IT")} € të autorizuara`, new Date(verifiedAt!.getTime() + 2 * 864e5));
          await db.certifier.update({ where: { id: cert.id }, data: { checksDone: { increment: 0 } } });
        }
      }
    }

    // ------------------------------------------------------------ ISPEZIONI
    if (p.status === "STALLED") {
      await db.inspection.create({
        data: {
          projectId: project.id, type: "COMPLAINT", outcome: "DEVIATION",
          notes: "Kantieri i ndalur prej 6 muajsh. Asnjë aktivitet i regjistruar në terren. Zhvilluesi nuk ka paraqitur kronogramë të rishikuar.",
          inspector: "Insp. Ardian Lleshi", performedAt: d("2026-07-18"),
        },
      });
      await db.report.create({
        data: {
          code: "SGN-2026-0117", projectId: project.id, authorName: "Blerta Gega",
          subject: "Kantieri i ndalur prej muajsh",
          body: "Kam blerë apartamentin A-2-1 dhe kantieri nuk punon që prej shkurtit. Kërkoj informacion mbi fondet e mia.",
          status: "IN_REVIEW", createdAt: d("2026-07-02"),
        },
      });
      log("CITIZEN", "Blerta Gega", "REPORT_FILED", "Report", "SGN-2026-0117", "Kantier i ndalur — Shkodra Green Park", d("2026-07-02"));
    }
    if (p.status === "DELIVERED") {
      await db.inspection.create({
        data: {
          projectId: project.id, type: "COMPLIANCE", outcome: "PASS",
          notes: "Kontroll përfundues para dorëzimit. Konform. Mbahet 5% garanci deri në mars 2027.",
          inspector: "Insp. Ardian Lleshi", performedAt: d("2026-03-18"),
        },
      });
    }
  }

  // ---------------------------------------------- PORTAFOGLIO CITTADINI DEMO
  // Tre identita' cittadino selezionabili (vedi src/lib/identity.ts). Arta Ndreu,
  // gia' creata sopra come acquirente di Tirana Riverside, riceve qui una seconda
  // proprieta' nel cantiere fermo: e' lei il caso "due immobili, uno bloccato".
  async function addCitizenDossier(opts: {
    projectSlug: string;
    contractId: string;
    buyerId: string; // id del cittadino: se esiste gia' (Arta) viene riusato, altrimenti creato con questo id
    buyerName: string;
    idNumber: string;
    phone: string;
    email: string;
    signedAt: string;
  }) {
    const project = await db.project.findUniqueOrThrow({ where: { id: opts.projectSlug } });
    const unit = await db.unit.findFirstOrThrow({ where: { projectId: project.id, status: "FREE" }, orderBy: { label: "asc" } });
    const devName = devs.find((x) => x.id === project.developerId)?.name ?? "—";

    // upsert: per Arta (id gia' esistente) riusa la riga, per i nuovi cittadini la crea con l'id dato.
    const buyer = await db.buyer.upsert({
      where: { id: opts.buyerId },
      update: {},
      create: { id: opts.buyerId, name: opts.buyerName, idNumber: opts.idNumber, phone: opts.phone, email: opts.email, city: project.municipality },
    });

    const depositPct = 25;
    const signed = d(opts.signedAt);
    const plan = [
      { key: "DEPOSIT", pct: depositPct, due: "SIGN" },
      { key: "FOUNDATION", pct: 25, due: "M25" },
      { key: "STRUCTURE", pct: 25, due: "M45" },
      { key: "HANDOVER", pct: 100 - depositPct - 50, due: "HANDOVER" },
    ];
    const code = `KTR-${++contractSeq}`;
    const contract = await db.contract.create({
      data: {
        id: opts.contractId,
        code,
        unitId: unit.id, buyerId: buyer.id, priceEur: unit.priceEur, depositPct,
        planJson: JSON.stringify(plan),
        cadastreRef: `ASHK/${project.municipality.slice(0, 2).toUpperCase()}/${signed.getFullYear()}/${8000 + contractSeq}`,
        cadastreDate: new Date(signed.getTime() + 6 * 864e5),
        status: project.status === "DELIVERED" ? "COMPLETED" : "REGISTERED",
        signedAt: signed,
      },
    });
    await db.unit.update({ where: { id: unit.id }, data: { status: project.status === "DELIVERED" ? "DELIVERED" : "SOLD" } });

    const deposit = Math.round((unit.priceEur * depositPct) / 100);
    await db.payment.create({
      data: { contractId: contract.id, amountEur: deposit, paidAt: new Date(signed.getTime() + 3 * 864e5), method: "BANK_TRANSFER", reference: `TRF-${++paymentSeq}`, reconciled: true, kind: "DEPOSIT" },
    });
    const extraTranches = project.progressPct >= 45 ? 2 : project.progressPct >= 25 ? 1 : 0;
    for (let k = 0; k < extraTranches; k++) {
      const amt = Math.round((unit.priceEur * 25) / 100);
      await db.payment.create({
        data: { contractId: contract.id, amountEur: amt, paidAt: new Date(signed.getTime() + (60 + k * 150) * 864e5), method: "BANK_TRANSFER", reference: `TRF-${++paymentSeq}`, reconciled: true, kind: "INSTALMENT" },
      });
    }

    await db.attachment.create({
      data: {
        projectId: project.id, contractId: contract.id, kind: "OTHER",
        title: "Kontratë paraprake e shitjes", filename: `kontrata-${contract.code}.pdf`,
        mime: "application/pdf", sizeKb: 210 + Math.floor(rnd() * 400), generated: true,
        uploadedByRole: "DEVELOPER", uploadedByName: devName, hash: fp(`KTR-${contract.code}`), createdAt: signed,
      },
    });
    await db.attachment.create({
      data: {
        projectId: project.id, contractId: contract.id, kind: "CADASTRE",
        title: "Vërtetim i regjistrimit kadastral", filename: `kadastra-${contract.code}.pdf`,
        mime: "application/pdf", sizeKb: 120 + Math.floor(rnd() * 200), generated: true,
        uploadedByRole: "AGENCY", uploadedByName: "ASHK — Agjencia Shtetërore e Kadastrës",
        hash: fp(`ASHK-${contract.code}`), createdAt: new Date(signed.getTime() + 6 * 864e5),
      },
    });
    log("DEVELOPER", devName, "CONTRACT_REGISTERED", "Contract", contract.code, `${unit.label} → ${buyer.name}, ${unit.priceEur.toLocaleString("it-IT")} €`, signed);

    // ricalcola gli aggregati del conto vincolato includendo il nuovo contratto
    const allPayments = await db.payment.findMany({ where: { contract: { unit: { projectId: project.id } } } });
    const collected = allPayments.reduce((s, x) => s + x.amountEur, 0);
    const released = Math.round((collected * project.progressPct) / 100);
    await db.escrowAccount.update({ where: { projectId: project.id }, data: { collectedEur: collected, releasedEur: released } });
  }

  // Arta Ndreu: una seconda proprieta' nel cantiere fermo di Shkodra.
  await addCitizenDossier({
    projectSlug: "shkodra-green-park",
    contractId: "contract-demo-2",
    buyerId: "buyer-demo",
    buyerName: "Arta Ndreu", idNumber: "", phone: "", email: "",
    signedAt: "2024-12-02",
  });

  // Blerina Hoxha: una proprieta' a Durres, cantiere in corso.
  await addCitizenDossier({
    projectSlug: "durres-marina",
    contractId: "contract-citizen-2",
    buyerId: "citizen-2",
    buyerName: "Blerina Hoxha", idNumber: "J85234671K",
    phone: "+355 68 341 2290", email: "blerina.hoxha@example.al",
    signedAt: "2025-08-01",
  });

  // Fatmir Krasniqi: una proprieta' a Vlore, il cantiere piu' avanzato.
  await addCitizenDossier({
    projectSlug: "vlora-bay-towers",
    contractId: "contract-citizen-3",
    buyerId: "citizen-3",
    buyerName: "Fatmir Krasniqi", idNumber: "J91456203M",
    phone: "+355 69 512 8834", email: "fatmir.krasniqi@example.al",
    signedAt: "2024-09-01",
  });

  // ispezione a campione storica su un certificatore gia' segnalato
  const sokol = certs[4];
  const riverside = await db.project.findFirst({ where: { name: "Tirana Riverside" } });
  await db.inspection.create({
    data: {
      projectId: riverside!.id, certifierId: sokol.id, type: "SAMPLE_RECHECK", outcome: "DEVIATION",
      notes: "Rikontroll me short: trashësia e shtresës mbrojtëse e betonit nën vlerën e deklaruar në 2 nga 6 pika. Mospërputhje e regjistruar në dosjen e certifikuesit.",
      inspector: "Insp. Merita Zeka", performedAt: d("2026-05-21"),
    },
  });
  log("AGENCY", "Insp. Merita Zeka", "SAMPLE_RECHECK", "Certifier", sokol.registryNo, "Mospërputhje e konstatuar në rikontroll me short", d("2026-05-21"));

  // ----------------------------------------------- INDICE PREZZI PER ZONA
  // Otto trimestri per ciascuna zona urbana: alimenta il grafico "andamento dei
  // prezzi" nella scheda di zona (Fase D) e, in seguito, l'indice prezzi pubblico.
  // Dati sintetici e deterministici: i contratti reali non coprono in modo denso
  // gli ultimi otto trimestri per ogni zona, e qui serve una serie sempre completa.
  const QUARTERS = ["2024-Q4", "2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4", "2026-Q1", "2026-Q2", "2026-Q3"];
  const zoneBase = new Map<string, { municipality: string; base: number }>();
  for (const p of projs) {
    if (!p.zone) continue;
    const mid = Math.round((p.pricePerSqm[0] + p.pricePerSqm[1]) / 2);
    const prev = zoneBase.get(p.zone);
    zoneBase.set(p.zone, { municipality: p.municipality, base: prev ? Math.round((prev.base + mid) / 2) : mid });
  }
  for (const [zone, info] of zoneBase) {
    // parte qualche punto percentuale sotto il prezzo attuale e cresce trimestre su trimestre.
    let price = Math.round(info.base * 0.91);
    for (let qi = 0; qi < QUARTERS.length; qi++) {
      price = Math.round(price * (1 + 0.008 + rnd() * 0.012));
      const transactions = 3 + Math.floor(rnd() * 9);
      await db.zonePriceStat.create({
        data: { zone, municipality: info.municipality, quarter: QUARTERS[qi], avgPricePerSqm: price, transactions },
      });
    }
  }


  await db.demoState.create({ data: { id: "seededAt", value: new Date().toISOString() } });
  await db.demoState.create({ data: { id: "version", value: "1.0" } });

  audit.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (const a of audit) await db.auditLog.create({ data: a });

  const counts = {
    zhvillues: await db.developer.count(),
    projekte: await db.project.count(),
    njesi: await db.unit.count(),
    kontrata: await db.contract.count(),
    pagesa: await db.payment.count(),
    certifikues: await db.certifier.count(),
    milestone: await db.milestone.count(),
    shlyerje: await db.releaseRequest.count(),
    audit: await db.auditLog.count(),
    dokumente: await db.attachment.count(),
  };
  return counts;
}
