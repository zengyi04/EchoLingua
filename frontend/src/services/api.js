const API_URL = 'http://localhost:3000/api'; // Replace with actual backend URL

export const fetchVocabulary = async () => {
  try {
    const response = await fetch(`${API_URL}/vocabulary`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    // Return mock data if API fails
    return []; 
  }
};

export const fetchStories = async () => {
  try {
    const response = await fetch(`${API_URL}/stories`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
};

export const submitQuizScore = async (score) => {
  try {
    await fetch(`${API_URL}/scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ score }),
    });
  } catch (error) {
    console.error('Error submitting score:', error);
  }
};