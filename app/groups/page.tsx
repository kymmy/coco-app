"use client";

import { useEffect, useState, useTransition } from "react";
import { createGroup, joinGroup, getGroups } from "@/lib/actions";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useT } from "@/lib/i18n";
import { useToast } from "@/lib/toast";

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

function ShareModal({ group, onClose }: { group: Group; onClose: () => void }) {
  const t = useT();
  const { toast } = useToast();
  const joinUrl = `${window.location.origin}/groups/join/${group.code}`;

  async function handleCopyLink() {
    await navigator.clipboard.writeText(joinUrl);
    toast(t("groups.linkCopied"));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-3xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-charcoal-faint hover:text-charcoal transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h3 className="mb-1 text-lg font-extrabold text-charcoal">
          {t("groups.share")}
        </h3>
        <p className="mb-5 text-sm text-charcoal-muted">{group.name}</p>

        {/* QR Code */}
        <div className="mb-5 flex flex-col items-center">
          <div className="rounded-2xl border-2 border-coral-100 bg-white p-4">
            <QRCodeSVG
              value={joinUrl}
              size={180}
              level="M"
              fgColor="#2D2D2D"
              bgColor="#ffffff"
            />
          </div>
          <p className="mt-2 text-xs text-charcoal-faint">{t("groups.scanToJoin")}</p>
        </div>

        {/* Link */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-bold text-charcoal-muted">
            {t("groups.shareLink")}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={joinUrl}
              className="flex-1 rounded-xl border-2 border-coral-200 bg-coral-50 px-3 py-2 text-sm text-charcoal select-all"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={handleCopyLink}
              className="shrink-0 rounded-xl bg-coral-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-coral-400 active:scale-95"
            >
              {t("groups.copy")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const t = useT();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shareGroup, setShareGroup] = useState<Group | null>(null);
  const [leaveConfirm, setLeaveConfirm] = useState<string | null>(null);
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
    setLeaveConfirm(null);
  }

  async function handleCopyCode(code: string) {
    await navigator.clipboard.writeText(code);
    toast(t("groups.copied"));
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
                  {leaveConfirm === group.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-pink-500">{t("groups.leaveConfirm")}</span>
                      <button
                        onClick={() => handleLeave(group.id)}
                        className="rounded-full bg-pink-500 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-pink-400"
                      >
                        {t("groups.leaveYes")}
                      </button>
                      <button
                        onClick={() => setLeaveConfirm(null)}
                        className="text-xs font-semibold text-charcoal-faint hover:text-charcoal transition-colors"
                      >
                        {t("groups.leaveNo")}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setLeaveConfirm(group.id)}
                      className="text-xs font-semibold text-charcoal-faint hover:text-pink-500 transition-colors"
                    >
                      {t("groups.leave")}
                    </button>
                  )}
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2">
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
                    {t("groups.copy")}
                  </button>
                  <button
                    onClick={() => setShareGroup(group)}
                    className="rounded-full border border-coral-200 p-1.5 text-coral-500 hover:bg-coral-50 transition-colors"
                    aria-label="QR Code"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm11-2h2v2h-2v-2zm-4 0h2v2h-2v-2zm0 4h2v2h-2v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm0-4h2v2h-2v-2zm0 8h2v2h-2v-2zm-4 0h2v2h-2v-2z"/>
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/events"
                    className="text-sm font-semibold text-coral-500 hover:text-coral-400 transition-colors"
                  >
                    {t("groups.viewGroupEvents")} &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share modal */}
      {shareGroup && (
        <ShareModal group={shareGroup} onClose={() => setShareGroup(null)} />
      )}
    </main>
  );
}
