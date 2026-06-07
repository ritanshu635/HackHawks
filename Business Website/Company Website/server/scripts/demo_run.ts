import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

async function runLifecycle() {
  console.log('🚀 Starting 2027 Cycle Lifecycle Demonstration...');

  try {
    // 0. LOGIN AS FARMER & GENERATE CREDITS
    console.log('\n👨‍🌾 Step 0: Generating Supply (Farmer Rajesh Kumar - 2027)...');
    const farmerLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'farmer@demo.com',
      password: 'password123',
      role: 'farmer'
    });
    const farmerToken = farmerLogin.data.token;
    const farmerId = farmerLogin.data.user.id;

    console.log('🌾 Logging December 2027 (Strict Rate: 1600 CC)...');
    await axios.post(`${API_URL}/farmers/${farmerId}/log-month`, {
      month: 12,
      year: 2027,
      crop: 'wheat'
    }, { headers: { Authorization: `Bearer ${farmerToken}` } });
    console.log('✅ Supply Generated.');

    // 1. LOGIN AS COMPANY
    console.log('\n🏢 Step 1: Logging in as Company (Tata Steel Ltd)...');
    const compLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'company@demo.com',
      password: 'password123',
      role: 'company'
    });
    const compToken = compLogin.data.token;
    const compId = compLogin.data.user.id;

    // 2. REQUEST CC
    console.log('\n🧬 Step 2: Requesting 1000 Carbon Credits for 2027...');
    await axios.post(`${API_URL}/companies/${compId}/request-cc`, {
      amount: 1000
    }, { headers: { Authorization: `Bearer ${compToken}` } });
    console.log('✅ Request Logged.');

    // 3. LOGIN AS GOVERNMENT
    console.log('\n🏛️ Step 3: Logging in as Government Official...');
    const govLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@government.in',
      password: 'password123',
      role: 'government'
    });
    const govToken = govLogin.data.token;

    // 4. ALLOCATE CC
    console.log('\n⚖️ Step 4: Allocating Credits from Vault...');
    await axios.post(`${API_URL}/government/allocate-cc`, {
      companyId: compId,
      ccAmount: 1000,
      years: 1
    }, { headers: { Authorization: `Bearer ${govToken}` } });
    console.log('✅ Allocation Success.');

    // 5. PAY FOR CC
    console.log('\n💸 Step 5: Finalizing Payment of ₹20 Lakhs...');
    await axios.post(`${API_URL}/companies/${compId}/pay`, {
      amount: 1000 * 2000,
      ccAmount: 1000
    }, { headers: { Authorization: `Bearer ${compToken}` } });
    console.log('✅ Payment Set. Transaction Recorded.');

    console.log('\n🏁 2027 Cycle Demonstration SUCCESSFUL!');

  } catch (err) {
    console.error('❌ Demonstration Error:', err.response?.data || err.message);
  }
}

runLifecycle();
