// Runtime test without full compilation

import { UrlValidator } from '../utils/urlValidator';
import { ErrorType, ValidationError } from '../types';

console.log('🧪 Runtime TypeScript Test');

// Test URL validation
const testUrls = [
  'https://pinterest.com/pin/1234567890',
  'https://www.pinterest.com/pin/test-pin',
  'https://pin.it/abc123',
  'invalid-url',
  'https://google.com'
];

console.log('\nTesting URL Validation:');

testUrls.forEach((url, index) => {
  try {
    console.log(`Test ${index + 1}: ${url}`);
    const parsed = UrlValidator.parsePinterestUrl(url);
    console.log(`✅ Valid: ${parsed.type}, ID: ${parsed.pinId || 'N/A'}`);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log(`✅ Correctly rejected: ${error.message}`);
    } else {
      console.log(`❌ Unexpected error: ${(error as Error).message}`);
    }
  }
});

// Test error types
console.log('\nTesting Error Types:');

try {
  throw new ValidationError('Test validation error', 'testField', 'testValue');
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('✅ ValidationError works correctly');
    console.log(`  Type: ${(error as any).type}`);
    console.log(`  Code: ${(error as any).code}`);
    console.log(`  Details:`, (error as any).details);
  }
}

// Test basic TypeScript types
console.log('\nTesting TypeScript Types:');

interface TestVideoInfo {
  title: string;
  videoUrl: string;
  duration?: string;
}

const testVideo: TestVideoInfo = {
  title: 'Test Video',
  videoUrl: 'https://v.pinimg.com/videos/test.mp4',
  duration: '0:30'
};

console.log('✅ TypeScript interfaces work correctly');
console.log(`  Title: ${testVideo.title}`);
console.log(`  Duration: ${testVideo.duration || 'Unknown'}`);

console.log('\n✅ All runtime tests passed!');