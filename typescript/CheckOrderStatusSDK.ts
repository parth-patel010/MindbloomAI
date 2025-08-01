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

export default CheckOrderStatusSDK;
