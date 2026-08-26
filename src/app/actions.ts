"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";


function shortHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, "0").toUpperCase();
}

export async function logAction(action: string, entity: string, entityRef: string, detail: string) {
  const { role, identity } = await getSession();
  await db.auditLog.create({
    data: { actorRole: role, actorName: identity.name, action, entity, entityRef, detail },
  });
}

export type ActionResult = { ok: boolean; message?: string; id?: string };

export async function uploadAttachment(formData: FormData): Promise<ActionResult> {
  const { role, t, identity } = await getSession();
  const file = formData.get("file") as File | null;
  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "") || null;
  const kind = String(formData.get("kind") ?? "OTHER");
  const title = String(formData.get("title") ?? "").trim();

  if (!file || file.size === 0) return { ok: false, message: t.form.required };
  if (file.size > 8 * 1024 * 1024) return { ok: false, message: t.attach.tooBig };

  const bytes = Buffer.from(await file.arrayBuffer());
  const created = await db.attachment.create({
    data: {
      projectId: projectId || null,
      milestoneId,
      kind,
      title: title || file.name,
      filename: file.name,
      mime: file.type || "application/octet-stream",
      sizeKb: Math.max(1, Math.round(file.size / 1024)),
      data: bytes,
      uploadedByRole: role,
      uploadedByName: identity.name,
      hash: shortHash(file.name + file.size + Date.now()),
    },
  });

  await logAction("ATTACHMENT_UPLOADED", "Attachment", created.title, `${file.name} · ${Math.round(file.size / 1024)} KB`);
  revalidatePath("/", "layout");
  return { ok: true, message: t.attach.ok, id: created.id };
}

// ---------------------------------------------------------------- PROGETTI

const CODE_PREFIX: Record<string, string> = {
  "Tiranë": "TR", "Durrës": "DR", "Vlorë": "VL", "Shkodër": "SH", "Elbasan": "EL", "Fier": "FR",
};

