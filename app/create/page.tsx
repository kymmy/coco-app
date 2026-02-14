"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { createEvent } from "@/lib/actions";
import Link from "next/link";

const CATEGORIES = [
  { value: "parc", label: "🌳 Parc / Plein air" },
  { value: "sport", label: "⚽ Sport" },
  { value: "musee", label: "🎨 Musée / Expo" },
  { value: "spectacle", label: "🎭 Spectacle" },
  { value: "restaurant", label: "🍕 Restaurant / Goûter" },
  { value: "atelier", label: "✂️ Atelier / Loisir créatif" },
  { value: "piscine", label: "🏊 Piscine / Baignade" },
  { value: "balade", label: "🚶 Balade / Rando" },
  { value: "autre", label: "📌 Autre" },
];

interface AddressSuggestion {
  label: string;
  context: string;
  lat: number;
  lng: number;
}

function useAddressSearch(query: string) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setSuggestions(
          data.features.map(
            (f: {
              properties: { label: string; context: string };
              geometry: { coordinates: [number, number] };
            }) => ({
              label: f.properties.label,
              context: f.properties.context,
              lng: f.geometry.coordinates[0],
              lat: f.geometry.coordinates[1],
            })
          )
        );
      } catch (e) {
        if ((e as Error).name !== "AbortError") setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return { suggestions, loading };
}

