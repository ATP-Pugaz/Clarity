const express = require('express');
const cors = require('cors');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

// 1. CORS Configuration
// During development, you can use app.use(cors()); 
// For production, use your specific Vercel URL:
app.use(cors({
    origin: "https://clarity-wealth-builder.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// 2. Body Parsers (Required for Excel imports/JSON data)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Health Check Route (Helps Render monitor your app)
app.get("/", (req, res) => {
    res.send("Money Manager API is running... 🚀");
});

// 4. Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);

// 5. Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

module.exports = app;
