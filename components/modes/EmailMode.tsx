"use client";

import { useState } from "react";
import BackButton from "@/components/ui/BackButton";

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  body: string;
  time: string;
  unread: boolean;
  starred: boolean;
}

const INITIAL_EMAILS: Email[] = [
  {
    id: "1",
    from: "sarah.chen@company.com",
    subject: "Re: Auth Service Security Review - Action Required",
    preview: "Hi team, please review the attached security audit findings before Friday...",
    body: "Hi team,\n\nPlease review the attached security audit findings before Friday's standup. Key items:\n\n1. Rate limiting implementation status\n2. Token rotation timeline\n3. MFA rollout plan\n\nLet me know if you have questions.\n\nBest,\nSarah",
    time: "10:32 AM",
    unread: true,
    starred: true,
  },
  {
    id: "2",
    from: "ci-bot@company.com",
    subject: "Build #1847 PASSED - auth-service/main",
    preview: "All 42 tests passed. Deployment to staging triggered automatically.",
    body: "Build #1847 completed successfully.\n\nBranch: main\nCommit: a1b2c3d\nTests: 42 passed\nDuration: 8m 24s\n\nDeployment to staging: IN PROGRESS",
    time: "9:15 AM",
    unread: true,
    starred: false,
  },
  {
    id: "3",
    from: "jira@atlassian.com",
    subject: "[AUTH-142] JWT refresh token rotation assigned to you",
    preview: "You have been assigned to AUTH-142. Priority: High. Sprint: Q2-S3",
    body: "Issue AUTH-142 has been assigned to you.\n\nTitle: Implement JWT refresh token rotation\nPriority: High\nSprint: Q2-S3\n\nView in Jira: https://company.atlassian.net/browse/AUTH-142",
    time: "Yesterday",
    unread: false,
    starred: false,
  },
  {
    id: "4",
    from: "hr@company.com",
    subject: "Q2 Performance Review Schedule",
    preview: "Your performance review is scheduled for May 28 at 2:00 PM...",
    body: "Dear colleague,\n\nYour Q2 performance review is scheduled for May 28 at 2:00 PM.\n\nPlease prepare your self-assessment by May 25.\n\nHR Team",
    time: "Mon",
    unread: false,
    starred: false,
  },
];

export default function EmailMode() {
  const [emails, setEmails] = useState(INITIAL_EMAILS);
  const [selectedId, setSelectedId] = useState<string | null>("1");
  const [filter, setFilter] = useState<"inbox" | "starred" | "sent">("inbox");
  const [composing, setComposing] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [search, setSearch] = useState("");

  const selected = emails.find((e) => e.id === selectedId);

  const visibleEmails = emails.filter((e) => {
    if (filter === "starred" && !e.starred) return false;
    if (search && !e.subject.toLowerCase().includes(search.toLowerCase()) && !e.from.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openEmail = (id: string) => {
    setSelectedId(id);
    setComposing(false);
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, unread: false } : e)));
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails((prev) => prev.map((em) => (em.id === id ? { ...em, starred: !em.starred } : em)));
  };

  const sendEmail = () => {
    if (!composeSubject.trim()) return;
    const newEmail: Email = {
      id: String(Date.now()),
      from: "you@company.com",
      subject: composeSubject,
      preview: composeBody.slice(0, 60),
      body: composeBody,
      time: "Now",
      unread: false,
      starred: false,
    };
    setEmails((prev) => [newEmail, ...prev]);
    setComposing(false);
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
    setSelectedId(newEmail.id);
  };

  const unreadCount = emails.filter((e) => e.unread).length;

  return (
    <div className="flex-1 flex bg-gray-950 rounded-lg overflow-hidden border border-gray-800 shadow-sm">
      <div className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-3">
          <button
            type="button"
            onClick={() => { setComposing(true); setSelectedId(null); }}
            className="w-full px-3 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            + Compose
          </button>
        </div>
        <nav className="px-2 space-y-0.5">
          {(["inbox", "starred", "sent"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { setFilter(f); setComposing(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                filter === f && !composing ? "bg-blue-600/20 text-blue-300" : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              {f}
              {f === "inbox" && unreadCount > 0 && (
                <span className="ml-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="w-72 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-2 border-b border-gray-800">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mail..."
            className="input-3d w-full"
          />
        </div>
        <div className="flex-1 overflow-y-auto thin-scrollbar">
          {visibleEmails.map((email) => (
            <button
              key={email.id}
              type="button"
              onClick={() => openEmail(email.id)}
              className={`w-full text-left px-3 py-3 border-b border-gray-800/50 hover:bg-gray-900 transition-colors ${
                selectedId === email.id ? "bg-gray-900 ring-1 ring-inset ring-blue-500/40" : ""
              } ${email.unread ? "bg-gray-900/50" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm truncate ${email.unread ? "font-semibold text-gray-100" : "text-gray-400"}`}>
                  {email.from.split("@")[0]}
                </span>
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => toggleStar(email.id, e)}
                    onKeyDown={(e) => e.key === "Enter" && toggleStar(email.id, e as unknown as React.MouseEvent)}
                    className={`text-sm ${email.starred ? "text-yellow-400" : "text-gray-600 hover:text-yellow-400"}`}
                  >
                    ★
                  </span>
                  <span className="text-xs text-gray-600">{email.time}</span>
                </div>
              </div>
              <p className={`text-sm truncate ${email.unread ? "text-gray-200" : "text-gray-500"}`}>{email.subject}</p>
              <p className="text-xs text-gray-600 truncate mt-0.5">{email.preview}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {composing ? (
          <div className="flex-1 flex flex-col p-4">
            <div className="flex items-center gap-3 mb-4">
              <BackButton onClick={() => setComposing(false)} label="Back to inbox" />
              <h2 className="text-lg font-semibold text-gray-200">New Message</h2>
            </div>
            <input
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              placeholder="To"
              className="input-3d w-full mb-2"
            />
            <input
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              placeholder="Subject"
              className="input-3d w-full mb-3"
            />
            <textarea
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              placeholder="Write your message..."
              rows={12}
              className="textarea-3d flex-1 w-full"
            />
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={sendEmail} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                Send
              </button>
              <button type="button" onClick={() => setComposing(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">
                Discard
              </button>
            </div>
          </div>
        ) : selected ? (
          <div className="flex-1 flex flex-col p-5 overflow-y-auto thin-scrollbar">
            <div className="flex items-center gap-3 mb-4">
              <BackButton onClick={() => setSelectedId(null)} label="Back to list" />
            </div>
            <h1 className="text-xl font-semibold text-gray-100 mb-2">{selected.subject}</h1>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-800">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                {selected.from[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-gray-200">{selected.from}</p>
                <p className="text-xs text-gray-500">{selected.time}</p>
              </div>
            </div>
            <pre className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-sans">{selected.body}</pre>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={() => { setComposing(true); setComposeSubject(`Re: ${selected.subject}`); setComposeTo(selected.from); }} className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg">
                Reply
              </button>
              <button type="button" onClick={() => toggleStar(selected.id, { stopPropagation: () => {} } as React.MouseEvent)} className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg">
                {selected.starred ? "Unstar" : "Star"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
            Select an email or compose a new message
          </div>
        )}
      </div>
    </div>
  );
}
