const app = require('./app');

// Render automatically assigns a PORT, so process.env.PORT is critical
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`
🚀 Money Manager Backend is running!
📍 Port: ${PORT}
✅ Health Check: GET /
✅ Import: POST /api/transactions/import
✅ Export: GET /api/transactions/export?format=excel|pdf
    `);
});
