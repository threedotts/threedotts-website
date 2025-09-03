// Test script to manually trigger check-low-credits function
import { supabase } from './src/integrations/supabase/client.js';

async function testCheckCredits() {
  try {
    console.log('Calling check-low-credits function...');
    
    const { data, error } = await supabase.functions.invoke('check-low-credits', {
      body: {}
    });
    
    if (error) {
      console.error('Error calling function:', error);
    } else {
      console.log('Function response:', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

testCheckCredits();