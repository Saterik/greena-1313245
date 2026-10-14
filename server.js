// ВАЖНО: Отключаем строгую проверку SSL для исходящих запросов
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 5000;

// Создаем агент, который игнорирует ошибки сертификатов
const agent = new https.Agent({  
  rejectUnauthorized: false
});

// Middleware
app.use(cors());
app.use(express.json());

// Прокси для отправки сообщений
app.post('/api/sendMessage', async (req, res) => {
  try {
    const { idInstance, apiTokenInstance, chatId, message } = req.body;
    
    const response = await axios.post(
      `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`,
      {
        chatId: chatId,
        message: message
      },
      {
        headers: { 'Content-Type': 'application/json' },
        httpsAgent: agent 
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// Прокси для получения уведомлений
app.get('/api/receiveNotification', async (req, res) => {
  try {
    const { idInstance, apiTokenInstance } = req.query;
    
    const response = await axios.get(
      `https://api.green-api.com/waInstance${idInstance}/receiveNotification/${apiTokenInstance}`,
      {
        httpsAgent: agent 
      }
    );
    
    res.json(response.data);
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 204) {
      res.json(null);
    } else {
      console.error('Error receiving notification:', error.message);
      res.status(error.response?.status || 500).json({
        error: error.message
      });
    }
  }
});

// Прокси для удаления уведомлений
app.delete('/api/deleteNotification', async (req, res) => {
  try {
    const { idInstance, apiTokenInstance, receiptId } = req.body;
    
    await axios.delete(
      `https://api.green-api.com/waInstance${idInstance}/deleteNotification/${apiTokenInstance}`,
      {
        data: { receiptId },
        httpsAgent: agent 
      }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message
    });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all handler
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});