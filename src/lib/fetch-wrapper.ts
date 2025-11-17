/**
 * Fetch wrapper che gestisce automaticamente:
 * - Session expiration (401 → redirect login)
 * - Errori di rete
 * - Parsing JSON con error handling
 */

type FetchWrapperOptions = RequestInit & {
  showErrorToast?: boolean;
};

export class FetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

/**
 * Wrapper per fetch che gestisce errori comuni
 */
export async function fetchWrapper<T = any>(
  url: string,
  options: FetchWrapperOptions = {}
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Session scaduta → redirect login
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
      }
      throw new FetchError('Sessione scaduta', 401, response);
    }

    // Forbidden → redirect unauthorized
    if (response.status === 403) {
      if (typeof window !== 'undefined') {
        window.location.href = `/unauthorized?from=${encodeURIComponent(window.location.pathname)}`;
      }
      throw new FetchError('Non autorizzato', 403, response);
    }

    // Altri errori HTTP
    if (!response.ok) {
      let errorMessage = `Errore ${response.status}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Se non è JSON, usa lo status text
        errorMessage = response.statusText || errorMessage;
      }

      throw new FetchError(errorMessage, response.status, response);
    }

    // No content response
    if (response.status === 204) {
      return null as T;
    }

    // Parse JSON
    try {
      return await response.json();
    } catch (e) {
      throw new FetchError('Errore nel parsing della risposta', 500);
    }
  } catch (error) {
    // Network error o altro
    if (error instanceof FetchError) {
      throw error;
    }

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new FetchError('Errore di rete: controlla la connessione', 0);
    }

    throw new FetchError('Errore imprevisto', 500);
  }
}

/**
 * Helper per GET request
 */
export async function fetchGet<T = any>(url: string, options?: FetchWrapperOptions): Promise<T> {
  return fetchWrapper<T>(url, { ...options, method: 'GET' });
}

/**
 * Helper per POST request
 */
export async function fetchPost<T = any>(
  url: string,
  data?: any,
  options?: FetchWrapperOptions
): Promise<T> {
  return fetchWrapper<T>(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Helper per PATCH request
 */
export async function fetchPatch<T = any>(
  url: string,
  data?: any,
  options?: FetchWrapperOptions
): Promise<T> {
  return fetchWrapper<T>(url, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Helper per DELETE request
 */
export async function fetchDelete<T = any>(
  url: string,
  options?: FetchWrapperOptions
): Promise<T> {
  return fetchWrapper<T>(url, { ...options, method: 'DELETE' });
}
