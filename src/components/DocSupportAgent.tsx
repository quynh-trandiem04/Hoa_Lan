import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, HelpCircle } from 'lucide-react';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export default function SupportAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Chào mừng bạn đến với Orchidée Luxe. Tôi là trợ lý chuyên gia sinh thái hoa lan của bạn. Bạn cần hỗ trợ gì về tài liệu khoa học, giống lan hay cách bảo tồn hôm nay?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const predefinedQuestions = [
    'Làm thế nào để tải tài liệu Nghiên cứu?',
    'Kỹ thuật nhân giống Lan Hài là gì?',
    'Làm cách nào liên hệ với chuyên gia?',
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Bot automatic smart reply based on keyword
    setTimeout(() => {
      let replyText = 'Cảm ơn câu hỏi của bạn. Hội đồng khoa học Orchidée Luxe đã ghi nhận. Chúng tôi sẽ kết nối bạn với chuyên gia thực vật học sớm nhất thông qua tài khoản của bạn.';
      
      const normalizedText = text.toLowerCase();
      if (normalizedText.includes('tải') || normalizedText.includes('download')) {
        replyText = 'Để tải tài liệu, bạn chỉ cần nhấn vào nút "TẢI XUỐNG" (hoặc "Tải tài liệu ngay") màu xanh hoặc vàng trên thẻ tài liệu tương ứng. Hệ thống sẽ kết nối với máy chủ học thuật Orchidée Luxe để biên dịch file.';
      } else if (normalizedText.includes('hài') || normalizedText.includes('paphiopedilum')) {
        replyText = 'Lan Hài (Paphiopedilum) là dòng lan đặc hữu quý hiếm với cấu trúc môi hoa hình chiếc túi tinh tế. Bạn có thể xem tài liệu chuyên sâu "Phân tích Hình thái học và Bảo tồn các loài Lan Hài" ngay trong thư viện của chúng tôi.';
      } else if (normalizedText.includes('chăm sóc') || normalizedText.includes('nuôi cấy') || normalizedText.includes('nhân giống')) {
        replyText = 'Về nhân giống và chăm sóc, chúng tôi khuyến nghị nuôi cấy mô in-vitro đối với lan rừng hoang dã để giữ nguồn gen, kết hợp chăm sóc trong điều kiện mát mẻ, lưới che 50-60% và giá thể dớn thông thoáng.';
      }

      const botMsg: Message = {
        sender: 'bot',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-botanical-green hover:bg-botanical-green/90 text-white rounded-full flex items-center justify-center luxury-shadow hover:scale-110 active:scale-95 transition-all z-50 group"
        title="Trợ lý chuyên gia"
      >
        {isOpen ? <X className="w-6 h-6 animate-spin duration-300" /> : <MessageSquare className="w-6 h-6 group-hover:rotate-6 transition-transform" />}
      </button>

      {/* Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-8 w-96 max-w-[calc(100vw-2rem)] h-[500px] bg-white rounded-lg shadow-2xl border border-outline-variant/40 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-botanical-green text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h5 className="font-serif text-sm font-semibold tracking-wide">Trợ Lý Thực Vật Học</h5>
                <p className="text-[10px] text-soft-olive tracking-widest uppercase font-medium">Orchidée Luxe Expert</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-surface-cream scrollbar-hide">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${msg.sender === 'user' ? 'bg-antique-gold text-white' : 'bg-botanical-green text-white'}`}>
                    {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className={`p-3 text-sm rounded-lg leading-relaxed ${msg.sender === 'user' ? 'bg-botanical-green text-white' : 'bg-white text-charcoal-text border border-outline-variant/30 shadow-sm'}`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-outline mt-1 block px-1">{msg.time}</span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset buttons */}
          <div className="p-2 bg-white border-t border-outline-variant/20 flex flex-wrap gap-1.5 justify-center">
            {predefinedQuestions.map((q, idx) => (
              <button 
                key={idx} 
                onClick={() => handleSend(q)}
                className="text-[10px] font-sans text-botanical-green hover:bg-soft-olive/20 border border-botanical-green/20 px-2 py-1 rounded-full transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-outline-variant/30 flex gap-2">
            <input 
              type="text" 
              placeholder="Nhập câu hỏi của bạn..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              className="flex-grow bg-surface-container-low border border-outline-variant/30 px-3 py-2 text-sm outline-none focus:border-antique-gold transition-colors font-sans"
            />
            <button 
              onClick={() => handleSend(input)}
              className="bg-botanical-green hover:bg-botanical-green/90 text-white p-2 transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
