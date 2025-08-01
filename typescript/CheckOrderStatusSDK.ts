import axios, { AxiosResponse } from 'axios';

interface CheckOrderStatusRequest {
  user_token: string;
  order_id: string;
}

interface CheckOrderStatusResponse {
  status: string;
  message: string;
  result?: {
    txnStatus: string;
    resultInfo: string;
    orderId: string;
    status: string;
    amount: string;
    date: string;
    utr: string;
  };
}

class CheckOrderStatusSDK {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async checkOrderStatus(request: CheckOrderStatusRequest): Promise<CheckOrderStatusResponse> {
    try {
      const response: AxiosResponse<CheckOrderStatusResponse> = await axios.post(
        `${this.baseUrl}/api/check-order-status`,
        request,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || error.message;
      }
      throw error instanceof Error ? error.message : String(error);
    }
  }
}

// Example usage with your production setup:
const sdk = new CheckOrderStatusSDK('https://vision2submit.com'); // Payment gateway URL

const request: CheckOrderStatusRequest = {
  user_token: '2048f66bef68633fa3262d7a398ab577',
  order_id: '8052313697',
};

sdk.checkOrderStatus(request)
  .then((response: CheckOrderStatusResponse) => {
    console.log('Success Response:', response);
  })
  .catch((error: any) => {
    console.error('Error:', error);
  });
