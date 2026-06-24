import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Award, HelpCircle, AlertCircle, Bot, Sparkles, MessageSquare } from "lucide-react";
import { preloadedChatResponses, defaultBotWelcome, fallbackBotResponse } from "../data";

interface Message {
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
}

interface BotAdvisorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BotAdvisor({ isOpen, onClose }: BotAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: defaultBotWelcome,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      sender: "user",
      text: text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulated typings
    setTimeout(() => {
      let matchedAnswer = "";
      const lowerText = text.toLowerCase();

      // Look up preloaded responses based on key terms
      for (const group of preloadedChatResponses) {
        if (group.keywords.some((kw) => lowerText.includes(kw))) {
          matchedAnswer = group.answer;
          break;
        }
      }

      // Fallback response if not matched
      if (!matchedAnswer) {
        matchedAnswer = fallbackBotResponse;
      }

      const botMessage: Message = {
        sender: "bot",
        text: matchedAnswer,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1200);
  };

  const presetQuestions = [
    "💧 Khi nào nên tưới nước cho phong lan?",
    "☀️ Ánh sáng thế nào là vừa đủ nuôi lan?",
    "🌱 Giá thể tốt nhất là gì?",
    "🏵️ Cách bón phân NPK kích thích mầm nụ?"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="fixed bottom-28 right-4 md:right-8 w-[380px] sm:w-[420px] h-[550px] bg-white rounded-2xl shadow-2xl border border-antique-gold/15 flex flex-col z-50 overflow-hidden"
        >
          {/* Header Panel */}
          <div className="bg-botanical-green p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                <Bot className="w-5.5 h-5.5 text-soft-olive" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-semibold tracking-wide flex items-center gap-1">
                  Cố Vấn Orchidée Luxe <Sparkles className="w-3.5 h-3.5 text-soft-olive" />
                </h4>
                <p className="text-[10px] font-sans text-white/80">Chẩn đoán và chăm sóc hoa lan thực tuyển</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Đóng cuộc hội thoại"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Loop Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-surface-cream scroll-smooth space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-xs font-sans leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-botanical-green text-white rounded-br-none"
                      : "bg-white text-charcoal-text border border-surface-container shadow-sm rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className={`block text-[8.5px] mt-1.5 text-right ${
                    msg.sender === "user" ? "text-white/60" : "text-on-surface-variant/50"
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-surface-container rounded-lg rounded-bl-none p-3.5 flex items-center gap-1 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-botanical-green rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-botanical-green rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-botanical-green rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Preset Guides list */}
          <div className="bg-white p-3 border-t border-surface-container">
            <p className="text-[10px] text-on-surface-variant/80 font-mono uppercase tracking-wider mb-2 flex items-center gap-1 font-semibold">
              <HelpCircle className="w-3.5 h-3.5 text-antique-gold" /> Gợi ý câu hỏi kỹ thuật:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {presetQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q.replace(/^[^\s]+\s+/, ""))}
                  className="px-2.5 py-1.5 bg-surface-container-low hover:bg-botanical-green/5 hover:text-botanical-green text-[10.5px] text-charcoal-text font-sans rounded border border-outline-variant/20 transition-colors text-left cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3 border-t border-surface-container flex gap-2 bg-white"
          >
            <input
              type="text"
              placeholder="Nhập câu hỏi của bạn tại đây..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-2 bg-surface-cream text-xs font-sans rounded border border-outline-variant/30 focus:border-botanical-green focus:ring-0 outline-none transition-colors"
            />
            <button
              type="submit"
              className="w-10 h-10 bg-botanical-green hover:bg-botanical-green/95 text-white flex items-center justify-center rounded cursor-pointer transition-colors"
              aria-label="Gửi tin nhắn"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
