import React, { useState, useEffect, useRef } from 'react';
import GreenApiService from '../api/greenApi';
import './Chat.css';

const Chat = () => {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [apiUrl, setApiUrl] = useState('https://7201.api.green-api.com'); // Твой URL по умолчанию
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  const [activeChatId, setActiveChatId] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const apiServiceRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  // Авторизация с проверкой
  const handleLogin = async () => {
    if (!idInstance || !apiTokenInstance) {
      setAuthError('Заполните все поля');
      return;
    }
    
    setIsLoadingAuth(true);
    setAuthError('');
    
    const service = new GreenApiService(idInstance, apiTokenInstance, apiUrl);
    const isAuth = await service.checkAuth();
    
    if (isAuth) {
      apiServiceRef.current = service;
      setIsAuthenticated(true);
      startPolling();
    } else {
      setAuthError('Неверный ID Instance или API Token. Инстанс не авторизован.');
    }
    setIsLoadingAuth(false);
  };

  const startPolling = () => {
    pollingIntervalRef.current = setInterval(async () => {
      try {
        // 1. Получаем уведомление
        const notification = await apiServiceRef.current.receiveNotification();
        
        // Если уведомлений нет, просто выходим и ждем следующего цикла
        if (!notification || !notification.receiptId) {
          return; 
        }

        const { body, receiptId } = notification;

        // 2. Проверяем тип вебхука
        if (body.typeWebhook === 'incomingMessageReceived') {
          const senderChatId = body.senderData?.chatId;
          const text = body.messageData?.textMessageData?.textMessage;
          
          // Добавляем сообщение только если есть текст и отправитель
          if (text && senderChatId) {
            const newMessage = {
              id: receiptId,
              text: text,
              sender: senderChatId,
              timestamp: body.timestamp,
              isIncoming: true
            };
            
            setMessages(prev => {
              // Проверка на дубликаты
              if (prev.some(m => m.id === receiptId)) return prev;
              console.log('Новое сообщение получено:', text); // Для отладки
              return [...prev, newMessage];
            });

            // Авто-выбор чата
            if (!activeChatId) {
              setActiveChatId(senderChatId);
              setInputPhone(senderChatId.replace('@c.us', ''));
            }
          }
        }

        // 3. Подтверждаем получение (даже если это не текстовое сообщение)
        // Это важно, чтобы очередь не забивалась "мусорными" уведомлениями
        try {
          await apiServiceRef.current.deleteNotification(receiptId);
        } catch (delError) {
          console.error('Ошибка при удалении уведомления:', delError);
        }

      } catch (error) { 
        console.error('Ошибка polling:', error); 
      }
    }, 2000);
  };

  const handleStartChat = () => {
    if (!inputPhone) return;
    const formatted = inputPhone.replace(/\D/g, '');
    setActiveChatId(`${formatted}@c.us`);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChatId) return;

    setIsSending(true);
    try {
      await apiServiceRef.current.sendMessage(activeChatId.replace('@c.us', ''), inputMessage);
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: inputMessage,
        sender: 'me',
        timestamp: Math.floor(Date.now() / 1000),
        isIncoming: false
      }]);
      setInputMessage('');
    } catch (error) {
      alert('Ошибка отправки: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (ts) => new Date(ts * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  if (!isAuthenticated) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <h2>WhatsApp Web Clone</h2>
            <p>Введите данные из Green-API</p>
          </div>
          <div className="login-form">
            <input 
              type="text" 
              placeholder="API URL (например: https://7201.api.green-api.com)" 
              value={apiUrl} 
              onChange={e => setApiUrl(e.target.value)} 
            />
            <input 
              type="text" 
              placeholder="ID Instance" 
              value={idInstance} 
              onChange={e => setIdInstance(e.target.value)} 
            />
            <input 
              type="password" 
              placeholder="API Token Instance" 
              value={apiTokenInstance} 
              onChange={e => setApiTokenInstance(e.target.value)} 
            />
            {authError && <div className="error-msg">{authError}</div>}
            <button onClick={handleLogin} disabled={isLoadingAuth}>
              {isLoadingAuth ? 'Проверка...' : 'Подключиться'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Боковая панель (упрощенная) */}
      <div className="sidebar">
        <div className="sidebar-header">SWILL Chat</div>
        {!activeChatId && (
          <div className="new-chat-box">
            <input 
              type="text" 
              placeholder="Номер телефона (7999...)" 
              value={inputPhone} 
              onChange={e => setInputPhone(e.target.value)} 
            />
            <button onClick={handleStartChat}>Начать чат</button>
          </div>
        )}
      </div>

      {/* Окно чата */}
      <div className="chat-window">
        {activeChatId ? (
          <>
            <div className="chat-header">
              <div className="chat-info">
                {/* Кнопка возврата */}
                <button 
                  onClick={() => {
                    setActiveChatId('');
                    setInputPhone('');
                    setMessages([]); // Очищаем историю при смене чата
                  }} 
                  className="back-btn"
                >
                  ← Назад
                </button>
                <span className="chat-name">{activeChatId.replace('@c.us', '')}</span>
              </div>
            </div>
            
            <div className="messages-area">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-bubble ${msg.isIncoming ? 'received' : 'sent'}`}>
                  <div className="msg-text">{msg.text}</div>
                  <div className="msg-time">{formatTime(msg.timestamp)}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="input-area">
              <input 
                type="text" 
                placeholder="Введите сообщение" 
                value={inputMessage} 
                onChange={e => setInputMessage(e.target.value)} 
                disabled={isSending}
              />
              <button type="submit" disabled={isSending || !inputMessage.trim()}>➤</button>
            </form>
          </>
        ) : (
          <div className="empty-state">Выберите контакт или введите номер для начала чата</div>
        )}
      </div>
    </div>
  );
};

export default Chat;