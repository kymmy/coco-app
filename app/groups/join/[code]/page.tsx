"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { joinGroup } from "@/lib/actions";
import { useT } from "@/lib/i18n";

function getJoinedGroupIds(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("tribu_groups");
  return raw ? (JSON.parse(raw) as string[]) : [];
}

function addGroupToLocal(id: string) {
  const ids = getJoinedGroupIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem("tribu_groups", JSON.stringify(ids));
  }
}

export default function JoinGroupPage() {
  const t = useT();
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [status, setStatus] = useState<"loading" | "ready" | "joined" | "already" | "error">("loading");
  const [groupName, setGroupName] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    // Check if already a member
    async function check() {
      const result = await joinGroup(code);
      if (result.error) {
        setStatus("error");
        return;
      }
      if (result.group) {
        setGroupName(result.group.name);
        const ids = getJoinedGroupIds();
        if (ids.includes(result.group.id)) {
          setStatus("already");
        } else {
          setStatus("ready");
        }
      }
    }
    check();
  }, [code]);

  async function handleJoin() {
    setJoining(true);
    const result = await joinGroup(code);
    if (result.group) {
      addGroupToLocal(result.group.id);
      setStatus("joined");
    } else {
      setStatus("error");
    }
    setJoining(false);
  }

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-lg">
        {status === "loading" && (
          <div className="animate-pulse">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-coral-100" />
            <div className="mx-auto mb-2 h-6 w-48 rounded-lg bg-coral-100" />
            <div className="mx-auto h-4 w-64 rounded bg-coral-50" />
          </div>
        )}

        {status === "error" && (
          <>
            <p className="mb-4 text-5xl">🤷</p>
            <h1 className="mb-2 text-xl font-extrabold text-charcoal">
              {t("groups.groupNotFound")}
            </h1>
            <Link
              href="/groups"
              className="mt-6 inline-flex items-center rounded-full bg-coral-500 px-6 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95"
            >
              {t("groups.title")}
            </Link>
          </>
        )}

        {status === "ready" && (
          <>
            <p className="mb-4 text-5xl">👋</p>
            <h1 className="mb-2 text-xl font-extrabold text-charcoal">
              {t("groups.joinTitle")}
            </h1>
            <p className="mb-2 text-charcoal-muted">
              {t("groups.joinDesc")}
            </p>
            <p className="mb-6 text-lg font-extrabold text-coral-500">
              {groupName}
            </p>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full rounded-full bg-coral-500 px-8 py-3 font-bold text-white shadow-lg transition-all hover:bg-coral-400 hover:shadow-xl active:scale-95 disabled:opacity-50"
            >
              {joining ? "..." : t("groups.joinButton")}
            </button>
          </>
        )}

        {status === "already" && (
          <>
            <p className="mb-4 text-5xl">✅</p>
            <h1 className="mb-2 text-xl font-extrabold text-charcoal">
              {groupName}
            </h1>
            <p className="mb-6 text-charcoal-muted">
              {t("groups.alreadyMember")}
            </p>
            <Link
              href="/events"
              className="inline-flex items-center rounded-full bg-coral-500 px-6 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95"
            >
              {t("groups.goToEvents")}
            </Link>
          </>
        )}

        {status === "joined" && (
          <>
            <p className="mb-4 text-5xl">🎉</p>
            <h1 className="mb-2 text-xl font-extrabold text-charcoal">
              {groupName}
            </h1>
            <p className="mb-6 text-charcoal-muted">
              {t("groups.joinSuccess")}
            </p>
            <Link
              href="/events"
              className="inline-flex items-center rounded-full bg-coral-500 px-6 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95"
            >
              {t("groups.goToEvents")}
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
