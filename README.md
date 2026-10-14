# SWILL Chat — WhatsApp Web Client

Веб-интерфейс для отправки и получения сообщений через сервис **Green-API**. Разработан в рамках тестового задания на позицию Frontend React Developer. Приложение реализует полный цикл обмена текстовыми сообщениями с использованием технологии HTTP Polling.

## 🛠 Технологический стек

*   **Frontend:** React, Hooks (useState, useEffect, useRef), Axios
*   **Backend:** Node.js, Express (используется как прокси-сервер)
*   **API:** Green-API (WhatsApp)
*   **Сборка:** Create React App

## 📋 Предварительные требования

Для локального запуска вам понадобятся:
1.  Установленный **Node.js** (версия 14+) и **npm**.
2.  Аккаунт в [Green-API](https://green-api.com/) с активным инстансом WhatsApp.

## 🚀 Локальный запуск

### 1. Клонирование и установка зависимостей
```bash
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ>
cd swill-chat
npm install
