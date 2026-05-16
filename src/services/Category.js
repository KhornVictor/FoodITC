const Path = "/public/data/catgories.json";

export const fetchCategories = async () => {
  return fetch(Path)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data)) {
        return [];
      }
      return data;
    })
    .catch((error) => {
      console.error(`Error fetching categories: ${error.message}`);
      return [];
    });
};
