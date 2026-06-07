
import axios from 'axios';

async function testLoginFallback() {
  const baseURL = 'http://localhost:3001/api/auth';

  console.log('--- Testing Login Fallback ---');

  try {
    // 1. Try to login with Farmer credentials but select 'company' role
    // Credentials from setup.ts: rajesh@farmer.com / password123
    console.log('Logging in as Company with Farmer credentials...');
    const res = await axios.post(`${baseURL}/login`, {
      email: 'rajesh@farmer.com',
      password: 'password123',
      role: 'company'
    });

    console.log('Response Role:', res.data.user.role);
    if (res.data.user.role === 'farmer') {
      console.log('✅ Fallback successful: Farmer found and logged in correctly.');
    } else {
      console.log('❌ Fallback failed: Role mismatch.');
    }
  } catch (error: any) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
}

testLoginFallback();
