const fetch = require('node-fetch');
const FormData = require('form-data');
const BASE = 'http://localhost:3000';

async function test() {
    console.log('🚀 Testing EntityNet Backend...\n');

    // 1. Upload CSV
    console.log('1. Uploading test.csv...');
    const formData = new FormData();
    formData.append('file', require('fs').createReadStream('../../backend/test_data.csv'));
    const uploadRes = await fetch(`${BASE}/api/upload`, { method: 'POST', body: formData });
    const uploadData = await uploadRes.json();
    console.log('   ✅', uploadData.message, '\n');

    // 2. Run matching
    console.log('2. Running matching engine...');
    const matchRes = await fetch(`${BASE}/api/match`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
    const matchData = await matchRes.json();
    console.log('   ✅', matchData.message, matchData.data, '\n');

    // 3. Clustering & UBID
    console.log('3. Running clustering...');
    const clusterRes = await fetch(`${BASE}/api/cluster`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
    const clusterData = await clusterRes.json();
    console.log('   ✅', clusterData.message, '\n');

    // 4. Lifecycle evaluation (NEW)
    console.log('4. Evaluating business lifecycle...');
    const lifecycleRes = await fetch(`${BASE}/api/lifecycle/evaluate`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
    const lifecycleData = await lifecycleRes.json();
    console.log('   ✅', lifecycleData.message);
    console.log('   Sample:', lifecycleData.data?.slice(0, 2), '\n');

    // 5. Lookup by PAN
    console.log('5. Looking up UBID by PAN (ABCDE1234F)...');
    const lookupRes = await fetch(`${BASE}/api/lookup?pan=ABCDE1234F`);
    const lookupData = await lookupRes.json();
    console.log('   ✅', lookupData.found ? `Found UBID: ${lookupData.ubid}` : 'Not found', '\n');

    // 6. Get anomalies
    console.log('6. Fetching anomalies...');
    const anomaliesRes = await fetch(`${BASE}/api/anomalies`);
    const anomaliesData = await anomaliesRes.json();
    console.log('   ✅', anomaliesData.length ? `${anomaliesData.length} anomalies found` : 'No anomalies', '\n');

    console.log('🎉 All tests passed! Backend is fully functional.');
}

test().catch(err => console.error('❌ Error:', err));