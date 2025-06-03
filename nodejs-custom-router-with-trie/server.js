const http = require("http"); // Load Node.js HTTP module
const Router = require("./router"); // Import our custom Router class

const router = new Router(); // Create a new instance of our Router

// Global middleware for logging each request method and path
router.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`); // Log method and URL
  next(); // Continue to next middleware or route handler
});

// Home route - responds to GET /
router.get("/", (req, res) => {
  res.end("Home Page");
});

// About page route - responds to GET /about
router.get("/about", (req, res) => {
  res.end("About Page");
});

// Handle form submission via POST /submit
router.post("/submit", (req, res) => {
  res.end("Submitted");
});

// Handle profile update via PUT /profile
router.put("/profile", (req, res) => {
  res.end("Profile Updated");
});

// Handle account deletion via DELETE /account
router.delete("/account", (req, res) => {
  res.end("Account Deleted");
});

// Nested route example: /user/profile/settings
router.get("/user/profile/settings", (req, res) => {
  res.end("User Settings Page");
});

// Dynamic route: /user/:id → captures `id` as param
router.get("/user/:id", (req, res) => {
  const userId = req.params.id; // Access dynamic param parsed by Trie
  res.end(`User ID: ${userId}`); // Respond with captured ID
});

http.createServer((req, res) => router.handle(req, res)).listen(3000, () => {
  // Server is now listening and routing requests using the custom Router
    console.log("Server running at http://localhost:3000"); // Confirm server is live
});