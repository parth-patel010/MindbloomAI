import { Request, Response } from 'express';

// Assuming you are using an Express.js server

const handleWebhook = (req: Request, res: Response): void => {
  if (req.method === 'POST') {
    // Retrieve the data sent by the webhook
    const { status, order_id, remark1 } = req.body;

    // Check if the status is "SUCCESS"
    if (status === 'SUCCESS') {
      // Process the data here as needed
      // For example, log it or perform other actions

      // Respond to the webhook with a success message
      res.status(200).send('Webhook received successfully');
    } else {
      // Respond with an error message if the status is not "SUCCESS"
      res.status(400).send(`Invalid status: ${status}`);
    }

    // You may want to add additional error handling and security measures here
  } else {
    res.status(400).send('Invalid request method');
  }
};

// Example usage with Express.js for production
import express from 'express';
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Enable JSON request body parsing

app.post('/webhook', handleWebhook);

app.listen(port, () => {
  console.log(`Webhook server is listening on port ${port}`);
  console.log(`Your production website: https://mindbloomai.vercel.app`);
  console.log(`Payment gateway: https://vision2submit.com`);
});
