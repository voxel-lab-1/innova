const BASE_URL = "https://zerofit.app";

async function runSystemTest() {
  console.log("Testing live server endpoints at:", BASE_URL);
  
  try {
    // 1. Test GET /api/patients
    console.log("\n1. Testing GET /api/patients...");
    const resPatients = await fetch(`${BASE_URL}/api/patients`);
    console.log("GET /api/patients status:", resPatients.status);
    const dataPatients = await resPatients.text();
    console.log("GET /api/patients output:", dataPatients.substring(0, 300));

    // 2. Test POST /api/patients
    console.log("\n2. Testing POST /api/patients...");
    const resCreate = await fetch(`${BASE_URL}/api/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Prueba Sistema Live",
        birthdate: "2000-05-15",
        gender: "male",
        email: "test.system@zerofit.app",
        phone: "3001234567",
        sport: "Fitness"
      })
    });
    console.log("POST /api/patients status:", resCreate.status);
    const dataCreate = await resCreate.text();
    console.log("POST /api/patients output:", dataCreate);

  } catch (err) {
    console.error("❌ E2E System Test Failed:", err);
  }
}

runSystemTest();
