const http = require("http"); // Import Node.js built-in module to create the HTTP server
const url = require("url");   // Import module to parse request URLs
const Trie = require("./trie"); // Import custom Trie class

class Router {
  constructor() {
    // Each HTTP method gets its own Trie for fast route matching
    this.routes = {
      GET: new Trie(),       // Routes like GET /home, /about, etc.
      POST: new Trie(),      // Routes like POST /submit, etc.
      PUT: new Trie(),       // Routes like PUT /profile
      DELETE: new Trie(),    // Routes like DELETE /account
      PATCH: new Trie(),     // Routes like PATCH /item/123
      OPTIONS: new Trie(),   // Routes for CORS pre-flight
      HEAD: new Trie(),      // Routes for header-only requests
    };
    this.middlewares = []; // Store middleware functions to run before routes
  }

  use(middleware) {
    // Example: router.use((req, res, next) => { console.log(req.url); next(); })
    this.middlewares.push(middleware); // Add a middleware to the stack
  }

  register(method, path, handler) {
    // Example: this.register("GET", "/user/:id", handler)
    this.routes[method.toUpperCase()].insert(path, handler); // Insert route into appropriate Trie
  }

  get(path, handler)    { this.register("GET", path, handler); }     // router.get("/", fn)
  post(path, handler)   { this.register("POST", path, handler); }   // router.post("/form", fn)
  put(path, handler)    { this.register("PUT", path, handler); }    // router.put("/edit", fn)
  delete(path, handler) { this.register("DELETE", path, handler); } // router.delete("/item", fn)
  patch(path, handler)  { this.register("PATCH", path, handler); }  // router.patch("/patch", fn)
  options(path, handler){ this.register("OPTIONS", path, handler); } // router.options("/cors", fn)
  head(path, handler)   { this.register("HEAD", path, handler); }    // router.head("/header", fn)

  handle(req, res) {
    const parsedUrl = url.parse(req.url, true); // Example: "http://localhost:3000/user/123" → pathname: "/user/123"
    const method = req.method;                 // e.g., GET, POST
    const path = parsedUrl.pathname;           // e.g., "/user/123"

    // Recursively run middlewares before route is processed
    const nextMiddleware = (i) => {
      if (i < this.middlewares.length) {
        // Run middleware[i] with next callback
        this.middlewares[i](req, res, () => nextMiddleware(i + 1));
      } else {
        // All middleware done, now match and handle route
        this.processRoutes(method, path, req, res);
      }
    };

    nextMiddleware(0); // Start middleware pipeline
  }

  processRoutes(method, path, req, res) {
    const trie = this.routes[method]; // Retrieve the correct Trie based on method (e.g., GET → this.routes.GET)
    const result = trie?.search(path); // Search for path inside Trie, including param matching

    if (result) {
      req.params = result.params || {};         // Example: "/user/123" matched against "/user/:id" → req.params.id = "123"
      result.handler(req, res);                 // Call matched route's handler function
    } else {
      res.writeHead(404);                       // Respond with 404 if route not found
      res.end(`Cannot ${method} ${path}`);      // Error message with method and path
    }
  }
}

module.exports = Router; // Export the Router class for external use