/** Scenario 1a — lo sviluppatore deposita il progetto. Nasce in bozza: non vendibile. */
export async function createProject(formData: FormData): Promise<ActionResult> {
  const { role, t, identity } = await getSession();
  if (role !== "DEVELOPER") return { ok: false, message: t.common.noAccess };

  const name = String(formData.get("name") ?? "").trim();
  const municipality = String(formData.get("municipality") ?? "Tiranë");
  const address = String(formData.get("address") ?? "").trim();
  const permitNo = String(formData.get("permitNo") ?? "").trim();
  const permitDate = new Date(String(formData.get("permitDate") || "2026-06-01"));
  const unitsCount = Math.max(1, Math.min(200, Number(formData.get("unitsCount") ?? 12)));
  const avgArea = Math.max(25, Math.min(300, Number(formData.get("avgArea") ?? 78)));
  const pricePerSqm = Math.max(300, Math.min(5000, Number(formData.get("pricePerSqm") ?? 1400)));
  const expected = new Date(String(formData.get("expected") || "2029-06-30"));
  const bankId = String(formData.get("bankId") ?? "");

  if (!name || !address || !permitNo || !bankId) return { ok: false, message: t.form.required };

  const project = await db.project.create({
    data: {
      name, municipality, address,
      developerId: identity.id,
      permitNo, permitDate,
      unitsCount, status: "DRAFT", progressPct: 0,
      expectedDelivery: expected,
      lastSiteActivity: new Date(),
    },
  });

  const TY = [
    { t: "1+1", f: 0.72 }, { t: "2+1", f: 1.0 }, { t: "3+1", f: 1.34 },
  ];
  for (let i = 0; i < unitsCount; i++) {
    const ty = TY[i % 3];
    const area = Math.round(avgArea * ty.f);
    const half = Math.ceil(unitsCount / 2);
    const blk = i < half ? "A" : "B";
    const idxInBlk = i < half ? i : i - half;
    const floor = 1 + Math.floor(idxInBlk / 3);
    await db.unit.create({
      data: {
        projectId: project.id,
        label: `${blk}-${floor}-${(idxInBlk % 3) + 1}`,
        floor, areaSqm: area,
        priceEur: Math.round((area * (pricePerSqm + floor * 6)) / 100) * 100,
        typology: ty.t, status: "FREE",
      },
    });
  }

  // Certificatori assegnati dal sistema, mai scelti dallo sviluppatore.
  const pool = await db.certifier.findMany({ where: { state: "ACTIVE" }, orderBy: { registryNo: "asc" } });
  const { MILESTONE_LADDER } = await import("@/lib/constants");
  for (let i = 0; i < MILESTONE_LADDER.length; i++) {
    const m = MILESTONE_LADDER[i];
    await db.milestone.create({
      data: {
        projectId: project.id, type: m.type, orderIndex: m.orderIndex,
        cumulativePct: m.cumulativePct, status: "PENDING",
        certifierId: pool.length ? pool[(project.id.charCodeAt(4) + i) % pool.length].id : null,
      },
    });
  }

  await db.escrowAccount.create({
    data: {
      projectId: project.id, bankId,
      iban: `AL${40 + (project.id.charCodeAt(5) % 50)}208110080000${String(100000 + (project.id.charCodeAt(6) * 371) % 899999)}`,
      active: false,
    },
  });

  // allegati depositati insieme alla domanda
  for (const field of ["permitFile", "scheduleFile"] as const) {
    const f = formData.get(field) as File | null;
    if (f && f.size > 0 && f.size <= 8 * 1024 * 1024) {
      await db.attachment.create({
        data: {
          projectId: project.id,
          kind: field === "permitFile" ? "PERMIT" : "SCHEDULE",
          title: field === "permitFile" ? t.attach.PERMIT : t.attach.SCHEDULE,
          filename: f.name, mime: f.type || "application/pdf",
          sizeKb: Math.max(1, Math.round(f.size / 1024)),
          data: Buffer.from(await f.arrayBuffer()),
          uploadedByRole: "DEVELOPER", uploadedByName: identity.name,
          hash: shortHash(f.name + f.size),
        },
      });
    }
  }

  await logAction("PROJECT_SUBMITTED", "Project", name, `${permitNo} · ${unitsCount} ${t.common.units}`);
  revalidatePath("/", "layout");
  return { ok: true, id: project.id };
}

export type Check = { key: string; ok: boolean; detail: string };

/** Controlli di conformita' mostrati a schermo prima della registrazione. */
export async function conformityChecks(projectId: string): Promise<Check[]> {
  const p = await db.project.findUnique({
    where: { id: projectId },
    include: { developer: true, escrow: true, units: true, attachments: true },
  });
  if (!p) return [];
  return [
    { key: "licence", ok: p.developer.licenseState === "ACTIVE", detail: p.developer.name },
    { key: "permit", ok: !!p.permitNo, detail: p.permitNo },
    { key: "units", ok: p.units.length > 0, detail: String(p.units.length) },
    { key: "escrow", ok: !!p.escrow, detail: p.escrow?.iban ?? "—" },
    { key: "schedule", ok: p.expectedDelivery > p.permitDate, detail: p.expectedDelivery.toLocaleDateString("it-IT") },
  ];
}

/** Scenario 1b — registrazione: codice pubblico e conto vincolato attivo. */
export async function registerProject(projectId: string): Promise<ActionResult> {
  const { t } = await getSession();
  const checks = await conformityChecks(projectId);
  const p = await db.project.findUnique({ where: { id: projectId }, include: { developer: true } });
  if (!p) return { ok: false, message: t.form.error };

  const failed = checks.filter((c) => !c.ok);
  if (failed.length > 0) {
    const reason = failed.map((c) => c.key).join(", ");
    await db.project.update({ where: { id: projectId }, data: { status: "REJECTED", rejectionReason: reason } });
    await logAction("PROJECT_REJECTED", "Project", p.name, reason);
    revalidatePath("/", "layout");
    return { ok: false, message: reason };
  }

  const year = new Date().getFullYear();
  const prefix = CODE_PREFIX[p.municipality] ?? "AL";
  const n = await db.project.count({ where: { publicCode: { not: null } } });
  const publicCode = `PRONA-${prefix}-${year}-${String(n + 1).padStart(4, "0")}`;

  await db.project.update({
    where: { id: projectId },
    data: { publicCode, status: "REGISTERED", registeredAt: new Date() },
  });
  await db.escrowAccount.update({ where: { projectId }, data: { active: true, openedAt: new Date() } });

  await logAction("PROJECT_REGISTERED", "Project", p.name, `${publicCode}`);
  await logAction("ESCROW_OPENED", "EscrowAccount", publicCode, t.escrow.active);
  revalidatePath("/", "layout");
  return { ok: true, message: publicCode };
}

