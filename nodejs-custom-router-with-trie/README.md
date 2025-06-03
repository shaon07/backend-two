# Build Your Own Express-Like Router Using Trie (Complete Guide)

In this guide, we’ll walk through building a custom Express-style router in Node.js from scratch — powered by the Trie data structure.

## ✨ Features

- Custom router built using Trie
- Supports nested and dynamic routes
- Middleware functionality like Express
- Lightweight and efficient

## 📘 What is a Trie?

A Trie (short for reTRIEval) is a tree-like data structure commonly used for efficient retrieval of strings, especially when dealing with prefixes. Unlike objects or maps that store whole strings as keys, a Trie breaks down each string into parts and stores them in a hierarchy — one level per character (or segment).

### 🧠 Real-World Need

Imagine you're building an autocomplete feature:

- As a user types "ca", your system should suggest "car", "cat", "cart", etc.
- Scanning a full list every time is inefficient.
- A Trie enables you to traverse just the "c" → "a" path, then collect all completions from there.

Another example is a spell checker:

- You want to validate if a given word exists.
- Tries let you verify efficiently by walking down its character path.

### 📂 Analogy

Think of a Trie like nested folders:

- The word "cat" becomes: `c` → `a` → `t`
- "car" shares part of the same path: `c` → `a` → `r`
- You avoid duplicating common prefixes

### 🧮 Why Not Use an Array or Object?

- A regular object or array needs to scan through keys or full strings.
- A Trie allows you to step through one character at a time, ensuring fast and scalable lookups.

### ✅ Use Cases

- Autocomplete systems
- Spell checkers
- IP routing tables
- Predictive text inputs
- DNA sequence lookup

Let’s now look at the Trie structure and code in JavaScript.

```
c
└── a
    ├── r (isEnd)
    │   └── t (isEnd)
    └── t (isEnd)
```

Each line explained:

- `c → a → r (isEnd)` → This path stores the word "car", ending at 'r'.
- `r → t (isEnd)` → Extends from 'r' to 't' to store "cart".
- `a → t (isEnd)` → From 'a' directly to 't' stores "cat", using the same 'c' and 'a' nodes as above.

Object format:

```js
{
  c: {
    a: {
      r: {
        isEndWord: true, // marks end of "car"
        t: {
          isEndWord: true // marks end of "cart"
        }
      },
      t: {
        isEndWord: true // marks end of "cat"
      }
    }
  }
}
```

## 🧱 Trie Implementation in JavaScript

```js
class TrieNode {
  constructor() {
    this.children = {};
    this.handler = null;
    this.isEnd = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode(); // Create a root node to start all paths
  }

  insert(path, handler) {
    const parts = path.split("/").filter(Boolean); // Split path like '/user/:id/settings' → ['user', ':id', 'settings']
    let node = this.root; // Start at the root node

    for (const part of parts) {
      let segment = part; // Use the current part of the path

      if (part.startsWith(":")) {
        // It's a dynamic segment like ':id'
        segment = ":param"; // Normalize dynamic segments
        if (!node.children[segment]) {
          node.children[segment] = new TrieNode(); // Create node for dynamic segment
          node.children[segment].paramName = part.slice(1); // Store the parameter name, e.g., 'id'
        }
      }

      if (!node.children[segment]) {
        node.children[segment] = new TrieNode(); // Create node for static segment if it doesn't exist
      }

      node = node.children[segment]; // Move to the child node
    }

    node.isEnd = true; // Mark the end of a valid path
    node.handler = handler; // Attach the handler for this path
  }

  search(path) {
    const parts = path.split("/").filter(Boolean); // Example: '/user/123/settings' → ['user', '123', 'settings']
    let node = this.root; // Start at the root
    const params = {}; // To collect dynamic parameters

    for (const part of parts) {
      if (node.children[part]) {
        node = node.children[part]; // Move down static segment
      } else if (node.children[":param"]) {
        const paramNode = node.children[":param"];
        const paramName = paramNode.paramName || "param";
        params[paramName] = part; // Capture the value from path
        node = paramNode; // Move to param node
      } else {
        return null; // No match found
      }
    }

    if (node.isEnd) {
      return { handler: node.handler, params }; // Return handler and params if matched
    }

    return null; // No complete match
  }
}
```

## 📡 Router Design: Principles, Architecture & Implementation

The Router acts as a traffic controller in your Node.js app — it decides what code should respond to a given HTTP request. Inspired by Express, our goal is to support:

- RESTful methods (GET, POST, PUT, DELETE...)
- Nested paths
- Dynamic parameters (e.g. /user/:id)
- Middleware support

By using a Trie structure internally, our router enables fast path matching while sharing common prefixes across routes.

### 🧬 Anatomy of the Router Class

- `this.routes`: Object mapping each HTTP verb to its own Trie instance.
- `this.middlewares`: Array of middleware functions to run before routing logic.

### 🔗 Registering Routes

Each route (method + path) is inserted into the corresponding Trie:

```js
this.routes[method.toUpperCase()].insert(path, handler); // Insert route into Trie for the method
```

Paths are broken into segments — e.g., `/user/:id/settings` becomes `["user", ":id", "settings"]`, where `:id` is stored as a dynamic param node.

### 🌀 Middleware Flow

We mimic Express’s `next()` pattern. Each middleware receives `(req, res, next)`:

