const axios = require('axios');
const dns = require('dns');

const testDNS = (hostname) => {
    return new Promise((resolve) => {
        console.log(`Looking up DNS for: ${hostname}`);
        dns.lookup(hostname, (err, address) => {
            if (err) {
                console.error(`DNS Error for ${hostname}:`, err.code);
                resolve(false);
            } else {
                console.log(`Resolved ${hostname} to ${address}`);
                resolve(true);
            }
        });
    });
};

const runTest = async () => {
    console.log("--- Connectivity Test ---");

    // 1. Check DNS
    await testDNS('router.huggingface.co');
    await testDNS('api-inference.huggingface.co');
    await testDNS('google.com'); // Baseline

    // 2. HTTP Probe
    console.log("\n--- HTTP Probe ---");
    try {
        const res = await axios.get('https://api-inference.huggingface.co/status');
        console.log("api-inference status:", res.status);
    } catch (e) {
        console.error("api-inference probe failed:", e.message);
    }
};

runTest();
