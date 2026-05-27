"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from "recharts";
import {
  Plus,
  Minus,
  X,
  Settings2,
  AlertTriangle,
  Clock,
  Trash2,
  Search,
  ChevronDown,
  Check,
  Info,
  RotateCcw,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   Carb absorption profiles & food database
   ────────────────────────────────────────────────────────────── */

const CARB_PROFILES = {
  normal:   { peakMin: 60,  duration: 150, sigmaUp: 30, sigmaDown: 55 },
  highfat:  { peakMin: 105, duration: 240, sigmaUp: 50, sigmaDown: 80 },
  veryhigh: { peakMin: 70,  duration: 180, sigmaUp: 35, sigmaDown: 65 },
  mixed:    { peakMin: 80,  duration: 200, sigmaUp: 40, sigmaDown: 70 },
};

const PROFILE_OPTIONS = [
  { id: "normal",   label: "Normal",         hint: "Peak ~60 min" },
  { id: "highfat",  label: "High fat",       hint: "Peak ~105 min" },
  { id: "veryhigh", label: "Very high carb", hint: "Peak ~70 min" },
  { id: "mixed",    label: "Mixed plate",    hint: "Peak ~80 min" },
];

const STRATEGY_TEXT = {
  "single":      "Single dose works for normal meals. Pre-bolus gives insulin a head start on the carbs.",
  "split-fat":   "Fat delays carb absorption — back half hits later. Second dose at +90 catches the tail.",
  "split-vh":    "Very high carb load. Splitting prevents stacking and a 2-hour crash.",
  "split-mixed": "Multiple items, multiple absorption speeds. Stagger to ride the curve.",
};

const EGYPTIAN_FOODS = [
  // MAINS
  { id: 1,  name: "Koshari (full plate)",      carbs: 120, cat: "main",    note: "rice + pasta + lentils" },
  { id: 2,  name: "Koshari (small plate)",     carbs: 70,  cat: "main",    note: "half portion" },
  { id: 3,  name: "Macaroni Béchamel",         carbs: 60,  cat: "main",    note: "1 portion" },
  { id: 4,  name: "Molokhia + rice + chicken", carbs: 50,  cat: "main",    note: "carbs from rice" },
  { id: 5,  name: "Mahshi (mixed, 8 pcs)",     carbs: 55,  cat: "main",    note: "rice-stuffed" },
  { id: 6,  name: "Fattah",                    carbs: 70,  cat: "main",    note: "rice + bread + meat" },
  { id: 7,  name: "Kebab + rice plate",        carbs: 55,  cat: "main",    note: "1 cup rice + sides" },
  { id: 8,  name: "Stuffed pigeon + freekeh",  carbs: 45,  cat: "main",    note: "1 bird + grains" },
  { id: 9,  name: "White rice (1 cup)",        carbs: 45,  cat: "main",    note: "cooked" },
  { id: 10, name: "Pasta (1 cup)",             carbs: 45,  cat: "main",    note: "cooked" },
  // STREET FOOD
  { id: 20, name: "Ful sandwich",              carbs: 45,  cat: "street",  note: "ful in eish baladi" },
  { id: 21, name: "Ta'ameya sandwich",         carbs: 50,  cat: "street",  note: "falafel + bread" },
  { id: 22, name: "Hawawshi",                  carbs: 40,  cat: "street",  note: "1 piece" },
  { id: 23, name: "Shawarma sandwich",         carbs: 50,  cat: "street",  note: "1 sandwich" },
  { id: 24, name: "Feteer (sweet)",            carbs: 75,  cat: "street",  note: "1/4 piece w/ honey" },
  { id: 25, name: "Feteer (savory)",           carbs: 50,  cat: "street",  note: "1/4 piece, meshaltet" },
  // BREAD
  { id: 30, name: "Eish baladi (1 loaf)",      carbs: 35,  cat: "bread",   note: "~80g loaf" },
  { id: 31, name: "Eish shami (1)",            carbs: 30,  cat: "bread",   note: "pita" },
  { id: 32, name: "Aish shamsi",               carbs: 35,  cat: "bread",   note: "sun-baked" },
  { id: 33, name: "Eish feno",                 carbs: 28,  cat: "bread",   note: "small white roll" },
  // SIDES
  { id: 40, name: "Ful medames (1 cup)",       carbs: 30,  cat: "side",    note: "fava beans" },
  { id: 41, name: "Ta'ameya (5 pcs)",          carbs: 25,  cat: "side",    note: "fava falafel" },
  { id: 42, name: "Hummus (1 cup)",            carbs: 35,  cat: "side",    note: "" },
  { id: 43, name: "Baba ghanoush (1 cup)",     carbs: 15,  cat: "side",    note: "" },
  { id: 44, name: "Egyptian salad (1 cup)",    carbs: 8,   cat: "side",    note: "tomato/cucumber" },
  { id: 45, name: "Mehammara (1/2 cup)",       carbs: 18,  cat: "side",    note: "spicy pepper dip" },
  // DESSERTS
  { id: 50, name: "Basbousa (1 piece)",        carbs: 35,  cat: "dessert", note: "semolina + syrup" },
  { id: 51, name: "Kunafa (small)",            carbs: 65,  cat: "dessert", note: "~150g portion" },
  { id: 52, name: "Mahalabeya (1 cup)",        carbs: 30,  cat: "dessert", note: "milk pudding" },
  { id: 53, name: "Roz bel laban (1 cup)",     carbs: 50,  cat: "dessert", note: "rice pudding" },
  { id: 54, name: "Om Ali (1 cup)",            carbs: 55,  cat: "dessert", note: "bread/milk dessert" },
  { id: 55, name: "Baklava (1 piece)",         carbs: 30,  cat: "dessert", note: "" },
  { id: 56, name: "Qatayef (1, fried)",        carbs: 25,  cat: "dessert", note: "Ramadan dessert" },
  { id: 57, name: "Zalabia (4 pcs)",           carbs: 45,  cat: "dessert", note: "fried dough + syrup" },
  { id: 58, name: "Konafa bel manga",          carbs: 75,  cat: "dessert", note: "kunafa + mango" },
  // DRINKS
  { id: 70, name: "Sugarcane juice (1 cup)",   carbs: 30,  cat: "drink",   note: "fast acting" },
  { id: 71, name: "Mango juice (1 cup)",       carbs: 35,  cat: "drink",   note: "fresh" },
  { id: 72, name: "Sahlab (1 cup)",            carbs: 35,  cat: "drink",   note: "milky, sweet" },
  { id: 73, name: "Sobia (1 cup)",             carbs: 30,  cat: "drink",   note: "coconut milk drink" },
  { id: 74, name: "Karkade (sweet)",           carbs: 20,  cat: "drink",   note: "hibiscus + sugar" },
  { id: 75, name: "Tamr hindi (sweet)",        carbs: 25,  cat: "drink",   note: "tamarind" },
  { id: 76, name: "Erk soos",                  carbs: 12,  cat: "drink",   note: "licorice drink" },
  { id: 77, name: "Tea + 2 sugars",            carbs: 12,  cat: "drink",   note: "common serve" },
  { id: 78, name: "Cola (330ml)",              carbs: 35,  cat: "drink",   note: "regular" },
];

const CAT_LABEL = {
  main: "Mains",
  street: "Street",
  bread: "Bread",
  side: "Sides",
  dessert: "Desserts",
  drink: "Drinks",
};

const CAT_ORDER = ["main", "street", "bread", "side", "dessert", "drink"];

/* ────────────────────────────────────────────────────────────────
   Math helpers
   ────────────────────────────────────────────────────────────── */

function iobFraction(elapsedMin, diaHours = 4) {
  const t = elapsedMin / 60;
  if (t <= 0) return 1;
  if (t >= diaHours) return 0;
  return Math.pow(1 - t / diaHours, 1.5);
}

function insulinActivityRate(elapsedMin, diaHours = 4) {
  const t = elapsedMin / 60;
  if (t <= 0 || t >= diaHours) return 0;
  return (1.5 / diaHours) * Math.pow(1 - t / diaHours, 0.5);
}

function carbRate(t, profile) {
  const p = CARB_PROFILES[profile] || CARB_PROFILES.normal;
  if (t < 0 || t >= p.duration) return 0;
  const sigma = t <= p.peakMin ? p.sigmaUp : p.sigmaDown;
  return Math.exp(-Math.pow((t - p.peakMin) / sigma, 2));
}

function carbCurveArea(profile) {
  let area = 0;
  const p = CARB_PROFILES[profile] || CARB_PROFILES.normal;
  for (let t = 0; t < p.duration; t += 1) area += carbRate(t, profile);
  return area;
}

function fmtTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * 60000);
}

