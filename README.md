# Scout Payment Backend Service

A secure, dedicated payment processing service for the Scout Mobile App, handling subscription management, and Stripe integration. This backend service operates independently from the main Appwrite backend to ensure PCI DSS compliance and security isolation.

## 🎯 Service Purpose

This backend service exclusively handles:
- **Payment Processing**: Recurring payments
- **Subscription Management**: Recurring rental payments
- **Stripe Integration**: Complete Stripe payment flow management
- **Payment Security**: PCI DSS compliant payment data handling
- **Financial Webhooks**: Real-time payment status updates

## 🚀 Features

### **Payment Processing**
- Recurring payment setup for monthly rent collection
- Multiple payment method support (cards, digital wallets)
- Payment refund and partial refund handling
- Automatic billing cycle handling

### **Security & Compliance**
- PCI DSS Level 1 compliance through Stripe
- Encrypted payment data storage
- Secure API endpoints with rate limiting
- Payment fraud detection integration
- Audit logging for all financial transactions

### **Integration Features**
- Stripe webhook event processing
- Real-time payment status synchronization with Appwrite
- Failed payment retry logic with exponential backoff

## 💻 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with Helmet security middleware
- **Payment Provider**: Stripe API
- **Database**: MongoDB with payment-specific schema
- **Security**: bcrypt, rate-limiting, CORS, input validation

## 📁 Project Structure

```
/
├── controllers/           # Payment route handlers
│   ├── paymentController.js
│   └── webhookController.js
├── routes/                # API route definitions
│   ├── payment.js
│   └── webhook.js
├── services/              # Business logic services
│   ├── stripe.js
│   └── database.js
├── .env.example           # Environment template
├── server.js              # Express app configuration
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- MongoDB
- Stripe account with API keys

### Local Development Setup

1. **Clone and Install**:
```bash
git clone https://github.com/rr789451/scout-backend.git
cd scout-backend
npm install
```

2. **Environment Configuration**:
```bash
cp .env.example .env
```

3. **Configure Environment Variables**:
```env
PORT=8080

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID=your-properties-collection-id
EXPO_PUBLIC_APPWRITE_SUBSCRIPTIONSS_COLLECTION_ID=your-subscriptions-collection-id
EXPO_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID=your-payments-collection-id
EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID=your-users-collection-id
```

4. **Start Development Server**:
```bash
npm start
```

## 💾 Database Schema

### Subscriptions Collection
```typescript
interface Subscriptions {
  userId: string;
  propertyId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: enum;
  paymentMethodId: string;
  currency: string;
  startDate: Date;
  nextBillingDate: Date;
  endDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt: Date;
  metadata: string;
  stripePriceId: string;
  amount: Integer;
}
```

### Payments Collection
```typescript
interface Payments {
  userId: string;
  propertyId: string;
  subscriptionId: string;
  paymentIntentId: string;
  invoiceId: string;
  amount: Integer;
  currency: string;
  status: enum;
  paymentMethod: string;
  paymentDate: Date;
  failureReason: string;
  metadata: string;
}
```

## 🧪 Testing

### **Test Stripe Cards**
```typescript
// Successful payment
const testCardSuccess = '4242424242424242';

// Payment declined
const testCardDeclined = '4000000000000002';

// Insufficient funds
const testCardInsufficientFunds = '4000000000009995';
```

## 🔄 Integration with Main App

### **Payment Flow Integration**
1. **Mobile App** → Calls payment backend for processing
2. **Payment Backend** → Processes with Stripe
3. **Stripe Webhook** → Updates payment status
4. **Payment Backend** → Syncs status with Appwrite
5. **Mobile App** → Receives real-time updates via Appwrite

## 🔮 Future Enhancements

### **Phase 2 Development**
1. **Multi-tenant Support**
   - Agency-specific payment processing
   - White-label payment solutions
   - Custom branding for payment flows

2. **Enhanced Analytics**
   - Real-time payment dashboard
   - Fraud detection and prevention
   - Revenue forecasting and reporting
   - Payment method optimization insights

## 🤝 Contributing

- Fork the repository
- Create a feature branch
```bash
git checkout -b feature/YourFeature
```
- Commit changes
```bash
git commit -m 'Add some feature'
```
- Push to the branch
```bash
git push origin feature/YourFeature
```
- Open a Pull Request

## 📝 License

This project is licensed under the [MIT License](LICENSE).

## 🆘 Support

For support, please:
- Open an issue in the GitHub repository
- Contact me at [Rohit](mailto:rr789451@gmail.com)

## ✨ Acknowledgments

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Stripe](https://img.shields.io/badge/Stripe-2023.10-008CDD?style=for-the-badge&logo=stripe)](https://stripe.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6%2B-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)