import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  user_id: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export function SafetyAI() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Здравствуйте! Я AI-ассистент по технике безопасности. Задайте мне любой вопрос о безопасности на производстве, и я постараюсь помочь вам.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function loadChatHistory() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading chat history:', error);
        return;
      }

      if (data && data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        const historicalMessages = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(historicalMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }

  async function saveChatHistory(newMessages: Message[]) {
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from('chat_history')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('chat_history')
          .update({
            messages: newMessages,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('chat_history')
          .insert({
            user_id: user.id,
            messages: newMessages
          });
      }
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  async function handleSendMessage() {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      let apiUrl = webhookUrl;

      if (!apiUrl) {
        apiUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
      }

      if (!apiUrl) {
        throw new Error('N8N Webhook URL не настроен. Пожалуйста, добавьте VITE_N8N_WEBHOOK_URL в .env файл.');
      }

      console.log('Sending message to n8n:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: {
            message: userMessage.content,
            userId: user?.id,
            chatHistory: messages.slice(-5).map(m => ({
              role: m.role,
              content: m.content
            }))
          }
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Ошибка API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.message || 'Извините, я не смог обработать ваш запрос.',
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      await saveChatHistory(finalMessages);

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка при отправке сообщения');

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.',
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="mb-3 flex-shrink-0">
        <h1 className="text-xl font-bold text-slate-900 mb-1">SafetyAI</h1>
        <p className="text-sm text-slate-600">AI-консультант по ТБ</p>
      </div>

      {error && (
        <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-red-900">Ошибка</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-100 flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-blue-600'
                    : 'bg-gradient-to-br from-green-500 to-green-600'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              <div
                className={`flex-1 min-w-0 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block p-2.5 rounded-2xl max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  <p className="text-xs whitespace-pre-wrap break-words">{message.content}</p>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 px-1">
                  {message.timestamp.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 p-2.5 rounded-2xl">
                <div className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                  <span className="text-xs text-slate-600">Печатает...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-100 p-2.5 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Задайте вопрос..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100 flex-shrink-0">
        <p className="text-[10px] text-blue-900 font-medium mb-1.5">Примеры вопросов:</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            'Как использовать СИЗ?',
            'Что делать при пожаре?',
            'Правила работы на высоте'
          ].map((example, index) => (
            <button
              key={index}
              onClick={() => setInputValue(example)}
              disabled={isLoading}
              className="text-[10px] px-2.5 py-1 bg-white text-blue-600 rounded-full active:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
