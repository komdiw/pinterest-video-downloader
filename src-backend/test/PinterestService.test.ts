// Simple test for PinterestService

import { PinterestService } from '../services/PinterestService';

// Mock console to avoid output in tests
const originalLog = console.log;
console.log = () => {};

async function testPinterestService() {
  try {
    console.log = originalLog; // Restore console for test output
    console.log('🧪 Testing PinterestService...');

    const service = new PinterestService();

    // Test 1: URL validation
    console.log('Test 1: URL validation');
    try {
      await service.extractVideoInfo('invalid-url');
      console.log('❌ Should have thrown validation error');
    } catch (error) {
      console.log('✅ URL validation works');
    }

    // Test 2: Invalid Pinterest URL
    console.log('Test 2: Invalid Pinterest URL');
    try {
      await service.extractVideoInfo('https://www.google.com');
      console.log('❌ Should have thrown invalid domain error');
    } catch (error) {
      console.log('✅ Domain validation works');
    }

    // Test 3: Valid Pinterest URL structure (but no network)
    console.log('Test 3: Valid URL structure test');
    const testUrl = 'https://pinterest.com/pin/1234567890';
    try {
      // This will fail because of network, but should pass URL validation
      await service.extractVideoInfo(testUrl);
    } catch (error: any) {
      if (error.message.includes('Failed to extract video information')) {
        console.log('✅ URL parsing works (network error expected)');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('✅ PinterestService tests completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log = originalLog; // Restore console
  }
}

// Run tests
testPinterestService().catch(console.error);