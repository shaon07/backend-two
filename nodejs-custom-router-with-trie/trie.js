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

module.exports = Trie;