function compressImage(file: File, maxWidth = 800, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const inputClass =
  "w-full rounded-xl border-2 border-coral-200 bg-coral-50 px-4 py-3 text-charcoal placeholder:text-charcoal-faint focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-200 transition-colors";

export default function CreateEventPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { suggestions, loading } = useAddressSearch(location);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [organizer, setOrganizer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [recurrence, setRecurrence] = useState("none");

  // Auto-fill organizer from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("coco_username");
    if (saved) setOrganizer(saved);
  }, []);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      setImageData(null);
      return;
    }
    try {
      const compressed = await compressImage(file);
      setImagePreview(compressed);
      setImageData(compressed);
    } catch {
      // Fallback to raw if compression fails
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageData(result);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSubmit(formData: FormData) {
    formData.set("location", location);
    if (coords) {
      formData.set("latitude", String(coords.lat));
      formData.set("longitude", String(coords.lng));
    }
    if (imageData) {
      formData.set("image", imageData);
    } else {
      formData.delete("image");
    }
    // Save organizer name
    const org = formData.get("organizer") as string;
    if (org) localStorage.setItem("coco_username", org);

    startTransition(async () => {
      const result = await createEvent(formData);
      if (result?.error) {
        setError(result.error);
      }
      // On success, createEvent redirects
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-coral-100 to-cream px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm font-semibold text-coral-500 hover:text-coral-400 transition-colors"
        >
          <span className="mr-1">&larr;</span> Retour
        </Link>

        <div className="rounded-3xl bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-3xl font-extrabold text-charcoal">
            Proposer une sortie <span className="text-coral-500">🎉</span>
          </h1>
          <p className="mb-8 text-charcoal-muted">
            Remplissez les infos et partagez avec les parents !
          </p>

          {error && (
            <div className="mb-6 rounded-xl bg-pink-50 px-4 py-3 text-sm font-semibold text-pink-500">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-bold text-charcoal">
                Titre de la sortie *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                placeholder="ex: Sortie au zoo de Lyon"
                className={inputClass}
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-bold text-charcoal">
                Catégorie
              </label>
              <select
                id="category"
                name="category"
                defaultValue="autre"
                className={`${inputClass} cursor-pointer`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Organizer */}
            <div>
              <label htmlFor="organizer" className="mb-1 block text-sm font-bold text-charcoal">
                Votre prénom *
              </label>
              <input
                type="text"
                id="organizer"
                name="organizer"
                required
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="ex: Sophie"
                className={inputClass}
              />
            </div>

            {/* Date row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="date" className="mb-1 block text-sm font-bold text-charcoal">
                  Début *
                </label>
                <input
                  type="datetime-local"
                  id="date"
                  name="date"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="mb-1 block text-sm font-bold text-charcoal">
                  Fin
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  name="endDate"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Recurrence */}
            <div>
              <label htmlFor="recurrence" className="mb-1 block text-sm font-bold text-charcoal">
                Récurrence
              </label>
              <select
                id="recurrence"
                name="recurrence"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="none">Événement unique</option>
                <option value="weekly">Chaque semaine</option>
                <option value="biweekly">Toutes les 2 semaines</option>
                <option value="monthly">Chaque mois</option>
              </select>
              {recurrence !== "none" && (
                <div className="mt-2">
                  <label htmlFor="recurrenceCount" className="mb-1 block text-xs font-bold text-charcoal-muted">
                    Nombre d&apos;occurrences (max 52)
                  </label>
                  <input
                    type="number"
                    id="recurrenceCount"
                    name="recurrenceCount"
                    min="2"
                    max="52"
                    defaultValue="4"
                    className={inputClass}
                  />
                </div>
              )}
            </div>

            {/* Location with autocomplete */}
            <div ref={wrapperRef} className="relative">
              <label htmlFor="location" className="mb-1 block text-sm font-bold text-charcoal">
                Lieu *
              </label>
              <input
                type="text"
                id="location"
                required
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setShowSuggestions(true);
                  setCoords(null);
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="ex: Parc de la Tête d'Or, Lyon"
                autoComplete="off"
                className={inputClass}
              />
              {showSuggestions && (suggestions.length > 0 || loading) && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border-2 border-coral-200 bg-white shadow-lg">
                  {loading && suggestions.length === 0 && (
                    <li className="px-4 py-3 text-sm text-charcoal-muted">
                      Recherche...
                    </li>
                  )}
                  {suggestions.map((s) => (
                    <li key={s.label}>
                      <button
                        type="button"
                        onClick={() => {
                          setLocation(s.label);
                          setCoords({ lat: s.lat, lng: s.lng });
                          setShowSuggestions(false);
                        }}
                        className="w-full px-4 py-3 text-left transition-colors hover:bg-coral-50"
                      >
                        <span className="block text-sm font-semibold text-charcoal">
                          {s.label}
                        </span>
                        <span className="block text-xs text-charcoal-muted">
                          {s.context}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Price + Max participants row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="price" className="mb-1 block text-sm font-bold text-charcoal">
                  Tarif
                </label>
                <input
                  type="text"
                  id="price"
                  name="price"
                  placeholder="ex: Gratuit, 5€/enfant..."
                  defaultValue="Gratuit"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="maxParticipants" className="mb-1 block text-sm font-bold text-charcoal">
                  Places max
                </label>
                <input
                  type="number"
                  id="maxParticipants"
                  name="maxParticipants"
                  min="2"
                  placeholder="Illimité"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Age range */}
            <div>
              <label className="mb-1 block text-sm font-bold text-charcoal">
                Tranche d&apos;âge des enfants
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="number"
                    id="ageMin"
                    name="ageMin"
                    min="0"
                    max="17"
                    placeholder="Min"
                    className={inputClass}
                  />
                  <span className="absolute top-1/2 right-4 -translate-y-1/2 text-xs text-charcoal-faint">
                    ans
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    id="ageMax"
                    name="ageMax"
                    min="0"
                    max="17"
                    placeholder="Max"
                    className={inputClass}
                  />
                  <span className="absolute top-1/2 right-4 -translate-y-1/2 text-xs text-charcoal-faint">
                    ans
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-bold text-charcoal">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                placeholder="Décrivez la sortie, l'ambiance, ce qu'il faut prévoir..."
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Event link */}
            <div>
              <label htmlFor="eventLink" className="mb-1 block text-sm font-bold text-charcoal">
                Lien externe
              </label>
              <input
                type="url"
                id="eventLink"
                name="eventLink"
                placeholder="https://..."
                className={inputClass}
              />
            </div>

            {/* Image */}
            <div>
              <label htmlFor="image" className="mb-1 block text-sm font-bold text-charcoal">
                Image (optionnel)
              </label>
              <p className="mb-2 text-xs text-charcoal-faint">
                L&apos;image sera redimensionnée automatiquement.
              </p>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full rounded-xl border-2 border-coral-200 bg-coral-50 px-4 py-3 text-charcoal file:mr-4 file:rounded-full file:border-0 file:bg-coral-500 file:px-4 file:py-1.5 file:text-sm file:font-bold file:text-white file:cursor-pointer hover:file:bg-coral-400 focus:outline-none transition-colors"
              />
              {imagePreview && (
                <div className="mt-3 overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-full bg-coral-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-coral-400 hover:shadow-xl active:scale-95 disabled:opacity-50"
            >
              {isPending ? "Publication en cours..." : "Publier la sortie 🚀"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
