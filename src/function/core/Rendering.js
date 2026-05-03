import { initFoodPage } from "../pages/food.js";

/**
 * Recursively loads and mounts components with data-component attributes.
 * Handles nested components and relative path resolution.
 * @param {string} filepath - Path to the component file to load
 * @param {HTMLElement} container - DOM element to inject component into
 * @param {string} baseUrl - Base URL for resolving relative paths (defaults to current location)
 * @returns {Promise<void>}
 */

export const rendering = async (
  filepath,
  container,
  baseUrl = window.location.href,
) => {
  try {
    const componentUrl = new URL(filepath, baseUrl);
    const response = await fetch(componentUrl.href);

    if (!response.ok) {
      throw new Error(
        `Failed to load ${componentUrl.href}: ${response.statusText}`,
      );
    }

    const html = await response.text();
    container.innerHTML = html;

    const nestedComponents = container.querySelectorAll("[data-component]");

    await Promise.all(
      Array.from(nestedComponents).map(async (el) => {
        const nestedPath = el.getAttribute("data-component");
        if (nestedPath && el !== container) {
          await rendering(nestedPath, el, componentUrl.href);
        }
      }),
    );
  } catch (error) {
    container.innerHTML =
      '<p class="component-error">Component failed to load.</p>';
    console.error(`Rendering error: ${error.message}`);
  }
};
