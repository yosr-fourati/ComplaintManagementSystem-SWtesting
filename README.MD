# ComplaintManagementSystem-SWtesting

A backend REST API for a Content Management System built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- npm

## Installation

1. Clone the repository
2. Install dependencies:
```bash
   npm install
```
3. Create a `.env` file in the root directory with the following variables:
MONGO_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_jwt_secret
PORT=3000

## Running the App
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Running Tests
```bash
npm test
```

Test results are generated in `jest-report.html`.

## License

MIT