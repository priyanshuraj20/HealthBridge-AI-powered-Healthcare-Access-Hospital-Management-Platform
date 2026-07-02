import { useState, useRef, useEffect } from "react";
import { BASE_URL } from "../../config";
import { BiMessageRoundedDots, BiX, BiSend } from "react-icons/bi";

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am the Medicare Virtual Assistant. How can I help you navigate hospital services or recommend a specialist today?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = inputMessage;
    setInputMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      // Build history (limit context for safety)
      const chatHistory = messages
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(`${BASE_URL}/ai/chat-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          chatHistory,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I am having connection difficulties. For appointments or inquiries, please contact our support desk.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primaryColor hover:scale-105 transition-all text-white p-4 rounded-full shadow-lg flex items-center justify-center cursor-pointer"
        >
          <BiMessageRoundedDots size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl border border-gray-100 w-[340px] sm:w-[380px] h-[480px] flex flex-col overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="bg-primaryColor text-white px-4 py-3 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm">Medicare Care Assistant</h4>
              <span className="text-[10px] text-blue-100">AI Coordinator</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              <BiX size={24} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-xs leading-5 shadow-sm ${
                    msg.role === "user"
                      ? "bg-primaryColor text-white rounded-tr-none"
                      : "bg-white text-headingColor border border-gray-100 rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-400 border border-gray-100 rounded-lg rounded-tl-none p-3 text-xs flex gap-1 items-center shadow-sm">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form Area */}
          <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex gap-2 bg-white">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about hospital services, timings..."
              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:border-primaryColor text-xs text-textColor"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-primaryColor text-white px-3 py-2 rounded font-semibold text-xs hover:opacity-90 transition-all flex items-center justify-center"
            >
              <BiSend size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