// ------------------------------------------------------------ VENDITE E INCASSI

/** Scenario 1c, con i blocchi degli scenari 2 e 3. */
export async function registerSale(formData: FormData): Promise<ActionResult & { blockedBy?: any }> {
  const { role, t } = await getSession();
  if (role !== "DEVELOPER") return { ok: false, message: t.common.noAccess };

  const unitId = String(formData.get("unitId") ?? "");
  const buyerName = String(formData.get("buyerName") ?? "").trim();
  const buyerId = String(formData.get("buyerId") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const priceEur = Math.round(Number(formData.get("priceEur") ?? 0));
  const depositPct = Math.max(5, Math.min(50, Number(formData.get("depositPct") ?? 25)));

  if (!unitId || !buyerName || !buyerId || priceEur <= 0) return { ok: false, message: t.form.required };

  const unit = await db.unit.findUnique({
    where: { id: unitId },
    include: { project: true, contract: { include: { buyer: true } } },
  });
  if (!unit) return { ok: false, message: t.form.error };

  // Scenario 3 — nessuna vendita prima della registrazione.
  if (!unit.project.publicCode || unit.project.status === "DRAFT" || unit.project.status === "REJECTED") {
    await logAction("SALE_BLOCKED", "Project", unit.project.name, "Projekti nuk është i regjistruar");
    return { ok: false, message: "NOT_REGISTERED" };
  }

  // Scenario 2 — doppia vendita.
  if (unit.contract) {
    await logAction("SALE_BLOCKED", "Unit", unit.label, `Njësi e angazhuar tashmë · ${unit.contract.code}`);
    return {
      ok: false,
      message: "ALREADY_SOLD",
      blockedBy: {
        code: unit.contract.code,
        buyer: unit.contract.buyer.name,
        signedAt: unit.contract.signedAt.toISOString(),
        cadastreRef: unit.contract.cadastreRef,
      },
    };
  }

  const buyer = await db.buyer.create({
    data: { name: buyerName, idNumber: buyerId + "-" + Date.now().toString(36).slice(-4), phone, email, city: unit.project.municipality },
  });

  const n = await db.contract.count();
  const now = new Date();
  const plan = [
    { key: "DEPOSIT", pct: depositPct, due: "SIGN" },
    { key: "FOUNDATION", pct: 25, due: "M25" },
    { key: "STRUCTURE", pct: 25, due: "M45" },
    { key: "HANDOVER", pct: 100 - depositPct - 50, due: "HANDOVER" },
  ];

  const contract = await db.contract.create({
    data: {
      code: `KTR-${2000 + n}`,
      unitId: unit.id, buyerId: buyer.id, priceEur, depositPct,
      planJson: JSON.stringify(plan),
      cadastreRef: `ASHK/${(unit.project.municipality || "AL").slice(0, 2).toUpperCase()}/${now.getFullYear()}/${9000 + n}`,
      cadastreDate: now,
      status: "REGISTERED",
      signedAt: now,
    },
  });
  await db.unit.update({ where: { id: unit.id }, data: { status: "SOLD" } });

  await logAction("CONTRACT_REGISTERED", "Contract", contract.code, `${unit.label} → ${buyerName}`);
  await logAction("CADASTRE_SUBMITTED", "Contract", contract.code, contract.cadastreRef!);
  revalidatePath("/", "layout");
  return { ok: true, message: contract.code, id: contract.id };
}

/** Scenario 1d — incasso sul conto vincolato, riconciliato con l'unita'. */
export async function registerPayment(formData: FormData): Promise<ActionResult> {
  const { role, t } = await getSession();
  if (role !== "DEVELOPER" && role !== "BANK") return { ok: false, message: t.common.noAccess };

  const contractId = String(formData.get("contractId") ?? "");
  const amount = Math.round(Number(formData.get("amount") ?? 0));
  const reference = String(formData.get("reference") ?? "").trim() || `TRF-${Date.now().toString().slice(-8)}`;

  if (!contractId || amount <= 0) return { ok: false, message: t.form.required };

  const contract = await db.contract.findUnique({
    where: { id: contractId },
    include: { unit: { include: { project: { include: { escrow: true } } } }, payments: true },
  });
  if (!contract) return { ok: false, message: t.form.error };

  const project = contract.unit.project;
  // Scenario 3 — nullita' a tutela dell'acquirente.
  if (!project.publicCode || !project.escrow?.active) {
    await logAction("PAYMENT_BLOCKED", "Project", project.name, "Llogaria e kushtëzuar nuk është aktive");
    return { ok: false, message: "ESCROW_NOT_ACTIVE" };
  }

  const already = contract.payments.reduce((s, p) => s + p.amountEur, 0);
  const kind = already === 0 ? "DEPOSIT" : already + amount >= contract.priceEur ? "BALANCE" : "INSTALMENT";

  await db.payment.create({
    data: { contractId, amountEur: amount, paidAt: new Date(), method: "BANK_TRANSFER", reference, reconciled: true, kind },
  });
  await db.escrowAccount.update({ where: { projectId: project.id }, data: { collectedEur: { increment: amount } } });

  await logAction("PAYMENT_RECEIVED", "Payment", reference, `${amount.toLocaleString("it-IT")} € · ${contract.unit.label} · ${contract.code}`);
  revalidatePath("/", "layout");
  return { ok: true, message: reference };
}

// ------------------------------------------------ VERIFICA, AUTORIZZAZIONE, ESECUZIONE

/** Scenario 1e — il certificatore firma la verifica di campo e apre la richiesta di svincolo. */
export async function certifyMilestone(formData: FormData): Promise<ActionResult> {
  const { role, t } = await getSession();
  if (role !== "CERTIFIER") return { ok: false, message: t.common.noAccess };

  const milestoneId = String(formData.get("milestoneId") ?? "");
  const outcome = String(formData.get("outcome") ?? "PASS") === "FAIL" ? "FAIL" : "PASS";
  const notes = String(formData.get("notes") ?? "").trim();
  const checklist = JSON.parse(String(formData.get("checklist") ?? "[]"));
  const photos = JSON.parse(String(formData.get("photos") ?? "[]"));

  if (!milestoneId) return { ok: false, message: t.form.error };
  if (!Array.isArray(photos) || photos.length < 3) return { ok: false, message: t.field.needPhotos };

  const ms = await db.milestone.findUnique({
    where: { id: milestoneId },
    include: { certifier: true, project: { include: { escrow: true, milestones: true } } },
  });
  if (!ms) return { ok: false, message: t.form.error };

  const now = new Date();
  await db.milestone.update({
    where: { id: milestoneId },
    data: {
      status: outcome === "PASS" ? "CERTIFIED" : "REJECTED",
      outcome,
      verifiedAt: now,
      checklistJson: JSON.stringify(checklist),
      photosJson: JSON.stringify(photos),
      notes: notes || null,
    },
  });
  await db.certifier.update({ where: { id: ms.certifierId! }, data: { checksDone: { increment: 1 } } });
  await db.project.update({ where: { id: ms.projectId }, data: { lastSiteActivity: now } });

  await logAction(
    outcome === "PASS" ? "MILESTONE_CERTIFIED" : "MILESTONE_REJECTED",
    "Milestone",
    `${ms.project.name} · ${(t.milestone as any)[ms.type]}`,
    `${ms.cumulativePct}% — ${(t.milestone as any)[outcome]} · ${photos.length} ${t.photos.title.toLowerCase()}`
  );

  if (outcome === "FAIL") {
    revalidatePath("/", "layout");
    return { ok: true, message: t.field.signed };
  }

  // importo svincolabile: la differenza fra il gradino raggiunto e quello gia' liberato
  const prev = ms.project.milestones
    .filter((m) => m.status === "CERTIFIED" && m.cumulativePct < ms.cumulativePct)
    .reduce((max, m) => Math.max(max, m.cumulativePct), 0);
  const collected = ms.project.escrow?.collectedEur ?? 0;
  const amount = Math.round((collected * (ms.cumulativePct - prev)) / 100);

  const n = await db.releaseRequest.count();
  await db.releaseRequest.create({
    data: {
      code: `SHL-${9000 + n}`,
      milestoneId: ms.id,
      escrowId: ms.project.escrow!.id,
      amountEur: amount,
      status: "REQUESTED",
      requestedAt: now,
    },
  });
  await logAction("RELEASE_REQUESTED", "ReleaseRequest", `SHL-${9000 + n}`, `${amount.toLocaleString("it-IT")} € · ${ms.project.name}`);

  revalidatePath("/", "layout");
  return { ok: true, message: t.field.signed };
}

/** Scenario 1f, primo tempo — l'Agenzia autorizza. Qui la barra di avanzamento cresce. */
export async function approveRelease(id: string): Promise<ActionResult> {
  const { role, t } = await getSession();
  if (role !== "AGENCY") return { ok: false, message: t.common.noAccess };

  const r = await db.releaseRequest.findUnique({
    where: { id },
    include: { milestone: { include: { project: true } }, escrow: true },
  });
  if (!r || r.status !== "REQUESTED") return { ok: false, message: t.form.error };
  if (r.escrow.frozen) return { ok: false, message: "FROZEN" };

  await db.releaseRequest.update({
    where: { id },
    data: { status: "AGENCY_APPROVED", approvedBy: "Agjencia PRONA — Zyra e Mbikëqyrjes", approvedAt: new Date() },
  });
  await db.project.update({
    where: { id: r.milestone.projectId },
    data: {
      progressPct: r.milestone.cumulativePct,
      status: r.milestone.cumulativePct >= 95 ? "DELIVERED" : "BUILDING",
    },
  });

  await logAction("RELEASE_APPROVED", "ReleaseRequest", r.code, `${r.amountEur.toLocaleString("it-IT")} € · ${r.milestone.project.name}`);
  revalidatePath("/", "layout");
  return { ok: true, message: t.agency.approved };
}

export async function rejectRelease(id: string, reason: string): Promise<ActionResult> {
  const { role, t } = await getSession();
  if (role !== "AGENCY") return { ok: false, message: t.common.noAccess };
  const r = await db.releaseRequest.findUnique({ where: { id }, include: { milestone: true } });
  if (!r) return { ok: false, message: t.form.error };
  await db.releaseRequest.update({ where: { id }, data: { status: "REJECTED", blockReason: reason } });
  await logAction("RELEASE_REJECTED", "ReleaseRequest", r.code, reason);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Scenario 1f, secondo tempo — la banca esegue e il saldo si muove. */
export async function executeRelease(id: string): Promise<ActionResult> {
  const { role, t } = await getSession();
  if (role !== "BANK") return { ok: false, message: t.common.noAccess };

  const r = await db.releaseRequest.findUnique({
    where: { id },
    include: { escrow: true, milestone: { include: { project: true } } },
  });
  if (!r || r.status !== "AGENCY_APPROVED") return { ok: false, message: t.form.error };
  if (r.escrow.frozen) return { ok: false, message: "FROZEN" };

  await db.releaseRequest.update({ where: { id }, data: { status: "EXECUTED", executedAt: new Date() } });
  await db.escrowAccount.update({ where: { id: r.escrowId }, data: { releasedEur: { increment: r.amountEur } } });

  await logAction("RELEASE_EXECUTED", "ReleaseRequest", r.code, `${r.amountEur.toLocaleString("it-IT")} € · ${r.milestone.project.name}`);
  revalidatePath("/", "layout");
  return { ok: true, message: t.bank.executed };
}

/** Fundi i ciklit: dorëzimi i njësisë te blerësi, pasi projekti është dorëzuar. */
export async function handoverUnit(unitId: string): Promise<ActionResult> {
  const { role, t } = await getSession();
  if (role !== "DEVELOPER") return { ok: false, message: t.common.noAccess };

  const unit = await db.unit.findUnique({
    where: { id: unitId },
    include: { project: true, contract: true },
  });
  if (!unit || !unit.contract) return { ok: false, message: t.form.error };
  if (unit.project.status !== "DELIVERED") return { ok: false, message: "NOT_DELIVERED" };
  if (unit.contract.status === "COMPLETED") return { ok: false, message: t.form.error };

  const now = new Date();
  await db.contract.update({ where: { id: unit.contract.id }, data: { status: "COMPLETED" } });
  await db.unit.update({ where: { id: unit.id }, data: { status: "DELIVERED" } });

  await logAction("UNIT_HANDED_OVER", "Contract", unit.contract.code, `${unit.label} · ${unit.project.name}`);
  revalidatePath("/", "layout");
  return { ok: true, message: now.toISOString() };
}

// ----------------------------------------------------- SCENARIO 4: CANTIERE FERMO

/** L'Agenzia congela gli svincoli: i fondi restano dove sono, a tutela degli acquirenti. */
export async function freezeProject(projectId: string, reason: string): Promise<ActionResult> {
  const { role, t } = await getSession();
  if (role !== "AGENCY") return { ok: false, message: t.common.noAccess };

  const p = await db.project.findUnique({ where: { id: projectId }, include: { escrow: true } });
  if (!p?.escrow) return { ok: false, message: t.form.error };

  await db.escrowAccount.update({ where: { id: p.escrow.id }, data: { frozen: true } });
  await db.project.update({ where: { id: projectId }, data: { status: "FROZEN", frozenReason: reason } });
  // le richieste ancora in corsa si fermano subito
  await db.releaseRequest.updateMany({
    where: { escrowId: p.escrow.id, status: { in: ["REQUESTED", "AGENCY_APPROVED"] } },
    data: { status: "BLOCKED", blockReason: reason },
  });

  await logAction("PROJECT_FROZEN", "Project", p.name, reason);
  revalidatePath("/", "layout");
  return { ok: true, message: t.frozen.done };
}

export async function unfreezeProject(projectId: string): Promise<ActionResult> {
  const { role, t } = await getSession();
  if (role !== "AGENCY") return { ok: false, message: t.common.noAccess };

  const p = await db.project.findUnique({ where: { id: projectId }, include: { escrow: true } });
  if (!p?.escrow) return { ok: false, message: t.form.error };

  await db.escrowAccount.update({ where: { id: p.escrow.id }, data: { frozen: false } });
  await db.project.update({ where: { id: projectId }, data: { status: "STALLED", frozenReason: null } });
  await logAction("PROJECT_UNFROZEN", "Project", p.name, t.frozen.undone);
  revalidatePath("/", "layout");
  return { ok: true, message: t.frozen.undone };
}

// ------------------------------------------- SCENARIO 5: CONTROLLO DEL CONTROLLORE

/** Ripetizione a campione di una verifica gia' certificata. */
export async function sampleRecheck(formData: FormData): Promise<ActionResult> {
  const { role, t } = await getSession();
  if (role !== "AGENCY") return { ok: false, message: t.common.noAccess };

  const milestoneId = String(formData.get("milestoneId") ?? "");
  const outcome = String(formData.get("outcome") ?? "PASS") === "DEVIATION" ? "DEVIATION" : "PASS";
  const notes = String(formData.get("notes") ?? "").trim();
  const failedPoints: string[] = JSON.parse(String(formData.get("failed") ?? "[]"));
  const inspector = "Insp. Merita Zeka";

  const ms = await db.milestone.findUnique({
    where: { id: milestoneId },
    include: { project: true, certifier: true, release: true },
  });
  if (!ms || !ms.certifier) return { ok: false, message: t.form.error };

  const detail =
    outcome === "DEVIATION"
      ? `${failedPoints.length ? failedPoints.join("; ") + ". " : ""}${notes}`.trim() || t.recheck.DEVIATION
      : notes || t.recheck.PASS;

  await db.inspection.create({
    data: {
      projectId: ms.projectId,
      certifierId: ms.certifierId,
      type: "SAMPLE_RECHECK",
      outcome: outcome === "DEVIATION" ? "DEVIATION" : "PASS",
      notes: detail,
      inspector,
      performedAt: new Date(),
    },
  });

  if (outcome === "PASS") {
    await logAction("SAMPLE_RECHECK", "Certifier", ms.certifier.registryNo, `${ms.project.name} · ${(t.milestone as any)[ms.type]} — ${t.milestone.PASS}`);
    revalidatePath("/", "layout");
    return { ok: true, message: t.recheck.donePass };
  }

  // La difformita' colpisce il certificatore, non solo il cantiere.
  await db.certifier.update({
    where: { id: ms.certifierId! },
    data: { deviationsFound: { increment: 1 }, state: "SUSPENDED" },
  });
  await db.milestone.update({ where: { id: milestoneId }, data: { status: "REVOKED", outcome: "FAIL" } });

  // Le verifiche ancora aperte del sospeso passano a un altro ingegnere.
  const replacement = await db.certifier.findFirst({
    where: { state: "ACTIVE", id: { not: ms.certifierId! } },
    orderBy: { deviationsFound: "asc" },
  });
  let reassigned = 0;
  if (replacement) {
    const r = await db.milestone.updateMany({
      where: { certifierId: ms.certifierId!, status: { in: ["READY", "UNDER_REVIEW", "PENDING"] } },
      data: { certifierId: replacement.id },
    });
    reassigned = r.count;
  }

  // Uno svincolo non ancora eseguito su quella fase si blocca.
  if (ms.release && ms.release.status !== "EXECUTED") {
    await db.releaseRequest.update({
      where: { id: ms.release.id },
      data: { status: "BLOCKED", blockReason: t.recheck.DEVIATION },
    });
  }

  await logAction("SAMPLE_RECHECK", "Certifier", ms.certifier.registryNo, `${ms.project.name} · ${(t.milestone as any)[ms.type]} — ${t.milestone.FAIL}`);
  await logAction("CERTIFIER_SUSPENDED", "Certifier", ms.certifier.registryNo, ms.certifier.name);
  if (reassigned > 0) await logAction("MILESTONES_REASSIGNED", "Certifier", ms.certifier.registryNo, `${reassigned} → ${replacement!.name}`);

  revalidatePath("/", "layout");
  return { ok: true, message: t.recheck.doneDeviation, id: String(reassigned) };
}

/** Azzeramento dal browser: serve in sala, se qualcosa va storto a meta' dimostrazione. */
export async function resetDemo(): Promise<ActionResult> {
  const { t } = await getSession();
  const { seedDatabase } = await import("@/lib/seed");
  await seedDatabase();
  revalidatePath("/", "layout");
  return { ok: true, message: t.reset.done };
}

// ---------------------------------------------------------- IDENTITA' E ACCESSO

/** Schermata di accesso: sceglie un soggetto da un elenco o da un identificativo digitato. */
export async function chooseIdentity(formData: FormData): Promise<void> {
  const { cookies } = await import("next/headers");
  const { redirect } = await import("next/navigation");
  const { findIdentityByCode } = await import("@/lib/identity");
  const { ROLES } = await import("@/lib/constants");

  const roleRaw = String(formData.get("role") ?? "");
  const role = (ROLES as readonly string[]).includes(roleRaw) ? (roleRaw as (typeof ROLES)[number]) : "AGENCY";
  const id = String(formData.get("id") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  const c = await cookies();
  c.set("prona_role", role, { path: "/", maxAge: 31536000 });

  if (id) {
    c.set("prona_identity", id, { path: "/", maxAge: 31536000 });
    redirect("/");
  }

  if (code) {
    const found = await findIdentityByCode(role, code);
    if (!found) redirect(`/hyrje?role=${role}&error=1`);
    c.set("prona_identity", found!.id, { path: "/", maxAge: 31536000 });
    redirect("/");
  }

  c.delete("prona_identity");
  redirect("/");
}
