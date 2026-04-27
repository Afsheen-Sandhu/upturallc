"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Action {
  label: string;
  url: string;
}

interface ActionData {
  actions: Action[];
}

const ACTION_REGEX = /```(?:json|ACTION_JSON)?\s*([\s\S]*?)\s*```/;

function parseMessage(text: string): { cleanText: string; actions: Action[] } {
  const match = text.match(ACTION_REGEX);
  if (match && match[1].includes('"actions"')) {
    try {
      const actionData = JSON.parse(match[1].trim()) as ActionData;
      return {
        cleanText: text.replace(ACTION_REGEX, "").trim(),
        actions: actionData.actions ?? [],
      };
    } catch {
      // fall through
    }
  }
  return { cleanText: text, actions: [] };
}

function BotMessage({ text }: { text: string }) {
  const { cleanText, actions } = parseMessage(text);
  return (
    <div className="message bot">
      <span dangerouslySetInnerHTML={{ __html: cleanText.replace(/\n/g, "<br>") }} />
      {actions.length > 0 && (
        <div className="message-actions">
          {actions.map((a, i) => {
            const isExternal =
              a.url.startsWith("http") &&
              !a.url.includes("uptura.net") &&
              !a.url.includes("localhost");
            return (
              <a
                key={i}
                className="btn-action"
                href={a.url}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
              >
                {a.label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TuraBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hey! I'm TuraBot. 🤖 How can I help you today?" },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: next }),
      });
      const data = (await res.json()) as { reply?: string };
      setMessages([...next, { role: "assistant", content: data.reply ?? "Sorry, I couldn't get a response." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-widget">
      <div
        className={`chatbot-window ${open ? "active" : ""}`}
        aria-hidden={!open}
      >
        <div className="chatbot-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <i className="fa-solid fa-robot" />
            <h3>TuraBot</h3>
          </div>
          <i className="fa-solid fa-xmark" onClick={() => setOpen(false)} style={{ cursor: "pointer" }} />
        </div>

        <div className="chatbot-messages">
          {messages.map((m, i) =>
            m.role === "assistant" ? (
              <BotMessage key={i} text={m.content} />
            ) : (
              <div key={i} className="message user">{m.content}</div>
            )
          )}
          {loading && <div className="message bot">...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-input-area">
          <input
            className="chatbot-input"
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button className="chatbot-send" onClick={send} aria-label="Send">
            <i className="fa-solid fa-paper-plane" />
          </button>
        </div>
      </div>

      <div className="chatbot-toggle" onClick={() => setOpen((o) => !o)} aria-label="Open chat">
        <i className="fa-solid fa-robot" />
      </div>
    </div>
  );
}
