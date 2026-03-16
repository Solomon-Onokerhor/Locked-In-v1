async function testEmail() {
  try {
    const response = await fetch('http://localhost:3000/api/send-test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'mleslieyt@gmail.com',
        name: 'Student'
      })
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
    if (!response.ok) process.exit(1);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testEmail();