function round2(v) {
  return Math.round(v * 100) / 100;
}

function roundHalf(v) {
  return Math.max(0, Math.round(v * 2) / 2);
}

function vibrate(ms) {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms);
  } catch {}
}

/* ────────────────────────────────────────────────────────────────
   Storage hooks (SSR-safe; hydrate after mount)
   ────────────────────────────────────────────────────────────── */

function useStoredState(key, initial) {
  const [value, setValue] = useState(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value, hydrated]);

  return [value, setValue];
}

function useStoredDoses(key) {
  const [doses, setDoses] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem(key);
      if (raw != null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setDoses(parsed.map((d) => ({ ...d, time: new Date(d.time) })));
        }
      }
    } catch {}
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (typeof window === "undefined") return;
      const serialized = doses.map((d) => ({
        ...d,
        time: d.time instanceof Date ? d.time.toISOString() : d.time,
      }));
      window.localStorage.setItem(key, JSON.stringify(serialized));
    } catch {}
  }, [key, doses, hydrated]);

  return [doses, setDoses];
}

/* ────────────────────────────────────────────────────────────────
   Small UI atoms
   ────────────────────────────────────────────────────────────── */

function NumField({ label, suffix, value, onChange, step = 1, min = 0 }) {
  return (
    <label className="block">
      <div className="label-eyebrow ink-3 mb-1.5">{label}</div>
      <div className="flex items-baseline gap-1.5 border-b border-hair pb-1.5 focus-within:border-[#e87a4f] transition-colors">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="num text-2xl bg-transparent outline-none w-full ink"
        />
        <span className="ink-3 num text-xs">{suffix}</span>
      </div>
    </label>
  );
}

function bgStatusFor(bg) {
  if (bg === "" || bg == null || isNaN(parseFloat(bg))) return null;
  const v = parseFloat(bg);
  if (v < 70)  return { label: "LOW · eat carbs first", urgent: true,  cls: "border-rose-500/50 text-rose-300 bg-rose-500/10" };
  if (v < 90)  return { label: "On the low side",      urgent: false, cls: "border-amber-500/50 text-amber-300 bg-amber-500/10" };
  if (v <= 140) return { label: "In range",            urgent: false, cls: "border-[#8fb37e]/50 text-[#8fb37e] bg-[#8fb37e]/10" };
  if (v <= 180) return { label: "Elevated",            urgent: false, cls: "border-amber-500/50 text-amber-300 bg-amber-500/10" };
  if (v <= 250) return { label: "High",                urgent: false, cls: "border-[#e87a4f]/50 text-[#e87a4f] bg-[#e87a4f]/10" };
  return { label: "Very high", urgent: true, cls: "border-rose-500/50 text-rose-300 bg-rose-500/10" };
}

function preBolusFor(bg) {
  if (bg === "" || bg == null || isNaN(parseFloat(bg))) return 15;
  const v = parseFloat(bg);
  if (v < 70)   return -1;
  if (v < 90)   return 0;
  if (v < 130)  return 15;
  if (v < 180)  return 20;
  return 25;
}

