// manualUpdate.js

//run with    node manualUpdate.js
const fetch = require('node-fetch');

async function updateWeeklyData() {
  console.log('Starting update process...');
  try {
    console.log('Sending request to update weekly data...');
    const response = await fetch(
      'http://localhost:3000/api/updateWeeklyData',
      {
        method: 'POST',
      }
    );
    console.log('Response received');
    const data = await response.json();
    console.log('Update complete:', data.message);
  } catch (error) {
    console.error('Error updating weekly data:', error);
  }
}

console.log('Script started');
updateWeeklyData().then(() => console.log('Script finished'));
