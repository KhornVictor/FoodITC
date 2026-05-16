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