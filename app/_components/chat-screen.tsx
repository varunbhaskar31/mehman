"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { EmptyState, focusRing, PageTitle, RequireUser } from "@/app/_components/app-ui";
import { primaryButtonClass } from "@/app/_components/fields";
import {
  findConversation,
  loadMessages,
  markConversationRead,
  sendMessage,
  useAppState,
  watchMessages,
} from "@/lib/data/store";
import type { AppState, ChatMessage, Conversation, Profile } from "@/lib/data/types";

type Mode = "guest" | "host";

// A thread is chosen by table and guest, so it can open before the first
// message (from a table page or a booking request).
type Thread = { tableId: string; guestId: string };

function shortTime(iso: string) {
  const when = new Date(iso);
  const today = new Date().toDateString() === when.toDateString();
  return today
    ? when.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    : when.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function threadTitle(state: AppState, mode: Mode, thread: Thread, conversation: Conversation | null) {
  if (conversation) return conversation.otherName;
  if (mode === "guest") {
    const table = state.tables.find((t) => t.id === thread.tableId);
    return state.hosts.find((h) => h.id === table?.hostId)?.displayName ?? "Your host";
  }
  const guest = state.profiles.find((p) => p.id === thread.guestId);
  return guest?.fullName.split(" ")[0] || "Your guest";
}

export function ChatScreen({ mode }: { mode: Mode }) {
  const state = useAppState();
  const params = useSearchParams();
  const base = mode === "host" ? "/host/messages" : "/messages";
  const tableId = params.get("table");
  const guestId = params.get("guest");
  const thread = tableId && guestId ? { tableId, guestId } : null;

  return (
    <RequireUser>
      {(user) => {
        const list = state.conversations.filter((c) => c.asHost === (mode === "host"));
        return (
          <div className="space-y-6">
            <div className={thread ? "hidden md:block" : ""}>
              <PageTitle kicker={mode === "host" ? "Hosting" : "Messages"} title={mode === "host" ? "Messages from guests" : "Messages"} />
            </div>
            <div className="md:grid md:min-h-[32rem] md:grid-cols-[18rem_1fr] md:gap-6">
              <nav aria-label="Conversations" className={thread ? "hidden md:block" : ""}>
                {list.length === 0 ? (
                  <p className="rounded-2xl bg-ivory/[0.05] p-5 text-sm text-ivory/65">
                    {mode === "host"
                      ? "When guests ask about your table, their messages show up here."
                      : "No messages yet. Have a question about a meal? Open a table and tap “Message the host”."}
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {list.map((c) => {
                      const open = thread?.tableId === c.tableId && thread.guestId === c.guestId;
                      return (
                        <li key={c.id}>
                          <Link
                            href={`${base}?table=${c.tableId}&guest=${c.guestId}`}
                            aria-current={open ? "page" : undefined}
                            className={`block rounded-2xl px-4 py-3 transition-colors hover:bg-ivory/[0.07] ${open ? "bg-ivory/[0.09]" : ""} ${focusRing}`}
                          >
                            <span className="flex items-baseline justify-between gap-3">
                              <span className={`truncate ${c.unread ? "font-semibold text-ivory" : "text-ivory/90"}`}>{c.otherName}</span>
                              <span className="shrink-0 text-xs text-ivory/45">{shortTime(c.lastMessageAt)}</span>
                            </span>
                            <span className="block truncate text-xs text-[#e8c08f]/80">{c.tableTitle}</span>
                            <span className="mt-0.5 flex items-center gap-2">
                              <span className={`truncate text-sm ${c.unread ? "text-ivory" : "text-ivory/55"}`}>
                                {c.lastSenderId === user.id ? "You: " : ""}
                                {c.lastBody}
                              </span>
                              {c.unread && <span aria-label="Unread" className="size-2 shrink-0 rounded-full bg-terracotta" />}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </nav>
              {thread ? (
                <ThreadView key={`${thread.tableId}-${thread.guestId}`} mode={mode} thread={thread} user={user} base={base} />
              ) : (
                <div className="hidden place-items-center rounded-2xl border border-ivory/10 text-sm text-ivory/45 md:grid">
                  {list.length ? "Pick a conversation." : ""}
                </div>
              )}
            </div>
          </div>
        );
      }}
    </RequireUser>
  );
}

function ThreadView({ mode, thread, user, base }: { mode: Mode; thread: Thread; user: Profile; base: string }) {
  const state = useAppState();
  const router = useRouter();
  const inputId = useId();
  const conversation = findConversation(state, thread.tableId, thread.guestId);
  const conversationId = conversation?.id ?? null;
  const unread = conversation?.unread ?? false;
  const table = state.tables.find((t) => t.id === thread.tableId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(Boolean(conversationId));
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Load the history, then keep it live.
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    const add = (incoming: ChatMessage[]) =>
      setMessages((current) => {
        const seen = new Set(current.map((m) => m.id));
        return [...current, ...incoming.filter((m) => !seen.has(m.id))].sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt),
        );
      });
    void loadMessages(conversationId).then((history) => {
      if (cancelled) return;
      add(history);
      setLoading(false);
    });
    const stop = watchMessages(conversationId, (message) => {
      add([message]);
      if (message.senderId !== user.id) void markConversationRead(conversationId);
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [conversationId, user.id]);

  useEffect(() => {
    if (conversationId && unread) void markConversationRead(conversationId);
  }, [conversationId, unread]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  // People can't message their own table, or a guest who hasn't been in touch.
  const ownTable = mode === "guest" && state.hosts.find((h) => h.id === table?.hostId)?.userId === user.id;
  const wrongGuest = mode === "guest" && thread.guestId !== user.id;
  if (ownTable || wrongGuest || (!table && !conversation)) {
    return (
      <EmptyState title="This conversation isn't available" action={<Link href={base} className={primaryButtonClass}>All messages</Link>}>
        It may be for a different account.
      </EmptyState>
    );
  }

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const result = await sendMessage(thread.tableId, thread.guestId, body);
    setSending(false);
    if ("error" in result) return setError(result.error);
    setDraft("");
    const latest = await loadMessages(result.value);
    setMessages(latest);
    setLoading(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends on a keyboard; Shift+Enter makes a new line.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) {
      event.preventDefault();
      void send();
    }
  }

  const title = threadTitle(state, mode, thread, conversation);
  const tableTitle = conversation?.tableTitle ?? table?.title ?? "";

  return (
    <section aria-label={`Conversation with ${title}`} className="flex min-h-[70dvh] flex-col rounded-2xl md:min-h-0 md:border md:border-ivory/10">
      <header className="flex items-center gap-3 border-b border-ivory/10 pb-3 md:px-5 md:pt-4">
        <button type="button" onClick={() => router.push(base)} aria-label="Back to all messages" className={`grid size-10 place-items-center rounded-full hover:bg-ivory/10 md:hidden ${focusRing}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-5">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="min-w-0">
          <h2 className="truncate font-serif text-xl">{title}</h2>
          {tableTitle && (
            <Link href={`/tables/${thread.tableId}`} className={`block truncate rounded text-xs text-[#e8c08f]/85 underline-offset-4 hover:underline ${focusRing}`}>
              {tableTitle}
            </Link>
          )}
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto py-4 md:max-h-[55dvh] md:px-5" aria-live="polite">
        {loading ? (
          <p className="text-center text-sm text-ivory/45">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="mx-auto max-w-sm py-8 text-center text-sm text-ivory/55">
            {mode === "guest"
              ? `Ask ${title} anything: spice levels, allergies, bringing children, how to find the house. Their phone number and address are shared once they accept your booking.`
              : `Say hello to ${title}. Please keep payments and bookings on Mehman.`}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <p className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${mine ? "rounded-br-md bg-[#e8c08f] text-pine" : "rounded-bl-md bg-ivory/[0.09] text-ivory"}`}>
                  {m.body}
                  <span className={`mt-1 block text-[10px] ${mine ? "text-pine/60" : "text-ivory/45"}`}>{shortTime(m.createdAt)}</span>
                </p>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="border-t border-ivory/10 pt-3 md:px-5 md:pb-4">
        {error && <p role="alert" className="mb-2 text-sm text-terracotta-soft">{error}</p>}
        <div className="flex items-end gap-2">
          <label htmlFor={inputId} className="sr-only">Message</label>
          <textarea
            id={inputId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={2000}
            placeholder="Write a message"
            className="field-sizing-content max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-ivory/20 bg-transparent px-4 py-2.5 text-sm text-ivory placeholder:text-ivory/40 focus-visible:border-ivory/60 focus-visible:outline-none"
          />
          <button type="submit" disabled={sending || !draft.trim()} className={`${primaryButtonClass} min-h-11 shrink-0 disabled:opacity-50`}>
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}
