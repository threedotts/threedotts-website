# How AI Agent Custom Tools Work - Complete Example

## 1. Website Owner Defines Custom Tools

```javascript
// Website owner adds this to their site
window.threedottsWidget.clientTools = {
  addProductToCart: function(parameters) {
    const { productId } = parameters;
    // Custom logic here
    return "Product added to cart successfully";
  },
  
  getProductInfo: function(parameters) {
    const { productId } = parameters;
    // Custom logic here
    return "Product info: Gaming Laptop - $999.99";
  }
};
```

## 2. AI Agent Configuration (ElevenLabs Side)

In the ElevenLabs console, the AI agent is configured with tools:

```json
{
  "tools": [
    {
      "name": "addProductToCart",
      "description": "Add a product to the user's shopping cart",
      "parameters": {
        "type": "object",
        "properties": {
          "productId": {
            "type": "string",
            "description": "The ID of the product to add to cart"
          }
        },
        "required": ["productId"]
      }
    },
    {
      "name": "getProductInfo", 
      "description": "Get detailed information about a product",
      "parameters": {
        "type": "object",
        "properties": {
          "productId": {
            "type": "string",
            "description": "The ID of the product to get info for"
          }
        },
        "required": ["productId"]
      }
    }
  ]
}
```

## 3. Complete Flow Example

### User Says: "Add the laptop to my cart"

**Step 1: AI Agent Decision**
```
AI thinks: "User wants to add laptop to cart. I need to:
1. Find the laptop product ID
2. Use addProductToCart tool"
```

**Step 2: AI Agent Calls Tool**
```json
{
  "type": "client_tool_call",
  "client_tool_call_event": {
    "tool_call_id": "call_123456", 
    "tool_name": "addProductToCart",
    "parameters": {
      "productId": "123"
    }
  }
}
```

**Step 3: Widget Receives & Executes**
```javascript
// Widget receives the message and executes:
const result = window.threedottsWidget.clientTools.addProductToCart({
  productId: "123"
});
// result = "Successfully added Gaming Laptop ($999.99) to cart. Cart now has 1 items."
```

**Step 4: Widget Sends Result Back**
```json
{
  "type": "client_tool_result",
  "tool_call_id": "call_123456",
  "result": "Successfully added Gaming Laptop ($999.99) to cart. Cart now has 1 items."
}
```

**Step 5: AI Agent Responds to User**
```
AI: "Great! I've added the Gaming Laptop to your cart for $999.99. Your cart now has 1 item."
```

## 4. Complex Example: Multi-Step Tool Usage

### User Says: "What's the most expensive product and add it to my cart?"

**Step 1: Get Product Info**
```json
{
  "type": "client_tool_call", 
  "client_tool_call_event": {
    "tool_call_id": "call_001",
    "tool_name": "getProductInfo",
    "parameters": {"productId": "123"}
  }
}
```

**Response:** "Product: Gaming Laptop, Price: $999.99, Description: High-performance gaming laptop"

**Step 2: Check Other Products**
```json
{
  "type": "client_tool_call",
  "client_tool_call_event": {
    "tool_call_id": "call_002", 
    "tool_name": "getProductInfo",
    "parameters": {"productId": "456"}
  }
}
```

**Response:** "Product: Gaming Mouse, Price: $49.99, Description: RGB gaming mouse"

**Step 3: Add Most Expensive**
```json
{
  "type": "client_tool_call",
  "client_tool_call_event": {
    "tool_call_id": "call_003",
    "tool_name": "addProductToCart", 
    "parameters": {"productId": "123"}
  }
}
```

**Response:** "Successfully added Gaming Laptop ($999.99) to cart"

**Step 4: AI Final Response**
```
AI: "I checked your products and found that the Gaming Laptop at $999.99 is the most expensive. I've added it to your cart!"
```

## 5. Key Points

1. **AI Agent Doesn't Know Implementation**: The AI only knows tool names, descriptions, and parameters
2. **Website Controls Execution**: The actual logic runs on the customer's website with full access to their systems
3. **Bidirectional Communication**: Tools can return results that the AI uses to inform the user
4. **Context Aware**: AI can chain multiple tool calls to accomplish complex tasks
5. **Secure**: Tools execute in the customer's domain, not on your servers

## 6. Tool Configuration Best Practices

```javascript
// Good: Clear, specific tools
window.threedottsWidget.clientTools = {
  // ✅ Specific action with clear parameters
  addToCart: (params) => { /* ... */ },
  
  // ✅ Information retrieval  
  getOrderStatus: (params) => { /* ... */ },
  
  // ✅ UI interaction
  showProductDetails: (params) => { /* ... */ }
};

// Avoid: Vague or overly broad tools
window.threedottsWidget.clientTools = {
  // ❌ Too vague
  doSomething: (params) => { /* ... */ },
  
  // ❌ Too broad - should be split into specific tools
  handleEverything: (params) => { /* ... */ }
};
```

This architecture allows for unlimited customization while keeping the AI agent simple and focused on understanding user intent rather than implementation details.