```js
const nextMiddleware = (i) => {
  if (i < this.middlewares.length) {
    // If there's another middleware to run, call it with next
    this.middlewares[i](req, res, () => nextMiddleware(i + 1)); // Execute current middleware
  } else {
    this.processRoutes(method, path, req, res); // If no more middleware, match and handle route
  }
};
```

### 🧠 Route Matching Logic

We defer to the Trie’s `search()` method, which gives us both the handler and any extracted params:

```js
const result = trie?.search(path); // Search Trie for matching route handler and params
if (result) {
  req.params = result.params;
  result.handler(req, res); // Call the matched route handler
}
```

---

## 🧱 Router Implementation (Full Code with Trie Integration)

Below is the full source code for the custom Router class, followed by a line-by-line explanation so you can understand its structure, control flow, and purpose.

```js
const http = require("http"); // core Node.js module for creating servers
const url = require("url"); // module to parse request URLs

class Router {
  constructor() {
    // For each HTTP verb, store a dedicated Trie instance
    this.routes = {
      // Each HTTP method gets its own Trie instance for route matching
      GET: new Trie(),
      POST: new Trie(),
      PUT: new Trie(),
      DELETE: new Trie(),
      PATCH: new Trie(),
      OPTIONS: new Trie(),
      HEAD: new Trie(),
    };
    // Middleware functions are stored in order
    this.middlewares = []; // Stores middleware functions to run before route handler
  }

  // Add middleware to the pipeline
  use(middleware) {
    this.middlewares.push(middleware); // Add a middleware to the list
  }

  // Register route handler to corresponding Trie
  register(method, path, handler) {
    this.routes[method.toUpperCase()].insert(path, handler);
  }

  // Shorthand methods for each HTTP verb
  get(path, handler) {
    this.register("GET", path, handler);
  }
  post(path, handler) {
    this.register("POST", path, handler);
  }
  put(path, handler) {
    this.register("PUT", path, handler);
  }
  delete(path, handler) {
    this.register("DELETE", path, handler);
  }
  patch(path, handler) {
    this.register("PATCH", path, handler);
  }
  options(path, handler) {
    this.register("OPTIONS", path, handler);
  }
  head(path, handler) {
    this.register("HEAD", path, handler);
  }

  // Main handler invoked on every HTTP request
  handle(req, res) {
    const parsedUrl = url.parse(req.url, true); // Parse incoming request URL into pathname and query // parse full URL
    const method = req.method; // Extract HTTP method (GET, POST, etc.)
    const path = parsedUrl.pathname; // Extract path part of the URL (e.g., '/user/123')

    // Recursively run middlewares, then route matching
    const nextMiddleware = (i) => {
      if (i < this.middlewares.length) {
        this.middlewares[i](req, res, () => nextMiddleware(i + 1));
      } else {
        this.processRoutes(method, path, req, res);
      }
    };

    nextMiddleware(0);
  }

  // Route matching logic using the corresponding Trie
  processRoutes(method, path, req, res) {
    const trie = this.routes[method]; // Retrieve the Trie for the given HTTP method // retrieve Trie for HTTP verb
    const result = trie?.search(path); // search for matching handler

    if (result) {
      req.params = result.params || {}; // Attach route parameters (e.g., from ':id') to request // attach dynamic params
      result.handler(req, res); // invoke handler
    } else {
      res.writeHead(404); // Set response status code to 404 if no route matched
      res.end(`Cannot ${method} ${path}`); // Send not found message // fallback if no match
    }
  }
}

module.exports = Router;
```

### 📖 Line-by-Line Explanation

- const http = require("http"); — Loads Node's built-in HTTP module to create a server.
- const url = require("url"); — Parses the URL string of incoming requests.

#### Router class

- `constructor()` — Initializes the router with empty Tries for each HTTP method and an empty middleware list.
- `this.routes` — Maps HTTP methods to a separate Trie for storing route paths and handlers.
- `this.middlewares` — Stores an array of functions to execute before the route handler.

#### Middleware

- `use(middleware)` — Adds a middleware function to be executed for every request.

#### Route registration

- `register(method, path, handler)` — Inserts a route into the appropriate Trie using the given method.
- `get/post/put/...` — Convenience methods that call `register()` for the appropriate HTTP method.

#### Request handling

- `handle(req, res)` — Entry point for routing:

  - Parses the URL and method
  - Starts middleware execution using `nextMiddleware(0)`

- `nextMiddleware(i)` — Recursively calls each middleware in order. Calls `processRoutes()` after all middleware completes.

#### Route matching

- `processRoutes(method, path, req, res)` —
  - Looks up the route in the Trie
  - Attaches extracted parameters to `req.params`
  - Executes the matched handler or sends a 404 response

````
```js
const http = require("http"); // Import Node.js built-in module to create the HTTP server
const url = require("url");   // Import module to parse request URLs

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
;
````

## 🧪 Using the Router in a Node App

Let's walk through the code that uses our custom Router, explaining each line.

Here’s how to integrate your custom Router into a real Node.js application. We’ll define a server, attach middleware, register routes, and handle nested and dynamic paths — just like Express!

```js
const http = require("http"); // Load Node.js HTTP module
const Router = require("./Router"); // Import our custom Router class

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

http
  .createServer((req, res) => router.handle(req, res))
  .listen(3000, () => {
    // Server is now listening and routing requests using the custom Router
    console.log("Server running at http://localhost:3000"); // Confirm server is live
  });
```
