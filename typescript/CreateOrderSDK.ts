import axios from 'axios';

class CreateOrderSDK {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://vision2submit.com') {
    this.baseUrl = baseUrl;
  }

  async createOrder(payload: {
    customer_mobile: string;
    user_token: string;
    amount: string;
    order_id: string;
    redirect_url: string;
    remark1: string;
    remark2: string;
  }): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/create-order`, payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return error.response?.data;
      } else {
        return { status: false, message: 'Unexpected error occurred' };
      }
    }
  }
}

export default CreateOrderSDK;