function strategyFor(profile, totalCarbs) {
  if (profile === "highfat")  return "split-fat";
  if (profile === "veryhigh") return "split-vh";
  if (profile === "mixed")    return "split-mixed";
  if (profile === "normal" && totalCarbs >= 90) return "split-vh";
  return "single";
}

function splitsForStrategy(strategy) {
  switch (strategy) {
    case "split-fat":   return [{ pct: 0.60, offset: 0, label: "First dose" }, { pct: 0.40, offset: 90, label: "Second dose" }];
    case "split-vh":    return [{ pct: 0.55, offset: 0, label: "First dose" }, { pct: 0.45, offset: 60, label: "Second dose" }];
    case "split-mixed": return [{ pct: 0.65, offset: 0, label: "First dose" }, { pct: 0.35, offset: 75, label: "Second dose" }];
    default:            return [{ pct: 1.00, offset: 0, label: "Dose now" }];
  }
}

function fmtRelative(target, now) {
  const diff = Math.round((target.getTime() - now.getTime()) / 60000);
  if (diff > 0) return `in ${diff}m`;
  if (diff < 0) return `${Math.abs(diff)}m ago`;
  return "now";
}

/* ────────────────────────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────────────────────── */

export default function InsulinOverlapApp() {
  // Persisted state
  const [icr,            setIcr]            = useStoredState("insulin.icr",         15);
  const [cf,             setCf]             = useStoredState("insulin.cf",          45);
  const [target,         setTarget]         = useStoredState("insulin.target",      110);
  const [dia,            setDia]            = useStoredState("insulin.dia",         4);
  const [doses,          setDoses]          = useStoredDoses("insulin.doses");
  const [meal,           setMeal]           = useStoredState("insulin.meal",        []);
  const [mealProfile,    setMealProfile]    = useStoredState("insulin.mealProfile", "normal");
  const [recentFoodIds,  setRecentFoodIds]  = useStoredState("insulin.recentFoods", []);

  // Local UI state
  const [currentBG,       setCurrentBG]       = useState("");
  const [search,          setSearch]          = useState("");
  const [customName,      setCustomName]      = useState("");
  const [customCarbs,     setCustomCarbs]     = useState("");
  const [manualDoseUnits, setManualDoseUnits] = useState("");
  const [showSettings,    setShowSettings]    = useState(false);
  const [now,             setNow]             = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  /* ── Derived state ───────────────────────────────────────── */

  const iob = useMemo(() => {
    let total = 0;
    for (const d of doses) {
      const elapsed = (now.getTime() - new Date(d.time).getTime()) / 60000;
      total += d.units * iobFraction(elapsed, dia);
    }
    return total;
  }, [doses, now, dia]);

  const totalCarbs = useMemo(
    () => meal.reduce((s, m) => s + m.carbs * m.qty, 0),
    [meal]
  );

  const preBolusMin = preBolusFor(currentBG);

  const calc = useMemo(() => {
    const icrNum = parseFloat(icr) || 15;
    const cfNum = parseFloat(cf) || 45;
    const targetNum = parseFloat(target) || 110;
    const bg = parseFloat(currentBG);
    const carbInsulin = totalCarbs > 0 ? totalCarbs / icrNum : 0;
    const correctionRaw = !isNaN(bg) ? (bg - targetNum) / cfNum : 0;
    const correction = Math.max(0, correctionRaw);
    const grossDose = carbInsulin + correction;
    const netDose = Math.max(0, grossDose - iob);

    const strategy = strategyFor(mealProfile, totalCarbs);
    const splits = splitsForStrategy(strategy);

    const firstDelay = -preBolusMin > 0 ? 0 : -preBolusMin; // delayMin relative to meal time
    // delayMin is the time of the dose relative to meal (t=0 on chart).
    // First dose taken now → at meal-time = -preBolusMin.
    // Second dose taken offset min after first → at meal-time = -preBolusMin + offset.
    const baseDelay = preBolusMin > 0 ? -preBolusMin : 0;

    const planned = splits.map((s) => {
      const u = roundHalf(netDose * s.pct);
      const delayMin = baseDelay + s.offset;
      const etaMinFromNow = s.offset; // first dose at now, second at now + offset
      return {
        units: u,
        delayMin,
        offset: s.offset,
        eta: addMinutes(now, etaMinFromNow),
        label: s.label,
      };
    });

    return { carbInsulin, correction, grossDose, netDose, strategy, planned };
  }, [icr, cf, target, currentBG, totalCarbs, iob, mealProfile, preBolusMin, now]);

  /* ── Overlap chart (carbs vs insulin, mg/dL/min) ──────────── */

  const overlapData = useMemo(() => {
    if (totalCarbs === 0 && calc.planned.every((p) => p.units === 0)) return [];
    const data = [];
    const carbArea = carbCurveArea(mealProfile) || 1;
    const cfNum = parseFloat(cf) || 45;
    const diaNum = parseFloat(dia) || 4;
    for (let t = -10; t <= 240; t += 2) {
      const carbR = totalCarbs > 0 ? (totalCarbs * 4 * carbRate(t, mealProfile)) / carbArea : 0;
      let insR = 0;
      for (const p of calc.planned) {
        if (p.units <= 0) continue;
        const elapsedFromDose = t - p.delayMin;
        const rateUnitsPerHr = p.units * insulinActivityRate(elapsedFromDose, diaNum);
        const rateUnitsPerMin = rateUnitsPerHr / 60;
        insR += rateUnitsPerMin * cfNum;
      }
      data.push({ t, carb: round2(carbR), insulin: round2(insR) });
    }
    return data;
  }, [totalCarbs, mealProfile, calc.planned, cf, dia]);

  const { carbPeak, insPeak, peakDiagnosis } = useMemo(() => {
    let cp = { t: 0, v: 0 };
    let ip = { t: 0, v: 0 };
    for (const d of overlapData) {
      if (d.carb > cp.v) cp = { t: d.t, v: d.carb };
      if (d.insulin > ip.v) ip = { t: d.t, v: d.insulin };
    }
    let diag = "";
    if (cp.v > 0 && ip.v > 0) {
      const gap = ip.t - cp.t;
      const ag = Math.abs(gap);
      if (ag <= 15) {
        diag = "Insulin and carbs peak together — well aligned.";
      } else if (gap > 0 && gap <= 45) {
        diag = `Insulin peaks ${gap}m after carbs — early spike likely, then in range.`;
      } else if (gap > 45) {
        diag = `Insulin peaks ${gap}m after carbs — big spike risk. Consider longer pre-bolus.`;
      } else if (gap < 0 && ag <= 45) {
        diag = `Insulin peaks ${ag}m before carbs — early dip possible. Pre-bolus less.`;
      } else {
        diag = `Insulin peaks ${ag}m before carbs — hypo risk. Delay first dose.`;
      }
    }
    return { carbPeak: cp, insPeak: ip, peakDiagnosis: diag };
  }, [overlapData]);

  /* ── Six-hour activity chart (units/hour) ─────────────────── */

  const sixHourData = useMemo(() => {
    const hasLogged = doses.length > 0;
    const hasPlanned = calc.planned.some((p) => p.units > 0);
    if (!hasLogged && !hasPlanned) return [];
    const diaNum = parseFloat(dia) || 4;
    const data = [];
    for (let m = -30; m <= 330; m += 10) {
      const t = addMinutes(now, m);
      let logged = 0;
      let planned = 0;
      for (const d of doses) {
        const elapsed = (t.getTime() - new Date(d.time).getTime()) / 60000;
        logged += d.units * insulinActivityRate(elapsed, diaNum);
      }
      for (const p of calc.planned) {
        if (p.units <= 0) continue;
        const elapsed = (t.getTime() - p.eta.getTime()) / 60000;
        planned += p.units * insulinActivityRate(elapsed, diaNum);
      }
      data.push({ m, logged: round2(logged), planned: round2(planned) });
    }
    return data;
  }, [doses, calc.planned, now, dia]);

  /* ── Recent foods (resolved to full food objects) ─────────── */

  const recentFoods = useMemo(
    () =>
      recentFoodIds
        .map((id) => EGYPTIAN_FOODS.find((f) => f.id === id))
        .filter(Boolean),
    [recentFoodIds]
  );

  const filteredFoods = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? EGYPTIAN_FOODS.filter(
          (f) => f.name.toLowerCase().includes(q) || (f.note && f.note.toLowerCase().includes(q))
        )
      : EGYPTIAN_FOODS;
    const groups = {};
    for (const f of list) {
      if (!groups[f.cat]) groups[f.cat] = [];
      groups[f.cat].push(f);
    }
    return CAT_ORDER.filter((c) => groups[c]).map((c) => ({ cat: c, items: groups[c] }));
  }, [search]);

  /* ── Handlers ─────────────────────────────────────────────── */

  const addFood = (f) => {
    setMeal((m) => {
      const existing = m.find((x) => x.foodId === f.id);
      if (existing) return m.map((x) => (x.foodId === f.id ? { ...x, qty: x.qty + 1 } : x));
      return [...m, { foodId: f.id, name: f.name, carbs: f.carbs, qty: 1 }];
    });
    setRecentFoodIds((ids) => [f.id, ...ids.filter((id) => id !== f.id)].slice(0, 8));
    vibrate(8);
  };

  const changeQty = (foodId, delta) => {
    setMeal((m) =>
      m
        .map((x) => (x.foodId === foodId ? { ...x, qty: x.qty + delta } : x))
        .filter((x) => x.qty > 0)
    );
  };

  const removeMealItem = (foodId) => {
    setMeal((m) => m.filter((x) => x.foodId !== foodId));
  };

  const clearMeal = () => {
    setMeal([]);
  };

  const removeDose = (id) => {
    setDoses((d) => d.filter((x) => x.id !== id));
  };

  const addCombined = () => {
    const carbs = parseFloat(customCarbs);
    const units = parseFloat(manualDoseUnits);
    const hasCarbs = !isNaN(carbs) && carbs > 0;
    const hasInsulin = !isNaN(units) && units > 0;
    if (!hasCarbs && !hasInsulin) return;
    if (hasCarbs) {
      const name = customName.trim() || `${carbs}g`;
      setMeal((m) => [
        ...m,
        { foodId: `custom-${Date.now()}`, name, carbs, qty: 1, custom: true },
      ]);
    }
    if (hasInsulin) {
      setDoses((d) => [
        ...d,
        { id: Date.now() + Math.random(), units, time: new Date(), label: "manual" },
      ]);
    }
    setCustomName("");
    setCustomCarbs("");
    setManualDoseUnits("");
    vibrate(8);
  };

  const logAllPlanned = () => {
    if (calc.netDose <= 0 || preBolusMin === -1) return;
    const baseTime = new Date();
    const newDoses = calc.planned
      .filter((p) => p.units > 0)
      .map((p) => ({
        id: Date.now() + Math.random() + p.offset,
        units: p.units,
        time: addMinutes(baseTime, p.offset),
        label: p.label.toLowerCase(),
      }));
    setDoses((d) => [...d, ...newDoses]);
    setMeal([]);
    setCurrentBG("");
    vibrate(12);
  };

  const clearExpiredDoses = () => {
    const diaNum = parseFloat(dia) || 4;
    const cutoff = addMinutes(new Date(), -diaNum * 60);
    setDoses((d) => d.filter((x) => new Date(x.time) >= cutoff));
  };

  /* ── Render ───────────────────────────────────────────────── */

  const bgStatus = bgStatusFor(currentBG);
  const sortedDoses = useMemo(
    () => [...doses].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()),
    [doses]
  );
  const recentDoses = sortedDoses.slice(0, 5);

  const showDosePlan = meal.length > 0 || calc.correction > 0;
  const showStickyCTA = calc.netDose > 0 && preBolusMin !== -1;

  return (
    <div className="min-h-screen w-full paper-bg" style={{ backgroundColor: "#0e0a07" }}>
      <div
        className="max-w-md mx-auto safe-top safe-x sans"
        style={{ paddingBottom: "calc(140px + env(safe-area-inset-bottom))" }}
      >
        {/* 6.1 Masthead */}
        <header className="pt-4 pb-5 border-b-2 border-hair flex items-start justify-between">
          <div>
            <div className="label-eyebrow ink-3 mb-3">Cairo · Insulin Ledger</div>
            <h1 className="display ink leading-[0.95] text-[56px] font-medium tracking-tight">
              Overlap
            </h1>
            <h1 className="display italic terra leading-[0.95] text-[56px] font-medium tracking-tight">
              &amp; Onset
            </h1>
            <div className="ink-3 text-sm italic mt-2.5">a dosing field guide</div>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings((s) => !s)}
            className="tap-44 flex items-center justify-center rounded-full border border-hair-soft touch-active"
            aria-label="Settings"
          >
            <Settings2 size={18} className="ink-2" />
          </button>
        </header>

        {/* 6.2 Settings */}
        {showSettings && (
          <section className="mt-5 fade-up bg-paper border border-hair rounded-2xl p-4">
            <div className="label-eyebrow ink-3 mb-3 flex items-center gap-1.5">
              <Info size={11} /> Personal ratios
            </div>
            <div className="grid grid-cols-2 gap-4">
              <NumField label="ICR · 1u :"  suffix="g"       value={icr}    onChange={setIcr}    step={0.5} />
              <NumField label="CF · 1u →"   suffix="mg/dL"   value={cf}     onChange={setCf}     step={1} />
              <NumField label="Target BG"    suffix="mg/dL"  value={target} onChange={setTarget} step={1} />
              <NumField label="Duration"     suffix="hr"     value={dia}    onChange={setDia}    step={0.5} />
            </div>
            <button
              type="button"
              onClick={clearExpiredDoses}
              className="tap-40 mt-4 w-full rounded-xl border border-hair-soft bg-paper-2 ink-2 text-xs flex items-center justify-center gap-2 touch-active"
            >
              <RotateCcw size={13} /> Clear expired doses
            </button>
          </section>
        )}

        {/* 6.3 Current state row */}
        <section className="mt-5 grid grid-cols-5 gap-3">
          {/* Glucose card */}
          <div className="col-span-3 bg-paper border border-hair rounded-2xl p-4">
            <div className="label-eyebrow ink-3 mb-2">Glucose now</div>
            <div className="flex items-baseline gap-2 border-b border-hair-soft pb-1 focus-within:border-[#e87a4f] transition-colors">
              <input
                type="number"
                inputMode="decimal"
                placeholder="—"
                value={currentBG}
                onChange={(e) => setCurrentBG(e.target.value)}
                className="display ink bg-transparent outline-none w-full text-5xl font-medium"
              />
            </div>
            <div className="ink-3 num text-[11px] mt-1.5">mg/dL · Libre 3</div>
            {bgStatus && (
              <div
                className={`mt-2 inline-flex items-center gap-1.5 text-[11px] border rounded-full px-2.5 py-1 ${bgStatus.cls}`}
              >
                {bgStatus.urgent && <AlertTriangle size={11} />}
                <span className="font-medium">{bgStatus.label}</span>
              </div>
            )}
          </div>
          {/* IOB card */}
          <div className="col-span-2 bg-paper border border-hair rounded-2xl p-4 flex flex-col justify-between">
            <div className="label-eyebrow ink-3">IOB</div>
            <div>
              <div className="display ink text-4xl font-medium num leading-none">
                {iob.toFixed(1)}
              </div>
              <div className="ink-3 num text-[11px] mt-2">units active</div>
            </div>
          </div>
        </section>

        {/* 6.4 Dose history strip */}
        {sortedDoses.length > 0 && (
          <section className="mt-5">
            <div className="label-eyebrow ink-3 mb-2 flex items-center justify-between">
              <span>Dose history</span>
              <span className="num lowercase">{sortedDoses.length} total</span>
            </div>
            <div className="bg-paper border border-hair rounded-2xl divide-y divide-[#26201a]">
              {recentDoses.map((d) => {
                const t = new Date(d.time);
                const elapsed = (now.getTime() - t.getTime()) / 60000;
                const remaining = d.units * iobFraction(elapsed, dia);
                return (
                  <div key={d.id} className="flex items-center justify-between px-3.5 py-2.5">
                    <div className="flex items-baseline gap-3">
                      <span className="num ink font-bold text-base">{d.units}u</span>
                      <span className="ink-3 text-xs">{fmtRelative(t, now)}</span>
                      <span className="ink-3 num text-[11px]">({fmtTime(t)})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="terra num text-[11px]">
                        {remaining.toFixed(2)}u left
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDose(d.id)}
                        className="tap-40 flex items-center justify-center ink-3 touch-active"
                        aria-label="Remove dose"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 6.5 Quick log */}
        <section className="mt-5">
          <div className="label-eyebrow ink-3 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Plus size={11} /> Quick log
            </span>
            {meal.length > 0 && (
              <button
                type="button"
                onClick={clearMeal}
                className="text-[11px] ink-3 touch-active normal-case tracking-normal"
              >
                Clear plate
              </button>
            )}
          </div>
          <div className="bg-paper border border-hair rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Carbs */}
              <div
                className="rounded-xl border border-hair-soft p-3 focus-within:border-[#e87a4f] transition-colors"
                style={{ minHeight: 54 }}
              >
                <div className="label-eyebrow terra mb-1">Carbs</div>
                <div className="flex items-baseline gap-1.5">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="—"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addCombined(); }}
                    className="num text-2xl bg-transparent outline-none w-full ink"
                  />
                  <span className="ink-3 num text-xs">g</span>
                </div>
              </div>
              {/* Insulin */}
              <div
                className="rounded-xl border border-hair-soft p-3 focus-within:border-[#6ba8c4] transition-colors"
                style={{ minHeight: 54 }}
              >
                <div className="label-eyebrow lapis mb-1">Insulin</div>
                <div className="flex items-baseline gap-1.5">
                  <input
                    type="number"
                    inputMode="decimal"
                    step={0.5}
                    placeholder="—"
                    value={manualDoseUnits}
                    onChange={(e) => setManualDoseUnits(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addCombined(); }}
                    className="num text-2xl bg-transparent outline-none w-full ink"
                  />
                  <span className="ink-3 num text-xs">u</span>
                </div>
              </div>
            </div>
            <input
              type="text"
              placeholder="Label (optional)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addCombined(); }}
              className="mt-3 w-full bg-transparent border border-hair-soft rounded-lg px-3 text-sm ink outline-none focus:border-[#3a2f25]"
              style={{ height: 40 }}
            />
            {(() => {
              const c = parseFloat(customCarbs);
              const u = parseFloat(manualDoseUnits);
              const hasC = !isNaN(c) && c > 0;
              const hasU = !isNaN(u) && u > 0;
              let label = "Add";
              if (hasC && hasU) label = "Log carbs & dose";
              else if (hasC) label = "Add carbs";
              else if (hasU) label = "Log dose";
              const active = hasC || hasU;
              return (
                <button
                  type="button"
                  onClick={addCombined}
                  disabled={!active}
                  className={`tap-44 mt-3 w-full rounded-xl font-medium text-sm touch-active transition-colors ${
                    active
                      ? "bg-[#e87a4f] text-[#1a1311]"
                      : "bg-[#3a2f25] text-[#7a6c5d]"
                  }`}
                >
                  {label}
                </button>
              );
            })()}
          </div>
        </section>

        {/* 6.6 Recent foods chips */}
        {recentFoods.length > 0 && (
          <section className="mt-5">
            <div className="label-eyebrow ink-3 mb-2">Recent</div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
              {recentFoods.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => addFood(f)}
                  className="flex-shrink-0 rounded-full px-3.5 py-2 border border-hair-soft bg-paper text-xs flex items-center gap-2 touch-active"
                  style={{ minHeight: 36 }}
                >
                  <span className="ink truncate" style={{ maxWidth: 140 }}>
                    {f.name}
                  </span>
                  <span className="terra num">{f.carbs}g</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 6.7 Browse Egyptian foods */}
        <section className="mt-5">
          <details className="bg-paper border border-hair rounded-2xl overflow-hidden group">
            <summary
              className="flex items-center justify-between px-4 select-none"
              style={{ height: 48 }}
            >
              <span className="flex items-center gap-2.5 ink-2 text-sm">
                <Search size={14} />
                Browse Egyptian foods
                <span className="ink-3 num text-[11px]">
                  {EGYPTIAN_FOODS.length} items
                </span>
              </span>
              <ChevronDown
                size={16}
                className="ink-3 transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="border-t border-hair-soft fade-up">
              <div className="px-4 py-3 border-b border-hair-soft">
                <div
                  className="flex items-center gap-2 border border-hair-soft rounded-lg px-3 focus-within:border-[#e87a4f] transition-colors"
                  style={{ height: 48 }}
                >
                  <Search size={14} className="ink-3 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent outline-none w-full text-sm ink"
                  />
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {filteredFoods.length === 0 && (
                  <div className="px-4 py-6 ink-3 text-xs text-center italic">
                    Nothing matches.
                  </div>
                )}
                {filteredFoods.map((g) => (
                  <div key={g.cat}>
                    <div
                      className="label-eyebrow ink-3 px-4 py-1.5 bg-paper-2 sticky top-0 border-b border-hair-soft"
                    >
                      {CAT_LABEL[g.cat]}
                    </div>
                    {g.items.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => addFood(f)}
                        className="w-full flex items-center justify-between px-4 border-b border-hair-soft text-left touch-active hover:bg-[#221b16]/40 transition-colors"
                        style={{ minHeight: 52 }}
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="text-sm ink truncate">{f.name}</div>
                          {f.note && (
                            <div className="text-[11px] ink-3 italic truncate">
                              {f.note}
                            </div>
                          )}
                        </div>
                        <div className="terra num text-sm border border-hair-soft rounded-md px-2 py-0.5 bg-paper">
                          {f.carbs}g
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </details>
        </section>

        {/* 6.8 Selected meal */}
        {meal.length > 0 && (
          <section className="mt-5 bg-paper border border-hair rounded-2xl overflow-hidden">
            <div className="px-4 pt-3.5 pb-2 flex items-center justify-between border-b border-hair-soft">
              <div className="label-eyebrow terra flex items-center gap-1.5">
                On the plate
              </div>
              <div className="ink-3 num text-[11px]">{meal.length} items</div>
            </div>
            <div className="divide-y divide-[#26201a]">
              {meal.map((m) => (
                <div key={m.foodId} className="flex items-center px-3.5 py-2">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="text-sm ink truncate">{m.name}</div>
                    <div className="text-[11px] ink-3 num">
                      {m.carbs}g · ×{m.qty} = {m.carbs * m.qty}g
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => changeQty(m.foodId, -1)}
                      className="tap-40 flex items-center justify-center ink-2 touch-active"
                      aria-label="Decrease"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="num ink text-sm w-5 text-center">{m.qty}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(m.foodId, 1)}
                      className="tap-40 flex items-center justify-center ink-2 touch-active"
                      aria-label="Increase"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMealItem(m.foodId)}
                      className="tap-40 flex items-center justify-center ink-3 touch-active"
                      aria-label="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-hair-soft flex items-baseline justify-between bg-paper-2">
              <div className="label-eyebrow ink-3">Total carbs</div>
              <div className="display ink text-3xl num font-medium">
                {totalCarbs}
                <span className="ink-3 num text-sm ml-1">g</span>
              </div>
            </div>
          </section>
        )}

        {/* 6.9 Meal profile chooser */}
        {meal.length > 0 && (
          <section className="mt-5">
            <div className="label-eyebrow ink-3 mb-2">Meal profile</div>
            <div className="grid grid-cols-2 gap-2.5">
              {PROFILE_OPTIONS.map((p) => {
                const sel = mealProfile === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setMealProfile(p.id); vibrate(8); }}
                    className={`rounded-xl p-3 flex flex-col items-start justify-center text-left touch-active transition-colors ${
                      sel
                        ? "border-2 border-[#e87a4f] bg-[#e87a4f]/10"
                        : "border border-hair-soft bg-paper"
                    }`}
                    style={{ minHeight: 64 }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-medium ${sel ? "ink" : "ink-2"}`}>
                        {p.label}
                      </span>
                      {sel && <Check size={12} className="terra" />}
                    </div>
                    <div className="ink-3 text-[11px] num mt-0.5">{p.hint}</div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 6.10 Dose plan card */}
        {showDosePlan && (
          <section className="mt-5 border-2 border-hair rounded-2xl overflow-hidden">
            {/* Hero */}
            <div className="bg-paper-2 px-4 pt-3.5 pb-4">
              <div className="label-eyebrow terra mb-2">The plan</div>
              {preBolusMin === -1 ? (
                <div className="flex items-start gap-2 border border-rose-500/50 bg-rose-500/10 rounded-xl p-3 text-rose-300 text-sm">
                  <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>
                    BG below 70. <strong>Eat 15g fast carbs first.</strong> Do not dose
                    yet — recheck in 15 min.
                  </span>
                </div>
              ) : (
                <div className="flex items-end justify-between">
                  <div>
                    <div className="display ink font-medium num leading-none text-[64px]">
                      {calc.netDose.toFixed(1)}
                    </div>
                    <div className="ink-3 num text-[11px] mt-2">units · net dose</div>
                  </div>
                  <div className="text-right text-[11px] num ink-3 leading-relaxed">
                    <div>
                      <span className="ink-2">{calc.carbInsulin.toFixed(2)}u</span> for carbs
                    </div>
                    {calc.correction > 0 && (
                      <div>+{calc.correction.toFixed(2)}u correction</div>
                    )}
                    {iob > 0 && (
                      <div className="terra">−{iob.toFixed(2)}u IOB</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Split rows */}
            {preBolusMin !== -1 && calc.planned.length > 0 && (
              <div className="bg-paper divide-y divide-[#26201a]">
                {calc.planned.map((p, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="display ink num font-medium text-2xl">
                        {p.units.toFixed(1)}
                      </span>
                      <span className="ink-3 text-[11px]">units</span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5 ink-2 text-xs">
                        <Clock size={11} />
                        <span>{p.label}</span>
                        <span className="num ink-3">· {fmtTime(p.eta)}</span>
                      </div>
                      {i === 0 && preBolusMin > 0 && (
                        <div className="text-[10px] terra mt-0.5">
                          Pre-bolus {preBolusMin}m before
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Strategy explainer */}
            {preBolusMin !== -1 && (
              <div className="bg-paper-2 border-l-2 border-[#e87a4f] px-4 py-3">
                <div className="ink-2 text-xs italic leading-relaxed">
                  {STRATEGY_TEXT[calc.strategy]}
                </div>
              </div>
            )}

            {/* Inline action */}
            {calc.netDose > 0 && preBolusMin !== -1 && (
              <button
                type="button"
                onClick={logAllPlanned}
                className="tap-44 w-full font-medium text-sm touch-active"
                style={{
                  backgroundColor: "#e87a4f",
                  color: "#1a1311",
                  height: 52,
                }}
              >
                Log plan &amp; clear plate
              </button>
            )}
          </section>
        )}

        {/* 6.11 Peak overlap chart */}
        {overlapData.length > 0 && (
          <section className="mt-6">
            <div className="label-eyebrow ink-3 mb-2">Peak overlap</div>
            {peakDiagnosis && (
              <div className="border-l-2 border-[#e87a4f] pl-3 py-1 mb-3 ink-2 text-xs italic">
                {peakDiagnosis}
              </div>
            )}
            <div className="bg-paper border border-hair rounded-2xl p-3">
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overlapData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="carbGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e87a4f" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#e87a4f" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="insGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6ba8c4" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#6ba8c4" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="#3a2f25" />
                    <XAxis
                      dataKey="t"
                      type="number"
                      domain={[-10, 240]}
                      ticks={[0, 30, 60, 90, 120, 180, 240]}
                      tick={{ fill: "#7a6c5d", fontSize: 10, fontFamily: "JetBrains Mono" }}
                      tickFormatter={(v) => (v === 0 ? "meal" : `+${v}`)}
                      stroke="#3a2f25"
                    />
                    <YAxis
                      tick={{ fill: "#7a6c5d", fontSize: 10, fontFamily: "JetBrains Mono" }}
                      stroke="#3a2f25"
                      label={{
                        value: "mg/dL/min",
                        position: "insideLeft",
                        angle: -90,
                        offset: 18,
                        style: { fill: "#7a6c5d", fontSize: 9, fontStyle: "italic" },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1410",
                        border: "1px solid #3a2f25",
                        borderRadius: 8,
                        color: "#f1e7d0",
                        fontFamily: "JetBrains Mono",
                        fontSize: 11,
                      }}
                      labelFormatter={(v) => `+${v} min from meal`}
                      formatter={(v, k) => [`${v} mg/dL/min`, k === "carb" ? "Carbs" : "Insulin"]}
                    />
                    <ReferenceLine
                      x={0}
                      stroke="#f1e7d0"
                      strokeOpacity={0.6}
                      label={{ value: "🍽", fill: "#f1e7d0", fontSize: 11, position: "top" }}
                    />
                    {carbPeak.v > 0 && (
                      <ReferenceLine
                        x={carbPeak.t}
                        stroke="#e87a4f"
                        strokeDasharray="3 3"
                        strokeOpacity={0.7}
                      />
                    )}
                    {insPeak.v > 0 && (
                      <ReferenceLine
                        x={insPeak.t}
                        stroke="#6ba8c4"
                        strokeDasharray="3 3"
                        strokeOpacity={0.7}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="carb"
                      stroke="#e87a4f"
                      strokeWidth={1.5}
                      fill="url(#carbGrad)"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="insulin"
                      stroke="#6ba8c4"
                      strokeWidth={1.5}
                      fill="url(#insGrad)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-2 px-1">
                <div className="flex items-center gap-1.5 text-[11px] ink-2">
                  <span className="inline-block w-3 h-2 rounded-sm" style={{ backgroundColor: "#e87a4f" }} />
                  Carbs raising BG
                </div>
                <div className="flex items-center gap-1.5 text-[11px] ink-2">
                  <span className="inline-block w-3 h-2 rounded-sm" style={{ backgroundColor: "#6ba8c4" }} />
                  Insulin lowering BG
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 6.12 Six-hour activity */}
        {sixHourData.length > 0 && (
          <section className="mt-5">
            <div className="label-eyebrow ink-3 mb-2">Insulin activity · 6 hr</div>
            <div className="bg-paper border border-hair rounded-2xl p-3">
              <div style={{ width: "100%", height: 150 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sixHourData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="loggedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e87a4f" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#e87a4f" stopOpacity={0.04} />
                      </linearGradient>
                      <linearGradient id="plannedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6ba8c4" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6ba8c4" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="#3a2f25" />
                    <XAxis
                      dataKey="m"
                      type="number"
                      domain={[-30, 330]}
                      ticks={[0, 60, 120, 180, 240, 300]}
                      tick={{ fill: "#7a6c5d", fontSize: 10, fontFamily: "JetBrains Mono" }}
                      tickFormatter={(v) => (v === 0 ? "now" : `+${v}`)}
                      stroke="#3a2f25"
                    />
                    <YAxis
                      tick={{ fill: "#7a6c5d", fontSize: 10, fontFamily: "JetBrains Mono" }}
                      stroke="#3a2f25"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1410",
                        border: "1px solid #3a2f25",
                        borderRadius: 8,
                        color: "#f1e7d0",
                        fontFamily: "JetBrains Mono",
                        fontSize: 11,
                      }}
                      labelFormatter={(v) => (v === 0 ? "now" : `${v > 0 ? "+" : ""}${v} min`)}
                      formatter={(v, k) => [`${v} u/hr`, k === "logged" ? "Logged" : "Planned"]}
                    />
                    <ReferenceLine x={0} stroke="#f1e7d0" strokeOpacity={0.4} />
                    <Area
                      type="monotone"
                      dataKey="logged"
                      stroke="#e87a4f"
                      strokeWidth={1.5}
                      fill="url(#loggedGrad)"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="planned"
                      stroke="#6ba8c4"
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      fill="url(#plannedGrad)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-2 px-1">
                <div className="flex items-center gap-1.5 text-[11px] ink-2">
                  <span className="inline-block w-4 h-[2px]" style={{ backgroundColor: "#e87a4f" }} />
                  Logged
                </div>
                <div className="flex items-center gap-1.5 text-[11px] ink-2">
                  <span className="inline-block w-4 h-[2px] border-t-2 border-dashed" style={{ borderColor: "#6ba8c4" }} />
                  Planned
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 6.13 Colophon */}
        <footer className="mt-8 mb-2 text-center ink-3 text-[11px] italic px-4 leading-relaxed">
          A dosing aid, not medical advice. Egyptian portions are wide-ranging — when
          guessing, lean a touch high on carbs and watch the CGM trend for the first 30
          min. Adjust ratios in settings as patterns emerge.
        </footer>
        <div className="text-center ink-3 text-xs num pb-4">⋄ ⋄ ⋄</div>
      </div>

      {/* 6.14 Sticky bottom CTA */}
      {showStickyCTA && (
        <div
          className="fixed left-0 right-0 bottom-0 z-50 cta-shadow fade-up"
          style={{
            background: "linear-gradient(to top, #0e0a07 70%, rgba(14,10,7,0))",
            paddingTop: 12,
            paddingBottom: "max(16px, env(safe-area-inset-bottom))",
            paddingLeft: "max(16px, env(safe-area-inset-left))",
            paddingRight: "max(16px, env(safe-area-inset-right))",
          }}
        >
          <div className="max-w-md mx-auto">
            <button
              type="button"
              onClick={logAllPlanned}
              className="w-full rounded-2xl flex items-center justify-between px-4 touch-active"
              style={{ minHeight: 64, backgroundColor: "#e87a4f", color: "#1a1311" }}
            >
              <div className="text-left">
                <div className="label-eyebrow" style={{ opacity: 0.7 }}>
                  Log dose plan
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="display num font-medium text-2xl leading-none">
                    {calc.netDose.toFixed(1)}
                  </span>
                  <span className="text-[11px]" style={{ opacity: 0.8 }}>
                    units
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider" style={{ opacity: 0.7 }}>
                  {calc.planned.length > 1 ? `${calc.planned.length} doses` : "First dose"}
                </div>
                <div className="num text-sm font-medium mt-0.5">
                  {fmtTime(calc.planned[0].eta)}
                </div>
                {preBolusMin > 0 && (
                  <div className="text-[10px]" style={{ opacity: 0.8 }}>
                    pre-bolus {preBolusMin}m
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
