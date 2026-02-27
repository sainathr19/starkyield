/**
 * API Service Layer
 * Handles communication with the OneSat API backend
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://fk80wwc88ko88k8c80gg480k.staging.btcfi.wtf";

export interface ApiResponse<T> {
  status: "Ok" | "Error";
  result: T | null;
  error: string | null;
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<T> = await response.json();

    if (data.status === "Error") {
      throw new Error(data.error || "API request failed");
    }

    return data.result as T;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

export default {
  fetch: apiFetch,
};
