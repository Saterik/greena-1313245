import axios from 'axios';

class GreenApiService {
  constructor(idInstance, apiTokenInstance, apiUrl) {
    this.idInstance = idInstance;
    this.apiTokenInstance = apiTokenInstance;
    this.apiUrl = apiUrl || 'https://api.green-api.com';
  }

  formatChatId(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    return `${cleanNumber}@c.us`;
  }

  // Проверка состояния инстанса (для авторизации)
  async checkAuth() {
    try {
      const response = await axios.get(
        `${this.apiUrl}/waInstance${this.idInstance}/getStateInstance/${this.apiTokenInstance}`
      );
      return response.data.stateInstance === 'authorized';
    } catch (error) {
      return false;
    }
  }

  async sendMessage(phoneNumber, message) {
    const chatId = this.formatChatId(phoneNumber);
    const response = await axios.post(
      `${this.apiUrl}/waInstance${this.idInstance}/sendMessage/${this.apiTokenInstance}`,
      { chatId, message }
    );
    return response.data;
  }

  async receiveNotification() {
    try {
      const response = await axios.get(
        `${this.apiUrl}/waInstance${this.idInstance}/receiveNotification/${this.apiTokenInstance}`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 204) return null;
      return null;
    }
  }

  async deleteNotification(receiptId) {
    try {
      // Передаем receiptId прямо в URL, как в документации Green API
      await axios.delete(
        `${this.apiUrl}/waInstance${this.idInstance}/deleteNotification/${this.apiTokenInstance}/${receiptId}`
      );
    } catch (error) {
      console.error('Ошибка удаления уведомления:', error);
    }
  }
}

export default GreenApiService;