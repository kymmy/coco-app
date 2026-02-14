"use client";

import { useEffect, useState, useTransition } from "react";
import { createGroup, joinGroup, getGroups } from "@/lib/actions";
import Link from "next/link";
import { useT } from "@/lib/i18n";

interface Group {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
}

function getJoinedGroupIds(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("coco_groups");
  return raw ? (JSON.parse(raw) as string[]) : [];
}

function addGroupToLocal(id: string) {
  const ids = getJoinedGroupIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem("coco_groups", JSON.stringify(ids));
  }
}

function removeGroupFromLocal(id: string) {
  const ids = getJoinedGroupIds().filter((g) => g !== id);
  localStorage.setItem("coco_groups", JSON.stringify(ids));
}

const inputClass =
  "w-full rounded-xl border-2 border-coral-200 bg-coral-50 px-4 py-3 text-charcoal placeholder:text-charcoal-faint focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-200 transition-colors";

export default function GroupsPage() {
  const t = useT();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const ids = getJoinedGroupIds();
    if (ids.length > 0) {
      getGroups(ids).then((data) => {
        setGroups(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  function handleCreate() {
    if (!newName.trim()) return;
    startTransition(async () => {
      const result = await createGroup(newName.trim());
      if (result.error) {
        setError(result.error);
      } else if (result.group) {
        addGroupToLocal(result.group.id);
        setGroups((prev) => [...prev, result.group]);
        setNewName("");
        setShowCreate(false);
        setError(null);
      }
    });
  }

  function handleJoin() {
    if (!joinCode.trim()) return;
    startTransition(async () => {
      const result = await joinGroup(joinCode.trim());
      if (result.error) {
        setError(result.error);
      } else if (result.group) {
        addGroupToLocal(result.group.id);
        if (!groups.find((g) => g.id === result.group.id)) {
          setGroups((prev) => [...prev, result.group]);
        }
        setJoinCode("");
        setShowJoin(false);
        setError(null);
      }
    });
  }

  function handleLeave(groupId: string) {
    removeGroupFromLocal(groupId);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }

  async function handleCopyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-coral-100 to-cream px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 text-3xl font-extrabold text-charcoal">
          {t("groups.title")} <span className="text-coral-500">👨‍👩‍👧‍👦</span>
        </h1>
        <p className="mb-8 text-charcoal-muted">
          {t("groups.subtitle")}
        </p>

        {error && (
          <div className="mb-6 rounded-xl bg-pink-50 px-4 py-3 text-sm font-semibold text-pink-500">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="mb-8 flex gap-3">
          <button
            onClick={() => {
              setShowCreate(!showCreate);
              setShowJoin(false);
              setError(null);
            }}
            className="flex-1 rounded-full bg-coral-500 px-6 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95"
          >
            {t("groups.createGroup")}
          </button>
          <button
            onClick={() => {
              setShowJoin(!showJoin);
              setShowCreate(false);
              setError(null);
            }}
            className="flex-1 rounded-full border-2 border-coral-500 px-6 py-3 font-bold text-coral-500 transition-all hover:bg-coral-50 active:scale-95"
          >
            {t("groups.join")}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="mb-6 rounded-3xl bg-card p-6 shadow-md">
            <h2 className="mb-3 text-lg font-extrabold text-charcoal">
              {t("groups.newGroup")}
            </h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder={t("groups.newGroupPlaceholder")}
              autoFocus
              className={inputClass}
            />
            <button
              onClick={handleCreate}
              disabled={isPending || !newName.trim()}
              className="mt-3 w-full rounded-full bg-coral-500 px-6 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95 disabled:opacity-50"
            >
              {isPending ? t("groups.creating") : t("groups.create")}
            </button>
          </div>
        )}

        {/* Join form */}
        {showJoin && (
          <div className="mb-6 rounded-3xl bg-card p-6 shadow-md">
            <h2 className="mb-3 text-lg font-extrabold text-charcoal">
              {t("groups.joinWithCode")}
            </h2>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="ex: COCO7K"
              maxLength={6}
              autoFocus
              className={`${inputClass} text-center text-xl font-bold tracking-[0.3em]`}
            />
            <button
              onClick={handleJoin}
              disabled={isPending || joinCode.length < 6}
              className="mt-3 w-full rounded-full bg-coral-500 px-6 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95 disabled:opacity-50"
            >
              {isPending ? t("groups.searching") : t("groups.join")}
            </button>
          </div>
        )}

        {/* Group list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-3xl bg-card p-6 shadow-md">
                <div className="mb-3 flex items-start justify-between">
                  <div className="h-6 w-40 rounded-lg bg-coral-100" />
                  <div className="h-4 w-16 rounded bg-coral-50" />
                </div>
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-4 w-24 rounded bg-coral-50" />
                  <div className="h-8 w-20 rounded-lg bg-coral-100" />
                  <div className="h-7 w-16 rounded-full bg-coral-100" />
                </div>
                <div className="h-4 w-36 rounded bg-coral-50" />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-3xl bg-card p-12 text-center shadow-md">
            <p className="mb-2 text-5xl">🏫</p>
            <p className="text-lg font-bold text-charcoal">
              {t("groups.noGroups")}
            </p>
            <p className="mt-1 text-charcoal-muted">
              {t("groups.noGroupsDesc")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="rounded-3xl bg-card p-6 shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h2 className="text-lg font-extrabold text-charcoal">
                    {group.name}
                  </h2>
                  <button
                    onClick={() => handleLeave(group.id)}
                    className="text-xs font-semibold text-charcoal-faint hover:text-pink-500 transition-colors"
                  >
                    {t("groups.leave")}
                  </button>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm text-charcoal-muted">
                    {t("groups.inviteCode")}
                  </span>
                  <span className="rounded-lg bg-coral-50 px-3 py-1 font-mono text-lg font-bold tracking-wider text-coral-500">
                    {group.code}
                  </span>
                  <button
                    onClick={() => handleCopyCode(group.code)}
                    className="rounded-full border border-coral-200 px-3 py-1 text-xs font-semibold text-coral-500 hover:bg-coral-50 transition-colors"
                  >
                    {copiedCode === group.code ? t("groups.copied") : t("groups.copy")}
                  </button>
                </div>

                <Link
                  href="/events"
                  className="inline-flex items-center text-sm font-semibold text-coral-500 hover:text-coral-400 transition-colors"
                >
                  {t("groups.viewGroupEvents")} &rarr;
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
