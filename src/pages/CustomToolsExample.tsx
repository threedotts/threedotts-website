import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";

const CustomToolsExample = () => {
  useEffect(() => {
    // Load the widget script
    const script = document.createElement('script');
    script.src = 'https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script?organizationId=1e926240-b303-444b-9f8c-57abd9fa657b&v=46';
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Widget script loaded successfully');
      // Configure widget with custom tools
      setTimeout(() => {
        if ((window as any).threedottsWidget) {
          (window as any).threedottsWidget.configure({
            organizationId: '1e926240-b303-444b-9f8c-57abd9fa657b'
          });
          
          // Define custom tools for AI agent
          (window as any).threedottsWidget.clientTools = {
            
            // Tool 1: Add product to cart
            addProductToCart: function(parameters: any) {
              console.log('🛒 AI called addProductToCart with:', parameters);
              
              const { productId } = parameters;
              if (!productId) {
                return 'Error: Product ID required';
              }
              
              const productElement = document.querySelector(`[data-product-id="${productId}"]`);
              if (!productElement) {
                return `Error: Product ${productId} not found`;
              }
              
              const productName = productElement.getAttribute('data-product-name');
              const price = productElement.getAttribute('data-price');
              
              // Add to cart (simulate)
              const cart = JSON.parse(localStorage.getItem('demoCart') || '[]');
              cart.push({ id: productId, name: productName, price });
              localStorage.setItem('demoCart', JSON.stringify(cart));
              
              // Update cart display
              updateCartDisplay();
              showNotification(`AI added ${productName} to your cart!`);
              
              return `Successfully added ${productName} ($${price}) to cart. Cart now has ${cart.length} items.`;
            },
            
            // Tool 2: Get product information
            getProductInfo: function(parameters: any) {
              console.log('📋 AI called getProductInfo with:', parameters);
              
              const { productId } = parameters;
              if (!productId) {
                return 'Error: Product ID required';
              }
              
              const productElement = document.querySelector(`[data-product-id="${productId}"]`);
              if (!productElement) {
                return `Product ${productId} not found`;
              }
              
              const name = productElement.getAttribute('data-product-name');
              const price = productElement.getAttribute('data-price');
              const description = productElement.querySelector('.product-description')?.textContent;
              
              return `Product: ${name}, Price: $${price}, Description: ${description}`;
            },
            
            // Tool 3: Show cart contents
            showCartContents: function(parameters: any) {
              console.log('🛍️ AI called showCartContents');
              
              const cart = JSON.parse(localStorage.getItem('demoCart') || '[]');
              
              if (cart.length === 0) {
                return 'Your cart is empty';
              }
              
              const total = cart.reduce((sum: number, item: any) => sum + parseFloat(item.price), 0);
              const itemsList = cart.map((item: any) => `${item.name} ($${item.price})`).join(', ');
              
              return `Cart contains ${cart.length} items: ${itemsList}. Total: $${total.toFixed(2)}`;
            },
            
            // Tool 4: Clear cart
            clearCart: function(parameters: any) {
              console.log('🗑️ AI called clearCart');
              
              const cart = JSON.parse(localStorage.getItem('demoCart') || '[]');
              const itemCount = cart.length;
              
              localStorage.setItem('demoCart', '[]');
              updateCartDisplay();
              showNotification('Cart cleared by AI assistant');
              
              return `Cleared ${itemCount} items from cart`;
            },
            
            // Tool 5: Highlight product
            highlightProduct: function(parameters: any) {
              console.log('✨ AI called highlightProduct with:', parameters);
              
              const { productId } = parameters;
              if (!productId) {
                return 'Error: Product ID required';
              }
              
              const productElement = document.querySelector(`[data-product-id="${productId}"]`);
              if (!productElement) {
                return `Product ${productId} not found`;
              }
              
              // Remove previous highlights
              document.querySelectorAll('.highlight-product').forEach(el => {
                el.classList.remove('highlight-product');
              });
              
              // Add highlight
              productElement.classList.add('highlight-product');
              
              // Auto-remove highlight after 5 seconds
              setTimeout(() => {
                productElement.classList.remove('highlight-product');
              }, 5000);
              
              // Scroll to product
              productElement.scrollIntoView({ behavior: 'smooth' });
              
              const productName = productElement.getAttribute('data-product-name');
              return `Highlighted and scrolled to ${productName}`;
            }
          };
          
          console.log('✅ Custom tools configured:', Object.keys((window as any).threedottsWidget.clientTools));
        }
      }, 500);
    };
    
    document.head.appendChild(script);
    
    // Helper functions
    (window as any).updateCartDisplay = updateCartDisplay;
    (window as any).showNotification = showNotification;
    (window as any).addToCart = addToCart;
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);
  
  const updateCartDisplay = () => {
    const cart = JSON.parse(localStorage.getItem('demoCart') || '[]');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (cartItems && cartTotal) {
      if (cart.length === 0) {
        cartItems.innerHTML = 'No items in cart';
        cartTotal.innerHTML = 'Total: $0.00';
      } else {
        cartItems.innerHTML = cart.map((item: any) => 
          `<div class="cart-item">${item.name} - $${item.price}</div>`
        ).join('');
        
        const total = cart.reduce((sum: number, item: any) => sum + parseFloat(item.price), 0);
        cartTotal.innerHTML = `Total: $${total.toFixed(2)}`;
      }
    }
  };
  
  const showNotification = (message: string) => {
    const notification = document.getElementById('notification');
    if (notification) {
      notification.textContent = message;
      notification.className = 'notification show';
      setTimeout(() => {
        notification.className = 'notification';
      }, 3000);
    }
  };
  
  const addToCart = (productId: string) => {
    const productElement = document.querySelector(`[data-product-id="${productId}"]`);
    if (productElement) {
      const name = productElement.getAttribute('data-product-name');
      const price = productElement.getAttribute('data-price');
      
      const cart = JSON.parse(localStorage.getItem('demoCart') || '[]');
      cart.push({ id: productId, name, price });
      localStorage.setItem('demoCart', JSON.stringify(cart));
      
      updateCartDisplay();
      showNotification(`${name} added to cart!`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <style>{`
        .product {
          border: 1px solid hsl(var(--border));
          padding: 20px;
          margin: 15px 0;
          border-radius: 8px;
          background: hsl(var(--card));
        }
        .cart {
          background: hsl(var(--muted));
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }
        .cart-item {
          padding: 5px 0;
          border-bottom: 1px solid hsl(var(--border));
        }
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          padding: 15px;
          border-radius: 8px;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          z-index: 1000;
        }
        .notification.show {
          transform: translateX(0);
        }
        .highlight-product {
          outline: 3px solid hsl(var(--destructive)) !important;
          outline-offset: 2px;
        }
        .product-description {
          color: hsl(var(--muted-foreground));
          margin: 10px 0;
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Custom AI Tools Demo - E-commerce Site</h1>
        
        {/* Sample Products */}
        <div className="product" data-product-id="123" data-product-name="Gaming Laptop" data-price="999.99">
          <h3 className="text-2xl font-semibold mb-2">Gaming Laptop</h3>
          <p className="text-xl mb-2">Price: $999.99</p>
          <p className="product-description">High-performance gaming laptop with RTX 4080</p>
          <Button onClick={() => addToCart('123')} className="mt-4">Add to Cart</Button>
        </div>
        
        <div className="product" data-product-id="456" data-product-name="Gaming Mouse" data-price="49.99">
          <h3 className="text-2xl font-semibold mb-2">Gaming Mouse</h3>
          <p className="text-xl mb-2">Price: $49.99</p>
          <p className="product-description">RGB gaming mouse with 12000 DPI</p>
          <Button onClick={() => addToCart('456')} className="mt-4">Add to Cart</Button>
        </div>
        
        <div className="product" data-product-id="789" data-product-name="Mechanical Keyboard" data-price="129.99">
          <h3 className="text-2xl font-semibold mb-2">Mechanical Keyboard</h3>
          <p className="text-xl mb-2">Price: $129.99</p>
          <p className="product-description">Cherry MX switches with RGB backlighting</p>
          <Button onClick={() => addToCart('789')} className="mt-4">Add to Cart</Button>
        </div>
        
        {/* Cart Display */}
        <div className="cart">
          <h3 className="text-xl font-semibold mb-4">Shopping Cart</h3>
          <div id="cart-items">No items in cart</div>
          <div id="cart-total" className="font-semibold mt-4">Total: $0.00</div>
        </div>
        
        {/* Instructions */}
        <div className="bg-muted p-6 rounded-lg mt-8">
          <h3 className="text-xl font-semibold mb-4">How to Test Custom Tools:</h3>
          <p className="mb-4">When the AI widget loads, try asking it things like:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>"Add the laptop to my cart"</li>
            <li>"What products are available?"</li>
            <li>"Show me what's in my cart"</li>
            <li>"Clear my cart"</li>
            <li>"Highlight the gaming mouse"</li>
            <li>"What's the most expensive product?"</li>
          </ul>
          <p className="mt-4 font-semibold text-primary">
            The AI agent will automatically call the appropriate custom tools based on your requests!
          </p>
        </div>
      </div>
      
      {/* Notification */}
      <div id="notification" className="notification"></div>
    </div>
  );
};

export default CustomToolsExample;