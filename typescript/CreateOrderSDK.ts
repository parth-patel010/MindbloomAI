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

// Example usage with your production URL:
const sdk = new CreateOrderSDK('https://vision2submit.com');

const orderPayload = {
  customer_mobile: "8145344963",
  user_token: "2e14002188f1ae07426c32655ddee9af",
  amount: "1",
  order_id: "8787772321800",
  redirect_url: "https://mindbloomai.vercel.app/payment-success", // Your production website
  remark1: "testremark",
  remark2: "testremark2"
};
