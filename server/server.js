// 🚀 BACKEND RUN: node server.js
// 🚀 SCALE (PM2 Background): npm i -g pm2; pm2 start server.js --name "moneymanager-api"
// 🚀 DOCKER (Container): docker build -t moneymanager-api .
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});


app.listen(PORT, () => {
    console.log(`
🚀 Money Manager Backend is running!
📍 URL: http://localhost:${PORT}
✅ Import: POST /api/transactions/import
✅ Export: GET /api/transactions/export?format=excel|pdf
    `);
});
