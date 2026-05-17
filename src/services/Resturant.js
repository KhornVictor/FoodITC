const Path = "/public/data/resturants.json";

export const fetchResturants = async () => {
  return fetch(Path)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load resturants: ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data)) {
        return [];
      }
      console.log(data);
      return data;
    })
    .catch((error) => {
      console.error(`Error fetching resturants: ${error.message}`);
      return [];
    });
};

export const countResturants = async () => {
  const resturants = await fetchResturants();
  return resturants.length;
}

export const AverageRating = async () => {
  const resturants = await fetchResturants();
  if (resturants.length === 0) return "N/A";
  const totalRating = resturants.reduce((sum, r) => sum + (r.rating || 0), 0);
  return (totalRating / resturants.length).toFixed(1);
};

export const timeEstimate = async () => {
  const resturants = await fetchResturants();
  if (resturants.length === 0) return "N/A";
  const totalTime = resturants.reduce((sum, r) => sum + (r.timeEstimate || 0), 0);
  return Math.round(totalTime / resturants.length);
};